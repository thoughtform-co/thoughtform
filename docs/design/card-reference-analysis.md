# Card reference analysis — the Brand Codex CARDS cluster

**Source:** Figma `Thoughtform Brand Codex` → page `1962:712` "Interface Moodboard" → the
CARDS cluster (x ≥ 7905, title node `2312:10`). 23 plates, ~40 individual cards.
Sibling clusters on the same page — PANELS (x ≈ −960) and ARCS (x ≈ 3818) — are out of
scope here.

**Why this document exists.** The services card faces are being redesigned (ADR-029 /
ADR-050 lineage) and the owner's question is whether the four baked portraits of himself
should stay. This is the read of the reference set he assembled, written so the answer is
an argument from the corpus rather than a preference. It is also the seed for the design
skill's `references/ui-composition.md` and for the eval rubric's anti-pattern vocabulary.

⚠ **These are distillations, not swatches.** Every colour below is a ROLE. The plates run
electric blue, acid yellow, pink and green; Thoughtform runs gold on void. What transfers
is the composition and the discipline, never the hue.

---

## The finding, in one paragraph

Every card in this set is the same three-register stack — **CLAIM** (display type, the
sentence you read first), **FIELD** (a generative or diagrammatic visual), **CHROME** (mono
technical text: kicker, caption, designation, CTA label). What changes card to card is only
the **order and the proportion** of those three. That is what makes forty cards from a
dozen unrelated brands look like one discipline: the roles are fixed, the positions rotate.
This is precisely the "text across different places, offset by the key visual" the owner
described — and it is a system, not a layout.

---

## The five archetypes

### A. STACK — claim top · field centre · name foot

The purest form, and the one closest to what the services cards want.

- `2312:6` **TALON** — display caps top, one mono line under it, the rendered object filling
  the centre, an outsized wordmark bled across the foot. Three registers, nothing else.
- `2312:36` **"The brain is an unexplored canvas"** — display serif top, a generative
  particle sphere (thousands of dotted meridians) centre, two mono caption lines foot.
  **The single most transferable card in the set.**
- `2312:57` right **ATOMIC TESSELLATOR** — line-figure centre, mono designation block, display
  name at the foot. The inverse weighting of the same stack.
- `2312:39` middle **Anthrogen** — claim top-left, an enormous script wordmark as the field.

**What makes it work:** the claim and the name never compete, because they sit at opposite
ends of the card with the field holding them apart. The field is the middle third and it is
allowed to be the largest thing.

### B. CORNER-ANCHORED — claim in one quadrant · field takes the rest

- `2312:72` **Cotool** ×2 — logo + claim + pill CTA top-left, a dithered particle image
  filling the lower two-thirds, bleeding off three edges.
- `2312:69` **Triage** — claim top-left, mono support paragraph, outlined CTA, a flowing
  line-field rising from the bottom-right corner.
- `2312:12` / `2312:45` **Droidrun** ×2 — wordmark top-left, mono two-liner, a node-graph
  disc low-centre with a dotted rule-grid behind it.
- `2312:30` **Adaptive** — display serif filling the top half, an explicit rule grid, body
  paragraph and a mono `GET IN TOUCH >` chip at the foot. The one card whose _grid itself_
  is the field.
- `2312:75` left **Bridgetown** — a long serif claim occupying the top 70 %, an abstract
  ruled-paper field below.

**What makes it work:** the field is never a rectangle inside a card — it bleeds. The claim
sits in the negative space the field leaves, not in a reserved box.

### C. INVERTED — field dominates · claim low

- `2312:54` right / `2312:24` right **"This isn't space, it's your brain"** — a coloured
  particle scatter fills the plate; the display claim sits bottom-left, over it.
- `2312:21` right **Thereby "MAPPING RELATIONSHIPS ACROSS COMPLEX LITIGATION"** — geometric
  line construction top, four lines of display type at the foot.
- `2312:48` right **"Simulation-Based Discovery At Scale"** — claim top, particle band centre,
  mono caption foot; its left sibling drops the claim entirely and runs caption-only.

**What makes it work:** the eye enters through the image and lands on the words. Used for
the emotive or thesis card in a set where the others lead with type — it is the variation
that proves the system, and the set can carry exactly one or two of them.

### D. SPLIT — type column beside field column

- `2312:21` left **Thereby portrait** — an illustrated portrait left, `BLOG 01` kicker
  top-left, wordmark top-right, mono body over the image at the foot.
- `2312:39` right **Anthrogen** — line-scribble field top, claim bottom-left, logo top-right.
- `2312:51` **Atomic Tessellator** ×2 — claim + CTA top, an axonometric line figure
  low-right, mono designations bottom-left.

**What makes it work:** two columns, one voice each. The type column never floats over the
field column.

### E. INSTRUMENT — the field IS a readout

- `2312:66` / `2312:42` right **Triage** — a bordered device frame, a header band, the claim,
  two labelled meters with percentages, a legend, and a strip of binary digits as the foot
  texture.
- `2312:75` right **Bridgetown Market Research** — mono header, display claim, three labelled
  bars with values.
- `2312:78` **verified-software-engineering set** — six plates of pure diagram: node graphs,
  a plotted curve, ruled colour bands. Type is small and only names things.
- `2312:15` **"We're manufacturing biology"** — a serif claim top, a red-and-white node
  diagram as the entire field, one centred mono caption foot.

**What makes it work:** the visual carries information a reader can check. This is the
family the Thoughtform casefile instruments (the PDA console, the carrier, the wireframes)
already belong to — the services cards are the one surface in the house that does NOT.

---

## The rules the set agrees on

1. **Three registers, no fourth.** Claim, field, chrome. Cards that add a fourth (a tag row,
   a second CTA, a logo lockup competing with a wordmark) are the weakest in the set.
2. **Mono does exactly three jobs** — kicker/eyebrow (`THE WORK BEGINS.`, `BLOG 01`,
   `THIS WEEK'S STANDOUT`), technical caption, CTA label. **Mono never carries the claim.**
   The claim is always the display face.
3. **One accent, and the field spends it.** Blue on near-black, acid yellow on black, red on
   navy, green on black. The claim stays neutral; the field is where the colour goes. Maps
   directly onto Thoughtform's gold-as-wayfinding tier.
4. **The field bleeds.** It reaches at least one plate edge on nearly every card. A visual
   inset on all four sides with air around it reads as an illustration in a document, not as
   a card.
5. **Generative, not photographic.** The overwhelming majority of fields are computed —
   particle scatters, node graphs, ruled constructions, dithered halftones, plotted curves.
   The set's aesthetic argument is _the work rendered as geometry_.
6. **Chrome sits at the extremes.** Kickers at the very top, captions and designations at the
   very bottom, in the plate's own margin. Nothing floats mid-field.
7. **CTAs are small and outlined**, never a full-width filled slab (`Book a demo →`,
   `GET IN TOUCH >`, `Try Bridgetown →`, `WORK WITH US →`) — which independently confirms
   ADR-050 Addendum 5's ruling that the tight face may not grow a CTA bar.

---

## The portrait question

**Across ~40 cards, not one presents a photograph of the founder or practitioner.** The
subject is always the work: a rendered object, a computed field, a diagram, a readout.

Two cards do carry a human, and both are instructive because of _how_:

- `2312:21` left **Thereby** — a flat illustrated portrait, heavily stylised, with mono body
  copy printed over the shoulder. It is a treatment, not a headshot.
- `2312:63` right **Marketing Memory Co.** — a photograph of a runner, dithered and
  perforated with pixel particles, with the brandmark punched through the centre of the
  figure. The photo has been _processed into the identity system_.

So the honest read is not "portraits are vain". It is that **a portrait answers a different
question than these cards ask.** These cards say _here is what the work looks like_; a
portrait says _here is who does it_. On a card whose job is to name a capability
(KEYNOTE · WORKSHOP · EMBEDDED · GUIDED BUILD), the capability is the subject and the person
is not — and the four current faces additionally repeat the same subject four times, which
is the one thing a set of four cards cannot afford.

There is also a house-consistency argument the corpus makes for us. Every other instrument
on thoughtform.co — the casefile console, the intelligence map, the authored wireframes, the
voidwalker plates — draws a **record**. The services ring is the only surface that reaches
for stock-photographic warmth instead. `2312:63` shows the resolution if photography is kept:
process it into the grammar (dither, duotone, particle perforation) so it reads as material
rather than as a headshot.

**Recommendation for Phase 5.** Lead with archetype **A (STACK)** carrying a per-service
particle emblem in the centre — it is the closest match to `2312:36`, it reuses the
`particle-icon-grammar` the brand already owns, and it makes the four cards a _set of four
different things_ for the first time. Carry one recomposed-photo variant against it, treated
per `2312:63` (processed, not printed), so the comparison is real rather than rhetorical.

---

## What NOT to take

- The gradient washes behind several headers (standing anti-pattern; and cool-tinted grounds
  are banned outright).
- Rounded corners and pill CTAs (`2312:72`, `2312:66`) — zero border-radius is law here.
- The drop shadows lifting the Triage device frame off its ground.
- Fine print sized below legibility as pure texture (`2312:66`'s binary strip) — on this
  surface that is either information or it is noise.
- Solid-fill active/selection states — Thoughtform's Heading Indicator is a directional edge,
  never a fill.
- The script/handwritten wordmark (`2312:39`) — no italic, no script, anywhere.

---

## Facet reading of the set

In the vault's 17-axis vocabulary, the cluster centres on:
`brackets none · reticles none · ticks sparse · grids subtle · scanlines none ·
labels technical · corner-language squared · line-weight hairline · density balanced ·
spacing loose · hierarchy pronounced · background dark · accent warm|cool ·
text high-contrast · mono subtle · glow none · grain subtle`

Two axes diverge from the current services faces and are the actionable delta:
**`density`** (the references are balanced-to-sparse; the current tight face is dense at the
foot) and **`hierarchy`** (the references are pronounced — a claim you read from across the
room; the baked faces put the name and the lede within two steps of each other).

---

## Cross-references

- Grammar mapping for anything adopted here: `.claude/skills/thoughtform-design/references/navigation-grammar.md`
- The emblem language for the symbol variant: `.claude/skills/thoughtform-design/references/particle-icon-grammar.md`
- The corner law any new frame obeys: `sentinel/decisions/065-corner-law.md`
- The face's build constraints: `.claude/rules/services-ring.md`, ADR-050 Addendum 5
- The wider distilled reference pool (53 notes, searchable by facet): substrate vault,
  `vault_search { rack: "design" }` — and, once Phase 1–2 land, `design_refs` / `design_visual`
  on this repo's own design MCP.
