# Lab brief: the split brain at the centre of the swarm's opening

Filed 2026-10-16, not started. Build in a later round, as a self-contained lab the owner picks from.

## The ask (owner, 2026-10-16)

"I see a big opportunity to integrate it into the flow that we're building for the swarm proposal because I was struggling with how we visualize certain parts of our proposition. … On the left side: creative ops, creative strategy, etc. On the right side: the stack, Claude Enterprise. At the center: our brand mark as a layer you can plug in. … what if we split the brain so the left side is the creative strategy, the people part, and [embedding] myself into the teams? The other side is actually the robot side because … we have a part of the brain that looks like a particle system. There's already a nice split."

## The target

`StackFlow` (`components/xb-proposal/stack/StackFlow.tsx`), the opening beat "AI capability your teams own.", on `/test/proposal-swarm` (`#vision`).

- **Left:** the team chips, `TEAMS` in `components/xb-proposal/plug/PlugFlow.tsx` (Creative strategy, production, review, ops), on one bus into the top plate. Tab "01 · Navigate with your team".
- **Centre:** `.shf-stage` holding `ClosedStack` (three plates from `network/NetworkPlug` `PLATES`, cropped to `HERO_BOX`); on the swarm page the plates are drawn as dots, the brand mark engraved on the layer by `engine/mark.ts`. Tab "02 · Encode your context", with the part tags.
- **Right:** the tools, `CARDS` (Claude, Slack lit, Shopify, Ad accounts), fed from the agents plate. Tab "03 · Build on Claude Enterprise".
- Geometry: `FLOW` in `components/xb-proposal/stack/heroLayouts.ts` (pure; pinned in `tests/lib/proposal-kit.test.ts`).

## Constraints

1. **The centre is the swarm's dot pool.** The same dots fly into the steps (`.es-stage`) and the network (`.xn-fig`); the stack is the object that travels.
2. **`measure.ts` needs** `.psw .shf-stage` and `.psw .shf .pl-fig`, or the swarm does not build.
3. **`ClosedStack` is the hand-over donor** (`travel.ts`, `EmbedStack` find it by class).
4. **The projections already match.** The swarm and `scene.ts` are true isometric; `brainIso.ts` uses the same camera, so the brain needs only a scale (like the engine's `kA = flowStage.w / HERO_BOX.w`).
5. **The brain is SVG rasterised to a canvas**, not pool dots (`brainIsoSvg`, `BRAIN_ISO_PORTS`, `brainIsoFlank`).

## Three directions

- **A · The brain over the layer.** `brainIsoSvg({ split: true })` above the stack. The machine (people) hemisphere is wired from `brainIsoFlank(-1)` to the team bus, the particle hemisphere from `brainIsoFlank(1)` to the tools bus, the manifold's ports down into the layer. The stack stays the travelling object; nothing in the engine changes but two trace endpoints.
- **B · The particle half is the swarm.** Sample `looseHalf`'s contour points into a new formation in `engine/formations.ts`, so the right hemisphere is made of pool dots. When the stack leaves for the steps, those dots go with it: the brain becoming the nanobots.
- **C · The brain is the layer.** The brand mark engraved on the brain's crown deck in place of the chips (the lit part). The left hemisphere in the people's green, the right in gold particles. The plates below become the brain's stem and manifold.

## How it is judged

Lab at `app/(internal)/test/swarm-brain/`, importing nothing from the arcs but `brainIso.ts` and the swarm engine. Stills at 1440 × 820 and 1920 × 1080 in both themes, read at the four moments of the opening (rest, the hop's start, mid-hop, landed). The owner picks; only then is it ported. The method and the brain's own story: `docs/design/machine-brain/README.md`.
