# UI composition — cards, panels, plates

How a bounded rectangle carrying a claim, a visual and some chrome is put together. Derived
from the Brand Codex CARDS reference set (~40 cards, `docs/design/card-reference-analysis.md`)
and from the surfaces this house has already shipped.

This is the layer between the token law (which says what colour) and the archetype recipes
(which say what a slide is). It answers: **where does the type go, and why there.**

---

## The three registers

Every card in the reference set is the same stack, and the whole system follows from it:

| Register   | What it is                                                | Face                                  |
| ---------- | --------------------------------------------------------- | ------------------------------------- |
| **CLAIM**  | The sentence you read first. What this thing IS.          | PP Neue Montreal (or PT Mono display) |
| **FIELD**  | The visual — generative, diagrammatic, or processed image | —                                     |
| **CHROME** | Kicker, caption, designation, CTA label                   | PT Mono, uppercase, tracked, small    |

**Three registers, no fourth.** The weakest cards in the reference set are the ones that add
a tag row, a second CTA, or a logo lockup competing with a wordmark. When a card feels
crowded, the fix is almost never smaller type — it is that a fourth register got in.

**What varies between cards is only the ORDER and PROPORTION of those three.** That is what
lets forty cards from a dozen unrelated brands read as one discipline, and it is the answer
to "the text sits in different places on each card and they still look like a set": the roles
are fixed, the positions rotate.

---

## The five archetypes

### A. STACK — claim top · field centre · name foot

The purest, and the default for a card that has to name a capability. The claim and the name
sit at opposite ends with the field holding them apart, so they never compete. The field is
the middle third and is allowed to be the largest thing on the card.

Use when: the card is one of a SET, and each member names a different thing.

### B. CORNER-ANCHORED — claim in one quadrant · field takes the rest

Claim (and CTA, if any) in one corner; the field fills what remains and **bleeds off at least
one edge**. The claim sits in the negative space the field leaves — not in a reserved box.

Use when: there is a call to action, or the field is atmospheric rather than diagrammatic.

### C. INVERTED — field dominates · claim low

The image is the entry; the display type sits low, over or under it. The eye enters through
the picture and lands on the words.

Use when: exactly one card in a set is the thesis or the emotive beat. **One or two per set,
never the default** — it is the variation that proves the system, and a set of all-inverted
cards has no system to prove.

### D. SPLIT — type column beside field column

Two columns, one voice each. The type column never floats over the field column.

Use when: the copy is genuinely long, or the field is portrait.

### E. INSTRUMENT — the field IS a readout

A bordered housing, a header band, the claim, then labelled meters/bars/diagrams carrying
values a reader can check.

Use when: there is a record to show. **This is the family the Thoughtform casefile
instruments already belong to** — the PDA console, the carrier, the authored wireframes. It
is the house's strongest register and the one to reach for when real data exists.

---

## The composition rules

1. **Mono does exactly three jobs** — kicker/eyebrow, technical caption, CTA label.
   **Mono never carries the claim.** (On this site PT Mono display titles are a deliberate
   product exception for hero type; inside a card, the claim is prose.)
2. **One accent, and the FIELD spends it.** The claim stays neutral; colour goes into the
   visual. Maps exactly onto gold-as-wayfinding — a card whose title is gold has spent the
   accent on the thing that needed it least.
3. **The field bleeds.** A visual inset on all four sides with air around it reads as an
   illustration in a document, not as a card. This is the same law as the console bezel:
   _a frame is something content bleeds into, never a letterbox._
4. **Chrome sits at the extremes** — kickers at the very top, captions and designations at
   the very bottom, in the plate's own margin. Nothing floats mid-field.
5. **CTAs are small and outlined**, never a full-width filled slab. Two full-width
   gold-outlined bars on one surface are a single visual rhyme whatever their labels say, and
   the eye pairs on silhouette before it reads either.
6. **Generative over photographic.** The reference set's argument is _the work rendered as
   geometry_. Where a photograph is used, it is **processed into the grammar** — dithered,
   duotoned, particle-perforated — so it reads as material rather than as stock warmth.
7. **Selection is ELABORATION, not highlight.** The chosen card in a set earns more
   information — an extra tier of readouts — while staying the same hue as its siblings.
   Stronger than a colour change, and it does not spend the accent. (Independently arrived at
   by the corpus and by this house's own casefile.)

---

## Corners, in a card

Per the corner law: a card is a **machined housing**, so it chamfers. Its **children are
square**. A uniform SET may share one notch **on the lawful diagonal** (TR+BL sitewide; a set
seated inside a housing takes that housing's diagonal instead).

⚠ A single notch MEANS oriented-or-connected. Twenty identical cards in a grid are neither —
give them the lawful pair, not a decorative single cut.

---

## Type inside a bounded box

- **Sizes are derived from a measured box, never chosen.** Different elements in one card can
  answer to different measures — a title anchored to a left wall has the full width; a pair
  pinned to opposite walls shares the space between them, so growing either closes the gap in
  the middle.
- **Vertical clearance is measured against the LINE BOX (~1.3em), never the font size.**
  Naive font-size spacing produces collisions that every per-string check passes.
- **A cap height used for a frame is a CONSTANT, not `measureText`** — ascent varies per
  string, so measuring gives four different frame heights for four labels.
- **When a box will not take the size, spend padding, leading or content density — never
  shrink an important label.** A label nobody can read is not a quiet label, it is an absent
  one.
- **Split the slack, do not pool it.** Extra height distributed around content reads as air;
  the same height at the bottom reads as a hole.
- **A clamp is a belt against future copy, never a layout lever.** If today's copy hits the
  clamp, the clamp is wrong — and a clamp truncating text IS its "fitting" behaviour, so
  every overflow assertion stays green while the words go missing.

---

## Measuring a composition

- **Overlap between two labels is the check nothing else does.** Containment tests ask
  whether a label is inside its box; none asks whether two labels are inside each other.
- **A symmetric overflow reports ZERO.** A centred box that outgrows its row spills equally
  through the top and bottom, so `scrollHeight === clientHeight` and the tooling prints OK on
  a broken frame. Measure the parts against their container, not the container against itself.
- **Measure on the live surface, never off a screenshot.** A capture of a scaled canvas
  understates badly — take the scale from the published anchor and multiply.
- **Verify at the owner's viewport, not only the reference ones.** A tall window makes a
  landscape-tuned composition letterbox while every guard stays green.

---

## Related

- The full reference read: `../../../../docs/design/card-reference-analysis.md`
- Live precedent in this repo: the casefile plates (`.claude/rules/proof.md`), the services
  card faces (`.claude/rules/services-ring.md`)
- Corner law: `../../../../sentinel/decisions/065-corner-law.md`
- Searching for a precedent: `design_refs` / `design_visual` on the design MCP
