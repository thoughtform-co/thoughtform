---
paths:
  - "components/landing/v7/**"
  - "app/(marketing)/**"
  - "public/prototypes/v7/landing-v7-motion.html"
description: Landing v7 compositing, layers, and brandmark journey
---

# Rule: Landing v7

When editing files under `components/landing/v7/**` or `app/(marketing)/**`, you are in a **layered composite** (fixed gateway, sticky hero, opaque stations) — not a flat page.

**Read first**

- [ADR-008: Landing v7 background layers](../sentinel/decisions/008-landing-v7-background-layers.md)
- [ADR-010: Brandmark choreography](../sentinel/decisions/010-brandmark-choreography.md)
- [ADR-030: Tools viewscreen + edge bus](../sentinel/decisions/030-tools-section-cover-stack.md)
- [ADR-031: Rail Manifest](../sentinel/decisions/031-rail-manifest.md)
- Skill: `.claude/skills/landing-v7-compositing/SKILL.md`
- Skill: `.claude/skills/brandmark-choreography/SKILL.md`

**LandingPage must stay render-stable.** It owns the
`dangerouslySetInnerHTML` prototype body, and `ServicesPortal` /
`BuildCasesPortal` mount nested `createRoot`s into placeholder nodes
inside that markup. A LandingPage re-render that re-applies the
innerHTML orphans those nested roots (cards silently vanish, no error).
Do NOT add `useAuth` or other post-mount-updating subscriptions to
LandingPage — push them into leaf components (see `CelestialEditorGate`).
Ref: BEST-PRACTICES "Nested-root portals".

**Tools geometry is one CSS-owned contract.** The fixed header, sticky
deck, and right-rail register share the exact 1101×760 + motion-allowed
capability. Do not reintroduce a JS pixel table, floating service pills,
or a stack-local progress rail. Preserve the `--tools-bg-in` shield and
opaque-before-ambient-retirement ordering from ADR-030.

**The left-rail manifest is parse-injected (ADR-031).** Its skeleton is
built at parse time (`lib/v7-parse/railManifest.ts`) into the authored
`<nav data-rail-manifest-root>` shell; `RailManifestController` mutates
it in place. Never `createRoot` into `[data-rail-manifest-root]` (it
clobbers the server skeleton); keep the shell markup in the prototype
HTML byte-exact (the parse regex + `tests/lib/rail-manifest.test.ts`
pin it); journey order lives in `lib/rail-manifest/entries.ts` under a
drift-guard test. The reel detent (Update 3 rolodex) is a 350ms
transform transition gated behind `data-ready`, and its position is a
pure function of `activeIdx` — never scroll-scrubbed, no new scroll
writers; the glyph confirm stays quantized `steps()`; still no FLIP
flights (retired, ADR-030 Updates 1–3). The 13-tick ladder always
stays (ADR-031 Update 2).

**The rolodex is the three brand pillars (ADR-031 Update 6).** The rail
renders ONLY Arc / Services / Products — `RAIL_ROWS =
MANIFEST_ENTRIES.filter(glyph === "stack")` — not the full journey; do
NOT re-expand it to all ten rows (that's a deliberate reversal now).
`MANIFEST_ENTRIES` stays the full ten-entry journey and still drives
`resolveActiveIdx` + click targets — only what the rail DISPLAYS is
curated. Each pillar's state (`upcoming`/`active`/`seated`) is a pure
function of its journey index vs the resolved active index; the reel
slides to the active/last-reached pillar; dimming is state-based (all
three stay readable). `#tools` shows as **"Products"** in the rolodex
(`tools.name`), but its id/`targetId`/`data-station` stay `tools`.
A separate loadout bay was tried and retired (Update 5) — do NOT
reintroduce `RailLoadout`/`data-rail-loadout-root` or a charge gauge.
Keep the shared `resolveActiveIdx.ts` + `clickToNavigate.ts`; rolodex
type is 11px to match the right-rail register (don't shrink it below
the right).

**Process**

- Before non-trivial changes: [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) (Cycle B if adding a section; Cycle A after fixes).
- After any non-trivial fix: same file, Cycle A checklist.
