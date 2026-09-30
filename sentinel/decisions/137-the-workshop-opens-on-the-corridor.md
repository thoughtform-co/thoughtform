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

## Update 1 (2026-09-30, owner): the hero lifts over a held #about

The owner asked for "the same parallax effect as we have on the home page".
The hero was already the homepage's; what differed is what sits behind it. On
`/` the corridor is frozen `fixed` through the entry band and the hero uncovers
a still frame; here `#about` is a normal-flow station whose top tracks the
hero's bottom, so the two travelled in lockstep and nothing moved against
anything. Rule 1 undoes the corridor's hold on purpose, so the hold moves to
`#about`'s children: the Trinny proposal's rule 3a (ADR-094's route sheet),
inherited verbatim as the route sheet's rule 1a, since the `#about` markup is
byte-identical. A scroll-driven animation behind `@supports`, capable rung
only, holding the children and never the station.

Measured with real wheel steps: the content holds at 243.2px (1440×900) and
355.1px (1920×1247) across the hero's whole travel with a 0.00px spread under a
continuous wheel, releases into flow continuously at one viewport, the active
station stays `hero` until the midline and no page errors.

⚠ **THE GROUND IS HELD TOO** (owner, same day: the section's "background also
moves up"). Holding the children left the station's own paint riding the
scroll under them, because the void + stars tile and the `::before` wash are
both on the station's box. The tile moves onto `#about::after` at z −1 and
both pseudos take the same hold; the station keeps `--void` as its colour. It
covers the uncovered strip only while the station is at least one viewport
tall (measured 894 at 1280×720 through 1440 at 2560×1440, its `min-height`
holding the tall end). ⚠ **The Trinny route's rule 3a has the same gap by
construction** (it holds `#about > *` alone) and was not touched. Measured as
pixels on the ground beside the bio at 1440×900, between two scroll positions
inside the hold: ~3,000 pixels differ with the fix (the wordmark docking at
half a viewport) against ~196,000 without it. (Superseded on mechanism by
Update 2: the ground now lives on the turn's stage.)

## Update 2 (2026-09-30, owner): About turns into the Arc's first frame

The owner: "flip the profile picture in the about section to then reveal the
brandmark gateway … the text on the left to glitch transform into the text on
the left of [the Arc's first frame] + the button. So instead of boringly
scrolling from the second to the third section, we use a cool transition
before we enter our arc; let's make sure though we don't break our arc."
Asked, he chose the brandmark ON THE BACK of the card (it settles onto the
Arc's own mark, then the gateway opens around it) and a short read first.

**The mechanism is the homepage's curtain, one station later.** `#about`
takes a runway (`100svh + 50svh dwell + 100svh run`) and its content moves
into a sticky 100svh stage (`.tw-about-stage`, a prototype wrapper that is
`display: contents` off the rung). The corridor mount is WELDED up under the
station's last viewport by exactly the run (`margin-top: -100svh`), so About
unpins on the frame the corridor pins, and for the whole run the corridor is
ARMED, painting its parked frame at paintProgress 0. While the writer's stamp
is up, rule 1 is undone and the entry hold goes back to `position: fixed` on a
`--void` cell (the canvas is transparent and the mount's own void starts only
at its top), with `.hero` z 5 > `#about` z 4 > the host's z 3. The live frame
is then held still behind the About exactly as it is behind the hero on `/`.

**The choreography is one scrubbed clock** (`about-turn/aboutTurnClock.ts`,
pure; `useAboutTurn.ts` is the one writer, mounted from `WorkshopPortals`):

- the name, role and bio carried OUT on per-line leaves (scramble; the bio
  un-types), the fact row and the links closing on the centre-out aperture;
- the rings and halo closing in onto the card on their own clip;
- the portrait turning 0 → 90° on the CSS `rotate` property (the reveal owns
  `transform`), then a `BrandmarkGlyph` stand-in (`TurnMark`, a nested root)
  turning −90° → the live mark's tilt while it lands on the live mark's rect;
- a SQUARE aperture (the compass gate's own shape) opening in the stage's
  ground out of the mark's centre onto the live frame;
- the thesis carried IN on leaves posed on the LIVE copy's own lines, and the
  live button opening on the aperture. At `u ≥ 0.96` everything hands over
  and the stage goes away.

**What the measurement found:**

- ⚠ **A TEXT `Range`'s HEIGHT IS ROUNDED TO WHOLE PIXELS** (33 against a
  32.79px line box on the thesis title), so `headCarrier`'s half-leading
  arithmetic put leaves up to 0.91px off their lines at 1280×720. The carrier
  now lays each leaf out once, reads its own first word the way the source's
  was read, and takes the difference off. Measured weld: ≤ 0.016px at both
  ends, at 1280×720, 1440×900 and 1920×1247. The stand-in mark: 0.01px.
- ⚠ **`dress` copies the face, not the box.** The bio's gold highlight, the
  entity underline and the title's gold-wash marker are box styles on inline
  owners, so each leaf is a block (the face, the line box) around an inline
  ink span (the owner's background, padding, shadow, decoration).
- ⚠ **The role's hairline is a pseudo the leaf does not carry**, so the role
  hides by `-webkit-text-fill-color`, never `color`, which `dress` would copy
  onto its leaf as transparent.
- ⚠ **The reveal transitions `clip-path` over ~880ms** on the rings, halo and
  corner readouts; the turn's clip on them turns the transition off while it
  runs, or the scrubbed clip would trail the scroll by most of a second.
- The Arc is untouched: driven with real wheel steps, the phase runs thesis →
  navigate → encode → build and the proof stack arrives, the CTA takes the
  pointer after the hand-over, scrolling back restores the static About, and
  there are no page errors. Phones, reduced motion and windows under 681px
  tall get the static About, byte-identical.

## Left open

- The arc's `hero` record is unused by this route and kept because the type
  requires it; its actions point at live anchors.
- `useNestedRoot` is imported from the Trinny route's folder; a third consumer
  would argue for lifting it into `components/landing/`.
