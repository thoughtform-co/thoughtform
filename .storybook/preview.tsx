import type { Preview } from "@storybook/nextjs";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Dark background to match Thoughtform aesthetic
    backgrounds: {
      default: "void",
      values: [
        { name: "void", value: "#0a0908" },
        { name: "surface-0", value: "#0D0B07" },
        { name: "surface-1", value: "#141210" },
        { name: "surface-2", value: "#1A1814" },
        { name: "dawn", value: "#ebe3d6" },
      ],
    },
    // Default layout
    layout: "centered",
    // Docs configuration
    docs: {
      toc: true,
    },
  },
  // Global decorators
  decorators: [
    (Story) => (
      <div
        style={{
          fontFamily:
            "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <Story />
      </div>
    ),
  ],
  // Global args (default values for all stories)
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "dark",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: ["dark", "light"],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
