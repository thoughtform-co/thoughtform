# The machine brain (2026-10-15)

How the brain on the UX meetup talk went from a flat drawing to a machined object, in eight rounds and two refusals. It is the worked example of the method in `.claude/skills/thoughtform-design/references/brand-language-2026-10.md`.

```
http://localhost:3003/arcs/thoughtform/ux-meetup#the-interface
```

The brain appears in four beats of the talk's foundation act (ADR-156): over the stack of examples with cords into every plate (03), split between a tool and a collaborator (05), ringed by the knowledge work it grows into (06), and as the shoggoth with its tentacles and mask (08).

## The rounds

| Round | What was shipped | The owner's read | Shot |
|---|---|---|---|
| 0 | A 2D canvas drawing (`brain.ts` + `paintBrain.ts`), face on: two glass hemispheres, two pods with ringed lenses in them | — | `shots/r0-2d-interface.jpg`, `shots/r0-2d-middle.jpg` |
| 1 | three.js: the same outlines extruded into glass pillows, an orthographic camera, face on, a few degrees of sway | "with the machine brain im missing depth, like an actual three.js / webgl or thing built with the anatomy skill" | — |
| 2 | The glass made clearer, a rim shader for the edge, the loose half as particles | "the machine head STILL LOOKS FLAT; did you actually use any of the suggestions like anatomy skill; and the head should be be a bit aligned with the perspective of the stacked cards … and remove the googly eyes" | `shots/r2-threejs-interface.jpg`, `shots/r2-threejs-middle.jpg` |
| 3 | The anatomy kit vendored (`isoKit.ts`) and the brain rebuilt as solids (`brainIso.ts`); its first render squared to the viewer | (caught before shipping: the block read as a flat rectangle) | — |
| 4 | The brain squared to the stack's own world axes and drawn through the stack's camera, so it is seen corner on, like the cards | "oh damn that looks sick!!" | `shots/r4-anatomy-middle.jpg` |
| 5 | Lobed contours whose phase drifts with height, concave fills, a wider tone ramp, a longer stem | (folded into round 4's approval) | `shots/r5-standalone-trio.jpg` |
| 6 | The split: the left hemisphere machine, the right the same contours as particles | (approved with round 4) | `shots/r4-anatomy-middle.jpg` |
| 7 | The mask rebuilt as a machined faceplate in the brain's front plane; the middle beat moved clear of its headline | "fix the spacing a bit because too close to the text and redo the mask as well so it fits the style" → pushed | `shots/r4-anatomy-shoggoth.jpg` (before), `shots/r7-faceplate.jpg` (after) |

## What failed, and why

**A renderer is not depth.** Rounds 1 and 2 were real WebGL: PBR glass, an environment map, a Fresnel rim, a sway. They still read flat, because the camera looked at the object face on and orthographically. A pillow seen square has no sides to show. The fix was the camera, not the material.

**The named skill was skipped.** The owner named the anatomy skill in round 1. Round 2 tuned the three.js version instead. He had to ask a second time, louder. When the owner names a skill or a reference, that is the brief.

**Squared to the viewer is not the stage's perspective.** Round 3's first render used the right kit and still looked flat. The brain's axes were laid along the viewer's left–right and front–back, so the kit's isometric camera saw it symmetrically, face on: the manifold read as a flat rectangle. The stack of cards under it lies on the world's x and y axes and is seen corner on. Turning the brain onto those same axes (L along −y, F along +x) is what made it read as standing in the same room.

**Hull fills lie on concave outlines.** Once the hemispheres had lobes, the kit's default convex hull filled past the true outline and left dark wedges at the folds. The kit's `convex: false` draws the real faces.

## What made it work

1. **One camera for the whole stage.** The stack (`scene.ts`) is a true isometric at 34 px a unit: `EX = (cos30, ½)·U`, `EY = (−cos30, ½)·U`, `EZ = (0, −1)·U`. The anatomy kit's camera at azimuth 45° and elevation 35.264° is exactly that projection (`sinE = 1/√3`), so the kit's `P = { azimuth: 45, elevation: 35.264, scale: K/√1.6 }` puts the brain in the cards' space with only a scale between them.
2. **Solids, not wireframes** (the anatomy skill's first rule). Every part is filled and shaded in the kit's four side tones with a lighter top, painted back to front and bottom to top. Order: the ports, the manifold, the block, the far hemisphere, the stem, the near hemisphere, then the machine on each crown.
3. **Organic form out of machined parts.** Each hemisphere is a stack of extruded contour plates (5 below the equator, 14 above), each plate the hemisphere's outline at that height. The outline carries a slow ripple whose phase drifts with height, so the terraces fold the way gyri do. The crown is cut flat at 70 % of the dome and the machine sits on that deck: a board on stand-offs, chip packages with pins, traces, screws, and the core die under a finned heatsink, the one lit part.
4. **No ornament that is not a part.** The pods and their lens rings read as eyes and went. The mask came back as a part: a plate in the brain's front plane with real thickness, a gold rim, an inset groove, ten rivets, the eyes and smile cut through it as slots, and straps back onto the hemispheres.
5. **The split already carries the meaning.** In split mode the right hemisphere becomes its own contours as particles (`looseHalf`). Left a crisp machine routed square to the tool, right loose particles streaming to the collaborator: the beat's argument is the object.
6. **The geometry module owns the anchors.** `brainIso.ts` exports the seven port mouths (`BRAIN_ISO_PORTS`), the flank points (`brainIsoFlank`) and the drawn box (`BRAIN_ISO_BOX`). The act's cords, side runs and hanging cables read them; nothing is placed by hand, so moving the brain moves everything tied to it.
7. **Drawn through the existing canvas.** The kit emits SVG. The act turns it into a whole document with the theme's tokens resolved into its `<style>`, rasterises it once per pose and theme (`Blob` → `Image`), and paints it into the canvas where the old brain was. The rings' far halves, the tentacles and the cords keep their order around it with no other change.
8. **Judged on stills.** Every round was shot headless at 1440 × 820 at each of the four beats and read before it was shown.

## Files

- `components/arcs/figures/foundation/brainIso.ts`: the brain, its mask, its anchors and its theme style. Pure: strings and numbers.
- `components/arcs/figures/foundation/isoKit.ts`: the anatomy kit (`~/.claude/skills/anatomy/kit/iso-kit.ts`), vendored as is.
- `components/arcs/figures/foundation/scene.ts`: the stack's projection the brain shares.
- `app/(marketing)/arcs/thoughtform/ux-meetup/FoundationAct.tsx`: `pictureOf`, `layerOf`, `isoPortAt`, `isoFlankAt`, `paintHanging`.
- `brain.ts` and `paintBrain.ts` remain for the model the tentacles still read; the 2D body painter is no longer drawn.

## Next

The split brain at the centre of the swarm proposal's opening (`StackFlow`): the people's hemisphere wired to the workstreams, the particle hemisphere to the stack and Claude Enterprise, the brand mark on its deck. The lab brief is in `docs/plans/swarm-brain-lab.md`.
