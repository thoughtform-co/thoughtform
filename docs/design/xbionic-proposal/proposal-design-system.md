> **Copied into the repo on 2026-10-10** from the Claude project's files (`xbionic-proposal/proposal-design-system.md`), so a session on another machine can read it. It was written the morning of 2026-10-10, before the job cards, the Loop return and the plugin section were built. Where the built page differs, the page and its ADRs win: [ADR-153](../../../sentinel/decisions/153-the-leverage-and-the-handoff.md) (U4 to U6 on PR #21) and [ADR-155](../../../sentinel/decisions/155-the-proposal-as-a-system.md) (on `main`). Start with [the handoff note](../../plans/xbionic-proposal-handoff.md). One clause is out of date: §9 asks about "self-sufficient", which `lib/arcs/copyLaw.ts` does not ban.

# Proposal design system

One modular system for Thoughtform proposal pages. X-Bionic adopts it first, and it is the template for the proposals after it. It is derived from the `00_UI Moodboard` references (Sections, Diagrams, Terminals) and from what already works on thoughtform.co. It is **not a collage** of those references: below are the laws they share, restated in the house's own materials.

Status: proposal, 2026-10-10. The owner reads it first. The page code belongs to the "Rework the X-Bionic proposal" thread. This document changes no code.

---

## 1. What the references agree on

Tensorlake, Droidrun, Detail, Vorflux, the Palantir Foundry stack, "The Attention Stack", the simulation plant, and the amber terminals look nothing alike on the surface. Underneath, they follow the same seven rules. These rules are the system. Nothing else from the references is copied.

| #   | Law                                                                                                                                       | Where it shows                                                                                                                             | What it means here                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | **One ruled field, not floating cards.** Regions are cells that share edges. A hairline is the structure, and a gap is never the divider. | Tensorlake's grids are one rectangle cut by hairlines, with a dotted hatch gutter between regions. Attention Stack is one section drawing. | A section is ONE housing cut into cells. Three separate chamfered cards side by side are banned (that is the "glorified PowerPoint").                                                                            |
| L2  | **One lit object per view.** Everything else is line work at one weight.                                                                  | Droidrun's single solid circle. Tensorlake's one green step marker. Vorflux's yellow triangles on an otherwise pink panel.                 | One gold fill per section. The rest is dawn hairlines and outlines.                                                                                                                                              |
| L3  | **Lettering sits beside the drawing, never on its faces.** It is joined by a leader or set in a lettered column.                          | Foundry's labels in a right-hand column. Attention Stack's LEVEL 01 to 04 down the left.                                                   | Every diagram has a label column or leader callouts. Text inside a drawn plate is limited to one short mono name.                                                                                                |
| L4  | **Every drawing states its datum.** That means an axis, a scale, a level, or coordinates.                                                 | The simulation plant's 0 to 120 scale. The star chart's HDG dials. Attention Stack's "SCALE / YEAR". Moira's 5 MINUTES → HALF A DAY.       | A diagram without an axis or level ladder is decoration. Give it a scale, or make it a readout.                                                                                                                  |
| L5  | **Mono chrome, sans meaning.** The mono eyebrow, figure and key carry the instrument. The sans carries the sentence.                      | Tensorlake's `■ METRICS` eyebrow and mono figure over a sans caption. Droidrun's sans title over a mono deck.                              | PT Mono is chrome. PP Neue Montreal is prose (ADR-092, ADR-067). Never mix them inside one role.                                                                                                                 |
| L6  | **The caption block closes the drawing.** It holds a figure number, a title and a provenance line, boxed or bracketed in a corner.        | Attention Stack's "DIAGRAM / MODEL / SCALE / YEAR". Detail's `// CIRCULAR THROBBER VIEW`.                                                  | `FIG. 0N` plus a title plus one line ("Illustrative" or a date), inside corner brackets, bottom-left of the drawing.                                                                                             |
| L7  | **One recurring motif carries the page.**                                                                                                 | Droidrun's dotted line runs through the hero, the cards and the phone rails.                                                               | The **layer plate** (the hatched-gold isometric plate "Your layer") recurs in every section that talks about the configuration. The plate is the same object at different scales, never a new drawing each time. |

What gets left behind on purpose: the Vorflux glow and chromatic CRT bloom, the Detail pastel gradients, the blue Droidrun ground and the ASCII box art. The house already has its own ground (void, dawn, Tensor Gold), and borrowing a second palette is exactly the Frankenstein outcome to avoid.

---

## 2. Materials (existing tokens only)

No new tokens are needed. Everything below already exists on the site.

**Ground.** `--void` / `--void-deep` (dark) or parchment (light, ADR-058). One ground per page. A section never invents its own background colour. The one exception is the **interstitial**, which may sit on the key visual.

**Line ladder.** Three weights, never more:

| Role             | Value                                                                        | Use                                                |
| ---------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| Housing          | 1px `--lat-lip` / gold lip ring (clipped evenodd ring, both contours closed) | The outline of the one housing per section         |
| Structure        | 1px dawn at the `--lat-rule` alpha                                           | Cell edges, axes, leaders                          |
| Hidden / not yet | 1px dashed dawn, same alpha                                                  | Shared or not-yet-owned parts: the models, "today" |

Gold never draws structure. It marks: the one lit object, the owned layer's hatch, the active state.

**Colour roles** (from the gold ramp, ADR-063 U2):

- `--gold` is a fill or mark. Used once per section.
- `--gold-line` is a gold outline (light theme).
- `--gold-ink` is gold text.
- **Green (Atreides) means a person and nothing else.** The green diamond ◆ is "a person decides here".
- **Hatched gold** means the layer the client owns ("what the team writes").
- **Dashed dawn** means shared, or not yet configured.

These four meanings hold on every section of every proposal. A reader learns them once.

**Tensor Gold gradient.** This is the client band on the proof folder (ADR-097). It is reserved for the case head band. It never fills a diagram.

**Corners** (ADR-065): a housing takes the TR+BL chamfer pair at `--lat-ch-plate-fluid`. A notch on one corner (TR) means oriented or connected (a case card, a step in a sequence). The children of a chamfered box are square. An ellipse or ring is drawn line work, not a housing.

---

## 3. Type and spacing

Type uses the lattice ladder, `--lat-*` on `:root`:

| Role                      | Face                                               | Token                      | Notes                                                                                            |
| ------------------------- | -------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| Section title             | PP Neue Montreal, uppercase only where authored so | `--lat-title` / `--lat-h2` | Two lines max. The second line is gold (`em`). It is a NAME, not an aphorism (copy law ADR-078). |
| Dek                       | PP Neue Montreal                                   | `--lat-lede`               | ≤ 44ch, right column of the head                                                                 |
| Eyebrow                   | PT Mono, `--track-eyebrow`                         | `--lat-chrome-sm`          | `THOUGHTFORM · THE APPROACH`. A small filled square ■ may lead it (Tensorlake), always gold.     |
| Diagram label / key       | PT Mono, `--track-label`                           | `--lat-chrome-md`          | Uppercase                                                                                        |
| Readout value             | PT Mono                                            | `--lat-chrome-lg`          | Figures and dates                                                                                |
| Caption / sentence        | PP Neue Montreal                                   | `--lat-copy`               | Sentence case                                                                                    |
| Big numeral (case return) | PT Mono                                            | `--lat-h2`                 | One per card                                                                                     |

Rules:

- The floor is **12px rendered**. A label under it is absent, not quiet (ADR-070 U10).
- The weight ceiling is `--weight-lit` (500). Mono never goes above 400.
- No italics. No em dashes in client copy. No first person anywhere on the page: the page speaks as Thoughtform or about the client ("Thoughtform sets up", "the team writes"), never "I" or "My view".

Spacing:

- The section rhythm is `--lat-sec-pad`. The head-to-body gap is `--lat-head-gap`. The head seats on `--lat-head-datum` (ADR-099 U2).
- Inside a housing, cells pad at `--lat-pad-cell`, and chrome sits at `--lat-pad-chrome`.
- **Clearance law (the "Only yours" fix).** A tag, chip or button keeps at least `--lat-pad-cell` from any text it does not belong to, on every side. A tag sits on its own row at the plate's top-right, or in the leader column. It never sits inline at a sentence's end. A tag that cannot get the clearance moves; it does not shrink.

---

## 4. Section archetypes

Twelve archetypes. Each one is a composition, not a skin. **The adjacency rule:** two adjacent sections never share an archetype, and a page never has three sections in a row that use the same split (for example three head-left/body-right in a row). Interstitials are the deliberate break between groups.

For each archetype: when to use it, its anatomy, and its law.

### A1 · Masthead (hero)

The key visual (Thought + Form, ADR-144) with the curtain. Title, a one-line dek and two actions. The client name appears in the eyebrow. Already built; keep it.

### A2 · Statement split

**When:** about, the stance, any section whose content is an argument rather than a picture.
**Anatomy:** the two-column head only, with the title left and the paragraph at the midpoint (ADR-099 U2). Below it sits one **ledger strip**: three to five ruled key/value rows across the full width (mono key, sans value), closing the argument with facts.
**Law:** no drawing. If you feel it needs one, it is a different archetype.

### A3 · Spectrum

**When:** positioning between two poles. The vision's "AI sits between a tool and a collaborator" is the case here.
**Anatomy:** one horizontal axis across the band, with ticks at the lattice pitch. The poles are lettered at the ends in mono: `A TOOL YOU OPERATE` ↔ `A COLLABORATOR`. Three to five stations sit on the axis, each with a leader down to a one-line sans caption. One gold marker sits where the client is going. The current position is a dashed outline marker.
**Law:** the axis is the datum. No boxes around the stations.

### A4 · Exploded stack (the layer plate)

**When:** anything made of layers. The configuration (models → Claude Enterprise → your layer), and where the work plugs in.
**Anatomy:** 2 to 4 isometric plates in `ISO_BASIS_STAGE`, stacked with air between them, and the owned plate (hatched gold) on top. A **label column** on one side gives each plate its name, a one-line role, and a tag (`EVERYONE` / `IN PLACE` / `ONLY YOURS`) on its own row (see the clearance law). A Foundry-style **return arc** may run from the top plate down the far side and back up to show "the work flows back into the layer". It is one curve with one arrowhead, drawn in structure weight.
**Law:** this plate is the page's **recurring motif** (L7). It is drawn once, from one geometry module, and shown again at other scales in A6, A8 and A10. Nothing is lettered on a plate's face except its single short name.

### A5 · Quadrant cell

**When:** four peers of equal rank. The four disciplines.
**Anatomy:** ONE housing divided by one cross, with the four cells sharing their edges (the red-line grammar, ADR-084 U2). Each cell holds a mono index plus name, one sans line, and a small line glyph. The cell names follow the workstream order: **Creative production · Creative ops · Creative review · Creative strategy**.
**Law:** never four separate cards. The cross may carry a hub label at the crossing.

### A6 · Ascent (the adoption → automation flywheel)

This is the section the screenshot "How adoption and automation connect" should become. It replaces the three cards with `›››` chevrons and the time bars. See §5 for the full drawing spec.
**When:** one argument that compounds: adopt → write it down → automate → move up.
**Law:** it is a climb, not a wheel. The repetition is drawn as altitude gained, never as a horizontal circle.

### A7 · Horizon (two lanes)

**When:** contrasting a short task with a long-horizon task. This is the Moira slide, re-skinned.
**Anatomy:** one shared time axis along the bottom (`5 MINUTES → HALF A DAY → DAYS`) as the datum.

- **Lane 1, "A tool you operate":** short dashed segments, each ending at a green diamond (the person checks every step).
- **Lane 2, "An agent with context and evals":** one continuous gold line with small ticks ("checks its own work"), one loop-back ("steps back and retries"), and one green diamond near the end ("stops and asks").

A label column on the left names the lanes. A `FIG.` caption sits bottom-left, and one sans sentence sits beneath it ("It can work for hours when it has the context and the evals").
**Law:** the only gold is lane 2. Lane 1 is dawn.

### A8 · Instrument board (where it fits)

**When:** showing the configuration inside the client's existing system. "Four skills, one plugin, in your Claude Enterprise."
**Anatomy:** keep what screenshot 06 already does well: the gold-outlined housing, the ORGANISATION / WORK toggle, and the two isometric plates with lettered annotations left and right ending in leaders. The plates must be **the A4 plate geometry**, not a second drawing. Fixes:

- The legend (`◇ what the team writes · ◆ a person`) moves into a boxed key in the TR or BR corner (L6).
- The creative-engine box and the four discipline boxes become one row of cells sharing edges (L1).

### A9 · Interstitial (one line)

**When:** a chapter break. "In 2024, Loop decided to go AI-first." "The same approach, at two other brands." "What we set up at X-Bionic."
**Anatomy:** one line of display type centred on the datum, over the key visual or an empty ground. Nothing else is allowed except an optional mono eyebrow and a chapter tick (`PART 01 / 03`) on the rail.
**Law:** the line is alone. The index of what follows (the 01 Films / 02 Tools list) is NOT on the interstitial. It belongs to the first case beat or the rail. This is what the owner asked for and what the shipped `variant: "chapter"` still violates: it carries a subline and an index.

### A10 · Proof folder (Loop)

**When:** the long, chronological case with several parts.
**Anatomy:** the existing proof stack (ADR-096/097). Glass folders, the **Tensor Gold** client band, the TR notch, a pile receding by depth, and terminal frames inside. The chronology runs as the folder order. It ends on the folder whose claim is **"the layer any agent can run on"**, which shows the A4 plate one more time, inside the folder, at card scale.
**Law:** Loop alone gets the full gradient band.

### A11 · Case card (other clients)

See §6. One card per job, in one template.

### A12 · Ledger, crew, terms, close

**When:** the offer's facts. The two weeks, who takes part, the fee, the close.
**Anatomy:** ruled rows (mono key | sans value), one housing per section, and at most one filled row (the lit object). The two weeks may become a **dated axis** (the `program` grammar): days as ticks, deliverables as anchors at their real day. That is truer than three stacked lists.
**Law:** the fee is a ledger with one total, never a card.

---

## 5. The Ascent drawing (adoption → automation)

The owner's argument, in his order:

1. The team adopts Claude on its own work.
2. They write the work down as skills (how it is done) and evals (what good looks like).
3. Encoding lets agents take **longer-horizon** tasks.
4. That frees the team to move **upstream**, to a higher abstraction layer (from making assets → to briefs → to campaigns → to strategy).
5. Repeat, and each turn starts one level higher.

**The drawing:** an isometric **stepped tower**, seen from the stage basis. Four treads rise from the floor (downstream) to the top (upstream). It is the Suri upstream/downstream idea, held still.

- **Vertical axis, lettered on the left (L4):** `ABSTRACTION`, with the treads named from the bottom up:
  - `ASSETS` (making and resizing)
  - `BRIEFS`
  - `CAMPAIGNS`
  - `STRATEGY`
- **Horizontal depth:** the task horizon. Each tread is deeper than the one below it (minutes → hours → days), so a longer horizon literally becomes a larger plate.
- **On each tread:**
  - the green diamond ◆ is where the team stands;
  - a hatched gold plate is what they wrote down at that level (skill + eval);
  - a dashed outline is the agent's run, extending across the tread's depth.
- **The flywheel motion** is one continuous line that spirals UP the tower. It goes round the back of each tread and comes out one level higher: adopt (◆) → write it down (hatch) → automate (agent run) → step up. It is drawn once in structure weight, and only the current turn is gold. This answers "a flywheel, but not a wheel that needs to be horizontal". The loop is real, and its axis is vertical.
- **Label column, right:** the three verbs, each a mono key with a sans line:
  - `ADOPT` · the team learns on its own work.
  - `WRITE IT DOWN` · how the work is done, and what good looks like.
  - `AUTOMATE` · Claude runs it, and asks when unsure.
- **Caption:** `FIG. 03 · EACH TURN STARTS ONE LEVEL HIGHER` in corner brackets, plus "Illustrative".
- **What goes:** the "where your team's time goes" barcode bars. The tower already carries that argument: the team's diamond rises, while the lower treads stay populated by agent runs.

The tread plates use the **same plate geometry as A4** (L7), so the reader recognises "your layer" being built one tread at a time.

A7 (Horizon) follows it directly as its own section. Ascent shows that encoding moves the team up. Horizon shows why encoding lets the agent run longer. They are two separate drawings, and they never share a housing.

---

## 6. Case card anatomy (A11)

From the Suri card (screenshot 05), kept and tightened. One template for every non-Loop job.

```
┌──────────────────────────────────────────────── notch TR ┐
│ HEAD BAND · client name (mono)        WORKSTREAM MARKER ▸│  ← restrained gold band
├──────────────────┬──────────────────────┬────────────────┤
│ THE BRIEF        │ THE PROOF            │ THE RETURN     │
│ ask (sans, 1¶)   │ dotted figure field  │ one big mono   │
│ CLAUDE DID       │ dot-leader readouts  │ numeral + unit │
│ 01 … 04 (mono    │ FIG. 0N caption in   │ one sentence   │
│ index, sans line)│ corner brackets      │ segment meter  │
├──────────────────┴──────────────────────┴────────────────┤
│ ◆ THE GATE · the person who signs off, one sentence      │  ← green diamond
└──────────────────────────────────────────────────────────┘
```

- **Workstream marker: top right.** One marker naming the job's discipline in full: `CREATIVE OPS`. It is a filled gold chip, and the only filled gold on the card. It **replaces** the four checkbox row. A card shows only its own workstream (memory: other-client cards show only their own).
- **Columns:** brief left, proof middle, return right. They are three cells of one housing that share their edges (L1), never three boxes. The proof column is the widest (`1fr 1.6fr 1fr`).
- **Title:** sans, one line, a name for the job ("A six-slide brief, filed on the studio's board"). It sits under the head band, left. Meta (client · made in · date) is a mono run on the same row, right-aligned.
- **Proof:** the drawn or captured artefact, with dot-leader key/value rows and a `FIG.` caption.
- **Return:** one numeral at `--lat-h2`, its unit in mono, one sentence, and a segment meter (n of total, gold for the done count).
- **Gate foot:** the green diamond and the role (never a staff surname), plus one sentence.
- **Head band:**
  - Loop → full Tensor Gold gradient (A10).
  - Every other client → the same band at a restrained alpha, with "some Tensor Gold" kept on the lip and the marker. The client's own accent colour may tint the band (`CaseDef.accent`), and never the diagram.
- **Order across the four jobs** follows the workstream order: Creative production · Creative ops · Creative review · Creative strategy.

---

## 7. Diagram grammar (technical manual)

This applies to every drawing on every proposal.

- **Projection:** `ISO_BASIS_STAGE` for anything with layers or depth (A4, A6, A8). Use orthographic axes for anything with time or position (A3, A7, A12 axis). One basis per page.
- **Datum:** every drawing has an axis, a level ladder or a scale (L4). Ticks follow the lattice pitch.
- **Leaders:** 1px structure-weight lines, with a right-angle elbow or a 45° jog, ending in a 3px dot on the object. The label sits at the leader's free end, in the label column, never on the object.
- **Registration:** `+` crosses at the housing's inner corners (only where the housing has no chamfer there). Corner brackets frame a figure field.
- **Caption:** `FIG. 0N` + title (mono) + provenance (sans, "Illustrative" or a date), bottom-left, inside brackets.
- **Legend:** a boxed key in one corner when, and only when, the drawing uses a symbol that §2 does not already define. The four standing meanings (gold fill, hatch, dashed, green diamond) are the house legend. Print it once per page at the first diagram, then trust it.
- **Readouts:** dot-leader rows (`KEY ........ value`). The key is mono uppercase and the value is mono or sans.
- **Motion:** draw-on along the line's path (`pathLength`) at arrival, once. Nothing spins or pulses. The one lit object may settle in last.
- **Density cap:** at most about 15 lettered elements per drawing. Past that, split it into two sections (A6 + A7 is the model).

### 7a. Raising the register (Oxide, owner 2026-10-10)

Vince's reference is oxide.computer: "how they use the diagrams and particle system ... in a very elevated way". The site already has both a diagram language and a particle language. What Oxide shows is how much **restraint** makes them read as craft. These are the moves to take, restated in our materials:

1. **Drawings are made of glyphs and particles, not strokes.** Oxide's isometric racks are built from type: `+` at every vertex, `-` and `|` for edges, `.` for receding edges. That is our particle grammar applied to wireframes. For the layer plate, the Ascent tower and the instrument board, render the hidden and dashed edges as **dot runs at the lattice pitch** (a particle row), and the visible edges as 1px line. Vertices take a `+`. The drawing then belongs to the brandmark's particle world instead of looking like a generic vector icon.
2. **The accent marks the one thing that matters, and only that.** The whole Oxide drawing is dim grey, and red appears only on the fault: the broken trace and the `STATUS ERROR` readout. For us, the drawing is dawn at low alpha, and gold appears only on the lit object (the client's layer, the current turn of the Ascent, the one plate the section is about). This tightens L2: inside a drawing, gold covers well under a tenth of the ink.
3. **A readout can live inside the drawing.** Oxide sets a three-line mono status (`~> STATUS / ERROR / AB-8000-8W`) inside a rack bay. This is the one sanctioned exception to L3: a short mono readout of at most three lines, set **inside a drawn cell** (not on a projected face), in the accent colour, saying what that part is doing (`~> LAYER / OWNED / X-BIONIC`).
4. **Two-tone titles, no colour needed.** "...for running compute. Both required compromise." The second clause is the same face at a dimmer ink. Our gold second line stays the default, but a section whose drawing already carries the gold should use the **dim-ink second line** (`--lat-ink-dim`), so the page has one gold moment per view.
5. **Lists lead with a bright phrase, then dim.** "**8+ vendors** across compute, networking…": the lead words sit at full ink, and the rest of the line is dim ink in the same size and face. No bullets, no bold weight. Use this for the ledger strips (A2), the case card's "Claude did" list and the return sentence.
6. **The gutter is a glyph column.** The two Oxide comparison columns are divided by a vertical run of `#`, which is a texture rather than a rule. Our equivalent is a **dotted particle column** at the lattice pitch, used only where two cells are compared (before/after, today/configured, the two Horizon lanes). This is L1's "dotted hatch gutter" (Tensorlake), now with its job named: a comparison seam.
7. **Air around the drawing.** Each Oxide drawing sits in about a third of its column with nothing else near it. A drawing never fills its cell edge to edge. Leave at least `--lat-pad-cell × 2` of clear ground around the figure, and let the caption and the list carry the rest.

What not to take: the terminal green and the red. Our accent is gold, and green stays reserved for a person.

---

## 8. The X-Bionic page, mapped

The section order follows project memory. The archetypes alternate per the adjacency rule.

| #   | Section                                                 | Archetype                                      | Notes                                                                                             |
| --- | ------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Hero                                                    | A1 Masthead                                    | —                                                                                                 |
| 2   | About                                                   | A2 Statement split                             | Third person: "Thoughtform builds…"                                                               |
| 3   | Vision: AI between tool and collaborator                | A3 Spectrum                                    | Intelligence, not software                                                                        |
| 4   | The intelligence configuration                          | A4 Exploded stack + A5 Quadrant in one housing | Screenshot 01's structure, with the four workstream names and the "Only yours" tag on its own row |
| 5   | The approach                                            | A6 Ascent                                      | Replaces the three cards + time bars                                                              |
| 6   | Longer-horizon work                                     | A7 Horizon                                     | Moira, re-skinned                                                                                 |
| 7   | Where it fits                                           | A8 Instrument board                            | Same plate geometry as #4                                                                         |
| 8   | Interstitial: "In 2024, Loop decided to go AI-first."   | A9                                             | Line only. The index moves out.                                                                   |
| 9   | Loop cases                                              | A10 Proof folder                               | Chronological, ends on "the layer any agent can run on"                                           |
| 10  | Interstitial: "The same approach, at two other brands." | A9                                             | —                                                                                                 |
| 11  | Suri and Samako                                         | A11 Case card × 4                              | One workstream each, in workstream order                                                          |
| 12  | Interstitial: "What we set up at X-Bionic."             | A9                                             | —                                                                                                 |
| 13  | Two weeks                                               | A12 dated axis                                 | —                                                                                                 |
| 14  | Who takes part                                          | A12 ledger/crew                                | Roles, not names, for the client side                                                             |
| 15  | Fee                                                     | A12 terms                                      | One total                                                                                         |
| 16  | Close                                                   | A1 close                                       | —                                                                                                 |

Check: no two neighbours share an archetype, and the configuration plate appears at #4, #6 (as treads), #7 and #9 (inside the last folder). That repetition is what makes the sections feel like one system.

---

## 9. Review checklist for any proposal section

1. Which archetype is it, and do its neighbours use different ones?
2. Is it one housing cut into cells, or several floating boxes?
3. How many gold fills? (The answer is one.)
4. Does every drawing state its datum and close on a `FIG.` caption?
5. Is any text set on a drawn face beyond one short name?
6. Is every tag at least `--lat-pad-cell` clear of unrelated text?
7. Any first person, italics, em dashes, or "self-sufficient"?
8. Is anything rendered under 12px at 1280×720?
9. Is the layer plate the same geometry everywhere it appears?
10. Light theme: is every alpha re-derived, not inherited?

---

### Sources read

- **Moodboard (Drive `00_UI Moodboard`):**
  - HEX Tensorlake 1 and 2
  - Droidrun 1 and 2
  - Detail (Hex-1)
  - Vorflux 2/3/4/6
  - Palantir Foundry stack
  - The Attention Stack
  - Simulation plant tree
  - OpenVMS monitor
  - Interconnector B (two shots)
  - Perspective-grid HUD
  - Star chart with heading dials
  - The Particle Systems and Holograms folders and the two Tensorlake videos were not opened. The seven laws above did not need them.
- **Site:**
  - X-Bionic content (`lib/arcs/content/x-bionic-proposal.ts`)
  - `thoughtform-design` references: proposal patterns and the isometric wireframe grammar
  - Lattice tokens (`app/styles/lattice.css`)
  - ADR-065, ADR-084, ADR-092, ADR-097, ADR-099 and ADR-149, as summarised in CLAUDE.md and the rules
  - Owner screenshots 01 to 06
