# ADR-126: The proof reads as the practice, and the offer leads — one flow from the arc to the booking

- **Status:** Proposed (2026-09-26, owner) — shipped and guarded; flips to
  Accepted once the owner has read it live.
- **Surface:** the landing after the corridor: the epilogue
  (`CorridorStationHeaders.tsx`, `MobileEpilogueSignal.tsx`), the proof pile
  (`proof-stack/proofOrder.ts`, `lib/cases/content/loop-earplugs.ts`), the map
  card's console (`casefile/map/pda/**`, `lib/cases/types.ts`,
  `mapProjection.ts`), the services masthead (`serviceData.ts`) and the
  Embedded card's baked face (`servicePlateData.ts`, `ServicesCardRing.tsx`).
  The Trinny proposal and the portfolio arc mount the same pile and console.
- **Supersedes:** [ADR-124 §3](124-the-last-card-claims-the-expansion.md) (the
  third reading — its own Left open named the prompt-tool-agent reading now
  taken up); [ADR-085 U2](085-proof-design-pass.md)'s "the estate at a glance
  is all twenty" on reading 01; [ADR-044](044-services-masthead.md)'s 2026-09-14
  line on the epilogue (the masthead keeps it). ADR-094 U2's arc field, ADR-112
  U1's order (Embedded leads), ADR-124 U1's fourth title and Embedded copy all
  stand.
- **Related:** [ADR-097](097-proof-card-is-a-folder.md) (the folder card),
  [ADR-069](069-pda-selection-morph-and-answered-configuration.md) (the flight
  from reading 01 to 02, kept), [ADR-070 U35](070-configuration-is-a-switchboard.md)
  (a losing drawing stays on disk until the winner is read live),
  [ADR-107 U2](107-the-proof-card-is-two-sheets-on-a-phone.md) (the phone's
  lists, now two), [ADR-111](111-the-embedded-card-carries-the-configuration.md)
  (the copy law on the Embedded card, untouched).

## The ask

Owner, 2026-09-26, the message and the Wispr Flow note "Thoughtform proof
services redesign", after the Pandora debrief with Rob (25 Sep), the Suri
kick-off (21 Sep) and the Samako syncs (23–24 Sep):

> "the core offering of all of this is that we built that intelligence
> configuration inside a team and made the team self-sufficient. Right now the
> problem with the services is that it feels like a portfolio. It just feels
> like a step but actually that is the deliverable."

> "I feel the services card [Embedded] is actually the main card. I think the
> keynotes and workshops are less important cards. That's why I changed the
> position: that's the main one. I think we can also highlight it a bit."

> "in the proof section maybe we need to make the team self-sufficient the
> third card instead of the second. That way we build up with: 1. Prompting 2. Tools 3. As we do this, we make it self-sufficient and then build the
> layer the agents run on"

> "You have a work configuration layer. I feel it's a bit too much, especially
> the layer. It doesn't really come across … I do think that the configuration
> is the cleanest thing so maybe we only need two tabs … maybe we can reduce
> the number of cards in the work and maybe really show some axes."

> "my main audiences are marketing and studio teams … it's clustered around
> creative production, creative operations, and creative review. Maybe we can
> rewrite the cards we have there and really cluster it like that so that when
> people see it they immediately see, 'Hey this is actually representative of
> our marketing team.'"

The note: "I think we can reword it in a way that shows how it would look in
practice and illustrates that with the Loop cases … so it doesn't feel like just
a portfolio summary, but more like something they could see themselves doing
with me." And the note's own open question — is the embedding the goal at the
head of the proof, or the end state on the third card — which he answered
(AskUserQuestion, same day): the epilogue becomes the goal, the masthead keeps
the proposition, card 3 is the end state.

The clients said the same from their side. Rob, on Pandora: the offer is
adoption-led, "you say yourself you want to become dispensable after a few
months, using the tools we already have. We love that"; buyers ask for the
business case and a saleable case study. Suri: the creative workstream running
by itself in two months, inside Claude, Monday and Figma, embedded on the ground.

## What the record already said

- The offer, in the owner's words, was on record since ADR-124: "me coming into
  a company, embedding myself in the teams, looking at their marketing setup,
  and then building all the tools around it. It goes from creative production to
  creative operations, but also creative review." The site's copy had not
  caught up with that sentence.
- The Dublin keynote (`loop-intelligence configurator/content/keynotes/
think-global-dublin.ts`) already told the four steps in the PRESENT tense —
  "We push the frontiers of AI creative · We make the creative team
  self-sufficient · We build the tools the work needs · We build the layer the
  agents run on" — while the site told them in the past.
- "AI CAPABILITY / YOUR TEAM OWNS." printed twice: as the corridor's epilogue
  (ADR-044's 2026-09-14 line) and as the services masthead, with the whole
  proof pile between. It is the proposition (the one-pager's own title,
  `proposition-one-pager`), and it belongs above the offer.
- The record's `cfg.a` (the run mode: Chat assistant · Editor plugin · Briefing
  agent · Image + video suite · Scheduled agent · Coding agent) is the
  prompt → tool → agent position of every configured stream, on record. A
  drawing of it plots what happened rather than a metaphor.

## The ruling

Three frameworks stay distinct and stop conflicting: the arc is the vision (how
we work, untouched), the epilogue hands its goal to the proof, the proof is how
it looks in practice with Loop as the illustration, the services beat is how to
book it.

### 1 · The pile is the practice, in the owner's order

`PROOF_STACK_ORDER` is `atl-films · tooling · studio · ai-transformation`: the
frontier, the tools, the team that runs it, the layer. The four titles are the
keynote's, word for word, in the present tense — a reader sees the practice,
not a portfolio of what was done. Card 3's "self-sufficient" is the owner's one
allowed use of the word (ADR-124, left open). The ledes follow: the films card
carries the boundary he named ("push the frontiers … and set boundaries"), the
tools card names the three bottlenecks (production, operations and the review
between them), the studio card is the end state (embedded "until the team runs
it alone"), the map card points at its new reading.

⚠ At Loop the studio (Dec 2025) preceded the tools (Feb 2026); the Suri deck
tells it by date. The pile tells the trajectory every team is on; the cards
carry no dates, so nothing on the page contradicts the record.

The map card's head band reads `LOOP EARPLUGS · BUILD` like its three siblings:
`stamp.phase` was `Navigate`, a leftover from before the card became "we build
the layer". `stamp.ref` (`NAV-01`) identifies the record and never moves.

The Trinny proposal keeps sharing the order — it is the record's own
(`arc.step` is asserted equal to it), and a per-host order would need per-host
steps the record cannot carry.

### 2 · The epilogue hands the goal to the proof; the masthead names the offer

The epilogue's title is **"WE EMBED IN YOUR TEAM / UNTIL IT RUNS WITHOUT US."**
on both surfaces, over the ticker (whose four headlines argue for embedding)
and the unchanged CTA `HOW IT LOOKS IN PRACTICE`. "Runs without us" is the
behaviour, said the language bank's way.

The services masthead keeps **"AI CAPABILITY / YOUR TEAM OWNS."** — the
proposition, above the offer — and its intro names the embedded engagement as
what is sold and the three formats as the way in: "We embed in your marketing
team and build the setup it runs by itself, from creative production to
review. A keynote, a workshop or a home session is the way in." (161 characters
against the phone band's fit gate.) "Creative" is allowed on the masthead; the
ban is the baked face and the phone back (ADR-111).

### 3 · Card 4 has two readings, and THE WORK is the marketing estate

The rail is **WORK · CONFIGURATION**. Reading 03 (the carrier) leaves the rail;
its drawing, its lab re-export and its own guards stay on disk until the owner
has read the new reading live (ADR-070 U35), then a retirement commit deletes
them with `MAP_BACKPLANE` and the chip-morph CSS.

Reading 01 shows the twelve marketing and studio streams, in three columns —
**creative production · creative operations · creative review**, the owner's
own three — each column climbing **a prompt → a tool → an agent → by hand**, with
a PT Mono group head per run. Both axes are the record:

- the column is a new field, `CaseMapWork.stream`, authored on the twelve
  (`MAP_DISTRICTS` is untouched: districts are departments, the isometric board
  seats exactly eight, and a workstream crosses departments); the ordered
  triple is the record's `streams` and the registry pins its keys to the
  drawing's `STREAM_ORDER`;
- the run is derived from `cfg.a` by a pure, total `runModeOf`
  (`mapProjection.ts`): Chat assistant → a prompt; Editor plugin, Briefing agent,
  Image + video suite → a tool; Scheduled agent, Coding agent → an agent;
  person-led → by hand. An unknown run mode resolves to `null`, never a silent
  row; the registry asserts every one of the 27 `cfg.a` values is in the table,
  so a new mode fails by name.

A strict lattice of both axes does not fit the console: a band's height is its
worst cell, and any plausible split puts three or four streams in one cell, so
the lattice runs eight card-rows tall. Stepped groups keep both axes readable:
the block is one column head, at most four group heads and four cards per
column, 12 cards instead of 20. ⚠ **THE PILE'S FIELDS WERE NEVER IN THE
GUARDS' TABLES** — every row was the retired casefile's box (603 × 493 at
1280×720), and the pile's map card is 579 × 307 there, 652 × 479 at 1440×900
and 814 × 790 at the owner's 1920×1247 (`capture-proof-stack.mjs` prints
`mapField` now). A three-column reading is a portrait block, so on the laptop
fields it letterboxes on purpose, as the grid of twenty did before it,
unmeasured; `pda-viewbox` pins that the estate never renders smaller than that
grid on those fields (title 4.7px at 1280×720 against 4.5, 7.3 against 7.0 at
1440×900, 12.0 against 11.5 on his window) and that its letterbox runs at most
a tenth of the panel past the grid's (0.47 against 0.39 at 1280×720, 0.27
against 0.17 at 1440×900, none on his window). Each card dropped from a column buys ~15 % of type: nine
cards, three per column, would letter at ~16px on his window — which nine is
the record's call. The crop is derived from
that CEILING (record-independent, so `VIEW_BOX[1]` stays a constant and
`pdaFit` is untouched) and the live block is centred in it. Ragged column feet
are the record; no rules, no accent bars.

Everything else on the console is reused: the `Cartridge` glyph, the ADR-069
flight from the clicked slot to reading 02's core (`slotRect` on the ONE layout
object the render and the flight share — a rename of `gridRect`, never an
alias), `pdaFit`'s elastic crop, `ConsoleRail` (which derives `--rail-n` from
the tab count; the films card already runs two stations), and reading 02
untouched. The wheel's last step is reading 02 (`PDA_VIEW_MAX = 2`); the keys
are `1` and `2`. The phone's fallback is two lists: WORK grouped by workstream
with each row's run mode, CONFIGURATION as before.

`workLettering` declares every string the reading letters (the carrier's own
pattern), and `pda-work-fit.test.ts` walks fit against measure, the envelope,
the `\d teams` ban and the ceiling block, and renders `ViewWork` to assert
nothing prints that the declaration did not name.

### 4 · The Embedded card is the lead, a filled plate among bare names

The live face (`raster-photo`) sets the name in `TITLE_STYLE.display`
(`box: "none"`), so "fill among outlines" (ADR-089 U4) is not literal here. The
lead mark is one filled name plate beside three bare names, in the ADR-029 chip
material: `pal.chipFill` behind the name, `pal.chipInk` on it, both themes
already paletted. `ServicePlate.lead` names the card (exactly one, and it is
`embedded`, on both records); the bake takes `lead` on both the rest face and
the reveal texture, so the bands cross-fade crisp. No size change — the front
boost, the About deck seam and the phone seat are untouched. The plate box is a
pure function in three-free `reveal.ts`, pinned inside the raster's quiet head
on both rungs.

### 5 · Pins and rules move in the same commits

`trinny-proof-order.test.ts` (the four titles), `services-ring-smoke` (the tools
card is index 1, the map's two tabs, a `readPda` walk scoped to the pile's map
card — the label-overlap check the pile never had), `trinny-london-smoke`
(`shapes[1]` tools, `shapes[2]` studio, `[WORK, CONFIGURATION]`),
`arc-portfolio-smoke` (two stations), `proof-stack-mobile-smoke` (two lists),
`pda-viewbox` / `pda-flight` / `pda-wheel` / `pda-phone-readings` / `pda-card`
(two readings; `shown.length` for `PDA_SHOWN`), `cases-registry` (the streams,
the run modes), `services-copy` and `services-ring-reveal` (the lead plate).
Rules: `proof.md`, `proof-stack.md`, `services-ring.md`, `trinny-london.md`,
`arcs.md`; `CLAUDE.md` lines 9 and 17.

## Left open

- **Creative review has no tool on the tools card.** The Loop image checker
  (Claude grading its own image output, the team as the last gate) is the
  proof; adding it as a fifth `PROJECT_CASES` tool needs a walkthrough, a drawn
  wireframe and the bay label pins (ADR-068). On this pass review is carried by
  the tools lede, the studio card's governance sheets and the map's review
  column.
- The governance sheets stay on the studio card; the films card carries the
  boundary in its lede only.
- The tools card's four claims keep the program register (ADR-068: left = the
  program); a re-cut to the three bottlenecks is a copy decision for the owner.
- Every headline and lede here is a draft in the site's register — it passes
  the copy law and the tone-of-voice bans and is not the owner's sentence.
- The stream assignment of the twelve is a draft for the owner's live read.
- The carrier, the backplane, `MAP_BACKPLANE`, `PdaEntry.morph` and the
  chip-morph CSS: the retirement commit, after the read.

## Verifying

```
npm run verify
npx playwright test tests/visual/services-ring-smoke.spec.ts tests/visual/trinny-london-smoke.spec.ts tests/visual/arc-portfolio-smoke.spec.ts --project=desktop
npx playwright test tests/visual/proof-stack-mobile-smoke.spec.ts tests/visual/services-ring-mobile-smoke.spec.ts --project=iphone-14-chromium --project=iphone-14-pro-max-chromium --workers=1
node scripts/capture-proof-stack.mjs --vp 1920x1247 --theme dark --cards 0,1,2,3
node scripts/capture-map-readings.mjs --at 0.09 --vp 1920x1247
node scripts/capture-services-mobile.mjs --theme dark --vp 390x681
```

Then `http://localhost:3003/` (the epilogue, the four cards, card 4's two
readings at 1920×1247 and 1280×720, the ring with the lead plate in both
themes) and `http://localhost:3003/arcs/trinny-london/proposal`.

### Verified (2026-09-26, before the owner's read)

- `npm run verify`: lint 336 warnings under the 337 ratchet, tsc clean, 141
  files / 2303 unit tests green — after one source ratchet moved with the
  bake's call (`services-ring-mobile-gate`: the phone rung rides inside the
  same options object as `lead`; every read of `opts` is optional-chained, so
  the desktop still passes no rung).
- The three desktop smokes: 43 of 48 green in one run; the four others (three
  arc-portfolio walks of six page loads each, the ring's spec-drawer case) are
  green rerun alone — load, with two other browser jobs on the server. The
  one standing red is the Trinny ADR-100 board case, pre-existing (`5523384f`).
- The two phone smokes on both iPhone profiles: 49 of 54 green in one run;
  four of the five reruns green alone (load, as above), and the fifth was this
  pass's own pin — the WORK list's "must scroll" was written for the index of
  twenty, and twelve rows in three groups FIT the Pro Max's bay outright. The
  scroll half is conditional on overflow now; `inkOut` is the proof of fit.
- Stills: the four cards in both themes at 1920×1247 (the lead plate on
  Embedded, three bare names), the phone band at 390×681, the pile's map card
  at 1920×1247 and 1280×720 (read against the grid of twenty they replaced).
