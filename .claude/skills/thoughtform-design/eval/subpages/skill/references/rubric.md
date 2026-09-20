# Rubric: Subpages — the sheet, graded

Grade every candidate before a human sees it, against the register of its own
theme. Read each still **as someone who has never seen the brief**, with the
three reference first screens on the desk beside them.

**Version 0.1.3, 2026-09-20, uncalibrated. Reporting only.** Written from the
reference decode in `DRIVE.md`, from the house's own laws (DESIGN.md, ADR-065,
ADR-077, ADR-092) and from the owner's three sentences in `brief/VOCABULARY.md`,
before any owner verdict exists. Nothing here gates. Every check reports,
`tools/qa.py` prints and refuses to decide, and the ladder below is the shape
the instrument will take once the first wave has said where it disagrees with
the person running it.

The grader parses the tables below at runtime and holds no copy of them. Four
columns: id, check, fails when, severity. Severity is `gate` (any failure kills
the still), `critical` (one failure means redraw), `minor` (two mean redraw, one
is a note) or `advisory` (graded and reported, never counted). A block whose
heading contains _set level_ is graded across the wave, never on one frame.
**Edit checks here, never in the script.**

⚠ **THIS SHIP GRADES A RENDERED PAGE, NOT A GENERATED PHOTOGRAPH**, and that
reverses one of the harness's own defaults. `qa.py`'s built-in preamble calls
the second image an identity reference whose subject is the truth and any
deviation a fault. That is correct when the candidate is a drawn photograph of a
real object and wrong here, where image 2 is a REGISTER of three other sites and
the candidate is this site's own page. The `## Grading rules` section below
overrides that preamble verbatim, and it is the first thing to check if a run
starts scoring every still down for not looking like Lighthouse.

Repair history:

- **0.1, 2026-09-20, before wave 00.** First skeleton. Every check is a
  prediction. The negative anchors below name what today's `/arcs` should fail
  and what it should still pass; a check that does not fail the pole it names
  is rewritten as 0.1.1 before wave 01.
- **0.1.1, 2026-09-20, after wave 00 (18 stills, 3 runs, 2 unstable).** The
  pole failed everything it was predicted to fail. Three of the four checks it
  was predicted to PASS failed too, and only one of those was the rubric's
  error: **D2** was a wrong prediction (the old hero's display title IS
  uppercase sans; the anchor row is corrected). **A6** failed on the HUD frame's
  round navigation button at the bottom-left, which every still on this site
  carries, so the grading rules now say the frame is never graded and A6 names
  the button. **A1** failed on the old cards' bold uppercase mono titles read
  as "a label in the sans face"; its fails-when now names what to look at. No
  check moved its severity.
- **0.1.2, 2026-09-20, after the first read of wave 01 (the house direction,
  64 stills, 28 unstable).** Two more things the instrument was wrong about
  and one it was right about. **A2** failed every console still on "a card
  outline drawn in gold": the flashcard's lip is the proof card's own folder
  device (ADR-097), the one gold outline the house draws on a card, so A2's
  exception names it beside the console's. **The close** — the last still of
  every page — is the site's shared footer, judged in its own record
  (ADR-105) and carrying a kept-dark plate by design; it failed A4, B1, C1, C2
  and C5 as if it were a section, so the grading rules now exclude it. And the
  grader was RIGHT about the flashcard's head: the kicker ran into the title on
  one line, which is a page defect and is fixed in the sheet, not here.
- **Pending 0.1.4 — written down, not applied, so wave 01's grades stay on
  the text that produced them.** (1) **A2 / E3 on the timeline:** the lit
  node's box carries a gold outline BY DESIGN (the one lit thing on the axis,
  with its filled diamond); A2's prose reads it as a gold box outline and E3
  as selection by colour alone. Name the lit node's box as the third gold
  outline the sheet draws. (2) **C2 on a driven console:** a still of a pile
  driven to its second card has scrolled its own head band out of the frame;
  C2 passes on it. (3) **C5 / E4 on a flashcard:** the card's figure is not a
  framed figure and carries no FIG bar; a single card is not a pile. (4)
  **B1 on the pile:** a fixed-ratio card cannot span to the band's rule, and
  the grader fails it as unseated on every console still — a real question
  for the owner (seat the pile's column on a rule, or exempt piles), not a
  wording fix.
- **0.1.3 (U1), 2026-09-20 — the owner's first ruling, applied.** Off the wave-01
  gallery's first screen: the two full-height rules at the band's edges go,
  on every page, because the frame's rails are already there. B1 is
  rewritten to the seams alone and gains a fails-when for a vertical rule of
  the page's own; the `rules` knob and direction SC are deleted; F3 names two
  directions; wave 02 re-shoots the remaining three at the new state. The
  grades of wave 01 stand as the record of what he ruled on, on 0.1.2; wave 02
  is graded on this text, which is why it carries its own version number -
  two B1 texts under one number would have averaged two different checks in
  `calibrate.py`.

## Grading rules

The grader reads this section into its prompt verbatim.

- **The candidate is a screenshot of one section of a live subpage inside its
  own HUD frame**, at the viewport and theme its subject names. Nothing in it
  was generated by a model, and there is no photographic subject to be accurate
  to.
- **Image 2 is a REGISTER, not a design and not this page.** It is three
  reference first screens of OTHER sites stacked, proving how a ruled page
  seats its panels, heads its sections, labels its chrome, frames its figures
  and letters its readouts. Judge only that GRAMMAR against it. Never its
  ground, its layout, its type, its copy or its brand: a difference from image
  2 in any of those is not a fault. Say what grammar the candidate shares with
  it and what it lacks.
- **Know the still.** Its caption names the page, the theme, the viewport,
  which still of how many, the section and its arrangement, and the direction's
  knobs. A check that names a page, a section or an arrangement the still does
  not show is **passed, not failed**. A check that names a knob value judges
  the still at THAT value.
- **The two fixture stills** (lanes `lawful` and `broken`) are graded on block A
  alone; every other check passes on them.
- **The HUD frame is never graded.** The two vertical rails with their ticks,
  the corner readouts, the wordmark at the bottom-left, the round navigation
  button beside it, the small sun at the bottom-right and the header's row of
  chapter links are the site's own chrome and the datum every page shares.
  Nothing in them counts toward any check: not its circle, not its gold, not
  its type. Grade what sits between the rails.
- **The close is not graded.** The last still of every page is the site's
  shared footer — the wordmark, the navigation columns, the contact line on a
  kept-dark plate — which has its own record and is the same on every page of
  the site. Every check passes on a still whose section is the close.
- **Count before you judge.** Most of these checks are arithmetic. Count the
  gold objects. Count the full-length rules. Count the line weights. Count the
  faces. Count the things set bolder than their neighbours.
- **Absence is the usual miss.** Look for the rule that is NOT there: a panel
  edge with nothing under it, a section with no head band, a figure with no
  caption bar, a readout with no label.
- **Judge contrast against the ground the theme actually shows**, not against
  an imagined dark page. A parchment still is judged on parchment.
- **Judge what the still shows.** A part outside the framing passes its check.
- **Fail when unsure**, and say in the note what you could not see.

## Stranger's read

One call that sees only the candidate, with no direction name and no reference,
before the rubric is applied. A prompt that names the surface gets the surface's
name back whatever is on screen, which is why this is a separate call. The
grader reads the fenced text verbatim.

```
You are shown one screenshot of a web page. Name what kind of page it is in one
short noun phrase, as you would to someone who has not seen it, with no brand
names and no negations. Then say in one sentence who it is for and what they
are meant to do on it. Then count the distinct regions you can see, count the
rules that run the full width or the full height of the content, and count the
elements drawn in the brightest accent colour.
```

## Object-class words

What the stranger's read may come back with, recorded rather than enforced in
0.1. The intended answers are above the line; anything below it is a finding.

| Word                                                          | Reading                                |
| ------------------------------------------------------------- | -------------------------------------- |
| event page, calendar page, session listing                    | HS is landing                          |
| client overview, case index, portfolio index, engagement list | AR and AC are landing                  |
| blog index, journal, notes index, article                     | MU and MP are landing                  |
| specimen sheet, style sheet, component page, pattern library  | SK is landing                          |
| —                                                             | —                                      |
| landing page, marketing page, homepage                        | the sheet reads as the corridor        |
| slide, presentation, poster                                   | the composition reads as a picture     |
| dashboard, admin panel, control panel                         | the instrument has outrun the document |
| card grid, gallery, app store                                 | the pile reads as the old overview     |
| terminal, code editor                                         | the mono has taken over                |

## A. The register. Any failure here stops the still.

| ID  | Check                                                                                                                                                                                                                                                                                       | Fails when                                                                                                                                                                                      | Severity |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| A1  | **Two faces, by role.** A monospace face carries labels, keys, kickers, readouts and captions; a proportional sans face carries titles, ledes and paragraphs. Look at the paragraphs first, then at the small uppercase labels.                                                             | a paragraph or a lede is set in the monospace face, a small uppercase label is set in the proportional face, or a third face (a serif, a display face, a second sans) appears between the rails | gate     |
| A2  | **Gold is wayfinding, and it is counted.** Count the gold objects. Each should have a job: what is lit, what is picked, what is open, what to press, what a kicker names. Twelve at most.                                                                                                   | more than twelve gold objects, or a structural rule, seam or box outline is drawn in gold, the console's lip and the flashcards' lip (the folder device, ADR-097) excepted                      | gate     |
| A3  | **No hue outside the tiers.** Neutral ground, neutral ink, gold, the provenance green. Photographs are taken into the duotone.                                                                                                                                                              | a third hue, a cool tint, a purple or blue, or a photograph in its own colour                                                                                                                   | gate     |
| A4  | **The ground is the theme's.** A void subject is dawn ink on a near-black ground; a parchment subject is dark ink on parchment. Judged from the candidate alone.                                                                                                                            | the ground contradicts the subject named in the caption, or two grounds meet with a hard step                                                                                                   | gate     |
| A5  | **Flat material.** One ground, one step for a plate. No gradient as decoration, no bloom, no glow, no drop shadow.                                                                                                                                                                          | a ramp, a halo, a glow or a shadow is doing the work a line should do                                                                                                                           | critical |
| A6  | **The corner law.** Zero radius anywhere between the rails. The console's panel and the flashcards carry the top-right and bottom-left chamfer; their children are square; marks are diamonds, never circles. The frame's round navigation button at the bottom-left is chrome, not a mark. | any rounded corner between the rails, a chamfer on the wrong diagonal, a chamfered child inside a chamfered box, or a circular mark on the page itself                                          | gate     |

## B. The sheet

| ID  | Check                                                                                                                                                                                                                                                       | Fails when                                                                                                                                                                                        | Severity |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| B1  | **The page divides itself with seams, and panels are seated on them.** A hairline seam between sections, the head band's rule under every kicker, and no vertical rule of the page's own: the frame's two rails are its only verticals (owner, 2026-09-20). | a section has no seam above it, a panel or a cell edge floats with no rule behind it, a rule stops short of the band with nothing to stop it, or the page draws a full-height vertical of its own | critical |
| B2  | **Cells share edges.** Where a section is divided, the divisions are one hairline apiece and the cells meet on it. No gutter grid, no doubled line, no boxes in boxes.                                                                                      | two cells are separated by air, a line is drawn twice a pixel apart, or a box sits inside a cell                                                                                                  | critical |
| B3  | **One line weight, one hue, three alphas.** Every structural line is the neutral ink at one pixel; only its alpha ranks it. The only dashed line is the two-up divider.                                                                                     | a second weight, a second hue on structure, more than three distinguishable alphas, or a dashed rule elsewhere                                                                                    | critical |

## C. Composition

| ID  | Check                                                                                                                                                                             | Fails when                                                                                                               | Severity |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| C1  | **The head is composed on the rules, never centred.** A name kicker and a sentence-case display title on one side, the paragraphs on the other, and no hero image anywhere.       | the title is centred, a hero image or a full-bleed picture opens the page, or the head fills a whole viewport            | critical |
| C2  | **Every section opens on a head band**: a mono kicker, an ordinal where the knob is on, one hairline under both.                                                                  | a section has no kicker, the ordinal is missing where the knob is on or present where it is off, or the band has no rule | critical |
| C3  | **A timeline plots a record.** The mornings sit on a dated axis at their dates or on a vertical date rail; exactly one node is lit; past ones are dim. On the sessions page only. | the items are evenly spread regardless of date, none or more than one is lit, or a past item reads as live               | critical |
| C4  | **Ruled rows align and one step is open.** In rows and steps, the fields align down the column on one hairline per row; in a steps section exactly one item is elaborated.        | fields wander between rows, a row has no rule, or none or more than one step is open                                     | critical |
| C5  | **Figures are framed.** A figure carries a bracketed FIG caption bar above and a mono caption below; a two-up sits on a dashed divider; photographs are in the duotone.           | a picture is dropped on the page bare, a two-up has no divider, or a photograph shows its own colour                     | minor    |
| C6  | **Split the slack, and one first read.** Vertical surplus is shared, never pooled under one block; from across the room one thing leads.                                          | a block sits high over a hole, or nothing leads and three things lead together                                           | minor    |

## D. Type and density

| ID  | Check                                                                                                                                           | Fails when                                                                                        | Severity |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| D1  | **Nothing above the weight ceiling.** Emphasis is ink and size, never bold; the monospace face is never bold.                                   | a label, a row, a key or a claim is set bolder than its neighbours, or any monospace text is bold | critical |
| D2  | **Case ranks.** The sans is sentence case; only the monospace chrome is uppercase.                                                              | a sans title or sentence is shouted, or everything is uppercase so case says nothing              | critical |
| D3  | **Labels of one rank share one rung.** Kickers track alike, readout labels track alike, captions track alike.                                   | two labels at the same rank are visibly differently tracked                                       | minor    |
| D4  | **Nothing is under the floor, and chrome sits at the extremes.** Every string reads at the still's own scale; chrome at the top and the bottom. | any string is too small to read, or chrome sits in the middle of a section                        | critical |
| D5  | **Three registers on a card.** A flashcard reads kicker, title, paragraph in that order and the claim is never in the monospace face.           | a card has two registers, the kicker carries the claim, or the title is set in the monospace face | critical |

## E. The instrument

| ID  | Check                                                                                                                                                                                                                                                                                | Fails when                                                                                                                                                                  | Severity |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| E1  | **The console's head bar is fused to the housing** with a designation at each end: the name left, a slashed kicker right.                                                                                                                                                            | the bar floats inside the panel with air on every side, or it carries one designation                                                                                       | critical |
| E2  | **The readout column is a record.** Labels dim, values lit, every value something a reader could check against the site: a count, a standing, a chip, a year, a list of kinds.                                                                                                       | a label and a value share one weight of ink, a value is empty, or a value is a claim rather than a fact                                                                     | critical |
| E3  | **Selection is elaboration, never fill or hue.** The picked station is the one filled thing in its row; the open step grows lines; the lit node grows a filled diamond; nothing else changes colour.                                                                                 | selection is signalled by a colour swap alone, more than one thing in a row is filled, or the open item is the same size as the rest                                        | critical |
| E4  | **The flashcards are a pile on the sheet.** Kicker and title at the top, the duotone figure in the middle, the paragraph at the bottom; the front card whole and the ones behind it peeking by their heads. Where card=grid, a static two-column grid with the same three registers. | a card shows its figure at the top, the front card is cut, the pile reads as a gallery grid where card=stack, or the grid has gutters wider than a hairline where card=grid | critical |

## F. Set level

| ID  | Check                                                                                                                                                                                                      | Fails when                                                                                                                     | Severity |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| F1  | **The variety law is read on the sheet.** Across a page's stills no two consecutive sections share an arrangement, no arrangement appears more than twice, at least three appear, and figures change side. | two consecutive stills show the same arrangement, one arrangement carries the page, or every figure sits on one side           | critical |
| F2  | **One grammar across the set.** The six pages, both themes and both viewports read as one instrument; the light stills re-derive rather than inherit; no page reproduces a reference beat for beat.        | a page reads as a different site, a light still is a dark one washed out, or a page is a reference site with the copy replaced | critical |
| F3  | **Each direction differs on the axis it claims, and no other.** SD stacks the head and drops the ordinals; SE grids the cards and rails the timeline.                                                      | two directions' stills are indistinguishable, or one moves an axis it did not claim                                            | critical |

## K. The kit

| ID  | Check                                                                                                                     | Fails when                                                                                              | Severity |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| K1  | **Every arrangement and every state once, captioned, and the fixtures labelled as fixtures.** On the specimen sheet only. | an arrangement is missing, a state (lit, open, picked, draft) is missing, or a fixture reads as a claim | critical |
| K2  | **The specimens share one grammar.** The kit's sections read as one sheet, not a collection of components.                | two specimens contradict each other on a rule the other sections share                                  | critical |

## Scoring

Mirrored by `tools/config.py`'s verdict map. Change both together or not at all.

| Result                                     | Verdict                                     |
| ------------------------------------------ | ------------------------------------------- |
| Any gate failure                           | FAIL. Never keep. Redraw.                   |
| Any critical failure, or two or more minor | RETRY.                                      |
| Exactly one minor failure                  | PASS_WITH_NOTES. Keepable after an eyeball. |
| Clean                                      | PASS.                                       |

Rank keepers strictly: PASS beats PASS_WITH_NOTES beats RETRY. Two stills with
equal scores means the rubric did not discriminate; never promote from a tie.

## Plain language

What the caption under a flagged still says on the board. Written so a reviewer
can judge without the rubric open.

| ID  | Caption                                                         |
| --- | --------------------------------------------------------------- |
| A1  | a sentence in the chrome face, or a third face                  |
| A2  | gold is spent too many times, or on a structural line           |
| A3  | a hue the house does not have, or a photo in its own colour     |
| A4  | the ground is not the theme's                                   |
| A5  | a glow, a ramp or a shadow is doing a line's work               |
| A6  | a rounded corner, or a chamfer on the wrong diagonal            |
| B1  | a panel floats with no rule behind it                           |
| B2  | cells are separated by air, or a line is doubled                |
| B3  | too many line weights, hues or alphas                           |
| C1  | the head is centred, or a hero opens the page                   |
| C2  | a section has no head band                                      |
| C3  | the timeline does not plot the dates, or lights the wrong count |
| C4  | rows do not align, or the wrong number of steps is open         |
| C5  | a figure is not framed                                          |
| C6  | a block sits over a hole, or nothing leads                      |
| D1  | something is bolder than the house allows                       |
| D2  | case has stopped ranking anything                               |
| D3  | two labels of one rank are tracked differently                  |
| D4  | a string is under the floor, or chrome sits mid-section         |
| D5  | a card is missing a register                                    |
| E1  | the console's head bar floats                                   |
| E2  | a readout value is empty, or is a claim                         |
| E3  | selection is a colour swap                                      |
| E4  | the pile reads as a grid, or a card's figure is on top          |
| F1  | the page repeats one arrangement                                |
| F2  | the set reads as two sites                                      |
| F3  | a direction moved an axis it did not claim                      |
| K1  | the kit is missing an arrangement or a state                    |
| K2  | the specimens contradict each other                             |

## Calibration anchors

**Empty of approvals, and deliberately not empty of ground truth.** An anchor is
an output the owner has approved, promoted byte-identical into `skill/assets/`
with the dated quote that approved it. No verdict exists yet.

**The negative pole comes first**, because it is the one thing already known:
the owner said today's `/arcs` looks bad. It is shot once, byte-identical, into
`skill/assets/negative/` and graded in wave 00 as lane `sa`. Each row names what
it should FAIL and what it should still PASS, and a check that does not fail
the pole it names is rewritten before wave 01. The two fixture panels from
`/test/design-eval-fixture` anchor block A the same way.

| Anchor                      | File                               | Should fail            | Should still pass |
| --------------------------- | ---------------------------------- | ---------------------- | ----------------- |
| the old overview, void      | `negative/AR-void__sa_01.png`      | C1, B1, B2, A5, C6, D2 | A1, A3, A6        |
| the old overview, parchment | `negative/AR-parchment__sa_01.png` | C1, B1, B2, A5, C6, D2 | A1, A3, A6        |
| the old client page, void   | `negative/AC-void__sa_01.png`      | B1, B2, C2, D2         | A1, A3, A6        |
| the old overview's cards    | `negative/AR-void__sa_03.png`      | B1, B2, C5, D1, D5, E4 | A3, A6            |
| the lawful fixture panel    | `SK-void__lawful_01.png` (wave 00) | nothing in block A     | A1 to A6          |
| the broken fixture panel    | `SK-void__broken_01.png` (wave 00) | A1, A3, A5, A6         | A4                |

| the sheet's own long rules | `wave-01-sb/HS-void__sb_01.png` | B1 (as rewritten) | everything else |

The last row is the owner's first ruling on the sheet itself (2026-09-20,
`brief/VOCABULARY.md`): the two full-height rules at the band's edges are
rejected on every page. Positive anchors are still empty. The first approvals
from the owner's own gallery become rows here, with their quotes.

## The harness

`tools/qa.py` parses the check tables above at runtime and holds no copy of
them. The one hardcoded piece is the verdict tier map in `tools/config.py`,
which mirrors the Scoring table.

**Grade three times, report the majority.** `--runs` defaults to 3, ties fail,
and every candidate whose verdict was unstable across runs is listed by name.

⚠ **AND THE CANDIDATES ARE DETERMINISTIC HERE, WHICH THE HARNESS IS NOT USED
TO.** Two runs of the capture produce the same pixels, so every point of spread
in a verdict is the GRADER's, not the subject's. The unstable list is therefore
a direct read on which checks are written badly enough to be a coin flip, and it
is the first thing to fix in 0.2: aggregate the split answers by check id,
rewrite the worst-flipping fails-whens in what a grader can SEE, re-grade the
SAME stills, and move a check that still flips after two rewrites into code —
the composition test, the ratchet, or `mechanical.mjs`.

**A wave without `ledger.py tick --handback` never happened.** The grader's
rows are only half the ledger; the owner's ticks are the other half, and
`calibrate.py` can only ask whether a check agrees with the person once both
are there.

**Calibration status: uncalibrated, reporting only.**

## Regression ritual

Once a direction is approved, name three stills per page: the first screen at
the binding viewport, the first screen at the owner's own 1920x1247, and the
console or the timeline still. After any change to `sheet.css` or the sheet's
tokens, re-shoot those, grade them, and compare against `eval-log.md`. **If they
get worse, the change reverts.**
