# Capability in particles, round 01 (2026-10-15)

"AI capability your teams own." as a new figure in the swarm's dots: one section, no scroll, three sketches of three different logics for the owner to pick one. Internal only.

```
http://localhost:3021/test/capability-particles?v=a
http://localhost:3021/test/capability-particles?v=b
http://localhost:3021/test/capability-particles?v=c
```

(The port is the swarm lab's worktree's, `C:\wtd`, on branch `lab/capability-particles`.) `?t=<s>` holds a sketch at that moment; `?still=1` shows it at rest without the bar.

## Why

The owner, on the one-plate opening (`/test/proposal-embed`, rejected the same day): "I want to just use the design language. I don't need those three frames necessarily … I just want to have a completely new logical artifact with the particle system so it fits there, but something completely different. It doesn't need to have scroll animation because it will be in one section."

The one sentence each sketch has to make a stranger believe: *Thoughtform works inside the four workstreams, the team takes the work over, Thoughtform leaves, and what was built keeps running and changing in the team's hands* (the owner's "what stays when we go").

## The three

- **A · Lanes.** Each chip feeds a straight lane. A gold dot drops onto the bus beside the chips and steps into the first lane; the team's first runner sets off from the chip, passes it and lays the lane to its end. The gold steps back, down to the next lane, one at a time, then drops off the foot of the frame. The lanes keep running, more runners the longer they run.
- **B · Altitude.** "A climb, not a wheel": four columns on an open floor. A gold drop opens each column; then the team's own drops fall, closer and closer, each raising its column a level. At rest a lit dot climbs each column.
- **C · Pattern.** A field printed from the chips rightward, as a terminal prints. A gold caret types the first column with the team, each workstream its own seed, then leaves by the foot. The field prints itself from there by one rule (rule 90), each workstream in its own band, faster as it goes, and keeps printing slowly at rest.

## Held to

- Only S4·E's grammar: square dots on whole pixels, drops with trails, runners with tails, level, plumb or 45-degree moves. Gold is the one lit thing (at most a dozen dots, under a tenth of the figure) and is gone at rest. No brandmark, no captions, no fades: the painter has no alpha.
- `tests/lib/capability-particles.test.ts`, 16 tests: the same frame twice; the gold rule; no gold at rest; inside the figure at rest; straight routes; no alpha or opacity in the painter.
- `round-01/`: each sketch at 1.2, 3, 6, 9 and 20 s, at 1976×966 and 1920×1247, shot twice and byte-identical. Played live at 1976×966: 59–60 fps, no page error.

## Not done

- **The cold read.** Show each sketch for ten seconds to someone who has not read the proposal and write down what they say it means. That is the owner's to run.
- **Light theme** untested.
