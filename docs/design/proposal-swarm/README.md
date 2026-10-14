# Proposal swarm, round 01 (2026-10-14)

The travelling copy of the X-Bionic proposal, with the stack drawn as S4·E (the swarm picked in the stack-forms lab) and the travel between its three sections played by the dots themselves. Internal only: `/test/*` is a 404 in production.

```
http://localhost:3021/test/proposal-swarm
```

(The port is this lab's worktree's, `C:\wtd` on branch `lab/proposal-swarm`; read it off the running server.)

- `?fly=march|drift|rigid` is how the dots fly between sections (march).
- `?n=3|4` holds the grain, sites a unit (absent: the one that fits).
- `?at=<stop>` opens on a named stop; `?still=1` stops the clock and hides the bar, for a shoot.
- The bar at the foot of the page has the same switches, and **Play**, which scrolls the whole act at one pace.

## Why

The owner, 2026-10-13, on S4·E: "I want you to create a copy of our latest X-Bionic iteration … where we really use this design language, because this is inspired by our particle system and our arcs. I really like the dots … I just want to see how the entire flow between the sections that travel looks. I think it can feel too static or rigid. This feels a bit more like particles, where one transitions to the other, like nanobots."

The latest iteration is `/test/proposal-travel`: three SVG drawings of the stack, handed over at two seams. On the way only the stack's place, size and gap change, on one ease; nothing inside it moves. Asked the same day how far the dots should go, he chose: the artifact and everything that connects. Chips, cards, tabs, housings and every word stay.

## What it does, in the order the scroll plays it

One swarm on one canvas. A dot is the same dot from the opening to the last team.

1. **"AI capability your teams own."** S4·E closed, where the hairline stack stood. Every connector is a file of standing dots on the same route, with one brighter dot walking it the way the work flows: the workstreams into the team's plate, the layer to its tab and past its three parts, the agents' plate out to the tools.
2. **The hop into the steps.** The files reel into the plate they touch. Then the stack leaves plate by plate, team first, and prints itself opened in the steps' seat, row by row. What hides the dots behind a plate follows the rows still standing.
3. **"Navigate, encode, build."** The stack on the section's own clock: it travels, then closes. The plate in turn is lit; the other two drop to 36 % of their tone. Drops fall between the plates while it is open. The section's six callout phrases stand beside the plate they speak of.
4. **The hop into the network.** The three plates re-seat as three level bars: left of a plate to the left of its bar, back of the plate to the top.
5. **The view draws back,** on the section's own clock: the bars shrink to Marketing's node.
6. **"Then every team."** In the section's own order, dots leave Marketing along each team's route on three wires. They stand as the lane, the team's first course in the people's green, and the outlines of the other two.

The three ways to fly are one engine with one switch. **March**: a level run, a 45-degree cut, a plumb run, so a row lands as a row. **Drift**: each dot starts when its own number says and goes by a waypoint of its own. **Rigid**: every dot together on one line, with the plates hiding each other as they go. Rigid is the control: the travelling copy's own move, in dots.

## How it is built

`app/(internal)/test/proposal-swarm/`. The page mounts the travelling copy's three components unchanged. The lab's sheet hides what they draw (the stack, the connectors, the ribbons, the two dotted fields) under a class only this page's wrappers carry, and lays one sticky canvas over all three sections.

- **The canvas is never moved by script.** It is sticky inside a track that starts a screen above the steps. It scrolls in with the opening, holds through both hops and both pins, and leaves with the network's last screen. So every figure has one place in the canvas's own space, and a frame reads nothing from the page but how far it has scrolled.
- **`engine/`** is plain arithmetic over typed arrays, built once a size: `lattice`, `pool`, `formations`, `flight`, `clocks`, `traces`, `palette`, `world`. Only `measure.ts` reads the page and only `paint.ts` touches the canvas.
- **S4·E is imported, not copied:** `buildScene` and the lattice from `stack-forms/swarm/dots.ts`; what falls, what runs and the layer's halo from `swarm/clear.ts`.
- **The page's geometry is read from the module that owns it:** `heroLayouts.ts` for the opening's routes, `EmbedStack`'s `read` for the steps, `NetworkOrg`'s `moment` and `orgLayout.ts` for the network.
- A plate hides what is behind it by cutting its silhouette out of the canvas (`destination-out`), where S4·E fills it with its ground's colour. The canvas lies over a page and has to stay clear.

**Edits outside the lab, none changing behaviour:**

- `components/xb-proposal/embed/EmbedStack.tsx` (shipped): seven `export` keywords (`GAP`, `INK_TOP`, `AIR`, `CALLOUTS`, `TRAVEL_END`, `read`, `ARRIVE_LIT`).
- `components/xb-proposal/network/NetworkOrg.tsx`: eight `export` keywords, and a class name on the plates' group and on the courses' group.
- `stack-forms/swarm/dots.ts`: `buildScene` takes an optional lattice (absent, the one it fitted before).
- `stack-forms/swarm/clear.ts`: five `export` keywords.

## The numbers, at 1920×1247

- **2 838 dots** in the three plates (655, 1 414, 769), on a 5:3 lattice at four sites a unit. The plate is 320 px wide; the travelling copy's SVG plate is 333.
- **500 riders.** Six teams take a first course of 165 cells each, which is more green than the team's plate holds. The extra dots sit on a dot of the team's plate, unseen, until they leave Marketing.
- **2 099 dots** take a seat away from Marketing, 245 of them as the lanes. One dot stays on every cell of Marketing's own three bars.
- **265 standing dots** in the opening's files.

## Checked

- **Nothing else moved.** Stills of the sent page (36), the travelling copy (36) and S4·E (6), shot before any edit and after the last, are identical.
- **Repeatable.** The 20 stops shot twice at 1920×1247 are byte-identical.
- **At rest it is S4·E.** `tests/lib/proposal-swarm.test.ts`: every still dot stands on `buildScene`'s own pixel in the opening; each hop starts and ends on the seats to the pixel, in all three modes; every dot lands on its bar whichever way it flew.
- **Straight.** Every march route, every lane and every file is level, plumb or at 45 degrees (tests).
- **Clocks.** They never run backwards and one never starts before the last has ended (tests).
- **Words stay clear.** No dot is shown on a course's words while they are lettered (tests), and none on the layer's three tags.
- **By eye:** every stop at 1920×1247; seven stops at 1470×830 and 1280×720; four in the light theme.
- **Played.** Play was run on the live page and captured frame by frame: opening, hop, steps, hop, network, in that order, 60 frames a second, no page error.
- `tsc`, ESLint with no warning on the lab, the guard tests.

Stills: `round-01/` (the 20 stops in march; three hop frames in drift and two in rigid). Re-shoot with `node scripts/capture-proposal-swarm.mjs --port 3021 [--fly …] [--n …] [--sizes …] [--themes dark,light] [--twice]`.

## Decisions taken without asking, to be confirmed

- **The grain.** At this page's size the stack is 320 px wide, against 576 px where S4·E was picked. Two lattices seat there: 5:3 at four sites a unit (2 838 dots, sizes 1 to 3 px) and 7:4 at three (1 607 dots, sizes 1 to 5 px). The first is the default: the layer keeps two rows a stratum and the team's rail its ticks. `?n=3` shows the other. At 1280×720 only three sites a unit seat (1 607 dots, 240 px).
- **The callouts** are words beside the plate, 13 px, without their leader lines.
- **A bar** is a frame of dots with a filled end; its middle is left clear for the course's words until the view draws back, then it fills.
- **A team** gets one green course and two quiet outlines, as the travelling copy draws them under "Navigate next".
- **A lane** is one file of standing dots where the ribbon was five wires. The dots walk it on three.
- **A plate out of turn** is at 36 % of its tone, where the SVG plate is at 30 %.
- **The dotted fields** behind the opening's figure and the network's are off on this page.

## Known, and not fixed

- **Motion was judged from a frame-by-frame capture and stills,** not on the owner's screen. The hops are the thing to watch live, in all three modes.
- **Smaller than S4·E was picked at.** The next lever is to let the stack land larger in the steps, where there is room on a tall screen: two lattices of one grain hold the same dots, so the engine allows it.
- **On the way into the network** the title rises through the place the stack still stands in, as it does on the travelling copy.
- **The opening's files stand from the start.** They do not draw on with the chips and cards on first arrival.
- **Light theme:** the dots take the page's four tokens and the plates still cut, so it holds; it was not tuned. What falls and what runs keep the dark mixes.
- **Below 961 px, and for a reader who asks for less motion,** the lab's sheet hides nothing and no canvas mounts: the page is the travelling copy.
- **1280×720:** the stack is 240 px and the four workstreams begin to merge.
- Nothing is ported to the travelling copy or to the sent page. That follows a pick.

---

# Round 02 (2026-10-14)

The owner's read of round 01 ("looks sick, push to main"), then four notes on the live page.

## The opening holds

> the artifact in the second section starts moving downwards a bit too soon … its 'equilibrium' position where everything nice aligned is happening when the hero section is still into view; shouldn't happen.

On the travelling copy the opening is one screen, and the stack leaves the moment that screen has arrived. So the figure was only ever whole while the hero was still above it. Here the opening now has a runway of its own: the screen stays put, every file tied to the stack, for 60 % of a screen of scroll, and the stack leaves after. The canvas's track starts with that hold, so nothing is moved by script while it lasts.

The page is 60 % of a screen longer than the travelling copy for it.

## The stack is built from the ground up

> it doesn't make sense that the first layer (the green one) moves down first; it should be bottom, middle and THEN the first layer.

On the way into the steps the agents' plate leaves first and lands first, then the layer, and the team last. The team's plate is the one lit when the hop ends, and it is the last thing to arrive.

## The steps fit the screen

> I feel we can move the layers and text on the left a bit up so everything is within the viewport of the third section

The section's own drawing lets a plate rise in from below the frame, so on a screen about 970 px tall the layer sat at the fold and the agents under it. Here the whole opened stack stands inside the stage:

- the gap between plates is what the stage has room for, never more than the section's own;
- the stack is centred in the stage and holds still while the first two steps are read, then closes about its middle plate on the section's own clock;
- the plates' column stops above the frame's foot, and the three steps, centred beside it, come up with it.

The head's brief rises through the place the team's plate now lands in, so on this page it waits for the last tenth of the arrival.

## No frame round the organisation

> we don't need the X Bionic Frame

The organisation's housing, its band and its name are hidden on this page. The seven teams stand on the page itself. A team's own frame is untouched.

## Also

- **A team's dots no longer cross its name.** They left the ribbon's end level, along the band, over the lettering. They now go plumb down the node's edge first, then level along their row.
- **A rest holds to the pixel.** The runways are set in `svh`, so where one section hands over to the next is seldom a whole pixel, and a page can only be scrolled to one. A clock within a pixel of scroll of either end is now at that end.
- A new stop, `arrive`: where the opening comes to rest. Play starts there.

## Checked

- The travelling copy's 36 stills are identical to round 01's baseline. The one edit outside the lab is a class name on the organisation's name in `NetworkOrg.tsx`.
- The 12 changed stops shot twice at 1920×1247 are byte-identical. Four were also shot at 1976×966, the size of the owner's window in his screenshots.
- Three guard tests added, 25 in all: the first hop sends the bottom plate first; the whole opened stack is inside the steps' stage and closes about a middle plate that does not move; a clock is at rest within a pixel of a rest.

Stills: `round-02/`.

## Known, and not fixed in round 02

- **The gap is tighter on a short screen.** At 1976×966 the opened plates stand about 180 px apart, a little less than a plate is tall, so each plate's front corner reaches the next one's back corner.
- **The hold is one number,** 60 % of a screen, in `proposal-swarm.css`. It was not tuned by eye on the owner's screen.
- Everything under "Known, and not fixed" in round 01 still stands, but for the organisation's frame.
