/// <reference types="vite/client" />

import type { Preview } from "@storybook/tanstack-react";
// Initialize React Aria before Storybook replaces HTMLElement.prototype.focus with a getter.
await import("react-aria-components");
import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";
import { StoryEnvironment } from "./StoryEnvironment";
import { handlers } from "../src/mocks/handlers";
import "../src/app/theme.css";

const preview: Preview = {
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker();
      await worker.start({ onUnhandledRequest: "error" });
      return worker;
    }),
  ],
  globalTypes: {
    locale: {
      description: "Locale",
      defaultValue: "sv",
      toolbar: {
        icon: "globe",
        items: [
          { value: "sv", title: "Svenska" },
          { value: "en", title: "English" },
        ],
      },
    },
    colorMode: {
      description: "Color mode",
      defaultValue: "light",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
    reducedMotion: {
      description: "Reduced motion",
      defaultValue: "full",
      toolbar: {
        icon: "accessibility",
        items: [
          { value: "full", title: "Full motion" },
          { value: "reduce", title: "Reduced motion" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const colorMode = String(context.globals.colorMode ?? "light");
      window.localStorage.setItem("hb-stunder-color-mode", colorMode);
      document.documentElement.dataset.colorMode = colorMode;

      return (
        <StoryEnvironment
          key={context.id}
          locale={String(context.globals.locale ?? "sv")}
          reducedMotion={context.globals.reducedMotion === "reduce"}
          colorMode={colorMode}
          initiallySignedIn={context.parameters.session?.initiallySignedIn === true}
        >
          <Story />
        </StoryEnvironment>
      );
    },
  ],
  parameters: {
    options: {
      storySort: { order: ["Application", "Features", "Design system"] },
    },
    msw: { handlers },
    a11y: { test: "error" },
    viewport: {
      options: {
        mobile: {
          name: "Mobile",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1440px", height: "900px" },
          type: "desktop",
        },
      },
    },
  },
};

export default preview;
