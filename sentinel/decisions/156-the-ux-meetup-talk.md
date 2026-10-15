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

## Left open

- Every line in the tail is his to rewrite; U2's statements are his own lines from the brain dump.
- `sentinel/DIGEST.md`'s list of the era stage's readers did not name Suri's lunch and
  learn before this change and still does not; this change adds only its own page.
