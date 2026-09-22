# ADR-120: The Trinny bench — a lab page that runs a sibling ship's harness

**Date:** 2026-09-22
**Status:** Accepted (owner, 2026-09-22: "on the Thoughtform page, not on the Trinny proposal, a separate page… copy the look and feel, including the background gradient")
**Surfaces:** `app/(internal)/test/trinny-bench/**`, `app/api/trinny-bench/**`, `lib/theme/themeLock.ts` (one row), `tests/lib/theme-lock.test.tsx` (its pin)
**Related:** ADR-093 (the light lock this route joins), ADR-114 (the sheet it is composed on), ADR-118 (the instrument profile), ADR-092 (the type tokens its sheet is written to), Moira's ADR-043 (the bench grammar: three tabs, one rail, a state never a score)

## Context

The Trinny London proposal (v07, 2026-09-15) had no reply after two weeks. The
owner wanted a short recording of a **real** module: generate one of the
client's product images, or drop any image in, and have AI check it against
the engagement's rubric — is it on brand, is the colour right — with the checks
settling one by one and the verdict said in the client's words. The founder had
asked for exactly this on the intro call ("the colour palette is wrong… before
it reaches me or the CMO").

Two demos with that grammar already existed and both are curated: Delaware's
engine dashboard and Moira's workshop bench write every result into content
and call nothing. The judgment and the machinery for a live one existed too,
in the Trinny London ship (`Arcs_Trinny London`: `armada.toml`, the rubric, the
Armada `tools/`), as Python CLIs with no face.

## Decision

**The ship keeps the judgment and the machinery; this site hosts the face.**

1. **A lab route, `/test/trinny-bench`**, composed on the sheet (`SheetShell`,
   `profile="instrument"`, HUD chrome from `sliceV7Sections([])`) as three
   chapters — Run, Skill, Evals — and **light-locked** (ADR-093: a row in
   `LIGHT_LOCKED_ROUTES`, `ThemeLock` as a sibling, the switch hidden in the
   route sheet). It takes the pitch page's register by copying, never by
   importing its sheet: the two sanctioned client literals (`--tb-brand-rgb`,
   `--tb-yellow-rgb`) re-declared under `.tb-root`, the rest ramp steps off
   `--dawn-rgb`; and the turn wash's CSS fallback as one fixed layer behind
   sections made transparent inside this root.

2. **Thin API routes that spawn the ship's runner and read its job files.**
   `bench/job.py` in the ship walks `queued → drawing → measuring → grading →
done | error` and rewrites `<session>/jobs/<id>.json` atomically at every
   step; the page polls it every 400 ms. Every route refuses outside
   development (`proxy.ts` does not gate `/api`), and `img?p=` serves a file
   only under the Drive root or the ship's `skill/assets`.

3. **A check returns a state, never a score.** `pass`, `fail`, `unsure` (the
   three runs split; the vote shown verbatim from the harness's
   `split_answers`), and `in code` for the two rows the ship computes rather
   than asks. States are told apart by ink alpha, a fill and an underline.

## What is new here, and must not be generalised

**This is the site's first route handler that spawns a child process.** It is
acceptable because the route is dev-only by construction and the process is a
sibling repo's own CLI on the owner's machine. It is not a pattern for a
production route: a production version of this bench would host the runner
as a service and keep these routes as they are — thin, spawning nothing.

## Alternatives rejected

- **A page in the ship, served by a Python `http.server`.** Reuses the harness
  natively, but the owner wanted it on the site, and the site's enforced CSP
  (`connect-src 'self'`) would have blocked the browser from calling another
  port anyway — so the face had to be here and the routes had to proxy.
- **Under `/arcs/trinny-london/…`.** A public route with no Python on Vercel
  would 500. If the URL bar matters in a recording, a ten-line alias that
  renders the same component and `notFound()`s outside development is the
  move; not taken in this pass.
- **A Claude grader.** The call's story was "built in Claude"; the harness
  grades on Gemini and was validated there on wave 01. The checks are text
  and portable, the model is a lane; a Claude lane is a follow-up in the ship.

## Verify

```
curl -s http://localhost:3003/api/trinny-bench/config | head -c 300
npm run typecheck && npm run lint && npm run test:run
```

Open http://localhost:3003/test/trinny-bench?offline=1, drop a wave-01 frame,
watch the rail settle; then http://localhost:3003/test/trinny-bench for one
real generate. Arriving with `?theme=dark` still paints light.
