# Handover: the X-Bionic proposal's two core sections, rebuilt from the brief

2026-10-11. Branch `lab/xb-offer-rebuild`. Read this first, then the brief at the bottom, which is the only source for these sections.

## Why this exists

The owner judged the Offering ("Where Thoughtform plugs in") and the Layer ("How adoption and automation connect") on `/test/x-bionic-core` (`components/xcore/*`) a failure next to the brief. The ask was to rebuild them **from the brief alone, completely different, on brand**. That means not starting from the repo's proposal components, `docs/design/xbionic-proposal/proposal-design-system.md` or the ADR grammar, which is where the "three blocks in every section" sameness came from. Keep it that way. The owner's three video reads of the same day (`docs/design/xbionic-proposal/feedback-2026-10-11/`) are the background to the brief.

## Where it stands

**Section 1 (the offering) is built in three directions and is waiting for the owner's pick. Section 2 (the layer) is built in three directions too, all on `LayerSlab`, and is waiting for its pick.** Section 2 was started on the assumption that section 1 goes to A (the pinned build); C shares the same isometric slab, B would need section 2 redrawn flat.

Section 2's directions (`?d=2a|2b|2c`, code in `components/xb-proposal/layer/`, sheet `layer/layer.css`):

| Direction                  | What it is                                                                                                                                                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **2A · Pinned, continued** | Section 1 A's end state, mirrored (drawing left, words right). Step 1 the team writes into the seated layer (adoption); step 2 the layer lifts and opens into Context, Skills, Evals; step 3 it closes, an agent runs across the board to the tools (automation) and the team's plates rise: upstream. |
| **2B · Opened**            | The exploded slab centred, one leader per stratum on each side: left where it comes from (adoption), right what an agent can then do (automation).                                                                                                                                                     |
| **2C · Growth**            | One ruled frame over time: the slab gains a stratum per step (Week 1, Week 2, Quarter 1), a gold step line under it rises (an agent runs minutes, an hour, a day), and the bottom row moves the team from making the ads to deciding what to test.                                                     |

The handover ladder from the plan was not built: the ladder was rejected on `/test/x-bionic-core` the same day.

| Direction            | What it is                                                                                                                                                                                                                                                                                                                                                | Brief reference                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **A · Pinned build** | Text pinned left with three steps; on the right one isometric drawing assembles as the reader scrolls: the four workstream plates, then the gold layer (Context · Skills · Evals) drawn out of them, then the layer seated on the Claude Enterprise board beside Shopify and Analytics. Only the active step's sentence is open, so the list never moves. | Unsiloed, "From raw document to LLM-ready data" |
| **B · Schematic**    | Title and intro above one ruled frame (one cut corner). Inside, a flat circuit read left to right: the workstreams as inputs, the layer as the one gold component, Claude Enterprise as a bus with Shopify and Analytics on it. A legend keyed 1 · 2 · 3 below, with cells as wide as the three zones.                                                    | Tensorlake / Hex                                |
| **C · Board**        | Drawing first, words right. One isometric board (Claude Enterprise) with the gold layer seated on it, the tools in front and the team's tiles behind, feeding the layer along traces. Read back to front, keyed 1 · 2 · 3 to the notes.                                                                                                                   | Parts drawings, Atomic Tessellator              |

Stills at both brief sizes, plus contact sheets: `docs/design/xbionic-proposal/rebuild-2026-10-11/`.

**Open question for the owner:** which direction goes into section 2, or which mix (for example A's pinned build with B's legend).

**A risk to put to the owner:** the brief says "no stacks of plates". The layer is drawn as three strata (and A's step 2 pulls them apart), which comes close to that line. The likely target of that rule is the stacked-card pattern elsewhere on the site, not a drawn object, but ask before section 2 opens the slab further. If the answer is no, the strata become three regions on one slab instead of three slabs.

## Where the code is

- `components/xb-proposal/`: self-contained and imports nothing from `xcore`, `arcs` or the landing sheets.
  - `xb.css`: its own `@font-face` (PP Neue Montreal Book, PT Mono from `/public/fonts`), tokens (`#0A0908`, `#EBE3D6`, `#CAA554` plus tints), the rails, the column and the ruled frame.
  - `iso.ts`: one isometric projection for everything (`makeIso`, `boxFaces`, `plane` lays a flat glyph onto a top face).
  - `LayerSlab.tsx`: **the layer as one object**, three strata with Context at the base. Section 2 must open this slab rather than draw a new one. That reuse is how the page reads as one system.
  - `glyphs.tsx`: flat straight-line icons on a 24 grid, drawn upright or laid into the isometric plane.
  - `copy.ts`: every word, in third person.
  - `offer/OfferPinned.tsx` (A), `offer/OfferSchematic.tsx` (B), `offer/OfferBoard.tsx` (C).
- Route: `app/(internal)/test/xb-offer-rebuild/page.tsx`. `?d=a|b|c` shows one direction; `&step=1|2|3` fixes A's move for a still; with no `d`, all three run down the page.
- Stills: `node scripts/capture-xb-rebuild.mjs [--port 3003] [--only a,b,c]` with the dev server running. Its **fit gate** fails the still when anything leaves the column (and so crosses the rails), when text renders below 12px (SVG text measured after its scale), when SVG text is cut by its drawing's edge, or when text sits within 12px of a ruled frame.

Open the pages locally (check the port of the running server first):

```
http://localhost:3003/test/xb-offer-rebuild
http://localhost:3003/test/xb-offer-rebuild?d=a
http://localhost:3003/test/xb-offer-rebuild?d=b
http://localhost:3003/test/xb-offer-rebuild?d=c
```

## Next steps

1. Get the owner's pick for section 1 and for section 2 (stills: `layer-contact-*.png` beside the offer's).
2. Done: section 2 built in three directions on `LayerSlab` (see above). The plan's starting points were:
   - **Opened slab:** the section 1 slab pulled apart into its three strata, with real examples on leader lines (product facts, brief to variants, product accuracy …).
   - **Progression:** Week 1 → Quarter 2, the slab gaining strata step by step, with a measured line beneath for how long an agent runs on its own, rising. It reads as a progression, never a loop.
   - **Handover ladder:** the team's jobs down the side, and across them the share moving from "the team" to "an agent, checked against the evals", in one ruled frame with the slab as its head.
3. Done: section 2 shots are in `scripts/capture-xb-rebuild.mjs` (`--only 2a,2b,2c`); the gate is green at 1280×720 and 1470×830.
4. Only then wire the chosen pair into the real proposal page.

## What was learned on the way

- **A gate that measures the SVG's box passes cut labels.** An SVG clips at its own box, so a label past the viewBox is cut without overflowing anything. The gate now measures every SVG text against its own drawing.
- **The legend's sentences cannot be the steps' sentences.** At 1280 the narrow zone made B's legend run to four lines and overflow, so B uses the `short` copy in `copy.ts`.
- **Mono labels at 12px need about 8.2px per character** (PT Mono plus 0.08em tracking). Budget the label columns from that before placing a drawing.

## Rules that held

From the brief: dark ground, one accent (gold for the one thing that matters: the layer), titles at 48px regular, body 16–18px, labels at least 12px, straight corners with at most one cut, no rounded shapes, no hand-drawn arrows, no rows of three identical boxes, no screenshots or mockups, content inside the rails, and copy never in the first person.

---

## The brief (verbatim, as the owner gave it)

# Design brief: two sections of a client proposal

## Context

Thoughtform (thoughtform.co) is a one-person AI practice. It helps creative and marketing teams work with AI by sitting inside the team, writing down how the team works, and turning that into a setup the company's AI can run on.

The proposals are web pages on the same site, built in the site's visual language. This one is for X-Bionic, a Swiss sportswear brand (socks, base layers, trail-running shoes). X-Bionic wants to grow its paid social presence and already uses Claude Enterprise across the company.

The page already has a hero, an About section and a series of case studies, and those work. The two sections that explain the offer do not. They are the heart of the proposal, and they are what this brief is for.

## The two sections

**Section 1. The offering: where Thoughtform plugs in.**
Three steps, read in order:

1. Thoughtform embeds in X-Bionic's four creative workstreams: creative production, creative ops, creative review and creative strategy.
2. It writes down how each workstream does its work, as a machine-readable layer.
3. It plugs that layer into the Claude Enterprise X-Bionic already runs, alongside the tools it is already connected to (Shopify, analytics).

The reader should understand it in about ten seconds: the team, the layer, the company's Claude.

**Section 2. The layer, opened up: how adoption and automation connect.**
The layer from section 1, shown in more detail. It holds three things:

- **Context:** product facts and the brand's voice.
- **Skills:** how the work is done.
- **Evals:** what good looks like.

The team builds it by using Claude on real work (adoption). Each thing they write down lets an AI agent take on a longer task by itself (automation), which frees the team to work on higher-level decisions. This is a progression that builds up over time, not a cycle. Section 2 should visibly reuse the layer drawn in section 1, so the page reads as one system.

## The feel

Retro-futuristic, in the spirit of navigation instruments, terminals and technical manuals: exploded views, isometric diagrams, circuit-board and node schematics. Calm, precise and engineered, never decorative. This is a proposal read by a CMO and investors, so it should be quieter than the homepage while clearly coming from the same world.

## References

- **North star: Unsiloed** (unsiloed.ai), especially the "From raw document to LLM-ready data" section. The text stays pinned on one side while you scroll, and on the other side one clean isometric drawing builds up step by step. Also note the straight corners and the one accent colour.
- **Spacing and diagrams: Tensorlake, designed by Hex.** One ruled frame divided into cells, generous padding inside each cell, simple precise charts, one accent colour used in a few tints.
- **Also liked:** Lighthouse (lighthousehq.com), Arrakis (arrakis.tech/platform), Atomic Tessellator, Augustus (its line drawings), Cluster's three-step flow (getcluster.ai), Rollups, Dispatch, Cofounder.
- **Not like:** full-width layouts (Canopy Planet), dense grids (Prime Intellect), background videos used instead of drawings (Spade), cards with all four corners notched (cctp.tech).

## Visual rules

- **Brand:** dark ground (#0A0908), off-white text (#EBE3D6), and one accent, Tensor gold (#CAA554). Fonts: PP Neue Montreal for headings and text, PT Mono for small labels.
- **Layout:** content stays in the site's centred column, inside the thin vertical instrument rails at the left and right edges of every page. No full-width elements, and nothing crossing the rails.
- **Type:** large and readable. Section titles around 48px in a regular weight, body text 16 to 18px, labels at least 12px.
- **Space:** lots of breathing room. Text never touches a line or the edge of a frame.
- **Corners:** straight, with at most the site's single cut corner (top right, or top right and bottom left). No rounded shapes, no hand-drawn arrows.
- **Drawings:** clean vector line work carries the meaning, with gold kept for the one thing that matters. Avoid typographic tricks such as one huge number or word, and avoid screenshots, videos and mockups.
- **3D:** use it sparingly, for the main object only. Small icons stay flat, and the flat and 3D pieces must look like one language.
- **Variety:** no rows of three identical boxes, no stacks of plates, and the two sections should not look the same. They should still feel modular, with section 2 visibly built from section 1's layer.
- **Copy:** never in the first person, no slogans, and nothing that reads like AI-generated filler. Every label has to make sense to someone outside the company.

## What to deliver

Two or three directions per section, each shown as a desktop still at 1280×720 and at 1470×830. Each section should fit one screen at those sizes, or be one pinned scroll sequence in the Unsiloed style. Start with section 1.
