# wave-03 — the arcs instrument: the house and four directions, at two viewports, graded on 0.2.1

**2026-09-21.** The Arcs overview is the owner's private INSTRUMENT (ADR-117,
ADR-118): a MONITOR that plots every engagement at the date it was filed, then
a LOG that lists them per client with one filled row against its DOSSIER. This
wave shoots the house and the four directions that each move one of the
instrument's four knobs, at one state, at the owner's window (1920 × 1247) and
at a laptop (1280 × 720), both themes. Three stills per page: the monitor at
scroll zero, the log at its own top with the server's choice, and the log
after a second engagement is picked (the capture picks the row off the page
and waits on the page's own `data-dos-id`). Two pages: the overview (AR) and
its fixture kit (AK, NOW pinned to 2026-09-21). Rubric **0.2.1**, three runs
per still, majority per check, `gemini-flash-latest`; image 3 on every still
is the LOCAL instrument register (the monitor strip on still 1, the log strip
on stills 2 and 3). The negative pole SF and the calibration against it are
`wave-03-calibration.md`.

| folder          | direction | knob moved     | stills | mechanical      |
| --------------- | --------- | -------------- | ------ | --------------- |
| `wave-03-sb`    | SB house  | none           | 12     | 0 on every cell |
| `wave-03-sg`    | SG full   | `span=full`    | 12     | 0 on every cell |
| `wave-03-sh`    | SH plates | `rows=boxed`   | 12     | 0 on every cell |
| `wave-03-sj`    | SJ pair   | `dossier=pair` | 12     | 0 on every cell |
| `wave-03-sl`    | SL rails  | `frame=rails`  | 12     | 0 on every cell |
| each `…-laptop` | the same  | at 1280 × 720  | 12     | 0 on every cell |

Every cell's gate was clean (exit 0, accent 9 against the whole-page budget of
24, zero radii, two families; smallest type 11.9px at 1920 and 10.5px at 1280),
and every probe read the instrument's own law off the DOM with no violation.
This time the laptop stills ARE graded, because the fit binds there.

## First: a whole shoot was thrown away, and the grades with it

The first shoot of this wave looked clean and graded clean. It was not. **The
page's settle observable fired before the thing it names.** `data-dos-id` said
"this dossier has settled" when the 180ms swap aperture's timer fired, and the
dossiers' pictures were `loading="lazy"` inside `hidden` articles — so a
picture only began to load when a swap unhid it, and it streamed in top-down
under an attribute that already said the swap was over. The capture waited on
the attribute correctly, the mechanical gate was clean, and **seventeen of the
twenty second-pick overview stills** went to the grader with a blank or
half-painted plate.

It was found by looking at a still (the boxed-rows direction's still 3 showed
the Loop portfolio's picture ending a third of the way down its plate), then
measured over the whole wave: a run of PERFECTLY flat rows inside the
dossier's column, which a loaded preview never has (they carry grain and
type) and the dossier's text cannot produce (its gaps are under 40px) — up to
**593px** tall where the picture had not painted at all. The kit's stills and
every first-load still were clean; the defect lived only in a swap.

The fix is the page's, not the capture's (`25edb81a`): SETTLED is the aperture
open AND `img.decode()` resolved (bounded at 2.5s), the pictures load EAGER at
`fetchpriority="low"` (the monitor holds no image, so the first screen waits
for none of them), the capture's `stillLife` decodes every picture in view,
and the instrument smoke reads each settled dossier's picture — run against
the old code first, it failed on `perfect-ted-proposal`. The first grades
(three folders, and a fourth stopped mid-run) were discarded before any of
them reached the ledger, and **the whole wave was re-shot** at the fixed
state; the same measurement over the final shoot finds no flat run longer
than 53px anywhere (the plain gap between the pair direction's two plates).

## Then: a second shoot thrown away, for the frame's wordmark

The re-shoot graded clean too, and was also thrown away. Reading the rails
direction's monitor still for chrome near a mark — the house's standing
check, which no gate runs — found **the frame's hero lockup directly under
the monitor's bottom-left corner on every monitor still of every
direction**: until half a screen of scroll `.hud__brand` is the hero-size
lockup aligned to the content column, and the monitor, which ends on the
rails' last tick, spans that column. Measured: the lockup's top **7px** below
the monitor's rule at 1280 × 720 and **15px** at 1920 × 1247, 102–122px inside
the device's column. The instrument smoke asserted "the wordmark sits under
the device", which is true at 7px, and passed; the grader never mentioned
it.

The fix (`ccd56876`) shows the frame's OWN docked state from the first frame
on the instrument, so the monitor keeps its datum on both rail ends and
nothing new is drawn; docked, the wordmark sits 19 / 21 / 84px beside the
device's column at 1280 / 1440 / 1920. The smoke asserts the clearance now and
fails without the rule. Five folders' grades (SB and SG at both viewports,
SH at 1920) were replaced in the ledger by this, the third shoot's; `ledger.py
wave` replaces a folder's rows rather than appending them.

## The headline: the house grades clean at both viewports, and the rubric separates one direction from it

| direction      | knob moved     | 1920 × 1247              | 1280 × 720                       | unstable (1920 / 1280) |
| -------------- | -------------- | ------------------------ | -------------------------------- | ---------------------- |
| SB house       | none           | 12 PASS                  | 12 PASS                          | 2 / 1                  |
| SG full record | `span=full`    | 9 PASS · 3 RETRY (M3 ×3) | 10 PASS · 2 RETRY (M3 ×2, M4 ×1) | 3 / 2                  |
| SH plates      | `rows=boxed`   | 12 PASS                  | 12 PASS                          | 0 / 0                  |
| SJ pair        | `dossier=pair` | 11 PASS · 1 FAIL (A6)    | 12 PASS                          | 4 / 3                  |
| SL rails       | `frame=rails`  | 12 PASS                  | 11 PASS · 1 RETRY (B2, L3)       | 1 / 3                  |

Against the pole (`wave-03-calibration`) every M and L row failed SF, three
runs of three; on the instrument they pass everywhere except where a
direction's own knob breaks one. The house: 24 stills, both themes, both
viewports, every one PASS, three verdicts split across runs.

## What the checks separate, and what they do not

- **SG is the only direction the rubric separates from the house, and for the
  reason the direction exists.** On a 2023-to-now axis in quarters the nine
  marks crowd into the plot's last few percent, and the two same-lane format
  pairs, filed five days apart, paint as one diamond each: the grader counts
  **7 against the terminus's `Marks 9`** on three of four monitor stills at
  1920 and two at 1280 (M3). At 1280 the lit mark's section dots crowd the
  NOW cursor's head, and one run counted NOW's gold head as a second lit mark
  while another lost the cursor (M4). What SG buys is real — `SINCE 2023`
  becomes a run the width of the plot, the only direction in which the
  record's age is drawn — and the grades say what it costs.
- **The log stills are the SAME PIXELS in SB, SG and SL** (sha256, both
  themes, both viewports: `span` and `frame` only move the monitor), so their
  verdicts measure the grader and nothing else: **7 of 8 identical triples got
  the same verdict in all three folders.** The one that did not — the
  parchment log at 1280, still 2 — is L3 and B2 reading a gutter between the
  list and the dossier that is not there (the rows end at x 555, the dossier
  starts at 556): PASS in SB and SG, RETRY in SL. L3's "no gutter" clause is
  the rubric's first to-do once a handback is in.
- **SJ's one FAIL is A6 on the pair's facing cuts.** Both plates carry the
  lawful TR+BL, but the picture plate's bottom-left cut and the text plate's
  top-right cut face each other across the gap, and two runs of three read
  that as "a chamfer on the wrong diagonal" on the dark still 3. A perception
  cost of the pair, not a defect. SJ is also where D1 split on the dossier
  title's weight (the title is `--weight-lit`, 500, in both directions).
- **SH passes everything with nothing unstable, and the grader does not see
  its cost.** At 1280 × 720 the nine plates run ~37px past the rails' last
  tick — the list flows in the page by design, so nothing is trapped, but it
  no longer sits inside the device's height — and a 40px gutter separates the
  list from the dossier at both viewports, lawful for boxed rows under L3 and
  exactly the "seat on the dossier" question the direction asks.
- **SL passes its stated condition**: its two strips run out to the rails'
  first and last ticks, clear the rails' labels and the corner bracket by
  32px or more, and the docked wordmark sits 35px under the bottom strip at 1920. No check reads a page line meeting the frame; whether that is the
  reading of "we already have our rails" is his.

## The stranger's read

The monitor reads one way on every still, in every direction, at both
viewports: _"client engagement timeline dashboard"_, or _"engagement timeline
dashboard"_. `dashboard` is on the rubric's recorded-not-a-finding line, read
against M1–M4, which pass on every monitor still but SG's.

**The log never reads as a quest journal.** Every log still reads as an
ARCHIVE, a catalogue, an index or a directory of a studio's work —
_"creative agency proposal archive"_, _"creative studio portfolio archive"_,
_"project archive interface"_, _"design studio project directory"_,
_"creative studio portfolio index"_. Not one says quest, mission, journal or
log, and not one lands on the finding line (no admin panel, no spreadsheet,
no document, no landing page). `archive` is on neither of the rubric's lines.
L1–L4 pass, so the log IS the grammar the four references share; a stranger
names it by its CONTENT — nine real engagements with dates — rather than by
its genre. The brief asked that the clients "really feel like quests from a
video game". Whether that wants the log dressed more like a game's menu, or
a record of real work should read as a record, is his call; the grader
cannot make it, and nothing on the page was changed to move a word.

⚠ **The round N at the bottom-left of every still is Next's dev-tools
indicator**, absent in production. With the wordmark docked from the first
frame it now sits over the wordmark in the 1280 monitor stills, as it always
did in the scrolled ones; the rubric already excludes it (A6's "round
navigation button"), and hiding it in the capture is a separate task.

## What he is asked

1. The house, or one of the four directions — each moves one knob.
2. The nine `Filed` dates: seeds, each page's first commit.
3. The section dots over each mark.
4. The plot's dotted divisions against "the rails are the only verticals".
5. The wordmark docked on a first screen (finding 11 in ADR-118).
6. What the log should read as.

## Standing conclusion

The instrument passes its own laws — the mechanical gate is clean on every
cell, the capture's probe reads no violation of the instrument's law, and
the instrument smoke passes 10/10 at three viewports — and the rubric grades
the house clean at both viewports in both themes. That is not a decision.
The rubric separates only SG from the house, and only for the reason SG
exists, so the choice between SB, SH, SJ and SL is his eye's; the galleries
are where he makes it. Nothing is promoted.

## Ruled out

- **Collision handling for SG's merged marks.** A losing value gets no
  machinery (ADR-118 §6): the merge IS the direction's finding, and handling
  it would grade a different direction than the one he is choosing between.
- **Re-shooting the pole.** SF stays the wave-02 pixels it was promoted from.
- **Moving a rail for SL.** The direction runs the monitor's two strips out to
  the rails' end ticks and never moves the rails themselves; if he reads the
  touching as wrong, the direction is dropped, not reworked.
- **Tuning a check before the handback.** Nothing on 0.2.1 has been ticked;
  a rubric that scores this page better without the page changing is the
  thing an uncalibrated rubric may not do.
- **A per-page rubric in the harness.** Every M and L row is asked of every
  still and carries its own scope sentence ("judged on still N of the Arcs
  overview and its kit only; on every other still this check is passed"),
  because the harness has no per-type rubric. It works — no M or L row
  misfired on a still it does not own — and it is the mechanism request this
  ship sends home with its harvest.

## Record

- `qa_results.json` and `qa_summary.json` in each of the ten folders; +240
  ledger rows on rubric 0.2.1, replacing the second shoot's (and no row was
  ever written for the first).
- A contact sheet per folder, plus `_contact-sheet-vs-{sg,sh,sj,sl}.png` in
  `wave-03-sb/`.
- Galleries: `delivery/review-wave-03-*.html`, ten, and one index,
  `delivery/review-wave-03.html`.
- The site: ADR-118 §As built, `.claude/rules/sheet.md`,
  `docs/design/subpages/README.md`, `sentinel/BEST-PRACTICES.md`,
  `sentinel/MAINTENANCE.md`; the ship: `skill/references/eval-log.md`,
  `skill/CHANGELOG.md`, `MEMORY.md`, `eval/EVAL_LOG.md` (one line).
- Handback: none yet. Until `ledger.py tick --handback` has read one, this
  wave has not happened.
