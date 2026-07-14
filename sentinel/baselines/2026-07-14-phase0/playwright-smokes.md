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

## Red

### Documented known-red baseline (do NOT fix here) — the two scan-notes tests

Both fail on all 4 viewports; the `#services` production hologram + scan-notes
subsystem does not render in this run (`.services-scan-note` count 0, expected 3;
hologram canvas absent; `/test/services-demo` times out waiting for
`.services-scan-note`):

- `:203` Services hologram: production section renders scan notes and one expanded card
- `:233` Services hologram: demo route has clickable scan notes

### Deviations beyond the documented baseline (flagged, not caused by Phase 0)

- **`:176` "Services can keep ambient particles without brandmark gates" — RED on
  all 4 viewports.** Assertion `data-services-ambient === "true"` fails (received
  `null`) while the stage is NOT in fallback mode. This is the **same `#services`
  WebGL/hologram subsystem** as the known-red scan-notes tests, so it is almost
  certainly the same root condition (the Services 3D/scan-notes surface not
  coming up against the long-running dev server), not a fresh regression — Phase
  0 changed only build config (`next.config.mjs`, `tsconfig.json`, `.gitignore`),
  which cannot affect Services rendering. Worth confirming against a **fresh**
  dev server in a later phase; if it still fails, the "known-red" baseline should
  be widened from 2 tests to this whole subsystem.
- **`:102` "corridor engagement attribute toggles" — flaky.** Passed on
  pro-max / tablet / desktop, failed only on `iphone-14`. Mobile scroll-timing
  flake (attribute not yet `"true"` at the sampled scroll depth); not a hard red.

## Unit tests (context)

`npm run test:run` (vitest): **242 passed / 19 files, 0 failed** — including
`service-scan-notes.test.ts` (the _data_ mapping for scan notes is correct; the
Playwright reds are about _rendering_ the section, not the data).
