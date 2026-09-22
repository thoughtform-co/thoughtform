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

## Update 1 — one module (2026-09-22, owner)

He read the first face the same evening and sent it back whole.

> _"The interface that you've built, with all due respect, looks really
> convoluted and not as elegant as what I've built with Delaware and the Moira
> eval workshop. I really want you to go back to the basics and really make a
> super clean interface. Maybe we were too tied to some of the elements […]"_
>
> _"Now all the elements are disconnected. They are all floating. It looks like
> a glorified PowerPoint. Instead, I want you to go back to what we've built with
> Moira, where we're just one module with different features, and it should be
> super visual, super clear."_
>
> _"And there should also be a switch where you can either generate an image,
> which then gets checked, or upload an image. […] When you run the checks, it
> should highlight what's correct, and on the right side, it should show the
> checks, the reasoning, and either a green score, an orange score, or red.
> It's like our evals, our degrees of freedom."_

Asked, he chose three things: a **plain page with no HUD** (the wash goes too),
the **product box** as the highlight (what the colour layer already finds, no
new model call), and **red only where a fixed rule broke**.

### What lost

- **Decision 1's sheet**: `SheetShell`, the HUD chrome, the corner instruments,
  the three scrolled chapters, and the coral wash with them. The page is the
  module alone on the palest warm grey — the client's own product-tile ground.
  The light lock stays (the row in `LIGHT_LOCKED_ROUTES`, `ThemeLock`); no theme
  switch is drawn, so the rule that hid it went with the sheet.
- **The masthead readout** (its facts are one caption line under the module),
  **the free-standing yellow CTA** (the yellow survives on the module's one
  primary button, the proposal's CTA exactly), and **the history strip** (the
  route stays; `?job=<id>` opens any job of today's session).
- **Decision 3's "no traffic light"**. The states keep their words and gain the
  owner's three colours, carried by shape as well: pass outlined, review
  dashed, fail filled.
- **The page's claim that a rehearsal spends nothing.** A Generate in
  `?offline=1` still draws with the real model; the caption says so.

### The decision

1. **One module, Moira's grammar.** A bar above it: `Generate | Upload` on the
   left (Delaware's workstream switch, two modes of one engine), `Run | Skill |
Evals` on the right. Run is three cells — input, output, the dark rail of
   checks — and the rail stays beside Skill and Evals too.
2. **The real product sits in INPUT.** The identity reference goes into every
   draw and every grade, so it is an input; beside the candidate it still reads
   left to right, and OUTPUT keeps its whole width for the picture under review.
3. **The colour is the rubric's own strictness** (`derive.ts`, pinned in
   `tests/lib/trinny-bench-derive.test.ts`): a `gate` that fails on the majority
   is red; a judged check that fails (critical, minor, advisory), a split vote,
   or an unanswered check is orange; a check that held on every run is green.
   Evals draws the same rule as degrees of freedom — fixed (the gates, pass or
   fail), adapted (everything judged, pass or review), free (what the brief
   leaves open, checked by nobody on one frame).
4. **The highlight is measured, never drawn for effect.** The product box
   (`measurement.box`, normalised x0 y0 x1 y1) is outlined in percent inside a
   wrapper with the picture's own aspect ratio, the sampled inner 60 % dashed
   inside it, labelled with the product and its ΔE2000. Offline and on a
   texture frame there is no box, and the page says so.
5. **The colour settles first.** F1/F2 are computed before any grade, so their
   row settles when `measurement` lands; the stranger's read fills under
   Identity when it lands; the other rows settle in order when the verdict
   does, then the verdict. Rows are always mounted and swap two faces on a
   `data-settled` flag delayed by their own index, so the 400 ms poll never
   restarts a transition.
6. **A regression case runs in one click.** Evals lists the negatives and the
   positive controls with their thumbnails, the checks each must trip and what
   it got; "Check this one" loads it into Upload **as the product its name
   says** (`derived_from`), never the one its colour suggests — the plum swap
   is Naked Ambition.

### Verified

At 1920×1247 and 1440×900 the page fits with no scroll either way. On today's
real Naked Ambition generate (`?job=bmud076pt6srgh7`) the outline measured to
the pixel against the box × the rendered image (890, 454, 140×460 at the
owner's viewport; 483 px square at 1440). A rehearsal of the plum swap settled
the colour first ("another product's band", ΔE 40.7) and the rest in order.
