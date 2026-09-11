import assert from "node:assert/strict";
import { mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { chromium } from "playwright";
import { preview } from "vite-plus";

// Exercise the actual production chunks with local API fixtures, never live bookings.
const outDir = process.env.BUILD_DIR ?? "dist";
const base = process.env.VITE_BASE_PATH ?? "/";
const evidenceDir = "node_modules/.cache/code-splitting";
const server = await preview({
  configFile: false,
  base,
  build: { outDir },
  preview: { host: "127.0.0.1", port: 0, open: false },
});
const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
const browser = await chromium.launch();

try {
  await mkdir(evidenceDir, { recursive: true });
  const assets = path.join(outDir, "assets");
  for (const file of await readdir(assets)) {
    if (file.endsWith(".js")) {
      assert.ok((await stat(path.join(assets, file))).size <= 500_000, `${file} exceeds 500 kB`);
    }
  }

  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: "en" });
    await context.addInitScript(() => localStorage.setItem("hb-stunder-language", "en"));
    const page = await context.newPage();
    if (width === 390) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 100,
        downloadThroughput: 200_000,
        uploadThroughput: 100_000,
      });
    }
    const errors = [];
    const scripts = new Set();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.resourceType() === "script") scripts.add(new URL(request.url()).pathname);
    });
    const date = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const activity = {
      id: 101,
      name: "Test yoga",
      businessUnit: { id: 1, name: "Hagabadet i Haga" },
      locations: [{ id: 18, name: "Yogastudio" }],
      instructors: [{ id: 21, name: "Test instructor" }],
      groupActivityProduct: { id: 3392, name: "Yoga" },
      duration: { start: `${date}T10:00:00Z`, end: `${date}T11:00:00Z` },
      slots: { totalBookable: 18, leftToBook: 8, hasWaitingList: false },
    };
    let bookings = [];
    let creations = 0;
    let cancellations = 0;
    const token = `test.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test`;
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      const endpoint = url.pathname.split("/api/ver3")[1];
      const method = route.request().method();
      let json;
      if (endpoint === "/auth/login" && method === "POST") {
        json = { accessToken: token, customerId: "900001", displayName: "Test customer" };
      } else if (endpoint === "/customers/900001/bookings/groupactivities") {
        if (method === "POST") {
          creations++;
          bookings = [
            {
              type: "groupActivityBooking",
              groupActivityBooking: { id: 501 },
              groupActivity: { id: 101, name: activity.name },
              duration: activity.duration,
              businessUnit: activity.businessUnit,
            },
          ];
        }
        json = bookings;
      } else if (
        endpoint === "/customers/900001/bookings/groupactivities/501" &&
        method === "DELETE"
      ) {
        cancellations++;
        bookings = [];
        return route.fulfill({ status: 204 });
      } else if (endpoint === "/services/groupactivityinstructors") {
        json = activity.instructors;
      } else if (endpoint === "/products/groupactivities") {
        json = [activity.groupActivityProduct];
      } else if (/^\/businessunits\/\d+\/groupactivities\/101$/.test(endpoint ?? "")) {
        json = activity;
      } else if (/^\/businessunits\/\d+\/groupactivities$/.test(endpoint ?? "")) {
        json = endpoint.includes("/1/") ? [activity] : [];
      } else {
        errors.push(`Unexpected external request: ${method} ${url.origin}${url.pathname}`);
        return route.abort();
      }
      return route.fulfill({ json });
    });

    const scheduleUrl = `${origin}${base}?date=${date}&locations=%5B1%5D`;
    await page.goto(scheduleUrl);
    await page.getByRole("heading", { name: "Test yoga" }).waitFor();
    assert.ok(
      ![...scripts].some((url) => /BookingsRoute-|RoomCalendar-|ScheduleFilterPanel-/.test(url)),
    );
    const initialScripts = [...scripts];
    const initialBytes = await Promise.all(
      initialScripts.map(async (url) => {
        const content = await readFile(path.join(assets, path.basename(url)));
        return { bytes: content.length, gzip: gzipSync(content).length };
      }),
    );
    console.log(
      `${width}px initial JS: ${initialBytes.reduce((n, x) => n + x.bytes, 0)} bytes; ${initialBytes.reduce((n, x) => n + x.gzip, 0)} bytes gzip across ${initialScripts.length} chunks`,
    );

    for (const { link, chunk, ready } of [
      {
        link: "Rooms",
        chunk: "RoomCalendar",
        ready: () => page.getByRole("button", { name: /Test yoga/ }),
      },
      {
        link: "Filters",
        chunk: "ScheduleFilterPanel",
        ready: () => page.getByRole("region", { name: "Filters", exact: true }),
      },
      {
        link: "My bookings",
        chunk: "BookingsRoute",
        ready: () => page.getByRole("heading", { name: "My bookings" }),
      },
    ]) {
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      const pattern = `**/${chunk}-*.js`;
      await page.route(pattern, async (route) => {
        await gate;
        await route.continue();
      });
      await page.getByRole("link", { name: link, exact: true }).click();
      await page.getByRole("status").filter({ hasText: "Loading view" }).waitFor();
      await page.screenshot({
        path: `${evidenceDir}/${width}-${chunk}-loading.png`,
        animations: "disabled",
      });
      release();
      await ready().waitFor();
      await page.unroute(pattern);
      assert.ok([...scripts].some((url) => url.includes(`${chunk}-`)));
      await page.screenshot({
        path: `${evidenceDir}/${width}-${chunk}.png`,
        animations: "disabled",
      });
      await page.reload();
      await ready().waitFor();
    }

    await page.goBack();
    await page.getByRole("region", { name: "Filters", exact: true }).waitFor();
    await page.goForward();
    await page.getByRole("heading", { name: "My bookings" }).waitFor();

    await page.getByRole("link", { name: /Filters/ }).click();
    await page.getByText("Hagabadet Drottningtorget", { exact: true }).click();
    await page.getByRole("link", { name: "Classes", exact: true }).click();
    await page.getByRole("heading", { name: "Test yoga" }).waitFor();
    await page.getByRole("link", { name: /Filters/ }).click();
    assert.ok(
      await page
        .getByRole("checkbox", { name: "Hagabadet Drottningtorget", exact: true })
        .isChecked(),
    );
    await page.getByRole("link", { name: "My bookings", exact: true }).click();

    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("textbox", { name: "Username" }).fill("test-user");
    await page.getByLabel("Password", { exact: true }).fill("local-fixture-only");
    await page.getByRole("dialog").getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByText("You have no current group activity bookings.").waitFor();
    await page.goto(scheduleUrl);
    await page.getByRole("button", { name: "Book", exact: true }).click();
    await page.getByRole("button", { name: "Confirm booking", exact: true }).click();
    await page.getByRole("button", { name: "Cancel booking", exact: true }).waitFor();
    await page.getByRole("link", { name: /My bookings/ }).click();
    await page.getByRole("heading", { name: "My bookings" }).waitFor();
    await page.getByRole("button", { name: "Cancel booking", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel booking", exact: true })
      .click();
    await page.getByText("You have no current group activity bookings.").waitFor();
    assert.equal(creations, 1);
    assert.equal(cancellations, 1);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `${width}px: deferred chunks, loading states, direct reloads, history, sign-in, booking and cancellation passed`,
    );
  }
} finally {
  await browser.close();
  await new Promise((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve())),
  );
}
