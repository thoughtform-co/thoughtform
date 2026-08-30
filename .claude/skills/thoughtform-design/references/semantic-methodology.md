# Semantic methodology — interpreting, translating, deciding how free to be

How to use the anchors (`semantic-anchors.md`) on real work: reading a reference, moving a
quality across mediums, and choosing how much latitude a given surface allows.

> Carried forward from the Dec-2025 `semantic-design` skill. The method held up; only its
> examples and token vocabulary needed re-voicing.

---

## 1. The translation protocol

A reference is never copied. It is read for meaning, and the meaning is re-expressed in
Thoughtform's vocabulary. Four steps:

**a. Extract the semantic position.** Say what the thing _does_, not what it looks like.
Not "it is a green trace on black" but "it makes an invisible signal continuously
perceptible, and its honesty about noise is the point."

**b. Score it against the six anchors** (1–5 each). See `semantic-anchors.md` for the
heuristics.

**c. Measure the translation distance.**

| Distance   | Meaning                                                                 | What to do                                              |
| ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| **Close**  | Same medium, same register — another dark instrument UI                 | Adopt the structure directly; retoken the colour        |
| **Medium** | Different medium, transferable structure — a print poster, a film UI    | Keep the composition and hierarchy; rebuild the surface |
| **Far**    | Different medium AND register — a fabric, a landscape, a piece of music | Take the RELATIONSHIP only; invent the expression       |

The further the distance, the more you preserve and the less you transfer. At Far distance,
lifting anything concrete is a category error.

**d. Decide preserve vs transform.**

- **Preserve:** the meaning · the relationships between parts · the tensions the reference
  holds · what it refuses to do.
- **Transform:** colour · typeface · corner language · motion · texture · scale.

⚠ **The single most common failure is preserving a colour and transforming a relationship** —
which is exactly backwards, and produces a design that quotes a reference while saying
something else. Colours arrive as ROLES ("warm accent on a dark ground" → gold on void),
never as hex to lift.

---

## 2. Reading the corpus this way

The 53 compiled references already follow this protocol — that is what their sections are:

| Section             | Which step it holds                                 |
| ------------------- | --------------------------------------------------- |
| `## Layout`         | the objective read (step a, descriptive half)       |
| `## Patterns`       | the position, mapped onto the 12 grammar primitives |
| `## Style facets`   | 17 ordinal axes — the formal fingerprint            |
| `## Worth adopting` | the preserve list                                   |
| `## Avoid`          | what fights the system, named                       |

So `design_refs` returns work already translated one step. Do not re-derive what the note
states; do check its judgment against the anchors when the stakes are high.

**The facet axes are ordinal words, never numbers, and that is deliberate.** A reader can
disagree with "dense"; nobody can disagree with 0.7, which is a judgment wearing a
measurement's clothes. Keep any new axis in the same register.

---

## 3. The complexity gradient

Four levels, rigid → expressive. **Start rigid; relax only where meaning requires it.**

| Level          | Freedom | What it governs                                              |
| -------------- | ------- | ------------------------------------------------------------ |
| **TOKENS**     | none    | colour, type, spacing, motion values                         |
| **GRIDS**      | low     | margin, the 9×17 grid, the tick ladder, rail geometry        |
| **COMPONENTS** | medium  | panels, cards, readouts, rails — composition within the grid |
| **PARTICLES**  | high    | fields, drift, atmosphere, generative behaviour              |

Coherence comes from the lower levels being shared, which is precisely what buys the upper
levels their latitude. A particle field can be genuinely expressive _because_ its palette and
grid are not negotiable.

Match the level to the surface: a data table lives at TOKENS+GRIDS; a hero field lives at
PARTICLES. A surface reaching for more freedom than its job needs is how a research station
turns into a carnival.

---

## 4. Interface primitives (meaning as geometry)

Five UX primitives that follow from meaning being spatial. Use them when designing anything
that navigates a corpus, a latent space, or a set of options.

- **Position** — everything has coordinates; where a thing sits IS a claim about it.
- **Distance** — relationship strength made visible without interaction.
- **Interpolation** — the path between two points carries information neither endpoint does.
  (The most under-used, and the most Thoughtform.)
- **Clustering** — name groups _after_ discovery, never before. A pre-named cluster is a
  category imposed, not a pattern found.
- **Gap** — show what is absent. Negative space is a reading: person-led work on the
  intelligence map is drawn precisely so the unencoded is visible.

**The two-layer rule.** Embeddings find what is _near_; a model explains _why_. Never make
the model guess what a lookup could answer, and never make a lookup carry a judgment. This is
the same division the skill and the design MCP hold at the system level, one scale down.

---

## 5. Working with generated material

- **Variation is cheap; selection is the work.** Generate a spread, then judge — do not
  iterate one candidate toward correctness. The corpus's own value is that it is _selected_.
- **Expose the spread when the choice is the user's**, collapse it when it is yours.
- **Anchor before you generate.** An unanchored generation lands on the statistical middle,
  which is the failure mode this whole system exists to escape.

---

## Related

- The six anchors: `semantic-anchors.md`
- The vocabulary they express through: `navigation-grammar.md`
- Cards and panels specifically: `ui-composition.md`
- Judging a result: `../eval/rubric.md`
