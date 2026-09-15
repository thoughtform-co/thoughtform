# ADR-099: The pitch nests under its client, the configuration scrolls in, and the flow is drawn

**Date:** 2026-09-13
**Status:** Proposed (built and guarded; pending the owner's live read)
**Surfaces:** `app/(marketing)/arcs/trinny-london/proposal/**` · `components/arcs/**` · `lib/arcs/types.ts` · `public/prototypes/v7/landing-trinny-london.html` · `next.config.mjs` · `lib/theme/{themeLock,heroPreload}.ts`
**Related:** [ADR-093](093-trinny-london-light-locked-variant.md) (the route) ·
[ADR-094 U5/U7/U9](094-trinny-proof-stack-and-proposal.md) (the pin this retires, the instrument, the offer) ·
[ADR-095 U4/U6](095-trinny-turn-particle-morph.md) (the held ground and the swap, both kept) ·
[ADR-098](098-arcs-clients-and-the-proposal.md) (the flat-engagement rule this carves one exception in, and the `configuration` kind coming home) ·
[ADR-052](052-client-arcs.md) (content-only, and its third enumerated exception) ·
[ADR-078 U1](078-portfolio-proof-page.md) (a drawing plots a record, never a metaphor)

## The ask

Owner, 2026-09-13, reading the page live after the offer landed:

> `/trinny-london` should be renamed / moved to `arcs/trinny-london/proposal`. … Make sure that the hero one and the paragraph are always positioned at the right position, because in the Trinny London configuration, it's different from "we propose a modular approach that compounds". … When you scroll from the section where we see the Trinny London particle system logo, after the products move away and we go into the Trinny London configuration, there's a brief moment where, I think, a blank section or a leftover section briefly appears. That shouldn't happen. … As you move away from the AI First inside Trinny London, the products move away. As you move away, the elements from the next section in the Trinny London configuration should scroll into view. … All sections should have that cross in the left corner above the H1, because we have it in all sections except for the Trinny London configuration one. The Trinny London configuration one also has some weird red divider. We need to remove that. … After "we propose a modular approach that compounds", I want a new section where we visualize the flow, sort of like a diagram … this new section should be super clean so that they can see what the flow is. Keep it minimalistic.

## What was measured

**The blank frame is the PIN.** Stops `18-turn-resolve` (y 20380) and `19-prop-armed` (y 21004) were pixel-identical bare frames. The turn empties at `p ≥ 0.90` (products out at `TURN_PRODUCT_OUT` 0.88, the line un-typed at `TURN_CTA_OUT` 0.90) and `#proposition` held `--tp-in: 0` until its sticky stage parked. **A pin cannot begin until the thing above it has ended**, so the reader crossed a viewport of held ground with nothing in it. ADR-094 U5 chose that pin to stop a slab sliding over the turn, and it bought this instead.

**The two heads were two grammars.** `.tl-prop__head` was a route-local sentence-case 48px sans with a coral `border-bottom`, no eyebrow and no cross; every offer beat is an `.arc-head` (eyebrow, origin cross, uppercase title with the gold `em`, coord stamps). And neither had a datum: `.arc-sec { align-content: center }` seats a head by HALF ITS BEAT'S BODY HEIGHT, so across the proposal's own beats the eyebrow ranged **0.107 → 0.197** of the frame at 1920×1247. Nothing on any head's box said so, which is why it reads as carelessness rather than as a rule.

## Decision

### 1 · The pitch nests under its client — one exception, and it is not an arc

`app/(marketing)/trinny-london` → `app/(marketing)/arcs/trinny-london/proposal`, with a 308 from the old URL beside ADR-098's own `/arcs/portfolio` redirect, for the same reason: the page's whole distribution is a link somebody forwarded, so the links in the wild are in inboxes.

⚠ **ADR-098 §2's "the engagements stay flat" is UNTOUCHED.** What moved is a `ClientDef.pages` record — a client's own page, not an `ArcDef` — and `/arcs/<client>/<leaf>` is outside `[slug]`'s namespace by construction, because `[slug]` matches ONE segment. So it shadows nothing, needs no `generateStaticParams` row, and `/arcs/trinny-london` still resolves to the client page (verified: 200, 200, 308). `arcs-registry` pins both halves — such an href must be two segments deep AND its first segment must be its own client's slug, because a page nested under another client's would resolve fine and lie about whose work it is.

⚠ **`isLightLockedPath` IS EXACT-MATCH**, so the new URL earns its own `LIGHT_LOCKED_ROUTES` and `HERO_ROUTES` rows by hand; both lists are `toEqual`-pinned so a route joins or leaves by a reviewed hand.

### 2 · The configuration is an arc beat, and it scrolls in

`#proposition` keeps its id, its bus station, its journey range, its transparent cover form and its ground canvas. Its RECORD becomes one `data-tl-config-root` slot that `TrinnyPortals` mounts `ArcConfiguration` into, over `TRINNY_CONFIGURATION` in `offer/offerSections.ts`.

**The copy came home rather than being rewritten.** ADR-098 §4 ported this very drawing onto the arcs surface; this is the same record going back through it — the same three teams, four layer rows, two seam notes and three kickers, verbatim from the tiles' `data-*`, so "the same instrument" is a claim the diff can carry.

**The clock becomes an ARRIVAL.** `propArrival(top, vh)` replaces `propPinnedProgress`; `propInOf`, `TURN_PROP_IN/_LIT` and the `--tp-in` channel are deleted with the pin.

⚠ **THE OVERLAP IS ARITHMETIC, AND IT IS THE OWNER'S SECOND ASK ANSWERED BY THE FIRST.** `#turn` is `100svh + 120svh` with a sticky stage, so `p = 1` exactly as its bottom reaches the viewport's; `#proposition` starts `--tl-prop-lead` (50svh) above that. So the record opens at `p = 1 − 0.5/2.2 = 0.7727` and is **half arrived at `p = 1`** — measured live at 0.77, matching to two decimals. It rises while the products leave (0.88 → 1.0). The blank frame is not patched; it is structurally unreachable.

⚠ **THE VEIL HANDS OVER RATHER THAN RACING.** `markVeil` stays additive: `veilOf` saturates at `p = 0.72`, before the arrival opens, so the turn takes the mark to 0.72 and the arrival carries it to `TURN_VEIL_PROP_MAX` 0.94, landing as the record does. The additive form was merely _safe_ under the pinned clock (`q` was 0 throughout); it is now load-bearing.

⚠ **AND IT DELETES A LATCH.** The pinned clock's one asymmetric failure was a section kept with its stage removed: `q` pinned at 0, `--tp-in: 0.000`, and the record invisible forever on the capable path. An arrival reads one rect and has no such state.

### 3 · One datum for every proposal head

`.arc-root[data-arc-format="proposal"] .arc-sec:has(> .arc-band > .arc-head)` takes `align-content: start` and `padding-block-start: var(--arc-head-datum)` = `clamp(48px, 10.7svh, 148px)` — the homepage services masthead's own 0.107, which is the value ADR-094 U5 solved for on this station before its pin was retired.

⚠ **`:has()` IS THE MECHANISM.** Only a beat that DRAWS a head takes the datum; chapter heads, interstitial callouts and the close band have no `.arc-head` and keep centring, which is what they are composed for.
⚠ **FORMAT-SCOPED, so `/arcs/suri-proposal` and `/arcs/perfect-ted-proposal` take it too** — deliberately: they have the same defect for the same reason, and a fix scoped to one client's page would be a rule that is true on one surface.
⚠ **THE COST, NAMED: the slack pools at the FLOOR of a short beat.** Air under a record reads as room; air above it reads as a mis-seat. Where a drawing then looks stranded, the drawing takes a share of the beat (`.arc-flow`'s `min-height`), never the head.
⚠ **THE GUARD ASSERTS THE EQUALITY, NOT THE VALUE.** A fixed frac passes at one viewport and lies at another; what was asked for is that the heads agree with EACH OTHER, at two viewports, with the datum's own value checked once and loosely.

### 4 · The `flow` kind — ADR-052's third enumerated exception

`{ head, brief, renders, scale, steps }`, rendered by `ArcFlow` as three hairline plates with two connectors: THE BRIEF (eight field rows, green ink on the labels), WHAT IT MAKES (three product renders), EVERY MARKET (the same render in four tagged frames). The grammar is the tools' authored wireframes' at page scale.

**It draws a record.** The eight fields are a real template's — the set mined from 340 briefs and 153 briefing docs of a working studio (`paid-social-praxis/references/briefing-grammar.md`) — and the renders are the client's own products, already on the page. ADR-078 U1's law holds: no arrow-and-box picture of an idea.

⚠ **THE SAME RENDER IN EVERY MARKET FRAME IS THE CLAIM**: one approved asset, localised. The first cut drew placeholder rectangles and said nothing.
⚠ **NO GOLD IN THE DRAWING.** The head's `em` has already spent the beat's one gold; three plates competing for the eye is the opposite of "keep it minimalistic".
⚠ **1px DIVS AND A BORDER PAIR FOR THE CONNECTORS, never an svg line** — a stroked single-axis path reports a zero-height rect and every collapse guard here reads that as absent (ADR-068 U6).

The bar ADR-072's dossier and ADR-098's configuration both cleared, and this clears: it cannot be said with the existing kinds, and it is one leaf with no state.

### 5 · Three roots, one lifecycle

`useNestedRoot(selector, node)` — the nested-`createRoot` lifecycle `ServicesPortal` and BEST-PRACTICES each paid a measurement for (cancel a pending teardown, reuse the root, defer the unmount one macrotask). The page mounts three of them now; extracted at the third rather than copied, the same argument `browseMap.ts` and `copyLaw.ts` make here. `usePropPick` is deleted — `ArcConfiguration` owns its picker on `data-cfg-*`.

## What this cost, and what it found

⚠ **`.arc-root` PAINTS AN OPAQUE GROUND, AND SCOPING THE TRANSPARENCY TO `.arc-section` MISSED IT.** The beat mounted over a coral field that the arcs' own page ground then covered, with a hard edge at the station's top (measured: the coral stopped dead at y 811 at 1920×1247) — laid out perfectly, on the wrong ground, with every geometry gate green. **An ancestor walk found it in one read; reasoning about z-index did not and would not have, because the layer was never a stacking problem.**

⚠ **THE SLOT MAY NOT CARRY `.tl-prop__inner`.** Left on, the station's own banding and the arc's `.arc-band` both applied and the instrument was squeezed into a column with the ground beside it. The station gives up its horizontal padding too — exactly as `#offer` does, one station down.

⚠ **A GUARD THAT MEASURED SINGLE-ELEMENT COVERAGE HAD TO CHANGE ITS QUESTION.** ADR-095 U6 asserted one ground covers 90 % of the frame, true while the proposal was a 160svh pinned station whose ground blanketed the viewport alone. Its record is a beat now, so past the release the coral FEATHERS (`TURN_PROP_FADE`) exactly where `#offer` begins painting — measured at release+0.7vh, the prop canvas reaches alpha 1 by y 998 and the offer's top IS 998. The guard measures the UNION of the painted bands now. Loosening the number until it passed was the alternative, and that is how a guard stops describing the page.

⚠ **`.arc-reveal` RESTS TRANSLATED, so a rect read before `is-in` measures the animation.** The datum guard passed solo and failed in a full run until it waited for the class and the transition.

## Left open

- **`--tl-prop-lead` is the one dial on the overlap** (50svh). Raising it starts the record earlier and eats further into the turn; the owner signed off on that beat, so it stays where it is until he reads this one.
- **The offer's copy is still Suri's, noun-swapped** — his own placeholder, to be rewritten.
- **The flow's centre plate shows the client's existing cutouts.** The engagement's own calibration wave holds eight GENERATED packshots on Drive; if the plate should show what the setup MAKES rather than what goes in, those are the assets.
- **Neither Figma file was readable** from this machine's Figma account (no edit access), which is why the brief's fields come from the practice's own mined record. If the template is opened later, the fields are one array to correct.

## Update 1 (2026-09-14, owner) — the hero joins the band

> The alignment of the hero one and maybe also the paragraph is not consistent with the alignment of the two text components in the other sections.

**§3 seated every proposal head on one vertical datum; this is the same complaint on the other axis, and it is the page hero that is out.** Measured across the whole page: `#about`'s title and paragraph land at **360**, and so do all nine proposal heads' title and copy. `.hero__content` lands at **192**.

⚠ **AND IT ONLY EXISTS AT HIS OWN VIEWPORT, WHICH IS WHY NO REFERENCE SHAPE EVER SHOWED IT.** Every banded text component rides ADR-048's editorial band: the station's `--hud-content-inset` padding PLUS `--rail-inset`, which lands the text edge on `--band-margin`. The hero takes the padding alone. `--rail-inset` is `--band-margin − --hud-content-inset`, i.e. **zero below the 1200px band's crossover** — so at 1280×720 and 1440×800 the hero and the band agree to the pixel and there is nothing to see, and the divergence opens only on a wide window. Measured hero/band: **129 / 129** · **145 / 145** · **192 / 360**.

**So the fix is to JOIN the band, never to re-inset the sections** — ADR-048's own standing clause is "never re-widen the inset per-section", and the sections here are the nine that already agree with each other and with `#about`. The recipe is the one `.proof__beat`, `.voidwalker` and the services masthead already use, verbatim: `margin-inline: var(--rail-inset)` on a block that is already inside a station's padding. The hero's own 680px measure is untouched, so the block moves and the type does not.

⚠ **ROUTE-SCOPED, AND THE HOMEPAGE HAS THE SAME DIVERGENCE — FLAGGED, NOT TAKEN.** A rule in `landing.css` lands on `/` and `/claude-workshop` (this route's first contract). It is not the same defect there: `/` runs hero → corridor, so the hero's neighbour is a full-bleed canvas rather than nine banded heads, and nothing sits beside it to be inconsistent with. `margin-inline` rather than `-start` because the band is symmetric by law; with a 680px `max-width` the outboard half costs nothing today and is what keeps the rule true if the measure ever grows.

**Files:** one rule, §3c of `app/(marketing)/arcs/trinny-london/proposal/trinny-london.css`.

## Update 2 (2026-09-14, owner) — the datum is solved from the frame's centre, and the head takes Linear's columns

> For our Trinny proposal page, I want you to look at the placement of the elements. Now they're positioned more toward the top, but our actual reference is the Linear website. If you look at the screenshot where you have an H1 on the left and a paragraph on the right, the elements feel nicely centered in the middle. I want you to analyze it, understand the logic, and then apply it.

**§3's datum was the right mechanism with a borrowed number.** `10.7svh` is the homepage services masthead's seat, solved for a beat with a different body. Measured live at his 1920×1247: every proposal head at **0.107** of the frame while the hero's headline sits at **0.305** and `#about`'s title at **0.285** — the nine heads 220–250px above the two seats that open the page — and under most bodies a bare floor: **418px** under the board, 359 under the phases, 566 under pricing, 647 under people, 743 under next steps. At 1280×720 the same beats are full or overflowing; this is a tall-frame defect, and §3's own "the slack pools at the FLOOR" was its name.

### What Linear does (fetched from `static.linear.app`, `PageSection.*.css` + `layout.*.css`)

| rule                             | value                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `.b-30Va_root`                   | `padding-top: 128px; padding-bottom: 128px` — the section is content-height and the page scrolls      |
| `.b-30Va_header`                 | `display: grid; grid-template-columns: 1fr 1fr; align-items: start; padding-bottom: 96px`             |
| title / description              | both `align-self: end` in row 1; the "Learn more" action in a subgrid row 2                           |
| `.b-30Va_titleContainer` / title | `padding-right: 32px`; `max-width: 18ch`                                                              |
| `.b-30Va_descriptionText`        | `max-width: 38ch` (≈ the column at 24px), left-anchored at the column start + 32px                    |
| type                             | title 48px / lh 1 / −0.022em; paragraph 24px / lh 1.33 — 2:1, two title lines = three paragraph lines |

**Nothing is centred against the viewport.** The "centred" read is a narrow band, two equal halves with the paragraph starting at the middle, and a figure filling the space beneath the header so there is no floor to see. On a page of viewport-tall frames "centred" and "one datum for every head" cannot both hold when bodies differ — so the owner was asked, with the three honest options drawn: each beat centred on its own (exact centres, heads landing 180–440px apart — his §3 ruling reversed, and the scene's two heads would need a JS-stamped shared seat); content-height sections, Linear literally (no floors, no deck); or **one datum solved from the frame's centre** — which he took, with the equal columns.

### The datum

`--arc-head-datum: clamp(48px, calc((100svh − var(--arc-head-composition)) / 2), 360px)` with `--arc-head-composition: 600px` on the root: `(H − C) / 2` is where centring a C-tall head + margin + body lands its head, and 600 is the page's mean composition at his viewport. One seat for every head, which is what he ruled; a seat that reads centred, which is what he asked.

| frame     | datum before | datum after | frac after |
| --------- | ------------ | ----------- | ---------- |
| 1280×720  | 77.0         | **60**      | 0.083      |
| 1440×800  | 85.6         | **100**     | 0.125      |
| 1920×1080 | 115.6        | **240**     | 0.222      |
| 1920×1247 | 133.4        | **323.5**   | 0.259      |

The two cross at 763h: laptops, already full, barely move (and the scene's plates GAIN 17px at 720h); tall frames do. Floors at 1247h on the Trinny page, measured above the beat's bottom pad: board 368 → **195**, phases 285 → **95**, flow 256 → 66, how-we-work 200 → 10, needs-keeps 279 → 89, pricing 410 → **220**, people 572 → 382, next-steps 668 → 478, appendix 213 → 11. Nothing on his page overflows at 1247h.

⚠ **C IS COUPLED TO ADR-102.** The scene's plates' feet sat at 718.5 of a 720 stage under the old datum, so C may not fall below 563 (a datum over 78.5 at 720h) without re-measuring the feet. The feet guard runs at 1440×800 now as well — the first reference shape above the 760h margin rung, where the full 9vh margin plus a 100px datum is the tightest tall budget on the page.
⚠ **GATED** to `(min-width: 961px) and (prefers-reduced-motion: no-preference)`, the exact complement of the format's `min-height` release: where a beat is not a frame the frame's centre means nothing, and an ungated 323px of top pad on a scrolling document is the mis-seat in the other direction. (Behaviour change under the release: the beat pads symmetrically with `--arc-sec-pad` where it took a 10.7svh top before.)

### The head

`.arc-root[data-arc-format="proposal"] .arc-head--split` takes `minmax(0, 1fr) minmax(0, 1fr)` (was `1.15fr 1fr`) and its `.arc-head__intro` stretches (`justify-self: stretch; max-width: none`, was `end` + `min(42ch, 100%)`). Measured at 1920: the paragraph moves from x 1147 (153px past the midpoint, 413 wide, four lines) to **x 996** (the midpoint plus half the 72px gap, **564 wide, three lines**); the coord stamp and the close cross stay on the band's edge because the column, not the text, carries them. The title's measure is its column too (`max-width: none` inside the same gate), which is Linear's own arrangement: their 18ch cap is their column. ⚠ **THE TITLE BUDGET IS TWO LINES, AND IT IS COPY DISCIPLINE, NOT A CAP** — his read of the first cut: the phases beat "feels a bit lower" than the board's beside it, with the heads on the same row. It was: a three-line title seats its body 48px lower than a two-line one under a shared datum, and the plates' foot then landed 75px under the board's. Linear holds its head band constant by budgeting the copy (18ch, and the break is AUTHORED — `Planning<br/>and monitoring` in the markup), never by moving the head. Measured against the 564px column at 1920: the 20ch cap resolved to 541 and cost `TWO PEOPLE, BOTH OF / WHOM DID THIS AT LOOP.` its second line (552 needed), so the cap went; the other three three-line titles needed 594–686 for two lines and no cap buys what the column does not have, so they were shortened on his choice from measured two-line candidates — `A modular approach / that compounds.` (was "We propose a modular approach …"), `How we work, / inside every phase.` and `Why not subscribe to / Higgsfield?`. Every title on his page is two lines or one at 1920 and 1440 now, the phases plates start on the board's row, and the scene's 720h budget GAINS 42px (that title 127 → 84 there). ⚠ Left as his copy: `Two people, both of whom did this at Loop.` still runs three at 1280×720 (482 needed against 485 by the canvas, and the browser wraps it) — laptop-only and pre-existing. On the three registered proposals `four-phases` and, at laptop widths, `films` run three lines too, and `scripts/new-arc/proposalTemplate.mjs` carries two of the old lines: flagged, not edited. ⚠ `--split` only, never `.arc-head` — a rule there at (0,3,0) flattens `--solo` and `--center` (0,1,0). ⚠ Gated at 901px — the stacking rung is (0,1,0) and loses on specificity from any position in the sheet. ⚠ **Not taken:** Linear's `align-self: end` — the two eyebrows hang 34px above each column's top and are the shared line; Linear's 2:1 ratio and 96px rhythm — not asked. ⚠ Left as a dial: on the two instrument-band beats (films, sheets) the column is 684px and the paragraph takes it; a `max-width: 60ch` belt on `.arc-head__copy` is the one-line answer if that measure reads long.

### The cost moved, and it is on three other pages

The format scope reaches `/arcs/suri-proposal`, `/arcs/perfect-ted-proposal` and `/arcs/hungry-minds-proposal` (§3's own ruling). Their `films` and `sheets` beats sized their console with pure `svh` clamps tuned under the old datum — measured 38 and 66px of floor at 1247h — so the new datum put them **111 and 42px past the frame at 1080h**. Both consoles take the `.arc-intel` budget as a second term now, `100svh − datum − stage-pad − 148 − head-margin`, **scoped to proposal roots**: a fallback would either invalidate the height on the portfolio (`auto`, the console collapsing with nothing throwing) or bind there at laptop heights and shrink its consoles 8–23px; scoping leaves the portfolio byte-identical. 148, not the intel's 124, because these titles run three lines at the band's 44px (145.2 measured). Cost: at 1247h the proposal console is 645px where it was 773 / 798, and its aspect-capped width follows. Measured after: films 3px of floor, sheets 50, at 1080h and 1247h on all three pages.

Long list beats grow past the frame instead — a `min-height` beat grows and the seam marks the next one: Trinny `how-we-work` +49 and `appendix` +34 at 1080h (nothing at 1247h); Hungry Minds `the-rule` +108 / `phases` +57 at 1247h and +167 / +114 at 1080h, both of which already overflowed at laptop heights before this pass. Copy trims are the answer there, not a smaller datum. ⚠ The dossier's head is inside `.arc-dossier__record`, so `:has(> .arc-band > .arc-head)` never reached it; it keeps centring, and the gap to its seated neighbours widens from ~20 to ~170px at 1247h — the housing fills the beat by design, so its head lands near the top anyway.

### The guard

The equality stands (three viewports now, 1440×800 added), and the value is checked **against the rule**: `#configuration`'s computed `paddingTop` equals `clamp(48, (innerHeight − C) / 2, 360)` with C read off the root's `--arc-head-composition`, never restated in the test. It catches a mis-resolution — a lost gate, a lost `:has()`, an `svh` that stopped being the frame — and cannot catch a taste change, which is the honest scope.

**Files:** `components/arcs/arcs.css` (the datum token, the gated rule, the head grammar, the studio budgets) · `tests/visual/trinny-london-smoke.spec.ts` (the datum guard's formula, 1440×800 in both loops) · `.claude/rules/arcs.md`, `.claude/rules/trinny-london.md`, `CLAUDE.md`.
