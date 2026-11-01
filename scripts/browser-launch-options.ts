/**
 * CI uses the runner's Chrome, because Chromium downloads come from a general-purpose storage host
 * that its egress firewall should not allow. Chrome's own background requests to Google would flood
 * the firewall's report, and browser tests only need the local server, so nothing else resolves.
 */
export const browserLaunchOptions = process.env.CI
  ? {
      channel: "chrome",
      args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1"],
    }
  : {};
