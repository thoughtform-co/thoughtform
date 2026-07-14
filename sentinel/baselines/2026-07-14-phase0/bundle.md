# Bundle baseline — 2026-07-14 (Phase 0)

Captured with `NEXT_DIST_DIR=.next-verify npm run analyze` (Next.js 16.2.6,
webpack). Numbers extracted from `.next-verify/analyze/client.html`
(`window.chartData`) — the analyzer HTML itself is not committed.

> **Method note.** Next 16's `next build` output no longer prints the
> `Size / First Load JS` columns (it now shows `Revalidate / Expire`). "First
> Load JS" below is reconstructed authoritatively from the analyzer's
> `isInitialByEntrypoint` flags: the sum of every client chunk marked initial
> for that route's entrypoint. Both minified (parsed) and gzip totals are given
> because Next historically reported one number without stating which.

## First Load JS — key routes

| Route                  | Entrypoint                             | First Load JS (gzip) | (minified) | Initial chunks |
| ---------------------- | -------------------------------------- | -------------------- | ---------- | -------------- |
| `/` (landing)          | `app/(marketing)/page`                 | **449.8 kB**         | 1553.7 kB  | 27             |
| `/claude-workshop`     | `app/(marketing)/claude-workshop/page` | 449.8 kB             | 1553.6 kB  | 27             |
| `/astrogation` (admin) | `app/(admin)/astrogation/page`         | 114.3 kB             | 430.8 kB   | 4              |
| `/admin`               | `app/(admin)/admin/page`               | 51.5 kB              | 180.1 kB   | 4              |

The two `(marketing)` routes share the same heavy initial graph (three.js +
R3F corridor). Admin/tool routes are far lighter (no 3D on first load).

## three.js weight

| Bucket                                         | Minified     | gzip         |
| ---------------------------------------------- | ------------ | ------------ |
| **three core** (`node_modules/three/build`)    | 665.6 kB     | 166.5 kB     |
| three `examples/jsm` (scattered across chunks) | ~63 kB       | ~23 kB       |
| **three total**                                | **729.1 kB** | **189.2 kB** |

three core lives entirely in one chunk, **`static/chunks/b536a0f1-*.js`
(665.7 kB min / 166.5 kB gzip)** — that single chunk is ~37% of the landing
route's gzipped First Load JS and is the primary target for any later
lazy-loading / code-split work.

## Largest initial chunks for `/` (landing)

| Chunk           | Minified | gzip     | Notes                      |
| --------------- | -------- | -------- | -------------------------- |
| `b536a0f1-*.js` | 665.7 kB | 166.5 kB | three.js core              |
| `b79b7286-*.js` | 143.1 kB | 45.1 kB  |                            |
| `7553-*.js`     | 125.4 kB | 34.0 kB  | shared vendor (also admin) |
| `7311-*.js`     | 116.0 kB | 35.5 kB  |                            |
| `3376-*.js`     | 73.2 kB  | 21.1 kB  | three `examples/jsm/math`  |
| `3053-*.js`     | 53.1 kB  | 18.9 kB  |                            |
| `c15bf2b0-*.js` | 50.2 kB  | 19.2 kB  |                            |
| `7499-*.js`     | 42.2 kB  | 12.8 kB  |                            |

## Totals

- **All client JS:** 4590.3 kB minified / **1413.4 kB gzip** across **170 chunks**
  (14.05 MB unminified stat size).
- **Route count:** 77 app routes total — `/` + `/claude-workshop` (marketing),
  `/admin`, `/admin/voices`, `/astrogation`, `/orrery` (admin),
  `/archive/current-home` + ~40 `/test/*` (internal, blocked in prod by
  `middleware.ts`), and ~40 `/api/*` route handlers.

## `@thoughtform/ui` workspace package

The analyzer also builds the `packages/ui` workspace. It is small and not part
of the landing route's initial graph; its heaviest flagged surfaces are
`ChamferedFrame`, `InputGroup`, `NavigationBar`.
