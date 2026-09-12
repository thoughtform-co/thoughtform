# ADR-096 — The proof beat is the card stack

**Status:** Proposed (shipped and guarded, 2026-09-12; pending the owner's live read)
**Supersedes on PLACEMENT:** [ADR-056](056-services-proof-casefile.md) — the casefile's
content model, its plates and its confidentiality envelope are untouched
**Shares, verbatim:** [ADR-094](094-trinny-proof-stack-and-proposal.md) — the card, the
pile and their skin
**Related:** [ADR-030](030-tools-section-cover-stack.md) (the stack mechanic) ·
[ADR-029](029-services-card-ring.md) (the offer the beat hands to) ·
[ADR-089](089-casefile-is-one-housing.md) · [ADR-058](058-light-mode-theme.md)

---

## The ask

Owner, 2026-09-12, on reading `/trinny-london`:

> The updated cards we implemented in Trinny London: I really like that. I want
> you to implement that as well on our homepage. As you know, in the proof
> section on our homepage, we now have different cards, but I want you to use
> the ones from Trinny London. Also, we need dark mode for those on our
> homepage.

The same four Loop projects were on both surfaces already, drawn two ways: a
pinned **casefile** on `/` (one panel, a client tab, a brief, four claims, a
directory whose rows scroll-select, and one evidence panel that swaps) and a
scroll-stacked **pile of cards** on the pitch page. The ruling is that the pile
is the beat.

## The decision

`#services` opens with the proof STACK. `SERVICES_PROOF_CASEFILE` goes off and
`SERVICES_PROOF_STACK` on; the casefile's component tree, its sheet and its
guards stay on disk until the owner has read the new beat live — ADR-070 U35's
ruling that a flag is a comparison lever, and that **the losing drawing goes
WITH its guards, not before them**.

⚠ **THE FOUR EVIDENCE PLATES ARE NOT PART OF THE TRADE.** `SheetsPlate`,
`FilmsPlate`, the wireframes and `IntelligenceMapPlate` are what the CARDS
mount, at card scale, through `ProofField`. `casefile/**` is therefore not dead
code and may not be swept as such — what changed is the housing around the
evidence, never the evidence.

## Two mechanics, and why the pile could not simply move in

They are different MECHANICS, not two skins:

- the casefile is **pinned** and browsed — scroll IS the row selector across a
  3.2-viewport dwell;
- the pile is four `position: sticky` slots — and a sticky slot needs real
  scroll to stick against.

Inside a stage that is itself pinned at `top: 0` there is none. So the pile is
a **SIBLING of `.services-stage`, seated ABSOLUTELY over the front of the
runway** (`services.css`). That keeps both halves of what the beat needs:

- out of flow, so `.services-stage` still pins from the runway's very top and
  the proof → offer handoff keeps the shape it has today — the masthead, the
  plate cluster and the ring fade up in a frame that never moved. Putting the
  pile in FLOW ahead of the stage would push the stage's pin down the runway,
  so the offer would arrive by _sliding up after the last card_;
- and the pile still scrolls, because an absolutely positioned ancestor
  scrolls with the document; its sticky children pin to the viewport and
  release at its bottom edge.

⚠ **BELOW THE INERT RUNG THE PILE GOES BACK INTO FLOW**, first in DOM, so the
proof reads above the offer accordion exactly where the casefile sat. The
`position: static` rung in `services.css` restates `proof-stack.css`'s own
query and must keep restating it: a pile that parks its slots while its box is
still out of flow lands on top of the accordion.

## The runway is MEASURED, not declared

`splitServicesRunway` still takes a proof share and hands the ring the rest
over a domain that is byte-identical to the pre-casefile 500svh. What changed
is where the proof share comes from.

⚠ **THE PILE'S LENGTH IS NOT A CLEAN MULTIPLE OF THE VIEWPORT.** It is
`n × (100svh − pinTop + peek + dwell)` plus the last card and its tail, and the
px terms in it — the 64–88px pin, the 52px peek, the 24px safe band — do not
scale: measured **489svh at 1280×720, 491 at 1440×900, 483 at 1920×1247**. A
single literal can only ever be right at one viewport.

So `useServicesStageScroll` reads `.pf-stack`'s own box, adds
`SERVICES_PROOF_RELEASE_VH`, and **writes the total back onto
`--svc-proof-runway` in pixels** — one write per resize, change-guarded, and it
converges in a single frame because writing it changes the RUNWAY's height and
never the pile's (the pile is out of flow). `SERVICES_PROOF_RUNWAY_VH` (6.1) is
the **pre-hydration reservation** and the fallback, not the measurement; it is
deliberately the ceiling of the measured range, because reserving too little
would let the ring's domain start inside the pile for one frame.

Measured live at 1440×900: pile 4416px, written runway 5496px, ring domain
3600px against the 3600 it must be. The browse fraction is derived the same
way (`pileH / proofPx`), so the release band starts exactly where the pile
ends at every viewport.

⚠ **AND THE SAME ARITHMETIC CARRIES THE IN-FLOW RUNG FOR FREE.** When the pile
is static it is the runway's first child, so the stage pins at `pileH` — which
is the number the hook already measured. Nothing branches.

## Dark mode was free, and that is a property of the sheet

The card's sheet is TOKENS only: every colour is a ramp step off `--dawn-rgb` /
`--void-deep-rgb` / `--gold-rgb`, which ADR-058 SWAPS between themes. So the
same declarations paint cream on near-black here and ink on parchment on the
light-locked pitch page, with no `[data-theme]` branch anywhere in the file.
Measured: `--pf-plate` resolves `rgb(5, 4, 3)` in dark and `rgb(228, 218, 201)`
in light, on the same rule.

⚠ **THAT IS WHY THE SHEET MOVED RATHER THAN BEING COPIED.** A route-local copy
of the dark values is ADR-058's own trap one surface later, and the four plates
inside the card already rely on the console bringing both themes with it
(ADR-094 U3). Two copies of a measurement is how one surface starts passing
what the other would fail.

## The promotion, and the one thing it renamed

`app/(marketing)/trinny-london/proof/**` became
`components/landing/home-v2/services/proof-stack/**`:
`ProofStack` · `ProofCard` · `ProofField` · `proofTabs` · `proofOrder` ·
`proof-stack.css`. The route keeps three thin shims under its own names so
`trinny-proof-order.test.ts` and `trinny-proof-tabs.test.ts` are untouched, and
`ProofStack` there is a default export because `TrinnyPortals` mounts it
through `lazy()`.

⚠ **THE ROUTE SCOPE `.tl-root .tl-*` BECAME `.pf-stack .pf-*`, AND THE SCOPE IS
LOAD-BEARING.** Those selectors override `console.css` and `casefile.css` at
(0,3,0); flattened to `.pf-card__tabs .fl-con__stn` they would lose to rules
they were measured against. The component therefore renders its own `.pf-stack`
wrapper and every rule is scoped by it, which keeps the specificity of the
whole sheet exactly as it shipped.

`tracks` is a PROP: content is by reference and ORDER is by route. Both
surfaces show the record's own arc order today — `01` the frontier · `02`
self-sufficiency · `03` the tools · `04` the company — and a second casefile
would not have to. ⚠ The pile's order and `arc.step` can disagree with nothing
failing; `trinny-proof-order.test.ts` pins them arithmetically and the new
smoke pins them on the rendered page.

## Alternatives rejected

- **Keep the casefile and add the pile after it.** Eight viewports of proof
  before the offer, and the same four projects said twice.
- **Keep the pin, restyle the panel as a card.** Cheapest, and not the thing
  the owner liked: the pile IS the mechanic.
- **Drive the pile from `--svc-proof-browse` inside the pinned stage.** A
  re-implementation of ADR-030's hook against a channel it was not written
  for, on a surface whose rule is that the mechanic is shared and the skin is
  local.
- **Copy the sheet instead of moving it.** See dark mode above.

## What moved, and what did not

| moved                               | stayed                                               |
| ----------------------------------- | ---------------------------------------------------- |
| the casefile's MOUNT (flag off)     | `lib/cases/**`, the envelope, every plate            |
| the proof share's source (measured) | `splitServicesRunway`, the ring's 500svh domain      |
| the card's module + sheet           | the corridor dissipate, the dock, the ambient hold   |
| the smoke's proof half              | `proofRelease` / `proofPresence` and their consumers |

## Guards

- `tests/visual/services-ring-smoke.spec.ts` gains
  **"desktop: the proof stack holds the stage before the ring arrives"** (the
  seating, the measured split, the pile holding `--svc-content-in` under 0.05
  with zero published ring anchors, four cards on the record's arc, the rail's
  flat-and-square stations switching the field, the card's clipped-ring
  chamfer with a square console inside it, and no box clipping on any card)
  and **"light: the stack's instruments carry their contrast"** (ADR-063 U2 and
  ADR-068's colour laws, re-walked on the new surface).
- ⚠ **EVERY READ IN THOSE TESTS IS SCOPED TO THE SEATED CARD.** The pile mounts
  FOUR consoles at once, so `document.querySelector(".fl-con__console")`
  answers with the sheets card whatever is on screen. That is the one thing a
  single-panel surface never had to say, and it is why the casefile's own light
  walk could not simply be re-pointed — it navigates by `.fl-row` and reads one
  console per row.
- ⚠ **`seatProofCard` REWINDS ABOVE THE PILE BEFORE IT SOLVES.** `offsetTop` on
  a sticky element that is currently STUCK reports its stuck position, not its
  flow offset, so solving a seat while standing further down the pile reads a
  lie and converges on wherever it already is. And it converges on
  `data-pc-state` — the hook's own published value — never on a rect, because
  the corridor's lazy mount grows the document under the first scroll.
- `scripts/capture-proof-stack.mjs` prints the geometry, the split, each card's
  rail and plate, and shoots the four seats plus the handoff.
- Five casefile tests are `test.skip`-gated on `SERVICES_PROOF_CASEFILE` with
  the reason written in.
- `tests/lib/casefile-browse-map.test.ts` derives the casefile's own dwell from
  the three knobs instead of reading `SERVICES_PROOF_RUNWAY_VH` /
  `SERVICES_PROOF_BROWSE_FRAC` — those exports are the STACK's now, and reading
  them made a claim about `browseMap.ts`'s arithmetic depend on which beat the
  page happens to mount.

## Left open

- **The casefile and its guards are still on disk.** One decision, after the
  owner's live read; `browseMap.ts`, `ClientTabs`, `Directory`,
  `TrackProofRegister`, `TrackPanel` and ~2,000 lines of `casefile.css` go with
  it, and the four plates do not.
- **`/claude-workshop` inherits the beat**, because it mounts the same
  `ServicesStage`. That is consistent with how it inherited the casefile, and
  it has not been read.
- ⚠ **A "PRE-EXISTING STATION OVERFLOW" WAS RECORDED HERE AND WAS NOT REAL.**
  Mid-pass the instrument band appeared to clip ~150px on the right at
  1440×900 — `.station:not(.hero)` measuring 1730px, its content box running
  145 → 1585 against a 1434px client width — and an A/B with the casefile
  restored showed the same clip, which is what made it read as the site's own.
  The cause was `touch tailwind.config.js postcss.config.js` used to bust a
  cache: the repo has `.ts` and `.mjs`, so `touch` CREATED empty `.js`
  siblings, PostCSS resolved the empty one, and **the whole Tailwind preflight
  disappeared** — `body` back to its 8px UA margin and everything to
  `box-sizing: content-box`, which is what turns `width: 100vw` plus two 145px
  paddings into 1730. On a clean build `#services` is 1440 and the pile runs
  145 → 1295, inside the frame.
  ⚠ **THE LESSON IS THE DURABLE HALF, AND THE A/B DID NOT CATCH IT**: both
  sides of a comparison run on the same broken stylesheet, so an A/B can only
  ever say "not caused by this change" — never "this is how the site is".
  Check `getComputedStyle(document.body).margin === "0px"` before believing any
  width finding on this repo.

- **The last card's dwell is long** (its own margin plus the tail, ~71svh)
  before the release. Kept as `/trinny-london` tuned it; one constant if the
  owner reads it as slow.
