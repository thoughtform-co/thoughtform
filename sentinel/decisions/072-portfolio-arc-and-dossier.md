# ADR-072: The portfolio arc, and the dossier section kind

- **Status:** Proposed (2026-08-23)
- **Surface:** `/arcs/portfolio` (new), `components/arcs/ArcDossier*`, the casefile's `ToolField` (extracted from `ToolGallery`)
- **Supersedes:** nothing. ADR-052's content-only rule gains one enumerated exception (a ninth section kind); ADR-057's beat grammar is unchanged.
- **Rules:** [`.claude/rules/arcs.md`](../../.claude/rules/arcs.md) · [`.claude/rules/proof.md`](../../.claude/rules/proof.md)

## Context

Rob — Loop Earplugs' former marketing lead, and the owner's co-founder on the
forward-deployed consultancy — asked for a portfolio of the work at Loop: the
four production tools AND the adoption program around them. The material
lived in three repos (Aether's `/claude-adoption`, Shards' `/ai-operator` and
`/forward-deployed`, and this site's keynote arc + casefile dossier), with
three generations of numbers between them.

The owner's brief: hero → about → ONE clear overview from adoption to
automation → the tools, on the `/arcs` deck chassis (no corridor), with the
homepage casefile's tool dossier — the authored wireframe, the fused
"Watch walkthrough" bar that opens the lightbox, the capability blocks —
reused and allowed to BREATHE on a full page, encoded as a template rather
than copied from the other repos' tools sections.

## Decision (shape — expanded on acceptance)

1. **A new arc, `portfolio`**, `motion: "terminal"`, `format: "portfolio"`.
2. **A ninth section kind, `dossier`** — `{ toolId, legend, head? }`: one
   tool per section, one beat each, drawn from the canonical
   `PROJECT_CASES` record (the masthead derived from it; nothing re-typed).
3. **The casefile's bay + blocks become `ToolField`**, extracted verbatim
   from `ToolGallery` behind a snapshot pin, so the landing and the arc
   render ONE source of bay markup.
4. **Shared Loop evidence** is hoisted out of `ai-keynote.ts` into
   `lib/arcs/content/shared/*` and imported by both arcs by reference —
   share the evidence, author the frame.
5. **The numbers canon and the confidentiality envelope reach the arcs
   test** — the canon on every arc, the envelope scoped to the portfolio
   (the keynote deck deliberately prints € rows; that exemption is recorded
   in `loop-earplugs.ts` and stands).

Alternatives rejected, the host contract, the height budget and the
measured outcomes are written up at acceptance.
