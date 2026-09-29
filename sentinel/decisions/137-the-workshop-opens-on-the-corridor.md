# ADR-137: The workshop opens on the corridor

- **Status:** Proposed (2026-09-29, owner). Built and measured; flips to
  Accepted once the owner has read the page live.
- **Surface:** `/arcs/thoughtform-workshop` — a static route folder
  `app/(marketing)/arcs/thoughtform-workshop/` (`page.tsx`, `journey.ts`,
  `WorkshopPortals.tsx`, `WorkshopProof.tsx`, `WorkshopTail.tsx`,
  `thoughtform-workshop.css`); the prototype
  `public/prototypes/v7/landing-thoughtform-workshop.html` and
  `getThoughtformWorkshopContent`; the `hero-board` kind (`lib/arcs/types.ts`,
  `components/arcs/ArcHeroBoard.tsx`, `components/arcs/heroBoard/heroBoardLayout.ts`,
  `.arc-hb*` in `arcs.css`); `[slug]`'s `generateStaticParams`;
  `lib/arcs/content/thoughtform-workshop.ts`.
- **Supersedes:** ADR-131's opening (the `today` readout, the proof head and
  the four `proof-card` beats). Everything from `three-ways` on is ADR-136's
  situation re-cut, unchanged.
- **Related:** [ADR-053](053-workshop-corridor-variant.md) and
  [ADR-093](093-trinny-london-light-locked-variant.md) /
  [ADR-094](094-trinny-proof-stack-and-proposal.md) (the recipe, twice),
  [ADR-096](096-proof-stack-on-the-homepage.md) (the pile),
  [ADR-131](131-the-workshop-archetype.md) (the arc),
  [ADR-136](136-the-class-one-deck-and-the-situation-re-cut.md) (the situation
  the slide now hands over to).

## The call

The owner, 2026-09-29: the workshop page should open the way the other
workshop template does, with the hero, then About, then the Arc with the 3D
travel, then the proof, followed by an interstitial slide like the Moira
workshop's session hero ("How to hand work to an agent, and trust what comes
back"), replacing everything before "How long it runs without you". Asked, he
chose the proof alone (no card ring) and the slide WITH its diagram.

## The decision

**A third fork of ADR-053's recipe, with the arc as its tail.** A static
folder under `/arcs` wins over `[slug]`, whose `generateStaticParams` filters
the slug (`OWN_ROUTE_SLUGS`) so the build emits the page once. The `ArcDef`
stays in `ARCS`, so the overview card, every registry guard and `HERO_ROUTES`
are untouched. The page is `LandingPage` on its own prototype: hero → about →
corridor → `#services` mounting the homepage's proof stack (ring off, stamped
`data-services-ring="off"` in a layout effect, Trinny's device) → `#workshop`
mounting the arc's sections → contact.

**The tail renders through `ArcSectionRenderer`, not a page-local switch.**
Trinny's switch covers five kinds to keep the renderer's graph off its route;
this tail needs a dozen, and it is only reached through `lazy()`, so the
renderer and the holo stage's own `next/dynamic` seam stay off the first paint.
`useArcReveal` and the root's `data-arc-format` are the two things copied from
`ArcShell`; the HUD, the boot and the scroll writer are `LandingPage`'s.

**The opening slide is a new kind, `hero-board`** (ADR-052's next enumerated
exception): the head on the left, Moira's `BoardMini` on the right, COPIED BY
HAND (ADR-106) and re-skinned: TR + BL chamfers, the lit wires and plates gold
rather than her blue, every colour off the ADR-077 ramp. The drawing letters
nothing, so no label ladder applies; the lit set must be one side and adjacent
(registry-pinned) or the frame encloses an unlit plate.

**The title is two short sentences** ("Hand it to an agent. / Trust what comes
back."), owner, the same day: the longer line wrapped ragged against the
diagram. The `em` half starts on its own line and both halves wrap balanced, so
neither leaves a one-word orphan against the figure's straight edge.

**The arc's opening is DELETED, not sliced.** The corridor carries the proof
now, by reference to the homepage's pile; a slice would leave records nobody
renders. Eyebrows renumber from 01.

## What the measurement found

- ⚠ **A STATION IS `content-visibility: auto`**, so `#workshop` laid out as a
  720px placeholder and grew the document by ~12,400px on the frame the reader
  reached it. The route sheet makes it `visible`; the height is stable from
  load .
- ⚠ **THE PASSWORD GATE COVERS IT FOR FREE**: ADR-135's door is `proxy.ts`
  matching the PATH, so a static folder under `/arcs` is gated exactly as a
  `[slug]` page is (`ARC_PASSWORD_THOUGHTFORM_WORKSHOP`, else `ARCS_PASSWORD`).
- ⚠ **THE MASTHEAD LAW REACHES THE NEW KIND**: `arc-terminal-markup` counts
  `data-arc-still` against every section with a `head`, so the slide's copy
  block carries it under terminal motion even though no terminal page mounts
  it yet.
- The slide fills one screen at 1280×720 and 1920×1247, its text block level
  with the diagram. The tail's own overflows are ADR-131/136's and unchanged by
  this record. No page errors in either theme; the ring stays off.

## Left open

- The arc's `hero` record is unused by this route and kept because the type
  requires it; its actions point at live anchors.
- `useNestedRoot` is imported from the Trinny route's folder; a third consumer
  would argue for lifting it into `components/landing/`.
