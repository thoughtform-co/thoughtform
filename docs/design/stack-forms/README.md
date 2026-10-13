# Stack forms

Different drawings of the three-plate stack (your team, the layer, your agents), on a lab page of their own. Internal only: `/test/*` is a 404 in production.

```
http://localhost:3019/test/stack-forms
```

`?v=<id>` shows one drawing alone, `?open=0..1` sets the pose (0 closed, 1 opened), `?still=1` hides the page's chrome and stops motion. The slider on the page is the one control: whichever drawing is picked has to close and open on the proposal.

## Why

The stack now travels across three sections of the proposal copy and the owner likes the choreography. His problem was the object (2026-10-13): "the design language we use and the textures we use to create it feel like just four blocks to me … It needs to be clear that it's three stacks but I think those three square blocks are okay." He asked for five completely different variants, from his reference library (`I:\My Drive\01_Thoughtform Branding\07_Artifacts Branding\_01_GENERAL REFERENCES`) and the web: Unsiloed's wireframe stack, Marathon, Evangelion, cyberpunk and a particle system, retro-futurism.

Decided with him: **brand tones only**. Near-black ground, the team in green, the layer in gold, the agents in bone. The drawings differ in what the plates are made of, not in colour.

## How it is built

A self-contained lab, as the repo rules for new design: its own tokens, its own type, its own drawing.

- `app/(internal)/test/stack-forms/model/` is the stack as plain data: three plates, what each holds, the proposal's own 30-degree isometric, and one pose parameter `open`. It is restated from the proposal's numbers, not imported; `tests/lib/stack-forms.test.ts` holds the two together.
- One folder a direction (`wire/`, `print/`, `readout/`, `swarm/`, `phosphor/`), each with its own stylesheet and class prefix. An iteration lives in its direction's folder.
- **The honesty rule.** These manners lean on dense telemetry, so every number and word on screen is true: a plate's index and name, what it holds, the stack's geometry, the live `open` value, a real count of dots or characters. No invented serials.
- No WebGL: the repo's lint cap has no headroom. The dot drawings are Canvas 2D on a whole-pixel lattice, deterministic, so a still is repeatable.
- `node scripts/capture-stack-forms.mjs --port 3019 [--only …] [--open 0,0.5,1] [--sizes …] [--sheet] [--twice]` shoots the stills in `round-01/` (every drawing unless `--only` names some; `--out` names another folder).

## Round 01: five directions

|                 | id         | What the plates are made of                                                                                                                                                            | After                      |
| --------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **S1 Wire**     | `wire`     | Hairline and wash. Flat sheets, a cross on every corner, a ghost box, a plumb line; the layer washed gold with a readout band; what each plate holds listed beside it.                 | Unsiloed                   |
| **S2 Print**    | `print`    | Flat opaque planes with no outlines. A fat printed circuit on the team, three lettered strata and a hazard flank on the layer, a chip and modules on the agents; ducts cross the gaps. | Marathon                   |
| **S3 Readout**  | `readout`  | Modules in a frame. Each plate an 8 × 8 grid of capsule links; buses fan out to registers; a plan of each plate on the left.                                                           | Evangelion, Cyberpunk 2077 |
| **S4 Swarm**    | `swarm`    | Dots only. Green clusters that drift, a dense gold lattice with a white-hot core, a perfboard with runners; dots fall from plate to plate.                                             | Dot matrices               |
| **S5 Phosphor** | `phosphor` | Characters. The team in letters with the workstream names running through them, the layer in shade blocks, the agents in box-drawing.                                                  | Retro terminals            |

## Round 02: iterations

The owner's read of round 01 (2026-10-13): "I love S1 but maybe we can make a variation where it's a bit more wireframe like the unsiloed example. S4 Swarm also looks great but it kind of looks a bit too much like a Christmas decoration. Maybe we need to make it a bit more minimalistic but I really like it because it's unique … S5 is also crazy but the middle panel looks a bit too much like Lego … It would be amazing if it would fit the aesthetic of our Arc 3D three.js thing on our homepage."

The homepage's Arc sphere was looked at first (the Encode and Build stations): one hue; gold dots laid in rows, a few white-hot; thin gold axes with small arrowheads; small outlined gold tags with a diamond node on dotted leaders; nested dashed frames.

|                            | id           | What changed                                                                                                                                                                                                                                                                                               |
| -------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S1·B Wire, bare**        | `wire-b`     | Nothing drawn on the plates. Each is a sheet in a dashed frame with corner crosses, a fainter dashed frame inside it, and one small cube. Each is lettered on its own edge, as Unsiloed does. The layer's edge is the one solid band; the readout band runs behind the stack and shows on both sides.      |
| **S4·B Swarm, banded**     | `swarm-b`    | The sphere's own material. One hue: gold dots in rows, a few white-hot on the layer, four small green diamonds on the team. Nothing falls and there is no starfield; one axis with arrowheads runs down through the three plates and a second lies in the layer's plane; the names are outlined gold tags. |
| **S4·C Swarm, quiet**      | `swarm-c`    | The least it can be. One even lattice of equal dots; the team and the agents in dim bone, the layer in gold, lit by tone alone. Three plain labels.                                                                                                                                                        |
| **S5·B Phosphor, written** | `phosphor-b` | No shade block anywhere. The layer is running gold text, "context skills evals", row after row, its three strata as rows of `c`, `s`, `e`; the agents' chip and modules are ruled frames with the tool's name inside. The team is as it was, but for its walls.                                            |

My read of "Christmas decoration": green, gold and white together, a glittering highlight, dots falling, a starfield behind. Both S4 iterations remove all four.

S2 and S3 were not touched in round 02.

## Round 03: two more

The owner's read of round 02 (2026-10-13): "S4·B Swarm, banded but use the colors like S4 Swarm … but with the animations", and of S5·B: "i think this needs not the 'evals' as a material; more minimalistic."

|                                  | id           | What changed                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S4·D Swarm, banded, in tones** | `swarm-d`    | S4·B's order (dots in rows, a whole edge to every plate, the axis with arrowheads, outlined tags) in S4's colours: the team green, the layer gold with a white-hot core, the agents bone. S4's motion, kept to the rows: the team's rows sway and one larger dot walks each lane, dots fall off the two front edges in files, a file of gold dots goes down the axis, runners step along the agents' traces. The layer does not move. |
| **S5·C Phosphor, spare**         | `phosphor-c` | Nothing is filled. Each plate is its outline. The team is four outlined workstreams, each named once. The layer is a ruled page: gold rules of uneven length, lines of writing with the words left out; context, skills and evals are set once, in the list beside it. The agents are ruled frames with the tool's name inside. About half the characters of S5·B (1 279 against 2 420, half open at 1920×1247).                      |

Two readings these are built on. He asked for S4's colours and motion back, so what read as "Christmas" in S4 is taken to be the random scatter, the glitter and the starfield: S4·D has none of the three. And "not the evals as a material" is taken to mean the layer should not be textured with its own words.

Stills: `round-03/`, with one sheet that sets each family side by side (S4, S4·B, S4·D over S5, S5·B, S5·C).

## Checked

- By eye at 1920×1247 in three poses (closed, half, opened), then at 1470×830 and 1280×720 half open: every drawing reads as three stacked plates.
- Stills of S4, S4·B, S4·C, S5 and S5·B are byte-identical on a second shoot.
- `tsc`, ESLint with zero warnings on the lab, and the guard tests pass.
- Nothing outside the lab changed: the sent proposal and the travelling copy are untouched.

## Known, and not fixed

- **Lettering shrinks with the drawing in S2 and S3.** They letter in SVG, so their small type is about 11px at 1470×830 and under 10px at 1280×720. A picked one needs its words moved to DOM first, as S1 does.
- **S5 and S5·B, closed:** the drawing fills about half the frame, and S5·B's layer has a softer outline than S5's blocks.
- **S5·B:** tool names give way to two letters below the largest size, and a name is not set where the layer covers part of it.
- **Motion was judged from measurements and stills,** not by watching: S4's falling dots are the thing to look at live.
- **S4·D's falling dots are the thing to watch.** They fall in formation, but green files cross the gold layer's wings, and fully opened there are 32 drops a gap. `FALL.streams` and `FALL.drops` at the top of `swarm/tones.ts` thin them. At 1280×720 the four workstreams merge into one green mass.
- **S5·C falls back to lists at smaller sizes.** At 1470×830 the workstream outlines go and the names stand alone; at 1280×720 each workstream is a `+` and the names move to the list. Tool names shorten to two letters at both. A tool whose frame is partly behind the layer is drawn without its name. Seen small, it is as faint as S4·B.
- Dark only. Nothing below 961px was looked at. Nothing is wired into the travelling proposal copy; that follows a pick.

- **S4·B and S4·C are the dimmest drawings on the page.** Seen small, beside the others, they nearly disappear. That is the brief ("more minimalistic") taken at its word, and it sits close to what the owner called "too boring" in his hologram notes. Their brightness is one number each.

Stills: `round-01/`. In the repo: a contact sheet of all nine a pose at 1920×1247, a sheet half open at each smaller size, and each drawing half open at 1920×1247. The rest (every pose, every size) is on disk after a shoot and is not tracked.
