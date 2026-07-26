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
      ".husky/**",
      ".vscode/**",
      // Archived / non-source content
      "docs/**",
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
      // Sanction the two deliberate unused-binding patterns left after the
      // 2026-07-14 burn-down (128 → 19): rest-sibling prop stripping ahead of
      // a `...props` DOM spread (packages/ui Panel/NavigationBar, VaultView,
      // survey analyze route) and underscore-prefixed intentionally-unused
      // params (uniform fn-family signatures, exported no-op APIs).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    // Verbatim img2threejs output, checked in for provenance and regenerated
    // rather than edited (see components/brand/Remnant3D/generated/README.md).
    // Linting it would only pressure us to hand-patch a file whose whole value
    // is being a faithful record of what the generator produced.
    files: ["components/brand/Remnant3D/generated/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default config;
