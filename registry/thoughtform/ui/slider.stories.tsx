import type { Meta, StoryObj } from "@storybook/nextjs";
import { Slider } from "./slider";

/**
 * Range slider with diamond handle and HUD styling.
 * Thoughtform branded with gold accents.
 *
 * ## Usage
 * ```tsx
 * import { Slider } from "@/registry/thoughtform/ui";
 *
 * <Slider label="Volume" value={50} min={0} max={100} onChange={setValue} />
 * ```
 */
const meta: Meta<typeof Slider> = {
  title: "Thoughtform/UI/Slider",
  component: Slider,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label displayed above the slider",
      table: {
        type: { summary: "string" },
      },
    },
    value: {
      control: "number",
      description: "Current value",
      table: {
        type: { summary: "number" },
      },
    },
    min: {
      control: "number",
      description: "Minimum value",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0" },
      },
    },
    max: {
      control: "number",
      description: "Maximum value",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "1" },
      },
    },
    step: {
      control: "number",
      description: "Step increment",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0.01" },
      },
    },
    showValue: {
      control: "boolean",
      description: "Show current value next to label",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Disable the slider",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    onChange: {
      action: "changed",
      description: "Callback when value changes",
      table: {
        type: { summary: "(value: number) => void" },
      },
    },
  },
  args: {
    label: "Value",
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    showValue: true,
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

/**
 * Default slider with label and value display.
 */
export const Default: Story = {
  args: {
    label: "Volume",
    value: 0.5,
  },
};

/**
 * Slider without value display.
 */
export const WithoutValue: Story = {
  args: {
    label: "Brightness",
    value: 0.75,
    showValue: false,
  },
};

/**
 * Slider with custom range (0-100).
 */
export const CustomRange: Story = {
  args: {
    label: "Temperature",
    value: 22,
    min: 16,
    max: 30,
    step: 0.5,
    valueFormat: (v) => `${v}°C`,
  },
};

/**
 * Disabled slider.
 */
export const Disabled: Story = {
  args: {
    label: "Locked",
    value: 0.3,
    disabled: true,
  },
};

/**
 * Slider at minimum value.
 */
export const AtMinimum: Story = {
  args: {
    label: "Minimum",
    value: 0,
  },
};

/**
 * Slider at maximum value.
 */
export const AtMaximum: Story = {
  args: {
    label: "Maximum",
    value: 1,
  },
};
