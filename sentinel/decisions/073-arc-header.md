# ADR-073: The site's header on the arc pages, and the reel retired

- **Status:** Accepted (2026-08-23)
- **Surface:** every `/arcs/[slug]` detail page · `components/arcs/ArcHudNav.tsx` + `useArcActiveSection.ts` · `ArcSectionBase.menuPrimary`
- **Supersedes:** the left reel (`ArcMenu`, ADR-052) — deleted. Applies ADR-055's ruling to the arcs, one surface later.
- **Rules:** [`.claude/rules/arcs.md`](../../.claude/rules/arcs.md)

## Context

An arc page had no header. The top-right corner — where the landing puts
its navigation (ADR-059's four-corner scheme) — was empty, and the only
way through the page was the **left reel** (`ArcMenu`), a copy of the
corridor section menu the landing itself had already **deleted**.

ADR-055 deleted it for one reason, and that reason applied here word for
word: the reel only renders above **1101×760**, so at 1280×720 — a
reference viewport in this repo, and the one every clipping bug is caught
at — an arc page carried **no navigation at all**. `ArcMenu`'s own header
comment recorded the follow-up: _"porting the corner readout to /arcs is
the open follow-up — deck pages may genuinely want a TOC, so it was left
as a separate decision rather than swept along."_

The owner asked for the homepage's header on the new portfolio page
(2026-08-23), and took the reel's retirement with it.

## Decision

### 1. `ArcHudNav` — the landing's header, on an arc

The same control in the same two states, reusing the same `.hud__nav*`
chrome out of `landing.css` (which arcs already import), so the corner is
the site's header rather than a lookalike:

- **EXPANDED** — while the hero is on screen, the CHAPTER links render
  inline across the top-right, aligned to the right rail.
- **COLLAPSED** — past half the first viewport the links peel away and the
  SECTION READOUT decodes in through the `captionScramble` kernel. It IS
  the trigger: the label names where the reader is, pressing it opens the
  drawer of every section.

Ported behaviours, each of which cost a measurement on the landing and
would have been re-lost by a fresh implementation: the readout's label is
**imperatively owned** (React renders the span EMPTY, or `queueScramble`
sees `from === to` and never decodes); the closed drawer is **inert**, not
merely invisible; Escape and outside-click close it and **hand focus back
to the trigger**; the wordmark mirrors the collapse via a class on
`.hud__brand` itself, never a root attribute.

**Why not `HudNav` itself.** Its readout reads the corridor bus
(`useActiveSection` → `MANIFEST_ENTRIES`, `resolveActiveIdx`, the services
ring's progress ref) and its links are the landing's four stations. None
of that exists on a deck page, and importing it would drag corridor state
into `components/arcs`. What IS shared is the CHROME (landing.css) and the
KERNEL (`captionScramble`) — both leaf-level, both free of three/supabase.

One state-sync effect from `HudNav` is deliberately not copied: the drawer
closes in the scroll callback that flips `collapsed`, not in an effect on
it. Same behaviour, one render fewer, and the lint rule is right.

### 2. `menuPrimary` — the inline row is the CHAPTERS

A deck runs to ten `menuLabel` sections (the portfolio has exactly ten) and
ten inline links do not fit a hero. So the drawer takes every one of them
and the row takes the ones the content marks `menuPrimary: true` — the
spine of the argument:

| arc                    | chapters                                        |
| ---------------------- | ----------------------------------------------- |
| portfolio              | About · Overview · Skills · Tools · Outcome     |
| ai-keynote (+ v2)      | About · Diagnosis · The layer · Skills · Cases  |
| claude-workshop (+ v2) | Diagnosis · The layer · Claude · Skills · Cases |

Registry-pinned: at most **five**, each must also carry a `menuLabel` (a
chapter the drawer cannot list is a link to nowhere), and an arc with a
menu must mark at least one (a bare hamburger on a page that has chapters
to name is the state this ADR exists to remove). The v1 arcs share their
`sections` with the `-v2` cuts BY REFERENCE, so each pair is marked once.

### 3. The reel is deleted

`ArcMenu.tsx` and the whole `.arc-menu*` block in `arcs.css` are gone; git
history is the archive. Its active-index observer — an IO over each
section's sticky STAGE under terminal motion, the section itself under
reveal — survives as `useArcActiveSection`, which the readout now reads.
Nothing is lost in function: the drawer lists every section with its
number and navigates on click, at **every** width, and the readout names
the position the reel used to highlight.

### 4. The hero grew a top band, and it is arithmetic

The production hero overlay darkens LEFT-to-right (the copy side) and
bottom-up, and deliberately leaves the top-right clear — that is where the
key visual's own detail lives, and the landing's plate is dark there
anyway. The arcs' key visual is near-**white** in that corner, so the
header's cream links landed on paper: measured **1.06:1** before this. One
more term on the SAME overlay (`.arc-hero .hero__video__overlay`), not a
patch under the menu — the eyebrow sits in the same band and gains with
it. Strong only at the very top edge and faded out by 30 % of the hero, so
the ridge and the ring are untouched.

Measured after, sampling the composited screenshot around each link's ink
box: **6.1–7.2:1** at 1280×720 and 1440×800, in both themes.

## Consequences

- The header ships on **all** arc pages, including the two client v1 decks
  and their terminal cuts. Their heroes gain the chapter row; nothing else
  about them moves (both smokes green, unchanged).
- Below 641px the inline row is CSS-hidden and the bars carry the corner —
  the landing's own responsive rule, inherited for free.
- `tests/visual/arc-portfolio-smoke.spec.ts` swaps its reel case for the
  header's: the chapters, the collapse, the readout, the numbered drawer,
  the active row, Escape + focus return, and a drawer row landing on its
  beat. ⚠ That last one POLLS — the jump is a smooth scroll and five
  thousand pixels of it outlast any sleep worth writing.
- ⚠ The row is chrome over a PHOTO. The smoke asserts it lands on no hero
  ink at the reference viewports; a hero whose copy grows toward the top
  right fails there rather than silently colliding.

## Left open

- The eyebrow measures **2.5–2.9:1** on the hero even after the band —
  it is `--gold-70` as small text, the family ADR-058 records as an open
  sweep (`4 ITEMS`, `ON RECORD`, the contact email). The ramp exists for
  it; adopting it is that sweep, not this one.
- The arcs' light theme is still partial (ADR-072's own left-open item):
  the header itself flips correctly, the shared `.arc-*` atoms do not.
