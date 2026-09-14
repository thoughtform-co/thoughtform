# ADR-100: The configuration is a board in two states

**Status:** Proposed (2026-09-13) — shipped and guarded, pending the owner's live read. ⚠ **[Update 2](#update-2-2026-09-14-owner--a-ledger-beside-a-board) (2026-09-14, owner) IS THE LIVE DRAWING** — the dormant side is a LEDGER, the lit side a board, and the record is four facts answered twice; read it and U1 before anything below. ⚠ **[Update 1](#update-1-2026-09-13-owner--no-radically-simplify-it) (2026-09-13, owner: _"no, radically simplify it"_)** — §2, §3, §4 and §6 below record the FIRST cut and are superseded where Update 1 says so; read it first.
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

## Update 1 (2026-09-13, owner) — "no, radically simplify it"

**The ruling.** The first cut shipped (`86f4be26`) and the owner's whole read was three words. Not a note on the copy, the colour or the box — the DENSITY: nineteen lettered strings on the dormant board and thirty-eight `<text>` nodes on the lit one, a substrate bed, two sockets and their note, two foot rows, hatched cables, four layer sentences, a second card row, and a crop that grew to the beat. The brief had said "without making it too complicated" and the first cut read that as a budget to fill rather than a ceiling to stay under. ⚠ The lesson generalises past this beat: when the owner asks for something simple, the FIRST cut is the minimal one, and the elaboration waits for him to ask for it.

**What went**, all of it in one pass: the bed (vias, meanders, ghost die); the two SOCKETS and "next, on the same layer" (the motherboard's second half is still the leitmotif — it comes back when the offer's cards are redrawn as parts, not before); both FOOT rows and their diamonds; the hatch bands on every ribbon; the four layer SENTENCES (the tags carry the layer, and the DORMANT layer letters no tags at all — "not written down" above an empty dashed module IS the reading); the card's second row (THE BAR); the tools' notes bar the lit item's; the height-elastic crop with its `ResizeObserver`, `fitExt`, `chain(e)` and `ArcBoardRow.tsx` (the kind is SERVER-ONLY now — no client island); and two of the dormant board's phrases, "and no creative strategist" (the dek says it) and "trained on, not wired in" (the islands say it by being islands).

**What stays:** two states side by side on one row, no plate; FOUR objects each — the seat, the layer, the card, the tools — one line apiece; three plain eight-wire ribbons on the lit board (the seat's drop in green, the layer's and the tools' runs in gold); the head strips on one datum; green = the human, gold = the built thing; the R4 module grammar (TR+BL cuts, the dawn lift, the 2-unit rule that stops at the cut, diamonds never circles); the arrival ladder, shorter (no bed, no sockets, no drops); and every guard's SHAPE.

**The numbers.** The crops are `560 × 414` (dormant) and `800 × 414` (lit), seam 40, row **1400** — so `meet = W / 1400` on both boards (was 1560) and the chrome rung of 15.3 units paints **11.2px** at the binding band (was 10.02: the shorter row bought a pixel). The chain: datum 26 · margin 14 · seat 92 · cable 52 · one module row 216 · margin 14 = 414. The dormant board letters **10** strings, the lit one **18** `<text>` nodes (17 strings, the answer wrapped once) — from 19 / 38. The svg sits at its own height (`height: auto` off the crop's aspect; `--arc-board-h`, `--arc-board-aspect`, the `max-width` and `--arc-board-head` are deleted), so the row is 1022 × 302 at 1280×720 and 1440 × 426 at 1920×1247, and **the beat's slack pools at the floor** — ADR-099's named cost, the one every plate beat on the page pays. §4's argument (290px of pooled slack at the owner's viewport) was measured correctly and is overruled: the owner would rather have the air than the machinery that fills it.

**Guards.** `arc-board-fit` walks ONE crop (no extensions), pins the label sets by `toEqual` (10 / 18), asserts three eight-wire lanes wall to wall, every module inside the inset and above the floor, and that the sheet declares no cap and no aspect. `trinny-offer` budgets ≤ 10 / ≤ 17 record strings and pins the shape: the dormant layer has no rows and a sub, the lit layer four rows; the card says ONE thing (a work line, or a question with its answer); a note rides the lit tool alone. `arcs-registry` walks the same shape for any registered arc. The smoke expects **24** wires (was 32) and the crop filling its box within 2px (was 8 — there is no extension to round). `BoardState` lost `sockets`, `foot`, `tools.note`, `layer.rows[].name` and `card.rows` (`card` is `{ name, work?, q?, a? }`).

**For the next pass:** the elaborate cut is one commit back with its bed, sockets, foot rows and elastic chain. If the motherboard's second half is ever drawn, start from the RULING, not from that commit — the parts that dock are the offer's cards, and what receives them is that pass's question.

## Files

`lib/arcs/types.ts` · `components/arcs/ArcBoard.tsx` (server, the whole row) · `components/arcs/board/{boardLayout.ts, boardGlyphs.tsx}` · `components/arcs/ArcSectionRenderer.tsx` · `components/arcs/chrome.tsx` · `components/arcs/arcs.css` (one block + two light rows) · `app/(marketing)/arcs/trinny-london/proposal/offer/{offerSections.ts, TrinnyBeats.tsx, TrinnyConfiguration.tsx}` · `tests/lib/{arc-board-fit.test.ts, trinny-offer.test.ts, arcs-registry.test.ts, arc-terminal-markup.test.tsx}` · `tests/visual/trinny-london-smoke.spec.ts`. `ArcBoardRow.tsx` is deleted (U1).

## Update 2 (2026-09-14, owner) — a ledger beside a board

**The ruling, in four notes and one instruction.** On the live U1 drawing: the title and the dek should be more concise; "As it runs today" **should not look so similar to** "With a configuration" — "it should be a contrast like before and after, but without implying they're unorganized"; WHERE IT RUNS should list Figma at the same level as the other tools; the diamond above THE STUDIO comes off; "The studio lead / the founder's sense-check last" is "cringe", make it ONE sentence; THE LAYER becomes THE CONTEXT; and the centre node and its pair should be "way more simple" — "as you know they want to build out this capability in-house and that's what's at the heart of it. Maybe the right side should be AI-capability, owned by the team". Then: **"AND REALLY DO A FUCKING SENSE CHECK IN THIS SECTION because it feels sloppy."**

### 1 · The two sides stop being the same picture at two brightnesses

U1 drew the dormant side as the lit board's own modules, dashed. Every guard was green and the arithmetic was right, and it still read as one drawing greyed out — because it WAS one drawing greyed out. A before/after asks for two kinds of object, not two states of one.

**LEFT is a ruled LEDGER**: four rows off the crop's own inset, a mono key and a sans value each, a hairline under every row and the last closing on the board's floor. No housing, no cut, no cable, no colour. It says the four facts are _written down and connected to nothing_ — which is the client's actual position — and it says it without the dashes, hatches and empty rooms that read as disorder. **RIGHT is the BOARD**: the same four assembled and wired.

⚠ **Both sides share the datum and the floor** (y 26 and y 400), so the two drawings agree on where the reading starts and stops while agreeing on nothing else. That is what keeps them one instrument.

### 2 · The record is FOUR FACTS answered twice

`BoardState` stops being a board's parts list and becomes the four questions: `seat` (who owns it), `layer` (the context), `card` (the work), `tools` (where it runs). Each carries one key and one value on both sides, so the copy is written as four pairs and the DRAWING is what differs. `seat.note`, `card.q`, `card.a`, `tools.items[].note` and `tools.items[].lit` are deleted — the seat is one sentence (the "cringe" pair), the card is a name and a line, and the tools are peers.

⚠ **THE HEART OF THE RIGHT SIDE IS THE CAPABILITY, NOT A WORKSTREAM.** The lit card was `THE STUDIO` / "What runs it" / "A brand Skill, on the team's own keys" — a workstream with a tool in it. It is **`AI CAPABILITY` / "owned by the team"** now, drawn as a CHIP on the lane row (264 × 104, centred on `cy`) so the three ribbons meet its middle rather than its corner. What they want is the capability in-house; the board's one lit object should be that and nothing else.

⚠ **FIGMA IS A PEER.** It was a note on a lit CLAUDE ("inside Figma"); it is the second of four tool names now, at the context's own tag pitch, and both sides letter ONE list — the ledger joins the four names into a row, the board letters them as four.

⚠ **NO DIAMONDS ANYWHERE.** `BoardDiamond` and `Diamond` are deleted. The drawing marks nothing with a glyph; the chip's gold wash is what says which object is the built one.

### 3 · The copy

Title `The studio today, and *configured.*` (was "The studio today, and the studio configured."). Dek: _"The teams are trained on Claude, but nobody owns AI as their day job and the studio still works by hand. Left, the studio as it runs today. Right, the same studio with its configuration seated."_ — 190 characters from 360, and it stops restating what the turn above already said.

### 4 · The sense check, and what it found

- **A doubled rule.** The ledger's first row ruled its top 14 units under the head's own datum: two full-width lines in one place, ADR-089 U3's defect in a new object. Every row rules its BOTTOM now and the datum opens the ledger.
- **A hyphen break on the turn** (Part 2 of the same pass): `self-sufficient` split across its own hyphen at `44ch`, which is ADR-098 U1's finding one beat over. The sub's measure is 52ch.

### Guards

`arc-board-fit` pins the label sets by `toEqual` (**nine** on the ledger, **sixteen** on the board), asserts every dormant module is a `row` with no cut and no lane, the three eight-wire ribbons meeting the chip's centre line, and — new — **that no lettered string carries a digit**, because the ledger's tools row is COMPOSED at draw time and a string built in a renderer is outside every content scanner (ADR-070 U15's `8 TEAMS`). `trinny-offer` and `arcs-registry` check that every fact is answered on both sides and that the two sides answer with DIFFERENT words. The smoke asserts the ledger draws zero modules and the board zero rows, zero marks on either, 24 wires, and pins the rendered counts `[9, 16]` live.

### Files

`lib/arcs/types.ts` · `components/arcs/board/{boardLayout.ts, boardGlyphs.tsx}` · `components/arcs/ArcBoard.tsx` · `app/(marketing)/arcs/trinny-london/proposal/offer/offerSections.ts` · `tests/lib/{arc-board-fit.test.ts, trinny-offer.test.ts, arcs-registry.test.ts}` · `tests/visual/trinny-london-smoke.spec.ts`. No CSS moved: the row keeps its bases (560 + 40 + 800 of 1400) and its ladder.

## Update 3 (2026-09-14, owner) — the ledger is read slower, and the board's own ladder was dead

> The elements from the studio today should move a bit slower into view.

**The two sides are not the same kind of arrival, so they should not run at one speed.** The lit board ASSEMBLES — the chip, the seat, the ribbons drawing on, the modules lighting behind them — and its rungs overlap into one gesture. The ledger is FOUR ROWS READ IN ORDER, and a row landing before the eye has taken the one above it is a list that flickered rather than a record being written. The dormant ladder goes from 0.42s at an 80ms stagger to **0.72s at 140ms** (delays 160 / 300 / 440 / 580), so its last row lands at 1.30s against the board's 0.92s. The ledger finishing last is the point, not a mis-tune: it is read first and read slowest.

⚠ **AND MEASURING IT FOUND THAT THE LIT BOARD'S LADDER HAD NEVER RUN.** U1's rungs are written `.arc-board.is-in [data-board-role="card"]` — two classes and one attribute — against the rule that STARTS the animation, `.is-arc-js .arc-board.is-in .arc-board__in`, which is four classes. The shorthand wins on specificity, and **`animation:` resets `animation-delay` to zero**. Measured on all five roles at three viewports: every configured module arrived on the same frame. The dormant rungs carry a SECOND attribute (`[data-board-state="today"]`), which ties the shorthand and wins on source order — which is the only reason that half worked, and why the defect was invisible: one board staggered, and nobody had a reason to check the other against it.

⚠ **A DELAY THAT DOES NOT APPLY FAILS SILENTLY.** Nothing errors, nothing logs, the still is identical, and the result reads as a taste decision rather than a bug. The fix is to scope every lit rung `[data-board-state="configured"]` — the cheapest honest way to the fourth component, and it says WHICH BOARD the rung belongs to, which the selector could not say before. A `!important` would have worked and would have said nothing.

**The guard is the durable half.** The smoke reads both ladders off the computed style, sorts each by delay and asserts it is STRICTLY INCREASING — a dead rung collapses to zero and fails — then asserts the ledger's last rung waits longer than the board's and each ledger row takes longer than a lit module. Both properties, from both ends: the contrast the owner asked for cannot be tuned away, and neither ladder can die again in silence.

**Files:** the `.arc-board*` arrival block in `components/arcs/arcs.css` · `tests/visual/trinny-london-smoke.spec.ts`. No record, no layout, no type.

## Update 4 (2026-09-14, owner) — the board joins the band, and the capability scales out

> The studio today is configured — if you compare the margin on the left where it's positioned and also the paragraph on the right, in that section it is a bit more centered versus the other sections. Please make that consistent. "We propose a modular approach that compounds" — that positioning, which we also have in all the sections below, is the gold standard. … the paragraph section on the right needs to be a bit higher. Maybe I'm just seeing things. Let me know if I'm incorrect here. … On the right side, AI capability owned by the team — I think we need a connector at the bottom as well that says something about the fact that it can be scaled and plugged into other parts of the business, because that's the entire thing. I don't think we need the lines "as it runs today" / "with the configuration" or the dividers. … The AI capability card has a notch in the bottom-left corner. We don't need that because the cards in the subsequent section don't have it either.

**He was not seeing things, and the object he named was not the one that was out.** Measured at his own 1920×1247: the configuration's head and the phases' head are PIXEL-IDENTICAL — title at x 360, copy at x 1146.7, both at the same y. What differed was the DRAWING. The board row sat on the 1440px INSTRUMENT band (240–1680) while its own head and every plate beat below sit on the 1200px TEXT band (360–1560), so the head read 120px inboard of its own drawing on each side. And the beat carried its own `--arc-board-gap`, which put the drawing 45px under the dek where every plate beat's sits 143px under its own — which is what "the paragraph needs to be a bit higher" describes from the other end: a paragraph with no air under it reads as sitting low in its own block.

⚠ **AND IT ONLY EXISTS ABOVE THE ~1503px BAND CROSSOVER.** `--band-margin` is `max(--hud-content-inset, (100vw − 1200px) / 2)` and `--instrument-margin` the same against 1440, so the two bands COINCIDE at 1280×720 and 1440×800 and diverge only on a wide window. Every reference viewport in this repo sits below the crossover; the defect was visible on his monitor and nowhere else. The same shape of finding as ADR-099 U1's hero, the same week.

**The row takes `.arc-band`**, and U2's "two bands, deliberately" is reversed. The cost is the meet: 1440/1400 → 1200/1400 at 1920, so the chrome rung paints **13.1px** rather than 15.7 against a 10px floor. Below the crossover nothing moves. And the beat's head-margin override is DELETED — its 36px floor existed to keep the head's coord stamp off the board's DATUM LABEL, and that label is gone (below), so the clause has no subject.

### The strips and the datum go, and the crop gets one inset

The two head strips (`AS IT RUNS TODAY` / `WITH A CONFIGURATION`) and the hairline under each are deleted with the `head` role, `headLetter` and `BoardGeom.datum`. The head's own dek already names the two sides — "Left, the studio as it runs today. Right, the same studio with its configuration seated" — so the strips were the same sentence twice, in the drawing's own chrome, where this surface has removed a console head, a foot and a designator for exactly that (ADR-063 U1). `DATUM_Y` and `MARGIN` collapse into `TOP_Y = INSET`: **one 24-unit inset on all four sides of both crops**, which is R4's own "the crop is the frame" read strictly.

⚠ **AND THE LEDGER NOW OPENS UNRULED.** U2's rows rule their BOTTOM because the datum opened the ledger and a rule 14 units under it would have painted as one doubled line (ADR-089 U3's defect class). With the datum gone the reason changes but the rule does not: a hairline at the crop's own top is a line with no object over it. The last row still closes on the board's floor, which is the one horizontal the two drawings share.

### A fifth fact, and the board becomes a cross

`BoardState.reach: { label, value }` — `WHERE IT SCALES`, answered on BOTH sides: **"not past the studio"** on the ledger, **"into the rest of the business"** on the board, drawn as a module the seat's own width under the chip, fed by a fourth eight-wire gold ribbon out of the chip's floor.

⚠ **BOTH SIDES, NOT THE BOARD ALONE** — U2's law is one record drawn twice and `trinny-offer` asserts every fact is answered on both. A claim the before side does not answer is one the reader cannot measure against anything, and this is the claim the beat exists to make.

⚠ **AND THE RUNS ARE THE SAME LENGTH.** `GAP2 = GAP1` (52), so the seat's green drop IN and the gold run OUT are both 108 units and the drawing is a CROSS centred on the chip: the human above, the reach below, the context and the tools at its sides. The one lit object is the centre by construction rather than by placement — which is what the owner means by "that's the entire thing". `VB.h` 414 → **548**; the ledger's pitch is `(FLOOR_Y − TOP_Y) / 5` = **100** exactly, so the chain's identities stay integer.

### The chip loses its bottom-left corner

`BoardModule.notch?: "tr"` on the chip alone; `Module` draws the kit's `band()` path for it, which IS a housing cut top-right and squared at its floor — byte-identically the silhouette of the offer's phase plates (ADR-098 U5). Every other object keeps ADR-065's canonical TR + BL.

⚠ **A LONE NOTCH IS LAWFUL HERE BY RULE 5, NOT IN SPITE OF IT.** A single notch MEANS oriented-or-connected, and this is the one object four ribbons meet — and the one that becomes the plates one beat later. ⚠ Two corner grammars on one drawing is an owner-visible choice; if the mixed set ever reads as inconsistent the fallback is every board plate TR-only, which is one flag.

### What the measurements found that nobody asked about

⚠ **THE LEDGER'S ROWS WERE ARRIVING OUT OF ORDER.** U3 set the dormant delays 160/300/440/580 — but in the LIT board's role order (card before layer), so the ledger arrived **1-3-2-4**. A ledger read out of order is the one thing a ledger may not do. The smoke could not see it: it SORTED the rungs by delay before asserting they increase, which is a walk that can only find a dead rung, never a mis-ordered one. It reads them in DOM order now, and the rungs are seat 160 · layer 300 · card 440 · tools 580 · reach 720 (last row at 1.44s against the board's 0.98s — U3's "read first, read slowest" intact).

⚠ **AND THE DATUM GUARD'S SEAT WAS A BET ON A SCROLL.** `seatOf` rolled twice on the reasoning that the first roll is clamped while the corridor inflates the document (5,490px of growth measured at 1280×720 between the two). Two is not a number, it is a guess: the test navigates the SAME url a second time at a new viewport, Chrome restores the previous scroll across that reload, and `rollTo` then reads `from` deep in the page and walks the wrong way. It failed on the SECOND viewport with the first green — the shape that reads as a page defect and is a harness one. It rewinds to the top and CONVERGES on the beat's own rect now (≤ 2px, four passes).

### Files

`lib/arcs/types.ts` · `components/arcs/board/{boardLayout.ts, boardGlyphs.tsx}` · `components/arcs/ArcBoard.tsx` · `app/(marketing)/arcs/trinny-london/proposal/offer/offerSections.ts` · the `.arc-board*` block in `components/arcs/arcs.css` · `tests/lib/{arc-board-fit.test.ts, trinny-offer.test.ts}` · `tests/visual/trinny-london-smoke.spec.ts`.

Pins that moved, all in one commit: the label sets **9 → 10** and **16 → 17** (`toEqual`), the live counts `[9, 16]` → `[10, 17]`, wires 24 → **32**, ledger rows 4 → **5**, rungs 4 → **5**, the budgets 12/15 → **14/17**, `BAND_PX` 1440 → **1200** at both wide shapes. New: the chain's five identities, the corner pinned from both ends (`card.notch === "tr"` AND every other module `undefined`), the two runs' equal length, the ledger's DOM order, and — the owner's ask made mechanical — **the drawing's left and right edges within 1px of its own head's**, plus the head's `margin-bottom` equal to the phases head's.
