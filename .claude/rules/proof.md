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

- **Plain DOM, no runtime.** No pin, no portal, no scroll writer, no
  canvas coupling, no flag. If a change wants any of those, it is a new
  ADR, not a retune.
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
- **Tool copy is referenced, never restated.** A `tool-strip` stores ids;
  `PROJECT_CASES` (`components/landing/v7/tools-cards/toolCardData.ts`) stays
  canonical for the four tools. The corridor's arc-cases card owns their
  challenge/shift/capabilities — the Build beat carries pattern, numbers and
  handoff only.
- **`PROOF_SUBS` in `CorridorSectionMenu` is a deliberate duplicate** of
  `caseBeatMenu(PROOF_CASE)` (a client component must not import the
  registry). Change one, change both — the registry test is the alarm.
- **Zig-zag:** mirroring is derived from beat index parity; there is no
  `flip` field in the data. DOM order is ALWAYS copy-then-visual. Both grid
  children are pinned to `grid-row: 1` — column placement alone makes a
  flipped beat wrap to a second row and render diagonally at double height.
- **Band tokens only.** `--band-max` / `--rail-inset` / `--band-copy`; never
  a per-section body size (ADR-048 — a local override re-opens the crossover).
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
