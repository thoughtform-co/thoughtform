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
| Kindled + Kindred   | paper / ink             | 0     | one sans, one mono | a drawn grid, cells sharing edges         | none                       | the band rules, chrome at the extremes                      |

The live readings land in `readings/<site>.json` when `--register` runs, and
this table is updated from them in the same session.

## Not in the pack

- No approved output. The first tick becomes `skill/assets/<...>`.
- The instrument references (Vilimovský's monitors, Rocket-001, Ledger,
  Astrolabe) are not in the register: they inform block E of the rubric by
  description, and a strip of them would teach the grader a ground and a
  chrome this page does not have.
