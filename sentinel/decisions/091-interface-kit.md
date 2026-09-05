# ADR-091: The interface kit — the delta is measured, and the panel is recomposed on it

**Status: Proposed** (2026-09-05) — the lab and the Figma library are built and a
graded wave exists; the owner has not read them. A promotion into `casefile.css`
and onto the Brand System page is a separate decision and moves this to Accepted.

**Related:** ADR-089 (the housing, and what it already fixed) · ADR-088 (the left
column's ladder) · ADR-067 (one type ladder, two faces by role) · ADR-066 (no
ordinals) · ADR-065 (the corner law) · ADR-058 (light mode, and gold by role) ·
the hud-panel-lab README (whose diagnosis this pass partly corrects).

---

## Context

The owner named two sites — Tensorlake, built by HEX, and Prime Intellect — as
"that retrofuturistic terminal interface, but also modern", named the surface he
wants at that register (the proof casefile: the directory, the font sizes, the
tabs, the frames), and said plainly that he could not put a finger on the delta.
He also named the boundary: the rails stay.

A brief that cannot be stated cannot be built to. So the delta was **measured**:
one probe over each reference's live DOM and over the shipped casefile, at
1920×1247, counting the same things the same way.

## The measurement

|                                        | proof casefile | Tensorlake  | Prime Intellect |
| -------------------------------------- | -------------- | ----------- | --------------- |
| accent-coloured objects                | **200**        | 112         | 15              |
| share of text on the top tracking rung | **20 %**       | 50 %        | 98 %            |
| text above weight 500                  | **27 %**       | 1.8 %       | 2 %             |
| structural rules · hues                | 20 · 2         | **147 · 1** | **150 · 1**     |
| rounded corners                        | **0**          | 6           | 2               |

Four readings, and two corrections to what this pass set out believing.

1. **The accent is the gap, by an order of magnitude.** Most of ours is the
   intelligence map's estate — twenty cartridges each outlined in gold. ⚠ And
   that drawing's own SELECTION is not a hue: `pdaGlyphs`' state table strokes
   one token for a configured stream and for the open one, differing by a fill
   alpha of 0.07 against 0.18. The accent is spent on all twenty and marks none.
2. **No tracking rung dominates.** The _count_ is the wrong number — Tensorlake
   has more rungs than we do. What it has is a BASE: 85 % of its text on two
   rungs, so a departure reads as one. Ours spreads eleven with the largest
   carrying a fifth, which is what "the font sizes feel off" describes.
3. **A quarter of our text is bold**, against under 2 % on both references, and
   against this house's own written rule to avoid 600+ on UI.
4. **They are ruled sheets.** Both draw seven times more structure lines than we
   do, every one identical. They are not restrained about line work; they are
   uniform about it, and a panel edge landing on a page rule is the mechanism
   behind "integrated".

⚠ **THE TWO CORRECTIONS.** This pass was planned from the hud-panel-lab's
diagnosis — eight gold structure lines against a dawn frame — and **ADR-089
already fixed that**: 19 of 20 structural rules are dawn today. And the house is
**stricter than both references on radius**. The remaining gold structure is
small and specific: the directory's row glyphs at gold .55 on four sides, and the
station diamonds at gold .42.

## Decision

Build the delta as a **kit** — one token layer, one design grid, and the panel
recomposed on it — behind knobs, and let the owner read it rather than be told it.

**`/test/interface-kit`**, two views on one root. `?view=sheet` is the design
grid: the line ladder, the type ladder printing its own resolved sizes, the label
grammar, the marks, the frames, the stations, the buttons, the rows, the readouts
and the panel anatomy — every specimen reading only `--ik-*`, so a specimen that
needs a literal is telling you a token is missing. `?view=panel` recomposes the
casefile from its own production leaves inside the real HUD frame.

**Nine knobs, each one a measured count moved to the house's own stated law**, and
the FIRST value of every knob is production untouched — which is what makes `KA`
a control rather than a preference. Ten named directions, `KA…KJ`.

**The recommendation is `KJ`: all eight rules, with the machined gold lip kept.**
The housing's edge is the one place gold draws a line, because a housing is the
device a screen is set into and that edge is the identity the owner said he loves.
Everything inside it goes neutral. Measured on the composite: accent objects 200 →
26, bold nodes 30 → 0, tracking rungs 11 → 7.

**And the judgment runs the armada loop.** The design skill's eval folder becomes
an armada ship (`eval/armada`, callsign `osprey`), scaffolded by the harness's own
`new_engagement.py`, so `doctor`, `qa`, `make_contact_sheet`, `pick`, `board`,
`make_review_gallery` and `harvest` all run unchanged on a wave of interface
stills. Six control stills from `mount=shipped` are the subjects' identity
references, so every candidate is graded and reviewed beside the shipped panel at
its own viewport and theme.

**The Figma library is built on the `UI Exploration` page**, not the Brand System
page, per the codex map's own rule. `Thoughtform/HUD` gains a **Light mode** — it
had one, `Dark`, while the site has shipped a light theme since ADR-058, so the
library could not express half of what renders — plus 27 variables, six text
styles (the file had none) and fifteen components. Every fill, stroke, size and
tracking is BOUND; nothing carries a typed-in value.

## Alternatives rejected

- **Adopting the references' palette or type.** Refused on the corpus's own
  standing rule: a reference arrives as roles projected onto tokens, never as hex
  to lift, and a design traceable back to one reference has misused the pool. What
  is adopted here is discipline — counts — not values. (Tensorlake's display face
  IS PP Neue Montreal, which makes the temptation concrete and the rule sharper.)
- **Fixing the panel directly.** The owner cannot state the brief; a diff would be
  a guess wearing a commit message. Knobs let him see the pair.
- **A fourth face, or a serif for display.** Standing law: two families by role.
- **Dropping the gold lip.** It is the identity, and ADR-089 argued it a month
  ago. It ships as `lip=dawn` so the other reading is visible, not as a change.
- **Per-variant CSS classes.** Attribute selectors mean a rule can be read in both
  directions and a still is traceable to the exact set that drew it.
- **A separate engagement repo for the ship.** The armada's law is machinery here,
  judgment there — and the judgment is Thoughtform's, so it lives in the site repo
  beside the CSS and the ADRs it governs.
- **Committing the wave's pixels.** They are deterministic renders of a URL, not
  negatives. The record is committed; the stills rebuild in nine minutes. The six
  controls ARE committed, because a baseline that can move is not a baseline.

## Consequences

- Two production defects were fixed in their own commit: the light-mode active
  client tab lost its gold to a theme rule that outranked it, and the brief's body
  inherited its font instead of declaring it. Six more are recorded in
  `docs/design/interface-kit/ANALYSIS.md` and left for this kit's ruling.
- The `Thoughtform/HUD` collection is no longer dark-only. Anything reading it
  must now say which mode it means.
- Two places a rule stops, recorded rather than worked around: the map's tracking
  cannot join the base rung from CSS (its labels are placed against
  `MONO_ADVANCE`, so an override moves glyphs the projection already solved for),
  and the map's gold is partly hardcoded in `pdaGlyphs`, so an accent budget there
  needs a second token in `pda.css`, not a stylesheet rule.

## What the wave found

46 PASS · 3 PASS_WITH_NOTES · 6 RETRY · 5 FAIL, and **31 of 60 unstable across
three runs** on candidates that are pixel-identical between runs — so every point
of that spread is the grader's. Three findings:

- **The rubric fails its own baseline on the accent check.** The shipped panel is
  graded down for spending gold too many times to mean anything: the probe's
  conclusion, reached independently by a grader never shown the number.
- **The rubric's own A2 is written wrong**, and the two station directions proved
  it — five of six non-accent failures are "a structural line is drawn in the
  accent" on exactly the directions whose proposal is to mark a selected station
  with an accent LINE instead of a fill. A selection marker is a mark, not
  structure. Left as written until the wave that paid for it is on the record.
- ⚠ **The stranger's read never once said "instrument".** Sixty naive reads, every
  one a variant of _dashboard_, identical on the control and on the composite. It
  is a property of the surface rather than of any direction, and it is the largest
  open question this pass raises.

## Three defects the gates did not catch

All found by looking at a still, and each one generalises:

1. **The panel sat 145px off its seat.** `.ik-proof-stage` was `position:
absolute; inset: 0`, and an absolutely positioned child resolves against the
   containing block's PADDING box. ⚠ **The KA-versus-control parity gate passed
   the entire time**, because both stills were rendered inside the same wrong box:
   _a parity check between two things broken the same way reports parity._ The
   replacement asks the layout law instead, which no sibling comparison can see.
2. **That replacement was itself wrong at 1920 only.** `--instrument-inset` is a
   `calc()` of three clamps, so `getPropertyValue` returns the expression and
   `parseFloat` returns NaN, which coerces to zero — the check agreed with itself
   below the instrument tier and disagreed above it. ⚠ _A custom property is a
   string until something lays it out._
3. **`grid=ruled` was drawing invented structure** — repeating vertical rules at a
   third of the record column's width, corresponding to nothing, striping through
   the brief. The grader named it on its first pass. It rules the margins now.

## Left open

- Every ruling in `docs/design/interface-kit/README.md`, which is what the owner
  reads.
- The rubric's A2 repair, and whether the checks that wobbled should be rewritten
  or dropped in 0.2.
- Whether "dashboard" is acceptable as the naive read of this surface.
- The three Sans text styles are built on Inter: **PP Neue Montreal is not
  available to this Figma account**. Re-point when it is installed; the sizes and
  tracking are bound and will not need touching.
