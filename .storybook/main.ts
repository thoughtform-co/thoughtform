import type { StorybookConfig } from "@storybook/nextjs";

import { dirname } from "path";

import { fileURLToPath } from "url";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  stories: [
    // Registry component stories (Phase 2.2)
    "../registry/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../registry/**/*.mdx",
    // Default stories folder
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../stories/**/*.mdx",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-onboarding"),
  ],
  framework: getAbsolutePath("@storybook/nextjs"),
  staticDirs: ["../public"],
  // TypeScript configuration
  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
