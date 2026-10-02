# ADR-139: The workshop's second cut

- **Status:** Proposed (2026-09-30, owner). Built, guarded and measured; flips
  to Accepted once the owner has read the page live and settled the two open
  items below.
- **Surface:** `/arcs/thoughtform-workshop-v2` — a static route folder
  `app/(marketing)/arcs/thoughtform-workshop-v2/` (`page.tsx`, `journey.ts`,
  `WorkshopPortals.tsx`, `WorkshopTail.tsx`);
  `lib/arcs/content/thoughtform-workshop-v2.ts`;
  `lib/arcs/content/shared/writingBench.ts` (hoisted);
  `ArcSectionBase.worked` and the four new kinds in `lib/arcs/types.ts`;
  `components/arcs/ArcGround.tsx`, `ArcPluginBoard.tsx`, `ArcSkillFile.tsx`,
  `ArcChat.tsx`, `ArcWorkedBar.tsx`, `ArcWorkedSwitch.tsx`, `workedChrome.ts`;
  the `.arc-ground*`, `.arc-pb*`, `.arc-sf*`, `.arc-chat*` and `.arc-worked*`
  blocks in `arcs.css`; `ArcSectionRenderer`'s run-gathering;
  `[slug]`'s `OWN_ROUTE_SLUGS`; `HERO_ROUTES`.
- **Does NOT supersede ADR-131.** v1 is the archetype the two client forks
  were cut from and it is untouched but for one hoist, which is textually
  identical to what it replaced.
- **Related:** [ADR-131](131-the-workshop-archetype.md) (the archetype and its
  own-evidence law), [ADR-136](136-the-class-one-deck-and-the-situation-re-cut.md)
  (the framing this cut carries forward), [ADR-137](137-the-workshop-opens-on-the-corridor.md)
  (the corridor opening, shared), [ADR-138](138-the-workshop-reads-about-the-eras-then-the-arc.md)
  (the About flow, shared), [ADR-128](128-the-pandora-proposal-and-two-kinds.md)
  (the bench), [ADR-052](052-arc-pages.md) (content-only, and its exceptions).

## The call

The owner, 2026-09-30, after running the evals workshops: a second cut of the
workshop page, keeping the Thoughtform package — the corridor, the About, the
proof — and replacing the hands-on half with the practical chapter he had
built separately, which shows the configuration actually built rather than a
ladder of things to try. Plus one new beat he named himself: why the work is
built inside a general model rather than bought as a point tool.

Asked, he chose: the hands-on nine **replaced**; the evidence **the
practice's own**, not a client's; the worked example **switched** across the
chapter; the new beat **after the curve**.

## The decision

**A second own route, not an edit of the first.** v1 is what `plopsa-workshop`
and `suri-workshop` were cut from and what a room already holds a link to. The
second cut takes its own slug, its own record and its own folder, and shares
everything the two pages genuinely have in common: the prototype, the route
stylesheet, the `.tw-root` class, the About flow, the portrait deck and the
proof. The day the corridor copy diverges, the prototype, the sheet and the
root class fork **together** — never one of the three, because all three reach
`.tw-root` globally.

### The spine

Twenty-two authored beats. The framing is v1's, renumbered because `ground`
is inserted at 04; the practical chapter is new.

|        |                                                                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 01–03  | the workshop · three ways · the curve _(v1)_                                                                                        |
| **04** | **the ground — NEW**                                                                                                                |
| 05–12  | hard to steer · a resource · the real question · the configuration · the two you write · the turn · the horizon · the market _(v1)_ |
| 13–17  | made real · a skill · the plugin · using it · when it is wrong — **switched, three examples each**                                  |
| 18     | the bench — **not switched**                                                                                                        |
| 19–22  | the mother and the father · get started · what is next · what follows                                                               |

**The four sections the owner believed were missing were never missing from
v1.** `leverage`, `person-or-agent`, `the-horizon` and `signal` sit exactly in
the gap he described — between the configuration and the plugins — and they
are missing from the ARTIFACT, which goes from the six questions straight to
where the answers live. They are carried across unchanged.

### The switch

`ArcSectionBase.worked`, and nothing in any kind.

A switched beat is authored once per example as sibling sections of the same
kind; `ArcSectionRenderer` gathers a contiguous run sharing a `group` and
draws one control over it. Every existing guard in `arcs-registry` walks each
panel as an ordinary section, which is the entire reason the field lives on
the base and not in six section records — the alternative was a `panels`
tuple on six kinds, five of which are already guarded and one of which
(`bench`) is guarded in nine places.

- **The resting state is the markup**, the `configuration` picker's own law:
  the first panel of each group renders and the rest are hidden by a rule
  keyed on nothing but the absence of a `data-arc-worked-default` attribute.
  With no script the page reads whole as ONE complete worked example, and the
  control is not on the page at all — a control that does nothing is worse
  than no control.
- **The pick is page-wide.** Every group carries the same ordered ids
  (registry-pinned), so one choice is valid for all of them and the room
  follows one piece of work from the plugin board to the last conversation
  without touching the control again.
- **It is a radio group, not a tablist.** Tabs control the panel beneath
  them; this changes five beats at once.
- **It rides the foot of the screen.** The first cut dropped it into the
  masthead's right column and it landed on the dek — and no single offset can
  clear a head, because these heads run from 84px to 169px depending on how
  long the section's own sentence is. Sticky to the bottom, centred, over the
  one band no section draws in.

### The four kinds — ADR-052's nineteenth to twenty-second exceptions

Each is one leaf, no state, no listener, no script.

1. **`ground`** — why the work is built here. The shelf on the left is dim and
   its plates do not touch: the absence of a wire IS the argument, so nothing
   on that side connects to anything. The ground on the right reads from the
   floor up, and its plinth — the intelligence — is the one course nobody in
   the room can write. ⚠ No vendor is named and no digit is lettered: the
   claim is about a shape of purchase, and a named competitor dates the page
   the week it ships.
2. **`plugin-board`** — where each of the six answers goes to live. ⚠ Every
   plate carries its `answers` line; without that tie this is a diagram of a
   folder, which no room has ever needed to see. Gold is what the team writes,
   and the guard pins that the lit pair is the FIRST two — a lit plate in
   third place would say the team writes its own connectors.
3. **`skill-file`** — the load-bearing one, and the one with a guard of its
   own (`tests/lib/skill-file-fidelity.test.ts`). A room that has never seen a Skill
   will hear "the team writes down how it works" and picture a product, a
   form, a portal — anything but a text file with a name at the top. Saying so
   does not land; showing the file does. ⚠ Every line is quoted from a Skill
   that exists on disk, shortened, never invented.
4. **`chat`** — what using it looks like, drawn rather than screenshotted: a
   screenshot is stale within a month, carries another product's type onto the
   page and cannot be read aloud. Two readings, `ask` and `feedback`. ⚠ The
   feedback reading shows the issue whole BEFORE the person says yes; a beat
   that showed only the outcome would teach the room that something is filed
   on their behalf without asking, which is the opposite of how it works.

### What was NOT built

**The artifact's evals pipeline.** The existing `bench` already carries the
same information — the checks rail, the input, the marked output, the
per-check results, the verdict, the re-run strip and the folder — and v1's is
fully authored. It is reused, and **it is the one beat of the chapter that
does not switch**: the writing Skill is the only one of the three whose evals
are written down today, and a page whose job is teaching a room what an eval
is cannot open by inventing two sets of them. So the chapter goes wide on five
beats and deep on one, and says so on the head.

**Hoisted for it:** `WRITING_BENCH` into `content/shared/`, on the precedent
`shared/frontierCurve.ts` set and for its reason — two pages now show one
piece of evidence about one Skill. v1's rendered output is unchanged; the
hoisted record is textually identical to the one removed from it.

### The three worked examples

House Skills only, all three on disk (ADR-131's law): the voice
(`thoughtform-tov`), the fleet's rubric (`armada`), the reference decoder
(`reference-decoder`). A fork swaps the examples and keeps the shape.

## What this costs

Five switched beats times three examples is fifteen panels of copy, and the
`image` and `reference` panels are **drafts for the owner to tick** — they are
quoted from real files, but nobody has read them back as workshop copy. That
is the switcher's real price and it was taken with open eyes.

## The measure

The practice's own published law: one idea per viewport, one picture per
section, each section fills one screen at 1280x720. After a fit pass scoped to
the four new kinds — never `.arc-head` at large, which eighteen beats on five
other pages read — the cut's worst beats sit at +30px, which is v1's own band
(v1 ships +30, +41 and +65 today, and the +41 is the bench, identical here).

## The fidelity guard, and why it exists

The beat's claim is that a room is looking at a file that exists, in its own
words. On the narrative sweep that claim turned out to have decayed in four
places: armada's lede was a paraphrase of the FRONT MATTER dressed as body
prose, its stop line had an invented clause ("and it never picks"), the
reference decoder's cause/effect pair had become a definition, and the voice
skill's description had been re-voiced into the first person — which broke it
twice over, because it stopped being a quote and left "my name" sitting beside
"he asks". Every one was true ABOUT the skill and none was IN it, which is the
failure a reader cannot see.

All four are restored to the files' own words, and
`skill-file-fidelity.test.ts` now reads the real `SKILL.md` and measures
four-word phrase overlap for every body line it draws. It is a floor, not a
proof: it catches a whole invented sentence (the mutation scores 0 of 11) and
it does NOT catch a short clause bolted onto a real one. Its more useful
property is drift — the day one of those Skills is reworded, the page's quotes
go stale silently, and this is what says so.

⚠ **It reads `00_thoughtform-plugins`, not the installed marketplace cache.**
The two have diverged (the cache is behind on armada's trigger list and a
judges reference row), and the cache is what a session reaches first. The
canonical source is the sibling repository; the guard skips cleanly where that
repository is not checked out, because a guard that failed on every other
machine would be switched off within a week.

## Open items

1. **The quote under the ground has no attribution.** _"I don't want to use
   your agent, I want my agent to be able to use your tool."_ It went round
   when the agents arrived and the practice has not traced it to a first
   source, so it is set as a line the argument agrees with rather than as
   evidence. It takes an attribution the day someone finds one; it does not
   take an invented one.
2. **The registry position.** The cut lands after v1, which is what a room
   holds a link to. Two lines move it when it is promoted in place as the
   archetype the client forks are cut from.
3. **`ARC_PASSWORD_THOUGHTFORM_WORKSHOP_V2`.** The door is path-matched, so
   the route is gated for free — but it does NOT inherit v1's key. Unset, it
   falls back to `ARCS_PASSWORD`.

## U1 (2026-10-02, owner): agent-shaped work, and the spectrum's middle

The owner brought Matthew Schwartz's "Claude-shaped science" (Anthropic) and
asked how it fits the flow without adding text. Two changes, one of them a
picture.

**The spectrum's middle says which collaborator.** It read "a third skill:
brief it, give it room, judge what comes back". Schwartz's nuance is that the
collaborator a room pictures is a peer who knows what is interesting and when
it is done, and the one it has is not that: "I started to treat it like the
collaborator it actually is." The line is now _"Treat it as the collaborator it
actually is: give it what it does well, and keep the judging."_, and the
figure carries a credit (`spectrum.source`, optional, rendered as a caption).

⚠ **ONE SECTION, ONE RECORD.** The beat was four identical copies (v1, this
cut, the class-one deck, the AP lecture), so the change is a hoist:
`lib/arcs/content/shared/toolAndCollaborator.ts` holds the poles, the middle,
the bands and the credit, each page spreads it and authors only its head, and
`arcs-registry` pins every spectrum's four fields `toBe` the shared record. A
page with its own copy now fails by name.

**A new beat answers the turn: `agent-shaped`, the `hull` kind** (ADR-052's
**twenty-third** enumerated exception). Between 10 (_is the workflow for a
person, or for an agent?_) and the horizon (_what an agent needs to run for
hours_) sits _which work goes to the agent_: Schwartz's convex hull. The
team's knowledge is a jagged star, one spike per role; a dashed line runs
round the tips; the bays between the spikes, inside that line, are gold
particles. The spikes are where the judgement comes from; the particles are
what an agent can fill (work that crosses fields and can be checked).

- **People are shapes and the agent is particles**, the spectrum's own reading
  (intelligence is the cloud), held across the two beats.
- **It draws an argument, so it names its source** (ADR-130's workshop
  clause); `source` is required on the kind. "Agent-shaped" on screen and
  Claude only in the credit, because the ground beat names no vendor and a
  fork should reuse the beat unchanged.
- **The geometry is pure** (`components/arcs/hull/hullLayout.ts`): fixed
  patterns, a seeded jittered field, a crop derived from the drawing so it is
  centred at five to seven roles. The SVG letters nothing; the roles are DOM
  on seats the layout emits.
- ⚠ **EVERY TIP IS A HULL VERTEX, AND THE GUARD CAUGHT ONE THAT WAS NOT.**
  `tests/lib/arc-hull.test.ts` asserts it at five, six and seven roles; the
  first tuning put the shortest spike of a seven-role team inside the hull,
  which would have drawn that person swallowed by the agent's field. It also
  walks every particle: inside the hull, outside the star, clear of both
  lines.
- Eyebrows 11 to 22 move to 12 to 23. The beat measures 720 in a 720 frame at
  1280x720 and 1247 at 1920x1247; it stacks under 900px.
- No live layer yet: the three hologram figures are still awaiting the
  owner's round-four pick (ADR-140), and this one joins them only after it.
