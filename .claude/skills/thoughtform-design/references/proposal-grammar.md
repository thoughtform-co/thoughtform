# Proposal grammar — one argument, one object, one return (ADR-155)

The register a client proposal on `/arcs/<client>/proposal` is cut in, read off five references
(Unsiloed, Arrakis, iCOMAT, Rollups, Tensorlake) and the house's own instruments. The X-Bionic
page is the first cut; `/test/proposal-system` is where the next one is read before it ships.

## What the references share

1. A statement opens; the problem or claim is ONE large sentence, never a paragraph.
2. Proof is neutral numbers in ruled cells; the accent sits on markers, leaders and data.
3. There is ONE product object, drawn once and read in steps, with callouts that light one at a
   time. Every other section is a different ARRANGEMENT of the same material.
4. Sequence is lettered in mono (`01 / 02 / 03`, a left rail, a dated ledger), never in prose.
5. No two adjacent sections share an arrangement.

## The five registers

| Register | Beat type | Arrangement (lattice) | Rule |
|---|---|---|---|
| Statement | the vision line; the three part openers | a quote band, content-height, set left | one line, upright gold on the `em`; no subline, no index; the part ruler stays |
| Instrument | the approach, where it plugs in, the engine | `instrument` / `head-field` | one object (the stack), one lit thing; side callouts on DOM leaders; the static render whole |
| Record | a Loop proof card; a client job | `bay` | the frame carries everything; the head band is the gold wash; the gold is the data |
| Ledger | what it returned; the two weeks; the fee | `ledger` / `cells` | one return per row: a value, a line, a tally where it is a count |
| Index | the chapter bands' rows, the about's meta | mono `01 02 03` rows | lettered in mono, never prose |

Three laws: no two adjacent beats share a register or an arrangement; the stack appears in three
states (written · placed · configured) and nowhere else draws a slab; every number is as filed.

## The object: the layer stack

`components/arcs/stack/stackLayout.ts`: the organisation's slab, the layer the team writes, the
workstream tiles, in the stage's parallel projection, the crop derived. Drawn flat by
`StackFigure` (the SVG letters nothing; the words are DOM on DOM leaders) and live on the holo
stage by `stackGeom.ts`. Gold is the layer and the lit tile; green is the owner; a cursor is ink.

## The order (the owner's, 10 October 2026)

about · the vision (spectrum) · the approach (the stack, written) · where it plugs in (the
leverage, placed) · "In 2024, Loop decided to go AI-first." · the four Loop cards · what it
returned (returns) · "The same configuration, built with two more teams since." · the four jobs
(mark head, in the disciplines' order) · "And this is how we set it up at X-Bionic." · the engine
(pinned) · the two weeks · who takes part · the fee · the close.

## Copy

Never the first person (the copy law fails it). Titles are names. One return a job, in a decision
maker's words, never restating its value. People by role. No money until a money figure is filed.
