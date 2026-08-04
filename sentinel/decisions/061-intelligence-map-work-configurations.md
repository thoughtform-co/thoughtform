# ADR-061: The Intelligence Map is a field of work configurations

**Status:** Accepted · 2026-08-04
**Surfaces:** `components/landing/home-v2/services/casefile/**`,
`lib/cases/**`, `components/landing/home-v2/services/casefile/casefile.css`,
`components/landing/v7/theme.css`,
`tests/lib/cases-registry.test.ts`, `tests/lib/*field-layout*.test.ts`,
`tests/visual/services-ring-smoke.spec.ts`
**Extends:** [ADR-056](056-services-proof-casefile.md) Updates 16–17 — the
casefile placement, compact stage and intra-container morph remain; this ADR
changes the atom and the projection semantics
**Related:** [ADR-006](006-focus-overlay-system.md) (focus/detail grammar),
[ADR-031](031-rail-manifest.md) (the viewport-crossing FLIP rejection that
still stands), [ADR-021](021-corridor-exit-zoom-dissipate.md) (no wall-clock
motion),
[ADR-054](054-proof-station-client-cases.md) (public client evidence envelope)

## Context

ADR-056 U17 solved the motion problem and left the meaning problem intact.
The same 47 Skill tiles regroup cleanly under Substrate, Team and Allocation,
but the field still says “Skills inventory” to a first-time reader. That is
smaller than the claim the case has to prove: intelligence is configured from
work, encoded judgment, tools and connectors, model depth, artifacts and the
teams that operate it — then allocated according to the work.

A Skill is therefore source material, not the unit being allocated. Mapping a
Skill directly into a consumption cell also creates a stronger claim than the
evidence supports: the source usage snapshots do not attribute an exact token
count to one Skill. The surface must communicate the shape of the system
without pretending to be live telemetry or publishing the client's private
operating record.

The first work-configuration implementation preserved the casefile's generic
right-hand evidence foot. That left the visual with roughly half the panel's
height and forced selection detail over the field. The resulting 8.5px labels,
scrolling inspector, duplicate shape legend and relationship curves made the
map harder to read than the concept it was meant to clarify. The casefile now
needs one shared evidence hierarchy on the left and one uninterrupted visual
instrument on the right.

## Decision

### 1. The atom is a work configuration

The persistent, selectable, moving node is a **work configuration**: a
repeatable kind of work together with the intelligence arrangement used to
perform it. It is an archetype, not an individual task, prompt, run, employee
or Skill.

Every public work configuration has:

- a stable, non-display `id` and stable ordinal;
- a short, understandable work label and one-sentence outcome;
- one anonymised public function and broad owner role;
- references into the fixed Skill reservoir;
- the same six categorical facets — human, model, Skill, context, execution
  and evaluation — each with a short public state and explanation;
- a generic capability lane — Fast, Everyday, Deep or Frontier — plus an
  explicit allocation basis (`work-evidenced`, `work-evaluated`, or
  `function-signal`);
- lifecycle state, a human checkpoint and a sanitised summary, with provenance
  kept in authoring comments rather than sent to the browser.

The exact TypeScript names may differ, but those semantics may not. React keys,
layout maps, selection and tests use `id`, never the display label. One Skill
may support several work configurations and one configuration may draw on
several Skills. Neither relationship may be collapsed to “one tile = one
Skill.”

### 2. The 47 Skills are a fixed reservoir, not a projection

The canonical 47-Skill set remains visible evidence that judgment has been
encoded. It is a fixed **reservoir** referenced by work configurations; it is
not the moving field and it is not a fourth tab. In the desktop instrument it
is one thin bus labelled `ENCODED SUBSTRATE · 47 SKILLS / 5 SHAPES`, with all
47 stable pips present in five spaced but unlabelled runs.

The reservoir keeps stable identities across the whole instrument. Selection
may highlight the Skills a configuration draws on, and the detail surface may
name them, but changing projection does not regroup the reservoir. Its count
is a Skills count; a work-configuration count is a different measure and must
never borrow the `47+` claim.

The five work-shape names appear once, as the Configuration projection's
vertical anchors. They are not repeated under the bus. Selection lights only
the inherited pips and names those Skills in detail; no relationship SVG or
node-to-pip geometry measurement is part of the contract. On a constrained
surface the reservoir may compress into a labelled summary and reveal its
members on demand. Compression may change presentation, never the underlying
set or its role in the model.

### 3. Exactly three projections

The tabs are **CONFIGURATION · TEAM · ALLOCATION**, in that order. All three
are projections of the same work-configuration nodes:

- **CONFIGURATION** is the default explanatory view. It groups the work by its
  work shape against one vertical taxonomy and exposes the selected node's
  six-part anatomy and Skill references against the fixed reservoir. It answers
  “what has been configured to do the work?” without becoming a layer inventory
  or repeating those shape labels in a legend.
- **TEAM** regroups those same nodes under public functional teams. It answers
  “where is the configuration operated and maintained?” Personal ownership is
  deliberately absent.
- **ALLOCATION** regroups those same nodes under the four generic capability
  lanes and uses aggregate evidence to answer “where does deeper intelligence
  go?” The reach-versus-draw comparison belongs to lane or cohort chrome, not
  to an individual Skill.

Substrate is no longer a projection. Stack remains deleted: tools, Skills,
connectors and model depth are facets of a work configuration and details in
the overlay, not four inventory rows competing with the map.

### 4. Evidence semantics are explicit

This is an **evidence-derived editorial map**, not a monitoring dashboard.

- Work configurations describe recurring work archetypes observed in the
  engagement. They do not enumerate every workflow or claim that every run
  follows one exact path.
- Lifecycle and allocation are separate dimensions. “Shipped” or “in use” is
  not a consumption claim.
- Numeric reach/draw figures appear only at their honest aggregation level:
  capability lane, team cohort or whole snapshot. A work node never carries an
  invented share.
- No Skill receives a token count, token share, cost or implied causal share
  of usage. The source evidence cannot support that attribution.
- Allocation figures are rounded public abstractions from a dated snapshot,
  not live values. Absence of a node or bar is not automatically zero.
- The same curated snapshot and joins drive every projection. A projection may
  change placement and visual emphasis; it may not change the underlying fact.
- Any published total names its unit. Skills, work configurations, teams,
  reach and draw are not interchangeable counts.

The map may communicate the **spirit** of usage and allocation through mass,
density, bands and relative bars. It must not reproduce monthly, per-seat or
person-level source tables.

The surrounding casefile uses one canonical proof model. Every authored track
has four `CaseBlock` records in a left-column 2×2 register. `CaseBlock.value`
is required and textual, because proof values include counts, ratios, formats
and properties such as `DOMAIN-OWNED`; `title` and `desc` supply the label and
support. Legacy `readouts` may be normalized into this register but do not
create a second panel region.

Cross-surface figures and lifecycle labels are parity contracts. `97%` is the
canonical Studio adoption figure in both Proof and the AI keynote. Software
for Few's four capability labels remain `LIVE` while the canonical tool
registry marks all four Production; a future lifecycle change updates both
sources together.

### 5. One reading column, one full-height instrument

The casefile has one stable hierarchy:

- the left column carries selected project identity, classification, summary,
  the four-block proof register and the directory;
- the right panel carries its designation rail and one visual occupying all
  remaining height; there is no generic evidence foot beneath it;
- the Intelligence Map subdivides that visual into controls, decoder, field,
  substrate bus, reserved lower detail console and footer.

The field teaches the system in two layers:

1. A compact node carries a stable mark, a short work identity and at most one
   projection-specific signal. The head register always names the selected
   work configuration, so the plate is never an unexplained field of symbols.
2. The compact lower console always reserves its height. With no selection it
   presents a short prompt. With a selection it shows the work identity,
   function, lifecycle, summary, the six facet **states**, referenced Skill
   names, broad owner role, human checkpoint, capability lane and evidence
   basis. It never overlays the field and never gains an internal scrollbar.
3. `EXPAND MAP` click-loads the same controlled field inside a body-portalled
   ADR-006 focus overlay. It reuses the detail component in expanded mode and
   adds the explanatory prose for each facet. Projection, selection and
   allocation focus survive the seam. The overlay traps focus, locks scroll,
   dismisses through backdrop or Escape and returns focus to its trigger.

The selected work identity persists across projection changes and overlay
expansion, so the visitor can inspect one configuration from three directions.
A projection change never closes selection. Escape unwinds the innermost
transient state without using projection change as an implicit reset.

The visual treatment is flat instrument grammar: solid surfaces, one-pixel
rules, direct labels and categorical marks. Map nodes, lifecycle states,
console and reservoir use no CSS gradients, hatched fills, serif display face
or decorative relationship curves. Gold marks active state; it does not add a
second ornamental layer.

### 6. One deterministic persistent-node morph

The work configurations are flat children of one stable field and are keyed by
stable id. Configuration, Team and Allocation change only their computed
placements and projection chrome. React must not replace the nodes between
views.

The ADR-056 U17 motion laws remain:

- one click captures old rects; one layout effect captures destination rects;
- rects are relative to the stable field, not the viewport;
- placement and keyboard navigation come from one pure deterministic layout
  function whose declared tracks stay synchronized with CSS;
- transforms are inverted before paint and end at computed `none`;
- child order is invariant and `will-change` exists only during the flight;
- an interrupted change starts from the currently painted rect;
- projection chrome may crossfade, but the work nodes may not;
- motion is click-driven only — no scroll-driven regrouping, ambient pulse,
  random jitter, force simulation or spring overshoot;
- reduced motion skips measurement and swaps layout immediately.

The fixed Skill reservoir may highlight links to the current selection, but it
does not join the FLIP. Linked state plus named Skills in the detail component
is the complete relationship treatment. No relationship SVG, ResizeObserver,
node-to-pip rect read or post-morph measurement is allowed.

### 7. Nothing private travels

The Intelligence Map is stricter than the casefile's general “first names
only” quote policy. Across visible copy, hidden props, `data-*`, ARIA text,
analytics payloads and browser-delivered data it carries:

- no personal names, identifying initials or person-level ownership;
- no vendor names or model-family/product names;
- no currency, spend, price, per-seat cost or monetary proxy;
- no exact token counts at Skill, person or workflow level;
- no internal URLs, board/document/repository ids, private repo names or source
  system paths;
- no raw prompt, transcript, document or client artifact content.

Teams are public functional labels. Models become generic capability lanes;
connectors and tools become categories such as boards, mail, documents, design
or commerce. Private Monday, Notion and Aether material is research input for a
curated static content module, never a runtime data source and never a client
payload. A forbidden value is not made safe by hiding it in an overlay or
accessibility label.

### 8. The map stays on the DOM performance seam

The casefile sits over the landing's live WebGL stage. The map remains
DOM/CSS plus a pure layout kernel:

- no `three`, R3F or Drei import on the DOM path and no second canvas;
- no force-directed library, graph simulation or per-frame layout read;
- no runtime Monday/Notion/API fetch and no polling;
- at most the two one-shot rect reads for a click-driven morph;
- no permanent layer promotion; `will-change` is flight-scoped;
- the compact detail slot remains mounted to reserve geometry; selected content
  swaps within it and glass/blur follows the casefile's settled-state gate;
- no relationship geometry or measurement loop exists. Only the bounded FLIP's
  click and destination rect reads are permitted.

The implementation must preserve the landing First Load seam: the anonymous
route must not acquire the corridor's heavy WebGL dependencies through a map
import.

### 9. Mobile is a deliberate fallback, not a squeezed graph

Mobile and compact-height layouts do not shrink the desktop field until its
labels disappear. They render the same curated data as an in-flow instrument:

- the three projection controls remain available;
- work configurations become grouped compact rows/cards for the selected
  projection, without FLIP;
- the fixed reservoir becomes a `47 Skills · 5 shapes` summary with an
  on-demand disclosure;
- selected detail expands in flow or as an accessible full-width sheet, with
  focus return and Escape/back dismissal;
- Allocation keeps generic lane and aggregate evidence semantics, never a
  miniature heatmap that implies precision it cannot show.

Reduced motion may use this immediate-swap behaviour at any width. The mobile
fallback must preserve meaning and access to detail, not desktop geometry.

## Alternatives rejected

### Keep the Skill lattice and add more labels

Rejected because the atom stays wrong. More legends make a denser inventory;
they do not show how work, judgment, tools, artifacts and depth combine.

### Restore Stack as a fourth projection

Rejected again. ADR-056 U17 deleted it because four inventory rows repeated
the brief and the panel foot. Those elements are facets of a configuration,
best disclosed through selection.

### Put Skills, tools, connectors, models, people and artifacts into one graph

Rejected because it makes unlike entities look equivalent, cannot fit the
casefile stage, and invites a force graph or canvas that breaks accessibility
and the landing performance seam.

### Show live or exact token telemetry

Rejected because the available evidence is snapshot-level and cannot honestly
attribute consumption to one Skill. It would also publish operational data,
age immediately and turn a strategic map into a client dashboard.

### Crossfade three separately rendered diagrams

Rejected because the central claim is that the same intelligence resource can
be projected differently. Replacing the objects erases that identity and
regresses ADR-056 U17's strongest interaction.

### Use vendor/model names to make the map concrete

Rejected because product names go stale, distract from work-driven allocation
and carry client configuration data onto a public page. Generic lanes describe
the durable decision.

## Consequences

- The current Skill tile is no longer the field's public atom. Implementation
  requires a work-configuration schema with stable ids and validated Skill
  references before the component is renamed or rearranged.
- Configuration replaces Substrate in the tab set. The reservoir holds the
  substrate evidence without becoming a projection.
- Current Team-level allocation joins are insufficient for the new atom. Each
  public work configuration needs a curated lane and explicit evidence basis;
  only direct work evidence or a same-work evaluation may claim more than a
  function-level signal.
- The fixed reservoir count and the work-configuration count need independent
  labels and guards.
- The compact field stays concise because the overlay carries explanatory
  depth; adding another tile label is no longer the default answer to missing
  context.
- The left proof register is the only cross-track evidence surface. The right
  panel no longer reserves a generic footer, so every track visual owns its
  full height.
- The compact detail console and expanded overlay share one detail component;
  compact mode exposes states and decisions, expanded mode adds facet prose.
- The five vertical work-shape anchors and the 47-pip bus are the only taxonomy
  and substrate treatments. A duplicate shape legend or relationship layer is
  a regression.

## Verification

Acceptance requires all of the following gates:

1. Registry tests pin stable unique configuration ids, valid Skill references,
   the exact three projection names and separate Skill/configuration totals.
2. The browser-facing schema has no person-level owner identity fields,
   token-count fields, vendor/model strings, currency or internal-link fields;
   broad public `ownerRole` categories remain part of the approved inspector.
   The recursive confidentiality scan is deliberately made red once with a
   nested forbidden value to prove the new branch is covered.
3. Layout tests place every work configuration exactly once in every
   projection and derive keyboard rows from the same placement result.
4. The desktop smoke stamps node identities, walks Configuration → Team →
   Allocation → Configuration, awaits the actual settle marker, and proves no
   remount, zero residual transform and no clipping at 1280×720, 1440×800 and
   the tall reference viewport in both themes.
5. Detail selection, projection-persistent identity, outside/Escape dismissal,
   tier-focus reset, overlay focus trap and focus return are exercised. The
   compact console does not overlap or scroll, while expanded detail contains
   the facet prose; reduced motion performs an immediate swap.
6. Mobile verifies all three grouped fallbacks, reservoir disclosure and
   in-flow/full-width detail without horizontal overflow.
7. Visual assertions prove one vertical shape taxonomy, one 47-pip bus, no
   relationship SVG and no computed gradient on nodes or lifecycle states.
8. Registry tests pin required `CaseBlock.value`, four blocks per Loop track,
   97% Proof/keynote parity, all-live Software for Few labels and the existing
   privacy/count contracts.
9. The production bundle confirms the DOM map introduced no Three/R3F/Drei or
   graph dependency and no request is made to a private source at runtime.

### Acceptance record · 2026-08-04

- Registry, layout and interaction coverage passed in the full Vitest run: 40
  files and 509 tests. This includes stable ids, Skill resolution, privacy
  guards, the four-track proof schema, 97% parity, all-live tool labels,
  projection identity, allocation focus, overlay focus/scroll behavior and
  responsive browse ownership.
- Desktop Playwright passed at 1280×720, 1440×800 and 2017×1269. The binding
  viewport exercises all eight compact details and verifies child visibility,
  10px controls, 11px nodes, 12px readable content, 17px selected titles,
  non-overlap, no internal scroll, full-height visuals, Studio summary fit,
  complete tool labels and fully visible tall proof descriptions.
- The combined desktop Services-ring and corridor run passed 20 tests with the
  two mobile-only tests skipped by project design. The existing iPhone 14 map
  smoke also remained green after the safe fallback CSS changes.
- Computed-style assertions passed in both themes: five shape anchors, exactly
  47 unique pips, no relationship SVG and no map gradient. Static scans found
  no stale `CaseBlock.stat`, `ResizeObserver`, heavy visualization import,
  private URL or currency surface in the map paths.
- `npm run typecheck`, Prettier and `git diff --check` passed. ESLint completed
  with zero errors and the repository's existing 313-warning baseline. A fresh
  production build compiled, typechecked and generated all 89 pages. Bundle
  analysis kept the expanded map as a 1.3 kB gzip async chunk outside the
  landing's initial graph, with no Three/R3F/Supabase/charting regression.
