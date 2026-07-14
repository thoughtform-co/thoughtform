# Playwright smoke baseline — 2026-07-14 (Phase 0)

`npx playwright test tests/visual/*-smoke.spec.ts --reporter=list`, reusing the
dev server on `http://localhost:3003` (`reuseExistingServer` outside CI).
4 viewport projects: `iphone-14-pro-max` (430), `iphone-14` (390), `tablet`
(768), `desktop` (1440). These are assertion/DOM smokes, not the
screenshot-regression specs.

## Totals

| Suite                                                 | Passed | Failed | Skipped |
| ----------------------------------------------------- | ------ | ------ | ------- |
| `landing-corridor-smoke`                              | 35     | 13     | 0       |
| `arc-cases-card` + `gateway-motion` + `services-ring` | 52     | 0      | 32      |
| **All smokes**                                        | **87** | **13** | **32**  |

The 32 skips are expected guards: `gateway-motion-smoke` self-skips ("gateway:prep
has not been run" — motion manifest/frames not generated locally), and
`arc-cases-card-smoke` skips its desktop-only tests on mobile/tablet and its
mobile absence-check on desktop.

## `landing-corridor-smoke` green-list (pass on all 4 viewports)

- `:29` ADR-018 corridor mount placeholder exists / HomeCorridor renders into it
- `:39` ADR-021 production stations are in the right relative order
- `:67` ADR-018 retired stations are no longer in the DOM
- `:85` ADR-022 corridor entry flag clears once stage releases sticky
- `:116` ADR-021 dock attribute releases on reverse scroll
- `:131` v7-parse dead nav anchors for retired stations are absent
- `:146` ADR-021 amendment seam pixel field is NOT mounted
- `:157` ADR-021 amendment retired in-`#services` brandmark attributes never set

## Red — known-red baseline (do NOT fix here)

> **Warm-server verification (2026-07-14).** The corridor suite was run twice:
> once against a long-running dev server and once against a **freshly started,
> pre-warmed** dev server (`/` and `/test/services-demo` curled to 200 before
> the run). The failure list is **byte-identical in both runs** — 13 failures,
> same tests, same viewports. The Services cluster is therefore a real
> pre-existing red on `main`, **not** a cold-server / compile-timeout artifact.
> Phase 0's diff is build-config + docs only and cannot affect rendering.

### The Services-hologram cluster (12 instances = 3 tests × 4 viewports)

The known-red baseline is the **whole retired-Services-markup cluster**, not
just the two scan-notes tests:

- `:203` Services hologram: production section renders scan notes and one expanded card
- `:233` Services hologram: demo route has clickable scan notes
- `:176` ADR-021 follow-up: Services can keep ambient particles without brandmark gates

**Root cause — stale tests asserting retired markup, predating Phase 0.**
The `.services-scan-note` / `.services-expanded-card` selectors these tests
assert exist **only in the test file**: no product source renders them anymore.
The Services section was reworked through ADR-029 (services card ring), ADR-030
(tools cover stack) and ADR-033 Phases C/D ("Funnel: services → about →
continuum → practice; #tools/#build retire", commits `55afc8a` / `b403d40` —
both before this baseline's `776dc74`). The `serviceScanNotes.ts` **data**
module survives and feeds `ServicesStationReadout` — which is why the
`service-scan-notes` unit test stays green while the DOM assertions fail.
For `:176`: `data-services-ambient` is still set by `useCorridorExitScroll`
(line ~185) but only inside the reworked corridor-exit window; the old test's
scroll targeting no longer lands in it. The **newer** `services-ring-smoke`
spec checks the same attribute at the correct seam and **passes**.

Resolution for a later phase: retire or rewrite these three tests against the
current Services markup (per MAINTENANCE Cycle A row 5), not "fix" the product.

### `:102` "corridor engagement attribute toggles" — deterministic iphone-14 red

Failed on `iphone-14` (390×844) in **both** runs and passed on the other three
viewports in both runs — a deterministic viewport-specific threshold/timing red
(2/2 reproduction), not a random flake. Same treatment: baseline it and
investigate the scroll-depth sampling for the 390px viewport in a later phase.

## Unit tests (context)

`npm run test:run` (vitest): **242 passed / 19 files, 0 failed** — including
`service-scan-notes.test.ts` (the _data_ mapping for scan notes is correct; the
Playwright reds are about _rendering_ the section, not the data).
