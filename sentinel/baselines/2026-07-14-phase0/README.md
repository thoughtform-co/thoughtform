# Phase 0 baselines — 2026-07-14

> Measurement snapshot captured at the start of the approved cleanup plan, on
> `main` @ `776dc74` (+ the Phase 0 `NEXT_DIST_DIR` guardrail). Nothing
> product-visible changed to produce these numbers. Use this directory as the
> **before** picture for later phases (delete-only hygiene, dependency work,
> perf).

## How to reproduce

| Capture      | Command                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| Bundle       | `NEXT_DIST_DIR=.next-verify npm run analyze` (then read `.next-verify/analyze/client.html`)                        |
| ESLint       | `npx eslint . -f json`                                                                                             |
| react-doctor | `npx react-doctor@0.7.7 . --json` (clear caches first — see [react-doctor.md](react-doctor.md))                    |
| Playwright   | `npx playwright test tests/visual/*-smoke.spec.ts --reporter=list` (reuses dev server on 3003)                     |
| Lighthouse   | `CHROME_PATH=<chrome> npx lighthouse https://www.thoughtform.co/ [--preset=desktop] --only-categories=performance` |

## Headline numbers

| Metric                                   | Value                                             |
| ---------------------------------------- | ------------------------------------------------- |
| Landing `/` First Load JS                | **449.8 kB gzip** / 1553.7 kB min (27 chunks)     |
| three.js core chunk (`b536a0f1`)         | **665.7 kB min / 166.5 kB gzip** (~37% of / gzip) |
| ESLint                                   | **0 errors, 470 warnings**                        |
| react-doctor score (thoughtform-website) | **30 / 100 ("Critical")** — was 13 polluted       |
| react-doctor score (@thoughtform/ui)     | 76 / 100 ("Needs work")                           |
| Playwright smokes                        | 87 passed / 13 failed / 32 skipped                |
| Lighthouse desktop / mobile (perf)       | **99 / 73**                                       |
| Lighthouse mobile LCP                    | **8.2 s** (desktop 0.9 s)                         |

## Files

- [bundle.md](bundle.md) — First Load JS, three.js chunk, route/chunk tables
- [eslint.md](eslint.md) — warning count + per-rule breakdown
- [react-doctor.md](react-doctor.md) — true post-prune score + findings by rule
- [playwright-smokes.md](playwright-smokes.md) — green-list + documented known-red
- [lighthouse.md](lighthouse.md) — LCP / CLS / TBT (mobile + desktop)

## Environment

- Next.js 16.2.6 (webpack build), React 19.2.6, three 0.170, Node v22.16.0, npm 10.9.2
- Windows 11; Chrome for Lighthouse at `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Bundle + build captured into `.next-verify` (env-gated distDir) so the running dev
  server's `.next` was never clobbered.
