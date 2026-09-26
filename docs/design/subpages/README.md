# The subpages — the sheet, and the arcs instrument

The ruled-document grammar for pages that list things (ADR-114), the arcs
overview's INSTRUMENT (ADR-118 — the owner's page since ADR-117), and the eval
ship that grades both. Read the ADRs for the decisions; this is the working
map.

## The pages

Dev server today: `http://localhost:3003` (read the port off the running
server before quoting one). The document pages take `?k=SB|SD|SE`, the arcs
overview and its kit take `?k=SB|SG|SL`, and every page takes
`&theme=dark|light`.

```
http://localhost:3003/arcs
http://localhost:3003/test/arcs-instrument-kit
http://localhost:3003/home-sessions
http://localhost:3003/arcs/loop
http://localhost:3003/musings
http://localhost:3003/musings/navigate-the-intelligence
http://localhost:3003/test/subpage-kit
```

⚠ `/arcs` is the owner's page. Under `next dev` its gate is open, so the
capture and the smokes reach it; in production a stranger gets the site's
404 and the owner needs his pass (it is minted when he signs in at `/admin`).
The two `/test/*` kits are proxy-blocked in production; the rest ship. `/arcs`
and its client pages stay noindex; the musings' seed posts are drafts
(reachable, noindexed, hidden from the index in production).

## The knobs

The sheet's four, on the document pages:

| knob       | house   | other   | moves                                                |
| ---------- | ------- | ------- | ---------------------------------------------------- |
| `head`     | `split` | `stack` | title left / copy right, or kicker left / both right |
| `ordinal`  | `on`    | `off`   | `01 /` on the head bands                             |
| `card`     | `stack` | `grid`  | the pile stacks on scroll, or a static grid          |
| `timeline` | `axis`  | `rail`  | horizontal dated axis, or a vertical date rail       |

The instrument's two, on `/arcs` and its kit:

| knob    | house     | other   | moves                                                    |
| ------- | --------- | ------- | -------------------------------------------------------- |
| `span`  | `active`  | `full`  | the plot's window: the active weeks, or 2023 to now      |
| `frame` | `housing` | `rails` | the monitor closed on itself, or its strips out to rails |

⚠ The `rows` knob (ruled · boxed) and its direction `SH` are deleted (ADR-118
U1): the owner read the ruled log as "a glorified word document", and the
house went past both values — one bordered block per engagement, a gutter
from the dossier, one floor. A stale `?k=SH` lands on the house.
⚠ So are the `dossier` knob (one · pair) and its direction `SJ` (ADR-118 U2):
the pair only ever split the dossier's picture from its text, and the picture
is gone — the dossier DRAWS the client's configuration now. A stale `?k=SJ` or
`dossier=pair` lands on the house.

Directions, document pages: `SB` house · `SD` editorial
(`head=stack ordinal=off`) · `SE` grid (`card=grid timeline=rail`) · `SA` the
negative pole (the old `/arcs`, shot once). Directions, the instrument: `SB`
house · `SG` full record · `SL` rails · `SF` the second negative pole
(yesterday's sheet overview, promoted from wave 02, never re-shot). A direction's `types` scopes it, so AR is never shot at SD or
SE. One record: `lib/sheet/directions.json`.

## The arrangements, and the laws

split · row · cells · console · timeline · steps · table · figure · prose ·
close. A page opens on the split and ends on the close; consecutive sections
differ; no kind more than twice; at least three kinds; three cells at most
once; one lit node; one open step; five chapters at most. Code:
`lib/sheet/composition.ts`; every real page walks it in
`tests/lib/sheet-composition.test.ts`.

monitor · log are the instrument's, exactly two and in that order, and a
ladder holding either is judged by `instrumentViolations` instead: every mark
at its own date on both windows, on a real lane, oldest first; NOW inside both
windows and right of every mark; one id set across marks, rows and dossiers;
the lit mark is the chosen row. `tests/lib/sheet-instrument.test.ts`.

## What the owner is being asked

**On the instrument, after U3's stills (the dossier as travel data):** the
key cells' fill (`--sh-well`, one token); the big button's label centred (the
homepage's walkthrough button) rather than right-set with a keycap like
Starfield's JUMP; one band colour for every client; the "accents" read as the
wires, the die's legs and the kind codes, with the chip frames neutral; the
rows full width with the keys at 40 %.

**Still open from U2's stills (the references' composition, the
configuration drawn):** the five page icons, the proposal's most of all (the
most abstract, and three blocks carry it); whether the traces off the die's
free edges read as a board or as noise; the kind codes (`LLM` · `MODEL` ·
`DESIGN` · `OPS`); the owner's seat, not drawn yet ("Kate, the last gate" is
in the proposals); and every link the matchers read out of his own
sentences, pinned per proposal in `tests/lib/sheet-config-fit.test.ts`. The
adaptations from the references, each his to veto: no invented serial codes,
no scroll-track widget, no third tier of small squares, model names generic
as the proposals say them. (The die's colour — Tensor gold — and the status
strip — a readout — he ruled in U3.) Wave 04 (rubric 0.3.0) waits for his
read, and its gold count must take the configuration as ONE object.

**Still open from U1's stills (the log as blocks):** the gutter's width
(`--log-gutter`, one token); the filled block's weight (the dial, if it reads
heavy, is the fill, never the box). U1's third question — whether the chip
comes back — U2 answered: it is the bracket (`[ THE PROPOSAL ]`) and the icon.

**On the instrument, after wave 03's galleries:** the house against each of
the three remaining directions (the monitor stills stand; the log stills are
superseded by U1); the nine seeded `Filed` dates (a page's first commit,
not the engagement's start); the section dots over each mark; whether the
plot's dotted divisions sit right with "the rails are the only verticals";
and what the log should read as to a stranger, who calls it an ARCHIVE, not a
quest journal (§Wave 03 below) — his own read, "a glorified word document",
agreed, and U1 is the answer.

**On the document pages, after wave 01's galleries:** split or stacked head ·
ordinals on or off · pile or grid · axis or rail · the twelve-gold budget ·
the four session dates · each client's `since` year · whether the pile's card
is seated on a rule of its own · whether the lit timeline node keeps its gold
box. The questions that only concerned the overview — the pile or grid there,
its seat, the Loop console's four dossier beats on it — lapsed with ADR-118.

## The galleries

**Wave 03 — the arcs instrument.** One index, ten galleries (five directions
× two viewports):

```
file:///C:/Users/buyss/Manifold%20Delta/Artifacts/01_thoughtform/.claude/skills/thoughtform-design/eval/subpages/delivery/review-wave-03.html
```

The record is `evals/waves/wave-03.md`; the calibration against the pole is
`evals/waves/wave-03-calibration.md`.

**Wave 02 — the sheet after the first ruling, unread:**

```
file:///C:/Users/buyss/Manifold%20Delta/Artifacts/01_thoughtform/.claude/skills/thoughtform-design/eval/subpages/delivery/review-wave-02-sb.html
file:///C:/Users/buyss/Manifold%20Delta/Artifacts/01_thoughtform/.claude/skills/thoughtform-design/eval/subpages/delivery/review-wave-02-sd.html
file:///C:/Users/buyss/Manifold%20Delta/Artifacts/01_thoughtform/.claude/skills/thoughtform-design/eval/subpages/delivery/review-wave-02-se.html
```

Wave 01's four galleries are still in `delivery/` and show the state he ruled
on; SC no longer exists as a direction.

Tick and comment in a gallery, save the handback beside its wave as
`verdicts-<date>.json`, then from the ship: `python tools/ledger.py tick
--handback <file>` and `python tools/calibrate.py`. The records are
`evals/waves/wave-0N.md`.

⚠ **Wave 02 grades worse than wave 01 in every direction** (keepable on the
42 real-page stills 17 · 17 · 18 against 21 · 27 · 23) and the reason is
measurable: with no verticals of its own, nothing terminates a seam, and the
editorial band caps at 1200px while the rails keep travelling outward — so a
seam stops 38px short of the rail at 1280 × 720 and **224px at 1920 × 1247**.
The instrument answers it on `/arcs` by closing each device on itself (the
monitor's strips end on its own housing); `SL` shows the other answer.

## The ship

`.claude/skills/thoughtform-design/eval/subpages` (`turnstone`). From the site
root, in PowerShell:

```
node scripts/capture-subpages.mjs --dry-run
node scripts/capture-subpages.mjs --register                                  # once
node scripts/capture-subpages.mjs --control --wave wave-00-calibration --port-old 3004 --headed
node scripts/capture-subpages.mjs --fixture --wave wave-00-calibration
node scripts/capture-subpages.mjs --wave wave-01-sb --k SB
node scripts/capture-subpages.mjs --wave wave-01-sb --k SB --setting laptop
node scripts/capture-subpages.mjs --wave wave-03-sg --k SG --types AR,AK --port 3003
```

then from the ship: `python tools/doctor.py` → `qa.py --batch <wave> --runs 3`
→ `make_contact_sheet.py <wave> --sort slot` → `make_review_gallery.py <wave>`
→ `ledger.py wave <wave>`; the owner ticks; `ledger.py tick --handback` →
`calibrate.py`. The ship's `CLAUDE.md` has the traps.

## Traps

- The chapter cap is on the primary row, not the drawer.
- `server-only` is stubbed for vitest; the real marker stays for Next.
- Run the gate and the capture from PowerShell (MSYS path conversion).
- A reveal in the viewport's last tenth never lands; wait on 0.88.
- The gate counts the whole page; the rubric's twelve is per still.
- Declare an image's size off the file, never from memory.
- A `span` head holding two `span`s runs a kicker into its title; a margin on
  an inline box is not a line break (the card head is a grid).
- A wave is one CSS state: a sheet fix mid-wave re-shoots every direction.
- Tell the grader what the frame and the close are, or it fails every still
  on them.
- The rails are the page's only verticals (owner, 2026-09-20): a page never
  draws a full-height rule of its own; the `rules` knob is gone. The plot's
  dotted divisions are the one named exemption (`.sh-mon__grid`).
- The instrument's devices arrive on a clip: the capture waits on
  `.sh-ap-root` as on a reveal, or it shoots a closed aperture.
- ⚠ A still shot while a picture streams in is a defect the grader reads as
  the page's: wave 03's first shoot sent seventeen half-painted dossiers to the
  grader. The dossier carries no picture since U2 and `data-dos-id` settles on
  its aperture alone — written on arrival too, or a deep link to the row the
  server already chose never settles. The capture still decodes every picture
  in view before a shot.
- ⚠ Every evenodd ring closes BOTH contours (each repeats its first point).
  Written as one open path, the two bridges cross down the left side and the
  ring paints a bow-tie: a full edge at the corners, nothing at mid-height.
  Every housing on `/arcs` shipped that way until U2; the smoke reads the left
  edge's energy against the top edge's, since a mid-height-vs-quarter check
  passed the half-strength edge.
- `--log-block-h` needs `--log-n` AND `--log-heads`, both written on the LIST;
  miss one and the calc goes invalid with nothing erroring.
- A gradient is invisible to both contrast walks (they read
  `backgroundColor`): the dossier's band words are composited on the tint at
  their own x in the smoke, and a pixel check whose reference edge runs along
  a tint measures the tint — the ring check reads the dossier's BOTTOM edge.
- Hidden text is a box: an sr-only title fails `subpages-smoke`'s overrun walk.
  Name a thing with `aria-label` instead.
- The frame's wordmark is the HERO lockup until half a screen of scroll, and
  a device as wide as the instrument band ends right over it; the instrument
  shows it docked from the first frame. Read every still for chrome near a
  mark: no gate does, and "under the device" was true at 7px.
- Dark is the ABSENCE of `data-theme`; nothing writes `data-theme="dark"`.
- A client file under `components/sheet` imports no registry: its chunk is
  public and `/arcs` is not.

## Verifying

See ADR-114 §Verification, ADR-118 §As built, and `.claude/rules/sheet.md`
§Verifying.

The ending (ADR-127) - the footer's sheet on every route, the docked wordmark,
the rise on the three flowing pages:

```bash
npx vitest run tests/lib/sheet-close.test.ts tests/lib/footer-nav.test.ts
npx playwright test tests/visual/subpages-smoke.spec.ts --project=desktop -g "the ending"
```
