# Video reads

Every video this practice has paid a model to watch, as a
[CDAF](https://github.com/UditAkhourii/cdaf) sidecar: a timestamped text account
anchored to the exact file by size and SHA-256. Read these instead of
re-watching. The protocol is the `cdaf` skill (`.claude/skills/cdaf/SKILL.md`);
the tool is `scripts/video-read/cdaf.mjs`; `tests/lib/video-reads.test.ts`
fails on a malformed file.

| read                                                                                                    | video                                                                          | profile   | what it is                                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [thoughtform-x-bionic-proposal-feedback-e13a7495](thoughtform-x-bionic-proposal-feedback-e13a7495.cdaf) | `00_UI Moodboard\_Feedback\Thoughtform_X Bionic Proposal Feedback.mp4` (10:56) | feedback  | His Loom on the X-Bionic proposal, section by section. Older markdown read: `docs/design/xbionic-proposal/feedback-2026-10-11/01-…`     |
| [thoughtform-website-inspiration-11d4b60a](thoughtform-website-inspiration-11d4b60a.cdaf)               | `00_UI Moodboard\_Feedback\Thoughtform_Website Inspiration.mp4` (12:28)        | reference | His Loom through reference sites: Tensorlake, Unsiloed, Rollups, Lighthouse, Atomic Tessellator, Cluster and more. Older read: `…/02-…` |
| [thoughtform-diagrams-breakdown-d3bc4597](thoughtform-diagrams-breakdown-d3bc4597.cdaf)                 | `00_UI Moodboard\_Feedback\Thoughtform_Diagrams Breakdown.mp4` (4:33)          | diagrams  | His Loom on diagram language: terminal, isometric, 2D vs 3D, the linear axis. Older read: `…/03-…`                                      |
| [hex-tensorlake-e99c4c90](hex-tensorlake-e99c4c90.cdaf)                                                 | `00_UI Moodboard\Sections\HEX-Tensorlake.mp4` (0:08)                           | reference | Silent scroll through tensorlake.ai's sections and diagrams                                                                             |
| [hex-tensorlake-2-d3e7b3c5](hex-tensorlake-2-d3e7b3c5.cdaf)                                             | `00_UI Moodboard\Sections\HEX_Tensorlake-2.mp4` (0:10)                         | reference | Silent zoom-out from Tensorlake's hero diagram to its design canvas                                                                     |
| [particle-card-system-51e64a67](particle-card-system-51e64a67.cdaf)                                     | `00_UI Moodboard\Particle Systems\Particle Card System.mp4` (0:05)             | reference | Silent loop of a particle card in orange and green                                                                                      |

`00_UI Moodboard` is `I:\My Drive\01_Thoughtform Branding\10_Websites\00_UI Moodboard`.
Add a row when you add a read.
