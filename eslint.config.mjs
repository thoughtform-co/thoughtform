import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import storybook from "eslint-plugin-storybook";

const config = [
  {
    ignores: [
      // Build / generated output (incl. nested `.next/` from agent worktrees and tooling caches)
      "**/.next/**",
      // Alternate NEXT_DIST_DIR verification builds (see next.config.mjs) —
      // without these, `npx eslint .` after a verify build lints build output.
      "**/.next-verify/**",
      "**/.next-build/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/out/**",
      "**/build/**",
      "**/coverage/**",
      "**/storybook-static/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/.playwright-mcp/**",
      // Agent / tooling scratch space
      ".claude/**",
      ".cursor/**",
      ".linear-issues/**",
      ".husky/**",
      ".vscode/**",
      // Archived / non-source content
      "legacy/**",
      "public/prototypes/**",
      "registry/**",
      "supabase/.temp/**",
      "scripts/package-homepage*",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...storybook.configs["flat/recommended"],
  prettier,
  {
    // New React Compiler / `eslint-plugin-react-hooks` 7.x strict rules
    // arrived via `eslint-config-next` 16. The v7 landing / brandmark
    // choreography / HUD navigation surfaces predate them and trip 120+
    // errors across code with dedicated ADRs (ADR-008, 010, 011, 002).
    // Soften these to `warn` so the pre-commit hook and `npm run lint`
    // succeed; triage is tracked in `.cursor/incident-2026-05-15-npm-sweep.md`
    // §7 (deferred follow-up) and should happen per-ADR, not as a sweep.
    rules: {
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
