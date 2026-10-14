# Proposal swarm, round 01 (2026-10-14)

The travelling copy of the X-Bionic proposal, with the stack drawn as S4·E (the swarm picked in the stack-forms lab) and the travel between its three sections played by the dots themselves. Internal only: `/test/*` is a 404 in production.

```
http://localhost:3021/test/proposal-swarm
```

(The port is this lab's worktree's, `C:\wtd` on branch `lab/proposal-swarm`; read it off the running server.)

- `?fly=fall|march|drift|rigid|scan` is how the dots fly into the steps (fall); into the network the stack turns, whichever (round 06).
- `?n=3|4` holds the grain, sites a unit (absent: the one that fits).
- `?mark=lit|cut` sets the Thoughtform mark on the layer in white dots, or leaves it out of a lit disc (lit; round 07).
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
- `components/xb-proposal/network/NetworkOrg.tsx`: eight `export` keywords, and a class name on the plates' group and on the courses' group. Round 08: an optional `lettered` prop (when Marketing's frame comes on, and the stretch its name is typed over) and the `.xno-caret` rule in `network-org.css`; absent, the section is as it was (the travelling copy's 72 stills at two sizes and both themes are identical).
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

---

# Round 03 (2026-10-14)

> there's a weird "dead space" where the three stacks move from the second section like rigidly instead of through the elegant particle flow; shouldn't happen

Two causes, both fixed on the first hop:

- **The stack was pinned to the screen while its section left.** The canvas holds still on the screen; the opening does not. So for the first stretch of the hop the whole stack stood still while the chips and cards scrolled away around it, which reads as the stack sliding against its own section. Now the opening has a canvas of its own inside its own screen (the seat, `.psw-seat`). It holds the stack while it rests there and every dot that has not left yet, so those go where their section goes, natively, with nothing between the scroll and the pixel. A dot moves to the canvas that holds still the moment it leaves, from where its seat has got to. Both canvases are painted from one frame, with the same silhouettes, so a dot leaving is hidden behind a plate still standing.
- **Nothing was seen to leave for the first part of the hop.** Every dot was eased in, covering a hundredth of its way in the first sixth of its time, and the bottom plate's first row only left at 5 % of the hop. Now a dot is off at once and settles as it lands, and the bottom plate's first row leaves the moment the hop begins. A twentieth of a screen into the hop, the first rows are already well on their way (test).

And one more on the first hop: **it marches plumb first.** A dot drops out of the stack, as S4·E's own drops do, then files level along its row into its seat. Level first, the files crossed the tool cards, which stand beside the stack at its own height.

On the second hop the same timing applies (off at once, settling as it lands), and its clock is spread so that every plate has left the stack while the network's runway is still rising. Its lower plates still hold on the screen for the first fifth of that rise while the steps scroll away. The seat treatment was not given to the second hop.

## Checked

- The live Play run, at 1976×966: opening, hop, steps, hop, network, in that order, 59 frames a second, no page error.
- The 18 stills of `round-03/` (nine stops, at 1976×966 and 1920×1247) are byte-identical shot twice.
- 26 guard tests. The hop's start is now held to within a few px of the rest, since a dot is off at once; its end is still to the pixel.
- Nothing outside the lab changed in this round.

---

# Round 04 (2026-10-14): scan, set aside

> when the particles move from the second section to the third section, I don't really like the pancake shape of the things … Isn't there something closer to our aesthetic of terminal interfaces?

`?fly=scan`: a plate sent a row at a time, each row a rigid line of dots stepping on the lattice, the rows one after another at an even pitch; plumb to the line it lands on, then level into place. Into the network, the bars written row by row. Stills: `round-04/`.

The owner's read the same hour: "I don't like how our artifacts are being flattened." In flight the rows stood apart and the plates read as tall flat diamonds and sheared zig-zags. It stays on the switch, last.

# Round 05 (2026-10-14): fall, the default

> What I liked in one of the previous versions is that the nodes on the gray panel just dropped down and then the rest followed. It should be more of a vertical motion. I don't want it to look flat and 2D or to rotate, morph, or warp too much. Really look at some elegant particle animations

`?fly=fall`, now the default:

- **A plate falls whole.** 85 % of its dots (its body) share one moment and one way, so on its way it is the exact lattice it is at rest: depth, shape and texture kept, nothing stretched (test: the body's rows stand on the same way to the pixel).
- **Mostly downward.** Down on a sine, and across only in the middle of the fall, so it leaves straight down and settles straight down.
- **The nodes first.** What stands on the agents' board (the chip and the four modules) drops first, one after another, each whole; the board follows. The plates go bottom first, as before: agents, layer, team.
- **The rest follow as particles.** The other 15 % straggle, up to an eighth of the hop behind the body, each trailing two smaller dots behind it on its way, as S4·E's own drops trail. Only stragglers and nodes trail.
- **Still 3D.** What hides the dots behind a plate falls with the plate, so a falling plate still covers what is behind it.

Into the network the same fall, team first; there each plate's dots take their cells in the bars, so that hop is still a plate becoming a bar, as the section's own drawing turns the stack frontal.

`march`, `drift`, `rigid` and `scan` stay on the switch.

## Checked

- 34 guard tests, among them: the nodes are the only dots moving at the start of the hop; a plate's body falls as one lattice; every hop starts within a few px of the rest and ends on the seat to the pixel, in all five modes.
- The live Play run at 1976×966: every state in order, 59 frames a second, no page error.
- The 22 stills of `round-05/` (eleven stops at 1976×966 and 1920×1247) are byte-identical shot twice.
- Nothing outside the lab changed in rounds 04 and 05.

# Round 06 (2026-10-14): the stack turns into the network, and the rain comes on as it lands

> I think the data raindrops can appear a bit sooner because now they just appear out of nowhere. When you scroll into the Marketing First and Every Team section, I don't think we need that particle transition because we get a frontal view, so they stack. I think the three stacks should stack and then rotate a bit on the x-axis and a bit on the z-axis so they come toward you. That creates an elegant transition to their final position.

## The second hop is a turn

`engine/turn.ts`. The closed stack the steps leave turns as one object through a true orthographic camera: yaw from the lattice's 45 degrees to none, pitch from the lattice's own (its sine is b over a) to a few degrees. Meanwhile it crosses from the steps' column to the bars' place, and its plates part to the courses' pitch. That is the network section's own turn (`NetworkOrg`, `camIso`), played by the dots.

- **Every dot keeps its place on its plate in three dimensions.** On screen x is i − j and y is i + j − k, so a dot is read back as standing on its box's top; one that reads as past the box's front edge hangs on the wall below it. Each solid on the agents' board is its own box. So the turn's first frame is the stack as it stood, to the pixel.
- **It is under way at once and settles face on** (`flow`, the lab's own ease). Eased in, it would stand still while its section scrolled away: round three's dead space.
- **What hides what turns with it.** Each plate and each solid hides what is behind it by its own silhouette through the same camera (the hull of its eight corners), and the layer's light is drawn in the plane of its top face.
- **It ends face on, each plate over its bar,** a site to a column of the bar, pitched just far enough that the layer's top and front span the bar's rows.
- **As a plate goes edge-on it thins to the bar's grid.** Nearly edge-on, a plate's rows from back to front close up into strokes. A bar shows one dot per cell and keeps the rest unseen under it, so those others fade as the plate goes edge-on (`TURN.thin`). Face on, the plate is the bar's own grid, and the dots take their cells over the last of the hop. The others come back unseen, on their cell's pixel, once the bars hold them.

The turn is the second hop whatever `?fly` says. The switch now governs the first hop only. The particle second hop (`fall2`, the four modes' `hop2`, `HOP2`, the second scan) is gone; it is in the history at `17cd2e52`.

## The rain comes on as the plates land

What falls between the plates fell only once the whole stack stood in the steps. So the hop's last frame had none, and the next had a gap full of drops already halfway down. Now:

- **A gap's rain comes on as soon as both its plates have landed,** still inside the hop: in the fall, the layer's gap from 0.69 of it, the team's from 0.86 (`rainOf`).
- **It starts from the top.** Every drop is put back one whole way, so the gap fills as rain does, a drop at a time out from under the upper plate, and is the rain it is at rest one way later (`restart` in `paint.ts`). A gap already raining when the page opens, and every gap of a still, is the rain at rest.

## Checked

- 40 guard tests. New ones: mid-turn every dot stands inside its own plate's turned silhouette; the stack has moved more than 20 px a twentieth of a screen into the hop; each plate is a diamond as it leaves the steps and a level bar over its own bar as the network pins; it thins to one dot per cell; the turn is the same in all five modes; the rain is off at `hop1-40`, on in the layer's gap only at `hop1-80`, on in both just before the steps pin.
- The live rain shot over three seconds from the end of the hop: the gaps fill from under the plates.
- The 16 stills of `round-06/` (eight stops at 1976×966 and 1920×1247) are byte-identical shot twice.
- `tsc` clean, ESLint with no warning on the lab. Nothing outside the lab changed.

## Known, and not fixed in round 06

- **The title still rises through the stack** on the way in, now a turning object rather than a cloud.
- **The runners and the rain stop when the hop begins.** By then the stack is closed and the gaps are shut, so the rain has already stopped; the agents' runners go out with the first frame of the turn.
- **Judged from stills and a 16-frame sequence,** not on the owner's screen.

# Round 07 (2026-10-14): the mark on the layer, the plates become their bars, the rain sooner and slower

> I think those raindrops (the data drops in the navigating code build) can happen a bit sooner. They are also a bit fast but not too fast. … Marketing first and every team: I love the stack but then I see them transform. I guess we need a transformation to show the text but right now it feels like it's transforming into another rectangular shape. I think we can make it a bit more elegant. Also a very important part of navigating codebuild: the middle layer is the Thoughtform layer but it now shows a circle. I want to have a super clean particle version of our Thoughtform logo. Maybe it can be created with negative space or white space.

## The Thoughtform mark on the layer

`engine/mark.ts`. S4·E's layer was concentric: a white-hot core and two lit rings. Its top face now carries the brandmark, from `lib/brandmark` (the one record of the mark's paths, flattened by `brandmarkPolylines`). Each site of the layer's lattice is tested against the mark across its own patch (5 by 5 points); a site a third covered is the mark's. Only a dot's look changes, never its place, so the layer is still S4·E's dots on S4·E's pixels.

- **Square to the screen in the stack's own view.** The mark lies on the plate and is foreshortened as anything lying there is, but its level bar runs left to right across the screen, so it reads upright in the steps. It turns with the plate on the way into the network.
- **`?mark=lit`, the default:** the mark in white dots (the layer's hot tone) on the gold field, with a ring of clear sites round every stroke (the white space).
- **`?mark=cut`:** the mark left out of a lit gold disc, as negative space. At this lattice (33 sites a side, the plate 320 px wide) it reads far less clearly than `lit`; it stays on the switch for a look.
- The layer's halo, S4·E's own, still lights the mark from under it.

## The plates become their bars

What read as a second rectangle was the end of the turn. Each face-on plate's 33 rows from back to front crushed into strokes, then reshuffled into a frame of cells.

- **A dot's cell is where it stands on its plate** (`placeCells`): the column of its nearest site, the row of its nearest unit, back on top. A cell nothing falls in borrows the nearest spare dot. It was by rank, which sent a clustered plate's dots across each other.
- **The plate gathers on itself while it turns.** In three dimensions, each dot slides to its cell's point on the plate's top: a few sites from back to front, less than one across, and up the plate's walls. So the plate resolves into the five lines its bar's rows stand on while it is still a turning slab (`TURN.gather`).
- **The turn ends at the pitch that sets those lines at the bar's own row pitch,** each plate's top over its bar. Face on, the plate is its bar, cell for cell, and the bars take the dots without a step (test: within a pixel before the settle has done anything).
- **The bar's look comes in column by column,** left to right, as a line is written; the stretch where the course's words are lettered empties as before.
- A plate's silhouette flattens to its top as its dots gather, so it no longer hides the plate below once they stand a bar apart.

## The rain, sooner and slower

- **It falls at 0.7 of S4·E's pace** (`RAIN_PACE`).
- **It shows within half a second of a gap's plates landing.** A gap starting to rain no longer puts every drop back a whole fall, which left some streams half a fall from showing. A stream's drops go back together, keeping their spacing, until its first is just under the upper plate, and the streams follow one another nearest the corner first, over 0.15 of a fall.

## Checked

- 42 guard tests. New: face on, before the settle, every dot is on its cell to the pixel; a solid on the board stays inside the board's turned silhouette as it gathers; the mark sets white dots on the layer only; the cut keeps every dot's place and sets no white dot.
- The live rain shot over three seconds: streams out from under both upper plates by 0.4 s.
- A 16-frame sequence of the turn: the stack turns, the plates gather into lines, land face on as their bars, and take the bars' look left to right.
- The 20 stills of `round-07/` (ten stops at 1976×966 and 1920×1247) are byte-identical shot twice; one more of the cut mark.
- `tsc` clean, ESLint with no warning on the lab. Nothing outside the lab changed; `scripts/capture-proposal-swarm.mjs` takes `--mark`.

## Known, and not fixed in round 07

- **The mark is the brandmark only,** without the wordmark. At 33 sites a side, its finest strokes (the ring's thin side, the outer arc) are a dot wide.
- The title still rises through the turning stack.

# Round 08 (2026-10-14): the line types the courses, then the frame

> when you have those horizontal scan lines in the "Marketing First" and "Every Team" sections, we can also reveal the text as it moves from left to right. Right now the text has some sort of opacity animation and I don't know what it does. I think we can just use a typewriter effect. When the full swipe is done and reveals the frame, the X-Bionic Marketing frame should be shown. Remove "Run by your team." We don't need that.

## One line writes the bars and types their words

`engine/courses.ts`. The section letters its three courses on the bars and fades them in once its turn is done; that fade was the "opacity animation". Here the lab sets the courses itself, on the canvas's screen, and the lab's sheet hides the section's.

- **One line crosses the three bars from left to right** (`TURN.sweep`, the last quarter of the second hop), at the scroll's own pace: past 0.7 the hop's clock runs level with the scroll. A dot takes its bar's look as the line passes it; it was column by column on an eased clock.
- **A character is typed as the line passes its middle.** A dot on a word's place gives way as the line passes it, where those dots faded out.
- **The head** is a block a character wide in the bar's own tone, only while the line is on the word.
- **The hop now ends as the line crosses the last column**, a little later on the pin than before (0.25 of it, was 0.19), so the line crosses in about 0.6 of a screen of scroll (590 px at 1976×966, 760 px at 1920×1247). A new stop, `typing`, is halfway across; `bars` is where the line has finished.

## Then Marketing's frame

The frame comes on the moment the line has written the bars (`LETTERED` in `clocks.ts`), in about 50 px of scroll, and its name, "X-Bionic · Marketing", is typed on its band just after, with the same head. They used to fade in together after a gap in which the courses faded in. It comes through `NetworkOrg`'s new `lettered` prop.

"Run by your team" is gone from the frame, at every size.

## As the view draws back

The section faded its courses out over the first fifth of the draw-back. Here each is erased from its end and the dots it held off come back behind the head. While it is erased a word is drawn at its bar's scale, so it and the dots round it shrink as one (test: a dot's place on its way to its node is its bar's scale about the bar's left edge). With the words at a fixed size, the bar's filled end ran into the last letters.

## Checked

- 48 guard tests, among them: the line starts once the stack faces the reader and ends the hop on the last column; mid-line, a dot has its bar's look exactly when the line has passed it, and a course is typed up to the line and no further; typing never takes a character back while the line writes; the head shows only on a word being typed; every course is whole when the frame comes on, and the frame waits for it; the erase runs from the end, gives the dots back behind the head and leaves nothing at `drawback`.
- The travelling copy: 72 stills (1920×1247 and 1976×966, dark and light) shot with the round's edits and with them stashed are identical.
- The 12 stills of `round-08/` (six stops at 1976×966 and 1920×1247) are byte-identical shot twice.
- Every stop visited on the live page at 1976×966: the states in order, the courses typed then erased, the name typed, no page error.
- `tsc` clean, ESLint with no warning on the lab or `NetworkOrg.tsx`.

## Decisions taken without asking, to be confirmed

- **The head.** "A typewriter effect" did not say whether it has a cursor. It is a block in the bar's tone while a word is typed or erased, and on the frame's name in gold. Take it out and the letters still come on at the line.
- **The erase.** The courses go as the view draws back by being erased from their ends, so no opacity is left on these words.
- **The frame itself** comes on in about 50 px of scroll rather than being drawn or swept; only its name is typed.

## Known, and not fixed in round 08

- Below 961 px, where no canvas mounts and the page is otherwise the travelling copy, the frame still comes on at the new moment, with its name typed.
- The title still rises through the turning stack.
- Judged from stills and stop-by-stop reads, not on the owner's screen.
