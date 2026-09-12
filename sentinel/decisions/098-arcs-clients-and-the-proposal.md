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

## Deliberately absent

- **The client page's Armada / technical setup.** The owner named it for later
  ("right now I just need an easy structure where I can create proposals
  quickly"). A stub would be a section with nothing to say.
- **A deck export from the record.** The HTML deck pipeline lives in the
  engagement's own repo and still runs; this does not replace it, and a second
  renderer off one record is a promise to keep two surfaces in step.
- **The Trinny pitch as a card on the overview.** It is a homepage variant, not
  an arc; listing it needs a link-only record that would break every
  `ARCS.map` walk for one row.
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
