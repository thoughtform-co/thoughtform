# ADR-132: The AI storytelling course is one project, nine gates

- **Status:** Proposed (2026-09-28, owner). Built and measured; flips to
  Accepted once the owner has read the page live.
- **Surface:** `/arcs/ai-storytelling` — `lib/arcs/content/ai-storytelling.ts`
  (new, twelve sections); `lib/arcs/registry.ts` (one row, after the workshop
  archetype); `lib/theme/heroPreload.ts` + `tests/lib/hero-preload.test.ts`.
- **Supersedes:** nothing. Every existing arc is byte-identical.
- **Related:** [ADR-131](131-the-workshop-archetype.md) (the archetype, and U1's
  practical rungs, whose four-row shape this repeats one level up),
  [ADR-052](052-client-arcs.md) (`client` absent ⇒ a Thoughtform format).

## Context

Vince teaches a nine-week course, *AI storytelling*, to first- and second-year
students. It was planned around his and Tom Rumes' book *Storytelling met AI*;
he now wants to teach it hands-on, in the shape the Plopsa morning validated.
His own weak spot after years of teaching is the practical sheet: every week
needs an objective and a gate the student can see from the start.

## Decision

**A house arc, English, twelve sections.** A readout (the project, the
setup, the four phases), one quote beat from the book, one `anatomy` beat per
week, a close. `format: "workshop"` for the layout, `cardChip: "course"` so the
overview does not read it as a second workshop.

**One project for the whole term, the student's choice of two subjects**: a
brand world around themselves, or around a fictional futuristic product. The
second track exists because first-years may have no practice of their own yet,
and a product from the future makes it easy to be bold.

⚠ **EVERY WEEK IS THE SAME FOUR ROWS IN THE SAME ORDER — Objective · You make ·
The gate · The tool.** That repeated shape is the practical sheet: the student
learns it once and each gate is stated before its week starts. A week is done
when its gate is met, not when the class ends.

**The weeks map onto the house arc.** Navigate: AI is not software, setup
(Claude, GitHub, a shared drive), then the world (references, a name, a world
bible). Encode: the world becomes a skill from the eval template (the Tom on the
Moon method), then the student in it (a shoot edited into the world), then the
offer (from the world's emotional truth to what the brand does). Build: the
poster, the website in plain HTML, the film. Launch: all three shown as one.

⚠ **MOTION COMES LAST ON PURPOSE.** The most impressive thing the tools do is held
to week eight, because by then the world has rules a film can obey. Given away in
week two it is a trick, not a story.

**Measured at 1280x720 and 1920x1247: every section fits one screen**, and the
curtain stays armed.

## Next

- The practical sheets: one sheet per week in a course repo, the four rows
  expanded into brief, deliverable, gate and checks.
- A reviewer eval that checks a submission against its week's gate.
- The eval template students start from in week three.
