# ADR-128: The Pandora proposal is the fourth cut of the proposal format, and two kinds

- **Status:** Proposed (2026-09-26, owner) — Phase A shipped and guarded
  (content on existing kinds), then Phase B1 the same day: the `proof-card`
  kind built and the four proof beats swapped onto it; Phase B2 (the `bench`
  kind) planned below and not yet built. Flips to Accepted once the owner has
  read the page live and B2 has landed behind the same URL.
- **Surface:** `/arcs/pandora-proposal` and `/arcs/pandora` —
  `lib/arcs/content/pandora-proposal.ts` (new), `lib/arcs/clients.ts`
  (`PANDORA_CLIENT`), `lib/arcs/registry.ts`, `lib/theme/themeLock.ts` +
  `lib/theme/heroPreload.ts` (one row each, with their pinned tests),
  `tests/lib/arc-board-fit.test.ts` (walks every registered `board`),
  `tests/lib/sheet-instrument.test.ts` (`REAL_TODAY`). Nothing under
  `components/` changes in Phase A. The deck that goes to the client is a
  separate object: `I:\My Drive\04_Arcs\04_Production\20260925_Pandora\00_Proposal\pandora-proposal-v01.{html,pptx,pdf}`,
  built by `_build/build-pandora.mjs` (the Samako generator on the Trinny v05
  donor) and mirrored in `Arcs_Pandora`.
- **Supersedes:** nothing. It is the fourth registered proposal after Suri,
  Perfect Ted and Hungry Minds ([ADR-098](098-arcs-clients-and-the-proposal.md))
  and the first to carry the proof in
  [ADR-126](126-the-proof-reads-as-the-practice.md)'s register and to adopt the
  `board` kind ([ADR-100](100-the-configuration-is-a-board-in-two-states.md))
  on a flat arc.
- **Related:** [ADR-052](052-client-arcs.md) (the enumerated exceptions to
  "new arcs are content-only" — five today, seven after Phase B),
  [ADR-099](099-proposal-nests-and-the-configuration-scrolls-in.md) (the head
  datum every proposal takes), [ADR-103](103-the-head-decodes-in-place-and-the-plates-become-the-deliverables.md)
  / [ADR-106](106-the-outcomes-are-one-dial-read-three-ways.md) (the Trinny eval
  beat this page does not repeat), [ADR-096](096-proof-stack-on-the-homepage.md)
  / [ADR-097](097-proof-card-is-a-folder.md) (the folder card Phase B seats at
  rest), [ADR-118](118-the-arcs-overview-is-an-instrument.md) (the overview's
  monitor and its clock).

## The ask

Owner, 2026-09-26, after the 25 September call with the head of Pandora's
Global Brand Creative Studio (Copenhagen) and the same-day debrief with Rob:

> What I want you to scope out and start building is a proposal page similar
> to what we did for Trinny London, with maybe also a practical thing. […]
> Right now [the proof] kind of felt like a bit of a portfolio … By rewording
> it as "Hey, this is something we would do for you," it feels less like just
> a portfolio. I'm really happy with that direction, and I want you to follow
> those best practices to apply it for the Pandora proposal. […] The creative
> production side is very limited. It's more about creative operations and all
> the things around it. […] If you look at the Trinny London one, we were
> working on a section where we showcase that eval thing, but it felt very
> abstract. Now, because I had to do that workshop at Loop about evals, I
> actually created a module.

Decided in the same session: the deck AND the page's Phase A ship for Monday;
the fee prints in euros at **€1,500 a day, about twenty days a month, three
months, about €90,000**, invoiced monthly on days worked and renewable month by
month; the spoken Loop figures may be printed; the Eclipse mask draw pair from
the Loop evals workshop may be used; the adaptation agency is not named; the
client's own savings target is not printed; the engagement joins the fleet as a
project under the callsign cormorant.

## What the record says

The ask is not creative production. Pandora's studio is jammed on the work
AROUND the creative: file naming and DAM uploads (Primo), the production
schedule, recap emails after creative reviews, resource planning (Hub Planner),
retouching QA by eye, and briefs that arrive as PowerPoints the studio redoes
in Figma. Seven or eight freelancers carry that tail. Claude is in approval;
Copilot is what the team has. No generated people in anything a customer sees.
The doctrine agreed on the call: first the workflows run WITH AI (a person
presses the button), then the same workflows run FOR agents (a person checks in
every hour, not every five minutes).

## The ruling

### 1. A flat registered arc, not a fork of the Trinny route

`/arcs/trinny-london/proposal` is a homepage-variant fork: its own prototype
HTML, `TrinnyPortals`, the particle mark morph, the turn wash, a pinned scene,
`trinny-london.css`, its own parse, journey and smoke tests. Reproducing that
for a second client is that list copied. A flat arc is one content module, a
client record, a registry entry and two hand-written route rows; it appears on
the owner's `/arcs` instrument and gets `/arcs/pandora` for free. What it loses
(the corridor, the mark morph, the pinned scene) exists to carry a homepage
visitor into a pitch. Kristin reads a proposal cold, at arm's length
(ADR-098 U1's own ruling on the callout size). The four proof beats in the new
register are what the owner asked to carry over, and Phase B puts the
homepage's own folder card on the page.

### 2. The proof in ADR-126's register, on the flat kinds (Phase A)

Four beats in the pile's order, each headed by what we DO rather than what we
did: `films` ("We push the frontiers of AI creative"), a chapter `head` over
the `heimdall` `dossier` ("We build the tools the work needs" — the operations
tool, because operations is Pandora's pain; a dossier cannot carry an authored
title, the registry pins it to the record's), `sheets` ("We embed until the
team runs it alone" — the copy law bans the homepage card's own word), and
`intelligence` ("We build the layer the agents run on"; the first proposal to
mount the map console). The evidence is Loop's by reference, as on every arc.
The chapter head above them letters the spoken Loop figures the owner released,
in prose.

### 3. The studio today is a `board`, not a `configuration`

The argument is operations → review → agents, one studio, one setup. The
configuration's picker over workstreams is the instrument the owner replaced on
Trinny ("a lot of things to look at"). So the beat is ADR-100's ledger beside a
board: today — nobody as their day job, the work by hand held up by
freelancers, the context not written down, three tools nothing connects, not
past the studio; configured — the studio lead with Kristin's sign-off, an AI
capability owned by the studio, Rules · Examples · Sources · Loops, the same
three tools under WHERE IT RUNS, into the rest of marketing.

⚠ **The tools row is ONE LINE, composed at draw time.** Four product names
("Figma, Primo, Asana, Hub Planner") put "Planner" on a sliced second line, and
`arc-board-fit` said so only because it now walks every registered board and
not only Trinny's. Asana is the wider marketing organisation's board, not the
studio's, so it is the one that stays in the prose. **A product name is never
abbreviated to fit a measure.**

### 4. The checker as three plates (Phase A), then a `bench` (Phase B)

The owner's judgment on the Trinny eval beat was that it felt abstract; the
module that landed is Moira's `bench` (Run · Skill · Evals; checks that pass,
go to review or block; the verdict the worst of them; the Skill folder with
`SKILL.md` first and `evals/` always; rules with a strictness band). Phase A
carries that grammar in prose as three `list-groups` plates with the Loop
asset checker as the worked example and Pandora's checks named in the head.
Phase B ports the module BY HAND (ADR-106's law: grammar is copied onto the
arcs' ink ramp, never imported across repos) as the `bench` kind with the
Eclipse draw pair as its picture.

### 5. The fee is a day-rate ledger

`cards` + `ledger: ["Month", "Days on the work", "Fee"]`: three month rows at
about twenty days each, five in Copenhagen, and a total row. Every figure
derives from one constant (`DAY_RATE`), the same number the deck's generator
carries. Month one stands on its own.

### 6. The overview's clock

`sheet-instrument` reads the real overview on a pinned day so the still is the
same on every day; a monitor read on a day BEFORE a filing reports that
engagement as "filed after now" — a real violation on a fake day. The real
overview now has its own pinned `REAL_TODAY`, separate from the axis tests'
`TODAY`, and it moves forward when a newer arc files.

## Phase B

- **`proof-card` — BUILT (B1, 2026-09-26).** `{ kind: "proof-card"; track: string; head?: ArcHead }`,
  the sixth enumerated exception: the promoted folder card (`ProofCard` from
  `components/landing/home-v2/services/proof-stack/`) at REST, at page width,
  one Loop track per beat, four beats in `PROOF_STACK_ORDER`. The wrapper is
  `.pf-stack > .pf-slot`, whose declared rest state (`--pc-enter: 1;
--pc-cover: 0; --pc-depth: 0`) seats every arrival channel with no hook;
  `proof-stack.css` imported at the arc route; an `.arc-proof` block in
  `arcs.css` gives the card the films console's height law. No colour bridge:
  the sheet is token-only over the swapped triples and light already
  re-derives it. The registry pins the track set and the order.
- **`bench` — planned (B2).** `{ kind: "bench"; head: ArcHead; example: ArcBenchExample }`,
  the seventh: one example, the chrome strings constants in the renderer
  (walked through the copy law and the digit ban), three panels always in the
  DOM with `data-bench-*` state, states told apart by SHAPE inside the one
  accent (never a traffic light, never green), assets under
  `public/arcs/pandora-proposal/`.
- The swap-in is content only: the four proof beats moved onto `proof-card`
  in B1 (measured at 1280×720 and 1920×1080 off a production build: the card
  fills its box, the claims' sentences show from 1070h as on the pile, the
  layer beat no longer runs past the frame at 1080h); the checker follows in
  B2. A new `arc-proposal-smoke` walks the page at the three reference
  viewports once B2 lands.

## Alternatives rejected

- **A Trinny-style fork** (`/arcs/pandora/proposal`): a week of route, not a
  weekend of content, for a reader who never sees the homepage's corridor.
- **A `configuration` section**: the instrument the owner replaced on Trinny;
  it would also have made the `/arcs` dossier board draw, which is not worth a
  drawing the client page argues against.
- **Extending `steps.scan`**: one dial with one sweep cannot hold two draws, a
  folder and a rules table.
- **Importing Moira's `Bench.tsx`**: a different repo with its own law; the
  arcs copy grammar and re-derive it on the ramp.
- **Pricing by stage gate in pounds**: Rob priced by the day and the owner
  restated it in euros; a phase ladder would have re-imported the Suri
  commitment the buyer found heavy.

## Consequences

### Positive

- The fourth proposal took one content module and two route rows; the
  `board` kind has its first adopter and its fit walk now covers every board.
- The proof reads as the practice on a client page for the first time, in the
  homepage's own words.

### Negative

- Two shared files (`clients.ts`, `registry.ts`) were being scaffolded by two
  sessions at once in one tree; the commit order had to be negotiated.
- Until B2, the checker is three plates in prose rather than the bench with
  its picture pair.

## Left open

- Phase B itself, and whether the folder cards must be on the page at first
  read (owner).
- The `intelligence` beat does not budget the proposal head datum
  (`arcs.css` does so for films and sheets only); read the 1920×1080 still.
- Jenny's role; the client's mark (text on the rail until a vector arrives);
  the start months.
- The `/arcs` dossier board for an arc with a `board` and no `configuration`
  (`configurationFromBoard` is reached only through `PAGE_CONFIGURATIONS`).
