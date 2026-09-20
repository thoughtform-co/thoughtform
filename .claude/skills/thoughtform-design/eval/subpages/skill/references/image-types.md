# The image types

⚠ A type is a PAGE here. The axis is the site's own: the six routes the sheet
renders, one type each, and every still of a type is one SECTION of that page
(draw `_01` is the first screen, `_0n` is section n at the pin). The structure
lives in `armada.toml [types.*]`; this file says why.

|        | Type          | The question                                                                          | Route                                | Ladder                                                     |
| ------ | ------------- | ------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| **HS** | Home sessions | _does an event page read as one sheet: the offer, the calendar plotted, one seat?_    | `/home-sessions`                     | split · timeline · steps · cells · row · close             |
| **AR** | Arcs overview | _does the client console read as an instrument, and the set of five as one?_          | `/arcs`                              | split · console set · cells · close                        |
| **AC** | Arcs client   | _does one client's page stand on its console alone?_                                  | `/arcs/loop`                         | split · console · close                                    |
| **MU** | Musings index | _does a blog index read as a ruled table under two framed features, not a card grid?_ | `/musings`                           | split · figure · table · close                             |
| **MP** | Musings post  | _does an article carry a sticky metadata column beside prose, every figure framed?_   | `/musings/navigate-the-intelligence` | split · prose · figure · close                             |
| **SK** | Subpage kit   | _does every arrangement and state share one grammar on one page?_                     | `/test/subpage-kit`                  | every arrangement once; graded on block K and the register |

## The difference table

What makes each page its own, declared before shooting. Lives in `armada.toml`
beside each type as `camera` / `position` / `shape`, and `doctor.py` fails the
ship if any two types share all three: two pages with one difference table are
one page shot twice.

| Type | Ladder (camera)                           | First screen (position)                                           | Instrument (shape)                                            |
| ---- | ----------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| HS   | split, timeline, steps, cells, row, close | the offer's title left, paragraphs right, a spec readout under    | a dated axis with four mornings seated, the next one lit      |
| AR   | split, console set, cells, close          | the practice's claim left, a kind filter right, then the consoles | a sticky terminal panel with a five-row readout beside a pile |
| AC   | split, one console, close                 | the client's name left, its lede right, the console under         | one console: the panel, the readout, the client's cards       |
| MU   | split, figure two-up, table, close        | the note left, two framed features, every post a ruled row        | a FIG-barred pair and a hairline table with a tree glyph      |
| MP   | split, prose, figure two-up, close        | the title left, the summary right, the metadata beside the body   | a sticky readout column and prose at sixty-eight characters   |
| SK   | every arrangement once                    | the specimen sheet, fixtures labelled as fixtures                 | the whole vocabulary on the house knobs                       |

## The lanes

The lane is the filename's free slot, and on this ship it is the DIRECTION —
the knob set the still was drawn at — so `calibrate.py`'s per-lane table is a
per-direction table for free.

| Lane     | Direction | Knobs moved against the house                | What it asks                                                      |
| -------- | --------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `sa`     | SA        | none; the negative pole, today's old `/arcs` | what the owner said looks bad, so a check can be shown to fail it |
| `sb`     | SB        | none; every knob at its first value          | does the house sheet read as one instrument across six pages?     |
| `sd`     | SD        | `head=stack ordinal=off`                     | is the stacked head better, or does the page lose its wayfinding? |
| `se`     | SE        | `card=grid timeline=rail`                    | do a static grid and a date rail say the same with less motion?   |
| `lawful` | —         | the site's lawful fixture panel              | wave 00: block A must pass it                                     |
| `broken` | —         | the site's broken fixture panel              | wave 00: block A must fail it                                     |

## The settings

A setting is a VIEWPORT. `default` is the owner's own 1920 × 1247; `laptop` is
the binding 1280 × 720 and writes into a `-laptop` wave folder suffix, never
into the filename.
