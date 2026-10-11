# Handover: the configuration artifact, five permutations

2026-10-11. Branch `lab/config-artifact`, cut from `lab/xb-offer-rebuild` (`7fb870d2`). Built in a separate worktree so it never touched the session working on `lab/xb-offer-rebuild`. Everything here is new files.

## Why

Across Aether (Loop), Shards (the Stripe AI-operator page), the homepage's CONFIGURATION circuit and the Holo-inspired 3D brand mark, the same idea has been drawn several times without one artifact that shows the whole flow: **a client's team → the intelligence configuration Thoughtform builds inside it → the agents and models the company already runs** (plus the tools those reach). The arc stays the homepage's approach visual. Proposals need a clearer version of this, Unsiloed-clear. This lab tries the one artifact from five perspectives. Each has a section-1 frame (where Thoughtform plugs in) and a section-2 frame (adoption becomes automation), so each is tested against both sections of the X-Bionic proposal.

## The five permutations

| | Name | After | What it is | Gets right | Risks |
|---|---|---|---|---|---|
| P1 | Exploded panes | Unsiloed hero | Isometric standing panes: the team's four sheets, three gold panes (context, skills, evals) whose cells fill, and tags for agents, models, Shopify and analytics on the right. Labels lie in the panes' plane. | Closest to the North Star; the layer reads as written material; the flow runs left to right in one glance | Busy at 1280; slanted labels are harder to read than upright ones |
| P2 | Frontal stack | Unsiloed "from raw document" | Front view: the team's plate, the configuration as the one lit band (brand mark, `[ CONTEXT · SKILLS · EVALS ]`, a fill meter), and Claude Enterprise's plate, threaded on one beam. | The calmest and clearest; a CMO reads it in seconds; the easiest to build into a pinned scroll | The least "Thoughtform" in feel; plates are close to the brief's "no stacks of plates" |
| P3 | Motherboard | Cyberpunk inventory board | Top-down board: the configuration as the central chip (brand mark on the lid, three meters), ribbon traces in from four workstream chips and out to a Claude Enterprise module (agents with run length, models), with Shopify and analytics wired to it. | The richest information per square inch; the closest relative of the homepage circuit; section 2 lives in the meters | Most "UI", least drawing; could tip into dashboard |
| P4 | The machine | anatomy skill | A real object: Claude Enterprise is a console on feet, the configuration a lit gold cartridge seated in its slot (mark, "02 X-BIONIC", written lines), agents and models as cards, Shopify and analytics as ports, and the team a patch panel whose four leads plug into the cartridge. | The most memorable; "plugs in" becomes literal; one lit part | A cartridge says "product", not "built with the team"; the most work to animate well |
| P5 | Centrepiece | Holo plus the brand mark | The brand mark standing over isometric instrument rings, three tracking reads locking context, skills and evals, the team's lanes running in from the left and Claude Enterprise's lanes running out to the right, with slow motion on the lanes. | Most on-brand; the mark is literally the centre; the motion carries "flow" | The most abstract (the owner's own worry about Holo); the rings say little on their own |

Section 2 uses one shared device in every permutation: a timeline strip, Week 1 → Quarter 2, with how long an agent runs alone (minutes → a week) under it. The artifact shows the same state: cells, meters or lines filled, and the team "deciding". The numbers are illustrative (`STAGES` in `copy.ts`).

**Open question for the owner:** which permutation, or which mix, becomes the proposal's artifact. A natural mix is **P2's clarity carrying P4's or P1's object**: the frontal stack for the pinned scroll, and the isometric object as the hero or the "opened" view in section 2.

## Where it is

- Lab: `/test/config-artifact?p=1..5&f=1|2` (no `p` runs everything down the page).
- `components/config-artifact/`: `copy.ts` (every word), `Shell.tsx` (the Unsiloed split: words left, artifact right, viewBox 610×570), `Mark.tsx` (the brand mark's own paths), `parts.tsx` (tags, plus marks, cube, the timeline), `ribbon.tsx` (parallel traces with mitred 45° bends), `ca.css`, and `p/P1Panes.tsx` … `p/P5Holo.tsx`.
- `components/config-artifact/iso/`: the anatomy kit vendored byte-for-byte (MIT, `iso/LICENSE`), retuned to the brand in `ca.css` (warm greys on `#0A0908`; the lit accent is Tensor gold).
- It reuses `components/xb-proposal/` for the rails, the tokens (`xb.css`), the glyphs, the isometric helper and `Ready`.
- Stills: `node scripts/capture-config-artifact.mjs --port <port>` → `docs/design/xbionic-proposal/config-artifact-2026-10-11/` (`p<n>-s<f>-<size>.png` plus two contact sheets).

## Lessons from the build

- **A text's own transform counts in the 12px floor.** The gate used the SVG's scale only; labels laid in a plane or engraved on a face carry their own matrix. It now reads each text's `getScreenCTM()` vertical scale.
- **`xb.css` sets every SVG text to 12px**, which beats the anatomy kit's `fontSize` attribute. P4 engraves with an inline size of `12.5 / P.scale`, so engravings render near 12.5px on their faces.
- **The dev env banner (missing Supabase keys in a fresh worktree)** is removed by the capture by its text; it is not part of the design.
- **A worktree with `node_modules` as a junction** fails under Turbopack (`turbopack.root` is the worktree), so run `npx next dev --webpack -p <port>` there.
- **anatomy's line-end check found zero lines** on this page (`scripts/lines.mjs <url> --select ".ca__fig svg"`), so P4's line ends are not yet machine-proved, only read by eye at 2×.

## Next

1. The owner picks a permutation or a mix.
2. Give the pick its real motion: P1's panes assembling, P2's packet travelling the beam, P4's leads seating, P5's lanes; scroll-pinned, eased, and still under reduced motion.
3. Fold it into the proposal's two sections on `lab/xb-offer-rebuild`, replacing the slab there.
