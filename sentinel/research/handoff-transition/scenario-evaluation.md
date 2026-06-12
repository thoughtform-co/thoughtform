# Flywheel Handoff Scenario Evaluation

Date: 2026-06-12

Local routes:

- `/test/handoff-a` -> Orbit and Dock
- `/test/handoff-b` -> The Veil
- `/test/handoff-c` -> Collapse and Unfold

Screenshots: `sentinel/research/handoff-transition/local-evaluation/`

## Criteria

- Tranquility: one moving system per viewport, sparse editorial density.
- Clarity: services legible without reading the whole page.
- Continuity: the handoff still feels like the same celestial navigation system.
- Performance: release the expensive 3D scene when it stops doing narrative work.
- Mobile: no squeezed columns, no unreadable telemetry, no artifact crowding.

## Scenario A: Orbit and Dock

Verdict: strongest narrative continuation, and now the strongest seam.

- Desktop: the pinned right-side artifact gives the page a deadrabbit/Astral Frontier calm. It feels closest to the corridor and keeps the "we are still in the instrument" mood.
- Mobile: stacks cleanly after the correction pass. The service cards are readable and the dock works.
- Approach-cover pass (2026-06-12, after first review): the original entry scrolled in like a flat document. A is now a cover transition: the epilogue runway grows to 285svh so the scene stays pinned while the services layer slides over it (`margin-top: -100svh`, transparent-to-dark top gradient). During the cover window the scene pushes back and dims, the pivot copy lifts away, and the intelligence-layer artifact (orbits + brandmark only, no sources/surfaces) arrives centred over the receding space, holds one breath at full cover, then glides right into the instrument slot. Seam keyframes: `local-evaluation/handoff-a-seam-*.png`.
- Risk: if integrated literally, it can keep the user too long in the same visual mode. The cover beat mitigates this by making the register change explicit.
- Best use: the approach-cover seam is now the strongest 3D-to-2D transition in the lab. Use it as the production seam even if the services layer itself borrows B's structure.

## Scenario B: The Veil

Verdict: best production candidate.

- Desktop: cleanest services IA. The artifact becomes a supporting signifier instead of competing with the copy.
- Mobile: strongest read after the veil overlay was gated to the opening scroll slice.
- Risk: the hard cut can feel less magical than the corridor. It needs the exact splice point to be tuned so it does not feel like the site simply changed templates.
- Best use: primary production route for the immediate "what we do" handoff.

## Scenario C: Collapse and Unfold

Verdict: most authored, highest risk.

- Desktop: the left artifact and right copy composition feels very Thoughtform, especially at the Encode beat.
- Mobile: readable after the grid fix, but the sequential sections can collide visually with the fixed HUD brandmark at some scroll positions.
- Risk: it wants more bespoke choreography than the current test page gives it. Done well, it could be the signature transition; done quickly, it becomes another complex animation competing with the corridor.
- Best use: second production pass after B, or a later deeper transition into build cases.

## Recommendation

Integrate Scenario B first, with two borrowed elements:

1. Keep B's calm editorial service rhythm: one service per viewport, big type, practical copy.
2. Borrow A's docked proof object at the exit so the section hands naturally into the existing build cases.

Do not ship C yet. Keep it as the DREAM-band path for a future transition where the actual R3F globe and DOM artifact share a more precise painter handoff.

## Production Integration Notes

- Splice after the corridor epilogue where `epilogueProgress` reaches 1.
- Replace or retire `#buildQuote`; relocate the Evans quote into the Navigate service beat.
- Replace the gutted `#practice` surface with this services handoff, or fold its remaining semantics into the new section.
- Keep the new section fully dark: `--void` through `--surface-0/1`, with gold only as wayfinding.
- Use the veil as a short DOM mask transition. It must fade/move away within the first service-scroll slice and never sit over the whole section.
- Let the R3F corridor disengage after the transition; do not keep `frameloop="always"` once the page is in the services layer.
