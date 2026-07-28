# Rule: Proof station / client cases

`#proof` is the corridor's **evidence beat** — one client case told as a
mission report plus three beats mapped onto the Arc. A "case" is content
in `lib/cases/`; it is NOT an "arc page" (`/arcs/[slug]`, a ported deck)
and NOT `arc-cases/` (the corridor's four-tool card, which belongs to the
Arc). See LANGUAGE.md.

**Read first**

- [ADR-054: Proof station + client cases](../sentinel/decisions/054-proof-station-client-cases.md)
- [ADR-008: Landing v7 background layers](../sentinel/decisions/008-landing-v7-background-layers.md) — the compositing rules the station obeys
- [ADR-047: About deck flip](../sentinel/decisions/047-about-deck-flip-stage.md) — the beat before, whose exit `#proof` covers
- [ADR-048: Editorial band](../sentinel/decisions/048-editorial-band.md)

## Contracts

- **No scroll writer, no portal, no canvas coupling, no flag.** The head
  DOES pin (ADR-054 U1) — but with a plain CSS sticky inside
  `.proof__report-runway`, not a stage with a clock. `#services` and
  `#about` need clocks because they drive the WebGL canvas; this station
  only has to stay put. A change that wants a clock, a portal or canvas
  coupling here is a new ADR, not a retune.
- **The head's reveal is the DECODE, not `data-m` — and the head carries
  NO `data-m` at all.** `ProofRevealController` scramble-decodes the title
  lines and types the lede in place, mirroring `ServicesMasthead`
  (ADR-044); the survey chrome, state chip, stat row and meta register
  reveal via `.proof__report[data-reveal]` CSS (hidden while armed,
  in-place fade at the park; statically visible when the attribute is
  absent). Do not put a `data-m` role back on ANYTHING inside
  `.proof__report` — an IO-fired data-m reveal plays while the sticky head
  is still travelling, and eyebrow/frame add a rise (ADR-054 U2 round 2;
  the BEATS keep their data-m roles). Arrival is an IntersectionObserver
  (no clock exists here to read) whose root is collapsed to a thin band at
  the TOP of the viewport, so it fires when the sticky head reaches its
  PARK — nothing in the head may be visible, or move, before that (the
  services masthead carries the same park gate, ADR-044 round 2 — retune
  both or neither). Enhanced tier only; mobile / PRM / no-JS keep the
  static copy the markup already ships.
- **`#proof` is the ambient cover.** `useCorridorExitScroll` resolves
  `nextStation = ABOUT_DECK_STAGE ? (#proof ?? #practice) : (#about ?? #proof)`.
  The ambient bottom gate and the fade envelope MUST read the SAME rect —
  splitting them hard-cuts the canvas at the station's top (the ADR-030 §6
  seam bug, recorded twice). The station is opaque and needs no shield var;
  do not give it one.
- **Content = `lib/cases/` only.** A copy change is a content-module edit
  plus `npx vitest run tests/lib/cases-registry.test.ts`. `lib/cases/types.ts`
  keeps **zero imports**; nothing under `lib/cases/` may import react, three,
  or supabase (landing-performance doctrine — it is consumed by a server
  module and must never reach First Load JS).
- **Markup is GENERATED.** `lib/v7-parse/proofStation.ts` renders the case
  into the authored `[data-proof-body]` shell via `ParseOptions.fillSlots`.
  Its output must **escape every interpolated field** and contain **no HTML
  comments** (the ship-weight trim runs after the fill and would eat them).
  Class names are that generator's contract — rename in the builder and the
  CSS together.
- **Never a portal here.** `data-m` reveals only work because the nodes are
  in the `dangerouslySetInnerHTML` tree at mount; `useRevealMotion` cannot
  see portal children.
- **`data-m="title"` / `"eyebrow"` / `"portrait"` CLIP to the border box**
  (`clip-path: inset(...)`, and `inset(0px)` still clips once revealed). An
  element carrying one of those roles can never host children positioned
  OUTSIDE it — the survey chrome (labels above, stamps below, marks beyond
  the corners) silently vanishes. Put the role on the COPY element and
  leave the chrome in the unclipped plate; `data-m="fade"` is the one role
  with neither clip nor transform, so decorative outboard pieces use it.
- **Tool copy is referenced, never restated.** A `tool-strip` stores ids;
  `PROJECT_CASES` (`components/landing/v7/tools-cards/toolCardData.ts`) stays
  canonical for the four tools. The corridor's arc-cases card owns their
  challenge/shift/capabilities — the Build beat carries pattern, numbers and
  handoff only.
- **No subsection register anywhere.** `PROOF_SUBS` — the corridor menu's
  hardcoded duplicate of `caseBeatMenu(PROOF_CASE)` — retired with that
  menu (ADR-055 dropped subsections site-wide; the journey readout in the
  nav corner names stations only). `caseBeatMenu` survives as registry
  data, guarded by its shape test. Do not reintroduce a beat register.
- **Zig-zag:** mirroring is derived from beat index parity; there is no
  `flip` field in the data. DOM order is ALWAYS copy-then-visual. Both grid
  children are pinned to `grid-row: 1` — column placement alone makes a
  flipped beat wrap to a second row and render diagonally at double height.
- **Band tokens only.** `--band-max` / `--rail-inset` / `--band-copy`; never
  a per-section body size (ADR-048 — a local override re-opens the crossover).
- **`.services-masthead` is the type + placement gold standard** (ADR-044).
  `.proof__title` and `.proof__beat-title` are its recipe verbatim — PP Neue
  Montreal, weight 400 (em 500 gold), POSITIVE `0.04em` tracking, `1.1`
  leading, uppercase, gold-wash shadow — the beat titles only one size step
  down. `.proof__lede` is `.services-masthead__intro`: weight 400 at
  `--band-copy`, full dawn, 42ch. Copy starts ON `--band-top` with the
  survey chrome hung outboard; the `--survey-*` offsets are that station's
  values. Retune both stations together or neither.
- **No italics.** Emphasis is `CaseTitle.em` (upright gold) or a
  `CaseSegment` `{ em }` (the gold-wash caption marker). Markup smuggled into
  copy strings fails the registry test.

## Confidentiality envelope

This is client work on a public page. `tests/lib/cases-registry.test.ts`
enforces it mechanically — treat a failure as a real incident, never as a
test to relax:

- **No money.** No currency symbols or codes, no amounts with thousands
  separators. No spend, commit, contract value, or per-seat pricing.
- **No internal links.** No board links, no repo links, no private repo
  names.
- **First names only** for client staff, in quotes and anywhere else.
- Tool **codenames are in scope** for a case study (published precedent:
  `PROJECT_CASES`) but stay OUT of general service copy
  (`services/serviceDesignations.ts`).
- Where sources disagree on a number, print the **smaller, exec-facing**
  one and never show the other. Do not publish a second variant of a claim
  that already appears on another surface — check `lib/arcs/content/**` first.

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) — Cycle B
when adding a case or a `CaseVisual` kind; Cycle A after fixes.
