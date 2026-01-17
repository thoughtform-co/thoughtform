import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "./button";

/**
 * Interactive button with corner brackets and HUD styling.
 * Thoughtform branded with gold accents and mono typography.
 *
 * ## Usage
 * ```tsx
 * import { Button } from "@/registry/thoughtform/ui";
 *
 * <Button variant="ghost" size="md">Click me</Button>
 * ```
 */
const meta: Meta<typeof Button> = {
  title: "Thoughtform/UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["ghost", "solid", "outline"],
      description: "Visual style of the button",
      table: {
        type: { summary: '"ghost" | "solid" | "outline"' },
        defaultValue: { summary: "ghost" },
      },
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the button",
      table: {
        type: { summary: '"sm" | "md" | "lg"' },
        defaultValue: { summary: "md" },
      },
    },
    children: {
      control: "text",
      description: "Button label text",
      table: {
        type: { summary: "ReactNode" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Disable the button",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    href: {
      control: "text",
      description: "If provided, renders as an anchor tag",
      table: {
        type: { summary: "string" },
      },
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
      table: {
        type: { summary: "string" },
      },
    },
  },
  args: {
    children: "Button",
    variant: "ghost",
    size: "md",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Default ghost button with transparent background.
 */
export const Default: Story = {
  args: {
    children: "Ghost Button",
    variant: "ghost",
  },
};

/**
 * Solid button for primary actions with gold background.
 */
export const Solid: Story = {
  args: {
    children: "Solid Button",
    variant: "solid",
  },
};

/**
 * Outline button with gold border and text.
 */
export const Outline: Story = {
  args: {
    children: "Outline Button",
    variant: "outline",
  },
};

/**
 * Small button for compact spaces.
 */
export const Small: Story = {
  args: {
    children: "Small",
    size: "sm",
  },
};

/**
 * Large button for prominent actions.
 */
export const Large: Story = {
  args: {
    children: "Large Button",
    size: "lg",
  },
};

/**
 * Disabled button state.
 */
export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
  },
};

/**
 * Button as a link (renders as anchor tag).
 */
export const AsLink: Story = {
  args: {
    children: "Link Button",
    href: "#",
  },
};

/**
 * All variants displayed together for comparison.
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <Button variant="ghost">Ghost</Button>
      <Button variant="solid">Solid</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
};

/**
 * All sizes displayed together for comparison.
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
