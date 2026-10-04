# ADR-146: How Armada works, the technical companion

- **Status:** Proposed (2026-10-04, owner). Built and guarded on branch
  `feat/arcs-armada`, not pushed; flips to Accepted once the owner has read the page
  live.
- **Surface:** `/arcs/thoughtform/armada`, on the generic arc route;
  `lib/arcs/content/thoughtform-armada.ts`; one row in `lib/arcs/registry.ts`;
  `HERO_ROUTES`; the new `repository` kind (`lib/arcs/types.ts`,
  `components/arcs/ArcRepository.tsx`, its sheet in `components/arcs/arcs.css`, the
  dispatch in `ArcSectionRenderer.tsx`, `KIND_DESIG` in `chrome.tsx`); the
  worked-example switch mounted on `[slug]/[leaf]` for any arc that carries one;
  `tests/lib/thoughtform-armada.test.ts` (new); a `repository` guard in
  `arcs-registry`; Suri's three skills in `skill-file-fidelity`; `REAL_TODAY` in
  `sheet-instrument` and `sheet-composition`.
- **Does NOT supersede ADR-143.** v3 tells the story; this page is the machinery under
  it, and the two share only the close.
- **Related:** [ADR-143](143-the-workshop-third-house-cut.md) (the cut this is the
  companion to), [ADR-139](139-the-workshop-second-cut.md) (the worked switch, the
  plugin board this replaces for "made real", the skill file, the chat),
  [ADR-131](131-the-workshop-archetype.md) (one idea per viewport, and the rule this page
  bends), [ADR-106](106-the-outcomes-are-one-dial-read-three-ways.md) (the dial).

## The call

The owner, 2026-10-04: a page on the house group that is "the more technical breakdown
of how Armada works", drawn from the Loop page "Making Your Agents Reliable" from its
chapter five ("The intelligence configuration") on, with the wording brought up to the
system as it changed in the days before, and with the information architecture fixed:
"'The configuration, made real' should be improved upon because it looks too similar to
the intelligence configuration from the previous section; and just generally from an
information architecture pov this doesn't really make sense." Style from v3.

Asked, he chose: **Suri's teams as the worked examples**, Loop as the pattern and
Samako as unnamed inspiration; **three pieces of work as the tabs** (the brief, the
Monday read, the statics); readers **himself and the teams in the workshop**; **the
house address**, `/arcs/thoughtform/armada`, over the client's group.

## The decision

**The Loop page's order, fixed.** It drew the configuration's board twice (its five and
six), explained the plugin twice (six and nine), showed the mother before saying what
she is, put turning the plugin on after using it, and split feedback from its triage.
Here one piece of work goes through the machinery once:

|     |                                                                                  |
| --- | -------------------------------------------------------------------------------- |
| 01  | the configuration (`questions`, three panels)                                    |
| 02  | the skill (`skill-file`, Suri's real `brief`, `monday-read` and Design `mother`) |
| 03  | the checks (`cards` as a `ledger`: three real rubric rows and the verdict)       |
| 04  | the cases (`readout`: a case on file, and the run of 3 October)                  |
| 05  | the repository (`repository`, new): the six answers as a nesting                 |
| 06  | using it (`chat ask`)                                                            |
| 07  | when it's wrong (`chat feedback`, with the kit's own four steps)                 |
| 08  | once, then twice (`steps`, one dial)                                             |
| 09  | across teams (`plates`: the kit, the packages, Armada)                           |
| 10  | the month (`cards` ×4, as planned on 4 October)                                  |
| 11  | the close (v2's, shared)                                                         |

**A new kind, `repository`, the twenty-fourth exception to ADR-052.** "Made real" was the
`plugin-board`: a frame round four plates round a chip, which reads as the six-plate
board a second time. What the beat has to say is that the answers NEST, and no kind drew
a nesting: the client's Claude organisation (the model, the connectors) holds the
marketplace it syncs from GitHub, which holds the plugins, which hold the skills; the
repository's own files (`org.toml`, `MAINTAINERS.json`, the record, the connector, the
workflows) run along the marketplace's foot; the interfaces sit under it all. Every
element that answers a question says which, all six land on it, gold is only what the
team writes, a ghost (a skill named for a later week) is never lit. One leaf, no state,
no script, no SVG.

**The worked switch on the generic route.** Every switched page so far had its own
route and mounted `ArcWorkedSwitch` there; this is the first on `[slug]/[leaf]`, which
now mounts the island when any section carries `worked`. Without it the first panel of
each group reads whole and the bar stays away, as before.

**The wording follows the system as of 4 October.** Suri's names from its map of
3 October (`suri-ai-studio`, `ai-suri`, `ai-studio-strategy`, `ai-studio-design`); the
kit's mother, which runs the team's work and never approves, not the Loop page's "checks
against best practices"; evals in two layers, behaviour cases run with and without the
plugin and rubric checks that advise until they have agreed with the decider on both
sides; feedback through the client's own connector and a triage that labels and changes
no file, a fix only on the owner's word; packages placed by role; once a correction,
twice a rule; nothing of one client reaching another.

## Bending ADR-131

ADR-131 keeps a client's evidence off the house base a fork starts from (Loop's by
reference excepted). This page is a house page whose worked examples are Suri's, by the
owner's ruling: he asked for the house address after the conflict was put to him. What
the bend costs is that the next client cannot be shown this page as it stands; a fork
swaps `WORKED` and the panels and keeps the shape. What it may never carry is pinned in
`thoughtform-armada.test.ts`: no colleague of the client by name (roles only), no other
client, no callsign.

## Next

- The owner reads it live. "The triage" is the kit's word for what the Loop page calls
  the father; the page uses the kit's.
- When Suri's names merge (its PR on kit 0.6.0) and the local checkout is pulled,
  `skill-file-fidelity` and the page test read the real files by default; until then
  `SURI_AI_STUDIO_DIR` points them at the branch.
- The month's dates are the plan of 4 October; the beat moves to what happened once the
  week has run.
