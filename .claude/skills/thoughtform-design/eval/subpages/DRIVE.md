# Drive map, and the reference decode

⚠ On this ship the pixels live IN THE REPO, gitignored, because every still is
regenerable from its URL. `armada.toml [drive].root` points at this folder.

```
<ship>
├── references/register              the subjects' identities
│   ├── sources.json                 which six first screens, and from where
│   ├── void.png                     Lighthouse · Tensorlake · Prime Intellect, 1440x2700
│   ├── parchment.png                Hermeus /propulsion · stripe.dev · Kindled, 1440x2700
│   ├── readings/<site>.json         the register probe's numbers per source
│   └── _shots/                      the raw first screens (ignored)
├── skill/assets/negative            the negative pole: today's old /arcs, shot once
├── evals/waves/<wave>[-laptop]      <TYPE - Name>/<TYPE>-<subject>__<lane>_<nn>.png + MANIFEST.jsonl
│                                    + mechanical.json + report.json + qa_*.json + verdicts-*.json
└── picks                            unused: draws are sections and there is no best
```

## What is identity truth

| Subject   | Identity                            | Proves                                                                             |
| --------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| void      | `references/register/void.png`      | the ruled sheet on a dark ground: rules, seated cells, head bands, accent budget   |
| parchment | `references/register/parchment.png` | the same grammar on paper: rules at a legible alpha, framed figures, a ruled index |

Neither proves a ground, a layout or a content of THIS site. See
`skill/references/subjects.md` and the rubric's grading rules.

## The reference decode

Per site, dated, the numbers the register probe reads (`readings/`) beside the
readings taken by hand on 2026-09-05 for ADR-091 (Tensorlake 147 rules in one
hue; Prime Intellect 150 rules, 15 accent objects on a whole page). Translation
is by ROLE, never inversion: a reference's hairline becomes the sheet's
`--sh-rule`, its head band the sheet's kicker + ordinal + hairline, its accent
the sheet's gold budget.

| Site                | Ground / ink            | Radii | Faces              | Rules and alphas                          | Accent                     | What the sheet took                                         |
| ------------------- | ----------------------- | ----- | ------------------ | ----------------------------------------- | -------------------------- | ----------------------------------------------------------- |
| Lighthouse          | near-black / warm white | 0     | one sans, one mono | 1px hairlines, two alphas, sections ruled | one, sparse                | the ruled section, cards without radius or shadow           |
| Tensorlake          | black / white           | 0     | one sans, one mono | 147 rules in one hue (2026-09-05)         | one                        | the page draws its own grid; panels seated on it            |
| Prime Intellect     | black / white           | 0     | one sans, one mono | 150 rules; ordinals as wayfinding         | 15 objects on a page       | the ordinal, the twelve-object budget                       |
| Hermeus /propulsion | white / near-black      | 0     | one sans, one mono | `02 / Roadmap` heads over a hairline      | one lit box on the roadmap | the split head, the dated axis with one lit node            |
| stripe.dev          | paper / ink             | 0     | one mono, one sans | `/ SECTION` labels, `[ FIG. 1 ]` frames   | one                        | the FIG caption bar, the metadata column, the dashed two-up |
| Kindled + Kindred   | paper / ink             | 0     | one sans, one mono | a drawn grid, cells sharing edges         | none                       | the seams between sections, chrome at the extremes          |

The live readings land in `readings/<site>.json` when `--register` runs, and
this table is updated from them in the same session.

## The arcs instrument's references (2026-09-21, ADR-118)

The owner's brief for the private overview named four game-UI stills. There
is no live page to probe, so these are counted BY EYE off the stills
(1920×1080 unless noted) — the praxis's fallback, dated. Translation is by
ROLE: what they draw that this site's frame already draws is not taken.

| Axis                              | 1 · CP2077 codex (list + detail)                                                                              | 2 · CP2077 detail card                                                 | 3 · CP2077 quest journal                                              | 4 · Vilimovský "Quest custom display" (two tablets, 1920×900)                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Regions                           | 6: top bar, filter chips, list, detail, button hints, two edge rails                                          | 4: header line, picture plate, text plate, foot line                   | 5: tabs, list, centre, related column, hints                          | ~9 per tablet: header strip, sub-panels, chart, scale column, button matrix, foot row               |
| Full-width rules                  | 1 (the tab bar's) + one lit segment; 3 hairlines inside the detail                                            | 0: plate borders only                                                  | 3 hairlines in the centre column                                      | 0: one outlined band at the top, a label row at the foot                                            |
| Line law                          | 1px, one structural hue + one highlight                                                                       | 1px, one hue                                                           | 1px, one hue + a colour-coded word                                    | 1px structure, data in a second colour; the dashed grid is a second STYLE, not a weight             |
| Selection                         | inverse-video fill (the row, the chip)                                                                        | none                                                                   | fill at three levels (tab, row, objective), one per list              | fill (the channel chip, the last tab, a full-width button)                                          |
| Row anatomy                       | ~75px plate, 4 parts, 1 line, clipped corner                                                                  | —                                                                      | ~90px, 5 parts, 2 lines, a bracketed reading at the right             | `label … READY` pairs                                                                               |
| Label : value                     | ~1:3, prose-heavy                                                                                             | chrome at the four corners only                                        | 1:2                                                                   | ~1:1                                                                                                |
| Micro-labels                      | under the bar, a plate's bottom-left, the column's foot                                                       | the four corners                                                       | a row's second line, the floor line                                   | inside the plot's top edge (three slots), inside its bottom-left, a centred foot, a scale column    |
| What the site's frame ALREADY has | the edge rails with numbered markers, the top nav with a lit segment, corner readouts, a bottom-right cluster | —                                                                      | the bottom-right hints                                                | —                                                                                                   |
| What the instrument took          | group heads + rows, the filled row, the filter's filled box                                                   | the one card: picture over text, a head band, foot hints that are true | the bracketed right reading, the objectives as the arc's own chapters | the datum and terminus strips, a gridded plot with a title row inside its edge, a key in its corner |
| Refused                           | red/cyan/yellow, colour-coded difficulty, the inner scrollbar, the `NEW` chip, the bottom fade                | the stepped tab, the second inner line                                 | the related column (every client has one engagement)                  | the red dot-matrix signal, the button matrix, placeholder codes, ring glyphs                        |

Prior art read first: `app/(internal)/test/intelligence-config-lab/configKit.tsx`
— the item tooltip's ~3× label:value ratio was once ported at 1:1 and
lettered under the floor ("utterly illegible", owner, 2026-08-11). The
instrument is DOM at real pixels on the sheet's own type tokens, so the ratio
is bought in alpha and size steps that stay above the floor.

## Not in the pack

- No approved output. The first tick becomes `skill/assets/<...>`.
- ⚠ **REVERSED FOR THE ARCS INSTRUMENT ONLY (2026-09-21, ADR-118).** Until
  0.2.0 the instrument references were kept out of the register because a
  strip of them "would teach the grader a ground and a chrome this page does
  not have". The overview is now an instrument BY THE OWNER'S BRIEF, so its
  stills attach a second register as image 3 — `arcs-monitor.jpg` (ref 4) on
  the monitor, `arcs-log.jpg` (refs 1–3) on the log — and the rubric's grading
  rules fence it to GRAMMAR: never its hues, ground, glitches, icons, corner
  cut or code density. Every other page is unchanged.
- ⚠ **THOSE STRIPS ARE LOCAL.** Third-party images in a public repository:
  the source stills and the composed strips live in the ignored
  `references/register/_shots/arcs-instrument/`, never where the ship opts
  pictures back into git. `sources.json` names them; a machine without them
  grades without image 3.
- Rocket-001, Ledger and Astrolabe stay out: they inform block E by
  description.
