# Maintenance — recurrence engine

> **When to open this:** at the start of any non-trivial change, and at the **end** of any conversation that modified code.  
> It connects **bugs** and **new features** to the same durable surfaces: `sentinel/`, `.claude/rules/`, `.claude/skills/`, and [LANGUAGE.md](../LANGUAGE.md).

---

## Cycle A: post-incident capture checklist

Run after **any** code change, before merge/push. If **any** question is _yes_, do the _then_ line before the work is “done”.

| #   | Question                                                                                                                 | If yes, then…                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1   | Did the fix take **more than two iterations**?                                                                           | Open or extend an ADR in `sentinel/decisions/`.                                                      |
| 2   | Did we **revert** a previous fix or go in circles?                                                                       | Open an ADR; link the prior attempt and what failed.                                                 |
| 3   | Did we discover a **class of bug** (sticky + fixed overlay, scale-edge drift, stale `onEnter`, fast-scroll scrub, etc.)? | Add a **pattern** to [BEST-PRACTICES.md](BEST-PRACTICES.md) with a short title and “why it matters.” |
| 4   | Must **two or more files** change together for the fix to hold?                                                          | Add or extend a **path-scoped** rule in `.claude/rules/` and mirror in `.cursor/rules/*.mdc`.        |
| 5   | Would a **runtime check** (Playwright, manual scroll script, console assert) have caught it earlier?                     | Add steps to the relevant `SKILL.md` debugging recipe, or to this repo’s test notes.                 |
| 6   | Does the fix **change an architectural assumption** (auth, scroll, layers, public API of a feature)?                     | Update or create an **ADR**; don’t only patch code.                                                  |

“Non-trivial” is the OR of the above — not a vibe check.

---

## Cycle B: new-feature scaffolding (before you build)

Use when adding **new surface area** (section, dashboard, public API, major hook), not for one-liners.

1. **Scan** `sentinel/decisions/`, `.claude/rules/`, and `.claude/skills/` for **prior art** in the same domain. Cite it in the ADR you open next.
2. **Open** `sentinel/decisions/NNN-short-name.md` with **Status: Proposed**. Document the **shape**, **alternatives rejected**, and **links** to related ADRs (e.g. 008/010 for anything touching landing v7 + brandmark).
3. **Build.** If a **recurring workflow** appears (debug steps, checklists, compositing invariants), add a `.claude/skills/<topic>/SKILL.md`.
4. **Wire paths:** add `.claude/rules/<area>.md` and `.cursor/rules/<area>.mdc` with `paths` / `globs` and pointers back to the ADR + skill.
5. When shipped: set ADR to **Accepted**; keep rules/skills in sync with reality.

If the feature would **contradict** an existing ADR (e.g. compositing, auth), the contradiction must be **resolved in the ADR** before merge — not as a drive-by.

---

## When to NOT capture

Skip Sentinel updates for **trivial** work so the ledger stays signal-rich:

- Typos, copy-only, comments-only
- Dependency bumps with no API migration
- Generated files (e.g. committed migration outputs) where the _intent_ is already in a prior ADR
- Formatting-only rewrites with no behavior change

If unsure, use **one** of the questions in [Cycle A](#cycle-a-post-incident-capture-checklist) as the bar: a single _yes_ means capture.

---

## Ledger

Chronological record of repo-wide maintenance passes (distinct from the Cycle
A/B capture rules above). Newest first.

### 2026-09-24 — the last proof card claims the expansion, the Embedded card says what it does, the third reading is the layer (ADR-124)

**Trigger:** the owner, in a dictated note after the week's client work: the
thing the practice sells sits between adoption and automation and the site
does not say so; the last proof card should be the climax; the Embedded card
"doesn't say enough about what it does"; the console's Substrate reading is
too vague.

- **Cycle A, rows 4 and 6 → ADR-124:** copy on three existing surfaces, one
  label rename that moves two Playwright pins and two rules together, and a
  deliberate narrowing of ADR-111 (the marketing team named on the Embedded
  card's baked face; the general claim stays in `serviceData.body`).
- **Rules:** `services-ring.md` §The Proof map corrected to WORK ·
  CONFIGURATION · LAYER; `proof.md`'s three mentions of the third reading.
- **Left open:** the five band names on the dial (a separate commit, so it
  reverts alone); card 2's "self-sufficient"; the prompt-tool-agent reading,
  declined this round.

### 2026-09-24 — the phone: the era instrument pins, the pile's reload is bisected on the device (ADR-123)

**Trigger:** the owner, on his iPhone (Safari and Chrome): the proof section
"reloads when I scroll" and the era section "is not locking into place".
Nothing here can measure a WebKit memory kill, so the era stage is fixed by
construction and the reload is bisected with four preview builds he opens.

- **Cycle B → ADR-123**, built on `diag/phone-pile` (a worktree beside the main
  tree) and landed on `main` the same day on his word — Part 2 and A–C as four
  commits, D held on the branch: Part 2 — `#voidwalker` is
  a runway and the stop on ≤700, `.vwd` sticky at `100dvh`, the eras on the
  dwell (`VOIDWALKER_PHONE_ERA_BAND`), two release targets, the hero on `svh`,
  programmatic scrolls on seats; Part 1 — the diag strip behind `?diag=phone`,
  the landing's own scroll restoration, the services boundary (A), the pile's
  frame hold and the covered field's paint (B), the bakes released until the
  band is near (C), the ring flag off (D).
- **Reverses on his word:** ADR-113 §1 (no sticky runway) and §2 (the hero's
  `innerHeight` exemption), its held dial turned — recorded as ADR-113 U2; an
  ADR-115 note corrects U1's drift claim.
- **Q3 (a class of bug) → BEST-PRACTICES:** an in-flow `dvh` box moves the
  document on iOS; a one-screen stop between pinned bands needs a runway.
- **Q5 (a runtime check that caught it earlier):** `voidwalker-phone-runway`
  (the lockstep), the seams spec's sweep (every rest lands on a seat or a pin —
  the check that would have measured the 807px), the geometry and stillness
  cases, `scroll-memory`.
- **Rules:** `mobile-sections.md` §10 / §11 amended, new §12; `voidwalker.md`;
  `landing-v7.md`'s clip paragraph; `services-ring.md`'s stale bake figure.
- **Not verified here:** the device, both parts; WebKit's snap radius; Vercel
  preview builds on this project.

### 2026-09-24 — the whole codebase, reviewed: fifteen findings (ADR-003 amendment)

**Trigger:** the owner ran `/code-review [ultra]` over the entire codebase
after the footer commit's review; fifteen findings, every one verified against
the source by two read-only passes before a line moved; his two calls: remove
the dev bypass entirely, drop the MCP route's `?token=`.

- **Cycle A, row 6 (an architectural assumption) → ADR-003 amendment:** the
  development auth bypass is deleted — `isAuthorized` is the strict verifier,
  `getServerUser` invents no user, the survey items' inline clauses and five
  client gates go, and the admin UI's fourteen token-less fetches take
  `lib/auth/adminFetch.ts`. `.claude/rules/auth.md` re-pointed.
- **Also fixed:** the Figma `fileKey` gated (`isFigmaFileKey`) and
  URL-encoded; the design MCP token header-only; crop bounds through a pure
  `cropRect`; the TFPC upload's short-file and size guards (and `decodeTFPC`'s);
  the analyzer's JSON shape and `history` array; the segments route's five
  numbers validated before Replicate and before the delete; the presets DELETE's
  double admin check; the footer's `mailto:` no longer `_blank`;
  `useLandingScroll`'s two per-frame `matchMedia` lists cached, its style read
  gated and its rect reads moved ahead of the frame's writes; `AuthProvider`
  parses `?code` instead of substring-matching; one `shiftMonth`; the musings
  registry memoised on the folder's mtime stamp; `park()` once per rung; the
  celestial query's timer cleared.
- **Q3 (a class of bug) → BEST-PRACTICES:** a development bypass on a server
  that shares production keys is production exposure; validate before you pay.
- **Q5 (a runtime check that caught it earlier):** `no-dev-auth-bypass`
  (walks routes, guards and gates), `figma-file-key`, `api-numbers`,
  `crop-rect`, `auth-params`; `owner-pass-route` flipped to pin the absence;
  `footer-nav` pins `external` to https; `musings-registry` pins the memo.
- **Found, not taken (his call):** two duplicate `waitForCardFonts` races with
  the same uncleared timer; `PATCH /api/survey/items` writes `annotations` and
  `analysis` unchecked; the voices page can send `Bearer undefined`; a timeout's
  seed fallback is cached for five minutes by `unstable_cache`.
- **Verified:** see the commit; the running dev server answered 401 without a
  token on the presets route (GET, DELETE), the survey items POST, the MCP
  route with `?token=` and the Figma file route with `../me`.

### 2026-09-24 — the footer's rise, reviewed (ADR-105 U4 §8)

**Trigger:** a code review of `44eeeb7c` — eight findings, all taken; the
owner: "fix all".

- **Cycle A.** ADR-105 U4 §8 records the eight. Code: the veil at `z-index: 3`
  (it painted under the head and the notes' ring); `headParked` — the head
  stays whole under a footer taller than the frame instead of re-decoding on
  the way back (1280×720, 307px past the runway's end); the ready stamp lands
  before the measure; `--ft-weld` declared once on `.stations` and aliased as
  `--mu-rise`. Record: `musings.md`'s four stale bottom-exit bullets, the
  lockstep readers in `home-v2.css` / `useCorridorExitScroll` / `voidwalker.md`
  / this ledger's ADR-121 line, `page.tsx`'s import comments, the glide's
  re-framing of U2's plate identity (site-footer.css,
  `measure-plate-luminance.mjs`), the gallery lab's feed-ride bound.
- **Q3 (a class of bug) → BEST-PRACTICES:** a gate that reads an element's own
  property cannot see what it is layered against; a layout-changing stamp
  written at the end of the tick means the tick measured the layout before it.
- **Q4 (files that move together):** the weld is ONE declaration now, so the
  pair that had to move together no longer exists; the test pins the single
  declaration and the alias instead.
- **Q5 (a runtime check that caught it earlier):** the capture reads the veil's
  z against the stage's interior, the head at the document's end, and the head
  AT ONCE on the way back up (a read after 700ms is after any burst).
- **Verified:** `musings-row` 73/73 (+8), `musings-gallery` 18/18, the whole
  unit suite 2173/2173, `tsc` clean, eslint clean; `capture-musings-row` PASS
  at 1280×720 (the head whole under the footer 307px past the frame, whole at
  once on the way back) and 1920×1247 dark (the rise exact at every quarter,
  the veil above the stage's interior); `capture-site-footer` 1920×1247 dark
  G3 pass, title 6.71:1 — the same reading U4 §7 recorded, at the glide's
  framing.

### 2026-09-23 — the musings row seats its copy and yields to the telemetry (ADR-121 U1)

**Trigger:** the coordinating session, off ADR-121's own stills: the open card
pooled ~120px of bare plate under a two-line lede, and at 1280×720 the last
card ran under the right rail's SECTOR readout.

- **Cycle A.** The body is a derived box (`--mu-body-h`, its tokens being the
  body's own declarations) and the cover takes the rest; the strip yields so
  the open card keeps its measure; `--mu-band-end` pulls the head's and the
  row's right edge in where the readouts would be reached. ADR-121 Update 1;
  `.claude/rules/musings.md`, CLAUDE.md and `landing-v7.md` re-pointed.
- **Q3 (a class of bug) → BEST-PRACTICES:** a 100vw station and a fixed rail
  disagree by half the scrollbar; and when a form is retired, list what each
  deleted feature was protecting (ADR-119's edge fade was the row's clearance).
- **Q5 (a runtime check that caught it):** the capture gained the body-seat
  gates (bare plate under the lede, the shared kicker line, the unclamped lede
  within its reserved lines, one-line titles, the open card at its measure) and
  the clearance gate (≥ 12px at rest, on hover and on Tab) — and they failed on
  the committed CSS first. The rung floor (961×720) is what found the
  scrollbar. The hover gates now carry their own event trace.
- **Verified:** the numbers are in ADR-121 Update 1.

### 2026-09-23 — the musings row opens on hover, the rack retired (ADR-121)

**Trigger:** the owner, on ADR-119 U2's tipped 3D row read live: _"what we
currently have looks ugly, so I want to remove the jukebox carousel thing
because it's not working. I just want to do something simpler"_ — Lighthouse
HQ's hover row, in the house material, the head's glitch kept, dead code gone,
placeholder copy for the design while the writing track runs.

- **Cycle B, in full.** ADR-121 (Proposed): the reference measured off its
  DOM, one transitioned `flex-grow`, `data-mu-open` moved by the writer on
  events, the body at the open width uncovered by the grow, the fixed cover
  band, the proof card's folder skin with the glass MEASURED (0 % long frames
  idle and hovering against the proof card's 15 %), one dwell, every card a
  real link. `.claude/rules/musings.md` rewritten for the row; CLAUDE.md,
  `landing-v7.md`, `voidwalker.md` and ADR-119's header re-pointed; the lab
  `/test/musings-row` with seven placeholder records (never in
  `content/musings/`).
- **Q3 (a class of bug) → BEST-PRACTICES:** a definite-width grid item grows an
  `auto` column to itself and every sibling in the column stretches with it —
  the capture's first run found a 930px cover inside a 120px strip.
- **Q4 (files that move together):** `MUSINGS_ROW_MEDIA` ↔ the sheet's rung
  (pinned); `--mu-open-w` ↔ `--mu-closed` / `--mu-gap` / `--mu-n` (pinned);
  the sheet's stage-rung glass ↔ `theme.css` BLOCK 4g (pinned by selector);
  the four cover-lockstep readers (untouched, all naming `.mu__band` — since
  ADR-105 U4, 2026-09-24, all four name `#contact` and the band is deleted).
- **Q5 (a runtime check that caught it earlier):** the capture gained the
  hover / leave / Tab / no-reflow / glass / reduced-motion / `--perf` gates and
  a second context for PRM; the glyph-in-strip gate is what found the column.
- **Deleted, with their guards' subjects:** `lib/musings/rowMath.ts`, the
  writer's pose loop and React state, `MusingCard`'s `isFront` / `tabIndex` /
  `aria-hidden`, the `.mu__window > .mu__rig > .mu__rack` wrappers, the sheet's
  3D rung, `--mu-step` / `--mu-tail`, `capture-musings-rack.mjs`.
- **Verified:** the eight vitest suites 214/214 (`musings-row` rewritten, 51);
  `about-voidwalker-handoff-boundaries` 8/8 · `services-ring-smoke` 11/11 ·
  `mobile-section-seams` 14/14 on both phones · `landing-page -g "HUD"` 2/2
  untouched; `capture-musings-row` PASS at 1920×1247 dark (+`--perf`) and
  light, 1280×720, 390×844, and the lab at five in both themes;
  `capture-site-footer` unmoved; `mechanical.mjs --scope ".mu" --prm` the six
  known findings in both themes and on the lab, no seventh; `tsc` clean;
  lint 337/337 at the ratchet.
- ⚠ **Not pushed**: a visible design change on the live site waits for the
  owner's word.

### 2026-09-21 — the era stage: the figure rises, the record is rebuilt, the figures are graded (ADR-082 U31)

**Trigger:** the owner, on `#voidwalker`: the avatars sit too low ("what I've
been repeatedly trying to ask"), Azeroth has "parts falling off", Latent Land is
"too glowing" beside the Architect, TRANSMISSION should be stacked glass cards
that hold images too, ON RECORD reads as "glorified PowerPoint frames", the band
should be a clearer thumbnail gallery, and the Expanse figure should kneel,
live-action, rifle upright, hand to his earpiece.

- **Cycle A + B.** The figure's cell lifts by `top` (alpha branch, gated); the
  alpha branch releases its clip and mask; `azeroth-v11` is v10 seated 33 rows;
  ≥701px the band is a five-bust gallery (`thumbPath`, `thumb.py`); `film?`
  becomes `media?: CharacterEraMedia[]` with `MediaLightbox` gaining an image
  branch (pinned first) and `EraMediaStack` rendering glass folder cards; ON
  RECORD is tagged rows; the avatar chain gains the two-step route (`gold.py`,
  `refs.py`, `sheet.py`, plate gates, the canonical key file). ADR-082 U31.
- **Post-incident rows triggered:** a `translate` lift would have been invisible
  to the handoff, which reads the seat through the OFFSET chain, and to its spec,
  which copies that arithmetic (BEST-PRACTICES; the weld spec compares rect and
  offset); an `aspect-ratio` flex item does not shrink without an explicit
  minimum, and a four-card pile ran 24.5px under the phone stage's floor under
  `overflow: clip` (BEST-PRACTICES; `capture-era-media.mjs`); a matte cut from
  the image being measured put "the edge" in the glow and reversed a finding
  (BEST-PRACTICES; `gold.py`); the datum lab mounted its figure before the codec
  probes settled and showed the floor branch — no overscan, no lift — while the
  landing showed both (BEST-PRACTICES; the lab waits now); the HUD panel lab's
  containment gate measured the slot's BOX, whose transparent headroom now
  legitimately passes the viewport top (it measures the painted extent);
  `theme-css-sweep` never read the datum sheet.
- **Verified:** vitest (character-eras, character-era-hologram, media-lightbox,
  era-media-stack, voidwalker-datum-sheet, theme-css-sweep, type-material
  ratchet, phone units); both handoff specs 11/11; the eras probe at three
  rungs; the phone probe (only TRANSMISSION moves); the figure-span probe;
  `capture-era-media.mjs` at five shapes; the panel lab's era surface 86/86;
  `gold.py --selftest`; tsc and eslint clean.
- **Not pushed.** The figures (C2 onward) wait on the owner's G0 read of the
  grade; the phone gallery is his device call; 2016 waits on his photograph.

### 2026-09-21 — the arcs dossier reads like travel data (ADR-118 U3)

**Trigger:** the owner, on U2's stills with Starfield's TRAVEL DATA panel:
the band should take _"the same type of gradient as in our proof section"_,
the configuration _"like Tensor Gold. Same with the accents"_, the button big
at the bottom with no key hints, and the standing part _"like a terminal type
of interface … jump time with a frame, and then, to the right of it, the
value"_. Asked, he dropped the brief's sentence.

- **Cycle A, the dossier only.** The band takes the proof card's folder tint;
  a readout of framed keys (filled, `--sh-well`) with framed right-set values
  replaces the brief and its strip; the die is `--gold` with its words on
  `--gold-contrast`, its legs gold, its wires amber, the kind codes
  `--gold-ink`; one full-width button (the proof card's `.pf-watch`) replaces
  the CTA and the hints. `SheetDossier.lede` / `Engagement.lede` are deleted.
  ADR-118 U3.
- **Post-incident rows triggered:** a gradient is invisible to both contrast
  walks (the smoke composites the band's tint at each word's x); a pixel
  check whose reference edge runs along a tint measures the tint (the ring
  check reads the dossier's bottom edge now, re-proven closed 0.64–1.10 vs
  open 0.20–0.51); the board's floor at 1280 × 720 was one sentence away from
  failing on a dossier no test opened (every proposal's board is asserted
  now); and `--sh-knock` pointing at the ground would have put parchment words
  on gold in light (retargeted to `--gold-contrast`).
- **Verified:** vitest 22 files / 468 (ratchets at zero); `arcs-instrument-smoke`
  26/26; `arc-terminal-smoke`'s overview case; `subpages-smoke` 14/15 (the kit
  pile, pre-existing); the mechanical gate 8/8, 10 of 24 gold marks; tsc and
  eslint clean.
- **Not pushed** (U2 and U3 go together on his word). ⚠ The ship's rubric
  must count the configuration as one gold object before wave 04.

### 2026-09-21 — the arcs log takes the references' composition, and the dossier draws the configuration (ADR-118 U2)

**Trigger:** the owner, on U1's stills: _"it really feels like a fucking
glorified PowerPoint … Have you actually looked at these references?"_ — the
kinds _"should actually divide the list on the left"_, the cards want _"notches
on the left"_ and _"some sort of icon"_, and the dossier's key visual goes for
_"a visual of the intelligence configuration … that sort of node from a
computer"_.

- **Cycle A, the same surface a second time in a day.** The kinds divide the
  log (the filter and its law deleted), a block is a page icon beside a plate
  notched bottom-left with the client as its title, and the list may run past
  the screen beside the sticky dossier. The dossier keeps its band, brief,
  status strip and CTA; the picture, chapters and readout go with
  `public/arcs/previews/`, `previews.json` and `capture-arc-previews.mjs`; a
  proposal's dossier DRAWS its configuration (`components/sheet/config/`), the
  links derived from its own sentences (`lib/arcs/stack.ts`). The `dossier`
  knob and direction SJ are deleted with their mirrors. The Trinny offer
  record moved to `lib/arcs/content/trinny-london-offer.ts` (the route's old
  path re-exports it). ADR-118 U2.
- **Post-incident rows triggered:** every evenodd ring on the page was OPEN —
  one path through both contours paints a bow-tie — and a mid-height pixel
  check passed it (rule in `sheet.md`; the smoke compares edge energies; the
  same fault in `sheet.css`'s console and `proof-stack.css` is flagged, not
  fixed); a deep link to the already-chosen row stopped settling when the
  picture's promise went (the controller writes `data-dos-id` on arrival); an
  sr-only name fails every band walk (`aria-label` instead); the gate's
  `.sh-log__row.is-on` entry went dead a second time (re-pointed at the plate);
  SVG line steps clear the em box, not the ink; neighbouring crops may differ
  by at most 1.23 in aspect or the shape between them letterboxes (13 % at
  1920 × 1080 on the first spacing). ⚠ And a capture trap: `node` handed a
  `/c/…` path under `MSYS_NO_PATHCONV=1` writes to `C:\c\…` — pass `C:/…`.
- **Verified:** vitest 17 files / 406 (the sheet suites, `sheet-config-fit`
  152, `sheet-log-glyphs`, the Trinny suites, the import and gate doctrines,
  the three CSS ratchets at zero); `arcs-instrument-smoke` 20/20;
  `arc-terminal-smoke`'s overview case; `subpages-smoke` 14/15 (the kit pile,
  pre-existing, U1's entry below); the mechanical gate 8/8 on `/arcs` and the
  kit, both themes, both viewports; tsc clean.
- **Not pushed; wave 04 waits for his read** of the stills.

### 2026-09-21 — the arcs log is blocks, a gutter from the dossier (ADR-118 U1)

**Trigger:** the owner, live, on the first log: _"it looks messy. It needs
more breathing room between the two panels. And each section on the left side
needs to feel more like blocks instead of glorified word document."_

- **Cycle A, on a surface built the same morning.** One bordered block per
  engagement, no group heads, no chips (the field stays, lettered nowhere), a
  `--log-gutter`, the filter level with the dossier's band, and the blocks
  dividing the device so the list ends on the dossier's floor; the runs
  ordered by newest filing (a new law in `instrumentViolations`); the `rows`
  knob and direction SH deleted with their mirrors. ADR-118 U1.
- **Post-incident rows triggered:** a token that needs a value from lower in
  the tree is declared THERE (`--log-block-h` beside `--log-n`, rule added to
  `sheet.md`); the mechanical gate's two-class ACCENT_ALLOW entry was dead
  (`describe()` takes the first class) and a pressed toggle is state now; the
  9svh ceiling exists because the kit, not the record, hit 8svh.
- **Verified:** vitest 173/173 (sheet suites + the three CSS ratchets, still
  zero); `arcs-instrument-smoke` 15/15 incl. the kit and the 961–1100 rung, its
  new guards shown to fail on the old geometry; `arc-terminal-smoke` green;
  the mechanical gate clean on `/arcs` and the kit, both themes, both
  viewports; tsc clean. ⚠ `subpages-smoke` "the kit's pile stacks under a panel
  that sticks" is RED and pre-existing: it starts at `top − 96`, where the
  panel sits at its natural y 217 against a 64px sticky seat, so it measures
  before the panel has stuck — `/test/subpage-kit` loads none of U1's files.
- **Not pushed; wave 04 waits for his read** of the first stills.

### 2026-09-21 — `/arcs` is the owner's instrument: a pass, a monitor, a log (ADR-117, ADR-118)

**Trigger:** the owner — the overview _"should only be accessible to me when I
am logged in"_; its first screen _"a sort of grid timeline … the different
projects mapped onto it"_; the next _"a new viewport"_ with the arcs listed
per client _"so they really feel like quests from a video game"_ and a card
for the one clicked; _"really run your eval pipeline"_.

- **Cycle B, in full.** ADR-117 (the owner's pass: `force-dynamic`, gated in
  the page, never in `proxy.ts`) and ADR-118 (the instrument), both Proposed;
  `.claude/rules/auth.md`, `sheet.md` §The arcs instrument, `arcs.md` (the
  `date` field) and their `.cursor` mirrors; LANGUAGE (Monitor, Log, the
  log's dossier); `docs/design/subpages/README.md`; the turnstone ship's
  rubric 0.2.1 (blocks M and L), its second negative pole SF, a calibration
  wave and wave 03.
- **Q1 (a guard that was not guarding):** the capture's observable
  `data-dos-id` fired on the swap's timer while the dossier's lazy picture was
  still streaming in, and wave 03's first shoot sent seventeen of twenty
  second-pick stills to the grader half-painted with every gate green — the
  grades were discarded and the wave re-shot on the fix (`25edb81a`). The
  smoke now reads the picture at the moment the attribute appears, and failed
  on the old code before it passed on the new. And the smoke's "the
  wordmark sits under the device" was true while the frame's hero lockup sat
  7px under the monitor's corner on every monitor still — the wordmark is
  docked from the first frame now (`ccd56876`), the guard asserts clearance
  and fails without the rule, and the wave was shot a third time. And four
  `subpages-smoke` cases had been red since ADR-114, each asking for
  something no code produces.
- **Q3 (a class of bug) → BEST-PRACTICES:** five entries — a test that asks
  for what nothing produces; a hand-made browser context inherits nothing; a
  stale alternate-`distDir` build breaks `tsc`; an observable written on a
  timer names a state the page has not reached; an order assertion is not a
  clearance assertion.
- **Q4 (files that move together):** `lib/sheet/directions.json` ↔ the ship's
  `armada.toml` (four new knobs, five directions, asserted by the capture and
  a test); `lib/arcs/previews.json` ↔ `public/arcs/previews/` (a test re-reads
  every file's header); `mechanical.mjs`'s `ACCENT_ALLOW` ↔ the instrument's
  gold (four named marks); `todayIn` is called by the page alone, so a test
  pins the day.
- **Verified:** vitest 220/220 over the thirteen suites that bind this work;
  `tsc` clean in source (its only two errors are in a `.next/types` left by a
  2026-09-20 `next build` that predates the kit route — not this session's
  build, not cleared); `arcs-instrument-smoke` 10/10 on `next dev`; on a
  production build with a signed pass, the instrument, sheet and terminal
  smokes 33 passed, 1 skipped (the kit is proxy-blocked there);
  `verify-owner-gate` 31/31; the mechanical gate clean on `/arcs` and the kit
  in both themes at 1920×1247 and 1280×720.
- ⚠ **Left as found:** `npm run lint` 339/337 and services-ring's `#contact`
  cover assertion (both recorded in the entry below); the shared 3003 dev
  server's `/arcs/[slug]` worker still answers 500 and needs a restart, which
  is the owner's call — stopping it was refused as someone else's workload,
  so this pass verified on its own build instead.
- **Wave 03** (the turnstone ship, rubric 0.2.1, three runs; ten folders,
  120 stills, the mechanical gate clean on every cell): the house passes
  every still at both viewports; the rubric separates only SG (its full
  axis merges marks, M3), so the pick between SB, SH, SJ and SL is the
  owner's eye. The log stills are byte-identical across three directions, and
  7 of 8 identical triples got one verdict. The stranger reads the monitor as
  a timeline dashboard and the log as an archive, never a quest journal.
  Ten galleries and an index, `delivery/review-wave-03.html`; no handback.

### 2026-09-21 — The phone's ruling sheets fit their bay; the epilogue hands the top to the first card (ADR-116)

**Trigger:** the owner, from his iPhone — the studio card's GOVERNANCE and RED
LINE _"were never optimized for mobile"_, and the epilogue title and button
_"disappear a bit too quickly, resulting in a bit of a void on top … disappear
in sync with the cards of the proof section"_; the CTA to read _"How it looks
in practice"_.

- **Cycle A.** ADR-116 (Proposed); `mobile-sections.md` §2 (the belt's
  attribute, the card's kill line), `proof-stack.md` §The phone's ruling
  sheets, `proof.md` (the cross as `--hub-cross`).
- **Q1 (a guard that was not guarding):** `proof-stack-mobile-smoke` measured
  only the RECORD sheet, so 875px of comparison in a 375px bay shipped green —
  it reads the field sheet's ink now. And `mobile-section-seams` pinned the
  45 % kill as law; on the split rung it now pins the hold and the hand-off.
- **Q3 (a class of bug):** a reset at lower specificity than the rule it
  resets is silently dead (the cross); an attribute whose meaning moved under
  a belt keyed on it (`data-corridor-exit`, ADR-108) kills a painter early; a
  subgrid's own gap is subtracted from its items. All three are in ADR-116.
- **The copy (shared epilogue, every route):** the CTA reads `HOW IT LOOKS IN
PRACTICE` — desktop and mobile together; the line below (2026-09-14) is the
  record of the one it replaced.
- **Verified:** `tsc` clean; the unit suite 1724/1724 (the new
  `signal-handoff` included); the phone smokes 12/12 (`proof-stack-mobile`)
  and 40/40 + 2 skipped (`mobile-section-seams`, `services-ring-mobile`) on
  both phone projects; `trinny-london-smoke` 15/15; `landing-page` 14/14 with
  NO re-baseline (the HUD frames and the two epilogue frames unchanged);
  `arc-portfolio-smoke` 13/13 + 1 skipped on a fresh worktree server.
  ⚠ **Two pre-existing reds, measured on bare HEAD and left for their own
  passes:** `npm run lint` is at 339 warnings against the 337 ratchet, and
  services-ring's `#contact` cover assertion (`bottom >= innerHeight`, the
  luck-dependent form `landing-v7.md` names) fails without any change here.
  And the shared 3003 server's `/arcs/[slug]` static-paths worker had died
  (`Jest worker encountered 2 child process exceptions` since 14:21 in its
  log) — every `/arcs/<slug>` answered 500 there and 200 on a fresh server and
  on thoughtform.co; it needs a restart, which is the owner's call.

### 2026-09-20 — The sheet: a design system for subpages, and the ship that grades it (ADR-114)

**Trigger:** the owner — _"our current arcs look bad"_, a design system for
the overview subpages (the arcs index, a Home sessions page, a blog) on
Hermeus and Lighthouse with the retrofuturistic instruments as the voice,
_"it's very important that there's some variety in how we build blocks …
not every section has just three blocks"_, and then the re-scope: _"create
your own eval pipeline to create all of the landing pages … Don't skip any
steps."_

- **Cycle B, in full.** ADR-114 (Proposed); `.claude/rules/sheet.md`;
  `docs/design/subpages/README.md`; the `turnstone` ship with its own
  `CLAUDE.md`, rubric 0.1 and register strips; five vitest suites and a
  Playwright smoke; the terminal smoke's overview case moved to the sheet.
- **Q3 (a class of bug) → BEST-PRACTICES stands on the existing entries**
  (a composed string is outside every content scanner; a script that waits on
  a value it set has no wait) — the two new ones are recorded in the ADR: a
  reveal inside the observer's bottom margin never lands, and MSYS rewrites a
  child's `/route` argument.
- **Q4 (two files move together):** `directions.json` ↔ `armada.toml`
  (asserted by the capture and a test); `sheet.css` ↔ `theme.css` (the light
  block); `serviceData.ts` ↔ `servicePlateData.ts` (`ctaHref`, pinned);
  `next.config.mjs` ↔ `content/musings/` (traced, pinned).
- **Deleted, with their guards' subjects:** `ArcClientPage`, `ArcClientGroups`,
  `ArcCardGrid`, `ArcCard`, `ArcKindFilter` and ~370 lines of `arcs.css`.

### 2026-09-20 — The phone's deck flip: the copy un-types, the cards stack, the deck becomes the portrait, `#about` is a band (ADR-115)

**Trigger:** the owner, from his iPhone, hours after ADR-113 — _"when you
scroll past the 'AI capability your team owns' section, all the text should
disappear with a glitch effect. The cards should then stack on top of each
other, rotate them as we have on desktop, and then reveal my profile picture
… my name at the top … the first paragraph of my bio … the rest revealed
with a small chevron … the parallax section from the About section should
disappear."_ And the question underneath it: is reusing the WebGL cards the
performant route.

- **The answer is yes, and it is the only route that can look like the
  desktop.** The faces are bakes the DOM cannot draw; the canvas already
  paints every frame through `#services` and `#about` on this rung; the deck
  is pose math on four existing groups plus four back planes visible only
  during the flip; one lazy bake and a 61 kB photo against a 183 kB image and
  a cluster deleted. Measured in Chromium at 390×844: p50 4.2ms, p95 17–24ms.
- **Five changes on the ring rung, all behind `SERVICES_ABOUT_DECK_MOBILE`:**
  the services band's exit enters ADR-047's stack while the copy UN-TYPES over
  per-line leaves; `#about` welds `-100svh` to the band's travel and the ring's
  seat freezes from exit 1; `#about` becomes a sticky band (name · role · seat
  · ¶1 · chevron) with a scrubbed decode on its own windows; the deck squares
  up and hands over to a DOM image of the same bake before the band unpins;
  parallax is off on phones. Desktop byte-identical (the HUD snapshots and the
  desktop smokes).
- **Three lifts** (`portraitBake`, `lineLeaves`, `scrubbedDecode` — three-free,
  shared with the Trinny route) landed as their own zero-visual-change commit.
- **Blink's snap law, measured** (two scratch walks): an aligned position
  attracts every stop within ~280px and a covering area never overrides one.
  The station is `none`; two targets inside the runway (the flip's end,
  `end`-aligned; the reading state, `start`) are the seats.
- **The handover diff found three things** (18.7 → 3.6/255): the fanned deck
  (squared up), the nearest card a z-pitch large (shifted onto the pivot), and
  trilinear mips (`LinearFilter`).
- **Records:** ADR-115 (new); ADR-047 U13, ADR-108/109/110 pointers, ADR-045
  and ADR-113 U1; `mobile-sections.md` §11 (+ paths, Verifying),
  `services-ring.md` §The ring on phones, `landing-v7.md` §about; CLAUDE.md's
  phone bullet; BEST-PRACTICES (the handover, the snap radius).
- **Guards:** `about-band-math.test.ts` (new), `services-ring-mobile-gate`
  (the clock with the deck), `phone-viewport-units` / `layout-viewport-height`
  (the new sheet and writer), `services-ring-mobile-smoke` (three ADR-115
  cases), `mobile-section-seams` (the weld measured at two positions, the two
  targets), `scripts/probe-mobile-deck.mjs` (new, headed).
- **Deferred:** the device read (the gate); `scroll-snap-stop: always` on the
  reading target if WebKit flings past it; the pacing dials (62svh exit,
  240svh runway); ADR-112's 342 kB of phone portraits.
- **U1, the same evening, from his first device read** (the section "moves up
  and leaves so much white space at the bottom"; the card's copy "barely
  legible"): in Safari the collapsed bars grow the frame ~100px and the fixed
  chrome follows while a `100svh` band does not. The two pinned bands are
  `100dvh` now (the one content box allowed in that unit — the runway, the
  station and the weld stay in `svh`; the writers measure the pinned travel;
  the about band's snap targets follow in dvh), the card is 0.8 of the frame
  at seat fill 1.25 and bakes at 0.75. `phone-viewport-units` pins the two
  sheets at 1 and 4; the gate test's two bake pins retuned. Second device
  read pending.

### 2026-09-20 — The phone locks in: snap seats, one viewport clock, constant reserves (ADR-113)

**Trigger:** the owner, from his iPhone, with six stills — _"when I enter a
section, the components or the section itself take a bit to settle into the
right position. Before it does, it's either too high or too low … when you
scroll to the section, the components lock in … you can move the section and
its elements around a bit, and that's super annoying."_ The Eras stage with
its title ON the TL bracket in one still and its era stops THROUGH the
settings icon in the next; the services band's title 27px under the readout
with the toolbar collapsed. Everything through ADR-082 U29 was live on his
phone when he took them.

- **Three defects, one symptom.** `#voidwalker`'s phone instrument was a
  one-screen block in normal flow with nothing locking it (the pin and the
  runway are `min-width: 1101px`), so it sat wherever the scroll stopped —
  both Eras stills. A live `dvh` term (`--vwd-chrome-clear`, U26) reflowed
  the era band for every frame of the toolbar animation. And every scroll
  writer divided svh-authored geometry by `window.innerHeight`, which follows
  the toolbar on iOS — the ring's beat clock, the pile's `--pc-depth`, the
  corridor camera, the epilogue signal all stepped while the thumb was still.
- **Snap seats.** `html { scroll-snap-type: y proximity }` on the phone rung;
  `#services` · `#about` · `#contact` · `.vwd` are `start` stops. ⚠ The seat
  is the INSTRUMENT, never `#voidwalker` (its padding would put the stops
  below the fold). Not the hero, not the corridor host, no sticky child, no
  scroll-padding, not PRM-gated. A stop past a station taller than the screen
  stays (the covering rule); the one-screen instrument snaps from either side.
- **One clock.** `lib/viewport/layoutViewportHeight()` —
  `documentElement.clientHeight || innerHeight` — adopted by
  `useServicesStageScroll`, `useStackedCardsScroll`, `useCorridorExitScroll`,
  `useDepthScroll`, `MobileEpilogueSignal`, `HudNav`, `beatScrollTarget`;
  `--hero-lift` stays on `innerHeight` (paired with the hero's `100dvh`).
  Desktop byte-identical by arithmetic; the HUD snapshots passed unchanged.
- **No live unit inside content.** `--vwd-chrome-clear` is the constant band
  again (U26 reversed — 56px of figure column in the collapsed state is the
  price of stillness); `.station`'s `100dvh` floor is KEPT because it binds
  only on `#contact`, the footer, whose legal bar should hug the real floor.
- ⚠ **Four things the harness had to learn.** A programmatic scroll is a snap
  candidate (the seams spec's rests moved to the seats plus a mid read past
  the radius; `seekTo` accepts a landing on a seat; `rollTo` waits on
  `scrollend`); `scroll-snap-type: y proximity` computes to `"y"`; Chromium
  resolves every viewport unit to one number, so the units are proven by
  SOURCE ratchets (`layout-viewport-height`, `phone-viewport-units`) and the
  device, never by a phone project; the ring smoke's `#contact does not fill
the viewport at the kill edge` failure is pre-existing (reproduced with the
  old read) and is the footer's sub-pixel `bottom >= vh` the landing rule
  already records.
- **Deferred, gated on his screen recording:** the fixed-vs-sticky transient
  (iOS lays out `position: fixed` against the layout viewport with hysteresis
  during the bar animation while sticky content rides the visual viewport); a
  whole-document sticky HUD would fix it at the cost of seating the bottom
  row 99px above the real floor when the toolbar is collapsed.
- **Captured:** ADR-113; ADR-082 U30; `mobile-sections.md` §3, §5, §8, the
  new §10, Verifying and its `paths:`; `voidwalker.md` (the U26 bullet);
  `services-ring.md` §The ring on phones; CLAUDE.md's new phone bullet;
  BEST-PRACTICES ×2; `tests/lib/layout-viewport-height.test.ts`,
  `tests/lib/phone-viewport-units.test.ts` (+ `tests/lib/helpers/cssBlocks.ts`,
  lifted from `type-material-tokens`); `mobile-section-seams` (rests → seats,
  snap-aware seek, three new cases, the horizontal audit);
  `scripts/probe-mobile-lockin.mjs`; the memory note.
- **Left open:** the device read (the checklist is in ADR-113), the
  `scroll-snap-stop: always` dial, the sticky-frame follow-up.

### 2026-09-15 — The head decodes in place, and the plates become the deliverables (ADR-103)

**Trigger:** the owner's next stage on the proposal page — between the board
and the phases _"the little eyebrow thing above it disappears"_ while _"the
hero one and the paragraph always appear at the same location"_, so _"morph it
via a glitch effect"_; and a third beat after the phases, the deck's "What we
help build." slide cut to HIS three deliverables (_"not a simulacrum of those
three modules"_): the plates _"collapse a bit and then move to the left,
vertically stacked"_ into a carousel the reader scrolls through, a clean visual
per item on the right, the first _"one of the images we've generated"_ with
_"a super simple computer vision animation"_. The wordmark item in the same
message had already landed (`e369bfd7`).

- **The head never closes.** ADR-102's withdraw keeps only the ledger svg; a
  second carrier layer in the stage (`headCarrier.ts`) holds one leaf per
  rendered LINE of each head run and decodes the three heads into each other
  on ADR-102's own timing — chrome and title scramble, the paragraph types as
  ONE typewriter (per-line typing read as three cursors on the still).
  ⚠ A `Range` rect is the content area: the half-leading comes off or the weld
  is a line-height off. ⚠ The observer filters BOTH layers.
- **The `steps` kind** (ADR-052's fifth enumerated exception) renders
  `#outcomes` inside the same pinned scene: the plates COLLAPSE to their bands
  (LIFO), three more carriers take the bands to the rows (one material — the
  rows ARE plate heads), and the stage steps through three items on
  `SCENE_STEP_SPAN` 0.5, the open row filled and the rest ring-only; the first
  stage is a computer-vision SCAN of the packshot, every channel finished by
  default so PRM / no-JS read whole; runway 325 → 605svh.
- ⚠ **The rows are measured whole, then collapsed** before the seam reads the
  landing boxes; ⚠ the seam guard reads `headCarrier.ts` as text (a comment
  saying `scrollY` fails it); ⚠ two 8px mono fixes collide over a 200px field
  (container query); ⚠ `getBoundingClientRect` on a clipped plate reports the
  box, not the clip.
- **Captured:** ADR-103; `.claude/rules/trinny-london.md` §The head decodes;
  `.claude/rules/arcs.md` §The client model (the `steps` bullet); both
  `.cursor` mirrors; CLAUDE.md's Trinny bullet; `trinny-seam` (12),
  `trinny-offer` (6), `arc-terminal-markup`; the smoke's extended scene walk
  (5k–5q, band → row welds, four head welds, the outcomes' feet, PRM); capture
  stops 34–42.
- **Left open:** the runway and the step span (his read), the copy (his
  voice), a generated 4:5 still for the scan, real drawings for stages 2 and 3,
  label decoding on the scan, dark.

### 2026-09-14 (fifth pass) — The proposal heads seat from the frame's centre, on Linear's columns (ADR-099 U2)

**Trigger:** the owner's live read of the proposal page one day after asking
for the ADR-099 datum — the heads are _"positioned more toward the top"_; his
reference is a Linear feature section (H2 left, paragraph right) where the pair
_"feel nicely centered in the middle"_; _"analyze it, understand the logic, and
then apply it"_.

- **The reference was read off its own CSS, not its screenshot.** Linear's
  `PageSection` is `padding-top/bottom: 128px` on a CONTENT-HEIGHT section, a
  `1fr 1fr` header with the title and the paragraph both `align-self: end` and
  the action in a subgrid row, `18ch` / `38ch` caps, type at exactly 2:1.
  Nothing is centred against the viewport; the "centred" read is a narrow
  band, two equal halves, and a figure filling the space so there is no floor.
- **The defect was arithmetic and one day old.** §3's datum was the homepage
  masthead's 0.107, solved for a different beat's body; at his 1920×1247 it put
  every head 220–250px above the hero's headline (0.305) and `#about`'s title
  (0.285), with 170–740px of bare floor — §3's own "the slack pools at the
  FLOOR", come due. At 1280×720 the same beats were full.
- **On a page of viewport-tall frames "centred" and "one datum" conflict when
  bodies differ**, so the fork went to the owner drawn as three options; he
  took ONE DATUM SOLVED FROM THE FRAME'S CENTRE — `(100svh − C) / 2`, C = 600,
  floored 48 and capped 360 — over per-beat centring (his §3 ruling reversed,
  heads 180–440px apart) and content-height sections (Linear literally, not a
  deck). 60 at 720h (was 77), 100 / 240 / 323.5 at 800 / 1080 / 1247h; the two
  datums cross at 763h. Gated to the frame tier, the complement of the
  format's `min-height` release.
- ⚠ **C IS COUPLED TO ADR-102**: the scene's plates' feet sat 1.5px inside a
  720 stage under the old datum, so C ≥ 563; the feet guard runs at 1440×800
  now, the tightest tall shape (the full 9vh margin above the 760h rung plus
  a 100px datum).
- **The head took Linear's columns**, proposal-format only: `.arc-head--split`
  at `1fr 1fr`, the intro stretched so the right-rail chrome stays put and the
  paragraph starts at the midpoint and takes the column (three lines where it
  was four). ⚠ `--split` only (a rule on `.arc-head` at (0,3,0) flattens
  `--solo`/`--center`), gated at 901px (the stacking rung is (0,1,0) and loses
  on specificity from any position — source order cannot save it). Not taken:
  `align-self: end` (the eyebrows are the shared line).
- ⚠ **THE COST MOVED TO THREE OTHER PAGES.** The format scope reaches Suri,
  Perfect Ted and Hungry Minds; their films and sheets consoles were `svh`
  clamps tuned under the old datum (38 / 66px of floor at 1247h) and went 111 /
  42px past the frame at 1080h. Both take the `.arc-intel` budget as a second
  term, SCOPED TO PROPOSAL ROOTS — a fallback either invalidates the height on
  the portfolio (`auto`, a collapsed console with nothing throwing) or binds
  there at laptop heights; 148 for the head, not the intel's 124, because those
  titles run three lines. Long list beats grow instead (Trinny `how-we-work`
  +49 at 1080h; Hungry Minds `the-rule` +108 at 1247h, already over at laptop
  heights before this).
- **The guard changed its question**: the datum band `40 < seat < 200` failed
  at BOTH viewports under the new seat (the eyebrow is datum − 34: 26px at
  720h, 289.5 at 1247h); it reads `#configuration`'s `paddingTop` against the
  rule with C read off the root, never restated. Three viewports on a serial
  spec needed `test.slow()` — the third shape tipped a 30s budget.
- **His read of the first cut found the title budget.** The phases beat
  "feels a bit lower" than the board's with the heads on one row — a
  three-line title seats its body 48px lower under a shared datum, and Linear
  holds its head band constant by copy discipline (18ch, the break authored
  as `<br/>`), never by moving the head. Measured: the 20ch cap resolved 23px
  under the column and cost one title its second line (lifted); three titles
  needed 594–686px for two lines against 564 and were shortened on his choice.
  A cap cannot buy what the column does not have — copy can.

### 2026-09-14 (fourth pass) — One pinned scene: the configuration becomes the plates (ADR-102)

**Trigger:** the owner's live read of ADR-101's seam — it _"jitters and lags"_,
it starts _"almost immediately"_ once the studio is entered, the cards around
the chip must _"collapse inwards so it feels like one configuration"_ before
anything moves, the chip should go _"to the utter left"_ first and the plates
open to the right of it out of their own head bands, the title revealed too
and the paragraph _"only after all the cards have been revealed"_. Plus three
copy edits on the shared corridor epilogue.

- **The diagnosis was measurable, and it was the hero curtain's finding
  again.** ADR-101's carrier was posed in DOCUMENT space from a rAF while it
  had to move smoothly relative to a page the compositor was scrolling; a
  main-thread writer lands one wheel step behind every step. And `t` opened
  on the first pixel past q = 1, while the arrival's 1.6 s ladder was still
  running — there was no runway in which to be deliberate.
- **ADR-102 — `#proposition` is ONE PINNED SCENE.** The slot is a sticky stage
  that pins on the same frame the record is struck in (q = 1 IS the station's
  top at the frame's top, so ADR-099's blank frame — a pin that began before
  the record arrived — cannot return); the PHASES beat renders inside it over
  the board (`TRINNY_SCENE`; `#offer` opens on the flow); the carrier lives
  inside the stage. Everything the choreography touches is stationary while
  the clock runs, and the clock is in VIEWPORT UNITS so a runway edit can only
  truncate. Dwell · withdraw (the board's head and the ledger close on the
  scrubbed aperture) · fold (each node SHRINKS before it travels, because
  tools and reach paint OVER the chip; the seat lane's dash sign is opposite)
  · hand-over · slide to plate 1's band · title · three unrolls out of their
  bands with two copies between · paragraph · settle, over 325svh.
- ⚠ **SIX SILENT WRONG ANSWERS, EACH ON THE READOUT OR THE STILL.** (1) A
  `ResizeObserver` on the slot goes blind once the slot is a fixed-height
  stage. (2) A React root's first `render` CLEARS its container — the layer
  appended at effect time was gone, readout "no layer". (3) `measureSeam`'s
  probes mutate the subtree the `MutationObserver` watches, which re-measures,
  which appends probes — a microtask loop that hung the tab with nothing
  thrown; `takeRecords()` after every measure. (4) `data-tl-scene-past`
  cleared on the way back re-matched every `:not()`-scoped `animation:` rule
  and REPLAYED the whole strike (eleven animations running at the pin); it is
  a latch cleared only when the record strikes out. (5) A copy born ON the
  band it peels off decoded from zero and the real band's own words shuffled
  under the reader; the words hold until the copy has separated. (6)
  `−top / vh` at the pin is `−0`, printed as `-0.00` on the stamp the roller
  converges on.
- ⚠ **AND THE GROUND'S `overflow: hidden` HAD TO GO.** The canvas is
  viewport-sized and sticky inside a ground four viewports tall now (a canvas
  spanning it is a 24-megapixel shader pass per frame), and an ancestor with
  a non-visible overflow is a scroll container — the canvas would have stuck
  to the ground's own never-scrolling box, frozen one viewport above the
  station with every geometry gate green. The feather became a pair solved
  per frame against the CANVAS's rect.
- ⚠ **A SEVENTH, FOUND ON THE STILL AFTER THE GATES WERE GREEN: THE PLATES'
  FEET RAN 23.7px PAST THE STAGE AT 1280×720.** Inside the stage `#phases` is
  `inset: 0`, so its box IS the stage and ADR-100's "one viewport" read on the
  beat cannot fail whatever the content does; the pre-existing 23px overflow
  that a flowing beat absorbed by growing became the last line of the
  DELIVERABLE band under the frame's edge. The first cut trimmed the beat's
  bottom pad and claimed 28px back — measured 743.7 before and after: the
  datum seats the head at `start`, content flows from the top, the bottom pad
  is never in the sum. The head's margin is; under `(max-height: 760px)` both
  scene heads take the terminal cut's `clamp(28px, 5.5vh, 72px)` (feet at
  718.5), and a fifteenth smoke case measures the feet against the stage.
- **Durable half:** the scene's layout is keyed on the writer's `data-tl-scene`
  stamp and FAILS OPEN to two flowing beats (pinned by the reduced-motion
  case); the smoke drives eight wheel steps mid-slide asserting the stage's
  top at 0 and the carrier's box on its own pose to 0.5px — the jitter is
  measured, not eyeballed. Two new patterns in BEST-PRACTICES: the
  main-thread-writer-versus-compositor law with its two cures, and the
  observer-measuring-its-own-probes loop.
- **The copy (shared epilogue, every route):** the title is `AI CAPABILITY /
YOUR TEAM OWNS.` (the services masthead's own line), the CTA reads `HOW WE
DID IT AT LOOP` and still lands on `#services` (the Loop proof stack), and
  _"Before the labs sell it back to you."_ is deleted — desktop, mobile and the
  region's `aria-label` together.
- **Verified:** `tsc` clean, the touched unit suites green (`trinny-seam`
  rewritten, `trinny-mark`, `trinny-offer`, `arc-board-fit`, the parse and
  journey guards, the type ratchet), the Trinny smoke **15/15** (three new
  cases: the welds under the wheel, a deep reload mid-scene, and the plates'
  feet against the stage at 720h and 1247h), the landing
  HUD snapshots unchanged, the epilogue snapshot re-baselined for the copy,
  and captures looked at at 1920×1247 and 1280×720 across the thirteen scene
  stops.

### 2026-09-14 (third pass) — The configuration strikes in (ADR-100 U4, ADR-101 §A)

**Trigger:** one owner message of seven asks on the live proposal. Two of
them landed here: the configuration head reads _"a bit more centered versus
the other sections"_ against the plates, which are _"the gold standard"_; and
the next section's elements _"don't have to fly in … they need to have a glitch
effect like we have on our homepage"_, only once the turn's own elements have
faded out — with the same for the beat after it.

- **ADR-100 U4 — the board joins the band, and the capability scales out.** The
  two heads were PIXEL-IDENTICAL (title x 360, copy x 1146.7 at 1920×1247); the
  DRAWING was the object that was out, on the 1440 instrument band against a
  head on the 1200 text band, 120px per side, **and only above the ~1503px
  crossover** where the two bands diverge — every reference viewport in this
  repo sits below it. The row takes `.arc-band`; the beat's own head-margin
  override goes with it (45px of air under the dek against every plate beat's
  143). The two head strips and their datum rules are deleted with the `head`
  role (the dek already names the two sides), `DATUM_Y`/`MARGIN` collapse into
  `TOP_Y = INSET`, and a FIFTH fact — `WHERE IT SCALES`, answered on both
  sides — hangs under the chip on a fourth gold ribbon with `GAP2 = GAP1`, so
  the drop in and the run out are both 108 units and the board is a CROSS
  centred on the one lit object. The chip alone goes TOP-RIGHT-ONLY (the kit's
  `band()` path, which IS the offer plates' silhouette).
- ⚠ **AND MEASURING THE LADDERS FOUND THE LEDGER ARRIVING 1-3-2-4.** U3's
  delays were applied in the LIT board's role order. The smoke SORTED the rungs
  by delay before asserting they increase — a walk that can find a dead rung and
  never a mis-ordered one. It reads them in DOM order now.
- **ADR-101 §A — both beats arrive, seated.** The PROOF CARD's arrival copied
  as `tl-aperture*` (the strike-in was ADR-097 U11 and its flash came out the
  same day — U12), not the hero's canvas slice-tear
  (ADR-060), which samples the painted page and so has nothing to sample until
  the thing is visible. `--tl-prop-lead` 50svh → **100svh** so `p` and `q`
  saturate on ONE frame; the veil's second ramp re-keyed to 0.384 / 1 or the
  two clocks race on a one-owner channel. Trigger is `arriveNext`, a pure
  hysteresis (ADR-021's one sanctioned exception), with `await` distinct from
  `out`.
- ⚠ **THREE DEFECTS THE GATES COULD NOT HAVE SEEN, ALL FOUND BY LOOKING.**
  (1) `PROP_ARRIVE_IN = 1` is unreachable in practice — `propArrival` clamps, and
  every converging roller lands at top 0.22px with the record hidden and every
  stamp correct; **a threshold no measurement can rest on fires by luck**.
  (2) `#phases` does not exist when the writer mounts, because `#offer` is a
  lazy nested root — a query in the effect body returns null FOREVER and the
  seam sits at 0 with nothing throwing. (3) Taking ADR-100's ladder away took
  its RESTING PAINT with it (the board rests at `opacity: 0` and the ribbons
  undrawn, behind `forwards` fills), so the first cut struck in and then
  vanished on its own last frame.
- **Durable half:** every delay rides `var(--tl-gl-d, 0ms)` INSIDE the
  `animation:` shorthand rather than out-specifying it — ADR-100 U3's lesson
  taken properly, because a shorthand cannot reset what it is READING. And
  `settleStrike` waits on `getAnimations().finished` (with a `catch`, since a
  cancelled animation REJECTS) rather than a timeout: a strike's length is a
  LADDER, not a duration, and `animationName` is the DECLARATION rather than
  the state.
- **ADR-101 §B — the chip becomes the three plate head bands.** The way to
  obey _"I don't want fucking cross-dissolves"_ is to have only ONE
  MATERIAL: `--arc-gold-wash` lifts to `.arc-root`, the board's own token
  aliases it, and the plate's head band AND its foot paint it — which
  **retires ADR-098 U2's inverse DELIVERABLE band house-wide**. The
  choreography is ONE SUMMED EXPRESSION over three windows with the chip's
  and the head's boxes read LIVE each frame; both welds measure 0.00px.
- ⚠ **THREE MORE SILENT WRONG ANSWERS, ALL FOUND BY MEASURING RATHER THAN
  BY A FAILURE.** (1) A `display: none` layer measures ZERO, so the baseline
  probe read 0 and dropped every carrier word 18.85px — it reads as type
  placed by eye. (2) `seamProgress` CLAMPS, so a `t = 0` convergence target
  on the published clock "arrives" two viewports short with every assertion
  downstream reading a page nowhere near where it was asked for: **a clamped
  clock is not a convergence target at its own floor.** (3) §A's strike
  animates `translate: 2.5px 0` on the plate, so a head read mid-strike is
  2.5px from where it settles and the harness is moving its own target.
- **Verified:** `tsc` clean, **1536** unit tests (a new `trinny-seam` suite),
  the Trinny smoke **13/13** (three new cases plus the fail-open
  reduced-motion one), `arc-terminal-smoke` + `arc-portfolio-smoke` 22 passed
  with only the documented pre-existing chip failure, and captures looked at
  at 1920×1247 and 1280×720 including the three new seam stops.
- Commits: `082b5882` (ADR-100 U4), `a8d17510` (§A) and this pass's §B.

### 2026-09-14 (second pass) — Four reads on the same page (ADR-095 U8 amended, ADR-100 U3, ADR-099 U1, ADR-098 U5)

**Trigger:** one owner message on the live page after the first pass shipped:
put `Trinny London` on the line below; the studio-today elements should arrive
slower; the hero's heading and paragraph are not aligned with the two text
components in the other sections; and the phase plates should keep only the
top-right notch, because the bottom-left one is too close to the text.

**What changed.** The turn's title binds the client's name with a NO-BREAK
SPACE, and `captionScramble.ts` — the site's ONE decode kernel — learned that
U+00A0 is whitespace and must resolve to ITSELF. The dormant board's arrival
ladder goes to 0.72s at a 140ms stagger. `.tl-root .hero__content` takes
`margin-inline: var(--rail-inset)`, joining ADR-048's editorial band. And
`.arc-plate`'s clip and ring drop their bottom-left corner.

**Two things the measurements found that nobody asked about.**

1. ⚠ **THE LIT BOARD'S DELAY LADDER HAD NEVER RUN.** ADR-100 U1's rungs are
   two classes and an attribute against the FOUR-class `animation:` shorthand
   that starts them; the shorthand wins and **resets `animation-delay` to
   zero**. The dormant rungs carry a second attribute, so they tie and win on
   source order — which is the only reason that half worked and why nothing
   looked wrong. **A delay that does not apply fails silently**: no error, no
   log, an identical still, and the result reads as a taste decision. Fixed by
   scoping every lit rung `[data-board-state="configured"]`; guarded by
   asserting each ladder is strictly increasing.
2. ⚠ **THE HERO'S MIS-ALIGNMENT ONLY EXISTS ABOVE THE 1200px BAND'S
   CROSSOVER.** `--rail-inset` is `--band-margin − --hud-content-inset`, i.e.
   ZERO at 1280×720 and 1440×800, where hero and band measure 129/129 and
   145/145 — and 192/360 at his own 1920×1247. Every reference viewport in
   this repo is landscape and narrower than the crossover, so no capture could
   have shown it. **A defect invisible at every reference shape is one only a
   capture at the owner's own window can find** (the standing memory rule,
   earning its keep again).

**Two guard traps, both in the same new assertion.** Reading a computed
`clip-path` for pixel pairs measures the SERIALISATION — Chrome keeps the
percentages and the `calc()`s, so the regex found one point in five. And
`getPropertyValue("--arc-plate-ch")` hands back the `clamp()`: **a custom
property is a string until something lays it out.** The corner is hit-tested
with `elementFromPoint` now, from both ends, with the cut resolved through a
probe element.

**Cycle:** A (fixes on a live surface), plus one new ruling per ADR above.

**Verified:** tsc, 212 unit tests, `trinny-london-smoke` 10/10,
`arc-portfolio-smoke` + `arc-terminal-smoke` 22 passed (the one red is the
pre-existing chip test at `arc-terminal-smoke:335`), and captures at
1920×1247 / 1440×800 / 1280×720 looked at, plus the plates on
`/arcs/suri-proposal` and `/arcs/hungry-minds-proposal`.

**Left open, flagged not taken:** the homepage hero has the same band
divergence as this route's (`/` has no banded neighbour, so it is not the same
defect); at 1440×800 the turn's title reads `… this / to Trinny London.`,
where the name is whole but `to` falls to line two.

### 2026-09-14 — Four surfaces on the Trinny proposal (ADR-100 U2, ADR-098 U3, ADR-084 U2, ADR-095 U8)

**Trigger:** one owner message on the live page, naming four things: the red
line's four bands are "not really clear what they're related to" (make them a
square block of four with `NO AI UGC` at the centre); two lines of the turn's
copy; a list of notes on the configuration beat ending "AND REALLY DO A FUCKING
SENSE CHECK IN THIS SECTION because it feels sloppy"; and "redesign the modular
approach cards so they have the notch".

**Cycle B (prior art cited):** ADR-084 U1 (the four-band ruling this reverses,
and WHY it can — that 2×2 was centred, this one fills), ADR-065 (the corner
law's rules 1–4 for the plates), ADR-089 (a clip cuts a border and never
strokes one — the clipped ring), ADR-097 U4 (the owner's own word for the
notch), ADR-018 (the "self-sufficient" ban the turn is now the one exemption
to), ADR-098 U1 (a display line breaking at its own hyphen), ADR-066 (the order
of sacrifice: padding before type), ADR-070 U15 (a string composed at render
time is outside every content scanner).

**Cycle A rows that triggered:**

- **4 — files that move together.** The red line is a THREE-HOST change
  (`SheetsPlate`, `casefile.css`, `proof-stack.css`, the record, the registry,
  two smokes); the plates are a THREE-PAGE change through one renderer; the
  board's record, layout, glyphs and three guards move as one.
- **5 — the runtime check.** Two new ink walks: every quadrant's first and last
  child against its cell (both smokes), and the board's rendered counts pinned
  `[9, 16]` live. ⚠ **Both exist because a CENTRED box that outgrows its cell
  spills through the TOP, where `scrollHeight` never reports it** — the four
  bands had been overflowing at 1280×720 and every fit gate on the surface read
  green. `.fl-cmp__middle` paid for this exact lesson one sheet over; it is now
  two.
- **6 — a durable finding.** "Square (ADR-065)" in ADR-098 U2 meant _no 12px
  radius_ and was read afterwards as _no cut_. A ruling that names a law should
  name the clause: the plates were square by an argument about the deck's
  material, not by the corner law, and nothing said so.

**What the stills caught that the gates did not:** the ledger's first row ruled
its top 14 units under the head's own datum — one doubled line, ADR-089 U3's
defect in a new object; and the turn's new sub broke `self-sufficient` across
its own hyphen at `44ch`. Neither had a guard and neither would have got one:
both were found by looking at a capture.

**Left open:** the pricing beat's ledger table and tip cards are the same
material one beat after the plates and stay square — flagged for the owner, not
taken. The offer's plates as PARTS that dock into the board (the motherboard
leitmotif's second half) is still the pass ADR-100 named.

### 2026-09-13 — The configuration is a board in two states (ADR-100)

**Trigger:** owner's read of the Trinny proposal's configuration beat — "it
doesn't look bad, but it's a lot of things to look at"; the beat is the problem
statement; their current status left, kept simple, and their configuration
right as an EXPANDED version of the proof's own; not in frames; the motherboard
as leitmotif.

**Cycle B (prior art cited):** ADR-070 U11 (the R4 substrate field — the
grammar), U12 (the elastic crop), ADR-076 (SVG at page scale under an aspect
cap), ADR-098 §4 (the `configuration` kind this replaces on the page), ADR-099
(the datum and the `flow` precedent for a beat's `min-height` share), ADR-065
(the corner law), ADR-077 (the ramp). ADR-100 opened Proposed with the shape,
the measurements and the alternatives rejected.

**Cycle A rows that triggered:** 4 — `types.ts`, both dispatches, `chrome.tsx`,
`arcs.css` and three tests move together (rule in `.claude/rules/arcs.md` §The
client model + `.cursor/rules/arcs.mdc`); 5 — the runtime check is the fit
guard (`arc-board-fit`, the drawing against its own declaration at six
extensions) plus the smoke's rendered walk (≥ 10px, zero label overlaps, one
meet, the crop filling its box at two viewports); the still caught the one
thing both missed (the head's coord stamp on the board's datum label at 720h).

**U1, the same day — "no, radically simplify it."** The owner's whole read of
the first cut was three words, and they were about DENSITY, not copy or colour:
the bed, two sockets, two foot rows, hatched cables, four layer sentences, a
second card row, the tools' notes and the height-elastic crop (with its
`ResizeObserver` island) all went in one pass. Four objects per board, one line
apiece, three plain ribbons; 10 / 18 lettered nodes where there were 19 / 38;
the svg at its own height with the beat's slack pooling at the floor (ADR-099's
named cost, taken over the machinery that filled it). The guards kept their
SHAPE and lost their extensions: `arc-board-fit` walks one crop and pins the
label sets `toEqual`; `trinny-offer` budgets ≤ 10 / ≤ 17; the smoke expects 24
wires. Cycle A row 6 triggered — a feedback memory: when he asks for simple,
the FIRST cut is the minimal one, and the elaboration waits for him to ask.

### 2026-09-12 — Clients and the proposal on /arcs (ADR-098)

**Trigger:** owner wants a client proposal built on the site rather than as a
local HTML deck ("that's where our brand lives"), a subpage per client listing
its engagements, and `/arcs` restructured so keynotes, workshops and
productions read apart and cluster by client. The Suri deck and the
`/trinny-london` pitch are the two shapes it had to absorb.

**What changed:** `lib/arcs/clients.ts` (new — `ClientDef`, `CLIENTS`,
`kindOf`); `ArcDef` gains `client` / `kind` / `theme` and `ArcFormat` gains
`proposal`; `/arcs/[slug]` resolves a client first and an arc second (one
route, no new file, NO URL moved); `ArcClientGroups` + `ArcKindFilter` +
`ArcClientPage`; the `configuration` section kind (`ArcConfiguration`, the
pitch page's instrument as data, ADR-052's second content-only exception);
`lib/arcs/content/suri-proposal.ts`; the light lock reaching an arc;
`scripts/new-arc.mjs` + its skeleton; `arcs.css` gains the overview bands, the
filter, `.arc-cfg*` and the locked-switch rule.

**U1, same day (owner, on the page live):** the top-left journey row is hidden
on every arc with its bracket restored (ADR-093's pitch-page ruling, one
surface over) — then the owner asked for the homepage too, so the rule left the
route sheets entirely: it is the ≤960 rung promoted to every width, living once
in `rail-instruments.css`, with the copies in `arcs.css` and `trinny-london.css`
deleted. The row is dormant UI on every surface now; deleting `MarkRow` is a
separate pass, not taken, because bringing it back is one line while it stays.
And a PROPOSAL's interstitial line drops from
`clamp(38px, 5.4vw, 76px)` to `clamp(24px, 2.6vw, 40px)` at 42ch — scoped to
the format, because a deck is presented in a room and a proposal is read at
arm's length. Measured after: the keynote's line unchanged at 53.8px, the
proposal's 33.3px. ⚠ The measure was part of the size: at 34ch the sentence
still broke `AI-first.` across its own hyphen.

**Cycle B** — ADR-098 opened Proposed, `.claude/rules/arcs.md` +
`.cursor/rules/arcs.mdc` gained §The client model, LANGUAGE.md gained **Client
page** and **Engagement**.

**Cycle A rows that triggered:**

- _Did a guard pass while the thing was wrong?_ — **no, three guards caught
  real defects on their first run**: the portfolio had no `client` (the band
  would have been empty), a copied `ariaLabel` carried an em dash onto a
  client's page, and the new digit rule was too blunt for a phase code. Two
  more came from LOOKING at the capture: a tips tag written as a clause
  printed through its own body, and three fee cards landed 2+1 at the 1280
  rung where `.arc-cards` collapses to two.
- _Did a hand-written number go stale?_ — **yes.** `arc-terminal-smoke`
  pinned the overview at five cards; the sixth arc turned a true statement
  about the grid into a failure about a number. It derives from `ARCS.length`
  now.
- _Was CI already red?_ — **yes, and not from this work.** The lint ratchet
  is 337 and a clean tree at HEAD measured 338: `scripts/_serve-docs-design.tmp.mjs`
  landed in 38df7010 with an unused catch binding. Fixed at the line rather
  than by raising the cap.

---

### 2026-09-12 — The proof card is a folder (ADR-097)

**Trigger:** owner read the promoted proof stack (ADR-096) and kept the IA but
not the look — the cards "feel a bit out of place": make them digital folders,
glass with the golden border like the services section, 3D-stacked rather than
"horizontal", a fade on the first card's arrival, a client colour on the head.

**What changed:** `proof-stack.css` (one sheet, two hosts) — glass plate at
`.62` + blur, FLAT `--gold-line` lip on the existing clipped ring, the head row
as a TAB with a 45° step (card + ring polygons, ≤960 collapse by two tokens),
recession by depth, plate fade, covered content leaving on the cover channel,
console ground transparent; `useStackedCardsScroll` +`--pc-depth` (additive);
`CaseDef.accent?` + `proofStackClient()` → `ProofStack`/`ProofCard` (the
`"Loop Earplugs"` literal retired); `theme.css` BLOCK 4c; both smokes;
`capture-proof-stack.mjs --mid --perf`; `mechanical.mjs` `ACCENT_ALLOW`.

**Cycle A rows that triggered:**

- **A guard that measured a picture, not the thing** (twice). The trinny
  smoke's `cardShape` read glyph widths and rail insets off `getBoundingClientRect`
  on COVERED cards — transformed rects — and passed on `scale(.98)` only because
  `21 × .98` rounds back to 21; at a real depth scale it fails. Reads are
  `offsetWidth` and deltas ÷ the card's rendered-over-layout ratio now. And the
  seat helper's rewind waited 250ms on a page whose `<html>` scrolls SMOOTHLY:
  under load the rewind was ~900px short, the slot still stuck, `offsetTop`
  reading its stuck position, the solve overshooting a pitch onto `covered`
  (`settleScroll()`).
- **A ratchet that did not have the file.** `proof-stack.css` was in neither
  `type-material-tokens`' PINS (the map kept the sheet's OLD route home from
  before ADR-096) nor `theme-css-sweep`'s SHEETS, while the sheet's header and
  `.claude/rules/proof-stack.md` both said it was pinned at zero literals. Both
  carry it now. ⚠ When a sheet MOVES, its ratchet entries move with it.
- **A cost measured before it was assumed.** `--perf` samples rAF deltas
  through the whole pile: long-frame share 17.9 → 14.9 % @1440×900,
  22.4 → 15.1 % @1920×1247 — the glass is free against the corridor already
  under it; the fallback stays unbuilt and recorded.
- **A house ruling kept over a reference's recipe.** The services plate's 168°
  four-stop lip was the obvious port and is wrong on a wide frame (ADR-092
  stage 1 U1 measured it on the housing); the FLAT lip is the default and the
  ramp a one-line swap for the owner's still.
- **The arithmetic of an inset diagonal.** A 45° edge offset 1px inward is
  the same line shifted √2 in x, so BOTH ends of the tab's step inset by
  tan 22.5° in the same direction; the plan's `+0.414` at the reflex foot would
  have kinked the ring by 0.8px on every card.

**Docs:** ADR-097 · `.claude/rules/proof-stack.md` §The folder ·
`.claude/rules/proof.md` (`CaseDef.accent`) · `.claude/rules/trinny-london.md` ·
CLAUDE.md pointer.

**Same day, U1 — the owner's live read took the tab off.** _"Having the
gradient only on the left … doesn't really work. I want the full top row to
have that gradient, and let's keep that notch in the top-right corner."_ The
head is the full-width band again (rule, padding, gap as before) carrying the
client's gradient on itself; the silhouette is the plain TR+BL housing; the
tab tokens, the eight-point polygons and the ≤960 collapse are gone;
`--pf-tab-a` is `--pf-head-a`. Both smokes' tab reads became band reads.
Lesson for the ledger: **the folder read was the BAND, not the cut** — two of
three references had the band, one had the step, and the pile's staircase
came from the depth scale regardless. When a reference set disagrees, ship the
part they share and hold the part they don't for the live read.

### 2026-09-05 — The interface kit: the reference measured, and a wave graded (ADR-091)

The owner named two sites he admires, named the surface he wants to reach
that register, and said plainly he could not put a finger on the delta. So
it was counted rather than described. Cycle B for the lab and the ship,
Cycle A rows 1, 2, 3, 4 and 5. Nothing on the landing changed; ADR-091 is
**Proposed** and the promotion is a separate decision.

- **Row 1 — the seat gate was wrong twice before it was right.** First it
  omitted the housing's own padding term; then it reported a 48px error at
  one viewport and none at another, because `--instrument-inset` is a
  `calc()` and `parseFloat` on the token string returns `NaN`, which
  coerces to zero. Both are in BEST-PRACTICES now, as _a custom property is
  a string until something lays it out_.
- **Row 2 — the ruled-grid direction was rewritten after the grader named
  it.** Its first cut struck repeating verticals through the brief at a
  third of the record column: invented structure, not the sheet's own. It
  rules the margins only now — the rail's rungs as stubs at both band edges
  and the column split full height. **The grader caught it on its first
  pass**, which is the clearest thing the wave bought.
- **Row 3 — the defect class is "a parity check between two things broken
  the same way reports parity".** The lab's control gate compared the
  recomposed panel to the shipped one on all four zone boxes and passed
  throughout, while both rendered inside a containing block 145px too
  wide: `position: absolute; inset: 0` on the stage, and an absolutely
  positioned child resolves against the **padding** box. The gate asks the
  layout law now, not a sibling. Also recorded: _a conditional row shape
  only mixes on the run you never test_, from the design-corpus sync, which
  had never once run in the mode it was written for.
- **Row 4 — three pairs must move together and one of them is cross-repo.**
  `lib/interface-kit/directions.json` and the ship's `armada.toml`
  `[types]`; `--ik-t0` and `--fl-t0`; the Figma variables and the
  stylesheet. `.claude/rules/interface-kit.md` carries all three, and the
  capture asserts the first two on every run rather than trusting them.
- **Row 5 — the countable checks were stable and half the rubric was a
  coin.** The candidates are deterministic renders of a URL, so two
  captures produce identical pixels and every point of verdict spread
  across three runs is the grader's. 31 of 60 came back unstable, which
  makes the unstable list the specification for rubric 0.2 rather than a
  nuisance. **And the rubric fails its own control on A1** — which is the
  point: a rubric its baseline passes is describing rather than judging.
- **Two premises in the approved plan were wrong, and the measurement is
  what said so.** ADR-089 had already moved the casefile's structure to
  dawn, and the house is **stricter** than both references on radius (zero
  against six and two). Written from a lab README rather than from a probe;
  corrected in ADR-091 rather than quietly dropped.
- **Left open:** the vault's git has diverged since 2026-08-09 between a
  local scribe and a cloud scribe (29 local commits against 147 remote,
  both still writing). The three new reference notes are live in the design
  MCP, which syncs off local disk, and committed locally — they cannot be
  pushed until somebody decides how the two sides reconcile.

### 2026-09-02 — The casefile is one machined housing (ADR-089)

The owner read `v0` against `v2` and took the housing for the proof
casefile; the era stage is held. Cycle B for the new chrome, Cycle A
rows 1, 3, 4, 5 and 6.

- **Row 1 — the complaint was a LINE LADDER, and it was countable.**
  Eight gold structure lines at .12–.24 against a frame running 2px of
  dawn at .55: a hue swap and a 4× alpha gap between a panel and the
  thing it belongs to. `console.css` had ruled which way that goes one
  object over, in 2026-08-07; the surface around it never got it.
- **Row 3 — the defect class is "a rule that was written about a lab's
  root".** All three of v2's own defects only appeared in production:
  a cell head at `top: -17px` inside a box with `overflow: hidden` (it
  has never painted in the lab either — nobody looked), a single child
  in a `1fr auto 1fr` header landing a third of the way across, and
  `state` printed twice ~250px apart. `voidwalker-datum.css` already
  records this exact class from the previous lab-to-production
  promotion, in almost the same words.
- **Row 4 — two guards asserted the opposite of the new law, and both
  were RIGHT to.** They encoded clauses whose SUBJECT moved: the rail's
  leading notch existed because the console's chamfer fell on it, and
  the light walk's bed was the console's own ground. When the console
  became a cell, one clause lost its subject and the other lost its
  reference. Neither was relaxed — the corner guard now pins every
  station square AND the console square AND the housing's diagonal, and
  the light walk composites to the first opaque surface.
- **Row 5 — the light walk was measuring against PURE BLACK.** A cell
  paints no ground, so `getComputedStyle(console).backgroundColor`
  returned `rgba(0,0,0,0)` and `parse` matched it rather than bailing.
  The map's quietest ink reported 1.06:1 on a page that reads fine; the
  same hole in reverse passes an unreadable one. **A guard that reads
  ONE element's colour is a guard that stops being true the moment that
  element stops painting.**
- **Row 6 — the promotion answered five open rulings and moved a sixth.**
  ADR-065 U2 retired, U5's premise moved (the console is no longer the
  housing its seated set answers to), and the capability plates' notch
  is now an open question rather than a settled one. Named rather than
  inferred: changing four notches is a visible design move.
- **Held deliberately:** the era stage. Three of its own rulings block a
  housing there independently of the owner's hold, and the committed
  `>700px` paint sweep fails a band-width slab three ways at once.

### 2026-09-02 — The casefile's left column: one ladder per face, and the index sits on t11 (ADR-088)

The owner read the proof casefile and said the font sizes felt
"disconnected", the directory was "too big" and too close to what is
above it, and the column was "not balanced". Cycle A rows 1, 3, 4, 5 and 6.

- **Row 1 — one token drove four roles across TWO FACES.** `--lc` fed the
  register claim, its sentence, the directory row and the row's meta by
  multiplier, and its `svh` term made their ranking flip with viewport
  height: at 1920×1080 the sans SENTENCE (14.04) outranked the mono CLAIM
  (13.34) it explains. **The ordering a ladder guarantees is the one
  inside its own face** — 13.34px of bold mono caps reads louder than
  14.04px of 0.78-alpha sans, so the arithmetic and the optics ran
  opposite ways with every clamp inside its bounds.
- **Row 3 — the defect class is "a multiplier standing in for a rank".**
  `--lc` was solved against ONE of its consumers (the sentence's 14.1px
  wrap point) and then applied to three others by coefficient. ADR-085 U1
  had already put the chrome roles on a modular scale and left the
  content roles off it for a reason that held for `--fl-copy` and not for
  this. A token consumed by more than one FACE wants splitting, not
  tuning.
- **Row 4 — a stale `var()` fails silently, and one consumer lived
  outside the column.** `pda.css`'s phone list row read
  `var(--lc, 12px)`: deleting the token would have dropped it to the
  fallback with nothing failing. Grepped for consumers before deleting,
  which is the only way that class of breakage surfaces.
- **Row 5 — the guards measured every box and none of the RELATIONSHIPS.**
  Nothing looked at two roles against each other, and nothing looked at
  the column's rhythm: the surplus pooled under the directory (137px at
  the owner's viewport, 199px at 2560×1330) while the seam ABOVE it stayed
  pinned at 18px, and every zone was inside the casefile and clipping
  nothing. The smoke now pins the seat on tick 11 from BOTH sides, both
  seam floors, and the 1:2 split bounded both ways.
- **Row 5 again — an exact bound against a transformed rect is a flake
  generator.** A mark declared at 21px measured 21.000015258789062
  (21 + 2⁻¹⁶) on one run sampled mid-strike, failed `> 21`, and passed
  twice more at the same nominal progress. The register rides
  `translate3d`, so descendants' rects come back through a float matrix.
  Characterised by re-running rather than by guessing, then given a 0.5px
  epsilon — far below the 7-unit lattice step the rule polices.
- **Row 6 — `summaryGap < 80` was deleted, not retuned.** It measured from
  the brief's PARAGRAPH (a different number on every directory row) and
  its literal assumed a column that pooled its surplus; under the split
  the seam legitimately reaches ~82px at 2560×1330.
- **A planned step was built and rejected on measurement.** Shrinking
  `--fl-proof-h` above 1800px, to make the register/directory seam exceed
  the register's row pitch: the comparison was wrong (a whitespace seam
  against a HAIRLINE-RULED track's pitch), and it moved the number the
  wrong way — the seams at 1920×1247 would have gone 59/118 to ~83/167.
- **Left open:** the seams grow without bound with viewport height, and
  the lever if the owner reads that as too much is `--fl-proof-h`'s
  ceiling, which a bottom-seated directory has freed.

### 2026-08-24 — The arcs get an ink ramp (ADR-077)

The owner sent a screenshot of the portfolio in LIGHT: the overview cards
painting a near-black ground on parchment. Cycle A rows 1, 3, 5 and 6.

- **Row 1 — one line of CSS, repeated 44 times.** `arcs.css` wrote every
  colour as a raw literal, and `rgba(235, 227, 214, α)` IS cream-on-black
  spelled out — precisely what ADR-058's wholesale token swap cannot
  reach. The tokens had flipped correctly all along.
- **Row 3 — the defect class is "a literal where a token belongs", and
  the surface had no colour guard at all.** ADR-072 recorded the light
  theme as "partial and pre-existing"; nobody measured it, so the OWNER
  found it. Anything that ships a second theme needs a walk, not a note.
- **Row 5 — the guard has to composite.** Every rung is an ALPHA, and an
  alpha means nothing until it lands on a ground: reading `color` reports
  both themes identical and passes on a page nobody can read. The walk
  also asserts THE GROUND FLIPPED, or it runs twice on dark.
- **Row 6 — a measured pre-existing defect fixed on purpose.** 10px meta
  labels read 3.19:1 in DARK on all three arcs. This surface has ruled on
  it (ADR-070 U6: a label nobody can read is absent, not quiet), so
  `--arc-ink-40` lifted 0.40 → 0.55 — the one place this pass is not
  byte-identical in dark, named as such.
- **Fixed for free:** the keynote and workshop arcs, same sheet — the
  recorded "eyebrows and prose vanish on parchment" symptom is gone.
- **Left open:** the own-plate arc heroes' 2.0–2.5:1 copy in DARK over a
  near-white key visual (ADR-075) — a scrim problem, not a token one.

### 2026-08-24 — The portfolio flows; the architecture closes it (ADR-076)

The owner read the portfolio against the shards repo's Stripe page: it
scrolls worse, the Skills are text walls, and the homepage's intelligence
instrument should be expanded and moved to the bottom. Cycle B for the new
section kind, Cycle A rows 1, 3, 4, 5 and 6.

- **Row 1 — the diagnosis was not a missing technique.** The pages that
  "scroll nicer" reveal with an IO at `rootMargin -10%` and a one-shot
  `is-in` — which is this repo's own ADR-052 reveal, constant for
  constant; `ArcShell`'s comment even names it as the source. The felt
  difference was PINNING. So the fix was deleting one line
  (`motion: "terminal"`), not building a scroll system.
- **Row 3 — the same defect class, a fourth time.** The console's first
  cut letterboxed HORIZONTALLY (w/h 2.2, a third of the panel empty)
  and the new fill guard measured HEIGHT and reported 90 %. ADR-070 U4,
  U12 and U15 are each a version of this. **A fill assertion that asks
  about one axis is not a fill assertion**; the aspect is now guarded too.
- **Row 4 — files that move together.** `ArcShell` (the curtain flag)
  ⇄ `useArcScroll` (`data-arc-tall`) ⇄ `arcs.css` (freeze + release, and
  the release must REPEAT the selector); and the `intelligence` kind
  ⇄ `ArcIntelligence` ⇄ `LOOP_INTELLIGENCE_MAP` ⇄ the route's `pda.css`.
  → `arcs.md`.
- **Row 5 — two runtime checks nothing else would catch.** The console's
  wheel must NOT capture off the casefile (its gate is
  `data-proof-settled`, which no arc writes) — a regression there is a
  scroll trap mid-page with every other assertion green. And the reveal
  IO is ONE-SHOT, so a test that parks a tall section at its top reads 5
  of 6 panels revealed; the harness sweeps past and comes back.
- **Row 6 — a measured win worth recording.** ADR-063 lists reading 01's
  6.2–7.2px type as this surface's standing defect with no lever left.
  At page scale the same drawing letters at 9.5px (1440×800) and 15.3px
  at the owner's shape. The gap was DENSITY, and a section affords it.
- **Left open, unchanged:** the two `landing-page.spec.ts` corridor
  snapshots from ADR-074's station (percentage scrolls, 08-02 baselines).

### 2026-08-24 — The arc hero becomes the homepage hero (ADR-075)

The owner asked for the arc hero to BE the homepage's, "including the
parallax effect in the second section". Cycle B for the seam, Cycle A rows
1, 3, 4, 5 and 6.

- **Row 1 — more than two iterations, and the first was the wrong
  mechanic.** "The second section parallaxes over the hero" is ADR-022's
  own **v7**, superseded; v8 inverts it (the card MOVES, the panel is
  HELD). Reading the ADR's live section rather than its title is what
  turned a plausible sticky-hero build into the faithful one — and the
  faithful one is also the safe one, because a sticky card freezes `--py`.
- **Row 3 — two classes of bug.** (a) A GLOBAL theme rule on a class a
  second surface reuses: `html[data-theme="light"] .hero__bg` made every
  arc show the LANDING's plate in light, invisibly, for as long as arcs
  have existed. (b) **A media query adds no specificity** — the seam's
  release rule dropped one `:not()` and lost silently to the freeze;
  measured `fixed` under reduced motion and at 430px before the selectors
  were tied.
- **Row 4 — files that move together.** `useArcScroll` (the flag) ⇄
  `arcs.css` (the freeze + its release) ⇄ `useArcTerminalMotion` (whose
  cached `topDoc` is why the PLANE and not the stage is frozen); and
  `hero.plate` ⇄ `ArcHero` ⇄ arcs.css ⇄ `HERO_ROUTES` ⇄ the route's static
  preload. → `arcs.md`.
- **Row 5 — a runtime check.** The seam is measured, not eyeballed: the
  smoke asserts the card has moved a known distance while the panel's rect
  has not moved at all, and that the content's centre does not jump across
  the handoff.
- **Row 6 — the paint stack changed.** ADR-008's table gains the arc rows,
  and its hero row is corrected: it still called the live hero `sticky; z:1`.
- **Left open, measured:** the keynote/workshop hero copy reads 2.0–2.5:1
  in DARK over their near-white key visual — pre-existing, now written
  down. And two `landing-page.spec.ts` corridor snapshots fail on this tree
  from ADR-074's new station (percentage scrolls, baselines from 08-02);
  re-baselining a corridor frame belongs to that work.

### 2026-08-23 — The through-line: `#voidwalker`, the career timeline after the bio (ADR-074)

Owner asked for a vertical timeline of the things that led up to Thoughtform,
after the bio — title left, paragraph right, beats lighting one by one, a
drawn wireframe per article. Cycle B (new station, new ADR, new rule); four
findings worth the ledger:

- **The leitmotif was already written.** The owner could not name the
  through-line; his own strategy skill had it (_read a new system early,
  build the layer that lets people act inside it, step back_). Read the
  canon before inventing a frame.
- **`#practice` is an EMPTY station in production** — its `.approach` body is
  stripped at parse time, so its only live role was the ambient cover, which
  moved to the new station cleanly. Three files name the cover and must agree.
- **Explicit grid rows, or the spine is 0px tall.** An auto-placed full-span
  list cannot land in a row the spine occupies; it slid to its own row and the
  spine spanned two empty ones — every clock value correct, nothing drawn.
- **Measure against the PANEL, not the column.** The band's right edge sits
  10–22px inside the right-rail telemetry at the laptop widths; the services
  lede never reaches it, a full paragraph does. And on the phone a wrapped
  press headline ate the drawing's frame to 0px — the frame carries the
  aspect there, not the plate.

Verified: 1004 unit tests across 53 files, lint and typecheck clean; the seam
smoke re-pointed and green; 48 CI corridor smokes green; headed captures at
1280×720 / 1440×800 / 1920×1080 (dark), 1440×800 (light) and 390×844 — every
beat lights at its reading line, every drawing 0 overlaps / 0 collapsed / no
overflow / one gold.

### 2026-08-23 — The site's header lands on the arcs; the reel goes (ADR-073)

The owner asked for the homepage header on the new portfolio page and
took the reel's retirement with it. Cycle B for the header, Cycle A rows
3, 4 and 6.

- **Row 6 — an architectural assumption.** An arc page's navigation was a
  copy of a menu the landing had already deleted, and it only rendered
  above 1101×760: at 1280×720 an arc had NO navigation. `ArcHudNav`
  replaces it with the landing's own control and chrome. → ADR-073.
- **Row 3 — a class of bug worth naming.** CHROME OVER A PHOTO. The
  production hero overlay leaves the top-right clear because the landing's
  plate is dark there; the arcs' key visual is near-WHITE there, and the
  header measured 1.06:1 on arrival. Nothing on the surface would have
  said so — the fix is a term on the hero's own overlay, and the guard is
  the smoke asserting the row lands on no hero ink.
- **Row 4 — files that move together.** `ArcShell` ⇄ `ArcHudNav` ⇄
  `useArcActiveSection` ⇄ the route's menu mapping ⇄ `menuPrimary` in
  every content module (a `-v2` cut shares its v1's sections, so a pair
  is marked once). → `arcs.md`.
- **Left open:** the hero eyebrow is still 2.5–2.9:1 — `--gold-70` as
  small text, ADR-058's recorded sweep, not this pass.

### 2026-08-23 — The portfolio arc, and the dossier section kind (ADR-072)

Rob asked for a portfolio of the Loop work; it ships as `/arcs/portfolio`
on the deck chassis with a ninth section kind that mounts the casefile's
tool dossier at page scale, one tool per beat. Cycle B (ADR-072 Proposed
→ Accepted in the same pass), then Cycle A rows 3, 4, 5 and 6.

- **Row 4 — files that move together.** `ToolGallery` ⇄ `ToolField` ⇄
  `ArcDossierConsole` (one bay, two surfaces; the snapshot pin + both
  smokes); the shared evidence modules ⇄ both arcs (`toBe` pins); the
  route's CSS order ⇄ `arcs.css`'s host contract. → `arcs.md`, `proof.md`.
- **Row 3 — a class of bug.** A beat that becomes NEAR between scroll
  events parked blank: the terminal controller runs frames only from the
  scroll writer's rAF, and the IntersectionObserver's near flag arrives
  after the last frame. Same family as the stranded re-type settle
  (ADR-057) — any state that changes off the scroll thread needs its own
  wake. One frame via the settle timer.
- **Row 5 — a runtime check would have caught it earlier.** The smoke's
  stepped drive found the near-margin gap on the first run; the keynote's
  beats are close enough that a 4-step drive never cleared the margin.
  `arc-portfolio-smoke` also arms casefile.css's ≤960 wireframe rung for
  the first time anywhere.
- **Row 6 — an architectural assumption changed.** "New arcs are
  content-only" gains one enumerated exception; `components/arcs` imports
  the casefile's dossier leaves; the confidentiality envelope and the
  numbers canon reach the arcs test (the keynote's money rows recorded as
  the deck exemption). → ADR-072.
- **Left open, named:** the arcs' light theme is partial (raw dawn
  literals in `arcs.css`'s atoms, zero `.arc-*` rules in theme.css) — the
  keynote's, not the dossier's; the role label across three surfaces; two
  roster metas that may be surnames.

### 2026-08-18 — The Carrier ships, and the hub is the flight's third home (ADR-070 U33)

Owner asked to wire the latest substrate drawing to the landing page. That is
one import in principle; the promotion turned up four things the lab could not
see, three of which were green in every guard. Cycle A rows 1, 3, 4, 5 and 6.

- **The drawing had nowhere for the flying object to land, and nothing would
  have thrown.** The Carrier has no cartridge on it, so `rectFor(3, id)` returns
  `null` — no throw, no failed render, no failed guard, and ADR-069's persistent
  object silently stops existing on a third of the surface. The HUB is the third
  home now, seating the shared `Cartridge` at a DERIVED `HUB_K`
  (`LABEL_FS / CART_TYPE.title` = 1.1304), whose box carries the cartridge's
  aspect exactly, so the flight's uniform `dk` needs no distortion term.
- **A crop must be elastic on whichever axis is SLACK.** U32's height-fixed crop
  was true at the three lab presets and false on a tall desktop window — 132px
  of dead panel at 845 × 950, within 5px of the 265px that forced the same
  generalisation on this same reading in U15. Third time shipped, third time
  green, because `minPx` measures a drawing against its own crop.
- **`CARD_BOX` is the card silhouette's one source** — `176 × 136` had been
  declared in three files, which is ADR-069 U1's finding one level out.
- **The smoke's overlap guard cannot be asked about arc-set type.** 22 reported
  collisions with nothing touching: `getBBox` is an ink proxy only for
  HORIZONTAL type. `readPda` splits flat labels (box test) from `textPath`
  labels (per-glyph origins), and pins the arc-label count, since a `textPath`
  that stopped resolving would empty the list rather than fail it.
- **The lab is a window onto production, not a copy** — `VariantCarrier`
  re-exports `PdaCarrier`, so `substrate-lab-fit` walks the shipped module.
  Lab → production only; `app/(internal)` is proxy-blocked in production.
- `SUBSTRATE_SECTION` (`pda/flags.ts`) restores U25's SECTION drawing untouched
  and gates every reading-03 branch in `PdaConsole`, including `rectFor`. It is
  a comparison lever, not a permanent seam — when the owner has read both live,
  the losing drawing and its guards should go.

Verified: 967 unit tests across 49 files; typecheck and lint clean. Measured
live on all three fields: 0px dead panel on both axes, `meet` 0.6339 / 0.9767 /
0.7495, `minPx` 7.17 / 11.04 / 8.47. Casefile fit smoke passes with the Carrier
live at 1280×720, 1920×1080 and 2560×1330; light-palette smoke passes. Flight
verified per card on a true 1 → 3 with `dk` constant at 0.8690.

### 2026-08-17 — Skill facet candidate: a straight pie made of 47 Skills (ADR-070 U26, proposed)

Owner rejected SECTION as the final visual direction and corrected the lab's
`21 · Wheel`: keep a pie chart's part-to-whole read, reject the circle, and
make the figure itself out of the Skills. Cycle B; no production promotion.

- Added `37 · Skill facet`: one dodecagonal annulus made from 47 interactive
  shards, five contiguous substrate runs, one equal angular step per Skill.
- Existing `26 · Facet` supplied the straight-edge geometry lesson but not the
  payload — it drew five large wedges and reduced Skills to rim ticks. The new
  direction reverses that relationship.
- Second owner correction: remove external labels and long copy. Each group
  seats only NAME + COUNT inside its own shard run; the five leaders,
  callouts and `meaning` paragraphs are deleted. Hover/focus turns the central
  dodecagonal hub into the selected Skill's short name, substrate, team and
  status. Five flagship outer chords carry green provenance.
- The dodecagonal perimeter's 3.41% radial modulation is named and guarded; the
  compared quantity remains exact as shard count / angular sweep.

Verified: 928 unit tests across 49 files; typecheck and lint clean; browser fit
readout at p1280 dark/light and p1920 dark reports 0 collisions, 0 clipping,
0 overflow, minPx 7.76 / 10.94. SECTION remains the live reading until owner
verdict on this candidate.

### 2026-08-17 (later) — Reading 03 answers the click; the persistent object gets a third home (ADR-070 U25, ADR-069 U2)

Owner: _"when you click on a work it becomes a configuration, and when you
click configuration you go to substrate — but the substrate feels completely
random. Reading 01 and 02 share the click, and 03 throws it away."_ Eight
rounds of substrate-alone drawings had kept trying to fix a proportion
problem that was never the problem: the record already carried the join
(`PdaWork.taps`) and the site's brief promised the drawing out loud
(_"below grade runs the shared substrate — encoded once for one team, tapped
by the next"_). Cycle B (round nine as a proper capture cycle), then Cycle A
rows 1, 2, 3, 5 and 6.

- **The reported defect was random-feeling.** The actual defect was that
  reading 03 SHARED NOTHING with the two above it — no click's context on
  the surface, no persistent object across the transition, and the fit
  guards measured every drawing against its own crop rather than against
  the readings beside it.
- **Round nine ran three candidates in the lab:** `34 · Section` (recommended,
  estate band + gallery + strata + shaft), `35 · Manifold` (the
  round-eight vessel rig with the estate band above), `36 · Control`
  (U24's own partition with the estate band above, no conductors).
  Captured at both themes and both presets; every gate green. Owner
  verdict on the contact sheet: SECTION.
- **Promotion:** `PdaSubstrate.tsx` rewritten as the SECTION drawing.
  `estateBand.tsx` extracted as a shared production module (twenty ghost
  cartridge footprints, five gallery lane markers). `sectionRig` /
  `estateBand` in the lab folder deleted — the config lab's own precedent
  (two copies of a measured drawing is how the lab starts passing what
  production would fail).
- **The proportional claim moved from AREA to BODY.** U24's `area is the
count` was honest when the whole region was bed; SECTION's head is
  fixed chrome (a fs 20 name with a two-line fs 13 paragraph beside it),
  so `bodyPerSkill = (strataH − 5 × headH) / totalSkills` is the shared
  unit — asserted at five field shapes. Every ext still goes to bodies.
- **`entryFor` factored into `rectFor`.** The old code hard-coded 01↔02 as
  the only flying pair and handled 03→01 as a bloom; the new code walks
  any pair through a `rectFor` helper that returns the source or
  destination rect for any reading. `pdaFlight` itself is unchanged.
  `pda-flight` gained 12 tests covering 1↔3 and 2↔3 round trips at the
  binding and tall viewports.
- **Cycle A rows 1, 2, 3, 5, 6 fired.** Row 1: more than two iterations
  (round nine's three-way capture is the honest tally, plus one coordinate
  bug caught by the fit readout on the first take). Row 2: reverses U24's
  reading-03 composition entirely (roster kept, partition replaced). Row 3:
  a class of bug — SVG plate coordinates being strata-block-relative but
  rendered as crop-space, invisible to per-string fit assertions because
  the strings still fit their own measures. Row 5: `plateAt` now returns
  crop-space coordinates and `pda-substrate-fit` walks the invariant. Row
  6: reading 03's whole architectural assumption changed (it now depends
  on the selected work through the estate band, without violating U17's
  clause that the subject at rest is still the layer).

Verified: 916 unit tests across 49 files (up from 892), Playwright capture
gates green on shipped + manifold in both themes at p1280/p1920, lint and
typecheck clean.

Loose ends kept honest, both in ADR-070 U25 §Left open and here:

- The bed's rest opacity is a lever; the owner may want to see the
  selection's bed-lift on the real landing before we tune it.
- The lab's default `--v` is still round one's seven, unchanged from U23.

### 2026-08-17 — The Skills come back to reading 03; U23's second half reversed (ADR-070 U24)

The owner's read one day after U23 shipped: 01 and 02 "feel super elegant", 03
"feels off" — the Skills are missing, the size difference does not read, the
boxes are not "fully optimized", the padding is tight, the title sits high.

⚠ **U23 MADE TWO CHANGES AND ONLY ONE WAS RIGHT.** The divided plate fixed the
composition. Deleting the 47 named Skill plates for a tick graduation did not:
**the count survived, the DENSITY did not.** 01 is a field of cartridges and 02
a board of modules, both thick with named parts; 03 became three strings over
texture. A tick is countable, a plate is countable AND readable.

The plates return in two columns per region, the graduation goes (its 26 units
are what make the lightest region's arithmetic close), the count letters at the
title's size, `GROUT` 4 → 10, title baseline 22 → 32. Lettering 20 → 67.

⚠ **The run is SEATED AT THE FLOOR** — top-anchored shipped in the first capture
and was wrong on sight: the head is a fixed cost against a count-proportional
area, so the heaviest regions carried bare field UNDER their plates and it read
as a hole. ⚠ **The lightest region is the binding case** (2.7u spare at rest)
and **a third paragraph line overflows it** while every per-string assertion
still passes — the guard walks the actual wrap.

Verified: 892 unit tests, `pda-substrate-fit` re-pointed at the plate grid (17
cases), 21 services-ring smoke cases with 67 labels through the pairwise overlap
walk, and captures on the real landing at 1280×720, 1920×1247 and in light.

### 2026-08-16 — Reading 03 ships `33 · inlay`; the record learns to speak in sentences (ADR-070 U23)

Production's reading 03 is one plate divided into five regions of material —
area is the Skill count, no gutters, one outer cut — each lettering its name,
its count and ONE PARAGRAPH, over its own physics field, with a graduation of
one tick per encoded Skill at its base. It supersedes U16's pattern cards; the
lab's local copy is deleted and `shipped` mounts production.

`CaseMapShape.meaning` is a new record field (≤96 chars, measured) and the only
one the projection does not uppercase — the map's first prose, scanned by
`cases-registry`. The 47 named Skill plates went with the card stack; lettering
fell ~71 → 20 strings.

⚠ **Promotion was a copy of the drawing and a RE-FIT of the box.** The lab's
crop (aspect 0.8176) is height-bound at the narrowest measured field (1440×800,
0.8071) by four thousandths, which an elastic crop cannot afford — `fitExt` has
no lever there when `maxW: 0`. `BOX_H0` is 696. **The ceiling on a width-bound
elastic crop is the narrowest field's aspect**, which generalises to any future
`pdaFit` reading.

Verified: 891 unit tests, `pda-substrate-fit` rewritten for the new geometry,
21 services-ring smoke cases, and captures on the REAL landing at 1280×720 and
at the owner's 1920×1247 (no dead panel, minPx 10.94).

### 2026-08-16 — A pass-through default hung four substrate drawings; round nine (`33 · inlay`)

`roundSix`'s `Field` wrapper defaulted its `p` to **0** and forwarded it
explicitly. `p` is `validation`'s lattice PITCH and a **loop step** in that
painter (`x += p`), and a destructuring default only fires on `undefined` — so
`mosaic` · `grade` · `tanks` · `stack` spun during render and never mounted.
Production was never affected: `PdaSubstrate` passes `p={14}`. Fixed at both
ends — the painter clamps a non-positive pitch, the pass-through has no default.

Two guard gaps it exposed, both captured in
[BEST-PRACTICES.md](BEST-PRACTICES.md) (§Content Guards): `substrate-lab-fit`
was 217 green tests throughout because it walks declared `lettering()` and never
mounts a component; and `capture-substrate-lab`'s default `--v` list is still
**round one's seven**, so later directions are only gated when named. Making
that harness default to the registry is the durable half and is **not yet done**.

Then round nine: `33 · inlay` — the owner picked 22 `mosaic`, asked for the
texture of 8 `gallery` / 11 `cards`, then cut the copy to a title plus one
paragraph. Partition IMPORTED from mosaic; density per unit area; the internal
hairlines replaced by a grout channel (a 1-unit rule paints 0.65 device px at
this meet). Contracts in [`.claude/rules/proof.md`](../.claude/rules/proof.md).
No ADR — the lab precedent is that a direction earns one when it wins.

### 2026-08-15 — The cartridge frame means WORKSTREAM; six new cluster-body directions (ADR-070 U17 rejected, U18 opened)

Round four (2026-08-14) built three selected-work-aware substrate directions
(`backplane` · `bus` · `cutaway`), promoted `backplane` to production, and
rebuilt reading 03 around the R4 cartridge at `layout.core` with an identity
flight between 02 ↔ 03. Owner's verdict the next morning: the cartridge
frame means WORKSTREAM on this surface (reading 02 uses it for the seat
card), so anchoring reading 03 on it made the substrate tab about the
workstream again. Reading 03's subject is the shared layer beneath every
workstream and its drawing may not depend on a selected work. Cycle A
row 2 fired (revert of a shipped fix) plus row 6 (an architectural
assumption changed).

- **Production reverted cleanly to U16.** Four production-side files
  (`PdaSubstrate.tsx`, `PdaConsole.tsx`, `tests/lib/pda-substrate-fit.test.ts`,
  `tests/lib/pda-viewbox.test.ts`) rolled back to committed HEAD; the lab
  shell's shipped branch re-points to U16's `ViewSubstrate` signature. The
  three round-four variants stay in the lab as recorded losers, guarded by
  `substrate-lab-fit` on their own.
- **Round five explores six new estate-scoped directions**, sharing one
  principle drawn from the CP2077 reference boards: a cluster is a PHYSICAL
  BODY OF LIKE OBJECTS whose depth IS the count. `hand` (fanned deck),
  `piles` (offset stacks), `constellation` (five nodes ring a total, wire
  trunks braid), `loom` (5 chips × N wires each → one SUBSTRATE chip),
  `leaves` (fore-edge combs), `roots` (five trunks on one bus).
- **New mechanical guard: `MARK_COUNT_VARIANTS`.** Every round-five
  variant exports `<name>MarkCount(record, key)`; the guard walks it and
  asserts marks per cluster equals `record.shapes[k].skills`. A fan that
  silently dropped a plate would fail the guard before it shipped — the
  numeral could still say 07. This is the mechanical answer to the risk
  that a MASS drawing lets its mass drift from its count.
- **THREE FIT DEFECTS caught in-lab the hour they were written**, all filed
  in ADR-070 U18 as generalisable: (1) a text-anchored-middle label's
  measure is its label column, NOT the mass silhouette it labels; (2) an
  edge-adjacent flagship label collides with the identity strip's count
  column — push cluster spread inward; (3) a rightmost-column flagship
  label extends past the crop's right edge — force the flagship side to
  face the crop's centre.
- ⚠ **CLASS OF LESSON WORTH KEEPING**: on this surface, chrome
  silhouettes carry semantic weight. The cartridge is WORKSTREAM; a
  module is A THING THAT RUNS; a diamond is a hub. A reading that borrows
  a silhouette from a neighbouring reading borrows its meaning too —
  which is what the round-four rejection reveals in one direction and
  what round five's brand-new geometries (fans, piles, combs, roots) are
  built to avoid.

Verified: `npm run verify` — **781 unit tests green** across 49 files;
`substrate-lab-fit` walks 110 checks including the six new mark-count
assertions; `scripts/capture-substrate-lab.mjs --v hand,piles,constellation,loom,leaves,roots`
produces 24 stills (dark/light × p1280/p1920) with 0 collisions, 0
clipped, 0 overflow, `minPx ≥ 7.8`; a production reading 03 capture at
1280×720 dark confirms the shipped U16 five-pattern-cards drawing is
unchanged (28 texts, `minPx 7.76`, 0 clipped).

### 2026-08-14 — A seated set takes its housing's diagonal (ADR-065 U5)

One owner ask, one selector: _"Proof > 02_Software-for-few — make sure that the
notch is in the bottom right corner not the bottom left."_ The tools plate's
four capability blocks (`.fl-detail__plate`) now notch **BR**.

- **It reverses a rule that named this exact set.** ADR-065 U1 wrote _"the
  dossier's plates take BL"_, and the CSS carried a comment justifying it. So
  this could not ship as a value change; it needed the law to say which diagonal
  a NESTED set answers to. It answers to **its housing's** — and this housing is
  the console, the law's one enumerated TL+BR object (U2). Sitewide TR+BL is
  untouched; the new clause can only reach a set inside that one housing.
- **U1's correction was right and incomplete.** It flipped the mockup's TL notch
  because TL is unlawful, then reached for the SITEWIDE lower end without asking
  whether a seated object inherits the diagonal of the box it sits in. ADR-070
  U13 had already met the same question from the other side and paid the opposed
  lean as a known cost — defensible for a full drawing on its own stage, not for
  13px plates sitting ~13px from the console's own BR chamfer, where the eye
  reads the two cuts as one relationship.
- ⚠ **The guard verified the wrong thing, and it is the U4 shape again.** It
  asserted `squareBL === false` — which confirms the notch is BL, not that it is
  on the right corner. Now pinned from BOTH ENDS (BR notched _and_ BL square),
  which is what fails on a drift back and on a two-notch polygon; the one-sided
  check passed both. Dry-run against the live DOM plus those two counterfactuals
  before trusting it, since a corner assertion that can only be satisfied one way
  is indistinguishable from a vacuous one until you feed it the failure.
- **Clipped CDP captures come back blank in the IDE webview** (`Page.captureScreenshot`
  with a `clip`, `fromSurface` either way). To read a 13px corner, clone the node
  into a fixed host at `transform: scale(3)` with `--dt-notch` pinned to its
  computed px and shoot the full viewport — container-query units do not survive
  the clone, which is why the depth has to be pinned and why this is only good for
  reading POSITION.

### 2026-08-14 — The session mark IS the session (ADR-059 U5)

One owner ask, filed as a QOL change: _"as a logged in user I see vince active
in the top right corner; this functionality should be folded into the icon LEFT
of the light and dark mode icon in the bottom right corner."_ Cycle A rows 1
and 3.

- ⚠ **A "SMALL QOL CHANGE" NAMED A COMPONENT NOBODY HAD RECONCILED WITH THE
  FRAME.** `components/auth/UserStatus` was a `fixed top-5 right-…; z-[1000]`
  overlay mounted from `Providers`, i.e. on every route — a second, unrelated
  instrument in the corner ADR-059 Update 1 had assigned to the nav, on a
  hard-coded offset tuned against neither. It survived four updates of that ADR
  because it never visibly collided. **An overlay outside the layout system
  does not get audited by anything that audits the layout system.**
- ⚠ **THE SLOT ALREADY EXISTED, AND FINDING IT WAS THE WHOLE DESIGN.** Update 3
  had seated a session mark exactly where the owner pointed — it named the
  session and then said nothing about it, with the email hidden in a `title`.
  The fold is that mark growing a panel, not a new control. Read the corner's
  own ADR before drawing anything for it.
- ⚠ **THE GLYPH STAYS BARE AT REST, AND THAT IS A MEASUREMENT.** Lettering the
  name beside the icon is the arrangement Update 2 §2 rejected on the numbers
  (~36px of labelled row against a ~26px strip). The panel exists because
  identity is worth a press and is not wayfinding.
- ⚠ **A SECOND PRESS-TO-OPEN PANEL MUST BE THE FIRST ONE, TURNED.** The frame
  has exactly two working corners; `.rin-session__panel` takes
  `.hud__nav__list`'s ground, hairline, blur, ease, dashed head and `>`
  chevron, and changes only its direction. Two panels that read differently are
  two instruments rather than one HUD.
- ⚠ **THE PANEL'S RIGHT EDGE IS UPDATE 4's ARITHMETIC ONE LEVEL UP.** Aligning
  to the control GROUP puts it 17px outboard of the track — because U4 centred
  the control ON the track, so the group's box necessarily overhangs by half a
  control. It lands 4px inside the major ticks, the identical clearance U4
  computed. Aligning to the track instead would cut the panel through the
  middle of the theme switch.
- ⚠ **DELETING A GLOBAL OVERLAY DELETES IT EVERYWHERE, INCLUDING WHERE NOBODY
  ASKED.** `/astrogation` and `/orrery` had no log-out of their own; they
  inherited this one. Named and accepted rather than discovered later — both
  route back through `/admin`, which has `SessionActiveShell`.
- The deferred `import("@/lib/auth")` moved WITH the button. The
  landing-performance skill named `UserStatus` by path for that invariant, so
  the skill was repointed in the same pass rather than left pointing at a
  deleted file.

### 2026-08-13 — The substrate is five stacks of named Skills (ADR-070 U16)

One owner ask, twice: _"what I mainly want to convey is the patterns across the
different skills"_, then _"(skills cut by 07, which is meaningless text) — just
a one-sentence explanation of what each substrate means, and then the overview
of the skills; I don't want a boring ass text list."_ Cycle B, then Cycle A rows
1, 2, 3 and 6.

- ⚠ **A CORRECT DRAWING CAN STILL BE THE WRONG DRAWING.** The pin grid (U15,
  one day old) was right in every measurable way — every mark resolved against
  `crossing()` — and it was replaced because it answered a question about
  DEPARTMENTS on a surface whose subject is the SUBSTRATE. The question a reader
  brings to this tab, _"what is in Judgment?"_, was the one thing it would not
  say. **No guard can catch this class; only the owner can.**
- ⚠ **THE 5 × 8 CROSSING LEAVES THE SITE, AND THAT WAS PUT TO THE OWNER
  EXPLICITLY RATHER THAN ABSORBED.** A redraw that silently drops the only
  rendering of a fact is a deletion in disguise. The record keeps it
  (`crossing()`, still guarded); if it returns it needs its own reading.
- ⚠ **THE SAME ARITHMETIC BIT TWICE IN ONE DRAWING: A 1-UNIT RULE PAINTS UNDER A
  DEVICE PIXEL AT THIS MEET.** The first cut's explicit Skill bus rendered as a
  bulleted list — the exact thing the owner had rejected — and the foot's
  separator was invisible while the head's identical rule read fine (the head
  has a band above it doing the work). U11's alpha ceiling, in a new costume.
  Weight, not opacity, is the fix.
- ⚠ **A HIGHLIGHT CAN RENDER AS DE-EMPHASIS.** Lettering the pattern's first
  encode in `--pda-grn-ink` against siblings at `--pda-txt` made the one plate
  the drawing points at the DIMMEST thing in the stack. The accent carries it;
  one signal per object.
- ⚠ **A BAN WIDE ENOUGH TO FAIL ON CORRECT CONTENT IS A BAN THAT GETS DELETED.**
  `/\bteams?\b/i` was written for `8 TEAMS` and was catching `People-team`, a
  client proper noun already shipping in the registry. Narrowed to the
  digit-adjacent form it was written for, rather than waived.
- ⚠ **A MACHINE-GENERATED LABEL IS CONTENT NOBODY AUTHORED.** The promotion
  script clipped `name` to 14 and produced `Cost / Feas` and `GL Recon` on a
  client page. `short` is authored, and `pda-substrate-fit` fails a `short` that
  clips its `name` mid-word.
- ⚠ **THE LAB WAS PREVIEWING A DRAWING THE SITE NEVER SERVES.** Its `shipped`
  baseline mounted at rest while production mounts elastic — at p1280 a
  430-unit card in a 763-unit crop. A look-dev route that does not mount what
  production mounts is a second source of truth.
- ⚠ **A DOM-ONLY CHECK PASSES AGAINST A PANEL THAT PAINTS NOTHING.** The
  console's reveal is scroll-driven; `scrollIntoView` leaves
  `.fl-con__console` at `opacity: 0` with the SVG fully measurable, hit-testable
  and green on every assertion. Scroll in incrementally before you shoot.

### 2026-08-13 — The persistent object was two drawings (ADR-069 U1, ADR-065 U4)

One owner ask: the work cards should match the configuration's, _"the workflow or
work title is a bit higher."_ Cycle A rows 1, 2, 3 and 6.

- **The reported defect was the title's height. The actual defect was that
  ADR-069's central claim had quietly become false.** That ADR says the selected
  work is a PERSISTENT OBJECT that flies between readings 01 and 02 rather than
  being replaced. Between 08-10 and 08-12, ADR-070 U2→U13 redrew reading 02's
  card five times and reading 01's `Cartridge` kept v18's interior, so the object
  arrived having changed its corners, its state glyph, its colour and its title's
  height. The title was the symptom the owner could see; the circle gauge's own
  band is what pinned it at 68 % down.
- ⚠ **CLASS OF MISS: TWO COMPLETE, PASSING GUARDS AND NOTHING BETWEEN THEM.**
  `pda-flight` pins the two RECTS across 20 slots × 2 directions × 4 field sizes
  — but a rect is a SILHOUETTE and says nothing about the interior. `pda-viewbox`
  walked the cartridge against hardcoded `w - 19` / `w - 25`, and
  `configurationLettering` declared the seat's strings against R4's. Each drawing
  was measured only against ITSELF, so the defect lived in the RELATIONSHIP,
  which is the one place a per-object test cannot look. **Where a claim is that
  two things are the same thing, something has to assert the pair.**
  `tests/lib/pda-card.test.ts` does, rung for rung, and it includes the guard the
  pairwise walk cannot give — **a rung present on one card and absent on the
  other fails**, which is the form the drift actually took.
- ⚠ **A DUPLICATED MEASURE IS THE SAME BUG AS A DUPLICATED DRAWING.** The
  cartridge's guard had its own copy of the card's insets while the component
  derived them from `CARD.pad`; both were "right" and neither would notice the
  other moving. That block moved out of `pda-viewbox` entirely rather than being
  re-typed with new numbers.
- ⚠ **"ON THE LAWFUL DIAGONAL" WAS THE OPERATIVE CLAUSE, AND UNIFORMITY HID IT**
  (ADR-065 U4). The twenty cartridges satisfied every clause of the notched-set
  exception except that one, with a TOP-LEFT notch — and an internally consistent
  set is exactly what the eye passes and what reading a rule's first clause
  passes. It surfaced from the flight, not from a corner review.
- ⚠ **A COLOUR CAN BE A ROLE VIOLATION RATHER THAN A PREFERENCE.** `cfg` was
  green in the grid and gold on the seat; R4's law is green = the human and
  nothing else, so the same stream was two colours and the flight was recolouring
  its own cargo mid-air. What green was carrying survives twice over (dashed body,
  crossed mark), which is why it could go.
- Fixed in passing, both recorded-but-unfixed items: `Cartridge`'s bar was
  `fontSize="10"` unscaled (the reason every config-lab variant's minPx stuck at
  5.4px), and `cartTitleChars` was missing `k` (42 characters allowed where 21
  fit). ⚠ Both were **written down in the labs as known** — a note is not a fix,
  and the lab comments asserting them are now a record rather than a render.

### 2026-08-12 — The pin grid, three elastic crops, one notch (ADR-070 U15, ADR-067 U2)

Three owner asks in one session. Cycle A rows 1, 2, 3, 4 and 6.

- **Reading 03 is the owner's PIN GRID.** Its `Module` cards cut `h × 0.34` on
  BOTH left corners — 68 % of a 148×50 card's left edge — beside `Plate`'s flat
  8 and `Cartridge`'s `14k`. ⚠ **Class of miss: the owner reported a corner and
  the defect was a glyph vocabulary.** Three glyphs in one drawing carried
  three corner grammars, two of them proportional to different things; nothing
  guards a silhouette, so it took an owner's eye. The mockup he supplied turned
  out to be the live record already drawn (30 taps, 5 cut, 10 empty), so the
  promotion was a coordinate port.
- ⚠ **A STRING COMPOSED AT RENDER TIME IS OUTSIDE EVERY CONTENT SCANNER.** The
  old drawing printed **`8 TEAMS`** on the public page — the exact phrase
  `cases-registry` bans — because that guard walks `CASES` with
  `JSON.stringify` and the string was built in a component. Reading 03 had no
  arithmetic guard at all; it has `substrateLettering` + `pda-substrate-fit`
  now. The same blind spot bit ADR-070 U10 (the card's three strings lettered
  by a shared glyph) and the substrate lab flagged this instance in writing
  before it was fixed.
- ⚠ **A FIX APPLIED TO THE READING THAT WAS COMPLAINED ABOUT IS NOT A FIX
  APPLIED TO THE SURFACE.** U12/U14 made reading 02's crop elastic on
  2026-08-11; readings 01 and 03 carried the identical dead-panel defect with
  every assertion green — 117px horizontal on 01, **265px on 03 at the owner's
  own viewport**, within 5px of the 270px that forced U12 the day before.
  `pdaFit.ts` is the mechanism generalised.
- ⚠ **DELETING A GUARD THAT FIGHTS A FIX IS HOW THE DEFECT RETURNS.**
  `pda-viewbox`'s ≤40-unit waste rule was a static-crop assertion; it is
  REPLACED by a both-axis centring contract plus a seven-field fill suite, not
  dropped. And `pda-flight` walked a static `VIEW_BOX[1]` in eight places —
  against an elastic reading 01 that goes **vacuous rather than red**, which is
  worse than failing.
- **The station notch is the leading plate's alone** (ADR-067 U2). WORK's cut
  renders zero pixels — the console's chamfer subsumes it by ≥8px at every
  clamp rung — so a universal rule was delivering exactly one visible thing: a
  floating diagonal on every other tab. ⚠ Its corner had **no test in either
  direction**, and ADR-067 U1's own text said so; it is pinned both ways now.

Verified: `npm run verify` (lint, typecheck, 669 units), the desktop smoke
(12 passed / 1 skipped — six-viewport map walk, box-clipping sweep, light
contrast walk on all three readings), captures at 1280×720 and 1920×1247 in
both themes (0 clipped, 0 label-on-label, minPx 7.76 / 10.94), and the
substrate lab's four gates.

### 2026-08-10 (eighth pass) — The top-left chrome goes (ADR-070 U8)

Owner: remove THE CONFIGURATION and W-017 so the owner plate can breathe and
move up. Both restated something already on the panel — the lit rail station
above it, and the id the cartridge prints on its own face (still visible
there). Plate 170 → 72.

⚠ **Lifting one anchor opened a ~250-unit dead band**: the base is pinned to
the crop floor and the plate to its ceiling, so the middle stretched. Closed
by dropping the card to 335 and raising `SUB_H` 130 → 158 — sub-card height
is the board's vertical ballast. Waste guard re-checked (39 of 40 spare).
Cycle A rows 3 and 4.

Verified: 615 units, three casefile smokes, captures both themes (26 labels,
0 clipped).

### 2026-08-10 (seventh pass) — The seat says what it owns (ADR-070 U7)

Owner: "the who owns it should have multiple lines". `CaseMapConfiguration.p`
is documented as a PAIR — "Owner role + what that seat actually owns" — and
every drawing since the projection was written took `p[0]` and dropped
`p[1]`. Added as `PdaWork.ownerNote` (`string | null`; person-led has no
configured seat to gloss), lettering one step down in neutral ink under the
seat; plate 106 → 124 to hold the row.

⚠ **Class of miss worth remembering: a content type that documents a field
as a PAIR wants BOTH halves checked when a drawing is authored.** `p[1]`
was invisible for four updates because nothing on the surface and no guard
ever asked where it went. Cycle A rows 3 and 6.

Verified: 615 units, three casefile smokes, captures both themes (28
labels, 0 clipped).

### 2026-08-10 (sixth pass) — The board gets a margin; the seat's line gets its weight (ADR-070 U6)

Two owner defects on the U5 board. Cycle A rows 3 and 4.

- **The side nodes sat ON the crop's wall** (`LEFT_X` 36, crop x 36 — zero
  margin). Inset 24 each side; the 828 crop is now one width chain
  `24|234|24|264|24|234|24` and ⚠ `CHIP.x` IS `LEFT_X + NODE_W + GUTTER`,
  so the chain moves together or the nodes return to the wall. The card
  pays the width (CORE_K 1.6 → 1.5); the sub-card measure is fixed by the
  record's longest word and the margin is not negotiable.
- **The seat connector existed and could not be seen** — `--pda-dim` at
  0.75, read as absent. **Class of lesson: a line quiet enough to be missed
  is not a subtle connection, it is a missing one.** The DASH already
  carried the grammar distinction from the nodes' bundles; the VALUE did
  not have to as well. It takes the plate's green at full weight with a
  contact tick at the card.
- Verified: 615 units, three casefile smokes, captures both themes.

### 2026-08-10 (fifth pass) — The seat's own connector and column (ADR-070 U5)

Owner: connect WHO OWNS IT to the card, but not with the nodes' bundles,
and drop the floating DECIDES ALONE line as clutter. One dashed hairline
(the seat is authority, not data — answerable-to, not feeds-into), and the
autonomy becomes the plate's right column, plate widened to 400 to hold the
pair without the columns meeting. Verified: 615 units, three smokes,
captures both themes.

### 2026-08-10 (fourth pass) — The crop goes portrait; the pairs stack (ADR-070 U4)

The owner's "you're just not using the space at the bottom". Cycle A rows
1, 2, 3, 6.

- **The dead panel was the CROP's ASPECT, and U3 fixed the wrong half.** A
  landscape crop (1.23) in a portrait field (0.876) is width-bound under
  `meet`, so it left ~283px of letterbox OUTSIDE the drawing — unreachable
  by moving elements. U3 read it as alignment and only moved the void from
  top to bottom. Portrait crop (828×912): meet 1.013, minPx 5.55 → 10.13.
  **Class of bug: when a drawing will not fill its box, check the two
  ASPECTS before moving anything inside it.**
- **One sub-card size across all six** — side nodes stack their pair
  vertically, the wide base seats its in a row, sized to match. Answers
  "what it inherits is too big" and lifts every value to one line at fs 12.
- ⚠ **The fit guard now walks WORDS, not just lines, and found a real
  defect the hour it was written**: `RECONCILIATION` (14) is longer than
  the `INTELLIGENCE` (12) the sizing assumed, and `wrapLines` cannot break
  it — every per-line assertion passed while it overflowed.
- Deleted (all owner-named, absence guarded in unit AND smoke): draw meter
  - NEVER A PRICE, DRAWS ON caption, corner brackets, pad clusters, vias,
    crosses, the arrowed dimension and its ticks.
- Verified: 615 units, three casefile smokes, captures at 1780×1270 dark +
  light and 1280×720.

### 2026-08-10 (third pass) — Thick bundles, no readout, the drawing docks to the rail (ADR-070 U3)

Owner corrections on the U2 board, same day. Cycle A rows 4 and 6.

- The mockup's thin gutter traces lasted one pass — the switchboard's
  multi-conductor ribbon weight is the connection grammar (8-wire per side
  node, two 5-wire south).
- **The reactive readout is deleted** — ADR-069's one-line contract
  overruled by the owner ("its eating up real estate"). The notes stay in
  the record and letter nowhere; unit + smoke both assert the ABSENCE (the
  smoke's old ≥40-char assertion inverted to <40 — prose returning IS the
  readout drifting back).
- **The "space above WHO OWNS IT" was the `YMid` anchor**: at tall consoles
  the field outgrows the crop's aspect and the slack floated ABOVE the
  drawing. `preserveAspectRatio` → `xMidYMin` WITH `fitCrop`'s `oy: 0` in
  the same commit — ⚠ the attribute and the flight arithmetic are one
  pair; a drift misplaces the flight by half the letterbox.
- Verified: 616 units, three smoke cases, captures at 1440×800 + 1680×1250
  (the tall case) + light.

### 2026-08-10 (later) — The owner's unit board replaces the switchboard's composition (ADR-070 U2)

**U1 misread the ask and lasted one day.** The owner had supplied their own
unit mockup; U1 kept the switchboard's skeleton and decluttered it, and the
owner's verdict ("what you've created is just nothing") forced the real
pass hours later. Cycle A rows 1, 2, 6 — ADR-070 gains Update 2 with the
reversal on record; proof.md's section is rewritten as §The unit board;
CLAUDE.md follows.

- **The mockup's composition installed whole**: one lit card carrying THE
  BAR (new optional `bar` prop on the Cartridge primitive), the owner
  joined by a measured DECIDES ALONE dimension, three question-headed
  nodes (the "no question headers" ruling superseded by the owner's own
  mockup), gutter traces + fan, quiet ornament. Gate, nibs, six housings,
  multi-conductor ribbons and the substrate bars all deleted from this
  reading; the caption alone counts shapes.
- **The adaptation, not the transcription, is the work**: stacked rows
  where the mockup's halves cannot hold the record's 26-char worst,
  tracking cut where the person-led seat overruns, the readout forced to
  11.5 by the outranking guard, the bar wrapped on the card, MODEL and
  CONNECTORS as the owner's k-labels, new `--pda-gph*` blue in both theme
  files.
- **The durable lesson (also in memory): when the owner supplies a mockup,
  the mockup IS the composition.** "Not verbatim" licenses adapting
  strings, measures, guards and shared chrome — never substituting a
  different drawing.
- Verified: 618 units green (fit walk of all 27 at the one-line measures;
  `CORE_RECT` byte-identical), three smoke cases incl. the light walk
  measuring the new blue, headed captures both viewports both themes.
  Two more capture-only catches: the hatch band through the value's
  descenders, and nothing else — the emptier board leaves fewer places to
  collide.

### 2026-08-10 — The switchboard simplified: radial runs, shaped parts, legible tags (ADR-070 U1)

Owner review of the shipped reading-02 drawing against the CP2077 reference
and their own v19 mockup (elements, never verbatim). Cycle A rows 1, 4, 6 —
ADR-070 gains Update 1; proof.md's switchboard section and CLAUDE.md's map
entry carry the new contracts.

- **The promotion pass took the reference's RIBBONS but not its ORDER.** The
  fix is compositional: every run centre-out, junction boxes deleted, the
  doubled SYSTEM wiring collapsed into one trunk through one gate forking at
  x 926, ghost ribbons deleted, ornament trimmed.
- **A part is a housing, not a square** — six drawn silhouettes at 176 wide
  replace the 120×86 rects; corner glyphs deleted with the room they no
  longer earn.
- **The type is derived, not chosen**: tags 7.5 → 10 in `--pda-txt2` (the
  owner's "utterly unacceptable" fix), values 8 → 10 wrapped, the 46-char
  bar WRAPS in the gate channel instead of shrinking, readout 10 → 11
  (forced by the outranking guard).
- **Two conductor-versus-content collisions caught on capture, zero by
  guards**: a riser through the bar text (fork moved past the whole 700–930
  text channel) and a landing band grazing the lane chevron (nib 305 → 286).
  The hand-check law is the durable lesson — re-read it before rewiring.
- Verified: `npm run verify` 618 green (fit walk of all 27 streams at the
  new sizes; the ADR-069 flight untouched), three casefile smoke cases,
  headed captures at 1280×720 + 1440×800 in both themes, hover pair + readout
  swap confirmed.

### 2026-08-10 — Vesper station: brackets off, composition up, ENHANCE de-plated (ADR-068 U7)

Three owner notes on the live IMAGE & VIDEO station. Cycle A rows 4 and 6 —
ADR-068 gains Update 7; `.claude/rules/proof.md` and CLAUDE.md carry the new
literals.

- **The bay's four gold corner brackets deleted** (`.fl-bay__br*`, its spans
  in `ToolGallery.tsx`, its light override). The box is already framed and
  gold buys one thing per drawing. ADR-065's bracket grammar is intact — this
  object stopped qualifying as "framed but not a device".
- **The scale pass, and the lesson worth keeping.** The first cut raised the
  tile's `cqw` cap and MEASURED AS A NO-OP: in `min(N·cqh, M·cqw)` the cap
  binds only below W/H = N/M (1.26), and the real bays run 2.3–2.9. The size
  is the `cqh` coefficient, and it is paid for out of `.fl-wire__main`'s bias
  padding — one budget. Same class of error on the dock, where the binding
  term was a 52px HARD CAP, not a ratio. **Read which term binds before
  retuning any `min()` on this surface.**
- **ENHANCE PROMPT lost its border and wash.** The light walk was unaffected
  by arithmetic, not luck: `bedOf()` only counts an ancestor at α ≥ .85 and
  the green wash is α .14/.16, so it was never the label's bed.
- ⚠ **1280×720 is down to 2.3px of slack** (from 4.5) and is recorded as such
  at the rule. The next height addition has to come back out of that padding.
- Verified: the three casefile smoke cases green, typecheck clean, lint 0
  errors, plus direct measurement at six viewports (real scrolls, row pinned
  by click) and captures in both themes.

### 2026-08-09 — Reading 02 is a switchboard, on the landing (ADR-070)

The owner picked the config lab's fifth archetype and asked for it in
production. Cycle B — ADR-070 opened; `.claude/rules/proof.md` gains §The
switchboard and its lab section is re-pointed; CLAUDE.md's map entry updated.

- **The lesson worth keeping** is why the first four archetypes failed: each
  kept the shipped reading's skeleton, mined the reference as a PARTS CATALOG
  rather than for its COMPOSITION, and let the fit guards drive layout
  (symmetric grids are easy to prove collision-free). Guards police a drawing;
  they never compose it.
- `PdaConfiguration.tsx` + `ribbon.ts` are production now; the old
  `ViewConfiguration`, `Module`'s answers mode and the `MODULE_TYPE` /
  `moduleAnswer*` helpers are DELETED. `PdaEntry` moved to its own module
  (reading 02 supplies reading 01's crop — one shared type, no cycle).
- ADR-069's morph, answers and readout all survive; `CORE_RECT` is the chip and
  the two rects are now EXACTLY similar (176×136 × 1.6).
- Measured on the landing at 1280×720: meet 0.662, 31 labels, minPx **4.97**,
  0 clipped. The tight crop (`56 20 910 740`, the content box rather than the
  authoring space) is what bought that. Smoke 21/31, verify 618.
- ⚠ New verification trap: the browse band's first quarter is the map row, so
  0.35 of the dwell lands on the Studio SHEETS — `capture-map-readings.mjs`
  defaults to `--at 0.09` and runs headed.

### 2026-08-08 — The CONFIGURATION lab: four archetypes beside the shipped reading

Owner verdict on ADR-069: the morph is right, the drawing still reads as
four-modules-plus-core — "go crazy". New look-dev route
`/test/intelligence-config-lab` (BOARD-archetype precedent: live record, real
console chrome, measured not reviewed, NO ADR until a direction wins; nothing
on the landing changed). `.claude/rules/proof.md` gains §The CONFIGURATION lab.

- Five variants: `shipped` (the real `ViewConfiguration`) beside `die`
  (motherboard; the 47 `skillSymbol` marks' first render, clustered per shape
  on the ground plane), `chain` (signal path with a physical gate aperture +
  MAP_CHAINS neighbours), `section` (cutaway; shapes as strata below grade),
  `schematic` (symbol-per-part nets + power rails). Every variant keeps a
  socketed cartridge home so the ADR-069 flight survives promotion.
- `tests/lib/config-lab-fit.test.ts` (fit + envelope over ALL 27 works × 4
  variants — the lab page is outside the registry scanner's reach) and
  `scripts/capture-config-lab.mjs` (55-sample matrix, dark+light, gates:
  0 collisions / 0 clipped / minPx ≥ 4.3; `--measure` pins the housing from
  production). Two real ceilings caught same-day: `bar` runs to 46 chars
  (W-052), and fs 7 renders 4.22px at the binding meet — under the floor.

### 2026-08-08 — Map console: the selection morph + the answered configuration (ADR-069)

Owner ask off two Cyberpunk 2077 reference boards: clicking a workstream should
MORPH into its configuration, and the configuration should say something about
the stream it is showing. Cycle B — ADR-069 opened with the flight's arithmetic,
the flavour table, the fit table and the rejected pair mark; `.claude/rules/proof.md`
gains §The selection morph; CLAUDE.md's map entry rewritten.

- **The system rule:** the selected work is the PERSISTENT OBJECT. Reading 01
  draws it as a cartridge, reading 02 as the core (the same glyph at `CORE_K`),
  so 1 ↔ 2 MOVES it while everything else re-rasters. That is what let the
  readings stay terminal display-switching rather than becoming the zoom ladder
  ADR-062 closed — the field never scales, no `viewBox` is tweened.
- **New pure module `pdaFlight.ts`** + 16 cases, off ONE rect read per
  transition. Both invariants asserted: the box's x/y never enter the
  arithmetic, and a uniform ancestor scale cancels out.
- **Reading 02 prints the record.** Nine authored pairs per configuration were
  being dropped by the projection; four now letter as answers and the rest ride
  a reactive readout. `evals` (142 % of measure) and joined `k` (121 %) are
  arithmetically unletterable in a module, which is why the gate answers with
  the bar. 21 fit cases over all 27 streams.
- **Cycle A rows 3, 5 and 6 fired.** Row 3: an unfilled SVG shape is only
  clickable on its STROKE — all three person-led cartridges could not be opened
  by clicking their centre, which no existing guard could see (the keyboard path
  worked and the smoke clicked the filled first one). Pattern added to
  BEST-PRACTICES; the smoke now hit-tests all twenty with `elementFromPoint`.

### 2026-08-07 — Casefile: glyphed index register + tool dossier + Vesper wireframe (ADR-068)

Owner redesign from `proof-page-blocks-left.html` (canonical; `thoughtform-
proof-panel-v2.html` superseded). Cycle B: ADR-068 opened with the shape,
prior art (056/059/063/064/065/066/067) and the mockup→law override table;
ADR-065 Update 1 (notched seated sets) and ADR-066 Update 1 (diamond back
under short handles; one-column layout superseded) resolve the contradictions
in their owning ADRs; `.claude/rules/proof.md` register + tools sections
rewritten.

- **The IA ruling:** left column = the PROGRAM's achievements (uniform
  glyph+claim+sentence index on all four rows, non-interactive); right panel
  = the TOOL (dossier field: header → route → bay → detail 2×2 → foot). The
  Software register's tool-describing blocks became program claims; the
  per-tool content moved to `ProjectCase.tab/route/detail`.
- **Measured, not ported:** tall register rung at 1070h (a DIRECTORY
  constraint — the plan's 1000h clipped it 36px; the old 931h rung had the
  same latent defect); rungs must TILE (999/1070 printed sentences into a
  128px box); route viewBox 560×66 with 1440×800 binding (SVG height rides
  field WIDTH); capture floor `clamp(70px, 9svh, 180px)`; `data-n=4` diamond
  restored (handles 68–106px vs 122.9 available — the input changed, not the
  math); green ramp extension measured composited in light (own 4.80, gold
  4.91, NOW stroke 4.90; step outline lifted to α .5 = 3.33:1).
- **The contact-sheet check fired before anything rendered:** `ownership`
  read as `gap`'s sibling in one visible set (the ADR-059 failure mode);
  redrawn as an open vessel. Glyph anti-patterns mechanized in
  `tests/lib/proof-glyphs.test.ts`.
- **Fixed in passing (pre-existing):** desktop-width PRM collapsed the
  console to HEIGHT 0 on every plate — console.css's unwrap gate keyed on
  width alone while casefile.css's static-flow gate includes PRM; the gates
  are now the same pair, with a PRM smoke assertion.
- **Factual corrections:** babylon/heimdall `year` 2025 → 2026 (repo first
  commits).
- Verification per commit: `npm run verify` green (589), services-ring smoke
  green (12) with new assertions (glyphs, sr-only rung, route type floor +
  PT Mono, BL-notch clip-path signature, per-tool filter split, PRM console
  height, light-theme green samples); measured walks at 5 desktop viewports
  - mobile; ring suite untouched and green.
- **Open, recorded in ADR-068:** the mobile route wants a different DRAWING
  (arithmetic: ~335px of glyphs vs ~312px column); mímir/babylon/heimdall
  wireframes; `--pda-grnh` → `var(--atreides-ink)` re-point candidate; the
  aether keynote's tools-count inconsistency (outside this repo); desktop
  PRM renders the whole casefile in a ~271px column (pre-existing — the
  unwrap fix made the console visible there, the column width is its own
  pass).

### 2026-07-17 (latest 3) — Services ring: arrival remap so it turns at the park (ADR-029 update)

Owner, third pass on the same seam: entering #services still had a trailing
~0.24vh where the section had settled (cards parked) but the ring stood
still on Advisory before it began rotating. Cycle A:

- **ADR-029 update.** Replaced the uniform 5-beat ring grid with an arrival
  remap: `RING_ARRIVAL_FRAC` (0.14 ≈ the dissipate settle) holds Advisory
  through the short arrival, then three quarter-turns pack across the reading
  zone, then the exit-hold. `RING_EXIT_START` keeps the exit band at the last
  1/RING_STEP_COUNT so `exitProgressForRunway` (+ the #about −100svh sweep)
  is byte-identical. `data-active-step` = the front-card index
  (`activeServiceForProgress = round(ringIndex)`), exact ring↔step lockstep.
  `beatScrollTarget` + `ServicesCardRing` call updated; `travel` clamped ≤1
  (FP monotonicity). Tunable via `RING_ARRIVAL_FRAC`.
- Verification: `npm run verify` green (297); desktop ring smoke re-pinned
  (front-card indices, exit step 4→3); entry map + screenshot confirm the
  ring begins turning right at the park (p≈0.14) — Advisory sliding out,
  Embedded rotating to front — instead of a beat later.

### 2026-07-17 (latest 2) — Tab-return desync: corridor scroll writers re-sync on visibilitychange

Owner report: switching tabs and back sometimes left the #services masthead
copy gone and the brandmark stuck as scattered particles instead of the
settled wireframe. Root cause (a bug CLASS — new BEST-PRACTICES pattern):
the corridor's rAF-throttled scroll writers (`useDepthScroll`,
`useCorridorExitScroll`, `useServicesStageScroll`) + the masthead reveal
controller are driven by `scroll`/`resize` only. The tab-hide freezes rAF +
the demand frameloop; on return no scroll/resize reliably fires, so a stale
pre-hide value can stick (masthead opacity = `--svc-content-in * (1−exit)`;
brandmark reads `paintProgress`/`servicesAmbient`). Cycle A:

- Added a `visibilitychange` resume handler to all three writers (force a
  synchronous re-sync from the live scroll rect) + the masthead controller
  (force the resolved full-text state when settled). `useServicesStageScroll`
  busts its write-dedupe caches first so the heal can't be skipped.
- Verification: `npm run verify` green (297); desktop ring smoke 7/7; a
  Playwright repro corrupts the masthead to the "gone" state, dispatches
  `visibilitychange`, and confirms opacity + copy return (title/intro
  fully restored). BEST-PRACTICES pattern "rAF-throttled DOM/store writers
  must re-sync on tab-return" added (sits with the demand-loop + dt-clamp
  frameloop-resume family).

### 2026-07-17 (latest) — Services message pass: headline, de-framed intro, decluttered card (ADR-044/029 update)

Owner: #services is where a visitor must know what he does immediately, and
the copy/chrome was fighting it. Cycle A:

- **Headline** "ONE LOOP. / THREE DEPTHS." → "AI YOUR TEAM / CAN RUN." (the
  capability-handover positioning; picked from three offered directions).
- **Intro** de-framed (dashed plate + glass `::before` + gold corner
  crosses + aperture clip-path all removed; bare text on the band, padding 0) and tightened to match. Cross spans stay in JSX, `display:none`.
- **Card face** (baked): service-label chip 24→30px; the `<CODE> · OPEN`
  status and the `FEED 0X · …`/STANDBY caption removed (HUD filler); body
  31→35px + dawn 0.7→0.92 (bigger, less gray). `.svc-plate__lede` mobile
  parity moved 15.5→17.5px / dawn-70→dawn-90.
- Verification: `npm run verify` green; desktop ring smoke re-pinned
  (`ONE LOOP.` → `AI YOUR TEAM`); four baked faces screenshot-checked at
  1440×900.

### 2026-07-17 (later) — Services runway: drop the vestigial lead-in beat (ADR-029/030 update)

Owner report: entering #services cost one dead scroll viewport (stars /
sphere remnants drifting, cards not rotating) before the ring engaged.
Root cause: two beats held card 0 before rotation — a `ServicesPlateCluster`
accordion-era "collapsed lead-in" beat (meaningless in the card-ring model)
plus service 0's own read beat. Cycle A:

- **ADR-029 update.** `RING_STEP_COUNT` 6 → 5, runway 600 → 500svh; beat
  `i` now owns service `i` (card 0 front on arrival, first scroll rotates
  to card 1). The four lead-in offsets moved in lockstep
  (`ringIndexForProgress` `k<=1`/`k-2` → `k<1`/`k-1`,
  `activeServiceForProgress`/`setActiveByStep` `step-1` → `step`,
  `servicesBeatScrollTarget` `+1.5` → `+0.5`). Exit-hold beat + ADR-047
  #about sweep preserved (exitProgressForRunway is a pure function of the
  count). ADR-030's stale "== 6" invariants annotated.
- Verification: unit suite re-pinned (46 pass); ring smoke active-service
  progress values remapped; `npm run verify` green; browser-checked the
  first scroll after arrival now rotates.

### 2026-07-17 — Editorial band: shared horizontal frame for section text (ADR-048)

Owner compared the services masthead against linear.app: margins felt
arbitrary/inconsistent across widths. Root cause: the two-layer inset
(station `--hud-content-inset` + `--rail-inset: --hud-margin + 8vw`) was
uncapped and viewport-proportional — effective side inset drifted
218→451px across 1024→2560 with no stable proportion. Cycle B:

- **ADR-048.** New `:root` band tokens (`--band-max` 1200px /
  `--band-pull` 0px / `--band-margin`); `--rail-inset` re-derived as the
  band remainder — below the ~1503px crossover the text edges sit ON the
  hero headline edge (one shared content edge, owner's pick), above it
  the band pins centered at `--band-max`. All three consumers (services
  masthead, both about grids) moved in lockstep with zero consumer-site
  edits. Band-relative masthead lead cap; Arc split cap consolidated onto
  the token (zero visual change). ADR-044/045 addenda; landing-v7 rule
  updated.
- Verification: `npm run verify` green; ring smoke unchanged; browser
  rect-probe at 1280/1440/1680/1920/2560 matched the ADR-048 table ±1px
  (services lead + about grid + hero edge in lockstep below the
  crossover). Found in passing: the landing-page `toHaveScreenshot`
  suite has NO committed baselines (never in git; first local run writes
  actuals and exits 1) — noted in ADR-048, no action taken.
- **Same-day follow-up (ADR-044 update):** the "Services · 04" masthead
  eyebrow retired (the journey's last station-index eyebrow);
  `--masthead-top` re-derived −20px → +9px so the title cap stays on the
  big-title line; decode targets are now the two title lines only.
- **Same-day follow-up 2 (ADR-048 update):** the vertical axis joined
  the band — owner reference pass (hematogenix / varex / srg / flshfrm /
  rebooot: editorial headers at 13–17% of viewport height vs our 7.5%
  corridor title-card line). `--band-top` = `--station-title-top` +
  `--band-air` (clamp(28px, 4.7svh, 52px)); the masthead title + intro
  drop to ~11.5svh (front-card clearance caps us below the references'
  13–17%). Corridor heads untouched; retuning --station-title-top still
  moves every surface together.

### 2026-07-16 (evening) — Services surface polish: seam perf, retina DPR, morph crispness, layout + card scale

Four owner complaints, one pass (Cycle A per workstream; 8 commits, each
independently revertible):

- **Seam perf (ADR-047 Update 5).** Corridor→#services scroll janked.
  Draw gates extended to all remaining painters (walls/tunnel/topography/
  streaks/motes/photons/starfield, same-frame-as-opacity discipline), ticker
  display-gate + SIGNAL_OUT arc freeze, caption glass visibility gate +
  backdrop-filter transition removal, root-style + armillary anchor publish
  delta gates. Headed-Chromium trace 1280×800: p50 21–25ms → **16.7ms
  (vsync)**, p95 50–58 → 37–42ms, >50ms frames 9–22 → 0–4, long tasks
  798ms/run → ~0. Governor constants untouched (not needed post-fix).
- **Retina brandmark (ADR-038 update).** `BrandmarkPhysicsCore.uPixelRatio`
  read raw `devicePixelRatio` instead of the governed buffer DPR → fat
  chunky dots after a governor step-down on MacBook. Per-frame
  `state.viewport.dpr` sync; consumer contract documented. Post-deploy check
  for Vince: scroll the seam on the MacBook — the parked wireframe should
  stay crisp, and briefly-soft states should recover within ~5s of idling.
- **Terminal-crisp morph (ADR-023 addendum).** The 2D→3D flight window read
  "painted". `FLIGHT_CRISP_FLOOR` 0.7 + point-size sin-dip 0.9 + recede
  atten 0.12 — identity-default knobs, endpoints screenshot-verified
  pixel-equivalent, choreography untouched. `brandmark.md` updated.
- **Layout + card scale (ADR-044 update).** Corner-LINE masthead rule (both
  text blocks top-anchored on the bracket line, vertical-only change) +
  `parkedInstrumentScale` viewport boost (1.15× on MacBook-class, 1.0 wide/
  tall, recT-target-only so the corridor is byte-identical; new unit suite).
  Deck-flip portrait landing verified at 1280×800 and 1920×1080.

### 2026-07-16 (later) — About deck-flip stage (ADR-047; supersedes the ADR-046 dock, same day)

Owner redesign of the services→about transition: the cartridge dock was
"gimmicky and doesn't solve the transition." Cycle B (new surface) + the
full dock removal.

- **Deck stack + flip (WebGL).** Across the services exit clock the four
  ring cards STACK via an azimuth sweep (`aboutDeckMath.ts` — per-card
  nearest-full-turn φ targets, deck-depth radius correction, spring-settle;
  exact identity at exit 0, unit-pinned). The pinned `#about` stage then
  FLIPS the deck π on X to a shared gold-tone portrait back face
  (`bakePortraitBack`, mirrored chamfer chrome; back planes at
  `rotation.x = π` so Rx(π)∘Rx(π) = identity — upright, verified live)
  and the deck lands on the DOM portrait slot (viewport-first per frame).
- **Pinned transparent #about (DOM).** 300svh runway + sticky transparent
  stage (`AboutStagePortal`/`AboutStage`/`useAboutStageScroll`,
  `[data-about-root]` prototype shell); orbit cluster reuses the
  `.voidwalker__orbit*` grammar; copy via `aboutStageData.ts` (lockstep
  with the fallback markup); scrubbed `--ci-off` reveals (not
  useRevealMotion — portal nodes unobserved, one-shot `.is-in`).
- **Ambient kill retargeted #about → #continuum** with the gate keyed to
  the same rect as the fade envelope (the ADR-030 seam-cut bug, avoided);
  `#about` gets the transparent treatment + a FAIL-OPAQUE `::before`
  shield (`--about-bg-in`, default 1); `#continuum` takes the opaque-cover
  role. Verified bidirectionally in-browser: ambient survives the whole
  about band both directions, dies/re-engages exactly at continuum.
- **Found live:** the media-flip null-render stranded `data-about-mode`
  (empty about on mobile) — the hook now disengages when its stage ref
  goes null (fail-static hardening).
- **Dock removal:** component/CSS/flag/math/tests deleted; kept
  `viewportSeat.ts` (extracted seat projection), `beatScrollTarget.ts`
  (ServicesStage uses it), and the BEST-PRACTICES disabled-button lesson.
  ADR-046 → Superseded; ADR-045's desktop emerge → superseded note
  (fallback surfaces unchanged); ADR-008 paint-stack rows 4b–4e rewritten;
  landing-v7 + scroll-animations rules updated.

### 2026-07-16 — Services copy sweep · About emerge + rail parity (ADR-045) · Cartridge dock (ADR-046)

Owner-directed triple pass. Cycle B for the two new surfaces; the copy
sweep is data-only.

- **Services copy sweep.** All four card titles/ledes + the masthead moved
  to Vince's concrete first-person voice ("I move in with your team.");
  the stale "ONE LOOP. THREE DEPTHS." (predated the fourth service) became
  "ONE PRACTICE. FOUR WAYS IN.". `servicePlateData` (production) +
  `serviceData` vestigial fields in lockstep; `/test/services-wordmark`
  lab defaults mirrored; ADR-044 consequence note updated. Verified: all
  four baked WebGL faces re-bake without overflow; mobile plates share
  the strings by construction.
- **About rework (ADR-045).** The `.voidwalker__orbit` parallax +
  whole-cluster JS instrument tag retired for an authored emerge sequence
  (portrait clip-wipes first, rings/halo/readouts stagger around it);
  portrait centering moved off the transform channel (inset/margin);
  `--rail-inset` promoted to `:root` and consumed by both the services
  masthead and the about grid — measured 0px text-edge delta at 1968w.
  Two pre-existing defects fixed in passing: the 12-dot particle halo was
  invisible since authoring (span-relative translateY %), and the
  standalone prototype's reveal JS stranded every clip-path-hidden
  element (Chrome clips IO geometry by the target's own clip-path — 44
  stuck elements including every title; production's scroll fallback is
  the load-bearing reveal there, prototype gained the same fallback).
- **Cartridge dock (ADR-046, flag `SERVICES_CARTRIDGE_DOCK`).** The exit
  beat's cards now eject, flatten, and fly in-world to a bottom-right DOM
  console; DOM cartridges crossfade in AT the seat, persist page-long
  (pure function of clamped runway progress — no latch), and glide back
  on click via the shared `servicesBeatScrollTarget`. New pure-math module
  `dockMath` (13 unit tests incl. the identity pin), seat-rect bridge,
  ring exit branch, pointer-look exit damp, ADR-008 paint-stack row 5a,
  landing-v7 rule note, smoke probes (+ fixed the stale ADR-044 SOURCE BUS
  assertion). Two bugs found live: rAF-order staleness on teleport jumps
  (fixed with a trailing sync tick) and **React dropping clicks on a
  props-disabled button whose DOM `disabled` was flipped imperatively**
  (fixed by keeping `disabled` out of JSX — captured in BEST-PRACTICES).

### 2026-07-15 — Mobile Landing Quality Pass, Round 3 (ADR-018 Revision 3)

Owner visual-tuning follow-up to Round 2. Cycle A. All gated mobile →
desktop byte-identical.

- **Thesis gateway visible at rest + rise-to-centre.**
  `getThoughtformMobilePhase` holds `diagramFactor` at the exit fade (was
  a scroll-in ramp) so the compass reads as already-there on arrival; new
  `getThoughtformMobileRiseOffset` seats the brandmark + compass below
  centre at rest and rises them to centre by the SVG→particle handoff
  (offset 0 there → morph/fly byte-identical). Applied in
  `getBrandmarkWorldPosition` + `ThoughtformCompassGate`.
- **Arc caption pull-up.** Support straddles −2.0 / −1.7 / −1.45 → −1.8 /
  −1.5 / −1.35 (less bottom-heavy; the Build case cards now fit fully).
- **Type scale.** Mobile arc meta unified onto 9px (badge / coord /
  tagline); clean 16 / 12 / 11 / 9 mono scale.

Three code files (`sceneGeom.ts`, `ThoughtformCompassGate.tsx`,
`home-v2.css`) + docs. lint / typecheck green; verified in-browser at
390×844.

### 2026-07-15 — Mobile Landing Quality Pass, Round 2 (ADR-018 Revision 2)

Follow-up to the same-day Round 1 below. Round 1 landed 7 of its 9
workstreams cleanly but its "styling parity" workstream never actually
removed the title chrome or reframed the support copy (only the kicker +
case cards shipped), and its new mobile epilogue introduced a font
regression. Four user-visible items + a broadened alignment sweep. Cycle
A (multiple linked fixes on a shared surface). All gated on
`@media (max-width: 760px)` / `isMobileComposition()` / mobile-only
classes → desktop byte-identical (spot-checked at 1280×800).

- **Bare Arc titles.** The gold `.home-v2-readout__corner` L-brackets
  were only hidden on desktop (`--twocol`); mobile leaked them. Hidden
  on mobile → matches the bare desktop title grammar (bare since
  2026-07-03).
- **Compact caption reticle.** Mobile support dropped
  `.home-v2-copy-body` (which was overriding PT-Mono → sans) and is now
  wrapped in a new `.home-v2-readout__caption*` reticle (dashed frame +
  gold corner crosses + coord tag) echoing the desktop `CaptionCard`,
  minus the arm/aperture choreography / glass / meta / rail / pips.
- **Copy spread + sphere enlarged.** Six `mobileStraddleY` offsets
  widened to use the empty portrait bands; new `mobileGyroSphereScale()`
  (1.1 mobile / 1 desktop) enlarges the gyro sphere, applied in the two
  synced places (`BrandmarkAccretionShell` group `setScalar` +
  `getBrandmarkSphereMatchHalfExtent`) so the brandmark keeps filling the
  sphere (ADR-023).
- **Epilogue font.** `.home-v2-mobile-signal__title` was using the
  undefined `--font-source-serif` token (→ Georgia serif + italic);
  repointed to PP Neue Montreal, uppercase, `0.04em`, upright gold `em`
  — matching desktop and the no-italics rule.
- **Alignment sweep ("center everything").** `#about` bio + `#continuum`
  head centred on mobile; `#practice` approach-phase rules centred
  (inert on the current placeholder markup, defensive); `#services`
  cards + `#continuum` spectrum rail kept left (component grammar).

Reverses two explicit Round-1 non-goals (kept L-corners; kept `#about`
left) per owner feedback — noted in the ADR-018 Revision-2 header. Six
touched files: `home-v2.css`, `StationTitle.tsx`, `sceneGeom.ts`,
`BrandmarkAccretionShell.tsx`, `landing.css`, plus the ADR/ledger docs.
lint / typecheck / vitest all green.

### 2026-07-15 — Mobile Landing Quality Pass (ADR-018 addendum)

Owner-driven quality pass to raise the mobile landing to parity with
desktop (Cycle A — multiple linked fixes on a shared surface). Nine
workstreams, all gated on `isMobileComposition()` (~760px) or an
equivalent media query so desktop is byte-identical:

- **Two bug fixes that were the biggest visible issues.** (1) A CSS
  cascade order bug hid the mobile stack-item hide behind the base
  `display: flex` rules, so the SOURCES/SURFACES rails and chips
  rendered on phones and overlapped the BUILD title (visible in every
  Build-park mobile screenshot). Relocated the hide to the late-cascade
  block; joined the Encode cardinal callouts. (2) `StaticStarfield` +
  the two BrandmarkParticleField painters set `uPixelRatio` once at
  mount from raw `window.devicePixelRatio` (~3 on iPhone) while the
  canvas caps at DPR 1.4 / 1.75 — every point rasterised 20–115%
  oversized on mobile, the "thicker starfield competing with the
  compass" complaint. Fixed with a per-frame sync to `state.viewport.dpr`.
- **Missing mobile epilogue.** The whole desktop signal layer
  (`CorridorStationHeaders`) is `display: none` at ≤760px, and the
  world-anchored mobile Build title had no epilogue crossfade — so
  "BUILD ON THE LAYER." persisted through the whole epilogue and mobile
  visitors never saw "EVERYONE IS RACING…" or the "WE HELP YOU BUILD
  YOURS" CTA. Fix: a new `MobileEpilogueSignal` component (fixed layer
  driven by the same `TITLE_IN` / `SIGNAL_OUT` bands) mounted from the
  mobile branch of `CopyAnchors`, paired with a new `gateMobileBuildTitle`
  `onPaint` handler on `intelligence.title` / `intelligence.support`
  that multiplies visibility by `1 - epilogueBand(ep, "BUILD_OUT")` on
  mobile (desktop no-op).
- **Composed Thoughtform layout replaces the two-moment sequence.**
  The retired two-moment beat (copy fades out in Moment 1, brandmark +
  diagram slide in from below in Moment 2) required a full extra
  viewport of scroll before the diagram appeared and left the
  composition disjoint. Now copy sits in the upper third
  (`MOBILE_COPY_ANCHOR_Y = 1.35` on `thoughtform.leftCopy`), brandmark
  - `ThoughtformCompassGate` stay at the gate centre for the whole
    dwell (retired `MOBILE_BRANDMARK_SLIDE_FROM`; `slideY` in
    `ThoughtformMobilePhase` deprecated to always 0), and the diagram
    fades in briefly as an entrance effect then holds. Phase labels
    spread wider (`MOBILE_PHASE_SCALE` 0.7 → 0.92) so NAVIGATE/ENCODE/BUILD
    sit outside the outer ring. `COMPASS_MOBILE_ALPHA_BOOST = 1.5` lifts
    every compass line's final alpha on portrait so the diagram matches
    its desktop presence (previously invisible at portrait FOV + DPR 1.4).
- **Scroll runway.** Mobile corridor stage raised `620svh → 820svh`
  (matching desktop's `EPILOGUE_START = 620/820` split);
  `MOBILE_THOUGHTFORM_END` retuned `0.38 → 0.30` so the Thoughtform
  dwell stays ~2 viewports and the reclaimed ~130svh flows into the
  Navigate→Encode→Build fly. Resolves the "too fast on mobile" scroll.
- **Corridor presence on mobile.** `LatentWormholeWalls` `innerWidth >= 760`
  hard block retired — the walls are the ONLY layer that makes the fly
  read as a corridor, and the tier-governed `STREAK_COUNT_MOBILE = 240`
  was already defined for this path. `SubstrateTopography` stays
  desktop-only pending device perf verification.
- **Starfield spread + local cluster.** `StaticStarfield` spawn volume
  widened from ±25/±15 to ±30/±22 so the field covers the widest
  portrait frustum instead of leaving empty top/bottom edges. Local
  `ThoughtformAtmosphere` cluster dropped mobile point size (6 → 3.4)
  and count (200 → 130) so it reads as depth backdrop over
  `StaticStarfield` rather than a dominant second field. Chevron scroll
  cue removed (nothing to cue toward with copy + diagram sharing the
  frame).
- **Styling parity.** Mobile kicker chip row simplified from
  `sector // callsign · code · metric [status]` to
  `sector // callsign [status]` — the dropped chips were literal
  duplicates that overflowed the mobile container. Mobile Build-park
  case chips upgraded to a 2×2 grid of mini-cards (codename + tagline)
  matching the desktop `ArcCasesCard` grammar; still non-interactive
  per the ADR-033 gate parity rule.

Every change documented in a single ADR-018 addendum at the top of
[sentinel/decisions/018-home-v2-depth-corridor.md](decisions/018-home-v2-depth-corridor.md).
Nine touched files: `home-v2.css`, `sceneGeom.ts`,
`ThoughtformCompassGate.tsx`, `CopyAnchors.tsx`, `StationTitle.tsx`,
`MobileEpilogueSignal.tsx` (new), `StaticStarfield.tsx`,
`ThoughtformAtmosphere.tsx`, `LatentWormholeWalls.tsx`, plus BrandmarkParticleStation / BrandmarkSilhouettePoints DPR fix. Lint clean, TypeScript clean.

### 2026-07-14 — Arc Cases: phased reveal + front-pole sigil (ADR-041)

Owner-driven feature pass on the Build-park cases reveal (Cycle B — new
surface + two superseded ADR-036 sections). Three changes:

- **Phased reveal.** The single damped arm level now drives TWO ordered
  phases: the node fold on `arcFoldInput(level)` (done at `ARC_FOLD_DONE`
  0.62) and the card on `arcCardPresence(level)` (`smootherstep(0.62, 1)`,
  published as `cardPresence` on `arcCasesLevelRef` by the same single
  writer). The card previously read the level LINEARLY while the fold rode a
  smootherstep, so the screen visibly led the nodes it hangs from. Now:
  labels fade → nodes fold and latch → card materializes into the frame they
  made. Strict ordering invariant (`arcCardPresence === 0` while
  `arcFoldInput < 1`) is unit-pinned; the live arm trace shows cardPresence
  exactly 0 for the first ~384 ms while the labels fade 0.66 → 0.
- **The trigger is a cue under the Build title, not a sphere sigil (ADR-042
  supersedes ADR-041 §2).** `ArcCasesTerminalCta` (chip) and `ArcCasesSigil`
  (sphere marker) are BOTH deleted; `ArcCasesCue` is a DOM dotted-leader +
  label docked under the Build station title (the sphere sigil "felt out of
  place"). Its `intelligence.sigil` anchor, `gateSigil`, and `SIGIL_Z` are
  gone. It arms on the SAME settle gate (`sigilSettle`, window **measured
  live** — a first pass at [0.72, 0.96] left the trigger unreachable) and
  keeps the aria/inert/auto-disarm contracts. Because it sits clear of the
  centred card it stays visible + interactive while armed (a 2nd click /
  Escape closes; the stepper ✕ CLOSE also stays), so the ADR-041
  fade-to-0/pointer-events-drop guard is gone.
- **Card face** gains the four capability rows from the retired horizontal
  console card, as a MEASURED fit (full → title-only → skipped) into the
  ~320 px dead band; Heimdall (longest copy) verified collision-free.
- **Deliberately NOT done:** retuning `ARC_BAND_IN` (its "tracks the stack"
  comment is stale drift — the stack moved 0.81/0.93 → 0.875/0.95 and the
  band didn't follow), because the Build park (0.9225) sits BELOW the
  accretion peak (0.95): raising the band would gate the card off entirely.
  Sequencing is enforced on the trigger instead. Recorded in ADR-041.
- **New gotcha (in the ADR + rules):** Playwright `locator.click()` can never
  pass actionability on the sigil — it is re-projected every frame and the
  gyro carries an idle drift, so its box never repeats ("element is not
  stable"). Use `page.mouse.click` at the projected centre (still hit-tested).
- Gate: typecheck clean, ESLint **0 errors / 300 warnings** (baseline
  unchanged), **256 unit tests**, prod build clean, `arc-cases-card-smoke`
  rewritten against the sigil (10 pass), `landing-corridor` + `services-ring`
  52 pass. Driven live at the Build park at 1600×1000.
- **Left for the owner's eye:** sigil size + pulse cadence, the exact
  `ARC_FOLD_DONE` split (how long the nodes hang on an empty frame), and the
  CAP-row type scale.

### 2026-07-14 — Phase 5, round 1 (structural: deletions, CI, math)

- **Deletions** (`fd9abb9`, `21cb068`): the repo's single react-doctor P0
  (`legacy/canvas/ThreeBackground.tsx`, archived `new Function()`) and
  `lib/queries.ts` (legacy page-editor tables, ADR-037) — both
  legacy-only consumers, Phase-1 precedent. Then the NavigationCockpitV2
  cluster: the old scroll-HUD homepage (25 files), its
  `/archive/current-home` route + the `/test` index that mounted it, and
  the orphaned `lib/particle-config-server.ts`; barrel + stale comments +
  CLAUDE.md references fixed. **ESLint 327 → 300 warnings.**
- **CI hardening** (`414f856`): `verify.yml` gains a corridor-smokes job
  (landing-corridor + device-matrix, every PR/push, chromium ×4 viewport
  projects, failure artifacts) and a PR-only react-doctor job scoped to
  NEW issues (`--scope changed`, fetch-depth 0). ADR-040 records the
  deliberately-accepted finding classes (v7-parse html sink,
  long-documented-component style, impure-updater misfires, legacy/
  registry scan-scope caveat) so CI + future audits don't re-litigate.
- **Math consolidation** (`85a96df`, Opus subagent + orchestrator seam
  review): 58 scattered clamp01/clamp/lerp/smoothstep/smootherstep
  definitions → ONE canonical import-free `lib/math.ts`; exporting homes
  re-export (import paths preserved: corridorMap, ringMath,
  particle-geometry, utils, depthGatewayStore, journeyScalars,
  artifactGeom); 15 files' identical local copies swapped to imports;
  **13 behavioral variants deliberately left** (degenerate-edge guards,
  NaN/Infinity-to-0 clamps incl. the test-asserted seamPixelize,
  arg-order and clamped-t variants) — consolidating them would change
  behavior. The journeyScalars three-free seam holds (`lib/math` imports
  nothing).
- **A11y batch** (`5028eea`, Opus subagent + orchestrator diff review):
  react-doctor's mechanical cluster on app/(admin) + components/admin —
  176× `type="button"` (form-submit trap checked per button: the two
  in-scope forms have no bare submit buttons), 38× `aria-label` on
  icon-only controls, 2× keyboard triads on trivial clickable divs.
  Deliberately left: modal backdrops with interactive children,
  drag/canvas surfaces, hover menus, labels needing `useId`
  restructuring, visible-text buttons (aria-label would override).
- Gate per commit: typecheck, ESLint 0 errors, 246 unit tests, prod /
  analyze build (First Load JS unchanged at 72.8 kB gzip), corridor
  36/36; + ring 16/16 + arc-cases 8/8 on the math commit.
- **Still on the Phase-5 board (each wants a fresh, focused session):**
  frame-orchestration pass (rAF read/write phasing + per-layer painter
  dispatch — the remaining perf lever; eyeball-gated), hooks-warning
  burndown (300, semantic not mechanical), anchor change-signal redesign
  (per-frame store contract), card-face mipmaps (eyeball-gated).

### 2026-07-14 — Phase 4 (WebGL/device hardening + the mobile-LCP lever)

- **Quality governor** (`6796253`, ADR-038): the corridor's missing adaptive
  layer. One-shot `WEBGL_debug_renderer_info` probe
  (`lib/webgl/rendererClass.ts`) — software rasterizers route to the static
  fallback via `corridorCapable()`; weak-but-real GPUs open two rungs down.
  Runtime frame governor (`lib/hooks/useQualityTier.ts`): monotonic ladder,
  DPR 1.75→1.25→1.0 then count multiplier 1.0→0.6→0.35, stepping only on
  sustained >24 ms over 1200 ms (1500 ms cooldowns), sampled in
  MotionFollowerDriver's priority −10 useFrame. Heavy painters read counts via
  `useCorridorCount` — byte-identical at multiplier 1. Under automation
  (`navigator.webdriver`) the mount gate keeps 3D and the governor is a no-op,
  so headless SwiftShader smokes stay deterministic. +4 ladder unit tests.
- **Tablet band** (`aad7ed0`): 760–1280 px COARSE-POINTER devices (iPads) now
  get the mobile GPU profile (antialias off, DPR ≤1.4) instead of the desktop
  one; a tablet-width desktop window keeps the desktop profile.
- **Fixed counts tier-gated** (`2d8c50d`): ThoughtformAtmosphere STAR_COUNT
  420 and LatentWormholeWalls STREAK_COUNT 520 were full-count on every tier;
  now per-tier + governor-scaled (desktop unchanged).
- **Per-frame hygiene** (`90c105a`): ThoughtformAtmosphere / GatewayThroat /
  ThoughtformCompassGate drove twinkle/breath/spins off absolute
  `clock.elapsedTime`, which jumps on demand→always re-engage (visible pop on
  scroll re-entry) — each now accumulates a clamped-dt phase advanced only
  while painting. HologramOrbits' per-orbit per-frame `Vector3.clone()`
  replaced with a reused projection scratch.
- **Device-matrix probe** (`5894e73`,
  `tests/visual/corridor-device-matrix-smoke.spec.ts`): report-only FPS + the
  GPU profile actually granted to the canvas across all four viewport
  projects, plus hard assertions that no-WebGL and reduced-motion resolve to
  the static fallback. Confirms the tablet fix live (iPad project: antialias
  false, effective DPR 1.4). 12/12.
- **Mobile-LCP lever** (`8c9aaab`, `ef7e0ad`, ADR-039 — PROTOTYPE, flag OFF):
  CSS first-paint hero reveal behind `html[data-hero-css-reveal]`
  (`?heroReveal=css` / `NEXT_PUBLIC_HERO_CSS_REVEAL`). Opaque first paint +
  transform-only rise (measured: clip/filter can't beat hydration; fades add
  nothing the lab credits). **Premise correction:** real Chrome records the
  H1's LCP entry at first paint even at opacity:0 (292 ms flag-off), so
  "mobile LCP 7.9 s pinned by the [data-m] reveal" was a lantern attribution
  artifact — lantern chains the JS bundle into text-LCP and reports ~9.5 s in
  BOTH flag states. The USER-VISIBLE gate is real (headline missing at 700 ms
  under 4× throttle without the flag, painted with it) — A/B screenshots in
  `assets-staging/hero-reveal-ab/` await Vince's brand-motion call.
- **Deferred → moved to Phase 5 (owner decision, 2026-07-14):** P4 is
  code-complete; the remaining code items are micro-optimizations, not
  adaptivity gaps, and were formally re-scoped to Phase 5:
  - rAF-loop consolidation — the DOM loops carry one-writer ordering
    contracts (e.g. `brandmarkScreenRectRef` write/read ordering between
    the SVG actor and the physics core). Merge with the "~25 useFrame
    painters dispatch regardless of per-layer visibility" lever into ONE
    Phase-5 "frame orchestration" pass (same files, one verification
    cycle).
  - Anchor-array hoists — a fresh array per frame IS the Zustand
    change-detection signal; reuse would freeze connectors. Needs a
    redesigned change signal (version counter), not a mechanical hoist.
  - `generateMipmaps=false` on card faces — desktop-only ~15 MB GPU win;
    orbiting cards minify at depth, so shimmer risk wants an owner eyeball.
  - Services wheel listener: CLOSED without change (verified already
    correctly scoped — preventDefault unreachable unless the ring is
    captured).
- **P4 sign-off still owed (owner, not Phase 5):** real-device pass (iOS
  Safari / Android Chrome / one older Android — the governor shipped on
  SwiftShader evidence); eyeball the scroll re-entry pop removal; decide
  ADR-039 (`?heroReveal=css` entrance — flip default or drop). ADR-037's
  two owner actions remain open independently of any phase.
- Gate per commit: typecheck, ESLint 0 errors / 327 warnings, 246 unit tests,
  `NEXT_DIST_DIR` prod build (First Load JS unchanged at 72.8 kB gzip),
  corridor 36/36 + services-ring 16/16 + arc-cases 8/8 + device-matrix 12/12
  (workers=2). Desktop full-quality path byte-identical throughout; the
  re-entry-pop removal and the flagged hero entrance want owner eyeballs.

### 2026-07-14 — Phase 3b (performance: assets, auth path, payloads)

- **Case screenshots** (`22f5e60`): the four Build-park PNGs
  (2000–2263 px, 3.07 MB) → 1000 px webp q82 (**133 kB, −96%**); dims
  updated in `toolCardData`; HTTP cache warmed at corridor mount so the
  first-arm bake isn't a cold burst. Baked card eyeballed at DPR 1.75 —
  identical (LUT + dot veil dominate).
- **Fonts** (`4bec129`): six brand faces → woff2 (**789 → 321 kB, −59%**),
  woff2-only src (universal since ~2016; OTF/TTF deleted, mondwest stays on
  next/font). The three bake-critical faces are preloaded — kills the
  `waitForCardFonts` 1500 ms bake-with-fallback race.
- **Hero** (`566467d`): explicit dims + `fetchpriority=high` +
  page-level preload for `Gateway_v1b.webp`. The 835 kB asset is NOT
  swapped — candidates for owner review in `assets-staging/hero-candidates/`
  (webp re-encode barely helps; **AVIF q45 = 190 kB**, 2048px webp = 143 kB).
- **Supabase off the anonymous path** (`566cc02`): AuthProvider lazy-inits
  gated on persisted `sb-*` token / URL auth params / a same-tab sign-in
  bridge; UserStatus defers signOut to click. **First Load JS 106.8 →
  72.8 kB gzip** (449.8 at origin, **−84% cumulative**). Verified: anonymous
  → zero supabase chunks/calls (dev + prod build); token → lazy init opens;
  /admin terminal renders; prod /astrogation still walls.
- **Prototype HTML trim** (`74ad0a1`): 107 annotation comments stripped at
  the parse-pipeline tail (source file untouched) — the served landing
  document drops **133.5 → 111.0 kB** (comments shipped twice: SSR + RSC).
- **Deploy hygiene** (`eb508e3`): `.vercelignore` drops ~33 MB of
  lab-only/unreferenced assets (gateway-hero, studio.hdr, showcase/,
  Vince-4.jpg). Kept: `videos/` (the PUBLIC /claude-workshop route ships
  the key visual — caught in verification) and `images/gateway/` (admin
  orrery). Labs verified serving in dev.
- **Mobile chunk defer** (`7d6acc0`): the corridor WebGL chunk gates on
  first scroll/input/idle (2.5 s cap) on ≤960 px viewports — the parse
  burst leaves the hydration window; mount machinery untouched.
- Gate: typecheck, ESLint 0 errors / 327 warnings, 242 unit tests,
  prod build, corridor 36/36 (+ring/arc-cases green; single-project runs
  need bounded workers — WebGL starvation), landing + card + fonts
  eyeballed. Local-lab Lighthouse (noisy machine): desktop 79 / LCP 1.6 s;
  mobile 59 / LCP 7.9 s — mobile LCP remains hydration+reveal-gated
  ([data-m]), the explicit Phase-4 decision item.

### 2026-07-14 — Phase 3 (performance: landing First Load JS)

- **The WebGL stack is out of the landing's initial bundle**: First Load JS
  **449.8 → 106.8 kB gzip (−76%)**, parsed 1553.7 → 330.7 kB. Four seams,
  each its own commit:
  - `98e48cf` — HomeCorridor lazy inside `useCorridorMount`'s nested root
    (React.lazy + Suspense; the sync `.home-corridor-host` wrapper keeps the
    `hasContent` recovery guard satisfied).
  - `da410e8` — BrandmarkParticleCanvas via `next/dynamic` ssr:false (the
    vector actor + dock glyphs are the mark; the canvas is atmosphere).
  - `b3c5681` — journey scalars extracted to the three-free
    `journeyScalars.ts` (intelligenceLayerGeom re-exports; bodies
    byte-identical).
  - `3443801` — `RING_CARD_CTA_BOX` + bake dims to the three-free
    `hologram/ringCtaBox.ts` (one layout constant was dragging
    three/fiber/drei in via ServicesRingHitAreas).
  - `e653950` — services-ring smoke measures the runway AFTER the corridor
    inflates (the lazy chunk widened a pre-existing post-hydration
    inflation window; below-the-fold, no CLS change).
- **Lab mobile (same-day)**: FCP 2.0→1.5 s, Speed Index 5.0→3.0 s,
  LCP 8.2→7.1 s, TTI 12.1→10.8 s (before = prod www / old bundle; after =
  localhost prod build). Remaining initial: supabase-js 34 kB gz,
  gsap 19.2 kB gz, landing DOM.
- **Newly exposed follow-ups (not this phase):** mobile LCP is the hero
  PARAGRAPH at 93% render-delay — the `[data-m]` reveal only fires `.is-in`
  after hydration, so LCP ≈ hydration; a CSS-only first-viewport reveal
  would collapse LCP toward FCP (ADR-scale, touches reveal choreography).
  `Gateway_v1b.webp` is 835 kB (hero visual) — recompress. TBT burst from
  the async three chunk parse — consider idle/first-scroll deferral on the
  mobile tier.
- Gate: typecheck, ESLint 0 errors / 327 warnings, 242 unit tests, prod
  build, corridor 36/36 + ring 16/16 + arc-cases 8/8 smokes, landing
  eyeballed at 6 depths incl. an early-load frame (hero composed at 700 ms,
  no brandmark flash).

### 2026-07-14 — Phase 2 (security + correctness)

- **Interlude (post-Phase-1, Vince-directed):** no-unused-vars zeroed out via
  rule options + underscore aliases (`b077fbf`, 346 → 327 warnings), the two
  remaining showcase dupes dropped (`ebbe433`), and the corridor smoke suite
  made **fully green (36/36)** — the three stale Services tests retired in
  favor of `services-ring-smoke` coverage and the `:102` engagement contract
  reformulated as ON/OFF legs after empirically mapping the band across
  viewports (`c06fef1`, `1d2f967`); the file is serialized against WebGL
  context starvation.
- **BYPASS_AUTH closed** (`885c5fa`): astrogation's hardcoded `true` is now
  `NODE_ENV === "development"` (compile-time-inlined). Verified both ways
  with a Playwright drive: the `.next-verify` production build served on
  :3013 redirects sessionless `/astrogation` to the `/admin` Credential
  Terminal with zero tool nodes mounted; dev keeps the bypass branch.
- **RLS review** (`a7c2718`): ADR-037 documents the trust boundary —
  public reads on landing content are intentional; every
  "any-authenticated-can-write" policy is a gap-if-signups-open;
  `brandmark_presets` anon INSERT is a constrained lab feature; the
  `useTemplates` client write is RLS-safe (`auth.uid() = user_id`).
  Staged (NOT applied): `DRAFT-20260714_tighten_admin_write_policies.sql`
  with an `is_admin()` JWT-email check. Two owner actions pending.
- **Effect cleanup** (`b991a2c`, `3f2a3f4`): CelestialConnector's reveal
  observer now disconnects via React 19 ref cleanup (real leak); the four
  `onCreated` webglcontext listener pairs documented as element-lifetime
  (intentional); useBrandmarkJourney/useRevealMotion verified false
  positives.
- **SSR guards** (`e66c0a7`): ServicesCardRing veil/glow texture bakes
  guard `document`; NavigationCockpitV2 confirmed internal-only (Phase-5
  deletion candidate).
- **Impure state updaters** (`e4f3bd0`): ParticleConfigContext's ten
  update callbacks now schedule the debounced autosave AFTER commit
  instead of inside `setConfig` updaters. The seven flagged production
  components (ServicesStage, HudNav, TerminalReveal, Tree,
  ServicesPlateCluster, IntelligenceArtifactScene, AuthProvider) were
  read individually: none contains a `setState(fn)`-nested side effect —
  the rule's callback-shape heuristic misfires on sibling setStates in
  ordinary event/subscription handlers. Left as-is by design.
- **no-eval P0**: `new Function(code)` in `legacy/canvas/ThreeBackground`
  — archived, unimported, build-excluded; Phase-5 deletion candidate.
- Gate: typecheck, ESLint 0 errors (327 warnings), 242 unit tests,
  production build, corridor smokes 36/36, landing eyeballed at 10 scroll
  depths, bundle unchanged at 449.8 kB gzip.

### 2026-07-14 — Phase 1 (zero-risk hygiene: delete-only + trivial)

- **Orphans deleted** (all verified zero-reference; owner decision: delete
  outright, git history is the archive): the v7 landing twins
  (`LandingV7`/`V7Landing`/`prototypeRuntime`), the traveling-orbits cluster,
  DepthGatewayScene leftovers (`AstrogationField`, `brandmarkCloud`,
  `CorridorSeamPixelField`, `ServicesCardStack`), lib leftovers
  (`useOrbitDrift`, `ParticleSceneContext`, `useScrollMetrics`),
  `LatentTopographyContours` (+ stale docstring fixed), `HandoffOrbitEmbed`,
  `orbitStyles`, `LoginModal` (auth-checked: no dynamic/string imports),
  `constants/` + the legacy-only constants re-export in `lib/types.ts`, and
  `intelligence-layer/_legacy/` (ADR-014, superseded by ADR-016).
- **Dead deps removed:** 3× `@dnd-kit/*`, 5× `@tiptap/*` (only consumer was
  build-excluded `legacy/`); `@types/sharp` moved to devDependencies.
- **Logging:** the 9 API/hook `console.log` sites now route through
  `lib/logger`; stale "terrace" comment fixed (ADR-036); dead
  `buildDepthTicksHtml` alias deleted.
- **Hygiene:** duplicated showcase assets dropped (sha256-identical to
  `public/project-cards/`); 316 untracked root dev screenshots (~116 MB)
  purged from disk (already ignored by the root `/*.png` pattern).
- **Lint:** `@typescript-eslint/no-unused-vars` burned down 128 → 19 across
  59 files; total warnings 470 → 346. The 19 that remain are deliberate
  (rest-sibling prop stripping, uniform fn-family params, exported no-op API)
  and need rule options the config doesn't enable — see the burn-down commit.
- **Gate:** typecheck, ESLint (0 errors), 242 unit tests, production build
  green; corridor smokes byte-identical to the Phase 0 known-red baseline
  (no new reds); landing First Load JS unchanged at 449.8 kB gzip (≤ baseline).
- Commits: `a2ae117`, `f8b8f79`, `206c560`, `c47fb6b` (orphan clusters),
  `d5a23c6` (needs-verification), `7ce66e4` (deps), `aca6f2c` (logging),
  `7ae7474` (hygiene), `c6d79a8` (lint), plus this ledger entry.

### 2026-07-14 — Phase 0 (cleanup plan kickoff)

- **Worktrees pruned:** 6 in-repo + 1 external git worktree removed (~2.6 GB
  freed); 3 merged branches deleted.
- **Guardrail added:** env-gated `NEXT_DIST_DIR` in `next.config.mjs` so
  verification/analyze builds can target `.next-verify` without clobbering a
  running dev server's `.next`. `.next-verify` / `.next-build` added to
  `.gitignore`; matching generated-type globs added to `tsconfig.json` so an
  alternate-distDir build does not auto-rewrite tsconfig. Default behavior is
  byte-identical when the env var is unset; nothing product-visible changed.
- **Baselines captured** in [`baselines/2026-07-14-phase0/`](baselines/2026-07-14-phase0/):
  bundle (landing First Load JS 449.8 kB gzip; three.js core 166.5 kB gzip),
  ESLint (0 errors / 470 warnings), react-doctor 0.7.7 (true post-prune score
  **30/100**, up from the worktree-polluted 13), Playwright smokes (87 pass /
  13 fail / 32 skip), Lighthouse (desktop 99 / mobile 73; mobile LCP 8.2 s).
- **Known-red baseline widened after warm-server verification:** the corridor
  suite reproduces the identical 13 failures against a freshly started,
  pre-warmed dev server, so the reds are not a cold-server artifact. The
  known-red set is the Services-hologram cluster (`:176`/`:203`/`:233` — stale
  tests asserting markup retired by the ADR-029/030/033 Services reworks) plus
  a deterministic iphone-14-only red at `:102`. See
  [`baselines/2026-07-14-phase0/playwright-smokes.md`](baselines/2026-07-14-phase0/playwright-smokes.md).
- Commits: `cca26d7` (guardrail), `489a842` (baselines), and this ledger entry.

---

## Quick links

- Patterns: [BEST-PRACTICES.md](BEST-PRACTICES.md)
- Decisions: [decisions/README.md](decisions/README.md)
- Vocabulary: [LANGUAGE.md](../LANGUAGE.md)
- Root project memory: [CLAUDE.md](../CLAUDE.md)
