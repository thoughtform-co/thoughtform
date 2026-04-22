"use client";

// ═══════════════════════════════════════════════════════════════
// REGISTRY COMPONENT MAP
// Maps registry keys to React components and their default args
// This is the bridge between Foundry canvas items and shadcn-style
// registry components.
//
// Phase 2.1: Component Workbench + Vault insertion
// ═══════════════════════════════════════════════════════════════

import { type ComponentType, type ReactNode } from "react";

// Registry component imports
import { Button, Slider, Toggle, Label, Select, GlitchText } from "@/registry/thoughtform/ui";

import { CardFrame } from "@/registry/thoughtform/cards";

import { HUDFrame, NavigationBar } from "@/registry/thoughtform/hud";

// ═══════════════════════════════════════════════════════════════
// REGISTRY COMPONENT DEFINITION
// ═══════════════════════════════════════════════════════════════

export interface RegistryComponentDef<P = Record<string, unknown>> {
  /** Display name for the component */
  name: string;
  /** React component */
  component: ComponentType<P>;
  /** Default args (Storybook-compatible) */
  defaultArgs: P;
  /** Category for organization */
  category: string;
  /** Description */
  description?: string;
  /** Storybook story ID (for schema lookup) */
  storyId?: string;
  /** Whether this component is ready for production use */
  stable?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// REGISTRY MAP
// Maps registry keys to component definitions
// Keys should match the component file names (kebab-case)
// ═══════════════════════════════════════════════════════════════

// Type helper for component casting (allows dynamic props for registry rendering)
type AnyComponent = ComponentType<Record<string, unknown>>;

export const REGISTRY_MAP: Record<string, RegistryComponentDef> = {
  // ─────────────────────────────────────────────────────────────
  // UI PRIMITIVES
  // ─────────────────────────────────────────────────────────────
  button: {
    name: "Button",
    component: Button as unknown as AnyComponent,
    defaultArgs: {
      children: "Button",
      variant: "ghost",
      size: "md",
    },
    category: "ui",
    description: "Interactive button with corner brackets",
    storyId: "thoughtform-ui-button",
    stable: true,
  },

  slider: {
    name: "Slider",
    component: Slider as unknown as AnyComponent,
    defaultArgs: {
      label: "Value",
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: () => {},
    },
    category: "ui",
    description: "Range slider with diamond handle",
    storyId: "thoughtform-ui-slider",
    stable: true,
  },

  toggle: {
    name: "Toggle",
    component: Toggle as unknown as AnyComponent,
    defaultArgs: {
      label: "Option",
      checked: false,
      onChange: () => {},
    },
    category: "ui",
    description: "On/off toggle switch",
    storyId: "thoughtform-ui-toggle",
    stable: true,
  },

  label: {
    name: "Label",
    component: Label as unknown as AnyComponent,
    defaultArgs: {
      children: "Label",
    },
    category: "ui",
    description: "Form label with mono typography",
    storyId: "thoughtform-ui-label",
    stable: true,
  },

  select: {
    name: "Select",
    component: Select as unknown as AnyComponent,
    defaultArgs: {
      label: "Select option",
      options: [
        { value: "option-1", label: "Option 1" },
        { value: "option-2", label: "Option 2" },
        { value: "option-3", label: "Option 3" },
      ],
      value: "option-1",
      onChange: () => {},
    },
    category: "ui",
    description: "Select dropdown with HUD styling",
    storyId: "thoughtform-ui-select",
    stable: true,
  },

  "glitch-text": {
    name: "Glitch Text",
    component: GlitchText as unknown as AnyComponent,
    defaultArgs: {
      initialText: "THOUGHT",
      finalText: "THOUGHTFORM",
      progress: 0.35,
    },
    category: "ui",
    description: "Text with glitch effect",
    storyId: "thoughtform-ui-glitch-text",
    stable: true,
  },

  // ─────────────────────────────────────────────────────────────
  // CARDS
  // ─────────────────────────────────────────────────────────────
  "card-frame": {
    name: "Card Frame",
    component: CardFrame as unknown as AnyComponent,
    defaultArgs: {
      tier: "content",
      title: "Card Title",
      index: "01",
      label: "Label",
      accent: "none",
      accentColor: "gold",
      children: "Card content goes here.",
    },
    category: "cards",
    description: "Content card with index, label, and title",
    storyId: "thoughtform-cards-card-frame",
    stable: true,
  },

  // ─────────────────────────────────────────────────────────────
  // HUD COMPONENTS
  // ─────────────────────────────────────────────────────────────
  "hud-frame": {
    name: "HUD Frame",
    component: HUDFrame as unknown as AnyComponent,
    defaultArgs: {
      showCorners: true,
      showRails: true,
      cornerSize: 40,
      cornerColor: "#caa554",
    },
    category: "hud",
    description: "Full viewport HUD with corners and rails",
    storyId: "thoughtform-hud-hud-frame",
    stable: true,
  },

  "navigation-bar": {
    name: "Navigation Bar",
    component: NavigationBar as unknown as AnyComponent,
    defaultArgs: {
      variant: "static",
      links: [
        { href: "#", label: "Interface", active: true },
        { href: "#", label: "Manifesto" },
        { href: "#", label: "Services" },
        { href: "#", label: "About" },
      ],
    },
    category: "hud",
    description: "Top navigation with logo and nav links",
    storyId: "thoughtform-hud-navigation-bar",
    stable: true,
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get a registry component definition by key
 */
export function getRegistryComponent(key: string): RegistryComponentDef | undefined {
  return REGISTRY_MAP[key];
}

/**
 * Check if a component key exists in the registry
 */
export function isRegistryComponent(key: string): boolean {
  return key in REGISTRY_MAP;
}

/**
 * Get all registry component keys
 */
export function getRegistryKeys(): string[] {
  return Object.keys(REGISTRY_MAP);
}

/**
 * Get registry components by category
 */
export function getRegistryComponentsByCategory(category: string): RegistryComponentDef[] {
  return Object.values(REGISTRY_MAP).filter((def) => def.category === category);
}

/**
 * Get all registry categories
 */
export function getRegistryCategories(): string[] {
  const categories = new Set<string>();
  Object.values(REGISTRY_MAP).forEach((def) => categories.add(def.category));
  return Array.from(categories);
}

/**
 * Render a registry component with the given args
 * Returns null if the component is not found
 */
export function renderRegistryComponent(
  key: string,
  args: Record<string, unknown> = {},
  children?: ReactNode
): ReactNode | null {
  const def = getRegistryComponent(key);
  if (!def) return null;

  const Component = def.component;
  const mergedArgs = { ...def.defaultArgs, ...args };

  // Handle children prop
  if (children !== undefined) {
    mergedArgs.children = children;
  }

  return <Component {...mergedArgs} />;
}

// ═══════════════════════════════════════════════════════════════
// CATALOG → REGISTRY MAPPING
// Maps legacy catalog IDs to registry keys for migration
// ═══════════════════════════════════════════════════════════════

export const CATALOG_TO_REGISTRY_MAP: Record<string, string> = {
  // UI Primitives
  button: "button",
  slider: "slider",
  toggle: "toggle",
  // Cards
  "card-landscape": "card-frame",
  "card-data": "card-frame",
  // HUD
  navbar: "navigation-bar",
  "navigation-bar": "navigation-bar",
  "hud-frame": "hud-frame",
  "hud-frame-complete": "hud-frame",
};

/**
 * Get the registry key for a legacy catalog component ID
 * Returns undefined if no mapping exists
 */
export function getRegistryKeyForCatalog(catalogId: string): string | undefined {
  return CATALOG_TO_REGISTRY_MAP[catalogId];
}
