import type { Meta, StoryObj } from "@storybook/nextjs";
import { CardFrame } from "./card-frame";

/**
 * Content card with index, label, title, and optional accent.
 * Thoughtform branded with corner brackets and HUD styling.
 *
 * ## Usage
 * ```tsx
 * import { CardFrame } from "@/registry/thoughtform/cards";
 *
 * <CardFrame
 *   tier="content"
 *   index="01"
 *   label="Feature"
 *   title="Card Title"
 *   accent="top"
 *   accentColor="gold"
 * >
 *   Card content goes here.
 * </CardFrame>
 * ```
 */
const meta: Meta<typeof CardFrame> = {
  title: "Thoughtform/Cards/CardFrame",
  component: CardFrame,
  tags: ["autodocs"],
  argTypes: {
    tier: {
      control: "select",
      options: ["content", "terminal", "data"],
      description: "Card tier/style variant",
      table: {
        type: { summary: '"content" | "terminal" | "data"' },
        defaultValue: { summary: "content" },
      },
    },
    index: {
      control: "text",
      description: "Index number displayed at top (e.g., '01')",
      table: {
        type: { summary: "string | number" },
      },
    },
    label: {
      control: "text",
      description: "Label displayed next to index",
      table: {
        type: { summary: "string" },
      },
    },
    title: {
      control: "text",
      description: "Card title",
      table: {
        type: { summary: "string" },
      },
    },
    children: {
      control: "text",
      description: "Card content",
      table: {
        type: { summary: "ReactNode" },
      },
    },
    accent: {
      control: "select",
      options: ["none", "top", "left"],
      description: "Accent bar position",
      table: {
        type: { summary: '"none" | "top" | "left"' },
        defaultValue: { summary: "none" },
      },
    },
    accentColor: {
      control: "select",
      options: ["gold", "dawn", "verde"],
      description: "Accent bar color",
      table: {
        type: { summary: '"gold" | "dawn" | "verde"' },
        defaultValue: { summary: "gold" },
      },
    },
  },
  args: {
    tier: "content",
    index: "01",
    label: "Feature",
    title: "Card Title",
    children: "Card content goes here. This is a description of the feature.",
    accent: "none",
    accentColor: "gold",
  },
};

export default meta;
type Story = StoryObj<typeof CardFrame>;

/**
 * Default content card with index, label, and title.
 */
export const Default: Story = {
  args: {
    index: "01",
    label: "Feature",
    title: "Navigation System",
    children:
      "A sophisticated wayfinding interface that guides users through complex information spaces.",
  },
};

/**
 * Content card with top accent bar.
 */
export const WithTopAccent: Story = {
  args: {
    index: "02",
    label: "Highlight",
    title: "Featured Content",
    children: "Important content highlighted with a top accent bar.",
    accent: "top",
    accentColor: "gold",
  },
};

/**
 * Content card with left accent bar.
 */
export const WithLeftAccent: Story = {
  args: {
    index: "03",
    label: "Status",
    title: "Active Process",
    children: "Process status indicated by the left accent bar.",
    accent: "left",
    accentColor: "verde",
  },
};

/**
 * Terminal card with corner brackets.
 */
export const Terminal: Story = {
  args: {
    tier: "terminal",
    label: "Terminal",
    title: "Command Interface",
    children: "A terminal-style card with corner brackets for system interfaces.",
  },
};

/**
 * Data card for compact metric display.
 */
export const Data: Story = {
  args: {
    tier: "data",
    label: "Metric",
    title: "42",
    children: "Active sessions",
  },
};

/**
 * All tiers displayed together for comparison.
 */
export const AllTiers: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
      <CardFrame tier="content" index="01" label="Content" title="Content Card">
        Standard content layout.
      </CardFrame>
      <CardFrame tier="terminal" label="Terminal" title="Terminal Card">
        Corner bracket style.
      </CardFrame>
      <CardFrame tier="data" label="Data" title="127">
        Data metric card.
      </CardFrame>
    </div>
  ),
};

/**
 * All accent colors displayed together.
 */
export const AccentColors: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
      <CardFrame index="01" title="Gold Accent" accent="top" accentColor="gold">
        Gold accent bar.
      </CardFrame>
      <CardFrame index="02" title="Dawn Accent" accent="top" accentColor="dawn">
        Dawn accent bar.
      </CardFrame>
      <CardFrame index="03" title="Verde Accent" accent="top" accentColor="verde">
        Verde accent bar.
      </CardFrame>
    </div>
  ),
};
