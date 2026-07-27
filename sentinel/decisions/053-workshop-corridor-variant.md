# ADR-053: /claude-workshop as a homepage variant (About second)

**Date:** 2026-07-27
**Status:** Accepted
**Surfaces:** `app/(marketing)/claude-workshop/**`, `public/prototypes/v7/landing-claude-workshop.html`, `lib/v7-parse/index.ts`
**Related:** ADR-018 (depth corridor), ADR-022 (hero curtain), ADR-031 U16 (hero-lift clip reveal), ADR-033 (the funnel), ADR-043 (wordmark), ADR-045 (voidwalker emerge), ADR-047 (about deck-flip — the hazard), ADR-052 (the `/arcs` deck pages this replaces for the workshop)

## Context

`/claude-workshop` existed as a **pre-corridor fork** of the v7 prototype: a looping-video hero, a stale bio, a static `.exec` services grid, a legacy static HUD nav that double-rendered the hamburger next to the React one, and no wordmark at all. Meanwhile `/arcs/claude-workshop` (ADR-052) carried the workshop deck as a static section stack.

The owner's judgment: **for a workshop the narrative should be the homepage's** — the live corridor, the brandmark flying to centre, the Arc beats, the services card ring — with one reordering. **About moves to second**, because a workshop opens by introducing the person running it.

## Decision

`/claude-workshop` becomes a **homepage variant**: the same `LandingPage`, the same lazily-loaded corridor chunk, different parse options and a different station order.

```
hero → about → CORRIDOR (thesis · Navigate/Encode/Build · epilogue signal) → services (card ring) → contact
```

### The recipe

`getClaudeWorkshopContent()` gained a `ParseOptions` passthrough (additive; the no-arg signature is unchanged). The route passes `removeStations` + `corridorMountId`; the mount placeholder is injected where the **first removed station** was — `#definition`, directly after `#about` — so the authored order already yields the target sequence. **No `relocateStationsToMount`** (contrast the homepage, which lifts `#services`/`#about` up to the mount).

Corridor copy comes from `extractV7Text()`, which reads the **production** prototype. That is deliberate: the thesis reads identically on both surfaces. The Navigate/Encode/Build headers, the epilogue signal ("EVERYONE IS RACING TO / BUILD THIS CAPABILITY."), and the news ticker are intrinsic to the corridor mount and arrive with it.

The prototype was surgically brought up to date from production (verbatim transplants): Hero Omega (workshop headline, plain text — the terminal-boot effect wraps text nodes only), the current voidwalker bio, the thin `data-services-root` shell, and the `.hud__brand` wordmark; the `--bl` corner bracket (ADR-043 — the wordmark owns that corner), the legacy `hud__top` nav, and the orphan celestial slot were removed. The removed-station markup stays in the file so it remains a complete snapshot; the parse strips it per request.

### Two invariants

**1. The about-stage portal slot must NEVER exist in this prototype.** With `#about` above `#services`, `aboutStageProgressRef` clamps to **1** once the reader scrolls past it, which puts the ADR-047 deck-flip at its terminal state _on arrival_: cards at 0.15 opacity, orbits gone, mark dimmed, hit anchors retired — the services card ring arrives already decommissioned — plus `about-stage.css` pulls a `-100svh` margin under the hero. Omitting the slot makes `AboutStagePortal` a clean no-op and the static voidwalker owns the section (fail-static). Pinned by `tests/lib/claude-workshop-parse.test.ts`, and carried as an HTML comment at the site of the omission.

**2. Order-dependent homepage behaviour is neutralized in route-scoped CSS, never in shared sheets.** `app/(marketing)/claude-workshop/claude-workshop.css`, scoped under `.cw-root`:

- **Entry hold → native sticky.** `useLandingScroll` sets `html[data-corridor-entry="1"]` whenever the mount's top is below the viewport top, with no upper bound; `home-v2.css` then pins the corridor's sticky cell `position: fixed` full-viewport at z:3. On the homepage that is invisible (the hero at z:4 is the curtain over it); here `#about` at z:2 sits between hero and mount, so the armed corridor frame would paint over the bio's last viewport. Restoring native sticky is the entire fix — the corridor rises into view after About, which is the proven `/test/home-v2` configuration, and engagement stays rect-based.
- **Journey menu hidden.** `CorridorSectionMenu` renders from `MANIFEST_ENTRIES` and resolves its row from `data-active-station`, which reads `"about"` from the second section onward — an index _after_ services. The reel would highlight ABOUT through the corridor approach and glide backwards, alongside dead CONTINUUM/PRACTICE rows. The 13-tick ladder stays (ADR-031).
- **The nav's "Vision" row hidden.** `HudNav`'s items are hardcoded in React, so the parse-time link cleanup can't reach the `#continuum` entry.

### Two parse behaviours worth recording

- **`removeStations` must not name a nested id.** `#approach` is a `<div>` inside `#practice` on this prototype; `removeStationsFromBody` walks section ranges then div ranges, and a div range nested inside an already-removed section moves the cursor backwards, re-emitting the outer section's tail as orphan markup. Removing `#practice` subsumes it. (The homepage lists `approach` safely only because it keeps `#practice`.)
- **Links to removed stations are DELETED, not redirected.** `removeHudNavEntries` strips any `<a href="#removed-id">…</a>` and runs _before_ the redirect pass, so the redirect never sees them. The hero's primary CTA therefore points at `#home-corridor-mount` directly. (The homepage never hits this: its hero CTA targets `#continuum`, a station it keeps.)

### Consequences

- The global brandmark DOM journey is **intentionally dark** on this route: all five `data-brand-anchor` slots lived in removed stations, so `useBrandmarkJourney` writes `visible: false` and returns early, and both actors initialize hidden. The corridor's own physics-core mark is the only brandmark — which is the intent.
- `#contact` is load-bearing beyond copy: `useCorridorExitScroll` resolves `#practice ?? #contact`, so contact gives the ambient canvas a real edge to fade against instead of holding to the document bottom.
- No new JS weight — the corridor is the same `React.lazy` chunk the homepage loads. The route adds `home-v2.css` + `services.css`; `about-stage.css` / `continuum-stage.css` are deliberately not imported (neither stage mounts here).
- `/arcs/claude-workshop` (ADR-052) still exists as the deck-page port. The two are different surfaces: this one is the narrative frame; the deck page holds the full section-by-section material, from which content can be fitted into this frame.
- The fork prototype remains **outside the production drift guards** (`tests/lib/v7-parse.test.ts`, `rail-manifest.test.ts` read `landing-v7-motion.html` only). `tests/lib/claude-workshop-parse.test.ts` is its own guard. Do **not** add variant stations to `MANIFEST_ENTRIES` — that would break the production rail test.
- All hero/section copy on this route is owner-tunable; the transplants set a current baseline, not final wording.
