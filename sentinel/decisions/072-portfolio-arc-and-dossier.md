# ADR-072: The portfolio arc, and the dossier section kind

- **Status:** Accepted (2026-08-23)
- **Surface:** `/arcs/portfolio` (new) · `components/arcs/ArcDossier*` · `components/arcs/useCloseOnArcBeatFold.ts` · `lib/arcs/content/portfolio.ts` + `lib/arcs/content/shared/*` · the casefile's `ToolField` (extracted from `ToolGallery`) and `useWalkthrough`
- **Supersedes:** nothing. ADR-052's "new arcs are content-only" rule gains ONE enumerated exception (a ninth section kind); ADR-057's beat grammar is unchanged and gains one wake; ADR-068's bay, blocks and wireframes are mounted unchanged on a second surface.
- **Rules:** [`.claude/rules/arcs.md`](../../.claude/rules/arcs.md) · [`.claude/rules/proof.md`](../../.claude/rules/proof.md)

## Context

Rob — Loop Earplugs' former marketing lead, and the owner's co-founder on
the forward-deployed consultancy written up in Shards' `/forward-deployed` —
asked for a portfolio of the work at Loop: the four production tools AND
the adoption program around them. The material lived in three repos with
three generations of numbers between them:

- **Aether** `/claude-adoption` — the adoption narrative (hero → numbers →
  NAVIGATE / ENCODE / BUILD stage cards → "Why adoption comes before
  automation" → the skills-by-team donut → software-for-few → Mímir and
  Vesper tool blocks with walkthrough modals). Prints 42 Skills beside a
  derived 47; 280 seats / 170 WAU from a May snapshot.
- **Shards** `/ai-operator` (the Stripe application) — the structure the
  owner likes: hero (function first: _"AI capability, built inside the
  work."_) → vision (_"Adoption that works **is** automation."_) → the
  Navigate / Encode / Build approach → Cases (four tools, screenshot
  galleries, walkthroughs) → headless → Stripe-specific closers. Prints 20+
  workflows and 90 %. `/forward-deployed`, the page made WITH Rob, adds the
  _Production · Adoption · Automation — one operating model_ ladder and
  prints 95 %.
- **This site** — the `/arcs` deck chassis (ADR-052/057) that already
  ported the Shards/Aether structure into the Thoughtform flow
  (`/arcs/ai-keynote`, `-v2`), and the casefile's tool dossier (ADR-068):
  the authored wireframe, the fused "Watch walkthrough" bar that opens
  `MediaLightbox`, the 2×2 capability blocks, inside `ConsoleFrame` — in a
  ~600×400 panel behind a four-station rail.

The owner's brief: hero → about → ONE clear overview from adoption (the
Claude part) to automation (the Skills and the tools) → the tools, on the
`/arcs` chassis (no corridor, no sphere), with the homepage's dossier
reused and allowed to **breathe** on a full page, **encoded as a
template** rather than copied from the other repos' tools sections. Drop
the Stripe page's philosophy beats. Decisions taken with the owner in the
planning pass: `/arcs/portfolio`; terminal motion; **one full-viewport beat
per tool**; include the studio proof and the 47-Skill roster; exclude side
projects (Infernal Intelligence, Ledger) — not Loop.

## Decision

### 1. A new arc, `portfolio`

`lib/arcs/content/portfolio.ts`, `slug: "portfolio"`, `format:
"portfolio"` (a new `ArcFormat` value — the overview chip derives from it),
`motion: "terminal"`. Twelve beats, each one viewport:

| #   | id                             | kind          | what it carries                                                                                                                                                          |
| --- | ------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| –   | hero                           | `ArcDef.hero` | **AI capability, built inside the work.** The role line as lede — function first (the owner's doctrine: lead with the function, not the person)                          |
| 1   | `about`                        | portrait      | the person, one beat later: the shared portrait + lead paragraph, one new paragraph, role / practice / base                                                              |
| 2   | `overview`                     | cards ×3      | **Adoption that works _is_ automation.** Navigate · Adoption (22 workshops · 5 → 130+) / Encode · Skills (47+ · 14 teams using the layer) / Build · Tools (4 · in-house) |
| 3   | `five-shapes`                  | anatomy       | Judgment 12 · Voice 7 · Validation 9 · Stakeholder 5 · Pattern 14 — the casefile's glosses and meanings, counts only                                                     |
| 4   | `skills-by-team`               | list-groups   | the roster, shared by reference with the keynote                                                                                                                         |
| 5   | `tools`                        | anatomy       | Compress / Repair / Invent — the shared definitions, each naming its tool                                                                                                |
| 6–9 | `tool-mimir` … `tool-heimdall` | **dossier**   | one tool per beat (below)                                                                                                                                                |
| 10  | `studio`                       | cards ×3      | **97 % of briefings involve AI.** The three ad cards, SKU + ROAS rows only                                                                                               |
| 11  | `proof-ai-atl`                 | media         | the world-first AI ATL film, shared                                                                                                                                      |
| 12  | `close`                        | close         | _The method is the durable centre. The tools are its proof._                                                                                                             |

The reel letters the tools by **codename** (MÍMIR · VESPER · BABYLON ·
HEIMDALL): a 14-character handle ("BRIEFING AGENT") crossed the record
column at 1440 (measured — the keynote's reel was cut for ≤9 characters),
and the dossier's own masthead letters codename · tagline over the
function, so the short handle resolves one beat in.

### 2. The ninth section kind: `dossier`

```ts
| { kind: "dossier"; toolId: string; legend: string; head?: ArcHead }
```

One tool per section, one beat each — the shape that maps 1:1 onto the
beat/clock model (the controller discovers beats from the DOM, and
everything else — anchors, the reel, the designation index, the registry's
unique-id guard, the markup test's beats = stages = planes count — keys
1:1 on sections). `toolId` is a plain string (`lib/arcs/types.ts` stays
import-free) resolved by the renderer against `PROJECT_CASES` and pinned by
the registry test. `legend` is the shared mode sentence
(`MODE_LEGEND[mode]`, pinned equal) — the template says the same thing
everywhere. `head` is optional and, absent, **derived from the record**
(`01 / 04 · Mímir · Brand Intelligence` over the em-segmented title via
`segmentsToArcTitle`); a dossier never authors `sub` (pinned — the record
column is the intro, and a split head would wedge it into the narrow
column).

`ArcDossier` (server) draws the beat on the **instrument band**
(`.arc-band--instrument`, ADR-048's 1440px breakout tier — the casefile's
own): a record column `minmax(300px, min(38%, 440px))` beside the
console. The record: the still masthead (rung 0.06, the ONLY decode
targets — eyebrow, pre, em) → mode chip + legend (0.18) → team + the
record's one metric (0.23; **no status row** — every record is Production
and the bay's FEED line already letters IN SERVICE, a second home for one
fact is this surface's said-twice) → BEFORE `challenge` / NOW `shift`
(0.28) → **the route, returned as a new drawing** (0.33: ADR-068 U3 held
the data for one; a vertical chain of the steps the work used to move
through, one mono cell each on a spine, the single cell they collapsed into
in gold; DOM, vertical, because five 12-character cells need ~480px in a
row and the column is ~400) → the stack (0.38). All record panels enter
from the left (`dx −36`) and so leave FIRST on the fold — the instrument
outlives its content.

`ArcDossierConsole` ("use client", the one island, state only) is the
casefile's console on an arc: `ConsoleFrame className="fl-plate
fl-plate--tools"` (no rail, no foot) around `ToolField` + the same
`MediaLightbox` via `useWalkthrough`, with `useCloseOnArcBeatFold` watching
the beat's `data-sec-live` the way the casefile watches `data-proof-live`.
The console wrapper is an **aperture** (`.arc-ap`, rung 0.12 — the
media/portrait frame recipe: centre-slit unfold, `transform: none`), never
a travelling panel: the bay needs a definite box to size its drawing
against, and a transformed wrapper would become the containing block the
lightbox's portal exists to escape.

### 3. `ToolField` — one source of the bay, behind a snapshot pin

The bay (FEED line, the one walkthrough button around the authored
wireframe, the fused watch bar) and the four capability blocks were lifted
**verbatim** out of `ToolGallery` into
`casefile/ToolField.tsx` (`ToolBay`, `CapabilityBlocks`, `ToolField`,
`titleText`), and the open/close + one-frame-late focus restore into
`useWalkthrough` beside `MediaLightbox`. `ToolGallery` is now the
casefile's COMPOSITION of it — console, rail, fold-close, lightbox.

The extraction was pinned before it happened:
`tests/lib/tool-gallery-markup.test.tsx` snapshots all four stations and
pins the strings the ring smoke asserts live (FEED line, `Watch
walkthrough`, the aria-label, the `120 + 55i` seat delays, no brackets, no
RUN plate). The snapshot was green unchanged after the extraction, and the
ring smoke (12/12, desktop) after that — byte identity proven, not assumed.

### 4. The host contract (what the casefile used to supply)

On `.arc-dossier` in `arcs.css`:

| declaration                                                               | why                                                                                                                                      |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--fl-mono`                                                               | `.fl-bay__top`, `.fl-shot__bar`, `.fl-detail__t`, every `.fl-wire__lbl` — ⚠ never `--font-mono` (IBM Plex)                               |
| `--fl-copy: calc(var(--band-copy) * 0.9)`                                 | `.fl-detail__d`'s `max()` — an unset var does not fall back, it invalidates the declaration silently                                     |
| `--fl-shot-px: 14px`                                                      | the watch bar's padding                                                                                                                  |
| `.arc-dossier__console { height: var(--arc-dossier-h) }` (≥981px, no-PRM) | `.fl-con { height: 100% }` over an absolutely inset panel — inside an auto-height grid cell the console measures 0 (the type-lab lesson) |
| `.arc-dossier .fl-con__console { opacity: 1 }`                            | the settled gate, declared — the arc writes no corridor channel                                                                          |
| `.arc-dossier .fl-detail__plate { animation: none }`                      | ONE arrival system — the beat powers the console on; the blocks' own seat would replay on a scroll-restoring reload                      |

The route imports the casefile sheets AHEAD of `arcs.css`, theme.css
still LAST: `landing.css → casefile.css → console.css → arcs.css →
theme.css`. Route-level on purpose — a client-component CSS import would
make the cascade order bundle-dependent. Both casefile sheets are fully
`.fl-*` / `.services-*` / `[data-proof-*]` scoped (zero `:root` / `body` /
`.hud` rules), so the other arcs receive bytes and no matching rule.

### 5. The height budget — "let it breathe" is arithmetic

```
--arc-stage-pad   = clamp(96px, 14vh, 200px)   reveal (.arc-root)
                  = clamp(32px, 5vh, 72px)     terminal (.arc-root[data-motion="terminal"])
--arc-dossier-h   = clamp(440px, 100svh − 2·pad − 24px, 900px)
```

The console takes what the pinned stage leaves, minus 24px of slack so the
beat FITS rather than tipping into `data-arc-tall` (a tall two-column beat
crops the console at the park). Floored at 440 (the drawings' smallest
honest box), capped at 900 (ADR-068 U4 verified the drawings up to a 739px
bay). **Terminal padding is load-bearing**: the reveal rhythm's 96–200px
would eat ~144px of console at 800p. The beat padding became a token
(`--arc-stage-pad`) so a section can budget against it; `.arc-sec`'s own
literal is untouched (v1 byte-identity).

Measured against the landing's panel, the bay is:

| viewport  | console   | bay frame (arc)   | bay frame (landing) |
| --------- | --------- | ----------------- | ------------------- |
| 1280×720  | 585 × 624 | 336–367 tall      | 311                 |
| 1440×800  | 659 × 696 | 408               | 339                 |
| 1920×1080 | 930 × 900 | 551–589, 883 wide | 506                 |

— 1.1–1.3× the height and 1.2–1.5× the width; the drawings grow on their
`cqh` term (ADR-068 U7), so the area roughly doubles at the wide end. The
**record column** pays for the same budget: the head's breath is
tightened (and the survey coord stamp hidden — it printed through the
mode chip), the prose letters one step under `--band-copy` with its KEY
ABOVE the paragraph (a 128px key column left a 293px measure and the
longest record ran 70px over the console), and below 760h the BEFORE
paragraph goes to the screen reader alone (ADR-068's rung). Every dossier
beat fits at all three reference shapes (smoke-pinned: `data-arc-tall`
absent, stage = viewport).

### 6. Shared evidence — share the evidence, author the frame

`lib/arcs/content/shared/` holds what the keynote and the portfolio letter
in common, imported **by reference** (pinned `toBe`): `loop-skills.ts`
(the roster), `loop-studio.ts` (the three ad cards + `ratiosOnly()` + the
ATL film), `vince.ts` (portrait, lead paragraph, the software-for-few
line), `loop-tools.ts` (`MODE_LEGEND` + the keynote's tips), and
`loop-figures.ts` (`LOOP_FIGURES` — copy-with-parity to the casefile's
`report.stats`, the `STUDIO_SHOTS` precedent, pinned equal in
`cases-registry.test.ts`). `ai-keynote.ts` swapped its literals for these
imports; its rendered markup and serialised def hash identically before
and after.

### 7. The envelope and the canon reach the arcs

- The **numbers canon** now fails on EVERY arc: 42 / forty-two, 90 % /
  95 %, 15+ teams, 20+ Skills/teams, "teams mapped", "8 teams", and a
  `14 teams` that does not say "using the layer".
- The **confidentiality envelope** (currency, thousands separators, board
  and repo links, private repo names, surnames) runs over the portfolio —
  `ENVELOPE_ARCS = ["portfolio"]`. **The keynote is exempt, and the
  exemption is recorded, not forgotten**: it is a client deck shown live
  that prints per-ad spend in euros on purpose (`STUDIO_SHOTS`'s note in
  `loop-earplugs.ts`). The portfolio is a page a reader forwards, so its
  copy of the studio cards keeps SKU + ROAS alone (`ratiosOnly`).
- 97 % parity: the portfolio joins the collect set.

### 8. One frame for a beat that arrives between scrolls (ADR-057, one wake)

The terminal controller runs a frame only from the scroll writer's rAF. A
beat that becomes near BETWEEN scroll events — a jump past the 120 % near
margin (a keyboard End, a programmatic `scrollTo`, a reel click landing in
one step) — was marked near by the IntersectionObserver after the last
frame ran, and parked blank until the next scroll. Found by the smoke's
stepped drive (the portfolio's beats are 1530px apart; a 6-step drive's
last step cleared the margin), real for End-key jumps on every terminal
arc. The near-callback now schedules one frame through the settle timer.

## Alternatives rejected

- **Re-creating the `.fl-*` markup under `components/arcs/`** — the copy
  that drifts; CLAUDE.md's whole argument against three copies of one
  value, one level up.
- **One section rendering four beats** — the controller would clock it,
  but anchors, the reel, the designation index, the unique-id guard and the
  markup test all key 1:1 on sections.
- **The blocks outside the console** — a second notch grammar: ADR-065 U5
  ties the blocks' BR notch to the TL+BR console they sit in.
- **Subset-copying `casefile.css`** — ~1800 lines of wireframe CSS ARE the
  drawing; a subset is a fork.
- **Component-level CSS import** — cascade order at the mercy of chunking,
  and theme.css's LAST law with it.
- **One big console with the rail** (the homepage scaled up) — three of
  four tools behind a click on a page that is read by scrolling.
- **A hinge interstitial before the overview** — the owner asked for ONE
  clear overview; the thesis is its title.
- **The envelope on all arcs** — the keynote deck prints € rows by design
  and quotes public dollar headlines.
- **Legend as `"<MODE> · <definition>"` with a starts-with pin** (the
  plan's first shape) — the chip already prints the mode from the record;
  the legend is the definition alone, pinned EQUAL to the shared sentence.
- **Side projects on the page** (Infernal Intelligence, Ledger) — owner:
  not Loop.

## Consequences

- `components/arcs/` now imports the casefile's dossier LEAVES
  (`ToolField`, `MediaLightbox`, `ConsoleFrame`, `wireframes/**`,
  `toolCardData`) — DOM-only by construction (no three/supabase/stores
  transitively); never `ServicesCasefile` / `TrackVisual`. The arcs rule
  names this as the one exception to "grammars are copied".
- A change to the bay is a TWO-surface change: run the ring smoke AND the
  portfolio smoke. The bay reader, the per-tool label pins and the
  terminal drive helpers live in `tests/visual/helpers/` so both specs
  read one source (a spec cannot import a spec without registering its
  tests twice). `readToolBay` takes a root selector — the landing mounts
  one bay, the portfolio four.
- `casefile.css`'s ≤960px `.fl-wire` rung, dormant since it was written
  (the landing never mounts a bay below the gate), renders for the first
  time on the portfolio's small-screen path — and is smoke-pinned there
  (a 16:10 box with real height, no collapsed marks, the label sets).
- Three gates stack on this page: 900 (v1 release), 960/961 (terminal),
  980 (console unwrap), plus the PRM pair. 961–980px is terminal-on,
  console-unwrapped (wrapper `height: auto`); documented, not "fixed".
- The overview grid shows five cards; the page is `noindex` like every
  arc.

## Left open

- **The arcs' light theme is partial, and it predates this ADR.** `theme.css`
  carries zero `.arc-*` rules, and `arcs.css`'s atoms (`.arc-desig`,
  `.arc-prose`, the card plates, the footnote) use raw dawn literals that do
  not flip — on parchment the keynote's eyebrows and prose print invisible
  and the cards go to a grey slab. The dossier's own rules use the triples
  and flip correctly (the console is themed by the casefile's own
  overrides); the sweep of the shared atoms is its own pass. Hand Rob the
  page in dark.
- **Role label**: the page prints "AI Adoption & Encoding Lead" (the
  doctrine's archetype); the keynote's About says "AI adoption lead", the
  casefile "Embedded AI lead". Harmonising is a separate sweep.
- **Roster `meta` values** "Kuhn" and "Rhodes" read as possible surnames
  (pre-existing on the keynote; the full-name guard passes single tokens).
  Owner to confirm.
- **Keynote drift noticed, not fixed**: its `cases` bylines say 2025 for
  Babylon / Heimdall where `PROJECT_CASES` says 2026, and its card bodies
  duplicate `PROJECT_CASES.challenge` verbatim. The dossier kind would let
  the keynote adopt one source.
- **`five-shapes`** is 35px tall at 1440×800 (an existing kind; the head
  pins lawfully). Could trim the sub by a line.

## Verification

- `npx vitest run tests/lib/arcs-registry.test.ts tests/lib/cases-registry.test.ts tests/lib/arc-terminal-markup.test.tsx tests/lib/arc-motion.test.ts tests/lib/tool-gallery-markup.test.tsx` — 74 passing.
- `npx playwright test tests/visual/arc-portfolio-smoke.spec.ts` — desktop 5/5 (+1 skipped), tablet + both phones 6/6 (+12 skipped by tier).
- `npx playwright test tests/visual/arc-terminal-smoke.spec.ts --project=desktop` — 10/10; `tests/visual/services-ring-smoke.spec.ts --project=desktop` — 12/12.
- Captured at 1280×720 · 1440×800 · 1920×1080, dark and light; the
  walkthrough opens over the pinned Mímir beat with the right `src` and
  label, Escape returns focus to the bar.
