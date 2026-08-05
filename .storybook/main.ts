import type { StorybookConfig } from "@storybook/tanstack-react";
import { STORYBOOK_API_BASE_URL } from "../src/api/config.ts";

const config: StorybookConfig = {
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
    return viteConfig;
  },
};

export default config;
