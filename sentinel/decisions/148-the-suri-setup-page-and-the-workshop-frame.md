# ADR-148: The Suri setup page is one simplified page, and the workshop arcs take one frame

- **Status:** Proposed (2026-10-06, owner). Built and guarded, not pushed; flips to Accepted
  once the owner has read `/arcs/suri/configuration` live.
- **Surface:** `lib/arcs/content/suri-configuration.ts` (rewritten), `lib/arcs/content/shared/suriWork.ts`
  (`SURI_STUDIO_CONFIGURATION`, `SURI_RUNS`, `suriRuns()`, `SURI_WORKSTREAMS`), the new
  `skill-run` kind (`lib/arcs/types.ts`, `components/arcs/ArcSkillRun.tsx`, `chrome.tsx`'s
  `RUN` designation), `components/arcs/arcs.css` (§The skill run, §The workshop frame, and the
  worked group's flex order); tests `suri-pages`, `arcs-registry`, `sheet-config-fit`,
  `arc-run` (new).
- **Related:** [ADR-147](147-suri-two-pages-one-record.md) (the two Suri pages and the shared
  record), [ADR-139](139-the-workshop-second-cut.md) (the `worked` switch),
  [ADR-143](143-the-workshop-third-house-cut.md) (Prompt to Loop as one record),
  [ADR-065](065-corner-law.md) (the corner law), [ADR-089](089-casefile-is-one-housing.md)
  (a clip cuts a border and never strokes one; fill among outlines),
  [ADR-101](101-the-configuration-strikes-in-and-the-chip-becomes-the-plates.md) (why the
  proposals keep their plates).

## The call

The owner, 2026-10-06, after the lunch and learn at Suri: update the configuration page so it
explains how the setup works and carries the lunch and learn's breakdown of the process,
"and maybe this is a good time we make a simplified version because we have so many different
versions". His order: the hero; a variant of "AI sits between a tool and a collaborator"; an
interstitial, "How should intelligence participate in the work"; the configuration; skills
and evals; "It can only work for hours when it has the context and the evals"; then the setup
applied to a few Suri workstreams "where we have a floating bar that allows you to switch
elegantly between the different workstreams", "super simple … a nice clean overview of how
the flow works in practice". Not the stages, the curve or the resource. And the frames: "the
general frames we use, I want to harmonize them and really make them more minimalistic while
respecting our brand", everywhere they are used.

## The decision

**1. One Suri setup page, short.** `/arcs/suri/configuration` is seven beats in his order. The
lunch and learn stays the record of the room; the kick-off page stays the printed handout. The
proof cards, the steps track, what to connect, the repository, the two chats, once-twice and
the month left this page; their records stay in `suriWork.ts`, where the Armada companion
reads them, so `arcs-registry`'s reader lists for those groups are the companion alone.

**2. The configuration is drawn once, for the studio.** One `questions` board
(`SURI_STUDIO_CONFIGURATION`): Suri's creative work at the centre, the six answers at studio
level. The lunch and learn switched three boards; this page leaves the specifics to the
workstreams that follow it.

**3. The workstreams are three `skill-run` panels under the page's one switch.** Briefing +
naming, Iterations, Video retouch + edit: three of the eight in
`suri-ai-studio/workstreams.toml`, the three the 5 October sessions and the Monday board
"Creative Intelligence Project" put first. Each run's ask is the plugin's own starting prompt,
its steps and checks its `SKILL.md` and rubric, its figures `records/eval-log.md` (4 and
6 October). What has not run says "Not run yet" rather than being drawn as if it had.

**4. The `skill-run` kind, ADR-052's twenty-fifth enumerated exception.** Prompt to Loop's
"How it runs" slide as data: you ask · Claude picks the skill · it follows the steps · it checks
itself · you decide, the evals under the rail. The station names are chrome constants, never
content. Server, no state, `data-run-*`, no SVG; the connectors are CSS pseudo-elements in the
gap. Prompt to Loop's own slide is untouched (generated, one example); this is the same
breakdown for any workstream.

**5. One frame for the workshop arcs.** Scoped to `.arc-root[data-arc-format="workshop"]`
(v1, v2, v3, the AP lecture, both Suri pages, Plopsa, the class-one deck, Armada):

- A 1px ring in `--arc-edge` with ONE top-right notch at `--arc-frame-ch: clamp(10px, 1vw, 14px)`.
  The pair plate (TR + BL) becomes a single notch.
- A plate's head is type over a hairline: no gold wash band, no 2px gold rule.
- Gold is the one lit object of a beat: a `--gold-line` ring over a faint wash, never a solid
  gold block. Prompt to Loop's solid "Your call." station takes it.
- The plain rectangles take the same ring: `.arc-card-item`, `.arc-syl__sheet`, the worked
  bar's tabs, Prompt to Loop's stations and evals strip, the run's boxes.

The proposals and the portfolio keep their plates: on the Trinny scene the board chip lands as
the plates' gold head band (ADR-101 §B, one material) and is measured against them.

**6. The worked bar floats.** Measured: the bar sat at its group's top edge, so `bottom`
sticky held only while that edge was below the fold, and it scrolled away (y −31) the moment a
panel filled the screen, on every page with a switch. The group is a flex column with the bar
`order: 1`: laid out last, anchored on the group's floor, it holds the bottom of the screen
while any panel is in view and leaves with the group. The DOM order is untouched, so the tabs
are still first for a keyboard.

## Update 1 (2026-10-06, owner): the breakdown, whole

The first cut carried Prompt to Loop's five-step STRUCTURE onto Suri's workstreams and left
the breakdown itself off the page. Owner, the same day: the steps Claude took to make the Loop
ad, "why are they not in our configuration page? that's the entire point". The page now mounts
the breakdown WHOLE between the horizon and the workstreams: the film, then 1 · The setup to
12 · Next time, the same record the lunch and learn, v3 and the AP lecture show.

- **A thin `prompt-to-loop` kind**, because the configuration page is on the generic route and
  the own routes mount `PromptToLoop` by hand. It authors nothing: `from` / `to` pick slides by
  id (`promptToLoopRun`, which throws on an unknown id), omitted the whole record; the section's
  `id` is the first slide's. `PromptToLoop`'s "not an arc section kind" note is amended: the
  thirteen bodies are still not a grammar; the kind is a mount.
- **The generic route imports `prompt-to-loop.css`** after `course.css`. Every rule in it is
  scoped under `.ptl`, so it is inert on every other arc.
- **The beats after it are numbered past its whole run** (`arcRuns` adds the run's length), so
  the `ARC / BRIEF · NN` designations stay in sequence.
- The breakdown numbers its own slides; the page's own beats keep 01 to 07 around it.

## Update 2 (2026-10-06, owner): the curve and the catch, the question in the title, the frames' edges, the heads

**The order.** "First we introduce what AI is, then we explain how models are getting smarter and
can work for longer tasks, and then the interstitial." After the spectrum the page takes v3's
curve (`WORKSHOP_INTRO.curve`, its own eyebrow) and the catch ("AI is a superhuman intelligence,
but sucks at running itself."). The catch was authored inline on the lunch and learn; a second
reader makes it ONE record, `theCatch(eyebrow)` / `THE_CATCH_LINE` in `shared/workshopFraming.ts`,
both pages pinned to the same line. The "participate" interstitial is deleted: the configuration's
title now asks it, "How intelligence should take part in the work.", so the page asks the
question once, where it is answered.

**The frames' fading left edge was a bow-tie, house-wide.** Every two-contour `evenodd` ring that
left its contours OPEN joins the outer outline's last point to the inner outline's first, and
those connecting edges cross along the left side: the crossing erases part of the 1px edge,
widest at mid-height. Measured on the configuration board's centre card at 1470×830: the edge's
brightness fell from 451 to 72 at mid-height and recovered toward the corners, while hiding the
ribbons and the reveal changed nothing. ADR-118 U2 recorded the same defect on the overview and
fixed it there; eight rings elsewhere still carried it (the house plate, the pair plate, this
ADR's own frame ring, the homepage proof card's two, the sheet's two, the Trinny proposal's one).
Each now repeats its first point to close each outline; the geometry is unchanged. After: the
edge reads 391 to 398 top to bottom.

**The heads.** On a MacBook Air (1470×830) every workshop title sat under the 20ch cap at 393px
inside a 596px column and stacked three or four lines. The workshop format takes the proposals'
head grammar (ADR-099 U2, after Linear): two equal columns, the paragraph left-anchored at the
midpoint, the title's measure its whole column. The size ramp is untouched. Measured: titles on
two lines at 1470 and 1280, the longest on three; at 1920 the type grows faster than the column,
so the longest titles reach three and one four. Prompt to Loop's heads bind a digit compound
with a non-breaking hyphen (U+2011), in the port script and its output, because "10-second"
broke across the line once the column widened.

## Update 3 (2026-10-06, owner): the copy reads as one page

"We basically built this page using different slide decks": a copy sweep for the seams between
beats, through `thoughtform-tov`. What changed, all on this page's own frame (the shared records
are untouched, so v3, the AP lecture and the lunch and learn read as before):

- **Said twice.** The configuration's sub and the skills beat's sub both said "four are set once,
  the team writes two". The configuration now opens on the catch ("Running it is the part you set
  up, in six questions") and the skills beat names the two.
- **The Loop ad arrived unexplained.** A new callout, `07 · One real job`, says why another
  client's ad is on Suri's page: the same parts, one evening, one real job.
- **The run head restated Prompt to Loop's "How it runs" slide.** `SURI_RUN_SUB` now points back at
  it and says where the asks, steps and figures come from.
- **"Goes through the loop"** in the shared close reads as the Loop ad here, so this page takes its
  own sub (the same three steps), guarded in `suri-pages`.
- The hero's lede previews all three parts; the spectrum's sub ends on what stays with you; the
  curve's sub on "before it needs you", which sets up the catch.

- **Then cut for scanning** (owner: "really easy to read and scroll through"): every head's
  sub now says only what the drawing under it does not (the spectrum's poles, the board's six
  answers, the horizon's three checks were each said in prose and drawn), one or two lines at
  1470×830; the horizon takes this page's own sub, and the skills cards' bodies are one line.

Prompt to Loop's own slides were not swept: they are generated from the owner's artifact and read
by four pages.

## Update 4 (2026-10-07, owner): the video workstream's first real job

"We got a new case which we can integrate in the examples where we have the floating tabs bar":
Under the Glass, the Black Friday teaser made in Cowork on 6 October (an 11-step breakdown, 31 raw
clips to 16 seconds, edit only). Owner's calls: inside the Video retouch + edit tab, condensed.

- **`skill-run` takes an optional `job`** (`ArcRunJob`): the film as the house's silent loop, two to
  four facts, three to seven beats, each beat ONE kind of evidence (stills, rows or figures), an
  optional foot. Rendered by `ArcRunJob` under the run, inside the same section, so the worked
  switch still holds one section per panel and nothing in the renderer moved.
- **The job sits under the run, never as its ask.** The teaser was made before a teaser skill
  existed (the breakdown's own "Next" is to write the method down as one), so the run keeps the
  plugin's `video-retouch` ask and the job is what the workstream has done for real.
- **Condensed to six beats:** the idea, the cut, the reveal, clean-up, rounds, check. The ask,
  look-first, ingredients, deliver and next fold into the sub, the facts and the foot.
- **People by role:** the record is shared and the page the client's, so the editor is "the video
  editor"; `arcs-registry` fails a colleague's first name, money, a missing file or an em dash.
- Media are self-hosted under `public/arcs/suri/under-the-glass/` (WebP stills, the 1.6 MB H.264
  preview; the ProRes master stays in Suri's shoot folder). The block's type and spacing read the
  lattice tokens, so `arcs.css` holds its ratchet pins.

## Update 5 (2026-10-07, owner): the cases switch on their own bar

U4 misread the ask. Owner, the same day: "I built this page to show the different configurations,
and so the moment you enter the flow, in the sections where we break down each case, there should
be a floating bar … When you click on it, the sections change to correspond with the case that we're
looking at." The breakdown is the switched beat, and the cases are its tabs.

- **The breakdown is a worked group, `case`:** Prompt to Loop (`Loop · Halloween ad`, the owner's
  record, unchanged) and Under the Glass (`Suri · Black Friday`). The teaser left the video tab; U4's
  `job` field on `skill-run` is deleted.
- **The `breakdown` kind, ADR-052's twenty-sixth exception** (`ArcBreakdown`): a case as data in
  Prompt to Loop's slide format, the same shell (`ArcBeat`, the arc's own head, `.ptl-sec`): a hero
  with the film, its facts and the beats' index, then one slide per beat, its evidence under the
  head. Seven slides here, the last "Next", as Prompt to Loop ends on "Next time".
- **The pick reaches every group that offers it.** It was page-wide, with every group pinned to the
  same ids, so a page could hold only one set of tabs. Groups that share an example still follow one
  choice together (the lunch and learn's three groups do); a group with its own ids keeps its own
  pick. `arcs-registry` now pins that groups sharing an id share the whole set, in order.
- **Each bar names its group** (`workedLabel`): "The case" and "Workstream" here, "One piece of work"
  everywhere else (U2's open item, closed).
- **A chapter inside a switched beat is the whole group** for the corner readout and the drawer, so
  "How Claude made it" holds over either case and its link never lands on a hidden panel.

## Update 6 (2026-10-07, owner): the third case, Every Word Stays

"Please add this case as well": the email skill made in Cowork on 6 and 7 October (an 11-step
breakdown: one dentist's tips to a skill for every Suri email, five rounds, 36 checks, 3 dated
cases). It joins the case bar as `Suri · Email skill`, condensed to the page and nine slides (the
ask, look first, the rounds, text weight, one lead, her frame, seeing, the system, the skill;
Deliver and Next fold into the last slide).

- **A breakdown's hero may be a PAGE, not a film.** An email has no film, so `ArcBreakdown.film` is
  optional beside `page`, exactly one (registry-pinned); a page hero scrolls in the film's own 9:16
  window (`role="region"`, keyboard-scrollable, server markup).
- **Two more still shapes.** `page` holds a whole tall page to the slide's height at its own width,
  so pages of different shapes sit side by side at one height (the squinted pair, the four ways of
  seeing); `scroll` is a 9:16 window the page scrolls in (the six rounds, the two mobiles). A `1:1`
  still is now contained rather than cropped (a 600 × 710 option lost its foot to `cover`).
- **The caps widen** to ten beats, six frames and six figures a slide; every slide still measures
  one screen at 1470 × 830, and on a phone the stills go two to a row.
- **People by role,** as before: the designer, a colleague who reviews, the creative lead; the
  dentist is named only inside Suri's own email images. The registry bans the first names.

## Mechanics worth keeping

- **The ring is a pseudo, never a clip on the host, for a box with something hanging outside
  it.** Prompt to Loop's chevrons and the run's connectors sit in the gap to the right of a
  station; a clip on the station would cut them off. So a station has no ground at all, and only
  the lit last station (no connector after it), the evals strip, the cards and the bar take the
  host clip and keep their ground inside the notch.
- **The host keeps its 1px border, coloured transparent,** so nothing re-flows; the ring's box
  is `inset: -1px`, exactly the border box. A box with no border would lose its whole ring to
  its own clip, which is why the run's boxes declare one.
- **Prompt to Loop's sheet is generated** (`scripts/arcs/port-prompt-to-loop.py`), so its frame
  rules live in `arcs.css` under the format scope and outrank `.ptl .ptl-station` on
  specificity, never in the generated file.

## Left open

- Two unit tests fail on the clean tree and are not this change: `thoughtform-armada` and
  `skill-file-fidelity` read `../suri-ai-studio`, whose 0.3.0 folded `ai-studio-strategy` into
  `ai-suri`.
