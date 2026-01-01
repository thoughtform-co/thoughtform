---
name: Astrogation Survey Alignment
overview: Do a low-risk “principles alignment” pass on the Survey subsystem so it scales like the post-refactor Astrogation spine—without re-architecting tabs/state or risking regressions.
todos:
  - id: survey-baseline
    content: Extend `app/astrogation/BASELINE_CHECKLIST.md` with Survey-specific behaviors to validate after each refactor step.
    status: pending
  - id: survey-view-modularize
    content: Modularize `app/astrogation/_components/SurveyView.tsx` (annotation/canvas/thumbstrip separation) and clean up type/timeout hygiene without changing behavior.
    status: pending
    dependencies:
      - survey-baseline
  - id: use-survey-harden
    content: Refactor `app/astrogation/_hooks/useSurvey.ts` into clearer fetch/pipeline helpers and add stale-response protection for rapid filter/search changes.
    status: pending
    dependencies:
      - survey-baseline
  - id: reduce-prop-surface
    content: Reduce prop plumbing between `page.tsx` → `CenterPanel.tsx` → Survey by bundling Survey props and keeping stable callbacks.
    status: pending
    dependencies:
      - survey-view-modularize
      - use-survey-harden
  - id: survey-panels-hygiene
    content: Small, safe hygiene pass on `SurveyInspectorPanel.tsx` and `SurveyCatalogPanel.tsx` (extract utils, remove duplicated local/external state patterns where safe).
    status: pending
    dependencies:
      - survey-baseline
  - id: validate
    content: Run typecheck/lint on changed files and manually verify the updated Survey baseline checklist.
    status: pending
    dependencies:
      - reduce-prop-surface
      - survey-panels-hygiene
---

# Astrogation Survey principles-alignment pass

### Recommendation (how far to go)

Go **one rung below “broad refactor”**: keep the existing Astrogation spine (thin route, reducer, hooks, memoized panels) and do a **Survey-focused alignment pass** that reduces coupling/duplication and codifies the same patterns—**only where it buys scaling**. Avoid any changes to the global tab/focus/CSS architecture unless we uncover a real problem.

### Goals

- Keep behavior stable (your constraint), while making Survey code easier to extend.
- Align Survey with the same principles as the previous refactor: **single source of truth**, **side-effects isolated**, **smaller components**, **typed boundaries**, **stable props/callbacks**.

### Non-goals

- No new Survey features.
- No “refactor for the sake of it” file churn.
- No global Astrogation architecture rewrite.

### Baseline safety checklist (add/extend)

- Update [`app/astrogation/BASELINE_CHECKLIST.md`](app/astrogation/BASELINE_CHECKLIST.md) with Survey flows:
- Filter category/component select/deselect.
- Upload → pipeline (analyze → briefing) runs; errors don’t break the session.
- Annotation draw, resize (smooth), delete; note editing persists.
- Semantic search (briefing/full) works; empty query restores recent list.
- Inspector save/reset/delete; upload modal (drag/paste/click) works.

### Refactor scope (targeted, low/medium risk)

- **Survey UI modularization (no behavior change)**
- Split high-churn code in [`app/astrogation/_components/SurveyView.tsx`](app/astrogation/_components/SurveyView.tsx) into small internal components (canvas, annotations layer, thumbnails) or sibling files.
- Clean up type/implementation smells that make scaling risky (e.g. duplicate `AnnotationBoxProps` declarations, client-side timeout typing).
- **Survey data-flow tightening (keep API behavior identical)**
- In [`app/astrogation/_hooks/useSurvey.ts`](app/astrogation/_hooks/useSurvey.ts), factor fetch calls into small helpers and make state transitions explicit (loading/searching/pipeline).
- Add lightweight “race safety” for fast filter/search changes (e.g., abort or ignore stale responses) so future features don’t introduce subtle bugs.
- **Reduce cross-wiring without changing architecture**
- Shrink prop surfaces between [`app/astrogation/page.tsx`](app/astrogation/page.tsx) → [`app/astrogation/_components/CenterPanel.tsx`](app/astrogation/_components/CenterPanel.tsx) → survey components (e.g. pass a `survey` prop object instead of many individual props).
- Keep the reducer shape in [`app/astrogation/_state/astrogationReducer.ts`](app/astrogation/_state/astrogationReducer.ts) stable; optionally extract Survey action handlers into a “survey slice” module if it reduces future diff risk.
- **Inspector/Catalog hygiene where it improves scaling**
- Keep [`app/astrogation/_components/SurveyInspectorPanel.tsx`](app/astrogation/_components/SurveyInspectorPanel.tsx) and [`app/astrogation/_components/SurveyCatalogPanel.tsx`](app/astrogation/_components/SurveyCatalogPanel.tsx) functionally identical, but extract utilities / reduce component size and remove duplicated “dual state” patterns that complicate future work.

### Validation

- Typecheck + lint for touched files.
- Manual pass using the updated baseline checklist.

### Stop condition
