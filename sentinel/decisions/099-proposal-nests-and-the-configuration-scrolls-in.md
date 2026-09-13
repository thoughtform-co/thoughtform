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
