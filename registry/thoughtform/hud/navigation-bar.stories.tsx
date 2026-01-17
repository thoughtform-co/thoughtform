import type { Meta, StoryObj } from "@storybook/nextjs";
import { NavigationBar } from "./navigation-bar";
import { Button } from "../ui/button";

/**
 * Top navigation bar with wordmark and links.
 * Thoughtform branded with gold accents and mono typography.
 *
 * ## Usage
 * ```tsx
 * import { NavigationBar } from "@/registry/thoughtform/hud";
 *
 * <NavigationBar
 *   links={[
 *     { href: "/", label: "Home", active: true },
 *     { href: "/about", label: "About" },
 *   ]}
 *   variant="fixed"
 * />
 * ```
 */
const meta: Meta<typeof NavigationBar> = {
  title: "Thoughtform/HUD/NavigationBar",
  component: NavigationBar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    links: {
      control: "object",
      description: "Navigation links array",
      table: {
        type: { summary: "NavLink[]" },
      },
    },
    logo: {
      control: false,
      description: "Custom logo element (ReactNode)",
      table: {
        type: { summary: "ReactNode" },
      },
    },
    actions: {
      control: false,
      description: "Action buttons/elements (ReactNode)",
      table: {
        type: { summary: "ReactNode" },
      },
    },
    variant: {
      control: "select",
      options: ["fixed", "sticky", "static"],
      description: "Position behavior",
      table: {
        type: { summary: '"fixed" | "sticky" | "static"' },
        defaultValue: { summary: "fixed" },
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
    links: [
      { href: "#", label: "Interface", active: true },
      { href: "#", label: "Manifesto" },
      { href: "#", label: "Services" },
      { href: "#", label: "About" },
      { href: "#", label: "Contact" },
    ],
    variant: "static",
  },
};

export default meta;
type Story = StoryObj<typeof NavigationBar>;

/**
 * Default navigation bar with links.
 */
export const Default: Story = {
  args: {
    links: [
      { href: "#", label: "Interface", active: true },
      { href: "#", label: "Manifesto" },
      { href: "#", label: "Services" },
      { href: "#", label: "About" },
    ],
  },
};

/**
 * Navigation bar with action buttons.
 */
export const WithActions: Story = {
  args: {
    links: [
      { href: "#", label: "Features" },
      { href: "#", label: "Pricing", active: true },
      { href: "#", label: "Docs" },
    ],
    actions: (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button variant="ghost" size="sm">
          Sign In
        </Button>
        <Button variant="solid" size="sm">
          Get Started
        </Button>
      </div>
    ),
  },
};

/**
 * Navigation bar without links (logo only).
 */
export const LogoOnly: Story = {
  args: {
    links: [],
    actions: (
      <Button variant="outline" size="sm">
        Contact
      </Button>
    ),
  },
};

/**
 * Navigation bar with custom logo.
 */
export const CustomLogo: Story = {
  args: {
    links: [
      { href: "#", label: "Home", active: true },
      { href: "#", label: "Products" },
    ],
    logo: (
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          letterSpacing: "0.2em",
          color: "var(--gold)",
        }}
      >
        CUSTOM
      </span>
    ),
  },
};

/**
 * Fixed position (default behavior).
 */
export const Fixed: Story = {
  args: {
    variant: "fixed",
    links: [
      { href: "#", label: "Interface", active: true },
      { href: "#", label: "About" },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Fixed to the top of the viewport. Best for main site navigation.",
      },
    },
  },
};

/**
 * Sticky position.
 */
export const Sticky: Story = {
  args: {
    variant: "sticky",
    links: [
      { href: "#", label: "Section 1", active: true },
      { href: "#", label: "Section 2" },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Sticks to top when scrolled. Useful for section-level navigation.",
      },
    },
  },
};

/**
 * Static position (no fixed/sticky behavior).
 */
export const Static: Story = {
  args: {
    variant: "static",
    links: [
      { href: "#", label: "Page 1", active: true },
      { href: "#", label: "Page 2" },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Normal document flow. Useful for embedded navigation.",
      },
    },
  },
};
