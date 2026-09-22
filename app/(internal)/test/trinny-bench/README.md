# /test/trinny-bench — the Trinny London brand bench

**http://localhost:3003/test/trinny-bench** (dev server; the port is whatever
the running server reports). `?offline=1` rehearses the page against the
harness's deterministic fake grader with the colour layer still real.

A live module: generate a Trinny London product image with the ship's harness,
or drop one in, and have the rubric grade it three times with the body colour
measured in code against the product's own tile. Delaware's engine dashboard
and Moira's workshop bench are curated; this one runs.

## What lives where

| Here (the face)                                                                            | In the ship `../Arcs_Trinny London` (the judgment and the machinery)                           |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `page.tsx` — server route, HUD chrome via `sliceV7Sections([])`, `SheetShell`, `ThemeLock` | `skill/references/rubric.md` — the checks, parsed at every grade                               |
| `TrinnyBench.tsx` — Run / Skill / Evals as three sheet sections                            | `skill/references/colour-bands.json` — each product's band, read from its tile                 |
| `Rail.tsx` — one row per check, a state never a score, `unsure` on a split vote            | `bench/job.py` — the runner: `config`, `generate`, `upload`, `suggest`, `jobs`, `evals`        |
| `Swatches.tsx` — band beside frame, ΔE2000 between                                         | `bench/colour.py`, `bench/grade.py` — the measurement and the measured grade                   |
| `DropZone.tsx`, `History.tsx`, `useJob.ts`, `types.ts`                                     | `tools/` — the Armada harness, never edited                                                    |
| `trinny-bench.css` — `.tb-*`, tokens only, the pitch page's wash                           | Drive `02_Creation/bench/<date>/` — pixels, `MANIFEST.jsonl`, `qa_results.json`, `jobs/*.json` |

The API routes under `app/api/trinny-bench/` spawn `python bench/job.py` in the
ship (`TRINNY_BENCH_REPO`, default `../Arcs_Trinny London`; `TRINNY_BENCH_PYTHON`,
default `python`) and read the job files it writes. They refuse outside
development: there is no Python and no Drive on Vercel, and `proxy.ts` does not
gate `/api`.

## What it never does

- Grade anything itself. Every check is the rubric's, every colour number is
  the runner's; the page renders a job file.
- Hold a key. The runner reads `GEMINI_API_KEY` by name from the ship's
  canonical `.env`.
- Serve an arbitrary file. `img?p=` resolves the path and refuses anything
  outside the Drive root or the ship's `skill/assets`.
- Decide. Reporting only until the rubric says otherwise; the person is the gate.

## Verify

```
curl -s http://localhost:3003/api/trinny-bench/config | head -c 300
npm run typecheck && npm run lint && npm run test:run
```

Then open the page with `?offline=1`, drop a wave-01 frame, watch the rail
settle, then one real generate. In the ship: `python tools/ledger.py wave
"<session dir>"` and `python tools/make_review_gallery.py "<session dir>"` both
read a bench session unchanged.
