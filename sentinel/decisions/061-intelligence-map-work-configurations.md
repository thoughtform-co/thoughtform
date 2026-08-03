# ADR-061: The Intelligence Map is a field of work configurations

**Status:** Accepted · 2026-08-03
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

The field is physically compact. At 1440×800 the visualization is about
690×240 and the active stage about 144px high; at 2017×1269 the same surface
is about 862×429 with a 313px stage. Putting every component and every label
into that box would turn the most important idea on the page into an
unreadable systems diagram.

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
not the moving field and it is not a fourth tab.

The reservoir keeps stable identities across the whole instrument. Selection
may highlight the Skills a configuration draws on, and the detail surface may
name them, but changing projection does not regroup the reservoir. Its count
is a Skills count; a work-configuration count is a different measure and must
never borrow the `47+` claim.

On a constrained surface the reservoir may compress into a labelled summary
and reveal its members on demand. Compression may change presentation, never
the underlying set or its role in the model.

### 3. Exactly three projections

The tabs are **CONFIGURATION · TEAM · ALLOCATION**, in that order. All three
are projections of the same work-configuration nodes:

- **CONFIGURATION** is the default explanatory view. It groups the work by its
  work shape and exposes the selected node's six-part anatomy and Skill
  references against the fixed reservoir. It answers “what has been configured
  to do the work?” without becoming a layer inventory.
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

### 5. Compact field, focused overlay

The field teaches the system in two layers:

1. A compact node carries a stable mark, a short work identity and at most one
   projection-specific signal. The head register always names the selected
   work configuration, so the plate is never an unexplained field of symbols.
2. Selection opens an inward detail rail with the configuration anatomy: work
   and outcome, public function, six facets, referenced Skills, broad owner
   role, human checkpoint, capability lane and evidence basis.
3. `EXPAND MAP` click-loads the same controlled field inside a body-portalled
   ADR-006 focus overlay. Projection, selection and allocation focus survive
   the seam. The overlay traps focus, locks scroll, dismisses through backdrop
   or Escape and returns focus to its trigger.

Desktop keeps ADR-056 U17's stage-contained, semi-transparent panel sliding
in from the right. The compact rail does not portal through the casefile iris.
The expanded instrument does portal because the casefile clips and translates;
ADR-006 supplies its labelled dialog, restrained glass/border, managed focus,
focus return and fixed-centre placement. The selected work identity persists
across projection changes, so the visitor can see the same configuration from
three directions. Escape unwinds the innermost state first: detail, focused
allocation tier, then expanded overlay.

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
does not join the FLIP. Any relationship lines are derived from the same layout
result, sit behind the DOM nodes and settle with them; they are not a second
animation system.

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
- detail content mounts on selection and glass/blur follows the casefile's
  settled-state gate;
- relationship geometry, if shipped, is recomputed only for selection, layout
  changes and actual container resizes; it never runs in an animation frame or
  feeds measurements back into the layout.

The implementation must preserve the landing First Load seam: the anonymous
route must not acquire the corridor's heavy WebGL dependencies through a map
import.

### 9. Mobile is a deliberate fallback, not a squeezed graph

Mobile and compact-height layouts do not shrink the desktop field until its
labels disappear. They render the same curated data as an in-flow instrument:

- the three projection controls remain available;
- work configurations become grouped compact rows/cards for the selected
  projection, without FLIP;
- the fixed reservoir becomes a `47 Skills · 5 substrate engines` summary with
  an on-demand disclosure;
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
- The compact field can stay intriguing because the overlay carries detail;
  adding another tile label is no longer the default answer to missing context.

## Verification

The following acceptance gates are green:

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
   tier-focus reset, overlay focus trap and focus return are exercised; reduced
   motion performs an immediate swap.
6. Mobile verifies all three grouped fallbacks, reservoir disclosure and
   in-flow/full-width detail without horizontal overflow.
7. The production bundle confirms the DOM map introduced no Three/R3F/Drei or
   graph dependency and no request is made to a private source at runtime.

### Acceptance record · 2026-08-03

- Typecheck and production build pass. Full ESLint exits with zero errors; its
  313 warnings are the repository's existing warning baseline.
- All 39 unit files pass (503 tests), including registry confidentiality,
  deterministic geometry, persistent identity, reduced motion, focus trap,
  focus return and mobile row semantics.
- Desktop Services + corridor smoke passes 19 tests with the two mobile-only
  cases skipped. The dedicated iPhone 14 map smoke passes separately.
- Dark/light viewport inspection at 1280×720, 2017×1269 and 390×844 confirms
  zero node, tier, meter, anchor or field clipping/overlap/overflow. Expanded
  and mobile focus surfaces preserve the same eight configurations.
- The expanded overlay is click-loaded as its own 3,333-byte raw production
  chunk. The map paths contain no Three/R3F/Drei, Supabase, charting or runtime
  private-source fetch.
