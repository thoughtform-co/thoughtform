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
- [ADR-031: Rail Manifest](../sentinel/decisions/031-rail-manifest.md)
- [ADR-033: Arc Cases Orbit + funnel](../sentinel/decisions/033-arc-cases-orbit.md) (orbit superseded; funnel live)
- [ADR-034: Arc Cases Terrace](../sentinel/decisions/034-arc-cases-terrace.md) (superseded by ADR-035)
- [ADR-035: Arc Cases Terminal](../sentinel/decisions/035-arc-cases-terminal.md) (reveal surface superseded by ADR-036)
- [ADR-036: Arc Cases Card](../sentinel/decisions/036-arc-cases-card.md) (the live cases reveal; §3/§5 superseded by ADR-041)
- [ADR-041: Arc Cases Sigil + phased reveal](../sentinel/decisions/041-arc-cases-sigil.md) (the live trigger + ordering)
- Skill: `.claude/skills/landing-v7-compositing/SKILL.md`
- Skill: `.claude/skills/brandmark-choreography/SKILL.md`

**LandingPage must stay render-stable.** It owns the
`dangerouslySetInnerHTML` prototype body, and `ServicesPortal` /
`ServicesRailRegisterPortal` mount nested `createRoot`s into placeholder
nodes inside that markup. A LandingPage re-render that re-applies the
innerHTML orphans those nested roots (cards silently vanish, no error).
Do NOT add `useAuth` or other post-mount-updating subscriptions to
LandingPage — push them into leaf components (see `CelestialEditorGate`).
Ref: BEST-PRACTICES "Nested-root portals".

**The funnel is the ADR-033 order:** hero → corridor (thesis + the Arc)
→ services → about (bio) → continuum (philosophy) → practice → contact.
`#tools` and `#build` retired — the four production cases live ONLY on
the Arc's Build-park cases reveal (click-armed via the SIGIL welded to
the sphere's front pole; the node streams fold onto an in-canvas 3D tools
card's slab edges and the card then materializes into the frame they made,
NO camera move — see ADR-036 + ADR-041). The order is owned by the parse arrays in
`app/(marketing)/page.tsx` (`CORRIDOR_REPLACED_STATIONS` /
`CORRIDOR_RELOCATED_STATIONS`) — never by prototype-HTML edits — in
lockstep with `MANIFEST_ENTRIES` and the drift-guard tests
(`tests/lib/rail-manifest.test.ts`, `tests/lib/v7-parse.test.ts`).
`PROJECT_CASES` (`tools-cards/toolCardData.ts`) is the single canonical
case module; `tools-cards/` otherwise survives only as the
`/test/project-cards` lab's shared core (console skin, chrome, stack
hook) — do not remount it on the landing.

**Arc Cases is an in-canvas 3D card — no camera channel (ADR-036, supersedes ADR-035).** The cases reveal is `ArcCasesCard`, ONE in-canvas portrait tools card mounted in the gyro assembly (a sibling of `ShellStack`) between the two Build-park stack columns, in front of the sphere; the accessible stepper row `ArcCasesStepper` (◂ 01 02 03 04 ▸ + CLOSE, region id `arc-cases-terminal`) is mounted in `HomeCorridor`. On arm the sources/surfaces DOM labels fade out on `arcCasesLevelRef` (single writer = the card's R3F `useFrame` at priority −5; readers = `gateStackLabel` label fade + the caption-card fade + the stepper's own rAF + `ShellStack`, which folds the source/surface node streams onto the card's actual left/right slab side walls so the screen reads as mounted on the nodes). The ref carries the card's slab edges (`cardEdges`, shell-local — the single source of truth for that mount geometry, direct math, NO viewport unprojection / `panelRect`). The corridor camera is a pure Z dolly through arm/disarm. Gate parity: the JS `ARC_CASES_MEDIA` gate == the CSS hide of BOTH the sigil and the stepper. No scroll writer, no scroll lock, no backdrop; inert is reconciled every frame; DOM order = focus order. Do NOT re-introduce a camera channel, the DOM overlay panel, or the `panelRect` unprojection latch.

**The reveal is PHASED and the trigger is a SIGIL (ADR-041, supersedes ADR-036 §3/§5).** ONE damped arm level, TWO ordered phases: the node fold runs on `arcFoldInput(level)` (complete at `ARC_FOLD_DONE` 0.62 — feed `arcLatchEnvelope` the BARE clamped ratio; it supplies the easing, pre-easing double-eases) and the CARD reads `arcCardPresence(level)` (`smootherstep(0.62, 1)`), published as `cardPresence` on `arcCasesLevelRef` by the same single writer. So the beat is **labels fade → nodes fold and latch → card materializes into the frame they made**; close plays it backwards. The card's material opacities / visibility / scale-in / depth-write AND the stepper's opacity+inert all read `cardPresence`, never the raw `level` — the strict invariant (`arcCardPresence === 0` while `arcFoldInput < 1`) is unit-pinned. The "VIEW THE CASES" chip is DELETED: the trigger is `ArcCasesSigil`, a world-anchored DOM marker at the sphere's FRONT POLE (`SIGIL_Z` 0.98, where the two edge-on gimbal rings cross — anchor `intelligence.sigil`, painted by `gateSigil`), which also owns the auto-disarm watcher. Its pulse is a CSS keyframe (no JS clock). It arms only once the notes have SETTLED (`sigilSettle`, `ARC_SIGIL_SETTLE` [0.70, 0.84] on the smoothed stack — **measured against the live corridor; re-measure before retuning**). While armed it fades to ~0 and drops `pointer-events` (no phantom clicks over the card face) but stays **focusable, NOT inert**, so Escape can refocus the trigger — do not re-derive its inert gate from the host opacity (that folds in the card-fade and breaks the refocus). Do NOT retune `ARC_BAND_IN` to "fix" its stale stack comment — the park (0.9225) sits below the accretion peak (0.95), so raising it would gate the card off entirely; sequencing is enforced on the trigger instead. In Playwright, `locator.click()` on the sigil can never pass actionability (re-projected every frame + gyro idle drift ⇒ "element is not stable") — use `page.mouse.click` at its projected centre.

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

**The rolodex is the three brand pillars (ADR-031 Update 6; roster
ADR-033).** The rail renders ONLY **Arc / Services / About** —
`RAIL_ROWS = MANIFEST_ENTRIES.filter(glyph === "stack")` — not the full
journey; do NOT re-expand it to every row (that's a deliberate reversal
now). `MANIFEST_ENTRIES` stays the full 8-entry journey and still drives
`resolveActiveIdx` + click targets — only what the rail DISPLAYS is
curated. Each pillar's state (`upcoming`/`active`/`seated`) is a pure
function of its journey index vs the resolved active index; the reel
slides to the active/last-reached pillar; dimming is state-based (all
three stay readable). The retired "Products"/`#tools` pillar is gone
with its station (ADR-033) — do not re-add a tools entry.
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
styled like `.tools-rail-register`, header `THE ARC · 03`), and
Services shows `SOURCE BUS · 04` via `ServicesRailRegister` (the
services half of the retired ToolsRailRegister — ADR-033; it mounts
into the legacy-named `[data-tools-rail-root]` slot, CSS in
`services.css`). About carries no register yet (follow-up candidate).
Do NOT move the Arc register back to a top-centre breadcrumb; pure read
of `paintProgress`, no new scroll writer. **Both registers share one
grid (Update 8):** they hang off mid-rail via
`calc(50% ± n·var(--rail-register-pitch))` (NOT the old
33.3/41.7/50/58.3%vh gauge), centred on the same midline the rolodex
centres its active pillar on (`--rail-row-pitch` / `--rail-register-pitch`
in `variables.css`). Keep the Arc and Services registers on the SAME
token — tighten/space them together, never one alone. **Active
signature = underline** (Update 8): the active row is marked by a gold
`text-decoration` underline (both registers), NOT a filled diamond — the
diamond markers stay passive outline ticks. This is the right-rail
counterpart to the left rolodex's full-frame fill; keep the pair (left
fill / right underline) distinct.

**Process**

- Before non-trivial changes: [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) (Cycle B if adding a section; Cycle A after fixes).
- After any non-trivial fix: same file, Cycle A checklist.
