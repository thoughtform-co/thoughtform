# Rubric: Subpages — the sheet, graded

Grade every candidate before a human sees it, against the register of its own
theme. Read each still **as someone who has never seen the brief**, with the
three reference first screens on the desk beside them.

**Version 0.2.1, 2026-09-21, uncalibrated. Reporting only.** Written from the
reference decode in `DRIVE.md`, from the house's own laws (DESIGN.md, ADR-065,
ADR-077, ADR-092) and from the owner's sentences in `brief/VOCABULARY.md`,
before any owner verdict exists. Since 0.2.0 the Arcs overview is judged as an
INSTRUMENT (blocks M and L), not as a document. Nothing here gates. Every check reports,
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
- **0.2.0, 2026-09-21 — the Arcs overview becomes an instrument (ADR-118).**
  The owner's brief: the overview is his private page, its first screen "a
  sort of grid timeline" with the projects mapped onto it, its second "a new
  viewport" with the arcs listed per client "like quests from a video game"
  and a card for the one clicked. So AR stops being a document: the grading
  rules scope C1, C2, C5, D5, E1, E3 and E4 away from it and say what it is;
  two new blocks judge it — **M** the monitor (still 1), **L** the log (still
  2 and later) — each row carrying its own scope; A2, A6, B3, F1, F3, K1 and
  K2 name what the instrument adds. A second REGISTER is attached as image 3
  on AR stills (the game references, local only). The new checks are
  PREDICTIONS against a second negative pole, **SF**: the sheet overview
  itself, promoted byte-identical from wave-02-sb, which must fail M and L
  for the stated reason while block A still passes. The pending 0.1.4 items
  above stay pending — one variable at a time.
- **0.2.1, 2026-09-21, after the calibration wave (`wave-03-calibration`, 16
  pole stills and 4 fixture stills, 3 runs).** All eight new checks failed
  the pole for their stated reason on every still, both themes, both
  viewports, and not one of them split across the three runs. L3 — left
  unpredicted on the console still — failed it too: a console is a bounded
  housing, but nothing is seated beside it, which is L3's own reading. The
  one thing the pole was predicted to PASS and did not: **A2**, on 2 of 12
  stills (on `AR-void__sf_01` all three runs, where wave 02 had passed A2 on
  the identical pixels). The cause is this rubric's wording: 0.2.0's gold
  bullet said what gold "is" on an AR still, as a list of the instrument's
  objects, so the pole's console lip read as unsanctioned. The bullet is
  ADDITIVE now and scoped to stills that show the monitor or the log. Also
  read and left: A1 split 2/3 on one laptop still, and the lawful fixture's
  A4 on parchment, which wave 00 failed identically (that panel stays dark
  on the light page).

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
- **The Arcs overview (type AR) and its kit (type AK) are a private
  INSTRUMENT, not a document.** Each is two full screens: still 1 is a
  MONITOR that plots every engagement at the date it was filed; still 2 and
  every later still show the LOG, a grouped list beside one dossier (still 3
  is the log after a second engagement is picked). They have no split head,
  no head bands, no ordinals, no flashcards and no footer, BY DECISION. On
  every AR and AK still, C1, C2, C5, D5, E1, E3 and E4 are passed, and blocks
  M and L judge them instead: M on still 1, L on still 2 and later. On every
  page that is not AR or AK, blocks M and L are passed.
- **On an AR or AK still a third image is attached, and the harness's words
  for it are wrong.** The preamble calls further images additional views of
  the same subject. Image 3 is a SECOND REGISTER: a game's menu screens and a
  designer's concept displays. Judge only the grammar the candidate shares
  with it — a header strip and a foot strip, a labelled gridded plot, one
  filled selection among outlined peers, group headers unlike rows, one
  bounded detail panel, small labels at panel edges. Never its hues (its red,
  cyan and yellow are not this house's; A3 is judged from the candidate
  alone), its ground, its glitches or scanlines, its icons, its corner cut
  (theirs is bottom-right; this house cuts top-right and bottom-left), its
  density of codes, or its layout. A difference from image 3 is not a fault.
- **A plot's scale is not a rule of the page.** On an AR or AK still the
  dotted division lines, the dotted runs and the dotted NOW drop inside the
  plot are an instrument's scale. B1's vertical clause and B3's dashed clause
  do not count them.
- **The instrument's housings are objects, not rules.** The monitor's housing
  and the dossier's housing are bounded objects; their side edges are an
  object's outline, never a vertical rule of the page (B1).
- **The instrument's gold is ADDED to A2's, never a list that replaces it.**
  On a still that shows the monitor or the log, gold may also be the monitor
  strip's kicker, the one lit diamond, the NOW cursor, the one filled row,
  the picked filter box, one outlined button, and the dossier's designation
  and its lip. A still of the Arcs overview that shows no monitor and no log
  (a negative pole's) is judged on A2's own list, which names the console's
  and the flashcards' lips. A mark that carries state is never structure.
- **A filled box among outlined peers is how this house marks the chosen
  thing.** It is not a colour swap. Judge the text on the fill against the
  fill.
- **On an AR or AK still a panel's own edges are its extremes** (D4): lane
  names at the plot's left, readings at its right, dates along its foot,
  labels inside its corners.

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
| dashboard, admin panel, control panel (every page but AR, AK) | the instrument has outrun the document |
| card grid, gallery, app store                                 | the pile reads as the old overview     |
| terminal, code editor                                         | the mono has taken over                |

On the Arcs overview and its kit the reading is the other way round (0.2.0):

| Word                                                                                         | Reading                                                       |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| mission log, quest journal, operations console, project monitor, telemetry screen, game menu | AR and AK are landing                                         |
| dashboard, control panel                                                                     | recorded, not a finding by itself; read it against M1 to M4   |
| admin panel, spreadsheet, table view                                                         | the instrument reads as back-office software                  |
| document, article, marketing page, landing page, card grid, slide                            | AR reads as the sheet it replaced, or as a title over columns |

## A. The register. Any failure here stops the still.

| ID  | Check                                                                                                                                                                                                                                                                                                                                         | Fails when                                                                                                                                                                                                  | Severity |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| A1  | **Two faces, by role.** A monospace face carries labels, keys, kickers, readouts and captions; a proportional sans face carries titles, ledes and paragraphs. Look at the paragraphs first, then at the small uppercase labels.                                                                                                               | a paragraph or a lede is set in the monospace face, a small uppercase label is set in the proportional face, or a third face (a serif, a display face, a second sans) appears between the rails             | gate     |
| A2  | **Gold is wayfinding, and it is counted.** Count the gold objects. Each should have a job: what is lit, what is picked, what is open, what to press, what a kicker names. Twelve at most.                                                                                                                                                     | more than twelve gold objects, or a structural rule, seam or box outline is drawn in gold, the console's lip, the flashcards' lip (the folder device, ADR-097) and the Arcs overview's dossier lip excepted | gate     |
| A3  | **No hue outside the tiers.** Neutral ground, neutral ink, gold, the provenance green. Photographs are taken into the duotone.                                                                                                                                                                                                                | a third hue, a cool tint, a purple or blue, or a photograph in its own colour                                                                                                                               | gate     |
| A4  | **The ground is the theme's.** A void subject is dawn ink on a near-black ground; a parchment subject is dark ink on parchment. Judged from the candidate alone.                                                                                                                                                                              | the ground contradicts the subject named in the caption, or two grounds meet with a hard step                                                                                                               | gate     |
| A5  | **Flat material.** One ground, one step for a plate. No gradient as decoration, no bloom, no glow, no drop shadow.                                                                                                                                                                                                                            | a ramp, a halo, a glow or a shadow is doing the work a line should do                                                                                                                                       | critical |
| A6  | **The corner law.** Zero radius anywhere between the rails. The console's panel, the flashcards, and the Arcs overview's monitor housing and dossier carry the top-right and bottom-left chamfer; their children are square; marks are diamonds, never circles. The frame's round navigation button at the bottom-left is chrome, not a mark. | any rounded corner between the rails, a chamfer on the wrong diagonal, a chamfered child inside a chamfered box, or a circular mark on the page itself                                                      | gate     |

## B. The sheet

| ID  | Check                                                                                                                                                                                                                                                       | Fails when                                                                                                                                                                                        | Severity |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| B1  | **The page divides itself with seams, and panels are seated on them.** A hairline seam between sections, the head band's rule under every kicker, and no vertical rule of the page's own: the frame's two rails are its only verticals (owner, 2026-09-20). | a section has no seam above it, a panel or a cell edge floats with no rule behind it, a rule stops short of the band with nothing to stop it, or the page draws a full-height vertical of its own | critical |
| B2  | **Cells share edges.** Where a section is divided, the divisions are one hairline apiece and the cells meet on it. No gutter grid, no doubled line, no boxes in boxes.                                                                                      | two cells are separated by air, a line is drawn twice a pixel apart, or a box sits inside a cell                                                                                                  | critical |
| B3  | **One line weight, one hue, three alphas.** Every structural line is the neutral ink at one pixel; only its alpha ranks it. The only dashed lines are the two-up divider and, on the Arcs overview and its kit, the plot's dotted scale.                    | a second weight, a second hue on structure, more than three distinguishable alphas, or a dashed rule elsewhere                                                                                    | critical |

## C. Composition

| ID  | Check                                                                                                                                                                                                                              | Fails when                                                                                                               | Severity |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| C1  | **The head is composed on the rules, never centred.** A name kicker and a sentence-case display title on one side, the paragraphs on the other, and no hero image anywhere. On the Arcs overview and its kit this check is passed. | the title is centred, a hero image or a full-bleed picture opens the page, or the head fills a whole viewport            | critical |
| C2  | **Every section opens on a head band**: a mono kicker, an ordinal where the knob is on, one hairline under both. On the Arcs overview and its kit this check is passed.                                                            | a section has no kicker, the ordinal is missing where the knob is on or present where it is off, or the band has no rule | critical |
| C3  | **A timeline plots a record.** The mornings sit on a dated axis at their dates or on a vertical date rail; exactly one node is lit; past ones are dim. On the sessions page only.                                                  | the items are evenly spread regardless of date, none or more than one is lit, or a past item reads as live               | critical |
| C4  | **Ruled rows align and one step is open.** In rows and steps, the fields align down the column on one hairline per row; in a steps section exactly one item is elaborated.                                                         | fields wander between rows, a row has no rule, or none or more than one step is open                                     | critical |
| C5  | **Figures are framed.** A figure carries a bracketed FIG caption bar above and a mono caption below; a two-up sits on a dashed divider; photographs are in the duotone. On the Arcs overview and its kit this check is passed.     | a picture is dropped on the page bare, a two-up has no divider, or a photograph shows its own colour                     | minor    |
| C6  | **Split the slack, and one first read.** Vertical surplus is shared, never pooled under one block; from across the room one thing leads.                                                                                           | a block sits high over a hole, or nothing leads and three things lead together                                           | minor    |

## D. Type and density

| ID  | Check                                                                                                                                                                                        | Fails when                                                                                        | Severity |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| D1  | **Nothing above the weight ceiling.** Emphasis is ink and size, never bold; the monospace face is never bold.                                                                                | a label, a row, a key or a claim is set bolder than its neighbours, or any monospace text is bold | critical |
| D2  | **Case ranks.** The sans is sentence case; only the monospace chrome is uppercase.                                                                                                           | a sans title or sentence is shouted, or everything is uppercase so case says nothing              | critical |
| D3  | **Labels of one rank share one rung.** Kickers track alike, readout labels track alike, captions track alike.                                                                                | two labels at the same rank are visibly differently tracked                                       | minor    |
| D4  | **Nothing is under the floor, and chrome sits at the extremes.** Every string reads at the still's own scale; chrome at the top and the bottom.                                              | any string is too small to read, or chrome sits in the middle of a section                        | critical |
| D5  | **Three registers on a card.** A flashcard reads kicker, title, paragraph in that order and the claim is never in the monospace face. On the Arcs overview and its kit this check is passed. | a card has two registers, the kicker carries the claim, or the title is set in the monospace face | critical |

## E. The instrument

| ID  | Check                                                                                                                                                                                                                                                                                                                                       | Fails when                                                                                                                                                                  | Severity |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| E1  | **The console's head bar is fused to the housing** with a designation at each end: the name left, a slashed kicker right. On the Arcs overview and its kit this check is passed.                                                                                                                                                            | the bar floats inside the panel with air on every side, or it carries one designation                                                                                       | critical |
| E2  | **The readout column is a record.** Labels dim, values lit, every value something a reader could check against the site: a count, a standing, a chip, a year, a list of kinds.                                                                                                                                                              | a label and a value share one weight of ink, a value is empty, or a value is a claim rather than a fact                                                                     | critical |
| E3  | **Selection is elaboration, never fill or hue.** The picked station is the one filled thing in its row; the open step grows lines; the lit node grows a filled diamond; nothing else changes colour. On the Arcs overview and its kit this check is passed.                                                                                 | selection is signalled by a colour swap alone, more than one thing in a row is filled, or the open item is the same size as the rest                                        | critical |
| E4  | **The flashcards are a pile on the sheet.** Kicker and title at the top, the duotone figure in the middle, the paragraph at the bottom; the front card whole and the ones behind it peeking by their heads. Where card=grid, a static two-column grid with the same three registers. On the Arcs overview and its kit this check is passed. | a card shows its figure at the top, the front card is cut, the pile reads as a gallery grid where card=stack, or the grid has gutters wider than a hairline where card=grid | critical |

## M. The monitor. Still 1 of the Arcs overview and its kit.

| ID  | Check                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Fails when                                                                                                                                                                                                                                | Severity |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| M1  | **A device between a datum and a terminus.** Judged on still 1 of the Arcs overview and its kit only; on every other still this check is passed. The screen is one instrument, not a title over columns: a full-width header strip at its top carrying a name at the left and at least two small readings to its right, a full-width foot strip at its bottom carrying at least three small readings, and everything else seated between the two. Count the strips and count the labels on each. | the still opens on a large title with paragraphs or columns under it, either strip is missing, a strip carries fewer labels than stated, or the instrument stops well short of the bottom of the screen and leaves an empty band under it | critical |
| M2  | **The plot is a labelled graticule.** Judged on still 1 of the Arcs overview and its kit only; on every other still this check is passed. The largest region is a gridded plot: horizontal lanes, every lane lettered with a name at its left end and a reading at its right end, date labels along its foot, and inside its top edge a title row that letters the division size and the date range. Count the lanes, then count the lane names: the two numbers are equal.                      | a lane has no name, the foot carries no dates, the division size or the range is not lettered, or the grid is empty decoration with nothing seated on it                                                                                  | critical |
| M3  | **Marks sit on dates, on lanes.** Judged on still 1 of the Arcs overview and its kit only; on every other still this check is passed. Every engagement is one small diamond seated on a lane; the diamonds are unevenly spaced because the dates are uneven; an open diamond is a proposal out and a filled one is delivered, and a key inside the plot says so. Count the diamonds: the foot strip letters the same number.                                                                     | the marks are evenly spread like a bullet row, a mark floats between two lanes, a mark is a circle or a pill, there is no key, or the lettered count disagrees with the diamonds you can count                                            | critical |
| M4  | **One lit mark and one cursor.** Judged on still 1 of the Arcs overview and its kit only; on every other still this check is passed. Exactly one diamond is lit in gold, the chosen engagement, and exactly one gold cursor lettered NOW marks today on the time axis. Lanes, division lines, lane names and every other mark are neutral ink. Count the gold objects inside the plot: two.                                                                                                      | no diamond or more than one is lit, the cursor is missing or doubled, or a lane, a division line, a lane name or a second mark is drawn in gold                                                                                           | critical |

## L. The log. Still 2 and later of the Arcs overview and its kit.

| ID  | Check                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Fails when                                                                                                                                                                                                                                                              | Severity |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| L1  | **Group headers and one-line rows.** Judged on still 2 and later of the Arcs overview and its kit only; on every other still this check is passed. The left column is a list in which a group header (a client name in small uppercase mono with a count at its right end) is visibly a different kind of row from an engagement row (one line: a small diamond, a chip, a sentence-case title, and a bracketed date at the right end). Count the group headers and count the engagement rows.                                                                                                                                                                                                                                                                                         | a group header and an engagement row look alike, an engagement row wraps onto a second line or is cut off, a row has no bracketed date at its right end, or the dates do not align down one right-hand edge                                                             | critical |
| L2  | **Exactly one filled row.** Judged on still 2 and later of the Arcs overview and its kit only; on every other still this check is passed. One engagement row is filled solid gold with its text knocked out dark, and every other row is unfilled. Where rows=ruled the rows are divided by single hairlines; where rows=boxed each row is its own outlined plate. The filter row above the list has one filled box of its own, which is a separate control and is not counted. Count the filled engagement rows: one.                                                                                                                                                                                                                                                                 | no row or more than one row is filled, the chosen row differs only by text colour or by an outline, a group header is filled, or the text on the fill cannot be read                                                                                                    | critical |
| L3  | **The dossier is one housing, seated on the list.** Judged on still 2 and later of the Arcs overview and its kit only; on every other still this check is passed. Right of the list sits one bordered housing with its top-right and bottom-left corners cut: a small header band fused to its top edge, a wide picture that reaches both side edges of the housing, then a sentence-case title, a lede, a column of label and value pairs, a short numbered chapter list where the engagement has chapters, and a foot row of key hints. Its top edge is level with the top of the list and, where rows=ruled, its left edge meets the list with no gutter. Where dossier=pair the same content is two housings, a picture plate over a text plate, with one narrow gap between them. | the detail is loose text with no housing, the picture floats with air on every side, the housing starts visibly above or below the top of the list, a wide gutter of empty ground separates it from a ruled list, or the housing is cut off by the bottom of the screen | critical |
| L4  | **The dossier is the filled row.** Judged on still 2 and later of the Arcs overview and its kit only; on every other still this check is passed. Read the title in the filled row and the title in the dossier: they name the same engagement, and the dossier's date reading matches the bracketed date in that row. Every value in the dossier's readout is a fact a reader could check: a client, a kind, a standing, a date, a count.                                                                                                                                                                                                                                                                                                                                              | the dossier names a different engagement than the filled row, the dates disagree, a readout value is empty or is a code that means nothing, or a value is a claim rather than a fact                                                                                    | critical |

## F. Set level

| ID  | Check                                                                                                                                                                                                                                                                                                                            | Fails when                                                                                                                     | Severity |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| F1  | **The variety law is read on the sheet.** Across a page's stills no two consecutive sections share an arrangement, no arrangement appears more than twice, at least three appear, and figures change side. The Arcs overview and its kit are exempt: two full-screen instruments by design, judged by M and L.                   | two consecutive stills show the same arrangement, one arrangement carries the page, or every figure sits on one side           | critical |
| F2  | **One grammar across the set.** The six pages, both themes and both viewports read as one instrument; the light stills re-derive rather than inherit; no page reproduces a reference beat for beat.                                                                                                                              | a page reads as a different site, a light still is a dark one washed out, or a page is a reference site with the copy replaced | critical |
| F3  | **Each direction differs on the axis it claims, and no other.** On the document pages SD stacks the head and drops the ordinals and SE grids the cards and rails the timeline; on the Arcs overview and its kit SG changes only the monitor's span, SH only the log's rows, SJ only the dossier and SL only the monitor's frame. | two directions' stills are indistinguishable, or one moves an axis it did not claim                                            | critical |

## K. The kit

| ID  | Check                                                                                                                                                                                                                                                                                                                                                                                                          | Fails when                                                                                                                    | Severity |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| K1  | **Every arrangement and every state once, captioned, and the fixtures labelled as fixtures.** On the two specimen pages only: the subpage kit shows every document arrangement and its states; the arcs instrument kit shows every instrument state, a proposed, a running and a delivered mark, the lit mark, a client group, the chosen row, a filtered-out row, and the dossier with and without a picture. | an arrangement is missing, a state (lit, open, picked, draft, chosen, filtered out) is missing, or a fixture reads as a claim | critical |
| K2  | **The specimens share one grammar.** On the two specimen pages only: each kit's sections read as one sheet or one instrument, not a collection of components.                                                                                                                                                                                                                                                  | two specimens contradict each other on a rule the other sections share                                                        | critical |

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
| M1  | the first screen is a title over columns, or a strip is missing |
| M2  | a lane is unnamed, or the plot letters no scale                 |
| M3  | the marks are evenly spaced, or the count disagrees             |
| M4  | the wrong number of lit marks or cursors                        |
| L1  | a group header looks like a row, or a row wraps                 |
| L2  | the wrong number of filled rows                                 |
| L3  | the dossier is loose, floating or cut off                       |
| L4  | the dossier is not the filled row                               |
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

**The second pole, SF (0.2.0):** the sheet's own overview, which the owner
asked to replace with an instrument (2026-09-21), promoted byte-identical from
`wave-02-sb` (stills 1 to 3; the close is never graded). These are
PREDICTIONS; the calibration wave tests them before a still of the instrument
is shot, and a check that does not fail the pole for its stated reason is
rewritten first.

| Anchor                               | File                               | Should fail                                                                      | Should still pass  |
| ------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------- | ------------------ |
| the sheet overview's head, void      | `negative/AR-void__sf_01.png`      | M1, M2, M3, M4                                                                   | A1 to A6, D1, D2   |
| the sheet overview's head, parchment | `negative/AR-parchment__sf_01.png` | M1, M2, M3, M4                                                                   | A1 to A6, D1, D2   |
| the sheet overview's consoles        | `negative/AR-<subject>__sf_02.png` | L1, L2, L4 (L3 unpredicted: a console IS a bounded housing, record what happens) | A1, A3, A4, A6, E2 |
| the sheet overview's house formats   | `negative/AR-<subject>__sf_03.png` | L1, L2, L3, L4                                                                   | A1 to A6           |

B1 and B2 are expected to keep failing on these stills exactly as they did in
wave 02; they are not what this pole is for.

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
