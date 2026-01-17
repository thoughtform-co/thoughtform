import type { Meta, StoryObj } from "@storybook/nextjs";
import { Toggle } from "./toggle";

/**
 * On/off toggle switch with HUD styling.
 * Features a rectangular track and square thumb with gold accent when active.
 *
 * ## Usage
 * ```tsx
 * import { Toggle } from "@/registry/thoughtform/ui";
 *
 * <Toggle label="Enable notifications" checked={enabled} onChange={setEnabled} />
 * ```
 */
const meta: Meta<typeof Toggle> = {
  title: "Thoughtform/UI/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label displayed next to the toggle",
      table: {
        type: { summary: "string" },
      },
    },
    checked: {
      control: "boolean",
      description: "Whether the toggle is on",
      table: {
        type: { summary: "boolean" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Disable the toggle",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    onChange: {
      action: "changed",
      description: "Callback when toggle state changes",
      table: {
        type: { summary: "(checked: boolean) => void" },
      },
    },
  },
  args: {
    label: "Option",
    checked: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

/**
 * Default toggle in off state.
 */
export const Default: Story = {
  args: {
    label: "Enable feature",
    checked: false,
  },
};

/**
 * Toggle in on state with gold accent.
 */
export const Checked: Story = {
  args: {
    label: "Feature enabled",
    checked: true,
  },
};

/**
 * Disabled toggle (off state).
 */
export const Disabled: Story = {
  args: {
    label: "Locked setting",
    checked: false,
    disabled: true,
  },
};

/**
 * Disabled toggle (on state).
 */
export const DisabledChecked: Story = {
  args: {
    label: "Always on",
    checked: true,
    disabled: true,
  },
};

/**
 * Toggle without label.
 */
export const WithoutLabel: Story = {
  args: {
    checked: false,
  },
};
