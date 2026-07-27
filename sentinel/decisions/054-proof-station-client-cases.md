# ADR-054: The Proof station — client cases on the corridor (#proof + lib/cases)

**Date:** 2026-07-27
**Status:** Accepted
**Surfaces:** `#proof` in `public/prototypes/v7/landing-v7-motion.html`, `lib/cases/**`, `lib/v7-parse/proofStation.ts`, the `.proof-*` block in `components/landing/v7/landing.css`, `CorridorSectionMenu`, `lib/rail-manifest/entries.ts`
**Supersedes:** ADR-049 (continuum rail stage) on production
**Related:** ADR-008 (layered compositing), ADR-030/033 (the ambient kill and the funnel), ADR-047 (the about deck-flip stage this follows), ADR-048 (editorial band), ADR-052 (the `lib/arcs` content model this mirrors), ADR-031 (rail manifest + section menu), ADR-036/041/042 (the arc-cases card that owns the tools' deep read)

## Context

`#continuum` was the vision beat: a pinned transparent stage where the
brandmark returned and a tool ↔ collaborator slider formed out of it
(ADR-049, nine updates). It was the most instrumented section on the page
and it asserted a thesis. What the funnel lacked at that point was
**evidence** — the reader arrives from the bio (`#about`) ready to ask
"has any of this actually been done", and the answer lived only in four
tool cards inside the corridor's Build park.

The owner's call: replace the philosophy beat with the client case. Loop
Earplugs is eighteen months of the practice run at company scale, and it
maps cleanly onto the Arc we already teach.

## Decision

### The station

`#continuum` → `#proof`, in the same scroll slot. The funnel becomes:

```
hero → corridor (thesis + the Arc) → services → about → proof → practice → contact
```

Four internal full-height beats: a **mission report** head (headline
numbers, meta register), then **Navigate**, **Encode**, **Build** —
mapping the engagement onto the Arc. The three beats appear as PROOF's
subsections in `CorridorSectionMenu`, byte-identical in name to THE ARC's
own rows. That mirror is the whole integration: the case is legible as
the Arc without repeating one 3D element of it.

### It is plain DOM

No pin, no portal, no scroll writer, no canvas coupling, **no flag**.
`#proof` is an ordinary opaque `.station` whose height is its content.

No flag because there is no runtime to guard: the house guards _stages_
(`ABOUT_DECK_STAGE`, the retired `CONTINUUM_RAIL_STAGE`) because a stage
has a capable path and a fail-static path. Static markup has one path.
`#contact`, the closest analogue, carries no flag either. Rollback is
`git revert` of the swap commit.

### It is the ambient cover

`#about` is a pinned TRANSPARENT stage whose exit slides copy and
portrait out over the live corridor bed (ADR-047 U8), so the station
after it must be the opaque cover that ends the corridor ambient hold.
That role moves from `#practice` to `#proof`:

```
nextStation = ABOUT_DECK_STAGE ? (#proof ?? #practice) : (#about ?? #proof)
```

The ambient bottom gate and the fade envelope still read the **same**
rect — the twice-recorded ADR-030 §6 seam-cut guard. Unlike `#about` and
the old `#continuum`, `#proof` needs no `--*-bg-in` shield: it is never
transparent, so there is no fail-opaque case to cover.

Verified headed: ambient alive at `#proof.top = +0.4vh`, dead at `0.0vh`.

### Content is data, rendered at parse time

`lib/cases/` mirrors `lib/arcs/` (ADR-052): `types.ts` with **zero
imports**, a registry, one content module per case, and a test.
`CaseDef` = a mission report (title, lede, 3–5 stat tiles, meta rows)
plus a **three-beat tuple** pinned to `navigate | encode | build`, each
beat carrying copy, receipts, an optional quote and closer, and one
evidence visual from a discriminated union (`log`, `registry`,
`tool-strip`, `image`, `video`).

`lib/v7-parse/proofStation.ts` renders that into the authored
`[data-proof-body]` shell via a new `ParseOptions.fillSlots`, applied
after the station surgery and before the comment strip.

**Alternatives rejected.** A portal (the services/about pattern) kills
`data-m` — `useRevealMotion` captures targets from the
`dangerouslySetInnerHTML` tree at mount, and portal children are not in
it — and costs a nested root plus lockstep-duplicated copy, to buy
canvas coupling this station does not want. Authoring the copy in the
prototype instead single-sources it into a 234 KB HTML file and leaves
`lib/cases` documentation-only. Generation keeps one home for the copy
AND ships server-rendered, indexable markup that reveals observe at first
paint. Precedent: `hudTicks.ts` and `railManifest.ts` already
parse-inject from typed TS data (ADR-031).

Cost: the generated HTML rides the parse memo key. Accepted — it is a few
KB and it makes dev invalidation automatic.

### Single-source rules

- **The four tools stay in `PROJECT_CASES`.** A `tool-strip` stores only
  ids; the builder resolves codename / tagline / metric / image. The
  corridor's arc-cases card owns their challenge/shift/capabilities —
  the Build beat carries pattern, numbers and the handoff story only.
- **The menu's three PROOF rows are duplicated on purpose.**
  `CorridorSectionMenu` is a client component; importing the registry
  would ship every case's copy in the landing bundle for three labels.
  `PROOF_SUBS` is held to `caseBeatMenu(PROOF_CASE)` by test.

### Layout — the zig-zag

The site's first alternating layout. Two columns (44fr / 56fr) inside the
editorial band (`--band-max`, `margin-inline: var(--rail-inset)`), body
on `--band-copy`, beat titles deliberately below the report's station
scale so the report stays the loudest line. Mirroring is derived from
beat index parity — no `flip` field in the data, so future cases inherit
the grammar.

DOM order is **always** copy-then-visual; the flip is a column swap only,
so tab order and the mobile stack never change. **Both children are
pinned to `grid-row: 1`**: with column placement alone, a flipped beat's
copy at column 2 advances the auto-placement cursor past column 1, and
the visual wraps to a second row — the beat renders diagonally at double
height. Mobile releases both pins and stacks in DOM order.

One signature HUD atom per band, no stacking: survey plates and hairline
stat frames for the report, a terminal rollout log for Navigate, a
grouped skills registry for Encode, a compact tool strip for Build.

### Confidentiality envelope

Client work on a public page. `tests/lib/cases-registry.test.ts` enforces
mechanically, not by good intentions: **no** currency symbols, amounts
with thousands separators, currency codes, board links, repo links, or
private repo names anywhere in `CASES`; quote attributions must be
first-name only. Tool codenames ARE in scope for a case study (published
precedent: `PROJECT_CASES`) but stay out of general service copy
(`services/serviceDesignations.ts`).

Where the harvest offered competing denominators the **smaller,
exec-facing** number is printed and the other never appears: 22 workshops
(not the 14 teams with published skill cards), 42 Skills (not the 51
registry cards including scoped placeholders). "95% of briefings ship
with AI" is deliberately absent — it is already published on the
ai-keynote arc page, and a second variant of one claim on a second
surface drifts.

### What the continuum retirement removed

Deleted: the stage (portal, component, data, 994-line sheet), its single
scroll writer, `continuumStageMath` / `continuumBandMath`, both
cross-root refs, the `/test/continuum-band` bench, two math suites, the
`CONTINUUM_RAIL_STAGE` flag, and the actor's entire continuum
consumption (regime gate, formation clock, pose release, band drive, ink
lift, scale boost, `ContinuumBandSliderAnchors`). The rejected ADR-049 U3
look-dev band block went with it — the hologram lab artifact was the only
other `continuumBandMath` consumer and its `bandDriveGetter` had no
caller once the bench was gone.

**Kept dormant:** the `uBand*` block in
`components/brand/BrandmarkPhysicsCore/shaders.ts` plus the
`BrandmarkCoreBandState` / `bandRef` plumbing. All gains idle at 0 and an
absent `bandRef` is byte-identity, so a future beat can drive a band
highlight with no shader edit.

**Left in place for one cycle:** the `.crail` / `.continuum` CSS in
`landing.css` (between the retirement marker and the TWEAKS PANEL
heading). It is unmatched and inert on both routes — `/claude-workshop`
strips `#continuum` at parse time (ADR-053) — but the block interleaves
shared-looking classes and deserves an audited cleanup commit rather
than a sweep folded into the station swap. It is marked; do not extend it.

### Hero CTA

"Begin navigation" pointed at `#continuum` and now points at `#proof`,
which took that slot. It cannot aim at a corridor-replaced station:
`removeHudNavEntries` strips any anchor to one, which deletes the button.

## Consequences

- One more surface the funnel has to carry, and the longest station on
  the page (~4 viewports). It is plain flow, so it costs no frame budget.
- `lib/cases` is the template. A second case is a content module, a
  registry entry, and assets — the corridor slot stays Loop's.
- `/cases/[slug]` subpages are anticipated by `slug` + `meta` and nothing
  else. Building them is a separate decision.
- **Known, pre-existing:** the right HUD rail paints over the subsection
  reel, so its rows are not mouse-clickable. Verified identical at
  `#services`, the Arc beats, and `#proof` — inherited, not introduced.
  Tracked separately.

---

## Update 1 — the report head pins and decodes (2026-07-27, owner)

**Amends** the "It is plain DOM" decision above: `#proof` now carries a
CSS pin and a reveal controller. Everything else in this ADR stands.

The owner's judgment: the mission report should arrive the way the
services masthead does — held still, its copy appearing in place — not
slide up the page on the generic `data-m` rise.

### The pin

`.proof__report` becomes `position: sticky; top: 0; height: 100svh`
inside a new `.proof__report-runway` (`min-height: 200svh`, the single
pacing knob — runway minus 100svh is the hold, currently one viewport).
The head holds while its runway scrolls, then releases into the Navigate
beat.

Still **no scroll writer**: this is plain CSS sticky, not a pinned stage
with a clock. `#services` and `#about` need clocks because they drive a
WebGL canvas; the report only has to stay put. That distinction is the
whole reason this stays a retune of the funnel and not a new stage.

The ambient contract is untouched — the runway starts at the station's
top, so `useCorridorExitScroll` reads the same rect. Re-verified headed:
ambient alive at `#proof.top = +0.6vh` and `+0.2vh`, dead at `0.0vh`.

Mobile (≤960px) collapses the runway and un-pins the head: the stacked
copy can exceed a short viewport, and the decode is gated off there
anyway.

### The decode

`ProofRevealController` (`components/landing/home-v2/proof/`) reproduces
`ServicesMasthead`'s reveal: title lines decode through the canonical
`captionScramble` kernel with the station-header CRT cursor riding the
line still resolving, while the lede types on beside them. Neither moves
— the `data-m` roles came OFF the title and the lede, because a rise is
exactly what this replaces.

Two forced differences from the services controller:

1. The markup is **parse-injected**, not JSX, so this is a controller
   that finds nodes and mutates them in place (the
   `RailManifestController` precedent). It renders `null`.
2. `#proof` has **no clock to read**, so arrival is an
   `IntersectionObserver` on the head — no scroll listener, no writer.

Everything else is held verbatim: writes confined to its own subtree,
silent reconstruction on a reload already inside the station, re-arm on
leaving upward, enhanced tier only (≥961px + no reduced motion), and a
cleanup that restores the full text. Mobile / PRM / no-JS keep the static
copy the markup already ships — verified: full title and 283-character
lede present, `data-reveal` absent.

### Consequence

The station grows by one viewport (the hold). `.proof__report-runway`'s
`min-height` is where to retune that, and nothing else keys off it.
