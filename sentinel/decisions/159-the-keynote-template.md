# ADR-159: The keynote template is the UX meetup talk, copied and retold

- **Status:** Proposed (2026-10-16, owner), built and guarded on branch
  `arc/keynote-template-alpha`; on main through U8 (pushed 2026-10-17 on his word). Flips
  to Accepted once the owner has read the page live and ruled on the lines marked (proposal).
- **Surface:** `/arcs/thoughtform/keynote-template-alpha` (an OWN ROUTE,
  `app/(marketing)/arcs/thoughtform/keynote-template-alpha/**`,
  `lib/arcs/content/keynote-template-alpha.ts`); one figure id (`brain`) on `ArcFigureSpec` and
  its static fallback in `ArcFigure`; `OWN_ROUTE_SLUGS`; one `HERO_ROUTES` row; the registry;
  `tests/lib/keynote-template-alpha.test.ts` (new); `arcs-registry` (the ends-on-a-close
  exemption), `hero-preload`, `sheet-instrument` and `sheet-composition` (`REAL_TODAY`
  2026-10-16); `sentinel/DIGEST.md` (the era stage's readers); `docs/talks/keynote-template-alpha.md`;
  `docs/plans/swarm-brain-lab.md` (a reference).
- **Related:** [ADR-156](156-the-ux-meetup-talk.md) (the talk this is cut from, frozen as the
  room saw it), [ADR-147](147-suri-two-pages-one-record.md) (the precedent: a page with the
  record swapped), [ADR-143](143-the-workshop-third-house-cut.md) (the first "template the next
  presentations are cut from"), [ADR-139](139-the-workshop-second-cut.md) (the share rule),
  [ADR-155](155-the-proposal-as-a-system.md) (a line and a picture in turn), [ADR-057](057-arc-terminal-motion.md)
  (a cut reads its original's sections by reference).

## The call

The owner, 2026-10-16, the day after the UX Gent talk: "make a copy of our UX meetup and I think
this is a good keynote template that we can build from." The room had taken the talk ("one of
the best talks I've heard in 10 years", a UX designer). Two things were wrong with the page as
shown: the X-Bionic swarm chapter, added hours before the room between the eras and the wake-up
call (ADR-156 U10), "feels a bit random" there and "should actually come much later"; and the
second half of the narrative was never built: "how do you actually converse ... with these
entities", the colleague, the median, the wolf and semantic navigation, and "convert yourself as a
node in the latent space through which agents can flow."

The same week Goodfire published "Neural Networks Are Already Clean" (Cammarata, 2026), which he
read as a challenge to "a core thesis of my thing: that we're actually dealing with entities we
don't fully understand", and answered himself: "even if they're legible intelligences, they are
still going to have their own society and their own minds, and it's already happening ... a bit of
humility when dealing with these intelligences is important."

Asked, he ruled: the copy is `keynote-template-alpha`; the Ghent page stays frozen; "the arc that
we have on our homepage, I still want it. Let's keep it at the end"; the swarm is to be integrated
into the narrative, not parked; beats 07 and 08 are rewritten for Goodfire and a legibility beat
added; the talk, his dictation and the essay go into the Astrolabe inbox.

## The decision

**A house arc at `/arcs/thoughtform/keynote-template-alpha`, the talk's page with the record
swapped** (ADR-147's shape, on ADR-156's route): v1's prototype, route sheet and `.tw-root`,
`data-tw-cut="v3"` and `data-tw-order="talk-first"`, v3's `replaceHeroCopy` / `replaceAboutBio`
and proof by import, the talk's own order moves copied (`order.ts`) and its ground and reader
(`TalkGround`, `useTalkFrame`, `TalkMarkField`) BY IMPORT from `../ux-meetup/`. The page-bound
files are forked: `FoundationAct.tsx` (it reads the record and expects its beats in order),
`journey.ts`, the portals, the tail, `SwarmChapter.tsx` and the sheet.

**The Ghent page is a dated record, frozen.** This is the exception to ONE SECTION, ONE RECORD
(DIGEST §Working on this codebase) that rule itself allows a template that diverges, stated here:
`ux-meetup/**` and `lib/arcs/content/ux-meetup.ts` are untouched by this change
(`git diff` empty), and a change to a beat the keynote shares is made on the keynote by forking
that beat, never on the talk. **The Ghent beats are read by reference** (`ghent(id)` in the
record, the `-v2` rule of ADR-057): the six of the first act are the talk's own objects, the two
that moved (`latent-space`, `prowl`) are the same objects spread with their new number, and the
seven that changed or are new are this record's own. `keynote-template-alpha.test.ts` pins all
three sets and the Ghent order.

**The talk machinery's hooks are shared, not renamed.** `.uxm-ground`, `data-uxm-ground`,
`data-uxm-active` and the `.fa` act are written by the imported ground and the forked tail, and
both sheets write identical rules for them, so the two routes loaded together paint the same.
Only the swarm's slot is this page's own (`#kta-swarm`, `data-kta-swarm-root`, `#kta-vision`,
`#kta-adoption`), because it stands elsewhere.

**The order (owner, 16 October), three acts, a line and a picture in turn (ADR-155; an act
counts as one):**

|       |                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------ |
| I     | 01 the claim · 02 what it can make · 03 the interface · 04 not software · 05 an intelligence · 06 every desk  |
| II    | 07 a new kind of user · 08 the shoggoth · 09 already clean · 10 their own                                    |
| III   | 11 a colleague · 12 latent space · 13 the median · 14 the prowl · 15 a node in latent space                  |
| —     | the swarm chapter: AI capability your teams own · Navigate, encode, build · Marketing first, then every team |
| —     | the corridor's thesis · Navigate · Encode · Build · the proof · contact (unchanged)                           |

The wake-up call follows the eras directly again, so the talk's weld up into the eras' runway
(ADR-156 U3) is back; the Ghent page's cancel rule (U10) has no seat on this sheet. Five
chapters: the claim, what it can make, an intelligence, every desk (the talk's own) and a
colleague (the third act's opening).

**The Goodfire rewrite (07 to 10).** The essay is a working hypothesis from one lab (companion
papers pending) that most neurons in modern models have one legible job and that the canonical
evidence for superposition was misread. It does not claim behaviour is predictable from
mechanisms, that frontier models are audited, or that understanding is steering. It presses on
one Ghent line, the shoggoth's "something we don't fully understand"; the alien question survives
only if alien means not a person, never unreadable. So:

- **07 `an-alien`** asks "for a user that isn't a person?" (his phrase, the close of the Ghent
  script), eyebrow "A new kind of user".
- **08 `shoggoth`** keeps its picture; its line is "A friendly face on a mind we are only
  beginning to read." (proposal).
- **09 `already-clean`**, a voice with the registration row, is their line in their words,
  credited: "The network is strange, but its strangeness repeats." Nick Cammarata, Goodfire, 2026.
- **10 `their-own`**, the `brain` figure: the machined brain alone, no mask, no tentacles, its
  cables hanging, centred under its head; "Legible. Still their own." / "Even when we can read
  every neuron, they form minds and societies of their own. It's already happening." (his words).
  The act's sixth phase, drawn through the stack's camera as the shoggoth is.

**The third act (11 to 15)** is his dictation as lines: "Treat it like a pretty smart colleague.
Respect the intelligence." (11, a statement); latent space as it was (12); "Without context it
gives the most plausible answer. The median." (13, a statement); the prowl, the wolf, wordless,
the script carrying semantic navigation over it (14); "Convert yourself into a node in latent
space that agents flow through." (15, a voice). The swarm chapter follows as its picture: the
stack with the mark engraved on the layer, the steps, the organisation; its words are still the
proposal's ("X-Bionic · Marketing", "XB / STEPS"), a keynote variant of those labels is a later
round.

**The spoken script** in the new order is `docs/talks/keynote-template-alpha.md`, from the Ghent
script and his dictation, every proposal line marked. The Ghent script is left as it was given
(it stopped at U9; the swarm and the prowl never reached it).

**The Astrolabe.** Two drops at the vault's one door (`I:\My Drive\00_Inbox`): his own material
(the Ghent script as spoken, the room's reaction, the 16 October dictation verbatim as blockquotes,
the day's rulings as frame) and the essay (title, author, URL, citation, the claim in five lines,
the session's reading as frame, his first reaction as a blockquote). `/scribe` compiles them;
nothing was written into the vault by hand.

## What is not built

- **Pictures for 13 and 15.** The median has no drawing yet (a lab: the field collapsing to its
  centre); the node has the swarm as its picture. ADR-155's alternation holds on the page as it
  stands (no two lines side by side).
- **The swarm's keynote labels.** "X-Bionic · Marketing" and "XB / STEPS" are the proposal's
  constants (`NetworkOrg.tsx`, `EmbedStack.tsx`); parameterising them with defaults, so the
  proposal and the lab stay byte-identical, is a later round.
- **The knot and the city.** Goodfire's header (a torus of roads beside an island city, their
  "A City vs a Knot") is the picture the essay retires beside the one it proposes; a knot that
  resolves into a city is a candidate for 09 and 10, filed in `docs/plans/swarm-brain-lab.md`,
  never their illustration.
- **The `.claude/rules/arcs.md` pointer** is skipped: 16 bytes of headroom under
  `context-budget` (the portfolio set the precedent); this ADR is the record.
- **The corridor thesis after the talk** still echoes 05 (ADR-156's open line); his call.

## Verification

- `tsc --noEmit` clean. `eslint` clean on every file this change touches (`npm run lint` sits
  over its cap on `main` before and after, none of it here).
- `keynote-template-alpha.test.ts` (8), `ux-meetup.test.ts` (11, unchanged) and `arcs-registry`
  (60) green; `hero-preload`, `sheet-instrument`, `sheet-composition`,
  `thoughtform-workshop-v2` (the folder walk), `arc-terminal-markup` and `context-budget` green.
  The first run failed one registry guard by name (a menu label of 22 over the 18 cap, "A node
  in latent space"), fixed to "Yourself as a node".
- `git diff -- "app/(marketing)/arcs/thoughtform/ux-meetup" lib/arcs/content/ux-meetup.ts` is
  empty: the Ghent page as the room saw it.
- The route answers 200 on the worktree's dev server without a restart.
- Headed read in the owner's Chrome (page zoom at 50%, an effective 2567×1263 viewport; the
  1280×720 and 1920×1247 shoots with the capture script are still to run): every one of the
  fifteen beats one screen, each title decoding in place; the wake-up call directly after the
  eras; 07 to 11 as written above; 10's brain alone, no mask, no tentacles, its cables hanging,
  centred under its head; the prowl full bleed at 14; the swarm arriving in flow after 15 with
  no empty screen and no pane over anything; the corridor's thesis after it, the Arc and the
  proof after that. A wheel-walk from the first beat to the swarm and back, 146 steps of 260px:
  the beat up matched the geometry at every step, 0 mismatches, the ground off past the last
  beat. Console: no error, no warning (one analytics line).

## U1 · The brain is one object, on tendrils, inside the band (2026-10-16, owner: "it looks really sick")

His read of the first cut, on his wide screen, with two references (a chromed brain on hanging
hoses by Vladislav Ociacia; a glass brain wrapped in wires), as built:

- **Inside the instrument band** ("the elements are too close to the left and right rails ...
  make the right cards a bit smaller and move everything so we follow our margin best
  practices"). The act's box is `min(100vw − 2 × --instrument-margin, …)`: capped at
  `--instrument-max` on a wide screen, the content inset on a laptop, so the facing card reads
  at the band's size and the stack stands clear of the rails.
- **The brain manifests** ("its current appearance ... includes a cross-swipe effect. Isn't there
  a way to really leverage the anatomy skill ... so the different layers of the brain are quickly
  drawn as if they're manifesting?"). The scanline is gone. `brainIsoMarkup` takes `reveal`: every
  part carries a build level from the floor to the crown (the lower plates, the terraces, the
  machine on the deck, the mask) and a reveal emits the parts at or under it in paint order, so
  the act rasterises twelve steps of the picture and draws them over 0.9 s the first time the
  brain is seen after being gone: both hemispheres rise together, plate by plate, the machine
  last. The anatomy skill itself is not on this seat; the kit's own build order is the animation.
- **Tendrils, not a block** ("I don't think we need those so-called blocks at the bottom of the
  brain. I think it needs tendrils like in this screenshot"). `base: "tendrils"` draws no stem,
  block or manifold; `BRAIN_ISO_ROOTS` are eight points on the hemispheres' undersides, and the
  act hangs a hose from each, live: falling, swaying, curling at its end, no two the same length
  or weight, a gold ferrule at the mouth and a plug at the tip, drawn under the brain so each
  emerges from it. The shoggoth keeps its tentacles instead.
- **The cords from three sides** ("the cables are all linked on the right side but can't we spread
  them out on the other side so they really touch all the different angles?"). On the interface
  beat seven hoses are the cords: the right roots round the stack's right side into the plates'
  right edges, the left roots round the left into their left edges (`socketAt`, a socket on the
  plate's upper-left side), one over the back into the top plate; the eighth hangs free. A hose
  lets go the moment its cord starts to grow.
- **"AI is both the tool and the builder of the tool."** is 04's line, in place of the Ghent "AI
  can make any software, but isn't software itself."; the beat is forked from the Ghent record.
- **The brain persists** ("right now the brain disappears but then reappears in a later section
  ... when you go into this interstitial quote slide, the brain we have from the previous section
  then moves slightly into the background with lower opacity, and when you enter 'AI is an
  intelligence that sits in the middle,' the brain comes back into view"). The act's beats are ten
  now: the voices between its drawings (04 not software, 07 the alien question, 09 Goodfire's
  line) are its phases too, with a RECEDE pose (centred, 0.6 scale, 0.28 alpha); the brain's seat
  eases from pose to pose by the clock (never by the frame: a background tab is throttled to a
  frame a second and the ease still arrives), its picture crossfades (whole → split → whole →
  masked → whole), and those three beats' stages rise over the act's layer so the line reads over
  the dimmed brain. The cards and the runs of the middle beat wait until it stands whole.
  `data-fa-brain` on the act is a readout of what the brain is doing, for the walks.

`brainIso` with no options is byte-identical to before, pinned in `keynote-template-alpha.test.ts`,
so the Ghent page's brain is the one the room saw. Verified: `tsc` and `eslint` clean; the
keynote test (9), `ux-meetup` and `arcs-registry` green; read headed in the owner's Chrome at the
interface, not software, the middle, every desk, the alien question, the shoggoth and their own:
the manifest from the floor, the cords from three edges, the brain dim behind each voice and whole
again after, the split with its two cards and runs, the hoses under every pose but the shoggoth's.
No console error.

## U2 · The brain turns to face the room, and the heads stand on top (2026-10-16, owner: "looks sick")

- **The turn** ("when you scroll from 'intelligence as the interface' to 'the AI is both the tool
  and the builder of the tool,' the brain rotated so it's more central. It would also tilt up so
  that, when you land [on] 'the AI is an intelligence that sits in the middle', you can really
  see the frontal view while still maintaining a 3D POV"). `brainIso` takes a camera (`view`):
  `BRAIN_VIEW_ISO` is the stack's isometric, the default and byte-identical; `BRAIN_VIEW_FRONT`
  is face on at 22° of elevation. The act walks a path in two legs, the turn (azimuth 45° → 0°)
  behind the voice and the tilt (35.264° → 22°) into the middle, twelve frames a leg rasterised
  as the scroll approaches them (a couple a frame, never a stall), the seat eased by the clock;
  every anchor (the roots, the flanks, the bounds) is read at the frame drawn. From the middle on
  the brain stays face on: the rings around a front view, the mask seen straight, the brain alone
  facing the room.
- **"An intelligence that will soon absorb all knowledge work."** is 06's line ("reword it so
  it's more logical"), the rings and their layers the talk's by reference.
- **The heads on the screen's top datum** ("the hero H1 ... is in the middle ... feels a bit too
  far down and centered. If you look at Linear ... it feels different and always placed properly
  on top"). Linear's section grammar, measured for ADR-099 U2 and read again today: the heading
  first, a short paragraph under it, the visual below, the head a fixed inset under the section's
  top, never centred against the frame. The act's head leaves the scene's box and stands on the
  viewport at `--fa-head-top` (clamp 72px · 10.5svh · 132px), inside the band's inset: centred
  for the middle, the rings and the brain alone (his "play around with centering it"); left on its
  own measure over the stack; and the shoggoth as the homepage hero's shape, the title left and
  the line right across the band.

Verified: `tsc` and `eslint` clean; the keynote test (9, with the camera and the datum pinned),
`ux-meetup` and `arcs-registry` green; the Ghent brain byte-identical with the default camera.
Read headed in the owner's Chrome: the brain isometric over the stack with its cords; face on,
receded and dim behind "AI is both the tool and the builder of the tool."; tilted up and split in
the middle with its cards and runs; the rings under the new line; the mask straight on; the brain
alone facing the room; every head at the top datum. No console error.

## U3 · Glass, orbits, the pointer, the display, and one beat fewer (2026-10-16, owner: "I like this")

- **The interface beat says it itself** ("'intelligence as the interface' I feel like we need to
  say something like 'AI is both the tool and the builder of the tool' ... That way we can skip
  that interstitial afterward and then immediately go to 'AI is an intelligence'"). 03's head over
  the brain is his line; the voice that followed it is gone; the middle comes straight after, and
  the brain turns and tilts on its way there, in one move. Fourteen beats, renumbered; the two
  moved Ghent beats and the rings spread with their new numbers. The spoken script follows.
- **The cards as glass** ("the cards can be a bit more subtle. Using our color palette, we can
  make them more glass-like"). The middle beat's two cards take a wash of the page's ink on the
  ramp's own pair (`--dawn-rgb`, which the light theme swaps), lighter at the top (`#fa-glass`),
  a quiet edge, a ghost of a back face and a hairline of light along the top; the rows at the
  70 rung. No literal colour.
- **The orbits in three dimensions** ("the orbits are pretty flat, whereas our brain feels more
  3D ... video-game-style physics so they rotate around it"). Each of the three rings is a circle
  in its own plane: tilted out of the screen by its own angle (1.2, 0.9, 0.62 rad), rolled off
  the horizontal by another (0, 0.42, −0.55), the plane precessing slowly, the nodes running
  round it at a game's pace, the inner the fastest, each way in turn; a simple perspective
  (`ORBIT_EYE` 2600 px) sets every point's size and weight by its depth, and the ring and its
  nodes are split by depth at every point into the pass under the brain and the pass over it.
- **The pointer leans the brain** ("when you move your mouse, the brain moved slightly across all
  the different sections, not entirely but just enough for a little fun interaction"). The
  pointer, −1..1 across the screen and eased by the clock, moves the brain's seat by up to 18 × 11
  viewBox px at its scale, in every beat it is drawn; the hoses, cords, rings and runs read that
  seat, so they come along and the cords bend.
- **The display in place of the mask** ("The mask on the Shoggoth feels a bit out of place. It
  should also be made from the same material and form a smile. Maybe it can be like a terminal
  interface, an LED display ... Don't make it too disco or cringe"). `mask: "display"`: a
  machined panel in the brain's front plane, the kit's own material (the plates' face tone, a
  shade for its side, the mid line for its edge), cut top-right as the house's plates are, a bezel
  and four screws as on the deck's board, and a 15 × 9 matrix of dim LEDs with fifteen lit in gold
  under a soft halo: two closed, happy eyes and a smile. Nothing blinks. `mask: true` is still the
  Ghent faceplate, untouched.

Verified: `tsc` and `eslint` clean; the keynote test (9, with the display, the orbits, the
pointer and the glass pinned), `ux-meetup` and `arcs-registry` green. Read headed in the owner's
Chrome: 03 with his line over the isometric brain and its cords; the middle with its glass cards,
split brain and runs; the orbits crossing in depth round the front view; the shoggoth with the
display's smile, read close; the brain leaning with the pointer at the screen's two corners. No
console error.

## U4 · Two lines of his, planets, and a smile of particles (2026-10-16, owner: "looks good")

- **The lines.** 03's head over the brain is "AI will become the interface." ("'AI is both the
  tool and the builder of the tool.' It's too long"); 04's line is "But AI isn't software. It sits
  between a tool and a collaborator." in place of the Ghent "AI is an intelligence that sits in the
  middle." The cards and the drawings stay the talk's. The script follows.
- **Planets on the orbits** ("we can do a bit more with the orbits. Maybe add some subtle light
  effects. We have these orbits but also these dots, so make them a bit more like planets or
  artifacts"). Each node is a small body: a radial fill lit from the upper left fading at its
  limb, a soft glow round it, both scaled by depth; every third body on the inner orbit carries a
  thin tilted ring, an artifact. Each ring's near run has a soft light under it and a glint, a
  short bright arc travelling the ring ahead of its planets. The names stand clear of the bodies.
- **The smile as particles** ("it doesn't really look like a smiley face so I don't want a frame
  around it. I just want to use a particle system to create a smiley face"). The U3 display is
  retired from the keynote (the option stays in `brainIso` unused; the Ghent faceplate is as it
  was). The shoggoth is the whole brain, and the act draws the smile over it in the brain's own
  front plane through `brainIsoPoint`, under the current camera: two closed, happy eyes and a
  smile sampled along three arcs, each sample a gold particle with a soft glow, jittered once,
  drifting a little and breathing. It gathers in after the tentacles.

Verified: `tsc` and `eslint` clean; the keynote test (9), `ux-meetup` and `arcs-registry` green.
Read headed in the owner's Chrome: 03 with the short head; 04 with his line over the glass
cards; the orbits with their lit bodies, rings and glints; the shoggoth with the particle smile,
no frame. No console error.

## U5 · The smile spread, the orbits still, the lean, the hoses machined, and the layer (2026-10-16, owner)

His read of U4: the smile "too bloomy and too bright … spread the particles around a bit so it
really feels like a face made out of particles"; the orbits "I really don't like … you can just
restore the yellow ones. The rest is fine"; "the bottom part of the dotted-line orbits is cut
off"; "when you move your mouse, I want to be able to rotate the brain a bit, not too much"; "in
the orbits phase the orbit should remain still and it's only the brain that I want to be able to
move"; the orbits appear "not with a simple opacity reveal, but by really starting to orbit
around them with a nice speed ramp, not too fast"; the tentacles "a bit too organic … more
robotic … wetware or biomechanical"; and a new beat after the shoggoth: "hide the mask … reveal
the brain, move the two parts left and right respectively, and place our Thoughtform-encoded
layer that we built for the swarm page in between … make sure it visually looks the same … I am
the layer between machine intelligence and human taste, context, and expertise."

- **The smile** is three particles a sample, spread wider, dimmer, its glow a tenth of U4's.
- **The orbits.** The inner ring's bodies are the U3 squares again; the outer two keep their
  planets. The three ellipses are fitted inside the scene's box, so no ring is cut at the floor.
  Each ring appears by motion: it draws on round its own path as its bodies start to orbit, on a
  ramp from still to pace, never an opacity. The rings hold on the brain's seat; only the brain
  takes the pointer.
- **The lean.** The pointer turns the camera, not the picture: a yaw of up to four steps and a
  pitch of up to two, two degrees a step (`Cam { vi, py, pp }`), each lean a rasterised picture
  of its own, primed once the brain stands at a station. The parallax under it is halved.
- **The hoses** are machined: eleven joints a hose, a link with a gap between each, a gold core,
  collar bars, a plug at the tip.
- **The layer, a new beat `the-layer` after the shoggoth** (`08 · The layer`, the figure kind
  `layer`, words only, like `brain`): "I am the layer." / "Between machine intelligence and
  human taste, context and expertise." (his words). The act turns the brain back to the stack's
  isometric; once it stands there its two hemispheres move apart along the brain's own L axis
  (`brainIso`'s new `only: -1 | 1`, one hemisphere a picture; the defaults byte-identical) and the
  swarm page's layer plate prints between them, row by row. **The plate is the swarm's own, dot
  for dot**: its lattice from `proposal-swarm/engine/lattice.ts` (picked for a seat three tenths
  of the act's width, so a laptop takes the 320px plate and a wide screen the 448px one), its
  population `dots.ts`'s `layerPop` (the strata on the two near walls, every site of the top,
  the rim lit), the mark cut into its top as `mark.ts` cuts it in `engrave` (`markCover`,
  `lightOf`, `engraved`; `COVER` is exported for it), and its paint the engine's `paletteOf` in
  the page's own tones over the ground the canvas sits on. Each hemisphere clears the plate's
  edge by thirty-six brain units; the plate's top sits eighteen above the equator. Depth order
  for this camera is far half, plate, near half: the plate's far corner lies over the far half's
  foot and tucks behind the near half's dome (the first cut had it backwards and printed the
  plate over the near half's deck; the two screen axes of the plan are sixty degrees apart, so
  a plan clearance is not a screen clearance). No hoses, no smile.
  Leaving the beat the halves close first and the camera holds the isometric until they have,
  then turns. The beats after it renumber 09–15; the act's phases 6 the layer, 7 Goodfire's line
  behind, 8 their own, 9 the field.
- 06's line is left as it was: his to change ("it still needs context and taste").

Verified: `tsc` and `eslint` clean; the keynote test (9), `ux-meetup` (11), `arcs-registry` (60)
and `arc-terminal-markup` (9) green. Read headed in the owner's Chrome at 2131×1270: the
orbits whole inside the box, the inner ring's squares back, the rings still under the pointer
while the brain leans (`lean3,-1` in the readout); the shoggoth's spread smile over machined
hoses; the layer beat with the 448px plate (`7:4 n4`, the readout `data-fa-layer`) between the
parted halves, the far corner over the far half's foot and the near corner under the near
half's dome; leaving it, the halves close at the isometric before the brain turns and recedes
behind the Goodfire line; their own whole on its hoses after. No console error.

## U6 · The claim on the stack, one connection, his line, the shoggoth held back, the layer standing (2026-10-17, owner)

U4 and U5 went to main first, on his "push to main", as two commits (`db3b7144` his two lines,
`3750fa02` the rest: U5 had rewritten U4's planets and smile in the same file, so U4's code
landed with U5). Then his notes on the stack: "we need to have an H1 text in the top left,
something that nicely connects with the next section"; "maybe we don't need that interstitial
but we can just use that title in the section with the different phases, the stacks, image,
film"; "instead of 'an image' ... images, video, tools. I don't want to use the word 'then'
every time"; "when we don't have a paragraph on the right ... keep [it] centered"; 06 "should
be replaced with 'but it still needs context, nuance and taste'" (dictated "new ones"); "hide
the shoggoth section for now"; "we don't need the 'I am the layer' text, just the brain opened
in the middle: the Thoughtform stack. This Thoughtform stack should stand upright, not
horizontally."

- **The wake-up call is the stack's head.** `the-claim` is off the keynote; its words, as the
  room heard them ("AI will absorb all digital contents and products within 2 years."), are the
  capability figure's new optional `title`, the act's head for phase 0, set left on the top datum
  as the hero's H1 (22ch, two lines at his viewport, clear of the stack and the facing card).
  The beat is forked on the record (`absorbed`), its media the talk's by reference, its cards
  named as one run: Images, Video, Tools, Brand systems, Products, Worlds, Mathematics, and the
  one caption with a "then" in it reworded. The beats renumber 01-13; the hero's links point at
  `#capability` and `#the-layer`.
- **The interface's head connects to it**: "And it becomes the interface to all of it."
  (proposal), centred. Every head with no paragraph beside it is centred now; the stack's alone
  stays left, as an H1.
- **05 is his line**: "But it still needs context, nuance and taste." (eyebrow "What it still
  needs", menu "Context and taste": the registry caps a menu label at 18).
- **The shoggoth is held back**, not deleted: its record is `KEYNOTE_SHOGGOTH`, off the page;
  the act keeps its phase 5, so putting it back is one line in `sections`.
- **The layer is wordless and the plate stands.** The figure's `title` and `line` are optional
  and the keynote's beat has neither (the static fallback letters nothing). The act turns the
  brain to the isometric and parts it as before, each half `LAYER_PART` (175) brain units out
  along L; the swarm's plate stands upright in the gap, its face square to L (the brain's
  isometric is the lattice's, so L runs along the lattice's `j` and the plate's thickness with
  it). `layerDots` is `layerPop` turned a quarter onto its side: the old top is the face that
  looks at the reader, engraved through `mark.ts`'s own `coverOf` read square to the face
  (`coverOf` and `LIP_REACH` exported for it), the rim lit; the strata run through the thickness
  and show on the two near edges (the top edge lit as the near wall was, the end plain). The
  lattice is picked for a face of about `LAYER_SIDE` (210) brain units, the brain's own height
  and a bit, its middle `LAYER_Z` (22) above the equator. The slab is solid: its silhouette
  takes the page's ground, so the far half does not show through, and it prints from its foot
  up. Depth order far half, slab, near half. The pose sits on the box's middle (y 410).

Verified: `tsc` and `eslint` clean; the keynote test (9), `ux-meetup` (11), `arcs-registry` (60)
and `arc-terminal-markup` (9) green. Read headed in the owner's Chrome at 2131×1270: the stack
with its H1 top left and "Worlds" on the facing card; the interface's head centred on one line,
clear of the brain; the layer with the 5:3 n4 plate (`side198`, `part175` in `data-fa-layer`)
standing between the halves, the near half clear of its face and the mark legible on it. No
console error. The quote and statement lines did not type in under the automated drive, on this
page and on the frozen Ghent page alike (their text is in the DOM); a manual scroll is the
check.

## U7 · One paragraph, the H1 centred, two beats held back (2026-10-17, owner)

His read of U6 (pushed as `cb95313c`): "all these sections need to flow like one coherent
paragraph so they build on top of each other"; the stack's title "also needs to be centered";
"hide the section about how the network is strange and also hide the section 'Legible, Still
Their Own' because I want to build new sections". The same note asked for the cards redrawn,
the mathematics as a black hole, the brain machined and tendrils in the layer beat: those are
design rounds of their own (cards and mathematics in Claude Design, his pick; the brain and the
tendrils on the dev server), recorded when they land.

- **01 to 05 as one paragraph, his wording** (picked from three: "Shortest"): 01 "AI will absorb
  all digital content and products within 2 years." ("content", as he wrote it; the Ghent room
  heard "contents") · 02 "And the interface to it all." · 03 "Not software. An intelligence: the
  tool and its maker." · 04 "Next, all knowledge work." · 05 "But it still needs context, nuance
  and taste." The 02 and 03 heads are his now, no longer proposals; the cards under 03 and the
  rings under 04 are the talk's.
- **The stack's H1 centred**, like every head with no paragraph beside it (22ch, two lines).
- **Goodfire's line and "Their own" held back** the shoggoth's way: `KEYNOTE_ALREADY_CLEAN` and
  `KEYNOTE_THEIR_OWN`, off `sections`, the act's phases 7 and 8 kept, so each comes back with one
  line. The beats renumber 01–11; the layer is followed by the third act's colleague, a line
  after a picture, so ADR-155's alternation holds. The script keeps both under "Held back".

- **The cards and the mathematics went to Claude Design** (his pick of where to design them): a
  Design canvas, "Keynote cards" (`https://claude.ai/artifact/6Ngc9t3fTxv1czns8kGNxS`, private),
  three card directions each drawn on an image, a film and the mathematics card (A · Band, the
  ADR-153 job band in Tensor Gold; B · Readout, a double hairline and a key/value foot; C · Rail,
  a mono rail with the stack's tick ladder and the play docked to it), every part in one seat
  on every card, and the mathematics as a live black hole made of mathematics (M1; M2 held in a
  machined collar): glyphs and the card's own equations on a tilted accretion disk, the far half
  lensed over the horizon, a gold photon ring the one lit thing. Nothing of it is in the act
  until he picks; then it ports as U8 (`mathHole.ts` for the hole).
- **The brain machined all over**, as `brainIso`'s `chip` options, each off by default (the Ghent
  brain byte-identical; `brainIsoStyle` adds the via rule only for a brain that has vias):
  `wafer` (a scribe line round every plate's band, die pads on the upper rims, bond pads round
  each crown's board wired up to it in gold), `weave` (gold traces stepping down the terraces
  from the crown, a via at each step), `die` (the medial wall a plane, `contourPoint`'s `flat`,
  its front and back kept round, with a die's face on the wall that faces the reader: a double
  seal ring notched once in gold, cells, pads). The contour became `contourPoint` + `contour`,
  same arithmetic. Read at `/test/keynote-brain?v=b1|b2|b3|base` (whole and parted); the act's
  `BRAIN_CHIP` is `{}` until he picks.
- **The layer plugged in** (L1, `layerTendrils.ts`): six files of the slab's own lattice dots to
  each half, leaving a face along `j` (the brain's L axis), stepping once up or down the face,
  running to the hemisphere's medial wall (`brainMedialL(z, flat)`, new) inside the walls' band
  (`WALL_Z`), a plug where each meets it and two gold walkers a file running slab to brain;
  painted far files, slab, near files, near half, so the slab covers the far roots and the near
  half the near tips; they grow once the slab has printed (`apart` 0.82 to 1) and reel back
  first when the halves close.

Verified: `tsc` and `eslint` clean; the keynote test (10), `ux-meetup` (11), `arcs-registry` (60),
`arc-terminal-markup` (9) and `proposal-swarm` (51) green. Read headed in the owner's Chrome at
2131×1270: the H1 centred on two lines clear of the facing card; eleven beats; the brain lab's
B2 weave and B3's die face on the parted far half; the layer beat with `files12 grown1.00`, the
files reaching both halves. No console error from a fresh load through every phase.

## U8 · The Readout card, and the black hole of mathematics (2026-10-17, owner: "I'd go for version B")

His pick on the Claude Design canvas: B · Readout. Ported into the act's `Module`, in card units
(560 × 540), the keynote's own geometry beside the talk's `MEDIA` (which stays the Ghent card's):

- **The frame** is the double hairline: the chamfered edge and a second one inset 5
  (`innerChamfer`), no survey crosses on the card's corners.
- **The head** is the title (28) and the count (`07 / 07 · 2025`, mono, ink-50) on ONE line at
  y 52, the right margin clearing the cut (`PAD_R` 43), the caption under them at y 78.
- **The picture** is `KMEDIA` (27, 93, 506 × 285: 16:9) with gold survey crosses on its four
  corners (`.fa__mark`). Stills fill it (`slice`); films stay whole ("never cropped", his
  2026-10-15 ruling) and letterbox on the card's own ground, so no black blocks on parchment.
- **The foot** is a readout of two ruled rows (`ROWS`): KIND (Image · Film · Drawing) and, for a
  film, SOUND "▶ PLAY WITH SOUND" in gold, for the rest SHOWN "◇ STILL" / "◇ LIVE". The button
  is that row: a transparent hit area seated over the drawn value from `FACING` and `ROWS`, so it
  scales and stands with the card (measured over the value at 2131×1270), an outline on hover
  and focus. The old overlay, sized in CSS px and seated on the picture, is gone with its
  inconsistency.
- **The mathematics card is the black hole** (M1, the one the Readout board showed):
  `mathHole.ts` (`holeSeed`, `holeStep`, `paintHole`), mounted by `MathHoleCanvas` in a
  `foreignObject` in the media rect, so it rides the sheet's matrix and clip; it runs only while
  the act is up and rasterises at the card's on-screen size. The horizon is larger in the card
  than on the canvas board (`size` 0.105, `tilt` 0.27) so the glyphs read as mathematics. The old
  `MathBoard`, its flow and the worlds placeholder are deleted with their rules.

Verified: `tsc` and `eslint` clean; the keynote test (11), `ux-meetup`, `arcs-registry`,
`arc-terminal-markup` and `proposal-swarm` green (142). Read headed in his Chrome at 2131×1270,
dark and light (through the switch): the Tools card's rows and the hit area over its value, the
mathematics card's hole with ∑, π, θ, ∞ legible round the gold ring. No console error from a
fresh load through every phase.

## Left open

- Every line marked (proposal): 02's spoken paragraph, 01's spoken run without "then", 05's
  spoken paragraph, 06's spoken paragraph, 10's spoken paragraph on semantic navigation, and in
  the held-back beats Goodfire's last line, the choice of quote and "Their own"'s title.
- "Nuance" is read from his dictation ("new ones").
- Act II is still called "a new kind of user", though the question that named it is off the page,
  and it now holds two beats until his new sections land.
- His picks still open: a brain direction (B1, B2, B3 or today), whether the tendrils (L1) stay
  as files or try L2 (cables with runners), and M2 (the hole in a collar) if he wants it over M1.
  The gap between the picture and the readout (77 units) is the canvas board's; his to tune. The house rule "one lit part, gold once a drawing" is set aside on the brain at
  his word ("weave them throughout"); the core stays the only `lit` part.
- The layer's side, parting and height (`LAYER_SIDE`, `LAYER_PART`, `LAYER_Z`) are first
  values; whether the hemispheres should keep their hoses in that beat is his read.
- The planets' size and glow, the glint's pace and the smile's density are first values.
- The orbits' angles and periods, the glass's two opacities, the lean's reach and the display's
  smile are first values; his to tune on the live page.
- The hoses' make (U1) is a first cut against his two references; whether they want the glass
  brain's wires wrapped round the hemispheres as well is his read.
- The front camera's tilt (22°) and the turn's pace (about a second a leg) are the first values;
  his to tune on the live page.
- The NYT byline and date in the script (Freedman, 14 October 2026, from secondary coverage; the
  article itself was not opened).
- Whether the swarm's labels get a keynote variant now or later; whether the thesis stays.
