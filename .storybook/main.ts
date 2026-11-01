import type { StorybookConfig } from "@storybook/tanstack-react";
import { msw } from "msw/vite";
import { STORYBOOK_API_BASE_URL } from "../src/api/config.ts";

const config: StorybookConfig = {
  core: { disableTelemetry: true },
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "msw-storybook-addon",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/tanstack-react",
    options: {},
  },
  viteFinal(viteConfig) {
    viteConfig.define = {
      ...viteConfig.define,
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(STORYBOOK_API_BASE_URL),
    };
    // The application build leaves the worker out, but a built Storybook needs it.
    viteConfig.plugins = [...(viteConfig.plugins ?? []), msw({ mode: "worker-only" })];
    return viteConfig;
  },
};

export default config;
