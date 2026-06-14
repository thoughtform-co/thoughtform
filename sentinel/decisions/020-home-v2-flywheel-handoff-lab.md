# ADR-020: Home V2 Flywheel Handoff Lab

**Date:** 2026-06-12
**Status:** Proposed

---

## Context

The home-v2 depth corridor now carries the visitor through Navigate, Encode, Build, and an epilogue that lands on the substrate globe with the signal: "The labs just bet billions on the same layer."

The next production beat is unresolved. The current home flow moves from the dark corridor into a cream `#buildQuote` sticky cover, then into later v7 sections. That register change breaks the dark celestial navigation mood, and the practical explanation of Thoughtform's services is split across older sections.

The goal is to prototype a handoff that answers: what does the flywheel mean in practice?

## Decision

Create an internal handoff lab with three routes:

- `/test/handoff-a` — Orbit and Dock. The artifact remains a pinned celestial instrument while service copy scrolls beside it.
- `/test/handoff-b` — The Veil. A short DOM mask transition releases the 3D scene into a calm dark editorial services layer.
- `/test/handoff-c` — Collapse and Unfold. The visual system collapses inward to the artifact, then unfolds into service bands.

All three routes share one content spine and one test shell:

- Real `DepthGatewayScene` and `ProjectedBrandmarkActor` are mounted for the epilogue runway.
- The depth store is scrubbed only through the existing epilogue channel.
- The services layer is DOM/CSS, not additional R3F, so the corridor can disengage after the handoff.
- The section stays on the dark token ladder: `--void`, `--surface-0`, `--surface-1`, gold as wayfinding.

## Recommendation From The Lab

Scenario B is the leading production candidate because it is the clearest services IA and the best performance path.

If it feels too flat during production integration, borrow Scenario A's docked artifact/proof object at the section exit so the flow still hands naturally into the build cases.

Scenario C should remain a future DREAM-band option until the actual R3F globe and DOM artifact can share a more precise painter handoff.

**Amendment (2026-06-12, after first review):** Scenario A gained an approach-cover seam that resolves the flat document-scroll entry. Mechanics: the epilogue runway extends one viewport (285svh) so the scene stays pinned; the services section overlaps it (`margin-top: -100svh`) and slides over with an intentionally transparent top gradient (ADR-008 rule 2 exception, re-shielded within ~96svh); a cover-progress channel (`--handoff-cover-progress`, written by the single-rAF `useHandoffScroll`) drives scene push-back + dim, pivot exit, and the artifact's arrival lag; the artifact (orbits + brandmark only) then settles from centre into a section-long sticky instrument slot on the right. Corridor engagement drops (frameloop to demand) once cover reaches 1. This seam is the preferred 3D-to-2D transition regardless of which scenario's services layout ships.

**Production amendment (2026-06-14):** Scenario A's cover seam ships in a
production-specific form inside `HandoffOrbitEmbed`. Production does not
mount the lab's duplicate `DepthGatewayScene`; it reuses the completed
HomeCorridor canvas as a fixed docked backdrop, renders a 100svh cover
plane before services copy, and releases the dock channel once
`--handoff-cover` reaches 1. This preserves the existing corridor and
billions epilogue while delivering the Active Theory / Hashgraph class of
"lower plane swipes up and replaces the previous scene."

## Alternatives Considered

### Continue the 3D space for the full services section

Rejected for the first production pass. It preserves narrative continuity but risks spending the motion budget right when the page needs practical clarity.

### Keep the cream `#buildQuote` cover

Rejected for this handoff. The quote is useful, but the light register is too abrupt after the dark epilogue. The quote should move into the Navigate service beat.

### Restore the old intelligence-layer triad

Rejected. Prior side-artifact plus three-block layouts felt like slideware and duplicate the problem this lab is trying to solve.

## Consequences

- The production splice should happen after the corridor epilogue reaches `epilogueProgress = 1`.
- `#buildQuote` should be replaced, darkened, or retired when this handoff graduates.
- `#practice` should either become this services handoff or be folded into it, since the current production DOM strips the old `#approach` content.
- Any production version must keep full-bleed wrappers opaque per ADR-008. The one sanctioned exception is the orbit approach-cover's transparent top gradient, which exists to show the pinned scene during the cover window and re-shields within the first viewport.
- The veil/mask may be used only as a short transition. It must not remain as a persistent overlay across the services runway.

## Implementation References

- Lab routes: `app/(internal)/test/handoff-a/page.tsx`, `app/(internal)/test/handoff-b/page.tsx`, `app/(internal)/test/handoff-c/page.tsx`
- Shared shell: `components/landing/home-v2/handoff-lab/HandoffLabPage.tsx`
- Shared content: `components/landing/home-v2/handoff-lab/content.ts`
- Shared styles: `components/landing/home-v2/handoff-lab/handoff-lab.css`
- Reference research: `sentinel/research/handoff-transition/reference-extractions.md`
- Scenario evaluation: `sentinel/research/handoff-transition/scenario-evaluation.md`

## Related Decisions

- ADR-002: Scroll Animation Architecture
- ADR-008: Landing v7 Background Layers & Reveal Decoupling
- ADR-012: Intelligence Layer Artifact
- ADR-017: Orbit Journey and Substrate Morph
- ADR-018: Home V2 Depth Corridor
