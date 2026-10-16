# ADR-159: The keynote template is the UX meetup talk, copied and retold

- **Status:** Proposed (2026-10-16, owner), built and guarded on branch
  `arc/keynote-template-alpha`, not pushed. Flips to Accepted once the owner has read the page
  live and ruled on the lines marked (proposal).
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

## Left open

- Every line marked (proposal): 08's line, 14's spoken paragraph on semantic navigation, the
  wording of 07, 09's choice of quote, 10's title.
- The hoses' make (U1) is a first cut against his two references; whether they want the glass
  brain's wires wrapped round the hemispheres as well is his read.
- The NYT byline and date in the script (Freedman, 14 October 2026, from secondary coverage; the
  article itself was not opened).
- Whether the swarm's labels get a keynote variant now or later; whether the thesis stays.
- The push: nothing on this branch has left the machine.
