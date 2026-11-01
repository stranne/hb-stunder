import { createHash } from "node:crypto";
import type { Plugin } from "vite";
import { REAL_API_BASE_URL } from "../src/api/config.ts";

const CHARSET_META = '<meta charset="UTF-8" />';
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

function inlineScriptHashes(html: string) {
  return [...html.matchAll(INLINE_SCRIPT)].map(
    ([, script = ""]) => `'sha256-${createHash("sha256").update(script).digest("base64")}'`,
  );
}

function apiSource(apiBaseUrl: string) {
  return URL.canParse(apiBaseUrl) ? new URL(apiBaseUrl).origin : "'self'";
}

/** Adds the policy to the production page, because GitHub Pages cannot send it as a header. */
export function contentSecurityPolicy(): Plugin {
  let apiBaseUrl = REAL_API_BASE_URL;

  return {
    name: "hb-stunder:content-security-policy",
    apply: "build",
    configResolved(config) {
      apiBaseUrl = config.env.VITE_API_BASE_URL || REAL_API_BASE_URL;
    },
    transformIndexHtml: {
      order: "post",
      handler(html, { path }) {
        // Storybook builds its own page with this configuration and needs inline scripts.
        if (path !== "/index.html") return html;
        if (!html.includes(CHARSET_META)) {
          throw new Error(`index.html must contain ${CHARSET_META} for the policy to follow it`);
        }

        const policy = [
          "default-src 'none'",
          `script-src 'self' ${inlineScriptHashes(html).join(" ")}`,
          // React Aria injects style elements, and one of them appears only in iOS modals.
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self'",
          "font-src 'self'",
          `connect-src ${apiSource(apiBaseUrl)}`,
          "manifest-src 'self'",
          "worker-src 'none'",
          "base-uri 'none'",
          "form-action 'none'",
        ].join("; ");

        return html.replace(
          CHARSET_META,
          () =>
            `${CHARSET_META}\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        );
      },
    },
  };
}
