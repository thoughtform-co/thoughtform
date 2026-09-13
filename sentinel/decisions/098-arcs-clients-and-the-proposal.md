# ADR-098: Clients and engagements on /arcs, and the proposal as an arc

**Date:** 2026-09-12
**Status:** Proposed (built and guarded; pending the owner's live read)
**Surfaces:** `lib/arcs/**`, `components/arcs/**`, `app/(marketing)/arcs/**`, `scripts/new-arc.mjs`, `lib/theme/{heroPreload,themeLock}.ts`
**Related:** [ADR-052](052-client-arcs.md) (the arc page and its content-only rule, whose second exception this is) ·
[ADR-072](072-portfolio-arc-and-dossier.md) (the first exception) ·
[ADR-077](077-arcs-ink-ramp.md) (the ramp the new grammar is built on) ·
[ADR-079](079-portfolio-trajectory-and-the-beat.md) (one beat per screen, scoped by format) ·
[ADR-089 U3/U4](089-casefile-is-one-housing.md) (a selectable set is outlined boxes, the picked one FILLED) ·
[ADR-093](093-trinny-london-light-locked-variant.md) (the light lock) ·
[ADR-094 U7](094-trinny-proof-stack-and-proposal.md) (the configuration instrument this ports) ·
[ADR-096](096-proof-stack-on-the-homepage.md) (the precedent for lifting a route's beat into a shared one) ·
[ADR-097](097-proof-card-is-a-folder.md) (a client as a record field, not a literal)

## The ask

Owner, 2026-09-12, on the Suri proposal deck and the `/trinny-london` page:

> What I want you to do is also encode it into our skill so that, when we
> receive a new client, we can easily make a variation of this proposal. Now,
> we currently did it with just a local HTML. ... I actually want to use
> Thoughtform, our website, to create it because that's where our brand lives.
> ... I think, for arcs, right now I use it for both my keynotes, etc., and my
> workshops, so maybe we need to restructure the arcs page so there's a clear
> overview between keynote, workshops, and productions. Very importantly, I
> think maybe we should also categorize them or cluster them around clients
> because I may do different engagements for the same client, and I don't want
> to recreate the client. ... When I want to create a proposal, that also means
> that we need to create a subpage per client with an overview of the different
> engagements that we have. ... Let's keep it simple.

## Context

Two ways to make a client page already exist, and they are not equals.

`/trinny-london` (ADR-093) and `/claude-workshop` (ADR-053) are **homepage
variants**: a 6,000-line fork of the prototype HTML, its own parse guard,
seventeen route-local files, and a rule that says copy the CSS rather than
share it. That is the right shape for a pitch that re-choreographs the
corridor, and the wrong one for a proposal per client — the third fork would be
the moment the practice owns three copies of one page.

`/arcs` (ADR-052) is the other: content is data, a page is one `ArcDef` over a
union of section kinds, the HUD chrome comes from the read-only slice, and the
route is statically generated. **A proposal is an arc.** Everything the deck
does that the arcs could not do was one instrument.

What the substrate lacked: a client, a taxonomy, a filter, a client page.

## Decision

### 1 · A client is a record, and an engagement belongs to one

`lib/arcs/clients.ts` — `ClientDef { slug, name, lede }`, a `CLIENTS` array,
`getClient`. `ArcDef` gains `client?: string` (absent = a Thoughtform format),
`kind?: ArcKind` and `theme?: "light"`.

**The kind is DERIVED where it can be.** `kindOf(arc)` falls back to
`KIND_BY_FORMAT` — a workshop is a workshop, a portfolio and a proposal are
productions — so the five existing content modules were not edited to author a
taxonomy they already imply, and the `-v2` cuts inherit it through the spread
that already shares their v1's sections.

**No `date` field.** Registry order is the order, and one comment says newest
first within a client. A date that only ever feeds a sort is a second place for
the same fact to be wrong.

**The chip stays `cardChip ?? format`.** Two productions would print one word
twice on the overview, and `arc-terminal-smoke` asserts the chips distinguish
the cards.

### 2 · The URLs do not move

`/arcs/<slug>` for every engagement, `/arcs/<client>` for the client page,
resolved inside the route that already exists: `generateStaticParams` is the
union of both sets, the page tries a client first and an arc second, and the
registry test pins the two sets disjoint.

**Rejected: nesting the engagements** (`/arcs/suri/proposal`, the portfolio at
`/arcs/loop/portfolio`). It reads better and costs a migration: a second route
file repeating the seven-sheet cascade order, a 308 chain on top of the one
already there, and every hardcoded slug in two smokes, the capture script and
`HERO_ROUTES` moved at once. An arc is an **unlisted page whose whole
distribution is a link somebody forwarded** — the links in the wild are in
inboxes, and the cheapest way to keep them working is not to move the page.
The hierarchy is expressed on the overview, which is where a reader meets it.

### 3 · The overview groups by client and filters by kind

`ArcClientGroups` (server) renders one band per client in `CLIENTS` order, then
a Thoughtform band for the house formats. The head is ADR-089 U1's: the name as
a rule, a mono count beside it, the lede under it.

`ArcKindFilter` is the one stateful thing on the page and writes ONE attribute,
`data-arc-kind`, on `.arc-root`. Every card carries `data-kind`, every group
`data-kinds`, and the CSS is two rules per kind. **No `:has()`** — the group
already knows what it holds, and a server-rendered attribute is cheaper than
asking the browser to compute the same fact.

**No attribute means everything is shown**, so the page is whole without JS;
the resting state is authored. The stations are ADR-089 U3/U4: outlined boxes,
margin never gap, the picked one filled in inverse video.

⚠ **ADR-052's flattening doctrine does not reach it.** That rule freezes an
interactive control PORTED FROM A DECK to its default. This is site chrome on
the overview, which is not a ported deck.

### 4 · One new section kind: `configuration`

ADR-094 U7's instrument, as data. Three bands on one hairline plate: the layer
the client owns (rows that dim unless the picked team reads them), the seam
(adoption and automation as 1px runs with border-drawn heads), the work (the
teams as tiles, the picked team's configuration read out in the registry's five
questions).

`ArcConfiguration` is a client leaf with ONE delegated listener on its own root,
the `usePropPick` idiom. **The resting state is authored** — the first tile
selected, its rows lit — so the drawing reads whole with no JS and under
reduced motion, and the picker adds the pick and nothing else.

**The grammar is COPIED, not shared.** `trinny-london.css` stays untouched;
`.arc-cfg*` is built on the ADR-077 ramp and re-derived in light. Its
attributes are `data-cfg-*`, never `data-arc-*`, which the terminal-markup test
reserves for the beat grammar.

⚠ **The picked tile is FILLED** (ADR-089 U4), where Trinny's is outlined. That
ruling landed after the pitch page shipped; the newer house law wins, and the
filter's stations use the same one so the page states it twice in one voice.

This is **the second enumerated exception** to ADR-052's "new arcs are
content-only" rule, after ADR-072's dossier. The bar both clear: the thing
cannot be expressed by the existing kinds, and it is one leaf.

**Rejected: a `phases` kind.** The deck draws its phases as a rail. ADR-078 U1
is the standing law here — a drawing on this surface plots something that
HAPPENED, and a plan is an argument. The three phases are three columns of
`list-groups`, which is the deck's own plan table.

**Rejected: a `pricing` kind.** A fee table is three cards with a kicker, a
title and a body, plus the terms as tips.

### 5 · A proposal is a format, and it may be locked

`ArcFormat` gains `"proposal"`: a LAYOUT family, sharing ADR-079's
one-beat-per-screen budget with the portfolio. `kind` cannot carry this — both
are productions — which is the same split `data-arc-format` was invented for.

`theme: "light"` makes `ArcShell` mount `ThemeLock` and hide the switch. The
route earns its `LIGHT_LOCKED_ROUTES` row by hand, as that file demands, and
the registry test now fails if a locked arc has no row.

### 6 · A client page is one command

`scripts/new-arc.mjs` writes the content module from a proposal skeleton with
complete house copy, and edits `clients.ts` and `registry.ts` by fail-loud
needle replacement — a needle not found throws, so a silent no-op is
unreachable. It never commits. Armada's `deploy.py` runs it as day one's fifth
move.

⚠ **The skeleton ships FINISHED copy, not placeholders.** A scaffold that left
`[brackets]` in a registered arc would leave `npm run verify` failing on a repo
nobody had opened yet; the registry test walks for them.

⚠ **TWO ROWS STAY THE PERSON'S, and the end-to-end run is what settled it.** A
scaffolded arc typechecks and passes 22 of 23 registry guards; the one that
fails names the missing `LIGHT_LOCKED_ROUTES` row. Writing the rows from the
scaffold was built and reverted: both lists are pinned `toEqual` by their own
tests precisely so a route joins or leaves by a reviewed hand, so a scaffold
that wrote them would have to edit those two tests as well — a generator
quieting its own guards. It prints them loudly instead, and the red guard is
the handover.

## Update 1 (2026-09-12, owner): the corner goes quiet, and a proposal is read

On the page live:

> The text in section one is too big. We need to drastically reduce it. I think
> the icons in the top-left corner compete with the hero. Let's remove them from
> these arc pages, along with the links in the top-left corner, like we have for
> Trinny. I think that's much easier on the eye.

**The chapter row is hidden on every detail arc**, and the corner's bracket
comes back with it. This is ADR-093's ruling for the pitch page, one surface
over, in the same two halves: `rail-instruments.css` zeroes that bracket's
border because the row IS the corner's mark, so removing the row without
restoring the border leaves an empty corner.

⚠ It reaches ALL FIVE arcs, not only the proposal, because the ask is about
chrome and the roster is derived — the same reason ADR-059 U6's own change
reached all five when it put the marks there. ⚠ `display: none`, never an
unmounted component, so `buildArcMarks` and every arc's roster stay exercised.
⚠ **Unlike the pitch page, an arc keeps its section indicator**: that route
hides the nav readout too and is left with none, a consequence its rule names.
The arcs' header is the site's own (ADR-073) and stays.

**Then the owner asked for the homepage too, and the rule left this surface.**
Three surfaces wanting the same thing is not three route rules; it is one rule
in the sheet that owns the row. `.rin-cl--journey { display: none }` and the
top-left bracket's return now live in `rail-instruments.css`, unconditionally,
and the route-scoped copies in `arcs.css` and `trinny-london.css` are DELETED.

⚠ **It is the ≤960 rung promoted to every width**, which is why it is two
declarations and not a new mechanism: that rung already hid this row and
restored this bracket on a phone, and the ruling is that a desktop should read
the same way. The top-left clip goes back to production's `0` sides with it —
the `-340px` opening existed only to spare the row's outboard mark, and there
is no row to spare. ⚠ ADR-059 U6's four-corner scheme keeps its bottom-right
half: the exit mark, the session and the theme switch are still there, and that
corner still gives up its bracket for them.

⚠ **THE ROW IS NOW DORMANT UI ON EVERY SURFACE.** Deleting `MarkRow` and its
clusters is a separate, safe pass once this has been read live; not done here,
because bringing the row back is one line for as long as it stays, and
`useJourneyMarks` still drives the seat and the right rail's telemetry.

**The interstitial's display line comes down on a PROPOSAL only**, from
`clamp(38px, 5.4vw, 76px)` to `clamp(24px, 2.6vw, 40px)` — 69px to 33px at the
reference laptop. Scoped to the format, which is what `data-arc-format` is for:
the same size is right on a keynote, because a deck is presented in a room from
a distance and the callout is the beat where the room looks up. A proposal is
read by one person at arm's length, and at that distance the same type shouts.
Measured after: the keynote's line is unchanged at 53.8px, the proposal's is
33.3px.

⚠ **The measure is part of the size.** At 34ch the sentence still set three
lines and broke `AI-first.` across its own hyphen, which reads as a typo rather
than a line. 42ch sets it in two at both reference widths, with `text-wrap:
balance` evening them.

## Update 2 (2026-09-13, owner): the offer matches the deck, and the pitch joins the clients

Owner, with `suri-proposal-v24.html` (the structure) and `suri-proposal-v25.pptx`
(the latest content) open:

> If you look at the Suri one, the three modules are supposed to be like three
> blocks, but it doesn't really have these borders or dividers, which makes it
> look very chaotic. Let's try it properly for Suri. … The HTML has structure,
> but this PowerPoint actually has the latest content. … Of course, we have to
> wire [the Trinny page] up to the right subpage.

### What was measured

Deck against arc, at 1920×1247. The deck's plan slide is three **plates** — a
head band on a soft ground, ruled week rows, a dark outcome foot — and its
pricing is a **fee table** beside three tip cards with a coloured left rule.
The arc drew the plan as three naked columns of dashed rows
(`.arc-groups--columns`) and the pricing as four tiles under a tips strip. That
is the "chaotic": the same records with every border and divider removed.

After: the phases beat is exactly one viewport at 1920×1247 (section 1247 = vh,
plates 498px, the foot's bottom at 1001) and runs 35px over at 1280×720 (755 vs
720 — the same overflow class the columns had at that shape). The pricing beat
fits both.

### Decision

1. **`list-groups` gains `layout: "plates"`, and a group gains `foot`.** The
   deck's STRUCTURE in the house material: square (ADR-065), `--arc-edge` on
   `--arc-plate`, `--arc-seam` dividing the head band from the rows and
   `--arc-rule` within (ADR-089 U2's two weights, as the dossier housing carries
   them), the outcome as an INVERSE band — `--arc-ink` under `--void`, the pair
   ADR-058 swaps, so it is a dark band on parchment in light and dawn on void in
   dark with no theme rule. `columns` and `stack` are untouched: every other arc
   is byte-identical, and the terminal-markup test still sees no `data-arc-*`.
2. **`cards` gains `ledger`** — the same four records drawn as the table they
   were on the deck: `kicker` | `body` | `title` under three authored head
   cells, the LAST card the total on the plate ground, the tips BESIDE it as
   bordered cards with a gold left rule, `footnote` as the deck's note. **"No
   `pricing` kind" stands**: a variant on `cards` is not a kind.
3. **Suri's content from v25, configuration onward.** The phases from slide 9
   (mapped by shape position: the "Creative strategy, tone of voice…" line sits
   under M1's week 2); the fee **M1 £10,000 · M2 +£15,000 · M3 +£20,000 = £45,000**
   — v25's total row still read £60,000 against phases summing to 45, and the
   owner ruled the phases current, M3's blank "what" being its phase name; the
   needs' third item as v25's "Stakeholder time". ⚠ **The loop and "what you
   keep" are KEPT** (owner): v25 trimmed them for slides, the HTML has the
   structure. The appendix names Higgsfield, as both deck versions do. Suri's
   beats before the configuration are untouched (owner).
   ⚠ **Three lines are rewritten to the behaviour**: "self-sufficient" and
   "autonomously" from v25, and — on BOTH modules — "run the waves themselves",
   which is the fleet's word and which the ban `/the wave/` had never met
   because the inline list only ever walked strings the deck had not yet used.
4. **The bans move to `lib/arcs/copyLaw.ts`** (`PROPOSAL_COPY_BANS`,
   `scanStrings`, zero imports) because a second surface reads them: the Trinny
   pitch page's offer is the same beats OUTSIDE `ARCS` (ADR-094 U9), and
   `tests/lib/trinny-offer.test.ts` walks it with the same list — plus a guard
   that no Suri noun survived the swap.
5. **`ClientDef.pages`** — a client's page that is NOT an arc, listed FIRST on
   its band and its page as a card that links out. **Trinny London joins
   `CLIENTS`**, first, with `/trinny-london` as its one page. This REVERSES the
   "deliberately absent" ruling below by owner instruction, and the shape
   honours the reason it was rejected: no link-only `ArcDef`, so every
   `ARCS.map` walk is untouched; `ArcCard` splits into `ArcCardFace` (the
   markup) over two records. The overview smoke counts `ARCS.length + Σ pages`;
   the registry pins a page's `href` outside `/arcs/`.
6. **The offer follows the configuration on the pitch page**, rendered by these
   same components through the route's nested-root seam — ADR-094 U9 records
   it; the point here is that a fix to the plates or the ledger lands on both
   surfaces because there is one renderer.

### Left open

- **The overview's grid is capped at two columns at every desktop width.**
  `repeat(auto-fit, minmax(300px, 420px))` counts repetitions against the MAX
  track: `floor((1194 + 36) / (420 + 36)) = 2` in the text band at 1920×1247,
  so a one-engagement client's band is ~810px of page for one 420×680 poster
  (the second track computes to `0px`), and the page ran 4,710px for six links.
  Measured this pass; the owner set the overview aside ("nvm").
- The Trinny card carries the house key visual, as Suri's does, until the
  client's own image is approved.
- The offer's copy on the pitch page is Suri's, noun-swapped — the owner's own
  placeholder, to be rewritten.

## Deliberately absent

- **The client page's Armada / technical setup.** The owner named it for later
  ("right now I just need an easy structure where I can create proposals
  quickly"). A stub would be a section with nothing to say.
- **A deck export from the record.** The HTML deck pipeline lives in the
  engagement's own repo and still runs; this does not replace it, and a second
  renderer off one record is a promise to keep two surfaces in step.
- ~~**The Trinny pitch as a card on the overview.** It is a homepage variant,
  not an arc; listing it needs a link-only record that would break every
  `ARCS.map` walk for one row.~~ **Reversed by U2** — as a field on the CLIENT
  (`ClientDef.pages`), which reaches the two listings and no `ARCS` walk.
- **`/cases/[slug]`**, still anticipated by `lib/cases/registry.ts` and
  LANGUAGE.md, still not built.

## Consequences

- A new client is a record and a run of one script. The practice stops owning a
  copy of a page per client.
- `lib/arcs` now holds a second registry. The two are pinned disjoint, because
  a client slug colliding with an arc slug would shadow a live page.
- The proposal names its fee and its addressee, so it is deliberately OUTSIDE
  `ENVELOPE_ARCS` — the portfolio's envelope is for a page forwarded to
  strangers, and a proposal is addressed to one.
