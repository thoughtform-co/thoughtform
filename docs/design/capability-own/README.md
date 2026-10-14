# Capability lab, round 01 (2026-10-14)

"AI capability your teams own." four ways, each drawing how the team becomes self-sufficient. Internal only: `/test/*` is a 404 in production.

```
http://localhost:3021/test/capability-own
```

(The port is the swarm lab's worktree's, `C:\wtd`, here on branch `lab/capability-own`; read it off the running server.)

- `?v=a|b|c|d` mounts one variant, followed by the proposal's own steps and network, as the page reads.
- `?p=0..1` holds every variant at that moment of its runway; `?still=1` hides the bar, for a shoot.
- The bar at the foot jumps between the four, or switches to the sequence.

## Why

The owner, 2026-10-14:

> I think it is an AI capability our team owns. I love it but at the same time it kind of repeats what we're going to see when navigating code builds. … I think we got covered where we plug into the organization. What isn't really visually clear yet is how we make the team self-sufficient. … I'm just thinking about that adoption-to-automation flywheel and embedding ourselves in the team. How do we do that?

Rob Weston's reply to the proposal (2026-10-13) asked for the same thing in a simpler story: "We do this via an embedded model where your team is coached 1:1 using real business problems. At the end of the project your team will be self-sufficient", and three steps: in person with the team, co-working the solutions, then "team members take the lead, supported by Thoughtform remotely."

## The diagnosis

The opening and the steps drew the same three things: your team (the four workstreams), the layer (context, skills, evals), your agents in Claude Enterprise. That is the repetition. The steps own that mechanism and do it better: the stack opens, each plate is a step.

What neither draws is the engagement over time: who holds the work at each point, and Thoughtform leaving. That is the self-sufficiency story, Rob's three steps, and the owner's own line ("I come in, the team takes over, I move on", in the page's third person). So each variant keeps the four workstreams (which the owner likes in the opening) and draws time, ownership and the exit. Claude Enterprise is left to the steps, whose third plate is the agents it runs.

The month is the proposal's own, not invented (`model.ts`, `PHASES`): five days on site, then about three a week remote, fourteen in all, none after; no workstream owned in week one, one by the end of week two, two by week three, all four in week four (the four weeks' "Done when").

## The four

**A · Handover.** The month on a ruler, the four workstreams as four lines under it. Thoughtform is one gold line among them: inside the team in week one, tied into every workstream; stepping to each line in turn in weeks two and three, bottom up, a skill written where it leaves a line and the line green from there; out over the team, dashed, in week four; straight up and out at "after". It never crosses a line the team already owns (test). Counters read owners 0/4 → 4/4 and Thoughtform's days 0/14 → 14/14 off the playhead.

**B · Flywheel.** The owner's "adoption and automation, they are the same flywheel" (2026-08-14). The About drawing's ring register as a dial; a bearing goes round three stations: use it, write it down, hand it over. One turn hands one workstream over (its line in lights, its chip is owned) and leaves a ring in the dial, so the turns stack up. Each turn takes less scroll than the last: it compounds. The hub says who turns it (Thoughtform, together, your team, on its own) and Thoughtform's mark steps out of the hub, to the rim, along a track and off the frame.

**C · Crossover.** The plainest reading for a board: Thoughtform's days a week, a column of dots a week (5, 3, 3, 3, then none), against the workstreams the team runs, a stepped green trace (0 → 1 → 2 → 4). Where the green rises past the gold, at the end of week four, a target lock: self-sufficient.

**D · In, then out.** The proposal's dot language (S4·E) telling the engagement. The four workstreams are four crowds of green dots. Thoughtform comes in as its mark in gold dots, settles inside every crowd (week one), huddles over each in turn and drops a core of gold into it (weeks two and three: the skill that crowd keeps), hangs back, thinned, with faint lines down (week four), and leaves the frame. The cores stay and the crowds pass work along a line between them on their own.

## Built

`app/(internal)/test/capability-own/`: the page mounts the proposal's shell, frame and stylesheet chain (the swarm lab's), without the hero. Each variant is a pure picture of its runway's clock (`useRunway`, `shared.tsx`), drawn in the opening's own 1200 × 460 frame with the opening's chips and title. D's choreography is `inout.ts`, arithmetic over the clock; its canvas only paints. Nothing outside the lab changed.

## Checked

- `tests/lib/capability-own.test.ts`, 16 tests: the month is the proposal's (5, 3, 3, 3, 0; 14 days) and never takes a workstream back; every trace is level, plumb or 45 degrees; A's gold never crosses an owned lane and writes each skill on its lane; B's turns get shorter and never run backwards, each workstream runs level into the rim, the mark's track is straight; C's trace only rises, level and plumb, and crosses in week four; D gives each crowd a core of twelve, ends with every keeper in its core and every other dot off the frame, comes in as the mark inside the frame, and is the same picture twice.
- Stills, `round-01/`: each variant at 0.25, 0.6 and 1 of its runway, at 1976×966 and 1920×1247; the four at rest in the light theme.
- The whole page scrolled live at 1976×966, four runways, no page error; `?v=a` scrolled into the steps and network.
- `tsc` clean, ESLint with no warning on the lab.

## Decisions taken without asking

- **The opening keeps its title and loses Claude Enterprise.** Every variant is "AI capability your teams own." over the four workstreams; Claude Enterprise is left to the steps' third plate.
- **No first person.** Thoughtform by name, "your team"; the owner's "I move on" is "Thoughtform moves on".
- **Owners are not named by role.** "Skill · owner", never which person owns which workstream: the proposal does not say, and inventing it would be a claim.
- **Order of handover.** A hands over bottom up (ops first), so its gold line never crosses an owned lane; B, C and D go top down (strategy first). Nothing in the proposal fixes an order.

## Known, and not fixed

- **Motion judged from stills and a live scroll,** not on the owner's screen.
- **D in the light theme** is pale: its dots take the theme's tokens and were not tuned.
- **B's track words** ("Together · remote", "Your team leads") stand from the start, before the mark reaches them.
- **The sequence mode** follows a variant with the proposal's own steps (the SVG plates), not the swarm lab's dots.
