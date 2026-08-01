# Plan: Casefile — reclaim the top tick, fix the foot's legibility, give row one its own brief

**Status:** planned, not implemented · **Date:** 2026-08-01 · **Surface:** ADR-056

## Context

The proof casefile (**ADR-056**) is the evidence beat at the top of `#services` —
the most important surface on the page. Two owner complaints, on a MacBook Air:

1. **The bottom-right panel's text is too small**, and the panels could sit higher.
2. **`01_AI-TRANSFORMATION/` doesn't say much**, despite being the largest piece of
   the work.

Both have concrete, mechanical causes — and (1) is worse than reported.

### What the measurements found

Driven with real scrolls to proofP 0.25, computed styles and rects read live:

**The foot is already clipping in production.** `.fl-panel__foot` is
`overflow: hidden` with no test, and its content already exceeds the box:

| viewport  | `.fl-panel__foot` overflow | `.fl-plate` overflow |
| --------- | -------------------------- | -------------------- |
| 1280×720  | **24px**                   | **11px**             |
| 1366×768  | **7px**                    | **1px**              |
| 1440×800  | **4px**                    | 0                    |
| 1440×820  | 0                          | 0                    |
| 1920×1080 | 0                          | 0                    |

The `SOURCE — ADOPTION BOARD · REV 2026.07` line is the first thing cut. This is
the "boxes clip silently" hazard [`.claude/rules/proof.md`](../../.claude/rules/proof.md)
warns about, landing on the foot rather than the plate. **Both bugs are
pre-existing** — invisible at 1920×1080, which is where this gets authored.

**The type never got the Update 9 pass.** ADR-056 Update 9 (second pass) stated the
law out loud: _8.5px is the CHROME floor; content reads at `--fl-copy` and never
below the 10.5px directory reading size._ That pass fixed the tool gallery only.
The `registry` plate and the shared foot — which every one of the eight rows
renders — were never revisited. At 1440: readout captions **8.5px**, exemplar rows
**9.5px**, glosses **11.63px** against a `--fl-copy` of 14.9px. The three
`max-height` steps in `casefile.css` touch `.fl-toolid__*` / `.fl-cap__d` only, so
this panel's type is byte-identical at 1440×800 and 1920×1080.

**Bigger type is impossible without moving the ladder.** At 800h the foot needs
130.4px in a 130.2px box. Every zone is absolutely positioned against the 13-tick
rail ladder, so there is no give.

**There is a full dead tick above the instrument.** The tab strip's underline seats
on `--fl-t2` (16.667%), leaving 155px of empty band above it at 1440×800 while the
rail itself starts at 99px. `--fl-t7` (58.333%) is declared in `casefile.css:118`
and **referenced nowhere** since the 2026-07-30 `t7 → t6` seam move.

**Row one has no copy of its own.** `CaseCasefile.brief` and `.classLine` are
casefile-level and identical for all eight rows (`ServicesCasefile.tsx:298-304`
renders `file.classLine` / `file.brief`; only the heading comes from `track`). The
paragraph the owner is reading is the standing Loop brief — it _cannot_ be specific
to the transformation, because it also has to serve the films row and the tools row.
AI Transformation owns a two-word heading and a plate. Nothing else.

### Owner decisions taken

- **The claim for row one: "the decision is the work."** Eighteen months deciding
  which work should run on which intelligence — recorded per team, with "stays
  human" recorded as an answer, not a gap (ADR-056 U10 calls that row load-bearing).
- **Geometry: both ticks.** Section rule `t2 → t1`, viz/foot rule `t8 → t7`.
  Accepted cost: the viz rule leaves the labelled bearing-5 major.

---

## The change

### 1. Geometry — one tick up, in `casefile.css`

Both target positions are real ticks on the rail ladder
([`lib/v7-parse/hudTicks.ts`](../../lib/v7-parse/hudTicks.ts) declares 8.33% and
58.33%), so the alignment law holds.

- **Hoist `--fl-tabs-h: 44px` from `.fl-tabs` (line 366) up to the `.fl-case` token
  block** (~line 102). Required: the guard below references it, and a var scoped to
  `.fl-tabs` resolves to nothing on `.fl-case` — this silently invalidates the whole
  `max()` and collapses the layout to `top: 0`. Verified by hitting it.
- Declare `--fl-t1: calc(var(--fl-rail-top) + var(--fl-rail-h) * 0.08333)`.
- Declare the guarded section anchor:

  ```css
  --fl-sec: max(var(--fl-t1), calc(var(--fl-rail-top) + var(--fl-tabs-h) + 10px));
  ```

  The guard is load-bearing: at 1280×720 the raw `t1` puts the tab strip **1px**
  below the rail top. The `max()` degrades it to a 36px rise there and a full
  46–68px rise from 1440×800 up, holding a 10px clearance at every size.

- Repoint `.fl-tabs` (`top`), `.fl-rule--section` (`top`) and `--fl-body-top` at
  `--fl-sec` instead of `--fl-t2`.
- Repoint `--fl-viz-split` and `.fl-rule--viz` at `--fl-t7` instead of `--fl-t8`.

**Follows automatically, no edit needed** (verified by measurement): `.fl-split`,
`.fl-brief`, `.fl-panel`, `.fl-ret--tr` all read `--fl-body-top`; `.fl-rule--brief`,
`.fl-dir`, `--fl-split-end`, `.fl-foot` telemetry and `.fl-ret--bl` read `--fl-t6` /
`--fl-t11`, which do not move. The directory is byte-identical at every viewport.
`--fl-t2` and `--fl-t8` become unreferenced — delete them rather than leaving two
more dead ticks next to the one this change revives.

Measured result:

|                      | 1440×800          | 1440×820          | 1920×1080         |
| -------------------- | ----------------- | ----------------- | ----------------- |
| `.fl-panel__foot`    | 130.2 → **180.3** | 134.7 → **186.3** | 184.5 → **252.7** |
| `.fl-brief`          | 170.7 → **216.8** | 175.9 → **225.0** | 232.7 → **300.9** |
| `.fl-plate`          | 237.6 → 233.7     | 246.1 → 243.6     | 338.9 → 338.9     |
| dead band above tabs | 155 → **109**     | 160 → **111**     | 223 → **155**     |

The plate is deliberately near-constant — the 3-row ceiling and the no-footer rule
(ADR-056 U10) are preserved and need no re-litigation.

### 2. Type — apply the Update 9 law to the plate and the foot

Content off the chrome floor; chrome (`.fl-source`, `.fl-tele`, `.fl-desig`,
`.fl-reg__team`, `.fl-reg__tag`) unchanged.

| selector                                            | now                | to           | why                                                      |
| --------------------------------------------------- | ------------------ | ------------ | -------------------------------------------------------- |
| `.fl-readout__k` (the captions under 22/21/05)      | 8.5px              | **10.5px**   | content at the chrome floor — the exact mistake U9 named |
| `.fl-reg__row` → `.fl-reg__skill` (NDA pre-check …) | 9.5px              | **10.5px**   | the exemplars are the argument                           |
| `.fl-reg__gloss` (the five shape descriptions)      | `--fl-copy × 0.78` | **`× 0.88`** | 11.63 → 13.12 at 1440                                    |
| `.fl-ctx__v` (2024 · ONGOING …)                     | 9px                | **10px**     | content                                                  |
| `.fl-ctx__k` (PERIOD/SCOPE/UNIT)                    | 8.5px              | **9px**      | leader keys stay chrome-ish                              |

The plate absorbs its bump with **density out of the padding, never the type** —
the Update 5 lever: `.fl-reg__groups` margin/padding `clamp(10px,1.6svh,16px)` →
`clamp(8px,1.2svh,14px)`, `.fl-reg__row` padding `4px` → `3px`.

Simulated live at four viewports: **foot overflow 0 everywhere** (was 24/4), plate
overflow 0 at 1440×800 and up.

**1280×720 needs one more rung.** The plate is 18px over there (it was 11px over
before this change). Add a `@media (max-height: 760px)` step that trims
`.fl-reg__gloss` line-height and the groups divider — mirroring the existing
tools-gallery ladder at `casefile.css:1364`, which already treats 720p as a designed
degradation rather than a target.

### 3. Content — a per-track brief

- [`lib/cases/types.ts`](../../lib/cases/types.ts) — add
  `brief?: readonly CaseSegment[]` to `CaseTrack`. The zero-imports contract is
  unaffected (`CaseSegment` is local).
- `ServicesCasefile.tsx:304` — `{(track.brief ?? file.brief).map(renderSegment)}`.
  Same optional-with-fallback idiom `stamp` already uses; the other seven rows are
  untouched.
- **Do NOT make `classLine` per-track.** It is a `data-fl-text` decode target and
  the decode effect caches nodes once per client (dep `[def.slug]`), so a
  track-reactive target goes stale on the first row switch — the trap already
  documented for `project` (`ServicesCasefile.tsx:289-293`). `brief` is not a decode
  target, so it is safe.
- [`lib/cases/content/loop-earplugs.ts`](../../lib/cases/content/loop-earplugs.ts) —
  give the `ai-transformation` track a brief. Direction (final wording to be
  measured, not eyeballed):

  > Most AI work starts by picking a tool. This started by deciding
  > **{ em: "which work should run on which intelligence" }** — team by team,
  > workflow by workflow, with the answer written down. Some of it became a Skill
  > they own. Some became a tool. Some stays human, and that is on the record too.

  Emphasis is `{ em }` (upright gold wash) — **no italics**, pinned by the registry
  test. The +46px of brief height raises the budget from ~195 chars to roughly ~330
  at 1280×720; this draft is ~280. Measure before committing.

  Envelope reminders ([`tests/lib/cases-registry.test.ts`](../../tests/lib/cases-registry.test.ts)
  enforces): no currency, no comma-separated amounts, first names only, no
  `15+ teams` / `20+ Skills` / `90%`. `lib/arcs/content/ai-keynote.ts` already
  publishes "AI adoption lead, Loop Earplugs" while ADR-056 U10 says "Intelligence
  Architect" — pick one before any new role copy ships.

- With the captions now legible at 10.5px, the three readout labels are worth a
  second look in the same pass (optional; `readouts` is pinned to 2–4).

---

## Files

| file                                                                                            | change                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [casefile.css](../../components/landing/home-v2/services/casefile/casefile.css)                 | tokens ~L102-135, `.fl-tabs` L366/370, `.fl-rule--section` L453, `.fl-rule--viz` L469, `.fl-reg__groups` L972, `.fl-reg__gloss` L994, `.fl-reg__row` L1005, `.fl-readout__k` L818, `.fl-ctx__k` L857, `.fl-ctx__v` L868, new `max-height: 760px` step near L1364 |
| [types.ts](../../lib/cases/types.ts)                                                            | `CaseTrack.brief?`                                                                                                                                                                                                                                               |
| [ServicesCasefile.tsx](../../components/landing/home-v2/services/casefile/ServicesCasefile.tsx) | `track.brief ?? file.brief` (L304)                                                                                                                                                                                                                               |
| [loop-earplugs.ts](../../lib/cases/content/loop-earplugs.ts)                                    | brief on the `ai-transformation` track (~L319-359)                                                                                                                                                                                                               |
| [cases-registry.test.ts](../../tests/lib/cases-registry.test.ts)                                | pin the brief budget                                                                                                                                                                                                                                             |
| [services-ring-smoke.spec.ts](../../tests/visual/services-ring-smoke.spec.ts)                   | no-clip assertion                                                                                                                                                                                                                                                |

Leave `app/(internal)/test/field-log-lab/field-log-lab.css` alone — it is a stale
look-dev fork that still uses `--fl-t7` at L311/461/563/564 and does not track
production. Note it in the ADR so the next person is not misled.

---

## Tests and docs

- **Add the guard that would have caught both bugs.** `services-ring-smoke.spec.ts`
  gains a case at 1440×800 asserting `scrollHeight <= clientHeight` for
  `.fl-panel__foot`, `.fl-plate` and `.fl-brief` **across all eight directory rows**
  — the plate kinds differ per row and only row 04 has any height handling today.
  Drive real scrolls (a teleport leaves the canvas dead).
- `cases-registry.test.ts` — pin `CaseTrack.brief` joined length ≤330 chars. The
  ~195-char casefile-brief budget is currently comment-and-measurement only; pin
  that too while in there.
- **ADR-056 Update 11** — the tick move, the guard, the two pre-existing clipping
  bugs, the type law finally reaching the plate and foot, and the per-track brief.
  Record explicitly that the viz rule left the bearing-5 major, and why.
- [`.claude/rules/proof.md`](../../.claude/rules/proof.md) — the geometry contract
  says "the two section rules land on tick 2 and the bearing-5 major". That sentence
  becomes wrong; update it, and add the foot to the silent-clipping warning.
- [MAINTENANCE.md](../../sentinel/MAINTENANCE.md) **Cycle B** — this adds a content
  capability (`CaseTrack.brief`), not just a fix.

---

## Verification

1. **Geometry + clipping**, the gate. Drive real scrolls to the casefile dwell and
   read `scrollHeight − clientHeight` for `.fl-panel__foot`, `.fl-plate`,
   `.fl-brief` at **1280×720, 1366×768, 1440×800, 1440×820, 1600×900, 1920×1080** —
   for **every one of the eight rows**, not just row one. Target: 0 everywhere at
   1440 and up; 720p degrades by design and must degrade _visibly_, not by slicing a
   tag mid-glyph.
2. **The top band.** Confirm the tab strip clears `--fl-rail-top` by ≥10px at every
   size, and check what it lands on during arrival: the corridor's exiting station
   header (`.home-v2-station-header__title`) measures y 62–114 at 1440×820 at proofP
   0.25, and the strip moves to y 110. Sample its opacity across the dissipate — if
   it is still painting, raise the guard rather than accept an overlap.
3. **Reverse traversal.** Scroll back from the ring into the dwell. ADR-056 U3's
   `REARM_BELOW` is derived from `REVEAL_AT`, and neither clock is touched here, but
   the masthead shares the band the tab strip just moved into — confirm no collision.
4. **Arrival and departure at rest.** The zero-at-rest law: every `[data-fl-panel]`
   travel and the iris insets must be exactly 0 / negative at rest after the move.
   Scroll in and back out; confirm no residual transform and no amputated reticle
   (the Update 2 regression).
5. `npm run verify` and `npx playwright test tests/visual/services-ring-smoke.spec.ts`
   (18 baseline).
6. Frame probe on a cool machine —
   [`scripts/probe-corridor-frames.mjs`](../../scripts/probe-corridor-frames.mjs).
   Baseline from ADR-056 U9: corridor-mid 16.9 / dissipate-approach 22.1 /
   casefile-dwell 17.7 / ring-zone 16.8. This change adds no per-frame work, so a
   regression means something else moved.
7. Screenshot 1440×800 and 1920×1080 for the owner before/after.

## Risks

- **The tab strip's new band is contested during arrival** (item 2). The one thing
  here that could look wrong rather than measure wrong. If the station header is
  still painting, the fallback is a larger guard constant — the layout degrades
  gracefully by design.
- **1280×720 stays a designed degradation.** It is already clipping today; this
  change improves the foot there (24px → 0) and worsens the plate (11px → 18px)
  before the `max-height: 760px` rung lands. That rung is not optional.
- **The viz rule leaves the labelled bearing-5 major.** Owner-accepted, but it is a
  stated ADR-056 law and must be recorded as superseded rather than quietly changed.
