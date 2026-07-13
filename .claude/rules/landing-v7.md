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
- [ADR-032: Arc reveal consoles](../sentinel/decisions/032-corridor-reveal-consoles.md)
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
Keep the shared `resolveActiveIdx.ts` + `clickToNavigate.ts`. The
rolodex is **dormant until the Arc** (`activeIdx < ARC_IDX` — hidden
through hero AND thesis; Update 7).

**The rolodex is a terminal list, not an icon menu (ADR-031 Update 8).**
The per-row folded-card glyph is RETIRED — rows are bare name buttons;
the active pillar is marked by a CSS **terminal selection bar**
(`.rail-manifest__name` inverse-video: gold fill, void ink, gold bloom).
No per-row marker or caret sits beside the titles — the fill IS the mark
(Update 8: the caret tick was tried then removed). Do NOT reinstate a
per-row glyph, marker, or caret.
`MANIFEST_ENTRIES[].glyph` stays as the pillar tag but does not render.
Rolodex type is **13px** — deliberately LARGER than the 11px right-rail
register (the two rails are a pair, not twins); do not shrink it to
match the register.

**Rail uniformity — each pillar: name on the left, sub-items on the
right (ADR-031 Updates 7–8).** During the Arc the right rail carries
Navigate/Encode/Build via `CorridorProgressRail` (a right-rail register
styled like `.tools-rail-register`, header `THE ARC · 03`), just as
Services shows `SOURCE BUS` and Products shows `TOOL UNITS`. Do NOT move
it back to a top-centre breadcrumb; pure read of `paintProgress`, no new
scroll writer. **Both registers share one grid (Update 8):** they hang
off mid-rail via `calc(50% ± n·var(--rail-register-pitch))` (NOT the old
33.3/41.7/50/58.3%vh gauge), centred on the same midline the rolodex
centres its active pillar on (`--rail-row-pitch` / `--rail-register-pitch`
in `variables.css`). Keep the Arc and Services/Products registers on the
SAME token — tighten/space them together, never one alone. **Active
signature = underline** (Update 8): the active row is marked by a gold
`text-decoration` underline (both registers), NOT a filled diamond — the
diamond markers stay passive outline ticks. This is the right-rail
counterpart to the left rolodex's full-frame fill; keep the pair (left
fill / right underline) distinct.

**Arc reveal consoles are a read-only overlay (ADR-032).** The per-stage
reveal chips + drawer (`CorridorRevealLayer`) READ `paintProgress` only —
never add a scroll writer or a scroll lock here. The stage fade bands live
in `lib/home-v2/corridorReveals.ts` as the SINGLE SOURCE OF TRUTH shared
with `CorridorStationHeaders` (do not re-inline them). One chip slot + one
shared drawer, no backdrop (the sphere keeps primacy). Encode content stays
genericized (no client specifics). The `#tools` link is behind
`BUILD_PANEL_TOOLS_LINK`.

**Process**

- Before non-trivial changes: [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) (Cycle B if adding a section; Cycle A after fixes).
- After any non-trivial fix: same file, Cycle A checklist.
