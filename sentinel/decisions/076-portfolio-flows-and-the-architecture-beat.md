# ADR-076: The portfolio flows, and the architecture is the beat that closes it

- **Status:** Accepted (2026-08-24)
- **Surface:** `/arcs/portfolio` · `lib/arcs/content/portfolio.ts` · `lib/arcs/types.ts` (the `intelligence` kind) · `components/arcs/ArcIntelligence.tsx` (new) · `ArcShell` · `useArcScroll` · `arcs.css` · `lib/cases/content/loop-earplugs.ts` (`LOOP_INTELLIGENCE_MAP`)
- **Supersedes:** ADR-072's terminal motion on the portfolio and its two Skills sections. Everything else in ADR-072 stands (the dossier kind, the shared evidence, the envelope on arcs).
- **Extends:** ADR-075 — the curtain seam now ships on the flowing path too.
- **Prior art:** ADR-052 (the reveal grammar) · ADR-057 (terminal motion, which the `-v2` decks keep) · ADR-063/069/070/071 (the map console and its three readings) · ADR-064 (the console frame) · ADR-072 (the portfolio and the dossier) · ADR-075 (the hero and the seam)
- **Rules:** [`.claude/rules/arcs.md`](../../.claude/rules/arcs.md)

## Context

The owner read `/arcs/portfolio` against the shards repo's `/ai-operator`
(the Stripe application) and its AI keynote, and the verdict was three
things at once:

> "it feels less nice to scroll through … instead of having the section
> titles and paragraphs just glitching into view, maybe we can have a
> more common, general scroll experience … the skills are now like blocks
> of text. It feels very East German, very boring … we built on our
> homepage that nice Intelligence architecture thing, and I think we
> should expand that … the Intelligence Architect thing should be at the
> bottom."

Three findings shaped what that means.

**1. The felt difference is PINNING, not technique.** The shards pages
reveal with an IntersectionObserver at `rootMargin -10%`, a one-shot
`is-in` class and a ~0.6s eased rise — which is, to the constant, the
grammar this repo already ships as ADR-052's `reveal`. `ArcShell`'s own
comment calls it "the Shards reveal pattern". So the page did not need a
new motion system; it needed to stop holding every section still while
its masthead scramble-decoded. Terminal motion is a DECK grammar — it
presents. A portfolio is scrolled.

**2. The text walls were a quarter of the page.** Measured at 1440×800
before this pass: 13 pinned beats over 25.7 viewports, of which
`#skills-by-team` alone was **5,319px** — the 47-Skill roster as text
cards — over `#five-shapes`, five ruled mono rows naming the shapes and
their counts. Both are the same content the map console DRAWS.

**3. The console fits better here than it does at home.** On the
casefile it shares a ~850px column with three other plates, and ADR-063
records its standing defect: reading 01 letters at **6.2–7.2px** at
1280×720, under an 8.5px chrome floor, with no crop lever left. The
constraint there is the panel. A section has a viewport.

## Decision

### 1. The portfolio takes the reveal grammar

`motion` comes off `PORTFOLIO_ARC`. One line, because the dispatch was
already motion-threaded: `ArcBeat` renders a plain `<section>` under
reveal, `rung()` returns nothing, `useCloseOnArcBeatFold` no-ops outside
an `.arc-stage`, `useArcActiveSection` watches either. The `-v2` client
decks keep terminal motion — it is the grammar they were designed in, and
`arc-terminal-smoke` is what proves this change left them alone.

Measured: **25.7 → 12.6 viewports**, every section about one viewport.

### 2. The curtain survives, on the flowing path

ADR-075's seam was CSS-gated on `[data-motion="terminal"]`, because that
was the only grammar carrying the landing's plate when it shipped. The
mechanic is unchanged — the card is the MOVER, the panel behind it is
HELD — but a flowing page has no `.arc-plane`, so the held element is the
first section's own `.arc-band`, which is a direct child of the section
in every kind. `ArcShell` marks the root `data-arc-curtain` when a detail
page carries the gateway plate and is not terminal.

⚠ **The held band needs no background, and reasoning that it does breaks
it.** At rest the fixed cell paints at viewport 0 — under the hero card,
which is z 4 and opaque. As the card lifts, the strip it uncovers is
exactly the top of the section's own flow box, which `.arc-section`
paints void. There is always something opaque behind.

⚠ **`data-arc-tall` has no controller here**, so `useArcScroll` measures
it: mount and resize only, and only on a curtain page. A first section
taller than the viewport cannot hand its content to a 100svh fixed cell
without a jump, so it keeps today's behaviour instead.

⚠ **The release query repeats the freeze's selector, `:not()` included** —
ADR-075 measured that lesson (a media query adds no specificity), and the
pair here is the REVEAL system's own 900px, not the terminal tier's 960.

Measured at 1280×720 and 1440×800: the band holds `top: 0` while the card
runs to −vh, and the content's centre moves ≤1px across the handoff.

⚠ **Sample the handoff within a pixel of the seam.** The fixed cell holds
at viewport 0 while the flow box sits at `sectionTop − scrollY`, and they
agree at exactly `scrollY = vh` — which is the design. The first guard
sampled ±8px and reported an "8px jump" on a seam that is continuous; it
was measuring the scroll. The defect worth guarding is a MISMATCHED BOX,
which shows up as tens of pixels however tightly you sample.

### 3. The two Skills sections become one drawn instrument

`five-shapes` and `skills-by-team` are deleted. The new `intelligence`
kind is a masthead and nothing else; `ArcIntelligence` mounts
`IntelligenceMapPlate` — the landing's own three-reading console — from
`LOOP_INTELLIGENCE_MAP`, the same five arrays the casefile row carries,
pinned reference-equal by `cases-registry.test.ts`. A content module that
re-typed the roster would be publishing a second portfolio.

It sits **at the foot**, after the four tools and the outcome: it is the
answer to "what is underneath all of that", which only reads as an answer
once the work has been shown.

The written roster survives on the keynote arc — a deck read in a room,
where the list is the point — so the reference pin narrows rather than
going.

⚠ **The wheel cannot trap this page, and that is structural.**
`PdaConsole`'s native wheel listener is gated on BOTH
`SERVICES_SCROLL_OWNED_MEDIA` and `closest("[data-proof-settled]")` — the
casefile's own arrival attribute, which nothing on an arc writes. Off the
casefile the listener returns before it can `preventDefault`. Do NOT
declare `data-proof-settled` on this host to make it "feel like the
landing": that arms a scroll trap two thirds of the way down a flowing
page, and nothing else would fail. The smoke asserts the page still
scrolls over the console, and that the reading did not change either.

### 4. The box's aspect is the contract, again

The first cut gave the console the band's full instrument width and it
letterboxed **horizontally**: 1129×471 at 1440×800 — 99 % of the panel's
width, and the work grid sitting in the left two-thirds of a wide black
box. `meet` fits by the SMALLER ratio, so a field wider than the crop
wastes width and no amount of width helps.

This is ADR-070 U4/U12/U15's finding for the fourth time, and the guard
repeated the mistake with it: the first fill assertion measured HEIGHT
(90 %, green) on a panel a third of whose width was empty. **Asking about
one axis is how this is missed.** The smoke now asserts both, plus the
panel's aspect against the range these drawings were fitted for
(w/h 0.42 → 1.24).

The fix is `max-width: calc(var(--arc-intel-h) * 1.2)` with the height
taking `78svh`. The section then runs ~1.05–1.09 viewports, which is
affordable here and nowhere else on the page: this is the centrepiece,
and a flowing page can hand it a scroll and a bit where a pinned beat
could not.

| viewport  | casefile panel | this beat      | smallest type |
| --------- | -------------- | -------------- | ------------- |
| 1280×720  | 603 × 493      | **674 × 562**  | —             |
| 1440×800  | 679 × 548      | **749 × 624**  | **9.5px**     |
| 1920×1080 | ~850 × 760     | **1011 × 842** | —             |
| 1920×1247 | 845 × 950      | **1167 × 973** | **15.3px**    |

The last column is the point. ADR-063 §Outstanding records reading 01
lettering at **6.2–7.2px** on the casefile with no lever left; at page
scale the same drawing renders its smallest label at **9.5px** at
1440×800 — above the 8.5px chrome floor that surface has never reached.
The gap was DENSITY, and a section is where the density is affordable.

### 5. What else moved, and why

- **The tools section becomes a chapter head.** It was an `anatomy`
  listing three modes with a tool named in each; every dossier below
  already prints its own mode chip and the same shared legend sentence.
- **Its `sub` is authored per-arc now.** `SOFTWARE_FEW_LINE` (shared with
  the keynote) ends "The Skills ABOVE are what those tools run on" —
  true on the deck, false here the moment the Skills moved to the foot.
  Share the evidence, author the frame.
- **The overview's shape roll-call receipt goes.** The architecture beat
  derives those five counts from the roster; a hand-typed copy is the one
  that goes stale.

## Consequences

- Chapters: About · Overview · Tools · Outcome · **Architecture** (five,
  the cap holds). The drawer runs to ten rows.
- `pda.css` joins the arc route's sheet order, between `console.css` and
  `arcs.css`. The pda modules join the sanctioned casefile leaves — DOM
  and SVG only, no three, no Supabase, no stores.
- `tests/visual/arc-portfolio-smoke.spec.ts` is rewritten for the flowing
  path: no `.arc-stage`, no decode ladder, a `restAt` helper that
  converges on a section and then sweeps past it and back.
  ⚠ **The reveal IO is ONE-SHOT**, so a section parked at its top never
  reveals its own foot — measured, 5 of vesper's 6 panels at 1280×720,
  which is not a defect but the wrong place to stand.

## Verification

`npm run verify` (1014 unit tests) · `arc-portfolio-smoke` 18/18 across
projects, including the seam, both halves of its release, the dossiers at
three shapes in both themes, and the architecture beat's box, aspect,
fill, rail and wheel · `arc-terminal-smoke` 10/10 (the `-v2` decks
unchanged) · production build.

Measured live at 1440×800 and at the owner's own 1920×1247, dark and
light: the console fills 98–99 % of its panel's width and 91–94 % of its
height at every shape, and all three readings letter at 9.5px or better.

⚠ **A second pre-existing failure was found and left alone**, and it is
recorded because it was checked rather than assumed:
`arc-terminal-smoke`'s "the v1 pages are untouched" fails on the two
iPhone projects (the 7th `.arc-reveal` on `/arcs/claude-workshop` has not
fired at y=2600). Verified pre-existing by reverting the three files this
pass adds that load on a v1 page — the route, `useArcScroll` and
`arcs.css` — and re-running: it still fails. Nothing here reaches those
pages (every rule added is gated on `[data-arc-curtain]`, `.arc-sec--intel`
or `.arc-intel`, and `pda.css` is fully `.fl-pda*`-scoped). Desktop and
tablet pass.

⚠ Two `landing-page.spec.ts` corridor snapshots still fail on this tree
and are **not** from this pass — ADR-074's `#voidwalker` station
lengthened the landing while those assertions scroll by PERCENTAGE, and
their baselines are from 2026-08-02. Re-baselining a corridor frame is a
judgment about the corridor, so it stays with that work.
