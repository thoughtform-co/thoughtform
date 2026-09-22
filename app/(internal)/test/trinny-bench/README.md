# /test/trinny-bench — the Trinny London brand bench

**http://localhost:3003/test/trinny-bench** (dev server; the port is whatever
the running server reports). `?offline=1` rehearses the page against the
harness's deterministic fake grader with the colour layer still real — a
Generate still draws with the real model. `?job=<id>` opens a job from
today's session without re-running it.

One module, in the grammar of Moira's workshop bench (ADR-120, Update 1): a
switch between **generating** a Trinny London product image with the ship's
harness and **uploading** one; three views of the same skill — **Run**,
**Skill**, **Evals** — and the dark rail of checks beside them, whichever view
is open. Every image is really drawn, measured and graded: the body colour in
code against the product's own tile, the rest three times, the majority per
check. Delaware's engine and Moira's bench are curated; this one runs.

## The colour rule

A state, never a score, and the colour is the rubric's own strictness (the
owner, 2026-09-22): a **gate** that fails on the majority is **red**; anything
judged that fails (critical, minor, advisory), a split vote, or a check nobody
answered is **orange**; a check that held on every run is **green**. The
verdict word stays the rubric's. The measured rows settle the moment the
measurement lands; a frame the ship could not compare reads n/a.

## What lives where

| Here (the face)                                                                         | In the ship `../Arcs_Trinny London` (the judgment and the machinery)                           |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `page.tsx` — the page head, `ThemeLock`, no sheet and no HUD                            | `skill/references/rubric.md` — the checks, parsed at every grade                               |
| `TrinnyBench.tsx` — the module: switch, views, one job at a time                        | `skill/references/colour-bands.json` — each product's band, read from its tile                 |
| `Input.tsx` · `Output.tsx` · `Checks.tsx` — the Run view's three cells                  | `bench/job.py` — the runner: `config`, `generate`, `upload`, `suggest`, `jobs`, `evals`        |
| `SkillView.tsx` · `EvalsView.tsx` — the folder; strictness and the cases                | `bench/colour.py`, `bench/grade.py` — the measurement and the measured grade                   |
| `derive.ts` — every rule the face draws, pure (`tests/lib/trinny-bench-derive.test.ts`) | `evals/regression/*.json` — the negatives and what each one got                                |
| `Segmented.tsx`, `DropZone.tsx`, `useJob.ts`, `types.ts`                                | `tools/` — the Armada harness, never edited                                                    |
| `trinny-bench.css` — `.tb-*`, one module on a plain ground                              | Drive `02_Creation/bench/<date>/` — pixels, `MANIFEST.jsonl`, `qa_results.json`, `jobs/*.json` |

The API routes under `app/api/trinny-bench/` spawn `python bench/job.py` in the
ship (`TRINNY_BENCH_REPO`, default `../Arcs_Trinny London`; `TRINNY_BENCH_PYTHON`,
default `python`) and read the job files it writes. They refuse outside
development: there is no Python and no Drive on Vercel, and `proxy.ts` does not
gate `/api`. The history route stays; the face opens a past job by `?job=`.

## What it never does

- Grade anything itself. Every check is the rubric's, every colour number is
  the runner's; the page renders a job file.
- Draw a highlight it did not measure. The outline is the product box the
  colour layer located; offline and on a texture frame there is none, and the
  page says so.
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

Then open the page with `?offline=1`, open Evals and press "Check this one" on
the plum swap, run it, and watch the colour settle first; open a real job of
today's with `?job=<id>` to see the product box on the picture; then one real
generate. In the ship: `python tools/ledger.py wave "<session dir>"` and
`python tools/make_review_gallery.py "<session dir>"` both read a bench session
unchanged.
