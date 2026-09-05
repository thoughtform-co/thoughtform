# The interface kit — what the references actually do differently

**2026-09-05.** The owner named two sites — Tensorlake (built by HEX) and Prime
Intellect — as "that retrofuturistic terminal interface, but also modern", named
the surface he wants to reach that register (the proof casefile: the directory,
the font sizes, the tabs, the frames) and said plainly that he could not put a
finger on the delta.

So it was measured rather than described. One probe was run over each reference's
live DOM and over the shipped casefile, at 1920×1247, counting the same things in
the same way.

---

## The measurement

The probe walks every visible element, counts the ones drawn in the accent hue,
collects every rendered `letter-spacing` as an em ratio, counts text nodes above
weight 500, counts structural rules and the hues they use, and counts rounded
corners. The references are measured over their whole page; the casefile over
the panel alone, which if anything flatters it.

|                               | proof casefile                  | Tensorlake                         | Prime Intellect     |
| ----------------------------- | ------------------------------- | ---------------------------------- | ------------------- |
| accent-coloured objects       | **200**                         | 112                                | 15                  |
| distinct tracking rungs       | 11                              | 15                                 | 4                   |
| share of text on the top rung | **20 %**                        | 50 %                               | 98 %                |
| text above weight 500         | **27 %**                        | 1.8 %                              | 2 %                 |
| structural rules · hues       | 20 · 2                          | **147 · 1**                        | **150 · 1**         |
| rounded corners               | **0**                           | 6                                  | 2                   |
| display face                  | PP Neue Montreal 700, uppercase | **PP Neue Montreal 500, sentence** | Geist 400, sentence |
| chrome face                   | PT Mono, wide tracking          | JetBrains Mono, −.07em             | ABC Favorit Mono, 0 |

### Four things this says, and two it corrects

**1. The accent is the gap, and it is an order of magnitude.** Two hundred
gold-drawn objects in one panel against fifteen on a whole page. Most of ours is
the intelligence map's estate: twenty cartridges, each outlined in gold, plus
their tier meters and codes. ⚠ And the map's own SELECTION is not a hue at all —
`pdaGlyphs`' state table strokes the same token for a configured stream and for
the open one, and they differ by a fill alpha of **0.07 against 0.18**. So the
accent is spent on all twenty and marks none of them.

**2. No tracking rung dominates.** The count of distinct values is the wrong
number to look at: Tensorlake has _more_ rungs than we do (15 to 11). What it
has is a base — half its text sits on one rung and 85 % on two, so a departure
from it reads as a departure. Prime Intellect puts 98 % of its text on a single
value. Ours spreads eleven rungs with the largest carrying a fifth. There is no
register to depart from, which is what "the font sizes feel off" is describing.

**3. A quarter of our text is bold.** 27 % of text nodes above weight 500,
against under 2 % on both references. The house's own typography reference says
_avoid 600+ on UI_; six declared sites produce thirty rendered nodes.

**4. They are ruled sheets and we are not.** This is the one that surprised.
Both references draw **seven times more structure lines** than the casefile —
147 and 150 against 20 — every one of them identical, one weight in one neutral
hue. They are not restrained about line work; they are _uniform_ about it. A
panel edge that lands on a page rule is what makes a panel look seated, and it is
the mechanism behind "integrated" that no amount of removing lines would produce.

**The two corrections.** The plan for this pass, written from the hud-panel-lab's
README, assumed the casefile's structure was still gold and that the fix was to
move it to dawn. **ADR-089 already did that** — the register's hairlines, the
directory's row rule and the column split are dawn today, and the probe confirms
it (19 of 20 structural rules at dawn .12). And the house is **stricter than both
references on radius**: zero rounded corners against six and two. The remaining
gold structure is small and specific: the directory's row glyphs, drawn gold .55
on four sides, and the station diamonds at gold .42.

---

## What the kit proposes

Eight rules, each one a count moved to the house's own stated law. Every one is a
knob at `/test/interface-kit`, and the first value of every knob is production
untouched.

1. **Line law** — one weight, one hue, three alphas by role: datum .55 (the
   rail's own), seam .28 between regions, rule .12 inside one. Gold draws no
   structure; the housing's machined lip is the one sanctioned exception.
2. **Grid seat** — the sheet's own rules drawn, so the panel's edges land on
   them. Not a field behind the copy: the rail's thirteen rungs as stubs at both
   band edges and the column split run full height. Lines the panel already lands
   on, made visible.
3. **Type ladder** — the existing modular scale (`--fl-t0` × 1.2) unchanged.
   Weights: mono 400, sans 400 body and 500 display, 700 nowhere. Emphasis is ink.
4. **Tracking** — four rungs, with one base carrying the chrome: `.06em` for
   labels, `.10em` for eyebrows, `−.02em` for display, `0` for prose.
5. **Case** — uppercase reserved for mono chrome. The display title and the
   register claims go sentence case, which is how both references set display.
6. **Label grammar** — five forms, one rung and one alpha each: eyebrow,
   bracketed designation, corner key/value, status, count.
7. **Accent budget** — gold on the marks that say where the reader is, and
   nowhere else. The estate is drawn in dawn; selection becomes elaboration.
8. **Material** — flat. No bloom, no second blur over a transparent ground, no
   18px halo on the active row.

**The recommendation is all eight with the gold lip kept.** The housing's edge is
the one place gold draws a line, because a housing is the machined device a screen
is set into and that edge is identity — the rails Vince said he loves. Everything
inside it goes neutral.

---

## What the wave measured

Ten directions × three viewports × two themes, 60 stills, graded three times by
the armada's own harness against the shipped panel. Full record:
`.claude/skills/thoughtform-design/eval/armada/evals/waves/2026-09-05-kit-01.md`.

| direction         | accent objects | bold nodes | tracking rungs |
| ----------------- | -------------- | ---------- | -------------- |
| control / KA      | 200            | 30         | 11             |
| KB seated         | 154            | 30         | 11             |
| KC track tight    | 200            | 30         | 7              |
| KD weight regular | 200            | 0          | 11             |
| KF accent budget  | 107            | 30         | 11             |
| **KJ composite**  | **26**         | **0**      | **7**          |

Three findings from the grade itself:

- **The rubric fails its own baseline on the accent check.** The shipped panel is
  graded down for spending gold too many times to mean anything — the same
  conclusion as the probe, reached by a grader never shown the number.
- **The stranger's read never once said "instrument".** Sixty naive reads of the
  panel, every one a variant of _dashboard_. Identical on the control and on the
  composite, so it is a property of the surface rather than of any direction, and
  it is the largest open question this pass raises.
- **Half the rubric is a coin.** 31 of 60 verdicts moved across three runs on
  candidates that are pixel-identical between runs, so every point of that spread
  is the grader's. The three directions that came back clean 6/6 are the three
  whose axis is countable from a still.

---

## Where a rule stops

Two places, both recorded rather than worked around:

- **The map's tracking cannot join the base rung from CSS.** Its labels are
  placed by arithmetic against `MONO_ADVANCE`, which includes the drawing's own
  tracking; an override would move every glyph the projection already solved for
  and overflow cells no test would catch, because the tests check the model
  rather than the render. Four of the panel's eleven rungs are the map's. Joining
  them is a change to `mapProjection`.
- **The map's gold is partly hardcoded.** The cartridge fills are literals in
  `pdaGlyphs.tsx`, not tokens, and one token strokes both the configured and the
  open state. An accent budget cannot be expressed as a token change on that
  drawing; the honest fix is a second token in `pda.css`.

## The eight defects the audit found on the way

Two were fixed in their own commit; the rest are recorded for the kit's ruling.

|     |                                                                                      |                        |
| --- | ------------------------------------------------------------------------------------ | ---------------------- |
| 1   | the active client tab lost its gold in light — a theme rule outranked it             | **fixed**              |
| 2   | the brief's body inherited its font instead of declaring it                          | **fixed**              |
| 3   | a second 9px backdrop blur runs over a console whose ground is transparent           | open                   |
| 4   | the active row's 18px glow and the brief title's text-shadow, against "no glows"     | open — `material=flat` |
| 5   | the capability plates notch BR, justified by a console chamfer ADR-089 removed       | open                   |
| 6   | `.fl-detail__t` floors at 9px, under the 10px control floor                          | open                   |
| 7   | `--fl-ret-rule-y` is dead: its only consumer is overridden to solid                  | open                   |
| 8   | dead light-theme rules for three deleted class families                              | open                   |
| 9   | **five chrome labels measure 3.19–3.41:1 in DARK**, under the 4.5:1 the rubric wants | open — see below       |

### The ninth, and why nobody had seen it

Stage 1 of the design gate was run against the panel after the wave, scoped to
`.fl-case` so it measures the panel rather than the HUD chrome around it:

```bash
node scripts/design-eval/mechanical.mjs \
  --url "/test/interface-kit?mount=shipped&theme=dark" --theme dark --scope ".fl-case"
```

It reports the same six violations on `mount=shipped` as on `KA`, which is what
makes them **production's and not the lab's**:

|                           | control `KA` | composite `KJ` |
| ------------------------- | ------------ | -------------- |
| radius · fonts · gradient | 0 · 0 · 0    | 0 · 0 · 0      |
| shadow                    | **1**        | **0**          |
| contrast                  | 5            | 5              |

- **The one shadow is defect 4, confirmed by a second instrument** — the active
  directory row's `rgba(202,165,84,.22) 0 0 18px` halo. `material=flat` removes
  it, so that rule now has a mechanical proof rather than only a grade.
- **The five contrast failures are unchanged by every direction**, because no
  knob touches ink alpha: `.fl-brief__class` at 3.19:1 and 10px, `.fl-desig` at
  3.41:1 and 11px, and `.fl-row__meta` at 3.19:1 on all three rows.
  ⚠ **The reason this is new is that the existing walk only measures LIGHT.**
  `services-ring-smoke`'s contrast case is the light-theme walk ADR-063 U2 added;
  dark was never swept on this panel, and 3.19:1 is a dark-theme number. A rule
  the house states unconditionally was being checked in one theme.
- ⚠ **`section.fl-case borderTopColor=rgb(229,231,235)` is a NOTE, not a defect.**
  It is Tailwind preflight's default border colour on a border whose width is
  `0px`, so it paints nothing. Measured, so nobody chases it twice.

Fixing 9 is an ink-alpha change on a production surface, which is outside this
pass by the same line that keeps the winning direction out of `casefile.css`.

## Sources

The probe's own numbers are in `lib/interface-kit/directions.json` under
`$measured`, and every still in the wave carries its own copy in its manifest
row. The reference captures are in the session scratchpad rather than committed:
they are third-party pages and regenerate from a URL.
