# ADR-156: The UX meetup talk is a cut of the workshop's third house cut

- **Status:** Shipped (2026-10-13, owner: "push to main"), two days before the talk, as the
  first cut stood. Flips to Accepted once the owner has read the page live, which is
  Thursday 15 October in the room.
- **Surface:** `/arcs/thoughtform/ux-meetup` (an OWN ROUTE,
  `app/(marketing)/arcs/thoughtform/ux-meetup/**`, `lib/arcs/content/ux-meetup.ts`); the new
  shared record `lib/arcs/content/shared/in-the-pocket.ts` and `ap-hogeschool.ts` reading it;
  an optional `ledes` argument on `workshop-v3/WorkshopProof.tsx`; `OWN_ROUTE_SLUGS`; one
  `HERO_ROUTES` row; the registry; `tests/lib/ux-meetup.test.ts` (new), `arcs-registry` (the
  `three-ways`, `the-curve` and `between` reader pins), `hero-preload`, `sheet-instrument` and
  `sheet-composition` (`REAL_TODAY`).
- **Related:** [ADR-143](143-the-workshop-third-house-cut.md) (the cut this page is cut
  from, "the template the owner's next presentations are cut from"),
  [ADR-147](147-suri-two-pages-one-record.md) (the precedent: v3's page with the record
  swapped), [ADR-141](141-the-ap-hogeschool-lecture.md) (the lecture, whose nine-sector wall
  this page shares), [ADR-139](139-the-workshop-second-cut.md) (the share rule),
  [ADR-142](142-arcs-nest-under-their-group.md) (the address),
  [ADR-131](131-the-workshop-archetype.md) (one idea per screen).

## The call

The owner, 2026-10-13, two days before a talk at the UX Gent AI-design meetup: "create an
Arcs page where we can do the presentation. I think we can have a hero section, our About
section, and the Arc. I think we already had a template for that." Asked where it lives and
in what form: "a page on our Thoughtform website (arcs/Thoughtform) for a UX meetup. It's a
new Arc, a new page on my Thoughtform website with all the animations."

His notes of 11 and 12 October set the talk: not a portfolio; digital content and digital
products become a commodity within two years; what is left for designers is interfaces for
and with an intelligence. The geopolitics and the jobs tangent are his own cuts.

## The decision

**A house arc at `/arcs/thoughtform/ux-meetup`, v3's page with the record swapped.** The
same shape as Suri's lunch and learn (ADR-147): v1's prototype, route sheet and `.tw-root`,
`data-tw-cut="v3"`, v3's `replaceHeroCopy` / `insertEquilibriumStation` / `replaceAboutBio`
by import, v3's proof and opener mount by import, v1's two hooks. "All the animations" is the
spine whole: hero → the equilibrium → About → the eras → the Arc → the Loop proof pile.

**The intro is `WORKSHOP_INTRO`'s, by reference, with two things the talk's own:**

- **The hero.** `UX_MEETUP_HERO` ("AI is not software." and one sentence), written over the
  prototype's by v3's seam, and pinned equal to the arc's own `hero` so the room's page and
  the overview's card say one thing.
- **One proof lede.** v3's last card ends "The rest of today is how", a promise a talk does
  not keep. `workshopV3Tracks(ledes)` and the default export take an optional `ledes`; not
  passed, the record's, so v3 and Suri's cut are unchanged. The talk passes the record's
  ledes with that one clause removed.

**The tail is twelve sections on existing kinds, no new kind.** The claim; the stages, the
curve and the spectrum as the SHARED RECORDS at the lecture's positions (their eyebrows
letter 02 · 03 · 04, so each is the shared object and the registry's reader pins gain this
page); the electricity beat; Tom on the Moon's path, bench and wall by reference; In The
Pocket's nine sectors; the turn; four cards on what is left to design; the close.

**The nine-sector wall is a shared record now.** It was the lecture's own picture
(ADR-141); a second page showing it makes it `shared/in-the-pocket.ts` (`ITP_WALL_MEDIA`,
`ITP_WALL_CAPTION`), read by both by reference and pinned `toBe` in `ux-meetup.test.ts`. The
file keeps the path it shipped at.

**The page loads `course.css`**, as the lecture does: the `path` kind is styled there and
nowhere else.

## What is not built

- **No standalone file.** The owner asked for the page; the standing rule that a talk is
  also a file in its folder was put to him and he chose the page.
- **No station is dropped.** A talk that wanted hero, About and the Arc alone would fork the
  prototype, the sheet and the root class together (ADR-139). First cut keeps the spine.
- **The closing beat does not point at the handshake.** That file went live the same day
  (ADR-157); whether the talk ends on it is the owner's call and is not built.

## Verification

- `tests/lib/ux-meetup.test.ts`: the share with v3, one hero inside the house measure, the
  one lede, no worked switch, the order, the evidence by reference and on disk, the copy law
  on the page's own words.
- Headless walk at 1280×720: twelve sections mounted, no console error, every beat one
  screen but the bench (the kind's own known overflow at that frame).

## U1 · The tail follows the owner's storyline (2026-10-15, the morning of the talk)

The owner's brain dump of 15 October set the order the talk is told in, and the first cut's tail
did not carry most of it: the marginal cost going to zero and why it goes this fast, the open-source
clone that is not the threat, "nobody opens the other software", the two ways out, and headless or
told. The tail is rewritten in his order, still sixteen sections at most and no new kind:

- **The reality**: the claim (`the-claim`), why so fast (`why-so-fast`, four cards: trained on all of
  it, a product in a few weeks, open models follow, a utility), the clone (`rebuilt`) and the threat
  (`the-threat`), three beats with no picture.
- **An intelligence**: the electricity line (`not-software`, the consciousness caveat in its
  subline), then the curve and the spectrum as the SHARED DRAWINGS UNDER THIS TALK'S HEADS
  ("No ceiling yet", "An intelligence"), the way v3 and Suri's cut turn them. The page is no longer a
  word-for-word reader of either, and `arcs-registry` no longer names it.
- **Trusting it**: Tom on the Moon's path, bench and wall and In The Pocket's nine sectors, by
  reference, unchanged but renumbered.
- **Two ways out** (`two-ways`): toward the authentic, toward the intelligence.
- **What is left to design**: the turn, the four cards (the physical card moved into the two ways
  out; "Interfaces nobody has drawn yet" takes its place), and **headless or told**
  (`headless-or-told`, `list-groups` in columns, Told first because the first group is the lit one).
- The stages (prompt, tool, agent) LEFT: workshop material, in a twenty-five minute slot.
- Five chapters in the header: the reality, not software, Tom on the Moon, two ways out, the turn.

The spoken script, beat by beat with timings, is `docs/talks/2026-10-15-ux-meetup.md`. Nothing on
the page waits on an asset: the clone, a game built with AI and an artifact are shown live in the
browser, which the script cues.

**Verified** (headless, 1280×720 and 1920×1247, dark and light): sixteen sections, no console
error, every beat one screen but the bench (its known 25px). `ux-meetup.test.ts` pins the
storyline's order, the five chapters, every eyebrow's number against its position, and the shared
curve and spectrum data by reference. `npm run lint` fails on `main` at 338 of 337 before and after
this change (none of it in these files); typecheck passes; the suite's three failures
(`skill-file-fidelity`, `thoughtform-armada`, `trinny-mark`) read sibling repositories or exact
bytes on disk and fail the same without it.

## U2 · The talk between the eras and the corridor (2026-10-15, owner, hours before the room)

The owner read U1 and ruled it "a glorified PowerPoint": the four-card grids ("I never want to
see this type of shit again unless I explicitly ask for it"), interstitials in capitals with
small text under them and two sizes between them, a clone named and not shown, and evidence
(Tom on the Moon, In The Pocket) the talk does not need. His rulings, as built:

- **The order.** Hero ("AI is not software.", kept) → About → the eras → THE TALK → the
  corridor's thesis ("AI sits somewhere between tool and collaborator") → the Arc → the proof
  → contact. The equilibrium opener is gone: "I want the second section to just be the About".
  The thesis and the Arc close the talk: "I want to leave that for the end."
- **How the order is built.** `ux-meetup/order.ts` moves `#workshop` to sit directly before the
  corridor mount at parse time and THROWS on any miss; the kill edge (`data-corridor-kill`)
  moves with it to `#contact`, and the hero's corridor link points at the talk. The shared
  flow hook takes `seam: false` (`useWorkshopFlow`, absent or `true` byte-identical for v1, v2,
  v3, the lecture and Suri): the About's flow runs and the eras never open the corridor
  (no square, no mark travel, no morph). ⚠ The `data-tw-flow` stamp STAYS ON: the first cut
  left it off too, and the About then handed over to an eras station still below the screen, so
  its title and portrait vanished (owner, the same day); the stamp carries the eras' overlap and
  the About's fade. Of what the stamp switches, only the weld would hurt the talk (it pulls the
  corridor a screen up over the talk's last beat), and `ux-meetup.css` cancels it; the held
  corridor cell is then uncovered as the talk's last screen lifts off it. ⚠ The eras still play their outro (from ~0.8 of their clock the figure
  leaves for a seam that no longer comes), which left a screen of empty frame: the talk rises
  over it as a CURTAIN (`ux-meetup.css`, `margin-top: -75svh` on the page's ground, scoped by
  `data-tw-order="talk-first"`, a stamp only this page carries). Measured: through the corridor
  the journey marks follow its phase bus exactly as on v3. This is a second exception to
  ADR-139's fork-together rule, after v3's equilibrium.
- **The statement** (`interstitial` variant `statement`, every arc may use it): ONE line in
  sentence case, ONE size for all of them, set above centre, under a registration row kin to the
  section heads' survey cross and Marathon's title bands (gold cross · rule · eyebrow · rule ·
  quiet cross), and NO subline. It types rather than scrambles (the scramble pool is capitals).
  The older variants are untouched.
- **A section is a head and its picture.** The head as ever (title left, paragraph right), the
  visual under it at the band's width. PhotoCraft (the ArtCraft project's open-source Photoshop,
  Apache-2.0, its README's own demo screenshot in `public/arcs/ux-meetup/`) is held to one screen
  by `#rebuilt`'s frame rule, as `#loop-ad`'s is.
- **The `stack` kind, the THIRTIETH enumerated exception**: the head, then `StackFigure` (the
  proposal system's isometric stack) and nothing else; no console, no uses grid. On this page it
  draws "headless or told": interfaces built on the fly on the deck, the brand encoded on the lit
  layer (shader libraries, a design system shipped as source, motion and type rules, checks), the
  intelligence, the models.
- **The tail is seven beats**, statement and picture in turn (ADR-155's law): the claim ·
  PhotoCraft · the threat · the curve under the electricity line · the two ends · the stack ·
  "The most interesting time to be a designer." Out: Tom on the Moon, In The Pocket, the
  spectrum (the thesis says it), the close (the contact station is the exit), every card grid.

`ux-meetup.test.ts` pins the order, the move on the real prototype, and the rulings as
structure (no `cards` or `list-groups`, statements without sublines on every other beat, each
eyebrow its position). Walked headless at 1280×720: the seven beats one screen each, the eras
handing to the claim, the thesis and the Arc after the designer, no console error.

## U3 · The story told in drawings (2026-10-15, owner)

The owner read U2 and set the rest of the talk: no slide-over ("no movement or travel, just a
glitch effect"), the brand mark as an ambient particle field, the proof drawn in the house's
diagram language with the anatomy skill's method, a voice, the turn to an intelligence (after
Benedict Evans's hx Live NYC 2026 keynote), and a crossroads to close on. Not for the night of the
talk, so built at full quality.

**The order.** Hero → About → the eras → the wake-up call ("Within two years, all digital content
and products will be absorbed.") → the proof as one ACT of three drawings (digital content;
digital products added; both absorbed by the frontier labs) → the voice ("I don't want to use your
agent. I want my agent to use your tool.", unattributed by the owner's choice) → an intelligence
(logic to statistics) → the crossroads → the corridor's thesis and the Arc → the proof pile →
contact. The alternation law (ADR-155) counts the act as one unit.

**Nothing travels in.**
- The talk runs the terminal grammar (ADR-057) on its own frames: one READER (`useTalkFrame`, a
  passive listener and one rAF) feeds `useArcTerminalMotion`'s `onFrame` and a route-scoped bus;
  `LandingPage` keeps the scroll writer. `useArcTerminalMotion` takes an opt-in `observeDocument`
  (the talk sits under live content that changes height); absent, byte-identical.
- On this page a beat WITHHOLDS its plane until it parks, so it appears where it stands and its
  title decodes in place; statements take an opt-in `glitch` (the in-place scramble).
- The talk is WELDED to the end of the eras' exit: 260 − 0.96 × 160 = 106.4svh up into their
  runway, numbers the test reads from `voidwalker.css` and the hologram clock. The beats are welded
  to the blank point of the previous fold (−(100svh + 0.38 × tail), the fold's own constants) with
  a 120svh hold, so each hands to the next with no empty screen. The U2 curtain is gone.

**The ground.** One sticky void screen under the talk with the brand mark sampled into particles at
a whisper (`TalkMarkField`, its own 2D canvas: the services field's canvas is hidden on desktop by
its own sheet). It switches on as the talk parks, so it never covers the eras. The talk's sections
drop their own void and read on it: recorded here as this page's exception to ADR-008.

**The `figure` kind, the thirty-first exception.** One kind for the talk's drawings, a registry
(`components/arcs/figures/`), all on the framing's ONE projection (`framing/iso.ts`), words as DOM
spans on leaders, one gold object each, a model module per drawing with its true numbers (the
anatomy skill's method; its filled-solid style is not taken, it fights the house wireframe):
- **The timeline.** Two lanes, digital content in front and digital products behind, January 2023
  to December 2026. A milestone's height is the capability curve that month (METR: task length
  doubles every seven months); the gold rail behind both is training compute on the same scale
  (Epoch AI: 4 to 5 times a year). The two climbing together IS the bitter lesson (Sutton, 2019).
  Every event dated and sourced in the record; the first beat draws the products lane as a ghost.
  `labelCollisions` found two real overlaps while seating the tags and the lane names.
- **The absorption machine.** 44 parts and wires: two panels feed ribbons of eight wires into the
  frontier labs' housing, compute racks beside it, the model the gold block, the interface held
  over it, agents wired to it.
- **Logic to statistics.** A stair of instructions on one wire beside a seeded cloud of
  observations and the gold line fitted through it.
- **The crossroads.** An anonymous head, built from solids (a signed-distance composite,
  raymarched, drawn as scanlines lifted by the relief), split at the nose line: particles for the
  human way, gold lines for the intelligence. The figure's head is optional; this beat stands
  under the registration row, centred. It is the talk's exit, not a chapter (`arc-marks`).

**The act.** One particle artifact carries the proof across its three beats (after the X-Bionic
swarm, never its design): dots on the content blocks; re-seated on the second timeline as the
products lane's dots fill in out of its ghosts; across to their panel's tiles; streaming into the
housing and turning gold in the model. A pure function of the scroll (`actClock.ts`), anchors read
from the drawings' parts at their parked seat, terminal tier only. `ux-meetup-act.test.ts` pins the
pool, no jump at any seam, nothing outside the act.

**The quote** takes an opt-in `frame: "marks"` (the registration row over a voice).

**Out of the tail:** the U2 statements, the PhotoCraft screenshot beat (PhotoCraft is now a dated
milestone on the products lane), the curve, the stack, the designer line.

**Verified.** The talk's suite (`ux-meetup.test.ts`, `ux-meetup-act.test.ts`), the registry, the
marks, the lattice ratchet (`figures.css` pinned at zero), the context budget; walked headless at
1280×720 beat by beat and through the act; no console error.

**Left open:** the Loop films' month (dated late 2025 on the timeline; not on the record); a headed
walk at 1920×1247 and in light on the owner's screen; the crossroads head's likeness is the owner's
read.

## U4 · No pane, one beat up, the stack and the new interface (2026-10-15, owner)

**No pane slides over anything** (owner: "a black frame from the section after the era slides
over the previous section ... I don't want any section or any black pane sliding over anything").
The talk's station (void plus image) and its arc root (void) were opaque and welded up into the
eras' runway, so they rose over the eras as one black frame. Both are transparent; the only
ground is the talk's own, on only while a beat is up. The tail's reader decides which beat is up
(the one whose slot, its park to the next beat's park, holds the scroll) and only that beat shows
its plane: the decode hook still types the words but no longer hides drawings, which made whole
beats vanish on the way back up. After the last beat the ground switches off in place and the
corridor's thesis, held beneath, is there. The brand mark field is brighter. Wheel-walked down
and back up, 134 steps: the beat up always matches the geometry, its plane always visible.

**The timeline back to the drawing board: the capability stack.** One beat, no head: one framed
card up at a time (an image, a film, the tools, mathematics), each rotating back on its x-axis
into a stack of plates above as the next appears where it stands, its title decoding in place.
Real assets: the Midjourney key visual, Loop's AI film, PhotoCraft, and a drawn proof (no
invented mathematics). `cardPose` is pure; the test pins one card facing at every scroll and a
stack that only grows. The particle act of U3 left with the timelines it was anchored to.

**The new interface** replaces the machine. No head, no paragraph: a piece of work at the top
and, downstream, two ways. Before: the capability stack zoomed out as the flow it was, ten
hand-offs in a snake with two rework loops and thumbnails from the cards. Now: the frontier model
as a brain of circuits (a procedural outline, 64 traces routed at 0, 45 and 90 degrees, pads,
three buses), fed context, problems and evals, with one gold answer. The particles are the work:
they crawl the left, stopping at every tile, and run the right straight through; the test pins
that the new way is done while the old way still crawls.

The figure kind's registry is now capability, interface, logic and crossroads.

## U5 · The examples stand as sheets and lie down as the foundations (2026-10-15, owner)

**The cards were a 2D image rotated over another** (owner: "those golden corners are ugly ...
there is no notched corner so you ignored our guidelines"; "you're just rotating a 2D image on
top of each other"). The frames are now the X-Bionic frame: the house chamfer, cut at the top
right and the bottom left, a hairline edge, the cross at three corners, a dashed ghost behind.
The title is one line in the body face, decoding in place; the source lines are gone.

**One act over both beats.** `FoundationAct` is one fixed layer, live while either
`#capability` or `#the-interface` is the beat up. Its geometry is one pure module,
`components/arcs/figures/foundation/scene.ts`: a true 30-degree isometric (no second projection
on the page), every sheet an exact plane affine. In the first beat one example faces the reader;
when the next arrives the last turns away on its x-axis into a stack of standing sheets that
recede on the diagonal, as Unsiloed stands its sheets (owner: "stack and rotate along the
x-axis ... a bit more diagonal ... it really feels like they're stacked on the sides"). Six
examples: an image (2023), a film (Loop), a tool (Vesper, built at Loop), a whole product
(PhotoCraft), worlds made from game assets (a placeholder until the owner's video), mathematics
(a drawn proof).

**The new interface is no longer a diagram** (owner: "glorified PowerPoint"). In the second beat
the standing sheets tip over their bottom edge, one after another, and lie as plates: the
foundations, each still carrying its picture. Above them a mind assembles out of dots, an
ellipsoid in two hemispheres whose folds are circuit traces walked on its own grid, kept off the
crown where they read as a target. Gold cables leave it, go round the outside of the stack and
plug into each plate's edge, a socket at every end (owner: "tendrils or commands coordinating
these different things on the stacks and plugging into the stacks"). The beat's line sits on a
leader beside the mind: give it context, hard problems and evals, and it works every layer below.

The canvas reads its colours from the theme, again when the theme changes: in light the mind
and its cables are the deep gold ink, never pale gold on parchment. Under reduced motion, on
phones and without script each beat shows its static fallback. The test pins one example facing
at every scroll of the first beat, every sheet lying in the second, a mind of dots with traces,
and a cable to every plate. Wheel-walked down and back up, 134 steps, 0 mismatches.

## U6 · One stack pose, a machine for a mind, and the mind in the middle (2026-10-15, owner)

**Depth the way Unsiloed draws it** (owner: "a front image that is just flat, like our images ...
they add some depth to it by just drawing lines and adding a background"). A card is a slab: the
picture inset in a panel, the panel's back face offset up and to the right, its corners joined to
the front, two dashed sheets further behind while it faces the reader. Lying in the stack the
same slab shows its thickness under the plate.

**The stack takes the interface's pose from the start** (owner: "the way they should be stacked on
the left is the way they eventually get stacked in the new interface section"). A card's turn
ends lying down in the stack on the left, each plate a rise above the last and a step along x, so
the stack climbs on the diagonal. Each plate sits on a tray, a little grid a margin past its
edges, over a floor grid; a y-axis carries a tick per plate with its number and kind, and the
x-axis along the floor is lettered MODEL CAPABILITIES with its arrow (owner: "the x-axis is
clearly labeled"). At the end of the first beat the stack moves to the centre plate by plate,
the bottom first, a cascade; it is only moved, never turned again, which the test pins.

**The model is a machine, not dough** (owner: "it just looks like some dough or bread ... make it
with the anatomy skill: not a brain, but something that looks like a machine brain with
circuits"). The anatomy skill is not installed on this seat; its method is applied as the
proposal swarm applied it, with the house particles as the texture. `foundation/mind.ts` builds
the mechanism from named parts (46 of them, the test asks for 40): two low-poly cortex shells,
ten dies with their pins on the upper facets, eight traces routed between them along the shells'
grid, a seven-wire callosum bus arched over the groove, a seven-fin heatsink for a cerebellum, a
stem of four collars, and a port plate with six sockets. Seams are lines, corners are nodes, the
faces are filled with particles; dies, traces and bus are gold. It stands on a camera whose
isometric pose IS the scene's projection (pinned), so it shares the plates' space.

**The tendrils are there when the beat lands** (owner: "they should immediately appear when you
land in the section and they should not all be the same size"). The mind assembles in under a
second from landing, by the clock rather than the scroll, and six cords grow from the port's
sockets, out wide round the stack's right side and into each plate's right edge, ending in a plug.
No two alike: gold, green, bone and red, from 1.1 to 3.4 px, the heavy ones with a halo, commands
running down them. The label THE MODEL stands over the mind in the beat's largest mono; the line
under it is gone from the drawing and kept for the fallback. The beat no longer needs a long
runway (U4's 320svh was for the crawl), so it runs on the talk's default tail.

**The logic figure is gone; the mind comes back in the middle** (owner: "a new kind of
automation. We don't need that but I actually want that brain to then be present ... it is at the
center ... the machine brain sits between a tool and a collaborator"). Section 05 keeps its id and
its eyebrow and loses its head. After the voice the act returns with the mind alone: it turns
from the isometric to face the reader, larger and centred, and its two hemispheres take their two
natures: the left a crisp gold machine routed square, as a board routes, to a framed TOOL, the
commands one way; the right loose green particles streaming to a framed COLLABORATOR, both ways.
The owner's line stands over it: AI is an intelligence that sits in the middle. The heatsink,
seen from the front, would read as a box over the face; it fades as the mind turns.

Benedict Evans's logic-to-statistics figure and its source left the page with the section; the
script keeps the point in the speaker's words. Every new colour has its light value (the deep gold
ink, a darker green and red on parchment), checked in both themes. Wheel-walked down and back up,
118 steps, 0 mismatches.

## U7 · The capability axis grows, and the model is a brain (2026-10-15, owner)

**The y-axis is the capability** (owner: "I don't think we need the labels ... It's actually the
y-axis that needs to grow because that represents the model's capabilities"). The kind names left
the ticks; the floor's front edge is a plain axis. The y-axis is gold, lettered MODEL CAPABILITIES
down its length, and grows with the stack: its tip eases to a margin over the highest plate in it
(`capabilityTop`), its arrow riding up, its name fading in once the axis can hold it.

**The model, modelled** (owner: "the brain looks like two zeppelins ... capture what a brain looks
like. You can model it, make it more low-poly, and then make the outside look like computer
circuits"; the references: a geodesic hologram sphere with ringed nodes, ticks and an orbit, and
a low-poly sphere rooted to a grid). `mind.ts` now models ONE solid, a signed-distance composite
with the brain's true outline: a cerebrum fuller at the back, the longitudinal fissure cut along
its crown, two temporal lobes, the cerebellum. A level-3 geodesic sphere (642 corners) is cast
onto it from inside, so the low poly follows the outline. The outside is a board: 22 runs routed
along the facets, straight with one turn, a via at each end; seven cores ringed three deep, as the
reference's nodes; red ticks off the skin. As the homepage's hologram is: particles sampled along
the seams first and then in the faces, and two orbits round it, near level, the far half under
the mind and the near half over it, a node drifting on each.

**It never turns** (owner: "I don't want it to rotate. It needs to be an elegant artifact"). One
pose per beat: over the stack it is seen from its left and front at the isometric's pitch; in
the middle beat from the same side, near level, larger. It appears there and assembles; the turn
between the two poses is never drawn, the voice stands between them. In the middle beat the left
of the screen, the back of the brain, is the tool's: crisp and gold; the right, its front, is the
collaborator's: loose green particles. The label THE MODEL stands clear above the orbits.

**The mathematics card is mathematics** (owner: "It looks like a flowchart. Where are the math
formulas?"). The Navier–Stokes equations as they are written, with the flow they govern drawn
beside them: streamlines past a cylinder from the exact stream function, one in gold. Under them
an Erdős equation, and the Olympiad and FrontierMath named. The worlds card is the slot for the
owner's Halo mods video, lettered so, a low-poly terrain until the file arrives.

Wheel-walked down and back up, 118 steps, 0 mismatches; both themes checked.

## Left open

- The worlds card waits on the owner's video of the Halo mods: a file under `public/` and a
  `media` entry on the card is the whole change.
- The corridor's thesis after the talk still reads "AI sits somewhere between tool and
  collaborator", now an echo of section 05; the owner decides whether it stays.
- The owner named "a bit of a regression" in passing without saying where; not yet found.

- Every line in the tail is his to rewrite; U2's statements are his own lines from the brain dump.
- `sentinel/DIGEST.md`'s list of the era stage's readers did not name Suri's lunch and
  learn before this change and still does not; this change adds only its own page.
