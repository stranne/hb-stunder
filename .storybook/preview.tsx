/// <reference types="vite/client" />

import type { Preview } from "@storybook/react-vite";
import { mswLoader } from "msw-storybook-addon/csf3";
import { StoryEnvironment } from "./StoryEnvironment";
import "../src/app/theme.css";

const preview: Preview = {
  loaders: [mswLoader()],
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
    (Story, context) => (
      <StoryEnvironment
        locale={String(context.globals.locale ?? "sv")}
        reducedMotion={context.globals.reducedMotion === "reduce"}
      >
        <Story />
      </StoryEnvironment>
    ),
  ],
  parameters: {
    a11y: { test: "todo" },
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "390px", height: "844px" } },
        tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "Desktop", styles: { width: "1440px", height: "900px" } },
      },
    },
  },
};

export default preview;
