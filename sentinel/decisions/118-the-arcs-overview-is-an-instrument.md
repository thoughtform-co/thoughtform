# ADR-118 — The arcs overview is an instrument: a monitor, then a log

- **Status:** Proposed (2026-09-21) — **IN BUILD.** Landed: the engagement's
  filing date (§5), the ship's rubric 0.2.0 → 0.2.1 and its second negative pole
  (§7). To land: the two arrangements, their controller, the page swap, the
  previews and wave 03. The owner's tick on wave 03's gallery is the acceptance;
  until then every section below is a proposal.
- **Surface:** `/arcs` — the owner's page since [ADR-117](117-the-owners-pass.md)
  — and only it. The sheet ([ADR-114](114-the-sheet.md)) stays the grammar of
  `/home-sessions`, `/musings`, every client page and the kit.
- **Supersedes, in part:** ADR-114 on the overview (a ruled DOCUMENT gives way
  to an INSTRUMENT there; its open rulings that only concerned the overview —
  pile or grid, the pile's seat, Loop's dossier beats — lapse);
  [ADR-098](098-arcs-clients-and-the-proposal.md) §1's "no `date` field" and
  U2's "pages lead" (§5).
- **Related:** [ADR-089 U4](089-casefile-is-one-housing.md) (selection is fill
  among outlines), [ADR-065](065-corner-law.md) (TR+BL; square children),
  [ADR-078 U1](078-portfolio-proof-page.md) (draw the record, never a metaphor),
  [ADR-097 U12](097-proof-card-is-a-folder.md) (no flashing — the centre-out
  aperture), ADR-114 U1 (the rails are the page's only verticals), ADR-059 (the
  frame's four corners are already ours).
- **Rules:** [`.claude/rules/sheet.md`](../../.claude/rules/sheet.md),
  [`.claude/rules/arcs.md`](../../.claude/rules/arcs.md).

## The ask

Owner, 2026-09-21 (verbatim in the ship's `brief/VOCABULARY.md`):

> For the first section, the hero section, it should be full viewport, and it
> should look like a sort of grid timeline, like the fourth screenshot that
> indicates the different projects mapped onto it. … In the next section, which
> should be like a new viewport — it should not overlap with the hero section —
> on the left side we have a minimalistic list of the different Arcs, the
> different clients. Maybe we can have subsections per client, so they really
> feel like quests from a video game. When you click on them, on the right side,
> a card should then appear … with all the information of that specific Arc.

Four references: a game's codex (list + detail), its vehicle detail card, its
quest journal, and a designer's concept displays with gridded charts. Their
decode — regions, rules, selection, row anatomy, label:value ratio, where the
micro-labels sit — is counted in the ship's `DRIVE.md` (2026-09-21). What is
taken is the ROLE of each device, never its chrome: the frame's rails, corner
readouts and bottom-right cluster are already ours (ADR-114 U1's lesson: read
the frame before copying a reference's).

## Decision

### 1 · Two arrangements, one screen each

The overview's ladder becomes exactly two new arrangements, `monitor` then
`log`, on the 1440 instrument band. The monitor is EXACTLY one screen; the log
starts where it ends (never overlapping it) and is at least one screen. Each
device is as tall as the rails — their extents are its datum and its terminus —
so it ends above the fixed wordmark at the frame's bottom-left. No head bands,
no ordinals, no public footer on a private tool.

### 2 · The monitor plots the record

One chamfered housing (TR+BL, square children), so every horizontal inside it
terminates on its own edge — the answer to wave 02's finding that a seam with
nothing to land on reads as a fault. A datum strip; four unequal readout cells;
a plot on a DOM graticule (lanes, one per client, then the house formats; a
day-linear axis over whole weeks; the dates along its foot); a terminus strip.
One diamond per engagement at the date it was filed — open is a proposal out,
filled is delivered — and exactly one gold mark: the selection's. A gold NOW
cursor. Nine marks is what the record holds; nothing is invented to fill the
plot (commit activity was measured as a denser signal and dropped: forty
commits on one pitch, one to three everywhere else).

### 3 · The log opens it

Left, five of twelve: a `<nav>` of real links — kind-filter stations, then one
group head per client over one-line rows (`diamond · chip · title … [date]`),
newest first; exactly one row FILLED. Right, seven of twelve and zero gutter:
the DOSSIER, one sticky chamfered housing whose image takes the remainder
(never a clamp), with a readout of checkable facts, the arc's chapters and one
CTA. Plain click selects, ↑/↓ rove, Enter opens; the newest engagement is
selected on the server; `#arc=` deep-links. The one client file imports no
registry — a client component importing `lib/arcs` would ship the client list
in a public chunk.

### 4 · Motion

No fades and no flicker: the house's centre-out clip aperture, observed once
per device root; the swap opens the incoming dossier in 180ms and settles on a
written `data-dos-id`. Reduced motion and no-JS render everything at rest.

### 5 · An engagement carries its date — LANDED

`date: "YYYY-MM-DD"` on `ArcDef` and on `ClientPageDef` (not `at`, which is
already the program board's 0..1 axis fraction), seeded from each page's git
first commit and marked OWNER-TO-CONFIRM, like `since`. The label the page
letters is **Filed**, because that is what the seed is.

⚠ **THIS REVERSES ADR-098 §1 ON ITS OWN TERMS.** That ruling refused a date
"that only ever feeds a sort" as a second place for one fact to be wrong. This
one feeds a PLOT — the monitor places a mark by it — and the order it could
contradict is guarded against it: `arcs-registry` requires each client's
registry sequence to agree with its dates, so the two cannot tell two stories.
It also retires ADR-098 U2's "pages lead": a client's page and its arcs sort
together by date.

Guards (`tests/lib/arcs-registry.test.ts`): a real calendar day; not in the
future; a year no earlier than the client's `since`; non-increasing within a
client; a `-v2` cut dated no earlier than its v1 AND authoring its own `date:`
line (the spread that shares its sections would otherwise inherit v1's).

⚠ **THE SCAFFOLD WAS FAILING THE REGISTRY ON DAY ONE, AND NOW IS NOT.**
`scripts/new-arc.mjs` wrote no `status` (the client console requires one on
every client-bound arc) and a new client with no `since`. It writes both now,
plus the `date` — taken as `--date`, defaulting to today in local time, and
passed INTO the template, which throws without one: a template that read the
clock would make its own test depend on the day it runs.

### 6 · The directions the wave puts in front of him

First value = the house; each direction moves one knob; the instrument's four
knobs are scoped to the overview and its kit (`types: ["AR","AK"]`), the
document directions SD/SE to the document pages.

| id  | knob           | asks                                                            |
| --- | -------------- | --------------------------------------------------------------- |
| SB  | —              | does it read as one device?                                     |
| SG  | `span=full`    | 2023 → now, linear: more honest, or nine marks in the last 5 %? |
| SH  | `rows=boxed`   | the references' literal rows, against the list's seat           |
| SJ  | `dossier=pair` | an image plate over a text plate, against one housing           |
| SL  | `frame=rails`  | the monitor's strips run out to the rails — wave 02's question  |
| SF  | pole           | yesterday's overview, promoted from wave 02, never re-shot      |

`SL` is the one direction near the frame. If its strips cannot land on rail
ticks and clear the rails' labels it is recorded and dropped — never a
workaround that moves a rail.

### 7 · The ship judges it before it exists — LANDED

Rubric **0.2.0** adds block M (the monitor) and block L (the log), eight
critical rows, each carrying its own scope sentence, and attaches a second
register as image 3 on the overview's stills — composed LOCALLY from the four
references and never committed, because they are third-party art and the
repository is public. The second negative pole, **SF**, is the sheet overview
itself, promoted byte-identical from wave 02. Calibrated the same day
(`evals/waves/wave-03-calibration.md`): all eight rows fail the pole for their
stated reasons, unanimously; the one wrong failure was the rubric's own — a gold
bullet written as a list repealed A2's list — and **0.2.1** makes it additive.

## Left open

- **The dates are seeds.** Git says when a page was made, not when the
  engagement happened. One line each to correct.
- **The plot's dotted divisions are verticals inside an object.** The rubric
  tells the grader they are a scale, and the smoke will name and bound the
  exemption; whether they sit right with "the rails are the only verticals" is
  his to rule on the first still. `SL` shows the other reading.
- **The section dots** under each mark are honest (one per section of the
  arc's page, countable against the dossier) and low-stakes; one rule hides
  them.
- **The lawful fixture was never lawful on parchment** (the calibration wave):
  it paints the void ground under the light theme.
