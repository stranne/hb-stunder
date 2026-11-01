import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Fails the build if the site would ship without its policy or with development-only content.
const outDir = process.env.BUILD_DIR ?? "dist";
const files = (await readdir(outDir, { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => path.join(entry.parentPath, entry.name));
const fileNames = files.map((file) => path.relative(outDir, file).replaceAll("\\", "/"));

for (const name of ["mockServiceWorker.js", ".nojekyll"]) {
  assert.ok(!fileNames.includes(name), `${name} must not ship`);
}
assert.deepEqual(
  fileNames.filter((name) => name.endsWith(".map")),
  [],
  "source maps must not ship",
);

const fonts = fileNames.filter((name) => name.endsWith(".woff2"));
assert.ok(fonts.length > 0, "fonts must ship");
assert.deepEqual(
  fonts.filter((name) => !/-latin(-ext)?-wght-/.test(name)),
  [],
  "only the Latin font subsets may ship",
);

const scripts = files.filter((file) => file.endsWith(".js"));
for (const script of scripts) {
  const content = await readFile(script, "utf8");
  for (const developmentText of ["Mock Customer", "hb-stunder.mock-session", "__storybook-api"]) {
    assert.ok(!content.includes(developmentText), `${script} contains "${developmentText}"`);
  }
}

const html = await readFile(path.join(outDir, "index.html"), "utf8");
const policy = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
assert.ok(policy, "index.html must contain a Content-Security-Policy");
assert.ok(
  html.indexOf("Content-Security-Policy") < html.indexOf("<script"),
  "the policy must come before the first script",
);

const directives = new Map(
  policy.split("; ").map((directive) => {
    const [name, ...sources] = directive.split(" ");
    return [name, sources];
  }),
);
const scriptSources = directives.get("script-src") ?? [];
assert.deepEqual(directives.get("default-src"), ["'none'"]);
assert.deepEqual(directives.get("worker-src"), ["'none'"]);
assert.deepEqual(directives.get("base-uri"), ["'none'"]);
assert.deepEqual(directives.get("form-action"), ["'none'"]);
assert.ok(!scriptSources.some((source) => source.includes("unsafe")), "scripts must stay strict");
assert.equal(directives.get("connect-src")?.length, 1, "only the API may be contacted");

for (const [, inlineScript] of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
  const hash = createHash("sha256").update(inlineScript).digest("base64");
  assert.ok(scriptSources.includes(`'sha256-${hash}'`), "every inline script must be allowed");
}

console.log(`${outDir}: ${fileNames.length} files passed the production output check`);
