# ADR-160: The cases page and the swarm chapter on a phone

- **Status:** Proposed (2026-10-21, owner), built and guarded on branch
  `claude/ux-meetup-login-gate-qkexe6`. Flips to Accepted once the owner has read the stills and
  the production build on his own phone.
- **Surface:** `/cases` and the UX meetup talk's swarm chapter, at ≤960 only.
  `components/xb-proposal/phone/` (new: `stageClock.ts`, `usePhoneStage.ts`);
  `EmbedStack` + `embed.css`, `NetworkOrg` + `network-org.css`, `StackFlow` + `ClosedStack` +
  `stack-hero.css` (an opt-in prop each); `app/(marketing)/cases/page.tsx` and the talk's
  `SwarmChapter.tsx` (the two readers of the prop); `components/arcs/case-dossier/dossier.css`
  (the phone frame block). Tests: `tests/lib/xb-phone-stages.test.tsx` (new),
  `layout-viewport-height` (three adopters), `ux-meetup` (the talk's half, ADR-156 U16).
- **Related:** [ADR-125](125-the-phone-corridor-lands-on-its-beats.md) (the phone corridor's clock, whose grammar
  this reuses), [ADR-115](115-the-phones-deck-flip.md) U1 (a runway's travel is area minus band),
  [ADR-113](113-the-phone-locks-in.md) (the layout viewport), [ADR-156](156-the-ux-meetup-talk.md)
  U15 (the static phone layouts these stages fall back to) and U16 (the talk's own fixes).

## The call

The owner, 2026-10-21, after U15 made the three opening sections readable on a phone: "make sure
that the mobile version isn't just a shitty version of our desktop page … retain our cool
transitions from the first sections … the proof / cases are visually clear. Don't want different
sections to bleed into each other … draw inspiration from the Mobbin MCP." Asked, he chose: both
pages; the transitions as **phone-native stages** (the same story beats, played by the sections'
own drawings, not the particle swarm, which only mounts at ≥961); numbered seam bands between
sections; and a readout header with progress on the cases. The seams and the case bar are new
objects, so they are drawn in a lab first (§Left open); this record is the stages and the bleed.

The references, from Mobbin: Polestar's digital-key onboarding (an illustration panel over a
"1/4" counter, a title and a body) for the steps; Life Reset's lit and unlit stepper for the
dots; Flighty's delay report (one big figure over monospace rows) for the cases to come.

## Decision

### 1. One clock, the phone corridor's grammar

`stageClock.ts` is pure: a stage is a table of legs in svh, each a **dwell** (`from === to`,
24svh) or a **pass** (≥70svh, eased by the corridor's own `cruise`). A dwell is shorter than one
snap radius and a pass longer than two at 640, 664, 844 and 932, so a resting thumb lands either
on a composed frame or plainly mid-travel (ADR-125's argument, pinned by the test at all four).
`clockAt(legs, s)` maps travelled svh to the section's own progress, `seatsOf(legs)` gives a
`scroll-snap-align: start` seat for every dwell.

- **Steps:** Navigate · pass · Encode · pass · Build, seated on `EmbedStack`'s own `p` 0, 0.5
  and 1 (232svh of travel).
- **Network:** Marketing · a 150svh pass · every team (198svh), read through `NetworkOrg`'s own
  `moment(p)` from `T.ribs` to 1, so the teams join in the desktop's `TURNS` order.

### 2. The gate is a media query, and the prop opts in

`PHONE_STAGE_MEDIA` = `(max-width: 960px) and (min-height: 640px) and
(prefers-reduced-motion: no-preference)`. 640, not the eras' 681: a 390-wide iPhone under
Safari's bars measures about 664, and every stage was checked to fit at 640. Below it, or under
reduced motion, the sheets' gate does not match and U15's static layouts stand: the fallback is
the media query alone, no JS.

`phone="stage"` is a prop on each of the three components, and only `/cases` and the talk's
`SwarmChapter` pass it. The keynote template, the X-Bionic proposal (`ArcFlowPorts`) and the labs
render byte-identical markup (the test renders all three without the prop and finds no stage).
`data-phone` is server-rendered, so first paint already has the right box.

### 3. A band pinned in its own runway

Each stage is a sticky `100dvh` band (the sanctioned pinned-band exception: the only `dvh` in
these sheets, and only inside the gate, both pinned) followed by a travel spacer in svh holding
the seats. `readBand` measures the band's flow top as the spacer's top less the band's height,
never from a constant, and reads `layoutViewportHeight()`. The band reserves
`--mobile-chrome-top/bottom` and paints the page ground, so nothing behind it shows through.

- **The steps** (`EmbedStack`): the plates panel on top, an opaque text panel below with a
  counter ("01 / 03 · Navigate"), a three-dot stepper lit in the steps' tones, the active step
  alone in one grid cell, and its two callouts as DOM tags read from `CALLOUTS` by reference (the
  SVG callouts would print under 12px at this scale). The plates open and close by the desktop's
  own `read(p, open)`; the arrival opens them in place, which answers the vision's closed stack.
- **The network** (`NetworkOrg`): on arrival Marketing's name types in, then its three courses;
  over the pass the gutter ribbon draws, each stub draws, and each team grows by a clip with its
  box fixed. Imperative writes only, no per-frame React state; the typed words keep a
  screen-reader copy.
- **The vision** (`StackFlow`): the closed stack's plates fall in bottom-first as the section
  arrives (`--fall`, one per plate, `data-plate` on `ClosedStack`), then the stack holds sticky
  under the chrome on an opaque bed while an IntersectionObserver over the three tab rows,
  measured from the stack's foot, lights the plate being read and dims the others.

### 4. The dossier stops bleeding

At ≤960 a case's frame was 35 % opaque over its sticky field, so one case's pattern read through
the next case's words. The frame takes `rgba(var(--void-deep-rgb), 0.9)` and the field's dots
drop to 0.22 (`[data-pattern]` named too, or it outranks the rule). The dossier guards in
`proposal-swarm-v2` hold.

## Consequences

### Positive

- The opening sections move on a phone again, with the desktop's own drawings and progress
  functions: one story, two renderings, no second set of numbers.
- Desktop is untouched: at 1440×900 every box under `main` on `/cases` and the document height
  match `main` (a dump and a diff at 0.5px).

### Negative

- Three shared components carry a phone branch each; a change to `read`, `moment` or the plates'
  geometry now shows on a phone stage too.
- iOS behaviour (the height gate under the toolbar, the `dvh` band as the bars move, snap near the
  seats) cannot be reproduced in Chromium; the production build on a real phone is the last gate.

## Verified

At 390×844, 390×640 and 430×932, dark and light: the steps at each seat, mid-pass and release;
the network typing, collapsed, growing and whole; the vision's fall, hold and lit parts. At
375×600 and under reduced motion every stage falls back to U15's static layout. Unit tests,
typecheck and lint on the changed files clean.

## Left open

- **The seams, the case bar and the big-number readout** (the owner's other three picks) are new
  objects: a lab at `app/(internal)/test/phone-seams-lab/` with two directions each, stills at the
  owner's viewports, and a port only after he picks.
- The keynote template does not opt in (its sheet's formatting blocks the one-line bleed, ADR-156
  §Left open); nor does the X-Bionic proposal.
