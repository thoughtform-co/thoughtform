# ADR-100: The configuration is a board in two states

**Status:** Proposed (2026-09-13) — shipped and guarded, pending the owner's live read.
**Surface:** `#proposition` on `/arcs/trinny-london/proposal` (ADR-093 → ADR-094 → ADR-099).
**Supersedes on this page:** ADR-098 §4's port of the pitch page's instrument (ADR-094 U7). `ArcConfiguration` is untouched and still renders the registered proposals.
**Related:** ADR-070 U11 (the R4 substrate field), ADR-070 U12 (the elastic crop), ADR-076 (the aspect cap), ADR-065 (the corner law), ADR-077 (the arcs' ink ramp), ADR-099 (the datum).

## The ask

Owner, 2026-09-13, on the Trinny configuration beat: it "doesn't look bad, but it's a lot of things to look at"; the beat is really the PROBLEM STATEMENT and the title should say so; the LEFT should be their current status, kept simple, and the RIGHT "how their own configuration could look" — an expanded, more advanced version of the proof's intelligence configuration, "without making it too complicated"; NOT in frames ("if every section has the same type of frames or is just text, it's difficult for them to parse"); more visual; the source of the grammar is Cyberpunk 2077 / sci-fi FUI (four references: an FUI dashboard, the Evangelion lane board of grey-against-lit cartridges, the CP2077 bio-monitor diamonds, the CP2077 inventory board); the MOTHERBOARD is the leitmotif — the configuration is the board, and later the offer's module cards should read as parts that slot into it. "First focus on the Trinny London configuration. Let's use our creativity and imagination."

The content came from the discovery call (2026-09-09, Sarah / Vince): the founder is "AI obsessed" and wants AI-first for productivity; hackathons and Claude training, then "we've kind of lost momentum"; "no in-house expertise, no single ownership to make it happen"; AI transformation "is like a Friday afternoon job"; "all of our creative studios are 100% in-house … not using AI in a way that we could"; creative strategy is the bottleneck (no creative strategist); the ask is creative OPERATIONS, not content creation; the founder's two agents — a brand sense-check before anything reaches her, and the customer's voice in every meeting; Monday → Figma → Claude, Slack.

## What was measured

- The band the drawing gets (`.arc-band--instrument`, derived from `landing.css`'s inset chain): **1022px** at 1280×720 · **1151px** at 1440×800 · **1440px** at 1920 and above.
- The beat's vertical budget under the ADR-099 datum, with the arc's DEFAULT head margin and pad: **385px** at 1280×720 — a box that would have shrunk the drawing to 953px wide and the chrome rung to 9.35px. With the beat paying for its instrument (`.arc-sec--intel`'s precedent — `--arc-sec-pad: clamp(28px, 4vh, 72px)`, the head's margin `clamp(36px, 3.4vh, 48px)`): **440 / 505 / 735 / 871px** at the four shapes.
- The previous panel lettered ~34 strings inside one framed plate. The dormant board letters **19**, the lit board **38** `<text>` nodes (31 strings, some wrapped) — inside a budget the guard holds (today ≤ 18 record strings, configured ≤ 32).
- Rendered: the row is **1022 × 440** at 1280×720 with `meet` 0.655 on BOTH boards and the chrome rung at **10.02px** (the floor); at 1920×1247 the row fills **1440 × 871** with the crops grown by **314 units** and no slack under the drawing; the beat holds ONE viewport at 1280×720 (720px measured).

## Decision

### 1 · A `board` kind — the fourth enumerated exception

`{ kind: "board"; head; states: [BoardState<"today">, BoardState<"configured">] }` in `lib/arcs/types.ts`, rendered by `components/arcs/ArcBoard.tsx` (server) over `components/arcs/board/` (`boardLayout.ts` pure, `boardGlyphs.tsx`, `ArcBoardRow.tsx` the one client island). Dispatched in BOTH `ArcSectionRenderer` and the Trinny page's own `TrinnyBeats` switch (which drops `configuration` — the page no longer draws it). The bar ADR-052's exceptions clear: eight-conductor ribbons with 45° bends and opaque chamfered modules on a bed are path geometry no existing kind draws, and it is ONE leaf with no picker and no listener — stricter than the configuration's. `ArcConfiguration.tsx` and `.arc-cfg*` are byte-identical; the Suri, Perfect Ted and Hungry Minds proposals still render them.

### 2 · One instrument, two states

The proof's R4 grammar (ADR-070 U11) at page scale, drawn twice on one row with no plate around it: opaque chamfered modules (TR+BL, the module cut R4's 12, the card the plate rung 20) with a dawn lift and a 2-unit top rule that STOPS AT THE CUT, eight-wire hatched ribbons at pitch 4, a faint substrate bed, diamonds never circles, and the role law — **gold is the built thing, green is the human and nothing else.**

- **LEFT · AS IT RUNS TODAY** (620 × 630 units, 40 % of the row): the same regions, dormant — dashed dawn outlines, no ribbons, no bed. The seat empty ("No one, as their day job"), the layer's four cells tags only under "nothing written down" (the dashed room IS the reading), the card GREEN-outlined ("all by hand, and no creative strategist" — everything is person-led), the tools as three unwired islands with "trained on, not wired in". Foot: `NO OWNER · BY HAND · UNWIRED`.
- **RIGHT · WITH A CONFIGURATION** (900 × 630, 58 %): the seat green with its rule and wash ("The studio lead" / "the founder's sense-check last"), the layer's four cells lit and named (the record's own rows), the card the ONE lit object (gold wash + `--gold-line` stroke; WHAT RUNS IT / THE BAR), WHERE IT RUNS with CLAUDE lit (a filled diamond, `--gold-ink-lit`) beside MONDAY and SLACK, and two dashed empty SOCKETS on the card's own silhouette — `CREATIVE OPS` · `FINANCE`, "next, on the same layer". Ribbons: the seat's authority drop in green, gold runs to the layer and the tools, two dashed four-wire drops with 45° jogs into the sockets. Foot: the previous panel's own kickers.
- Each board hangs from a head strip and sits on a foot row — the references' one constant, a datum and a terminus — so the drawing is bounded by chrome that belongs to the device, not by a box.

**The module ↔ offer mapping the sockets prepare:** M1 builds the board (its deliverable IS "the creative intelligence configuration"); M2 and M3 are the cards that dock into it. The later pass the owner named — the offer's plates redrawn as parts — has a socket to dock into.

### 3 · The box is width-led, and its aspect is the contract

The two crops share one height and every share is a fraction of 1560 (620 + 40 + 900), so `meet = W / 1560` on both boards at every viewport and both head strips sit on one datum. The row's height is the beat's budget (the `.arc-intel` contract: `--arc-board-h = max(413px, min(clamp(400px, 72svh, 960px), calc(100svh − datum − head − gap − pad)))`) and `max-width` is that height × 2.4762, so the box can never be shorter than the crop and `meet` can never letterbox on width. The 413px floor is the drawing's own height at the binding band — a short window lets the beat run past one viewport rather than the type fall under 10px (ADR-070 U10 ranks the floor above the fold).

### 4 · The crop is height-elastic (ADR-070 U12, applied before he had to say it)

A fixed crop pools 290px under the drawing at the owner's own 1920×1247 — 20px past the 270 that forced U12 on this drawing's family. `ArcBoardRow` reads the row's aspect with one `ResizeObserver`, hands `fitExt({ cropW: 1560, cropH: 630, maxH: 320 })` the extension, and `chain(e)` spends it the way R4 does: the cable, the cells, the tool items and the drops grow; the margin is the remainder split. SSR renders `e = 0` — the fixed crop, seated whole by `xMidYMid meet` — so no-JS is the same drawing with its slack split. Side by side only: below 961px the boards stack and the extension is zero.

### 5 · The arrival is CSS, and no-JS renders lit

Keyframes copied from `pda.css` (`arcBdIn` / `arcBdBloom` / `arcBdWire`), gated on `.is-arc-js` + `.is-in` + `prefers-reduced-motion: no-preference`, on a delay ladder: head and foot 0 → bed 60 → the card BLOOMS at 140 (the one bright object first; the board assembles outward from it) → seat 220 → the ribbons draw on 300–540 → layer 420 → tools 500 → sockets 580; the dormant board a plain fade ladder. The wrapper's own `.arc-reveal` rise is overridden — the ladder IS the arrival. Every dormant rule sits under `.is-arc-js` inside `no-preference`, so no-JS, reduced motion and terminal render the lit state.

### 6 · The type is set against the rendered size, and fit is declared

R4's ranking kept (name > value > head > key > chrome: 24 · 18 · 16.6 · 15.8 · 15.3 units), its rungs lifted ~1.27× so the chrome rung paints 10.02px at the binding band; the lost range bought back in ink alpha. `boardGeom` emits every `<text>` WITH the measure it must fit (mono via `adv`, sans via a 0.55 em cell; a wrapped line past its cap declared at measure 0), and `tests/lib/arc-board-fit.test.ts` walks it at six extensions, plus the longest word, the floor, the chain's closure, each letter inside its own module, the lanes wall to wall, the roles, the label SETS pinned, and the CSS box's parity with the crops. The smoke's viewport loop (1920×1247 and 1280×720) measures the rendered svg: ≥ 10px, zero label-on-label overlaps, one `meet` on both boards, the crop filling its box, the row inside the band and the beat, one viewport at the laptop.

### 7 · Copy

The head: eyebrow "Trinny London · where the studio stands", title "The studio today, and the studio _configured._", a dek that states the call's findings and names the two states. The `today` strings are the call's own words in roles, never names; the `configured` answers are the previous panel's, kept where they survive. All of it is the owner's to rewrite — the copy law and the fit guard re-walk any change. No digit, no bracket, no em dash.

## Alternatives rejected

- **A DOM drawing of 1px divs** (the flow's law). Eight-wire ribbons through 45° bends are path geometry; the arcs' own SVG precedent (`ArcIntelligence`) already owns its box through an aspect cap, which is the mechanism here too.
- **Mounting `ViewConfiguration` with a Trinny record.** Its tokens resolve only under `.fl-pda` + `.fl-con`, its layout carries three test contracts (`pda-card`, `pda-viewbox`, `pda-flight`), and it draws ONE Loop workstream — not a before/after. The GRAMMAR is copied by hand; the pure modules (`ribbon.ts`, `pdaLetters.ts`, `pdaFit.ts`, `housing`/`band`/`MODULE`) are imported.
- **Extending `configuration` with `states`.** It would fork the picker contract three registered arcs depend on.
- **A picker, or hover lighting a lane, in v1.** The owner's complaint was density; one drawing with no controls answers it. Hover is an open option.
- **A third state, or a smaller crop with the layer sentences as tooltips** (an engineering plan's 340-unit crop). The record IS the sentences.
- **Fixed-crop slack split above and below.** Kept only as the SSR fallback; see §4.

## Open

- The offer's plates redrawn as parts that slot into the sockets — the leitmotif's second half.
- Hover lighting a module's lane (R4's `lit`/`onLit`), if the owner wants the instrument to answer the pointer.
- Dark is DEFINED by the ramp (every token aliases a themed rung) but UNVERIFIED — the one route that mounts the kind is light-locked.
- `--arc-board-head: 150px` is a measured literal (the head runs 127px at 1280×720 with this copy); a rewritten head re-measures it.
- The dormant board's copy is blunt by design ("No one, as their day job"); the owner reads it before the client does.

## Files

`lib/arcs/types.ts` · `components/arcs/ArcBoard.tsx` · `components/arcs/board/{boardLayout.ts, boardGlyphs.tsx, ArcBoardRow.tsx}` · `components/arcs/ArcSectionRenderer.tsx` · `components/arcs/chrome.tsx` · `components/arcs/arcs.css` (one appended block + two light rows) · `app/(marketing)/arcs/trinny-london/proposal/offer/{offerSections.ts, TrinnyBeats.tsx, TrinnyConfiguration.tsx}` · `tests/lib/{arc-board-fit.test.ts, trinny-offer.test.ts, arcs-registry.test.ts, arc-terminal-markup.test.tsx}` · `tests/visual/trinny-london-smoke.spec.ts`.
