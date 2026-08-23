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
- [ADR-041: Arc Cases Sigil + phased reveal](../sentinel/decisions/041-arc-cases-sigil.md) (the phased reveal + ordering; its §2 sphere-sigil trigger is superseded by ADR-042)
- [ADR-042: Arc Cases cue under the Build title](../sentinel/decisions/042-arc-cases-cue.md) (the live trigger — a DOM dotted-leader + label, off the sphere)
- [ADR-048: Editorial band](../sentinel/decisions/048-editorial-band.md) (the shared horizontal frame for section text — `--band-max`/`--band-margin`/`--rail-inset`; never re-widen the inset per-section)
- [ADR-054: Proof station + client cases](../sentinel/decisions/054-proof-station-client-cases.md) (`#proof` — the Loop Earplugs case — REPLACES #continuum in the funnel; plain opaque DOM, content generated from `lib/cases/` at parse time, and the ambient-kill cover after #about). **Supersedes [ADR-049](../sentinel/decisions/049-continuum-rail-stage.md)** on production: the crail stage, its clocks and its band math are deleted; only the `uBand*` shader block survives, dormant at 0 gain. Rules: [`.claude/rules/proof.md`](proof.md)
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

**The funnel is the ADR-033 order, as amended by ADR-054, ADR-056 and ADR-074:** hero →
corridor (thesis + the Arc) → services (opening with the casefile) → about (bio) → **voidwalker (the through-line, the opaque cover — [`.claude/rules/voidwalker.md`](voidwalker.md))** → practice (an empty breather) → contact. The paragraph that follows is ADR-054's wording and names **proof (the
client case)** → practice → contact.
`#tools` and `#build` retired — the four production cases live ONLY on
the Arc's Build-park cases reveal (click-armed via the CUE — a dotted-leader

- label docked under the Build title, ADR-042; the node streams fold onto an
  in-canvas 3D tools card's slab edges and the card then materializes into the
  frame they made, NO camera move — see ADR-036 + ADR-041 + ADR-042). The order is owned by the parse arrays in
  `app/(marketing)/page.tsx` (`CORRIDOR_REPLACED_STATIONS` /
  `CORRIDOR_RELOCATED_STATIONS`) — never by prototype-HTML edits — in
  lockstep with `MANIFEST_ENTRIES` and the drift-guard tests
  (`tests/lib/rail-manifest.test.ts`, `tests/lib/v7-parse.test.ts`).
  `PROJECT_CASES` (`tools-cards/toolCardData.ts`) is the single canonical
  case module; `tools-cards/` otherwise survives only as the
  `/test/project-cards` lab's shared core (console skin, chrome, stack
  hook) — do not remount it on the landing.

**Arc Cases is an in-canvas 3D card — no camera channel (ADR-036, supersedes ADR-035).** The cases reveal is `ArcCasesCard`, ONE in-canvas portrait tools card mounted in the gyro assembly (a sibling of `ShellStack`) between the two Build-park stack columns, in front of the sphere; the accessible stepper row `ArcCasesStepper` (◂ 01 02 03 04 ▸ + CLOSE, region id `arc-cases-terminal`) is mounted in `HomeCorridor`. On arm the sources/surfaces DOM labels fade out on `arcCasesLevelRef` (single writer = the card's R3F `useFrame` at priority −5; readers = `gateStackLabel` label fade + the caption-card fade + the stepper's own rAF + `ShellStack`, which folds the source/surface node streams onto the card's actual left/right slab side walls so the screen reads as mounted on the nodes). The ref carries the card's slab edges (`cardEdges`, shell-local — the single source of truth for that mount geometry, direct math, NO viewport unprojection / `panelRect`). The corridor camera is a pure Z dolly through arm/disarm. Gate parity: the JS `ARC_CASES_MEDIA` gate == the CSS hide of BOTH the cue and the stepper. No scroll writer, no scroll lock, no backdrop; inert is reconciled every frame; DOM order = focus order. Do NOT re-introduce a camera channel, the DOM overlay panel, or the `panelRect` unprojection latch.

**The reveal is PHASED (ADR-041, supersedes ADR-036 §3/§5); the trigger is a CUE under the Build title (ADR-042, supersedes ADR-041 §2).** ONE damped arm level, TWO ordered phases: the node fold runs on `arcFoldInput(level)` (complete at `ARC_FOLD_DONE` 0.62 — feed `arcLatchEnvelope` the BARE clamped ratio; it supplies the easing, pre-easing double-eases) and the CARD reads `arcCardPresence(level)` (`smootherstep(0.62, 1)`), published as `cardPresence` on `arcCasesLevelRef` by the same single writer. So the beat is **labels fade → nodes fold and latch → card materializes into the frame they made**; close plays it backwards. The card's material opacities / visibility / scale-in / depth-write AND the stepper's opacity+inert all read `cardPresence`, never the raw `level` — the strict invariant (`arcCardPresence === 0` while `arcFoldInput < 1`) is unit-pinned. The sphere sigil is DELETED (ADR-042): the trigger is `ArcCasesCue`, a DOM dotted-leader + label docked UNDER the Build station title (mounted as the Build `StationBlock`'s `afterContent` in `CorridorStationHeaders`; it inherits the Build header's per-frame opacity, so it writes no scroll-coupled opacity of its own). Its world anchor (`intelligence.sigil`), `gateSigil`, and `SIGIL_Z` are gone. It keeps the ADR-041 contracts verbatim: `aria-controls="arc-cases-terminal"` + `aria-expanded`, every-frame `inert` reconciliation, stable callback ref, and the auto-disarm watcher. It arms only once the notes have SETTLED (`sigilSettle`, `ARC_SIGIL_SETTLE` [0.70, 0.84] on the smoothed stack — **measured against the live corridor; re-measure before retuning**); below the gate it is `inert` and CSS fades it out (`.is-armable`, toggled by its rAF). Because it sits at the TOP of the viewport, clear of the centred card, it **stays visible AND interactive while armed** (a second click / Escape closes it; Escape refocus falls out for free — it was never inert) — no phantom-click guard, no fade-to-0/pointer-events drop. The stepper ✕ CLOSE stays. Do NOT retune `ARC_BAND_IN` to "fix" its stale stack comment — the park (0.9225) sits below the accretion peak (0.95), so raising it would gate the card off entirely; sequencing is enforced on the trigger instead. In Playwright the cue rides the Build header's gyro parallax, so `locator.click()` can still flake ("element is not stable") — click at its box centre via `page.mouse.click`.

**#about is the pinned deck-flip stage (ADR-047; the ADR-046 cartridge
dock is REMOVED).** Across the services exit clock the four WebGL cards
STACK into a deck (azimuth sweep — never a Cartesian lerp; math in
`lib/services-ring/aboutDeckMath.ts`, exact identity at exit 0); the
pinned TRANSPARENT `#about` stage (250svh runway, `AboutStagePortal` →
`[data-about-root]`) then FLIPS the deck π on X to the shared portrait
back face (back planes carry `rotation.x = π` — Rx(π)∘Rx(π) = identity,
upright/unmirrored; the bake's chamfer chrome is MIRRORED to match the
flipped slab) and the deck lands on `.about-stage__slot`
(`aboutSlotRef`, viewport-first per frame). Beat 1 translates the cluster
right (the DOM owns the motion; the deck follows the rect) while the copy
reveals via scrubbed `--ci-off` stagger (never `useRevealMotion` — portal
nodes are unobserved and `.is-in` is one-shot); the EXIT beat then slides
the copy column LEFT + the cluster (deck welded to its slot) RIGHT
off-screen on `--about-exit` over the live corridor bed (ADR-047 Update 8
— NO fade-to-void-shield; `#continuum`'s `--continuum-bg-in` tail is the
lockstep cover, and the mark re-inks DURING the slide via
`continuumFormT`). Two clamped clocks
(`exitProgressForRunway` + `aboutStageProgressRef`), single writer
`useAboutStageScroll`; the corridor ambient SURVIVES through #about AND
#continuum (both transparent stages) and dies at `#voidwalker` (ADR-074; was `#practice`, ADR-049
retargeted kill, one station past ADR-047; gate keyed to the SAME rect as
the fade envelope — the ADR-030 seam-cut bug). Fail-opaque shield
(`--about-bg-in`, default 1 — written 0 for the whole engaged life now,
restored only via the disengage var-clear) + fail-static attribute
(`data-about-mode` absent ⇒ static `.voidwalker` + ADR-045 emerge —
mobile/PRM/fallback/flag-off). Flag: `ABOUT_DECK_STAGE`. Paint-stack rows
4c–4e in ADR-008. Every disengage path must clear `data-about-mode`
(including the media-flip null-render — the hook disengages when its
stage ref goes null).

**The left-rail manifest is parse-injected (ADR-031).** Its skeleton is
built at parse time (`lib/v7-parse/railManifest.ts`) into the authored
`<nav data-rail-manifest-root>` shell; `RailManifestController` mutates
it in place. Never `createRoot` into `[data-rail-manifest-root]` (it
clobbers the server skeleton); keep the shell markup in the prototype
HTML byte-exact (the parse regex + `tests/lib/rail-manifest.test.ts`
pin it); journey order lives in `lib/rail-manifest/entries.ts` under a
drift-guard test. The marker detent (Update 9 diamond) is a 350ms `top`
glide gated behind `data-ready`, and its position is a pure function of
`activeIdx` into a layout-computed detent table — never scroll-scrubbed,
no new scroll writers (recompute the table on resize/layout only). The
13-tick ladder always stays (ADR-031 Update 2).

**⚠ THE JOURNEY INDICATOR IS THE NAV-CORNER READOUT (ADR-055,
2026-07-28, owner) — the left/right section menus are DELETED.**
`CorridorSectionMenu`, its CSS and `lib/home-v2/terminalReveal.ts` are
gone (they only existed above `1101×760`, so laptops and phones had no
indicator at all). `HudNav` now carries a section readout that is ALSO
the drawer trigger, on every viewport. Contracts:

- **Source:** `useActiveSection` → `resolveActiveIdx` (the shared
  resolver) → `sectionReadout` (`lib/rail-manifest/sectionLabel.ts`).
  No new scroll writer — a MutationObserver on the `<html>` bus plus one
  passive listener gated on `idx <= LAST_CORRIDOR_IDX` for the seam rule.
- **The Arc is ONE row.** All four corridor phases map to `THE ARC`;
  there are NO subsections anywhere. That collapse is what makes the
  hero→corridor seam flicker-free (three indices, one string, and
  `queueScramble` no-ops on equal text). Unit-pinned in
  `tests/lib/section-label.test.ts`.
- **`.hud__nav__sector__name` is rendered CHILDLESS and written only
  imperatively.** Give it a React child and the decode stops firing
  silently (React commits the label first, so `from === to`).
- **`captionScramble` only.** Never `scrambleText`-style capture-restore
  on this node (ADR-031 U21).
- **`.bars` stay** as the trigger below 641px pre-collapse and on
  `/claude-workshop` (whose station order is not the manifest's).
- **`HudNav` state stays LOCAL** (nested-root safety) and it remains the
  only writer of `.hud__brand.is-collapsed` — the ADR-043 wordmark dock.
- The desktop detent diamond stays hidden (ADR-031 U20), now because the
  corner serves every viewport. The 13-tick ladder always stays.
- ⚠ `/arcs` HAD its own reel (`ArcMenu`, same gate, same complaint); it is
  DELETED (ADR-073) and the arcs mount the corner readout instead —
  porting the readout there is an open follow-up, not an oversight.

**⚠ The hero curtain CLIP-UNCOVERS the frame chrome (ADR-031 Update 16
rev c, 2026-07-19, owner):** the corner brackets + both rails
(tracks/ticks/labels/manifest/diamond) are REVEALED by the hero sliding
over them — a spatial clip, NOT an opacity fade, NOT a z-index pop. Each
frame element clips ONLY its top edge to the hero's bottom edge:
`.hud__rail`/`.hud__corner--tl`/`.hud__corner--br { clip-path: inset(max(0px,
calc((1 − var(--hero-lift))·100dvh − <its own top offset>)) <sides>) }`
(rail top `--hud-rail-y-start`, TL corner `--hud-margin`, BR corner
`margin + corner-zone − lift·100dvh`). The RAIL's side/bottom insets MUST be
negative (`−100px`) — its tick marks + manifest diamond OVERHANG the rail box
~21px, so `0` sides clip them off (the bug the ticks vanished from). `--hero-lift` is the hero's LINEAR
off-screen fraction (`scrollY/vh`) written by the SAME single
`useLandingScroll` writer as `--hero-cover` (no new writer, ADR-002; NOT
the smootherstep `--hero-cover` — the clip edge must track the hero's 1:1
scroll). The inset saturates to 0 once the hero is gone (`lift → 1`), so
NO `data-corridor-entry` gate / past-curtain rule is needed; reduced-motion
just `clip-path: none`. WHY per-element and not a whole-`.hud` clip: the
WORDMARK (`.hud__brand`) must stay VISIBLE on the hero, and a parent clip
clips all descendants — so `.hud` itself is un-clipped and the wordmark
docks into its corner via the EXISTING `.hud__brand.is-collapsed` scale
(HudNav, 50vh). WHY not z-index: `.hud` sits OUTSIDE the `.stations` (z 10)
stacking context, so any z is entirely under or over the sections — a
z-swap always pops (rev a's failure). Top-right nav (`.hud-nav-overlay`,
separate z 60) untouched. Supersedes Update 9's "diamond visible from the
hero" + the rev-0 fade / rev-a z-swap / rev-b whole-`.hud`-clip drafts;
`cornerDraw` retired. "The ladder always stays" now means: in the DOM at
every beat, UNCOVERED everywhere except the hero. Do NOT reintroduce a
fade, a z-swap, or a whole-`.hud` clip (it hides the wordmark). That the
top-right nav is exempt from all of this is why ADR-055 could put the
journey readout there with no curtain choreography at all.

**The left rail is a single detent diamond (ADR-031 Update 9, supersedes
the Update 3/6/7/8 rolodex; Update 12 supersedes it ON DESKTOP).** The
rail DISPLAYS one gold diamond (12px,
`.rail-manifest__diamond`, centred on the 2px rail track) that snaps to a
detent per journey entry — EVERY `MANIFEST_ENTRIES` row plus future
interstitials, at BEAT granularity in the corridor: hero → thesis →
**Navigate → Encode → Build** → services → about → continuum → practice
→ contact (the single "arc" entry is retired; the diamond follows the
corridor's structure, not just section boundaries). Do NOT re-add the
rolodex reel, the 3-pillar roster, per-row buttons, or the terminal
selection bar. Detent positions are scroll-PROPORTIONAL (each entry's
real scroll offset normalized 0..1 via `detentTable.ts` +
`scrollTargetForEntry` in `clickToNavigate.ts`; the corridor beats sit at
their parks — paintProgress × EPILOGUE_START → fractions 0.30/0.48/0.70),
recomputed on mount/resize/`ResizeObserver` only — the position write
(`--rail-diamond-top`) stays a pure function of the active index; do NOT
scroll-scrub it or add a per-frame scroll writer. The active corridor
beat comes from `data-corridor-phase`, which now publishes
`thesis|navigate|encode|build` (single writer: the CorridorStationHeaders
RAF, hand-offs `CORRIDOR_BEAT_ENTER` 0.2/0.48/0.78 — MIRRORS
CorridorProgressRail's STAGES band starts, keep in lockstep). The diamond
is visible from the hero (owner; SUPERSEDED twice — by Update 16, which
made the whole rail hero-dormant so the diamond first showed at section 2,
then by **Update 20 (2026-07-20, owner): the diamond is hidden on the WHOLE
desktop gate, unconditionally** — the U12 hide used to enumerate phases and
left it painting alone in section 2, since the menu drops hero/thesis too.
Desktop = tick ladder only since ADR-055 retired the menu — the diamond
still survives ONLY below `1101×760`, controller untouched. Do NOT re-add a
phase/station enumeration to that media block). On
hover/focus it reveals the active
entry's title via a hidden `.rail-manifest__title` chip, gated on
`data-has-title`; `manifestTitle(entry)` (`entries.ts`) is `null` for
`hideActiveName` (hero) or a blank `name` (interstitials), so those
reveal nothing. `RAIL_ROWS`/`glyph` are REMOVED. A separate loadout bay
was tried and retired (Update 5) — do NOT reintroduce
`RailLoadout`/`data-rail-loadout-root`.

**⚠ The Arc register is RETIRED (Update 12), and so is the menu that
replaced it (ADR-055):** the Arc's Navigate/Encode/Build live on NO rail
and in NO menu — the corner readout names the Arc as one section and
there are no subsections anywhere. `CorridorProgressRail` stays unmounted
(kept on disk for rollback). The "sub-items on the right" half of the
uniformity contract below is history; the paragraph stays for context +
the Services/SOURCE-BUS lineage. Do NOT remount `CorridorProgressRail`.

**Rail uniformity — each pillar: name on the left, sub-items on the
right (ADR-031 Updates 7–8; the Arc's right register RETIRED by Update
12).** During the Arc the right rail carries
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
33.3/41.7/50/58.3%vh gauge), centred on the viewport midline
(`--rail-register-pitch` in `variables.css`). Keep the Arc and Services
registers on the SAME token — tighten/space them together, never one
alone. **Active signature = underline** (Update 8): the active row is
marked by a gold `text-decoration` underline (both registers), NOT a
filled diamond — the diamond markers stay passive outline ticks. (The
LEFT rail is now the Update 9 travelling detent diamond, not the terminal
rolodex — the two rails are still a deliberate pair, but the left's mark
is the single gold diamond, the right's is the register underline.)

**Process**

- Before non-trivial changes: [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) (Cycle B if adding a section; Cycle A after fixes).
- After any non-trivial fix: same file, Cycle A checklist.
