# Instrument grammar — how the house draws a system (ADR-154)

The fourth register beside the celestial, ring and isometric grammars: how the house draws a
**system** — housings, wiring, callouts, altitudes. It names an existing primitive for every
element and adds none. The one object it exists for is the intelligence configuration: six
answers around one piece of work, drawn once and read at five altitudes.

## 1. The housing hierarchy

Six objects, nested in this order. Every edge is 1px dawn at a line-law alpha (`app/styles/
lattice.css` §6); gold draws nothing but a lip; green draws nothing but the human.

| object | nests in | primitive | corner (ADR-065) | edge | ground |
|---|---|---|---|---|---|
| **sheet** | the page band | `.lat-sec > .lat-band` | none | `--lat-seam` between sections | void |
| **housing** | the sheet | `.lat-frame[data-cut="tr-bl"][data-ch="plate-fluid"]` with `__head`, `__body`, `__foot` | TR + BL chamfer | `--lat-lip`; **lit** `--lat-lip-lit` on the altitude you are at | `--lat-plate` |
| **panel** | the housing | `.ins-panel`: a square frame with its HEADER STRIP inside (label left, state chip right; `components/instrument/instrument.css`, from the guide's panel) | square (rule 4: the children of a chamfered box) | `--arc-seam`; **dashed = not built**; **lit = gold ring, gold strip** | none; the strip `rgba(dawn,.05)` |
| **chip** | the housing's centre | `.ins-chip`: the R4 band (`substrateKit.tsx` `band()`): a single TR notch, a 2px gold rule that stops at the cut, the gold wash | TR notch (a single notch means connected, rule 5) | `--gold` | the ONE filled object |
| **node** | a trace, a rail, a list | a 5–8px square rotated 45° (`.ins__legend i`, `.ins-check__mark`) | diamond | open 1px `--arc-ink-50` = the model | **filled `--atreides-light` = a person** |
| **station** | a rail | `.ins-panel` at the run altitude, a chevron in the gap | square, the chevron gold-line | `--arc-seam`; the decision station is the owner's, green | none |

Rules that make this a hierarchy rather than stickers: **one chip per figure**; **one lit housing
per page** (where you are); the lit plates are what the team writes and nothing else; two tones
beside quiet, gold and green. **No label cuts a frame** (owner, ADR-151 U5): the header strip is
inside the frame; nothing is lettered on a border or across a trace.

## 2. Callouts and indices

- **Pins and legend.** A pin is a 4×4 square at the end of a trace; a numbered pin is a diamond
  with a mono numeral. The legend under a figure is rows: the numeral in `--gold-ink`, the term
  in sans 15–17px, the meaning in mono 12.5px. Terms large, meanings small, never the inverse.
- **Leaders.** DOM 1px lines, never a single-axis SVG stroke (ADR-068 U6); a level stub, one 45°
  dogleg (`ribbon.ts` `bend`), a level run. The leader takes the slack, the label does not.
- **Readout rows.** `key | value` in mono on a shared edge, the key framed and filled, the value
  set right (the Starfield row, ADR-130). A value that is a sentence is sans.
- **State chips.** `.ins-panel__chip` / `.ins__tag`: 10px mono `.12em`, a 1px `--gold-line`
  border, `--gold-ink` text. Vocabulary `LIVE · SOON · VOLGT`; `SOON`/`VOLGT` turn the frame dashed.
- **The tie-back.** At the plugin altitude every panel carries `answers · the context`: the word
  that names it at the altitude below. Without it the figure is a folder.
- **The designation.** The housing's head strip: `INS · <record>` left, the breadcrumb centre,
  the tag right. The arc's own eyebrow (`01 · THE SYSTEM`) and kind designation (`ARC / INS · 02`)
  stay the beat's.
- **Collisions.** `lib/instrument/measure.ts`: every panel, chip, pin, node and label box;
  pairwise overlaps at 0.5px tolerance (nesting allowed); horizontal overflow; text under 10px.
  The lab prints it, the capture asserts on it. The labels size the drawing.

## 3. Connections

| trace | when | recipe |
|---|---|---|
| single wire | a step, an arrow, a leader | 1px `--arc-seam`; gold-line only on the lit run |
| 8-wire ribbon | it carries the configuration (plate → chip) | `ribbonPaths(pts, 8, 4)`, `opacity .85`, non-scaling, 45° jogs; ends on a plate's edge, never under it |
| arrow head | direction matters | border-drawn (`4.5px/7px` triangles) or the 6px rotated chevron; never an SVG marker |
| bidirectional | a sync (GitHub ⇄ Claude) | one wire, two heads, the verb on the line |
| dashed return | feedback, the loop closing | 1px dashed `--arc-seam`, one head; a dashed run never draws on |
| bus + stubs | one source fans to surfaces | one level bus, N stubs, pseudo-elements in the grid gap |

## 4. Grounds

Dot grid (24px, radially masked) under wiring; graticule under an axis; plain void under
panels, ledgers and rails; the iso floor only when the record has height. A diagram of boxes and
arrows takes no ground.

## 5. Zoom semantics

One instrument, five altitudes. What is the housing at one altitude is the chip at the next.

| altitude | the chip | lit (gold) | green | what the six are |
|---|---|---|---|---|
| **org** | the OS (the plugin, as the organisation sees it), its workstreams listed | the parts the workstream writes | the owner | the model, the data, the interface shared along the top; the context, the evaluations, the owner per workstream below |
| **plugin** | the skill that reads the others — the **mother** | the skills, the evals (the **father** sorts every remark beside them) | the owner plate | folders: the skills, the evals, the connectors, the owner; the account above (sets the model), the interfaces on the bar |
| **work** | the piece of work | the context, the evaluations | the owner | six plates, three a side, ribbons to the card |
| **run** | the ask | station 5, you decide | the decider | 1 you ask (interface) · 2 Claude picks the skill (model) · 3 it follows the steps (context) · 4 it checks itself (evals) · 5 you decide (owner); the tools (data) under 3 |
| **check** | station 4, opened | the checks' states | the owner decides; the dashed return | the checks as rows: gates first, `pass / review / block / not run`; the rest dim |

"You are here" is the one lip-lit housing plus the breadcrumb in its head strip
(`ORGANISATION / PLUGIN / WORK / RUN / CHECK`, the current word `--gold-ink`). No reticle: that is
the celestial register's mark.

## 6. Motion (ADR-080: arrive once, never idle)

Arrival: ground → housing → chip → owner → traces draw on → plates → the lit lip last; draw-ons
420–600ms, UI states 80–150ms on `cubic-bezier(.16,1,.3,1)`. The altitude transition plays once
per pick and the drawing is then still. The engines on the lab's `zoom` knob: **css** (the
attribute swaps, transitions on opacity and edges: a cut), **flip** (`gsap/Flip`: the same nodes
travel between their seats, `absolute: true, scale: false`, 360ms `power3.out`, stagger 30ms),
**anime** (animejs, a FLIP by hand). Reduced motion: every engine is the cut. No JS: the authored
altitude renders whole, the picker inert. Nothing under the figure trees may run `infinite`
(`no-idle-motion.test.ts`; the terminal cursor is the one exception).

## 7. Type

PT Mono inside the instrument (labels 10.5–11px `--track-eyebrow`, rows 12–12.5px), PP Neue
Montreal beside it and for names (14–18px). Emphasis is ink, never weight; no italics; `--gold-ink`
for a gold word in light; nothing under 10px.

## 8. Light and phone

Light: alphas re-derived through the arcs' ramp, never inherited. Phone (≤900): the wires and the
dot grid off; every altitude stands up in its reading order (the chip, the lit parts, the owner,
the rest); the rail stands up; the return path is dropped and said.

## 9. What NOT to do

Equal boxes with centred text · a label straddling a border · three cards in a row with no seam ·
a paragraph inside a panel · four-corner or TL+BR chamfers · radius · gradients or shadows for
depth · idle pulses, spins, orbit rotations · a second gold object · green for anything but a
person · SVG `<text>` for a sentence · a dashed run asked to draw on · a second instrument of the
same record on one page (the said-twice defect).
