# Appendix: Sigil (`05_sigil.thoughtform`)

Creative / generation platform: dashboard, journeys, generation UI, workshops. Uses Thoughtform grammar with **product-specific** affordances (e.g. bottom-left Omkadering / framing icon on some HUD surfaces when specified).

## Source of truth

- **Figma:** Brand Codex Brand System page (`1767:3744`), variable collection `Thoughtform/HUD`.
- **Tokens:** `app/globals.css` (`--space-*`, `--dawn-*`, `--gold`, motion vars).
- **HUD grid constants:** `components/hud/grid-constants.ts` (mirrors Astrolabe `rail-contract.ts`).
- **Operational + stack rules:** repo root `AGENTS.md` (auth, Prisma, API patterns — not duplicated here).

## UI guardrails (this repo)

For **implementation defaults** (CardFrame, route cards, `lib/types`, API auth contracts, when to diverge for workshops/3D), load the repo-local skill:

- `.cursor/skills/sigil-component-guardrails/SKILL.md` (+ `reference.md`, `examples.md`).

Global **visual** doctrine remains in this skill (`references/navigation-grammar.md`, `references/components.md`, etc.).

## Thumbnails / legacy ticks

`SIGIL_TICK_COUNT = 24` (25 equal ticks) may still appear for thumbnails or backwards compatibility; **new HUD-aligned work** should follow `HUD_TICK_MARKS` / `rail-contract` semantics where shared with Astrolabe, or Sigil’s documented constants in code.
