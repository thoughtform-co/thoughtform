# Musings gallery — directions for what sits under the head

Look-dev for `#musings`, the homepage's writing station. The head is settled:
it hangs from the services masthead's line since ADR-121 U2. This lab asks
what sits under it. The owner's read of the shipped hover row (2026-09-23) was
that it "looks bad". The row's own stills show why: a cover of dot grid around
one small glyph, and titles the strips cut mid-word. The site is a terminal on
a ship with a HUD, and the rails are its navigation. The gallery may be
classic in structure, and it has to be better.

```
http://localhost:3003/test/musings-gallery?v=v1
```

(Read the port off the running server; 3003 is the default, not a guarantee.
`/test/*` is proxy-blocked in production, so there is no thoughtform.co URL.)

## How it is built

- **The lab mounts the PRODUCTION station** (`MusingsStation`), with the
  direction in its `gallery` slot (a lab seam production never fills). The
  head, the pinned stage, the decode and the arrival are production's.
  `v0` is the shipped row, the control.
- **Every direction draws the RECORD, never a metaphor.** Title, date, tags
  (the Arc beat), reading time, and the essay's OUTLINE: its sections and
  their lengths, read off the body by `lib/musings/outline.ts`. Nothing is
  placed by hand.
- **Every device fills the frame** from the head to the rails' last tick
  (ADR-118's "each device is as tall as the rails"). The house law applies:
  - the corner law and the folder skin;
  - gold as state and marks only, never an area;
  - no vertical rule of the page's own;
  - two faces, and weights at or under 500;
  - both themes;
  - selection is one attribute moved on an event;
  - nothing flashes.

## The directions

| id   | name           | built from                                                                                     | the idea                                                                                                                                                                                                                     | trade-off                                                                                                                                     |
| ---- | -------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `v0` | Row            | production (ADR-121)                                                                           | The newest note open; the rest are strips that open on hover.                                                                                                                                                                | The control.                                                                                                                                  |
| `v1` | Codex          | CP2077 codex/journal (Cyberpunk-3) · Starfield's starmap panel · the `/arcs` log + dossier     | Master and detail. On the left, an index with one plate per note and the chosen one filled. On the right, a glass dossier: title, summary, the note's place in its year, its contents with lengths, the readout, one button. | The most scalable and the best to read. It is also the most "application". At three notes the index is short and its column has air below it. |
| `v2` | Starmap        | Starfield star map (Starfield-2) · the amber terminal instruments · ADR-078's program board    | The Arc plotted. Every note is a waypoint at its filing date in its beat's lane, on one dotted route in the order written. The selected note drops a line to its date. A readout strip sits underneath.                      | The only direction that draws the travelling the site claims. It depends on the tags: a note with no Arc tag has no lane.                     |
| `v3` | Terminal store | Vilimovský STORE ACCESS (Panel-3) · CP2077 4ST store · Marathon armory · Brand Codex STACK     | Equal portrait cards, each with an emblem (the beat in a machined diamond) and its meta. The card you are on elaborates in place: the note wipes in as the emblem wipes out, on one clock.                                   | The classic gallery done properly. Past four notes it becomes a rail that scrolls. It reads most like "a blog".                               |
| `v4` | Chapters       | a chapter select read as a book's contents · Dragonfly's writing list · Vilimovský MARKET DATA | A contents page. Every title is whole and large at the band's edge, with the record in mono columns. The open row grows down to its summary, contents and way in.                                                            | The most editorial and the simplest. It is ADR-121's accepted mechanic turned ninety degrees, and the least instrument-like.                  |
| `v5` | Memory map     | a random seed ([seed-memory-map.md](seed-memory-map.md))                                       | The archive as 128 cells. Every note takes cells in proportion to its words, and its sections subdivide its run. The selection lights the note's LEDs.                                                                       | The most distinctive. It needs the readout to say which note is which. At seven notes on a laptop its labels drop to one line.                |

## Knobs

`?v=v0…v5` · `?src=live|lab` (the three real notes, or the seven placeholders)
· `?n=3|5|7` (placeholders only) · `?theme=light` · `?console=0` (hide the
console). The console at the foot switches all four.

⚠ **The placeholders live in `../musings-row/placeholders.ts` and their
outlines in `app/(internal)/test/musings-gallery/outlines.ts`**, and nowhere
else. The site is live, and a file in `content/musings/` publishes a page.

## What the owner is being asked

1. **Which direction**, or which parts of which. They share the kit (the
   folder plate, the framed readout, the contents list, the button), so a
   hybrid is cheap. For example, Starmap's chart could sit over Codex's
   dossier.
2. **Whether the essay's outline belongs on the landing.** Four of the five
   directions letter a note's section headings. That is new information on
   the homepage and it makes the station longer to read.
3. **Hover or click.** Every direction selects on hover and focus, like the
   row, and the selection STAYS where the reader left it (a master and its
   detail are two places the pointer travels between). A click on a selected
   item goes to the note.

## Verifying

```bash
node scripts/capture-musings-gallery.mjs            # 6 directions × 3 sources × 2 themes × 2 viewports
node scripts/capture-musings-gallery.mjs --v v2 --src lab7 --vp 1280x720 --theme dark
npx vitest run tests/lib/musings-gallery.test.ts tests/lib/musings-outline.test.ts
```

The capture checks each cell against these gates:

- no page overflow;
- the device ends on the rails' last tick;
- at least 12px clear of the telemetry;
- no vertical rule taller than half the frame;
- two faces, zero radius, no type under 9.5px;
- every text rect inside the device, unless a scroller inside the device clips it;
- hover and focus move the selection there and only there.

**Only the control can fail the run.** A direction failing a gate is a finding.
Stills go to `shots/musings-gallery/<vp>-<theme>/` (gitignored), with
`report.json`. The first full run: 72 cells, the control clean, 0 open
findings.

⚠ **Two binding shapes were found by looking, not by the gates.**

- **Codex, seven notes at 1280×720.** The contents list ran under the button
  until the field was allowed to fold to its year strip.
- **Memory map at 1280×720.** Two-line labels printed over the rows above and
  below until short fields lettered the title alone.

The directions arrive on the house aperture after the head decodes (the
station's own clock). A still taken before `data-mu-arrive="in"` shows an empty
frame.
