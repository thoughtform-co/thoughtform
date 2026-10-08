---
paths:
  - "app/(marketing)/arcs/**"
  - "components/arcs/**"
  - "lib/arcs/**"
  - "scripts/new-arc.mjs"
  - "scripts/new-arc/**"
description: Client arc pages — deck pages on the HUD slice
---

# Rule: Client arcs (/arcs)

An "arc page" is a client landing page (a ported deck) — NOT "the Arc"
(the corridor's Navigate → Encode → Build loop). See LANGUAGE.md.

**Read first**

- [ADR-052: Client arcs](../sentinel/decisions/052-client-arcs.md)
- [ADR-057: Terminal motion](../sentinel/decisions/057-arc-terminal-motion.md) — the pinned-beat grammar on the `-v2` cuts
- [ADR-072: The portfolio arc, and the dossier section kind](../sentinel/decisions/072-portfolio-arc-and-dossier.md) — `/arcs/loop/portfolio`, the ninth kind, the shared evidence, the envelope on arcs
- [ADR-073: The site's header on the arc pages](../sentinel/decisions/073-arc-header.md) — `ArcHudNav` replaces the left reel; `menuPrimary` chapters; the hero's top band
- [ADR-075: The arc hero IS the homepage hero](../sentinel/decisions/075-arc-hero-curtain.md) — the plate, the shared boot, and the curtain seam
- [ADR-076: The portfolio flows, and the architecture closes it](../sentinel/decisions/076-portfolio-flows-and-the-architecture-beat.md) — reveal motion on the portfolio, the curtain on the flowing path, the `intelligence` kind
- [ADR-077: The arcs' ink ramp](../sentinel/decisions/077-arcs-ink-ramp.md) — the colour tokens that let the light theme reach this surface
- [ADR-079: The portfolio is a trajectory, and every beat owns a screen](../sentinel/decisions/079-portfolio-trajectory-and-the-beat.md) — **the live cut**: `rollout` absorbed into the board, `tool-index`, Vesper first, one beat per viewport
- ⚠ [ADR-090: The dossier is one housing](../sentinel/decisions/090-dossier-is-one-housing.md) — **PROPOSED (2026-09-05), shipped and guarded, pending the owner's live read.** The four dossier beats become one machined housing (ADR-089's grammar at page scale): TR+BL chamfer on the plate rung, `--arc-plate` ground, the designation seated in a header band fused to the top edge, a column split the record's rules terminate on, `--arc-seam` .28 dividing regions against `--arc-rule` .12 within one, and the console demoted to a square CELL inside it (ADR-065 rule 4). ⚠ **The record overhung the console by 8.6–88.7px, a different amount per tool** — `align-items: start` aligned the tops and nothing aligned the bottoms. ⚠ **The reveal observer's `-10%` dead band is a real budget constraint** — see §The dossier housing below before touching `--arc-dossier-h`
- ⚠ [ADR-118: The arcs overview is an instrument](../sentinel/decisions/118-the-arcs-overview-is-an-instrument.md) — **PROPOSED (2026-09-21), built and guarded, pending the owner's tick on wave 03.** `/arcs` is the owner's page (ADR-117) and no longer a grid or a sheet: a monitor that plots every engagement at its filing date and a log that opens it. Its contracts live in [`.claude/rules/sheet.md`](sheet.md) §The arcs instrument; what it adds here is the `date` field (§The client model below). ADR-098's "the overview groups by client and filters by kind" survives as each log block's client TITLE, and since U2 the kinds DIVIDE the list rather than filter it. ⚠ **U2 also reads a proposal's `configuration` section** (and the Trinny pitch's board and phases, moved to `lib/arcs/content/trinny-london-offer.ts` with a re-export at the route's old path) to DRAW the client's configuration in the log's dossier: the workstreams at the centre, and what each workstream's own `where` / `runs` sentence names — Claude, Figma, image generation — around it (`lib/arcs/stack.ts`). **An edit to that prose moves a chip on the owner's page**; `sheet-config-fit` pins each proposal's reading and fails by name.
- ⚠ [ADR-098: Clients and the proposal on /arcs](../sentinel/decisions/098-arcs-clients-and-the-proposal.md) — **PROPOSED (2026-09-12), built and guarded, pending the owner's live read.** `client` / `kind` / `theme` on an `ArcDef`, the client page inside the existing route, the overview's groups and filter, the `configuration` kind, and `scripts/new-arc.mjs`. See §The client model below
- ⚠ [ADR-099: The pitch nests under its client, the configuration scrolls in, and the flow is drawn](../sentinel/decisions/099-proposal-nests-and-the-configuration-scrolls-in.md) — **PROPOSED (2026-09-13), built and guarded, pending the owner's live read.** ONE nesting exception (a `ClientDef.pages` record, outside `[slug]`'s one-segment namespace — ADR-098 §2's flat engagements are untouched), a DATUM under every proposal head (format-scoped, so all three proposal arcs take it), and the `flow` kind — ADR-052's third enumerated exception. See §The client model and §One beat per screen below
- ⚠ [ADR-100: The configuration is a board in two states](../sentinel/decisions/100-the-configuration-is-a-board-in-two-states.md) — **PROPOSED (2026-09-13), built and guarded, pending the owner's live read.** The `board` kind — ADR-052's **fourth enumerated exception**: the client's configuration as a circuit board, dormant beside lit, the proof's R4 grammar at page scale, no frame, one leaf with no picker. On the Trinny page it REPLACES the `configuration` beat (`ArcConfiguration` is byte-identical for the registered proposals). See §The client model below
- ⚠ [ADR-139: The workshop's second cut](../sentinel/decisions/139-the-workshop-second-cut.md) — **PROPOSED (2026-09-30), built and guarded, pending the owner's live read.** `/arcs/thoughtform/workshop-v2`, a SECOND own route sharing v1's prototype, route sheet and `.tw-root` (fork all three together or none). `ArcSectionBase.worked` — the page-wide worked-example switch, which touches NO kind: a switched beat is authored once per example as sibling sections and the renderer gathers the contiguous run. The resting state is the markup and the control is absent without JS. **Four kinds, ADR-052's nineteenth to twenty-second exceptions**: `ground` (why it is built here — no vendor named, no digit lettered), `plugin-board` (where the six answers live — every plate carries its `answers` tie, the lit pair is the FIRST two), `skill-file` (a Skill as the file it is — every line quoted from a Skill on disk, never invented) and `chat` (drawn, never screenshotted; the feedback reading shows the issue whole BEFORE the yes). The `bench` is REUSED and is the one beat of the chapter that does not switch. See §One beat per screen below ⚠ **U1 (2026-10-02, owner) adds the `hull` kind, the twenty-third exception**: `agent-shaped`, between the turn and the horizon, Matthew Schwartz's convex hull (a jagged star of roles, a dashed hull round the tips, gold particles in the bays; people are shapes, the agent is particles). Geometry pure in `components/arcs/hull/hullLayout.ts`, the SVG letters nothing, `source` REQUIRED (the workshop clause), every tip a hull vertex (`arc-hull.test.ts`, which caught one that was not). ⚠ **The spectrum is ONE record now** (`shared/toolAndCollaborator.ts`, spread by all four pages that show it and pinned `toBe` in `arcs-registry`); its middle line is Schwartz's turn and the figure carries `source` as a caption.
- ⚠ [ADR-141: The AP Hogeschool lecture is the workshop's third cut](../sentinel/decisions/141-the-ap-hogeschool-lecture.md) — **PROPOSED (2026-10-01), built and guarded, pending the owner's live read.** `/arcs/ap-hogeschool/lecture`, a THIRD own route on ADR-139's share rule (v1's prototype, sheet, `.tw-root`, About flow, portrait deck and proof by import; fork all or none), with a tail for a room of students: show and tell, no hands-on chapter, no `worked` switch anywhere. Sixteen sections in five chapters; the situation minus the ledger, Tom on the Moon's board verbatim, the path · bench · wall · verdict by reference (the registry's `toBe` pin has a third reader), one NEW picture — In The Pocket's nine sector finals on a 3 × 3 wall with 16:9 cells, because `.arc-media__frame img` is `height: auto` and the wall's aspect IS the beat's height — and a takeaway rung, never a room exercise. ⚠ A readout row may not link to the pile (`#services` is not an arc section id). ⚠ `horizon` is deliberately absent: the stages' "drawn, graded, delivered" is answered by the bench and the wall. The wall is written by `scripts/arcs/prep-ap-hogeschool-assets.mjs` (reads the Drive finals only). ⚠ **U1 (2026-10-02, owner: "really smushed together")**: v1's shared route sheet released `#workshop` at (0,2,0) and won only by cascade ORDER; adding `course.css` made the bundler put the route sheet before landing.css, in dev AND production, so the station kept its side padding (every beat ~820px wide at 2000px) and `content-visibility: auto`. The release rule names the station BY ID now (`.tw-root #workshop.station.tw-arc`). **A sheet shared across routes wins on specificity, never on order**. ⚠ **U2 (2026-10-02, owner)**: the Today readout is replaced by v2's opening slide ("Hand it to an agent. Trust what comes back."), now ONE shared record (`shared/handItToAnAgent.ts`, the whole `hero-board` section) read by reference by v2 and this page and pinned `toBe` in `arcs-registry`; v1's opening has a different sub and is not a reader
- ⚠ [ADR-142: Every arc nests under its group](../sentinel/decisions/142-arcs-nest-under-their-group.md) — **PROPOSED (2026-10-03, owner), built and guarded.** Reverses ADR-098 §2: an arc lives at `/arcs/<group>/<leaf>` (its client, or `thoughtform` for a house format; `ArcDef.leaf`), `/arcs/<group>` is the group's listing, every address is derived by `arcHref`, and every flat address 308s from `lib/arcs/legacyRoutes.mjs`. AP Hogeschool is a client (`/arcs/ap-hogeschool/lecture`); the May corridor variant moved to `/arcs/thoughtform/claude-workshop-corridor`, link-only. See §The client model below
- ⚠ [ADR-143: The workshop's third house cut](../sentinel/decisions/143-the-workshop-third-house-cut.md) — **PROPOSED (2026-10-03, owner), built and guarded.** `/arcs/thoughtform/workshop-v3`, a FOURTH own route on ADR-139's share rule and the template the owner's next presentations are cut from: the AP lecture's spine without its worlds (no Tom on the Moon, no nine-sector wall, no six-question board, no student tail). The worked example IS Prompt to Loop, SPLIT by `runs.ts` around an economics chapter that answers its cost slide (`the-money` · `the-economics` · `volume-and-taste` · `the-team`, all the owner's Wispr note in his words), then "Now it's a skill", then Laura's comparison as a `ledger` (the Vesper row the total) and v2's close. ⚠ **Prompt to Loop is ONE RECORD now**: `components/arcs/prompt-to-loop/` (the `slides` prop takes a run; omitted, the whole breakdown) and `public/arcs/prompt-to-loop/`. ⚠ **`arcs-registry` FAILS ANY WORD-FOR-WORD COPY OF A SHARED BEAT** (serialised comparison, readers pinned) — its first run found v1's stages, curve and spectrum, which read the records now. ⚠ A `cards` grid on these pages is FOUR cards with two-line titles and bodies and no kicker, or it runs past one screen at 1280×720. The restructure the owner asked for is the ADR's §Next, not built. ⚠ **U1 (same day, owner): the motion ad answers the real question before the breakdown** (its six-question board, its real `motion-design` SKILL.md from `tensalir/loop-ai-studio` — `skill-file-fidelity` reads it from `LOOP_AI_STUDIO_DIR` or `../loop-ai-studio` — and its evals as a with/without readout, never an invented bench), and the practice follows the proof (v2's horizon, feedback steps and get-started now `shared/workshopPractice.ts`; the motion plugin's board, readout and two chats). Every example-specific beat is suffixed `-motion`: the seam for a `worked` switch by workstream. ⚠ **U2 (same day): the setup is configuration → the two you write (opened up for the ad) → the horizon → the labs' bets → its evals**, the skill file moved after the proof; the four clippings are ONE record (`shared/marketSignal.ts`, v1 · v2 · v3 · class one, pinned) ⚠ **U3 (same day, owner): the intro leads into the workshop, V3 ONLY.** `shared/workshopIntro.ts` is the record (About, captions, the ticker switch, proof ledes, the lit card, the opening's sub; the thesis and the signal line stay the homepage's, owner); four seams, each the identity when nothing is passed: `replaceAboutBio` at parse time (throws on a miss), `corridorText.copy` → `lib/home-v2/corridorCopy.ts` → `CorridorCopyContext` (the homepage gets the map's own objects BY REFERENCE, `corridor-copy.test.ts`), v3's own `WorkshopProof` replacing `card.lede` only, and `WORKSHOP_INTRO.opening` (the registry's readers of `HAND_IT_TO_AN_AGENT` are v2 and AP now). The concise claims and the dark-only lit card are v1's route sheet §5 under `[data-tw-cut="v3"]`, on specificity. ⚠ **U5 (2026-10-04, owner): the era title glitch-morphs into the thesis title, V3 ONLY** (`useWorkshopFlow({ titleMorph: true })`, `flow/seamTitleCarrier.ts`): one leaf per line on a fixed layer in `.stations`, from the era title's own line to the thesis title's on `TITLE_GLIDE` [0.74, 0.96], decoded by the house kernel on `TITLE_DECODE` [0.74, 0.93], the `em` words as marks whose wash rises as they are spelled; `data-tw-title` holds the mast and hides both real titles by `visibility`, so the thesis title is no longer revealed by the square. Measured within 0.01px at the landing. ⚠ On a straight scroll the title at the exit is the LAST era's. ⚠ **U6 (2026-10-04, owner): the intro builds up to the workshop, V3 ONLY** — the hero ("A new kind of intelligence.", a parse-time rewrite in `workshop-v3/hero.ts` that throws on a miss), the thesis paragraphs (spread over `extractV7Text().thoughtform`; the title stays the homepage's), the glyph words (`copy.phaseSubs`: Learn · Write down · Hand over), captions that point at the day's three parts without naming skills, evals or the configuration (06 reveals it), the Build column as the agents the layer runs (`copy.stack`, absent by default so `CopyAnchors` keeps the scene's labels, the anchors' ids never move), the signal "EMBEDDED IN THE WORK / UNTIL THE TEAM IS SELF-SUFFICIENT.", and the cards lettering the client alone (`ProofCard` drops ` · {phase}` on an EMPTY phase; V3 empties it, every record says "Build"). ⚠ The Build column is tight at laptop sizes on EVERY route (the homepage's chips sit on SECTOR/LOCAL at 1470×956): a label there stays within two characters of the homepage's at its row. ⚠ **U7 (2026-10-04, owner): the Thoughtform equilibrium opens the day, V3 ONLY** — a station spliced in after `#hero` at parse time (`workshop-v3/equilibrium.ts`, throws on a miss; an exception to the share rule, recorded: v1, v2 and AP read the prototype untouched, every rule is `.tw-root[data-tw-cut="v3"]` in the route's own `equilibrium.css`), a CURTAIN CHAIN on view timelines (hero z 6 lifts off a held opener z 5, which lifts off a held About; each hold rides its own station's `view-timeline` on `entry 0% entry 100%`), and a REAL three.js object in ADR-080's family (`components/holo-program/equilibriumGeom.ts` pure, `HoloEquilibriumScene`/`HoloEquilibriumCanvas`, `workshop-v3/EquilibriumMount.tsx` by `next/dynamic` only) — ⚠ the first cut on the orthographic stage was refused ("I want actual three js 3D object like holo"). The static drawing is the object projected through the same rest camera (pinned against a real `PerspectiveCamera`), and the words follow the object once live. ⚠ No dropout, no breathing, no aberration, and NO GRAIN ON PAPER (the Noise pass blends by screen and lifted the canvas into a visible rectangle). The signal is his line in the stations' grammar, "EMBED IN THE WORK / TO MAKE THE TEAMS SELF-SUFFICIENT.", gold on the verb. The holo-stage scenes now idle off screen (they invalidated every frame). An `interstitial` takes an optional `clip` (`ArcClipLoop`); V3's `08 · pensieve` carries none until he supplies the footage. ⚠ **U8 (same day, owner: "closer to the holo and the one we had already created … I don't want the sphere and orbit") REDRAWS THE OBJECT ON ONE AXIS, LEFT TO RIGHT**: THOUGHT is holo.ui8's crumpled contour mass in a graduated cradle, its outline drifting live (`fillThoughtSegments`, in place); ENCODE is ADR-080's plated collar in gold on a fulcrum and level bar; FORM is ADR-080's coaxial stack of identical toothed rings at one pitch, receding. Gold is the encode alone (gate ring, its arc, the axis, the motes). ⚠ A ring system round a centre is the refused shape; every ring is coaxial on `x` and the test pins it. ⚠ **U9 (same day, owner: "a river of data … a diorama isolated, super clean, a bit tilted") ADDS A SECOND FIGURE, IN THE LAB ONLY**: `equilibriumRiverGeom.ts` + `HoloRiverScene` (a floating block of contoured terrain, tributaries into one winding river, a gold-sill gate, a ruled plain with four channels out through the cut face, the water the data), one station for both through `equilibriumFigures.ts` (`data-eq-variant`, `EQ_FIGURE_LIVE` = `"instrument"`; promotion is that constant), judged at `/test/equilibrium-lab?v=river`. ⚠ Every river only falls by construction (the relief is held flat along each watercourse) and the test walks it. ⚠ **U10 (same day, owner) PUTS THE BRANDMARK IN THE GOLD GATE, TURNS IT A FULL 360° AND LETTERS IT LIKE holo.ui8**: the volumetric mark plus its crisp outline (`markLines`, from `lib/brandmark/brandmarkPaths.ts`, the one record of the asset's paths); an infinite azimuth with depth as FOG (a baked shade inverts on a half turn; every drei `Line` passes `fog`); each word a corner-bracket TRACKER on a point of the object with a live `KEY · X Y · LOCK` readout (`trackerReadout`) and a bearing callout, placed by the mount clear of every tag and bracket (side, then left, then a lift on a hairline); its own bloom and soft bokeh. ⚠ **U11 (2026-10-05, owner) SETS THE OPENER BARE AND OPENS THE TWO PLATES UP**: the station letters no head (title = `aria-label`); the live canvas is `bare` (transparent, no floor, dust or bokeh, grain and vignette at zero, `BARE_BLOOM_RADIUS` 0.5, a wider edge feather) while the STATION STAYS OPAQUE (a transparent one showed the corridor's parked mark switching on behind the object); the thesis is the homepage's again (no `thesis` in the record); the signal's lines are kept whole (v1's sheet §6); `cards` takes `plates: { tag }` (the board's lit plate at card size, the name as heading); the Pensieve beat is deleted. The Suri lunch-and-learn takes all of it, the opener included since ADR-147 U1.
- ⚠ [ADR-146: How Armada works, the technical companion](../sentinel/decisions/146-the-armada-companion.md) — **PROPOSED (2026-10-04, owner), built and guarded, not pushed.** `/arcs/thoughtform/armada` on the GENERIC route: one piece of work through the machinery, the Loop page "Making Your Agents Reliable" from its chapter five with its order fixed (the board once, the plugin once, install before use, feedback with its triage). ⚠ **A house page carrying Suri's work, by the owner's ruling against ADR-131**: three worked panels (`brief` · `monday-read` · `statics`), people by role only, no other client and no callsign, pinned in `thoughtform-armada.test.ts`. ⚠ **New kind `repository`, the 24th exception**: "made real" as a NESTING (organisation → marketplace → plugins → skills, the repo's files at the foot, the interfaces beneath), every answer tied, all six present, gold only on the context and the evaluations, a ghost never lit, no SVG; `--arc-sec-pad` tight like the framing beats so it fits 1280×720. ⚠ **`[slug]/[leaf]` mounts `ArcWorkedSwitch` when any section carries `worked`** (before, only own routes did). ⚠ `skill-file-fidelity` reads Suri's skills from `SURI_AI_STUDIO_DIR` or `../suri-ai-studio` (new-grammar paths; skipped when absent). ⚠ A `steps` beat on the generic route gets no scroll clock, so every stage renders at once: give it ONE item.
- ⚠ [ADR-147: Suri's two pages, one record](../sentinel/decisions/147-suri-two-pages-one-record.md) — **PROPOSED (2026-10-04, owner), built and guarded, not pushed.** `/arcs/suri/lunch-and-learn`, a client OWN ROUTE on ADR-141's shape that is v3's page with the record swapped (v1's prototype and sheet, `data-tw-cut="v3"`, v3's `hero.ts` / `about.ts` / `WorkshopProof` BY IMPORT, the four `WORKSHOP_INTRO` seams), then Suri's three pieces of work as `worked` tabs and the owner's Halloween loop as the last beat before the close; and `/arcs/suri/configuration` on the generic route, the month as steps. ⚠ **SURI'S BODIES ARE ONE RECORD, `shared/suriWork.ts`** (the three configurations, the repository, the two chats, the dial, the month), read by the Armada companion AND both Suri pages in the `theHorizon(eyebrow)` idiom: a page authors the eyebrow and the menu words, never a body; `arcs-registry` pins every reader `toBe` the body and pins the reader lists. ⚠ **`media.aspect: "portrait"`** stamps `data-media-aspect` and caps the frame's WIDTH from the beat's height (the band's 880px would run a 9:16 loop ~1,560px tall); landscape media is byte-identical. ⚠ **`words` ON THE `syllabus` KIND** letters a page that is not a course (`Step · The steps · What you do · What you end with · Done when · Where`), resolved once in `syllabusWords()`; the row IDS never move, so the gate's wash holds; two glyphs added (`skill`, `plugin`). The kickoff page `/arcs/suri/workshop` stays as the printed handout.
- ⚠ [ADR-148: The Suri setup page, and one frame for the workshop arcs](../sentinel/decisions/148-the-suri-setup-page-and-the-workshop-frame.md) — **PROPOSED (2026-10-06, owner), built and guarded, not pushed.** `/arcs/suri/configuration` is the ONE simplified Suri page, in the owner's order: spectrum · "How should intelligence participate in the work?" · ONE studio board (`SURI_STUDIO_CONFIGURATION`) · skills and evals (cards) · the horizon · three workstreams under the page's one switch · the close; its old beats' records stay in `suriWork.ts` for the Armada companion alone. ⚠ **The `skill-run` kind, ADR-052's twenty-fifth exception**: Prompt to Loop's "How it runs" as data (ask · skill · steps · checks · decide, the evals under the rail), the station names chrome constants (`ArcSkillRun.tsx`), bodies ONE record (`SURI_RUNS`), every figure from `suri-ai-studio/records/eval-log.md`, a case not run saying so. ⚠ **ONE FRAME ON EVERY WORKSHOP ARC** (`arcs.css` §The workshop frame, scoped `.arc-root[data-arc-format="workshop"]`): a 1px ring with ONE top-right notch at `--arc-frame-ch`, no gold wash band on a head, gold only on the one lit object (a `--gold-line` ring over a faint wash, never a solid block); the plain rectangles (`.arc-card-item`, `.arc-syl__sheet`, the worked tabs, Prompt to Loop's stations and evals) take the same ring as a PSEUDO, and only a box with nothing hanging outside it takes a host clip (a clip would cut the chevrons in the gap). The proposals and the portfolio keep their plates (ADR-101 §B). Prompt to Loop's sheet is generated, so its frame lives in `arcs.css`. ⚠ **THE WORKED BAR FLOATS NOW**: it sat at its group's top edge and scrolled away once a panel filled the screen (measured y −31, every page with a switch); the group is a flex column and the bar `order: 1`, so it holds the screen's bottom while any panel is in view, DOM order untouched. ⚠ **U1 (same day, owner: the steps Claude took to make the Loop ad are "the entire point") MOUNTS PROMPT TO LOOP WHOLE** between the horizon and the workstreams, through a thin `prompt-to-loop` kind (a mount, not a grammar: `from`/`to` by slide id, `promptToLoopRun` throws on an unknown id, the section id is the first slide's); the generic route imports `prompt-to-loop.css` (`.ptl`-scoped, inert elsewhere) and the beats after it are numbered past its whole run. ⚠ **U2 (same day, owner)**: the curve and the shared catch follow the spectrum (`theCatch(eyebrow)` / `THE_CATCH_LINE`, one line read by both Suri pages), the configuration's title asks the question ("How intelligence should take part in the work.") and the "participate" interstitial is deleted; ⚠ **EVERY `evenodd` RING CLOSES BOTH OUTLINES** (each repeats its first point): an open ring's connecting edges cross along the left side and fade the 1px edge toward mid-height, which eight rings across the site did until U2 (measured 451 → 72 on one edge); and the workshop heads take the proposals' grammar (two equal columns, the title's measure its column), so titles set on two lines at a laptop where they stacked four. ⚠ **U5 (2026-10-07, owner) PUTS THE CASES ON THEIR OWN BAR**: the breakdown is a worked group (`case`): Prompt to Loop beside Suri's Under the Glass, a `breakdown` kind (ADR-052's twenty-sixth exception, `ArcBreakdown`: Prompt to Loop's slide shell, a hero with the film then one slide per beat, ONE kind of evidence each). ⚠ **THE PICK REACHES EVERY GROUP THAT OFFERS IT**, no longer page-wide: groups that share an id share the whole set (registry-pinned) and follow one choice; a group with its own ids keeps its own. Each bar names its group (`workedLabel`), and a chapter inside a switched beat is its whole group for the readout and the drawer (a hidden panel is never a target). U4's `job` on `skill-run` is deleted. ⚠ **U6 (2026-10-07, owner) ADDS A THIRD CASE, Every Word Stays (`Suri · Email skill`)**: a breakdown's hero may be a `page` (an email) scrolling in the film's 9:16 window, exactly one of `film`/`page`; two more still shapes, `page` (whole, height-bound) and `scroll` (a 9:16 window); caps ten beats, six frames, six figures. ⚠ **U7 (2026-10-08): THE SWITCH DOCKS IN THE FRAME'S TOP BAND from 1101px** (fixed, on the corner readout's line, no ground or box, z 55), shown only while its group crosses the midline (`data-arc-worked-live`, set by `ArcWorkedSwitch`); below 1101px it keeps the bottom. Inside a switched group, Prompt to Loop's slides pad at least `--hud-margin + 64px` so their survey stamps clear it.
- [ADR-008: Landing v7 background layers](../sentinel/decisions/008-landing-v7-background-layers.md) — the compositing rules the arc shell inherits

**Contracts**

- **One scroll writer per page** (`useArcScroll`, ADR-002). It owns
  `--hero-lift` / `--hero-cover` / `--py` / the wordmark dock / the menu
  gate. Never add a second writer, never write corridor channels
  (`--svc-*`, `data-corridor-*`, `data-active-station`).
- **`--hero-lift` gates the rails.** Detail = written from scroll;
  overview = static `1` on the root. Rails invisible ⇒ check this first.
- **THE HEADER IS THE SITE'S, AND IT REPLACED THE REEL** (ADR-073).
  `ArcHudNav` renders the landing's `.hud__nav*` chrome out of landing.css:
  the CHAPTER links inline in the hero, the section readout + a drawer of
  every `menuLabel` once past half the first viewport. ⚠ `ArcMenu` and the
  whole `.arc-menu*` block are DELETED — the reel only rendered above
  1101×760, so at 1280×720 an arc had no navigation at all (ADR-055's own
  ruling, one surface later). Its observer survives as
  `useArcActiveSection` (the sticky STAGE under terminal motion, the
  section under reveal). ⚠ Not `HudNav` itself: that readout reads the
  corridor bus and its links are the landing's stations. ⚠ The readout's
  label is IMPERATIVELY written — render the span EMPTY or `queueScramble`
  sees `from === to` and never decodes.
- **`menuPrimary` marks a CHAPTER** — the inline row, capped at five and
  registry-pinned; the drawer takes every `menuLabel`. Ten inline links do
  not fit a hero. A `-v2` cut shares its v1's sections, so a pair is
  marked once.
- ⚠ **THE ROW IS CHROME OVER A PHOTO.** The arcs' key visual is near-white
  top-right, where the production hero overlay deliberately leaves the
  plate clear — cream links measured 1.06:1 there. `.arc-hero
.hero__video__overlay` carries a top band for it (6.1–7.2:1 measured);
  the portfolio smoke asserts the row lands on no hero INK at the
  reference viewports.
- **Slice API is read-only.** `sliceV7Sections([])` is consumed as-is; no
  edits to `public/prototypes/v7/**` or `lib/v7-parse/**` from this
  surface, and nothing mounts into the injected hud markup.
- **Compositing:** every section opaque void; `.gateway` stays
  display-none'd; the hero card never fades/transforms (only
  `.hero__content` moves).
- **THE HERO IS THE HOMEPAGE'S, AND THE CARD IS THE MOVER** (ADR-075,
  porting ADR-022 v8). It stays `relative; z-index: 4; height: 100vh` and
  scrolls off, while the FIRST beat is held still — `data-arc-entry` on
  `<html>` (written SYNCHRONOUSLY in the scroll handler: it switches a
  layer mode and a rAF's lag shows a gap) fixes that beat's `.arc-plane`
  to the viewport. ⚠ **Freeze the PLANE, never the stage** — the stage is
  the beat's flow height and `useArcTerminalMotion` caches `topDoc` /
  `pinStartY` / `--arc-stage-pin` off it. ⚠ The fixed cell must repeat the
  stage's centred box + `--arc-stage-pad`, use
  `left: 50%; width: 100vw; margin-left: -50vw` (never `inset: 0`), and the
  release query must repeat the freeze's selector `:not([data-arc-tall])`
  INCLUDED — a media query adds no specificity and the first cut's release
  silently lost 0,6,1 against 0,7,1. ⚠ A sticky hero is ADR-022's rejected
  v7 AND would freeze `--py` (the drift comes off a live rect).
- **`hero.plate: "gateway"` DECLARES the landing's key visual** (ADR-075):
  the AVIF/WebP `<picture>`, the theme glitch, and a row in `HERO_ROUTES`
  instead of the route's static preload (a static link can only ever name
  the dark plate). ⚠ Without it the hero is `data-plate="own"` and
  arcs.css hands its image back IN LIGHT — theme.css's swap is global on
  `.hero__bg`, so until ADR-075 every arc showed its own plate in dark and
  the LANDING's in light. ADR-073's top band is scoped to own plates for
  the same reason.
- **The hero BOOTS from `useHeroBoot`** — the landing's own effect, shared.
  Its collector recurses, so a headline's `<em>` decodes too; both shapes
  are pinned in `tests/lib/hero-boot.test.tsx`.
- **THE HERO KEEPS THE HOMEPAGE'S MEASURE** (owner, 2026-09-27: "much more
  concise. That should be a uniform rule"). Every arc, every format: the
  title at most 40 characters as it reads, the lede ONE sentence of at most 120. The homepage sets it (tagline 37, description one sentence of 113).
  Who the page is from and for goes in the eyebrow and the sections, never
  the lede. `HERO_MEASURE` in `lib/arcs/copyLaw.ts`; the registry test
  names every hero that breaks it, and the scaffold starts inside it.
- **THE PORTFOLIO FLOWS; THE `-v2` DECKS ARE PINNED** (ADR-076). `motion`
  is absent on `PORTFOLIO_ARC` — a deck is presented, a portfolio is
  scrolled — and the reveal grammar is the shards pages' own (IO,
  `rootMargin -10%`, one-shot `is-in`, a 0.65s rise). Deleting `motion`
  is the whole change: the dispatch is motion-threaded end to end.
  ⚠ **The curtain rides the flowing path too**: `data-arc-curtain` on
  the root (detail + gateway plate + not terminal) freezes the first
  section's own `> .arc-band`, since there is no `.arc-plane` here. Same
  warnings as ADR-075 — repeat the freeze's selector in the release
  (`:not([data-arc-tall])` included; the pair is the reveal system's
  **900px**), replicate the centred box + `--arc-stage-pad`, and use
  `left: 50%; width: 100vw; margin-left: -50vw`. ⚠ The held band needs
  NO background (the hero covers it, then the section's own void does),
  and `useArcScroll` writes `data-arc-tall` itself here because no
  controller runs. ⚠ Sample the handoff WITHIN A PIXEL of the seam —
  the two boxes agree only at `scrollY = vh`, so a wider sample measures
  your own scroll and reports a jump that is not there.
- **THE COPY LAW ON THE PORTFOLIO** (ADR-078 U1, owner: the earlier set
  "disgusts me… people will hate me for it"). A title is a NAME, not an
  aphorism. Three shapes are banned as DISPLAY TITLES and walked by
  `arcs-registry.test.ts` over every `head.title`: the counting pair
  ("Twenty-two teams, forty-five minutes each"), the reversal epigram
  ("The method is the durable centre. The tools are its proof"), and the
  spelled-out-number opener ("Forty-seven Skills, five shapes of work").
  Where the owner already has a phrase for a thing, THAT phrase is the
  title — "Software for few", "the Intelligence Map", "Adoption that works
  is automation". Subs are one or two short sentences, and there are no
  prose interstitials on this page: the connective tissue is each
  section's own sub. ⚠ **TITLES ONLY** — a dated LOG ROW may state a count
  in the same words, because a record is not a claim.
- ⚠ **ONE BEAT PER SCREEN, AND IT IS THE PADDING (ADR-079).** `.arc-sec` has
  carried `min-height: 100svh; align-content: center` since ADR-052; what broke
  it was its own `clamp(96px, 14vh, 200px)` padding, which takes 201px out of a
  720px beat and pushed a dossier to 786. Padding is `var(--arc-sec-pad, …)` now
  and the portfolio lowers the token. ⚠ **Scoped by `data-arc-format`, NOT by
  motion** — the workshop v1 is also a reveal page and runs past twenty sections.
  ⚠ **A token, never a `padding-block` override**: a format selector outranks the
  per-kind rules that set `padding-block: var(--arc-stage-pad)` and would retune
  them silently. ⚠ The architecture beat LOST ADR-076's "may run past one"
  exemption (it measured 1141 in a 1080 beat); `--arc-intel-h` takes the beat's
  budget as a second term, and its WIDTH rides that height (`max-width` = h ×
  1.2), so an over-tight cap fails the smoke on width while height still passes.
- ⚠ **AND A PROPOSAL HEAD SITS ON A DATUM (ADR-099).** `align-content: center`
  seats a head by HALF ITS BEAT'S BODY HEIGHT, so a head's position is a
  function of what is under it — measured **0.107 → 0.197** of the frame across
  one page's own beats at 1920×1247, which reads as carelessness rather than as
  a rule. `.arc-root[data-arc-format="proposal"] .arc-sec:has(> .arc-band >
.arc-head)` takes `align-content: start` and `padding-block-start:
var(--arc-head-datum)`. ⚠ **AND SINCE U2 (2026-09-14, owner: the heads sat
  "more toward the top"; the reference is a Linear feature section) THE DATUM
  IS SOLVED FROM THE FRAME'S CENTRE**, not borrowed from the homepage masthead:
  `clamp(48px, (100svh − var(--arc-head-composition)) / 2, 360px)` with
  `--arc-head-composition: 600px` on the root — the row where centring a
  C-tall head + margin + body lands its head, C being the page's mean
  composition at his viewport. 60 at 720h (was 77) · 100 at 800h · 240 at
  1080h · 323.5 at 1247h (0.26, was 0.107); the two cross at 763h, so laptops
  barely move and tall frames do. Linear never centres against the viewport —
  its header sits 128px under a CONTENT-HEIGHT section and the figure fills the
  rest — and on a page of viewport-tall frames this is the honest translation:
  one seat for every head (his ruling), placed where it reads centred (his
  ask). ⚠ **C IS COUPLED TO ADR-102**: the scene's plates' feet sat 1.5px
  inside a 720 stage under the old datum, so C ≥ 563 or they overflow at
  1280×720. ⚠ **GATED** to `(min-width: 961px) and (prefers-reduced-motion:
no-preference)`, the exact complement of the format's `min-height` release
  — where a beat is not a frame, the frame's centre means nothing.
  ⚠ **`:has()` IS THE MECHANISM** — only a beat that DRAWS a head takes it, so
  chapter heads, interstitial callouts, the close band and the dossier's
  housed head keep centring, which is what they are composed for.
  ⚠ **FORMAT-SCOPED, so every proposal arc takes it** — Suri, Perfect Ted and
  Hungry Minds with the Trinny page (a fix scoped to one client's page would be
  a rule true on one surface). ⚠ **THE COST MOVED**: the old datum's cost was
  the slack pooling at the FLOOR (air under a record reads as room, air above
  it as a mis-seat; a stranded drawing takes a share of the beat, as
  `.arc-flow`'s `min-height` does, never the head); this one's is that a beat
  sized in `svh` must budget for a datum that GROWS with the frame — the studio
  consoles (`.arc-sheets` / `.arc-films`) take `--arc-head-datum` as a second
  term ON PROPOSAL ROOTS ONLY (a fallback either invalidates the height or
  binds on the portfolio at laptop heights; scoping is what leaves it
  byte-identical), and their head allowance is 148, not the intel's 124, because
  those titles run three lines. Long list beats grow past the frame at 1080h
  (Trinny `how-we-work` +49, `appendix` +34) and the seam marks the next beat.
  ⚠ **THE GUARD ASSERTS THE EQUALITY, AND THEN THE VALUE AGAINST THE RULE** —
  the heads agree with EACH OTHER at three viewports, and `#configuration`'s
  `paddingTop` equals `clamp(48, (innerHeight − C) / 2, 360)` with C read off
  the root, never restated in the test; it catches a mis-resolution (a lost
  gate, a lost `:has()`), not a taste change. ⚠ `.arc-reveal` RESTS
  TRANSLATED, so measure only after `is-in` and the transition, or the rect is
  the animation.
- ⚠ **AND A PROPOSAL HEAD IS TWO EQUAL COLUMNS (ADR-099 U2).** Linear's
  header grammar off its own sheet: `1fr 1fr`, the paragraph left-anchored at
  its column's start. Ours was `1.15fr 1fr` with the paragraph pushed to the
  band's right edge (`justify-self: end`), 153px past the midpoint at 1920.
  `.arc-root[data-arc-format="proposal"] .arc-head--split` takes equal tracks
  and its `.arc-head__intro` stretches (`max-width: none`), so the chrome hung
  off the column's right edge stays on the band's edge and the paragraph takes
  the column (564px = 57ch at 1920; three lines where it was four) — which also
  keeps the scene's centre-out apertures on the column centred on the text.
  The title's measure is its column as well (`max-width: none` in the same
  gate; the 20ch cap resolved to 541 against 564 at 1920 and cost one title
  its second line). ⚠ **THE TITLE BUDGET IS TWO LINES, AND IT IS COPY, NOT A
  CAP** — a three-line title under a shared datum seats its body 48px lower
  and the beat reads "a bit lower" with the heads on one row (owner, 2026-09-15).
  Linear holds its head band constant by budgeting the copy (18ch, the break
  authored as `<br/>`), never by moving the head; a title that needs more than
  its column for two lines is shortened, on the owner's word, never re-capped.
  ⚠ `.arc-head--split` ONLY — a rule on `.arc-head` at (0,3,0) would flatten
  `--solo` and `--center` (0,1,0). ⚠ GATED AT 901px — the sheet's stacking
  rung is (0,1,0) and loses on specificity from any position, so only the gate
  lets it win. ⚠ NOT Linear's `align-self: end`: the two eyebrows hang 34px
  above each column's top and are the shared line.
- **The `tool-index` kind** (ADR-079) = `{ head }` and nothing else — the tools
  chapter head, given the four records it opens (number · codename · `subline` ·
  mode), each row opening its own beat. The renderer resolves `PROJECT_CASES`;
  authoring the lines would be a second, driftable description of four tools the
  page already draws in full. ⚠ Order is `TOOL_ORDER` (**Vesper first** — the
  tool built FOR the creative process before the three built AROUND it), pinned
  against the section list: an index pointing at beats in a different order than
  it lists them is what that constant prevents. ⚠ **Tabs switch a VIEW; the view
  is asymmetric** — rails stay inside consoles (map 2 since ADR-126 · tools 4 ·
  sheets 3 · films 2) and the page's own navigation is the trajectory. Never a page-level
  tab strip (owner: "if everything is in tabs, then it's not gonna work").
- ⚠ **`rollout` IS RETIRED (ADR-079).** It plotted the SAME 2024 → now span the
  board plots, in a second grammar at the far end of the page. Its rows are
  stations, its platform work is the board's `parallel` track, its counts are the
  registers. The casefile keeps `ROLLOUT_ROWS` as the canonical copy, untouched;
  what went is the arc's re-authored second version and the parity pin with it.
- **The `program` kind** (ADR-078 U1, re-cut ADR-079) = `{ head, waypoints,
priors?, parallel?, footnote? }`, ONE per page and FIRST — it is what the
  curtain holds. Each waypoint carries `sub` (its date) and `note` (one sentence
  on what the move WAS: the board named seven dated things and left the arc
  between them to be inferred). ⚠ **The stations ALTERNATE above and below the
  axis and `data-lane` is DERIVED from the index** — seven across the band leave
  ~120px each against a 168px block, so alternating doubles the pitch between
  same-side neighbours; that is what buys each one a date, a name and a note.
  ⚠ **The adoption curve is its own register at the foot**, never a line behind
  the stations (drawn under them it crossed every note). ⚠ **No year scale** —
  every station prints its own date, so a row repeating them was the same fact
  twice AND a collision; the priors run in at the head of the adoption band.
  ⚠ **Gold that is READ takes `--gold-ink`** — the register figures went gold and
  measured 1.68:1 on parchment on raw `--gold`. It
  replaced `flywheel`, which drew adoption and automation as a ratchet:
  ⚠ **a diagram of a METAPHOR, in a house where every instrument draws a
  RECORD.** The dossiers draw real tool interfaces, the map 47 real
  Skills, the sheets real ads. A drawing earns its place here by plotting
  something that HAPPENED; if all it knows is an argument, the argument is
  better as a sentence.
  The board plots the engagement across a dated axis: a graticule, the
  adoption curve as a step ladder, what shipped at its real date as an
  anchor into its own chapter, framed registers, and the seat where both
  arrive. ⚠ **THE GAPS ARE THE READING** — `at` is authored from the
  record and registry-pinned SORTED; spacing waypoints evenly deletes the
  one thing the chart knows that a list does not. ⚠ It letters NO figures
  (the registers read `LOOP_FIGURES` in the renderer) and no digits but
  YEARS. ⚠ It must fit ONE VIEWPORT at 1280×720 or `data-arc-tall`
  disarms the curtain with only one smoke assertion to say so.
  ⚠ **SINCE ADR-080 IT ALSO MOUNTS A WebGL INSTRUMENT** — the same record in
  three dimensions, one coaxial ring per dated waypoint with the RADIUS
  carrying the adoption reach at that date, so the step ladder and the rings
  are ONE encoding. It lives in `.arc-prog__plot`, it is ABSOLUTE so it adds
  zero flow height and cannot move `data-arc-tall`, and it is gated on
  `data-holo`: absent / `"static"` render the flat board VERBATIM, `"live"`
  hides only the un-lettered field. ⚠ Every lettered string stays DOM in BOTH
  modes. ⚠ Arrival + drag ONLY: no idle animation, no wheel capture, no second
  scroll writer. ⚠ Verify HEADED — headless has no GL, so the beat silently
  falls back and the shoot looks fine.
  ⚠ **ADR-080 U3 IS THE LIVE CUT: THE DRAWING TAKES THE BEAT AND THE LABELS
  TRACK THEIR RINGS.** In live mode the header line, the priors/adoption pair,
  the platform track and the six registers LEAVE FLOW and float on the drawing
  (`z-index: 2` — DOM order paints an absolute `hd` UNDER the canvas otherwise;
  all `pointer-events: none`), and the plot is the **`1fr` REMAINDER** of a box
  one viewport less its padding: 331 → 528 at 1280×720, 574 → 941 at 1920×1247.
  ⚠ **A remainder, never a clamp** — it cannot trip `data-arc-tall` at any size,
  which a hand-sized `--pg-h` could. ⚠ **`align-content: stretch` MUST BE
  DECLARED TWICE**: the ADR-076 curtain's base rule declares `center` at (0,4,0)
  and outranks the plain selector (measured: the drawing came out 474 instead of
  941). ⚠ `user-select` widens to the whole panel — the registers stop being
  copyable, knowingly (selection is layout, so `pointer-events: none` does not
  stop a drag painting `--gold-30` plates on them).
  ⚠ **THE LENS IS SOLVED FROM THE CANVAS** (`solveHoloFit`) — three's `fov` is
  VERTICAL and nothing in the folder read the canvas, so the record filled
  23.9 % of the width BY CONSTRUCTION. Fit by the BINDING axis inside gutters
  for the chrome, plus a `setViewOffset` for their asymmetry. ⚠ **Solve the
  LENS, never the distance** (perspective is `distance / object-depth`, and
  `CAM_DISTANCE` is also OrbitControls' min/max). ⚠ **The fit includes the
  mark's plated collar** (r 2.043 vs the widest ring's 1.18) and that costs
  ~40 % of the size, bought so the one closed ring in the object is not cropped
  through its centre. ⚠ **Memoise the `camera` prop** or R3F reverts the solved
  fov on every render.
  ⚠ **`frontnessFromDepth` REPLACED AN EXPRESSION THAT NEVER RAN** — with
  `near 0.1 / far 60` every anchor returned the floor 0.25, always, so the
  label-dimming grammar had never worked. Band the REAL camera distance, never
  `ndc.z`.
  ⚠ **THE LABELS TRACK (`ArcProgramCourse` + `holoLabelLayout`)**, which
  supersedes U2's rejection by a CHANGED PREMISE (spread 377px → ~1200px, and
  the `note` is a hover so a block is two lines). ⚠ The declutter is a
  MECHANISM, not a safety net — two labels genuinely overlap at rest at 1280.
  ⚠ The anchor publishes a RIM NORMAL or the leader stops pointing at anything
  once the object turns. ⚠ Write the WHOLE transform in JS, centring included:
  an inline transform REPLACES the CSS one (the lab's own bug). ⚠ The note is
  `opacity: 0`, never `display: none` — it must stay in the a11y tree and in
  `textContent`.
  ⚠ **AZIMUTH IS CLAMPED to `REST_AZIMUTH ± 18°` = [−72°, −36°]**, chosen on
  ring openness and strictly negative so the dates can never run backwards;
  ±60° reaches +6°, past the axis into both failures at once. `rotateSpeed`
  0.22 — at 0.55 a 500px drag sweeps 187° and slams the clamp.
  ⚠ **AND SINCE ADR-080 U2 THE OBJECT IS FREE: NO FRAME, IN LIVE MODE**
  (owner, twice). The panel's border, chamfer clip, plate ground and every
  internal rule go TRANSPARENT (never `border: 0` — zeroing the widths
  re-flows the beat against its one-viewport budget), `.arc-prog__plot` stops
  clipping, the ruler is `display: none` (7px of FLOW, not an opacity), the
  canvas BLEEDS to the band's border box and `--pg-h` is `clamp(300px, 46svh,
  660px)` — 266 → 331 at 1280×720, 430 → 574 at 1920×1247, and **capped by
  the CURTAIN**: 46svh spends 65 of the 78px of slack the tightest shape has,
  so raising it means re-measuring `data-arc-tall` at all three.
  ⚠ **THE BLEED NEGATES `--instrument-margin` FIRST** — the same three-deep
  chain `.arc-band--instrument` reads. `--band-margin` alone is 120px wider
  per side at 1920 and put a 2152px canvas in a 1914px page.
  ⚠ **A CANVAS THAT DOES NOT PAINT THE PAGE'S GROUND DRAWS A RECTANGLE.**
  `HOLO_DARK.ground` is `--void` and `HOLO_LIGHT.ground` the parchment, pinned
  by `holo-program-geom.test.ts`; the plot declares NO bed and no ink
  literals, so the contrast walk climbs to `.arc-section`'s real ground.
  ⚠ **The vignette was the frame after that** — at full strength it darkened
  the canvas corners 5 units below the page; `vignetteScale` is 0.3 on dark.
  ⚠ **THE READER TURNS IT**, so `.arc-holo[data-live]` takes the pointer
  (never the bare host — an empty transparent host still hit-tests) and
  `.arc-prog__stns` goes `pointer-events: none` with its anchors taking it
  back. ⚠ **`user-select: none` ON THE PLOT** or a drag paints a `--gold-30`
  SELECTION PLATE behind all seven labels.
  ⚠ **THE COURSE STAYS A DATED ROW.** Tracking the stations to the rings' own
  rims (the lab's grammar, and what U1's commit claims the page does) was
  built and measured: seven coaxial rims project into ~500px and seven
  three-line blocks need three times that. It needs leader lines, and its own
  pass.
  ⚠ **ADR-080 U1's CLAIMS WERE LAB-ONLY** — its commit touched
  `components/holo-program/**` and the lab and nothing under
  `components/arcs/**`, so the free object, the drag and the light drawing all
  landed one directory short. The page's smoke runs with **WebGL OFF** by
  design and measures the FALLBACK board, so it cannot see any live-mode
  defect: gate live mode with `scripts/capture-arc-portfolio.mjs --holo` and a
  headed capture, at all three shapes in both themes.
- ⚠ **A HERO IS NEVER A FRAME OUT OF THE PAGE'S OWN EVIDENCE** (ADR-078 U2,
  owner). The portfolio briefly opened on the DJ Neighbour poster, reasoning
  that a Loop page should carry a Loop image. It should — but a poster frame
  is EVIDENCE, and the reel shows it properly further down in a console with
  its own rail; blown up to 100vh it is the work spent as wallpaper, and it
  cheapens the thing the reel is there to sell. The plate is the house key
  visual and the client-specific part of the hero is what it SAYS. A
  client-supplied image at hero grade is welcome; a still lifted out of a
  beat below is not. Smoke-pinned (`no poster frame in the hero`).
- ⚠ **THE CURTAIN IS NOT GATED ON THE PLATE** (ADR-078 U1). It read
  `plate === "gateway"`, so an arc taking its own key visual would have
  silently lost the ADR-076 seam — a choreography coupled to an image. A
  hero declares `curtain: true`; the plate answers only for what is
  painted. ⚠ An own plate also flips five other things: plain `<img>` (no
  `<picture>`), `data-plate="own"`, the ADR-073 top band APPLIES, arcs.css
  keeps the arc's image in light, and the ADR-060 theme glitch unmounts.
  ⚠ **`HERO_ROUTES` IS HAND-WRITTEN, NOT DERIVED** (`lib/theme/heroPreload.ts`)
  — a route that changes its plate must be removed from it by hand, or it
  script-injects a preload for a plate that page never paints.
  ⚠ **The own-plate top scrim is a dark LITERAL**: it sits over a PHOTO and
  theme.css re-pins `--void-deep-rgb` on any `.hero__video__overlay`, which
  washed parchment across the key visual in light (ADR-077's stays-literal
  clause).
- **The `sheets` and `films` kinds** (ADR-078) = `{ head }` and nothing
  else, the `intelligence` kind's contract one directory row across. The
  renderers resolve `LOOP_STUDIO_SHEETS` / `LOOP_ATL_FILMS`
  (`lib/cases/content/loop-earplugs.ts`), the SAME arrays the casefile rows
  carry, pinned `toBe` by `cases-registry.test.ts` — so the studio's imagery
  policy and the reel cannot be edited on one surface alone. Host contract is
  `.arc-intel`'s: `--fl-mono` · `--fl-copy` · `--fl-shot-px`, a definite
  height gated on `(min-width: 981px) and (prefers-reduced-motion:
no-preference)`, the settled gate declared, NEVER `data-proof-settled`.
  ⚠ **The aspect cap is the contract on both** — `--arc-sheets-h` × 1.7 and
  `--arc-films-h` × 1.7 — for the reason ADR-076 records and the films plate
  learned on its own surface: a 16:9 frame in a much wider box resolves to an
  undersized stamp in an empty console, which reads as cropped.
  ⚠ **`SheetsPlate` takes `stillSizes`** (default `"200px"` = the casefile's
  bytes; the arc passes `"320px"`): a `sizes` hint is a statement about the
  BOX. Any OTHER edit to either plate is a TWO-surface change — run
  `services-ring-smoke` AND `arc-portfolio-smoke`.
- **The `intelligence` kind** (ADR-076) = `{ head }` and nothing else,
  ONE per page, at the FOOT (after the dossiers and the outcome, before
  the close — it is the answer to what is underneath the work).
  `ArcIntelligence` mounts `IntelligenceMapPlate` from
  `LOOP_INTELLIGENCE_MAP` (`lib/cases/content/loop-earplugs.ts`), the
  SAME five arrays the casefile row carries, pinned `toBe` by
  `cases-registry.test.ts`. Host contract is `.arc-dossier`'s —
  `--fl-mono`, `--fl-copy`, a definite height, the settled gate declared.
  ⚠ **THE BOX'S ASPECT IS THE CONTRACT**: `max-width` is derived from
  `--arc-intel-h` (×1.2) because `meet` fits by the SMALLER ratio and a
  panel wider than the crop letterboxes horizontally — the band's full
  instrument width gave w/h 2.2 and a third of the panel empty, with a
  height-only fill guard reporting green. Assert BOTH axes and the
  aspect. ⚠ **Never declare `data-proof-settled` on this host**: it is
  half of `PdaConsole`'s wheel gate, and arming it puts a scroll trap in
  the middle of a flowing page.
- **The written 47-Skill roster is the KEYNOTE's** (ADR-076). The
  portfolio's text roster and its five-shapes rows are deleted — the
  console draws the same record. `SOFTWARE_FEW_LINE` is likewise
  keynote-shaped ("the Skills ABOVE"), so the portfolio's tools head
  authors its own sub: share the evidence, author the frame.
- **No STATIC three.js / Supabase / `LandingPage` imports** anywhere under
  `components/arcs/` or `lib/arcs/` (landing-performance doctrine).
  ⚠ **ONE DYNAMIC SEAM IS SANCTIONED (ADR-080)** — `ArcHoloProgramMount`
  reaches `components/holo-program/HoloProgramCanvas` through
  `next/dynamic({ssr:false})`, so the WebGL graph is a lazy chunk and the
  route's First Load JS is unchanged. `tests/lib/arcs-import-doctrine.test.ts`
  is the MECHANICAL half: until ADR-080 this ban was a rule with no
  mechanism, so a stray `import * as THREE` would have passed CI and
  inflated the budget silently. The scene's three-free modules
  (`holoProgramGeom`, `hoverRef`) may be imported statically — that is the
  `journeyScalars` transport pattern, and the guard names them.
  ⚠ **The casefile's dossier LEAVES are the one sanctioned import**
  (ADR-072, extended by ADR-076 and ADR-078): `ToolField`, `MediaLightbox`
  (+ `useWalkthrough`), `console/ConsoleFrame`, `console/ConsoleRail`,
  `wireframes/**`, `toolCardData`, `IntelligenceMapPlate` with `map/pda/**`
  (the architecture beat) and — since ADR-078 — `SheetsPlate` and
  `FilmsPlate` (the studio beats). DOM and SVG only by construction
  (verified per plate: react + next/image + `lib/cases` types + the console
  pair; no three / supabase / stores transitively).
  Never `ServicesCasefile` / `TrackVisual` / the corridor.
  ⚠ **`useCloseOnCasefileFold` NO-OPS OFF THE CASEFILE** — it looks for
  `.services-stage[data-proof-live]`, which no arc writes, so `FilmsPlate`'s
  fold-close simply never arms and the lightbox closes on Escape / backdrop
  / its own scroll lock, exactly as the dossier walkthrough has since
  ADR-072. If an arc ever mounts `films` under TERMINAL motion, the wrapper
  has to thread `useCloseOnArcBeatFold` instead.
- **COLOUR GOES THROUGH THE RAMP, NEVER A LITERAL** (ADR-077).
  `.arc-root` declares `--arc-ink-*` (copy), `--arc-edge` / `--arc-rule` /
  `--arc-rule-dash` (structure), `--arc-grid*` (the dot-matrix),
  `--arc-plate` / `--arc-sheen` (a plate's ground) and `--arc-chip*`, all
  against `--dawn-rgb` / `--void-deep-rgb`, which ADR-058 SWAPS. A literal
  like `rgba(235, 227, 214, .08)` is cream-on-black spelled out and is
  precisely what the flip cannot reach — that is how the portfolio shipped
  cards painting a near-black ground on parchment.
  ⚠ **RE-DERIVE THE ALPHA IN LIGHT, never inherit it**: the same number
  recedes toward BLACK on void and toward PARCHMENT on light, and
  dark-on-light reads weaker at equal alpha (ADR-063 U2; console.css's
  `--con-edge` says it in the same words). The override block at the foot
  of arcs.css is the one place to lift a rung.
  ⚠ **TWO THINGS STAY LITERAL**: `.arc-card__scrim` and the hero's top
  band, because both sit over a PHOTO (ADR-058's kept-dark imagery) and a
  flip would wash parchment across an image — ADR-075's own bug.
  ⚠ The parity walk in `arc-portfolio-smoke` COMPOSITES before measuring
  and asserts the ground flipped; reading `color` alone passes twice on
  the dark theme.
- ⚠ **THE FOUR CORNERS ARE THE LANDING'S (ADR-059 U6).** `ArcRailInstruments`
  owns BOTH working corners — the arc's five chapters top-left, the exit mark ·
  session · theme switch bottom-right with the switch centred on the right
  rail's track. It replaces the standalone `LightModeToggle` on any DETAIL arc
  with a menu; the `/arcs` OVERVIEW keeps the toggle and both brackets, and
  that is the sliver of U2's "the arcs have no row" ruling that survives.
  ⚠ **The roster is DERIVED (`buildArcMarks`), never hard-coded** — the change
  reaches all five arcs. ⚠ **A chapter is a RANGE** (`idxEnd`), so Tools owns
  its four dossiers, and the first chapter opens at 0 so ADR-059's
  one-mark-is-gold invariant holds by construction. ⚠ **Never import
  `clusters.ts` from an arc**: it resolves the landing's roster at MODULE
  EVALUATION and throws, so a renamed landing station would white-screen a
  client's page — share `markState.ts` alone. ⚠ **The switch stays LAST**
  (U3's standing rule) and the controls must render on the FIRST COMMIT, or
  `HeroThemeGlitch` misses `.theme-toggle` and the first toggle loses its
  plate-warm. ⚠ Glyphs are MAPPED, not drawn — five existing keys by position,
  decorative by owner ruling.
- **CSS:** the route's sheet order is `landing.css → casefile.css →
console.css → pda.css → arcs.css → theme.css → rail-instruments.css`
  (ADR-072, ADR-076; theme LAST, ADR-058). ⚠ The instruments sheet sits AFTER
  theme.css, mirroring the landing route exactly — it declares no
  `[data-theme]` rules at all, and theme.css's one instruments rule outranks
  its base on specificity from either position (ADR-059 U6). Everything page-scoped lives in `arcs.css` under `.arc-*`;
  corridor sheets (home-v2.css / services.css) are never imported —
  grammars are copied. ⚠ The casefile's `casefile.css` + `console.css` ARE
  imported, at the ROUTE, ahead of arcs.css (ADR-072): the dossier mounts
  the landing's console and ~1800 lines of wireframe CSS are the drawing,
  not a grammar to copy — and `pda.css` joins them for the architecture
  beat (ADR-076). Never import any of them from a CLIENT component: the
  cascade order would then ride the chunking.
- **The `dossier` kind** (ADR-072) = `{ toolId, legend, head? }`, ONE tool
  per section: `toolId` ∈ `PROJECT_CASES` (registry-pinned, all four in
  order on the portfolio), `legend` EQUALS `MODE_LEGEND[mode]`, `head`
  absent ⇒ derived from the record, `head.sub` never authored. It mounts
  the casefile's bay at page scale; the HOST CONTRACT the casefile used to
  supply lives on `.arc-dossier` in arcs.css — `--fl-mono`, `--fl-copy`,
  `--fl-shot-px`, a DEFINITE console height (`--arc-dossier-h` = 100svh −
  2·`--arc-stage-pad` − 24, floored 440, capped 900), the settled gate
  declared, the blocks' seat animation off. ⚠ **A dossier beat must FIT at
  1280×720 / 1440×800 / 1920×1080** (smoke: `data-arc-tall` absent) — a
  tall two-column beat crops the console at the park; the record column
  is what gives (the BEFORE paragraph goes sr-only under 760h). ⚠ A bay
  change is a TWO-surface change: run `services-ring-smoke` AND
  `arc-portfolio-smoke`; both read `tests/visual/helpers/toolBay.ts`.

## The client model, the filter and the proposal (ADR-098)

- ⚠ **EVERY ARC NESTS UNDER ITS GROUP (ADR-142, owner 2026-10-03), WHICH
  REVERSES ADR-098 §2's FLAT ENGAGEMENTS.** An arc lives at
  `/arcs/<group>/<leaf>`: the group is `arc.client`, or `thoughtform` for a
  house format (`HOUSE_SLUG`); the leaf is the required `ArcDef.leaf`.
  `/arcs/<group>` is the group's own page (`[slug]/page.tsx`, a listing), the
  arc is `[slug]/[leaf]/page.tsx`. ⚠ **THE ADDRESS IS DERIVED**: every link to
  an arc goes through `arcHref` (`lib/arcs/routes.ts`), never
  `` `/arcs/${arc.slug}` ``. The slug stays as the arc's ID (`getArc`,
  element ids, `OWN_ROUTE_SLUGS`) and is no longer the address. ⚠ A `-v2` cut
  that spreads its v1 inherits the v1's leaf and must restate it.
- ⚠ **THE HOUSE IS A GROUP, NEVER A CLIENT.** `THOUGHTFORM_HOUSE` is a
  `ClientDef` outside `CLIENTS`; `GROUPS` adds it for the routes and listings
  only. House arcs carry no `client` and stay house formats on the overview.
  Its listing letters `House formats` and `// House` (a `panel.house` flag,
  never the string) and lists the formats before its one non-arc page, the
  corridor variant at `/arcs/thoughtform/claude-workshop-corridor` (ADR-053's
  page, `/claude-workshop` until ADR-142).
- ⚠ **EVERY OLD ADDRESS FORWARDS, IN ONE HOP.** `lib/arcs/legacyRoutes.mjs`
  (plain `.mjs`, read by `next.config.mjs` as 308s) lists every flat address
  with its page today. Moving an arc again means re-pointing its old rows, not
  chaining. `arcs-routes` pins every address ever handed out to a live page.
  ⚠ `/arcs/ap-hogeschool` is the one old address with no row: it was the
  lecture and is now the school's page, which lists it.
- ⚠ **CLIENT AND ARC IDS STAY DISJOINT** — no longer for the route (an arc is
  two segments deep now) but because the overview and the group pages use both
  as element ids. That is why the lecture's id is `ap-hogeschool-lecture`.
- ⚠ **A GROUP'S FOLDER NEVER RENDERS A PAGE OF ITS OWN.** `thoughtform/`,
  `ap-hogeschool/`, `trinny-london/` hold pages one level down; a `page.tsx`
  at their root would shadow the listing. A nested folder that renders is an
  arc (its id in `[slug]/[leaf]`'s `OWN_ROUTE_SLUGS`) or one of its group's
  `pages` records (the Trinny pitch, the corridor variant), never neither —
  the folder walk in `thoughtform-workshop-v2.test.ts` fails both. ⚠
  **`isLightLockedPath` AND `HERO_ROUTES` ARE EXACT-MATCH**, so a moved route
  earns both rows by hand; both lists are `toEqual`-pinned.
- ⚠ **THE PASSWORD KEY FOLLOWS THE ADDRESS** (ADR-135). A client's proposal
  keeps its key (`/arcs/pandora/proposal` is `PANDORA_PROPOSAL`); a house
  format's gains `THOUGHTFORM_`. Name a new page password after the address.
- **`kind` is DERIVED where it can be** (`kindOf`, `lib/arcs/clients.ts`):
  a workshop is a workshop, a portfolio and a proposal are productions. None
  of the five pre-existing content modules was edited to author a taxonomy it
  already implied, and the `-v2` cuts inherit it through the spread that
  shares their v1's sections. ⚠ **The chip stays `cardChip ?? format`** — two
  productions would print one word twice, and `arc-terminal-smoke` asserts the
  chips distinguish the cards.
- ⚠ **`format` IS THE LAYOUT FAMILY, `kind` IS THE TAXONOMY.** The portfolio
  and a proposal are both productions and share ADR-079's one-beat-per-screen
  budget; a workshop is neither. `data-arc-format` exists for exactly this,
  and collapsing the two fields would retune a twenty-section deck.
- ⚠ **AN ENGAGEMENT CARRIES ITS FILING DATE SINCE ADR-118** — this bullet
  said the opposite (a field that only feeds a sort is a second place for
  one fact to be wrong), and the reversal is on its own terms: `date` feeds
  the overview's monitor, a PLOT, and `arcs-registry` checks each client's
  registry order against it so the two cannot tell two stories. A `-v2` cut
  authors its OWN `date:` line (the spread would inherit v1's), and the
  scaffold takes `--date` (default today, local). OWNER-TO-CONFIRM, like
  `since`: the seeds are each page's first commit.
- **The filter writes ONE attribute** (`data-arc-kind` on `.arc-root`) and the
  narrowing is CSS over SERVER-RENDERED data: every card carries `data-kind`,
  every band the set it holds. ⚠ **No `:has()`** — the band already knows what
  is in it. ⚠ **No attribute means everything is shown**, so the page is whole
  without JS and the resting state is authored. ⚠ **It is site chrome, not a
  ported deck control**, so ADR-052's flattening doctrine does not reach it.
- ⚠ **THE CONTROL LIVES IN THE HERO BAND, NOT IN THE PEEK.** `.arc-index-hero`
  is 86svh on purpose so the grid's edge invites the scroll — but the wordmark
  is FIXED at the viewport's bottom-left, so anything full-width in that band
  lands on it (measured: the row at 648–685 against the lockup at 653–684).
- **The `configuration` kind** = the pitch page's instrument (ADR-094 U7) as
  data: `{ head, owner, layer[], seam, teams[], next?, kickers? }`. It is
  ADR-052's **second enumerated exception** to "new arcs are content-only",
  after ADR-072's dossier — one leaf, one delegated listener on its own root.
  ⚠ **The resting state is AUTHORED** (first tile selected, its rows lit), so
  the drawing reads whole in the static render, with no JS and under reduced
  motion. ⚠ **Its attributes are `data-cfg-*`, NEVER `data-arc-*`** —
  `arc-terminal-markup.test.tsx` asserts a reveal page emits none of the
  latter, and that assertion is what makes "the v1 pages were not touched" a
  property of the code. ⚠ **The grammar is COPIED from `trinny-london.css`,
  never shared** (that route's own rule: one selector reaching both roots is a
  shared sheet by another name), and re-derived on the ADR-077 ramp. ⚠ **The
  picked tile is FILLED** (ADR-089 U4), where the pitch page's is outlined —
  that ruling landed after the pitch shipped and the newer house law wins.
- **The `flow` kind** (ADR-099) = `{ head, brief: { label, fields }, renders:
{ label, images }, scale: { label, markets }, steps: [string, string] }` —
  ADR-052's **third enumerated exception**, after the dossier and the
  configuration. `ArcFlow` draws three hairline plates with two connectors: the
  BRIEF that goes in (its field rows in the wireframes' green), WHAT IT MAKES
  (product renders), EVERY MARKET (the same render in tagged frames). Server,
  no state, no pointer. ⚠ **IT DRAWS A RECORD** (ADR-078 U1) — the fields are a
  real template's and the renders are the client's own products; an arrow-and-box
  picture of an idea is the thing that law forbids. ⚠ **THE SAME RENDER IN EVERY
  MARKET FRAME IS THE CLAIM**: one approved asset, localised. The first cut drew
  placeholder rectangles and said nothing. ⚠ **NO GOLD IN THE DRAWING** — the
  head's `em` has already spent the beat's one gold, and three plates competing
  for the eye is the opposite of "keep it minimalistic". ⚠ **1px DIVS AND A
  BORDER PAIR FOR THE CONNECTORS, never an svg line** (ADR-068 U6: a stroked
  single-axis path reports a zero-height rect and every collapse guard reads
  that as absent). ⚠ The drawing takes a `min-height` share of the beat, which
  is where the head datum's floor slack goes.
- **The `board` kind** (ADR-100) = `{ head, states: [BoardState<"today">,
BoardState<"configured">] }` — ADR-052's **fourth enumerated exception**, after
  the flow. `ArcBoard` (server) draws ONE RECORD — four facts: who owns it,
  the context, the work, the tools — TWICE on one row, no plate around it.
  ⚠ **U2 (2026-09-14, owner) IS THE LIVE DRAWING AND THE TWO SIDES ARE
  DIFFERENT KINDS OF OBJECT**: the dormant side is a ruled LEDGER (four rows,
  a mono key and a sans value, hairlines and nothing else — no housing, no
  cut, no cable, no colour) and the lit side is the BOARD (a green seat over
  its drop, THE CONTEXT left with four tags, the one gold-washed CHIP in the
  middle, WHERE IT RUNS right with four tools as PEERS, three eight-wire
  ribbons meeting the chip's own centre line). U1 drew the left as the right's
  modules greyed out and he read it as one picture at two brightnesses —
  _"it should be a contrast like before and after, but without implying
  they're unorganized"_. A ledger is ordered, complete, and connected to
  nothing. ⚠ **THE LIT CARD IS THE CAPABILITY, NOT A WORKSTREAM** (`AI
  CAPABILITY` / "owned by the team") — they want it in-house, so the board's
  one lit object is that. ⚠ **NO DIAMONDS ANYWHERE** (U2, owner) and **BOTH
  SIDES SHARE THE DATUM AND THE FLOOR** (y 26, y 400), which is what keeps
  them one instrument. ⚠ U1's own ruling stands under it: when he asks for
  simple, the FIRST cut is the minimal one.
  ⚠ **U4 (2026-09-14, owner) PUTS THE DRAWING ON THE TEXT BAND, TAKES THE
  HEAD STRIPS OFF AND HANGS A FIFTH FACT UNDER THE CHIP.** He read the head
  as "a bit more centered versus the other sections" and the two heads are
  PIXEL-IDENTICAL — it was the DRAWING that was out, on the 1440 instrument
  band (240—1680) against a head on the 1200 text band (360—1560), 120px per
  side. ⚠ **AND ONLY ABOVE THE ~1503px CROSSOVER**, where the two bands
  diverge: at 1280×720 and 1440×800 they coincide, so no reference viewport
  could show it. The cost is the meet (chrome 15.7 → 13.1px at 1920, floor
  10). The beat's `--arc-board-gap` override goes with it: it put the
  drawing 45px under the dek where every plate beat's sits 143px under its
  own, which is the other half of the same complaint ("the paragraph on the
  right needs to be a bit higher").
  ⚠ The two head STRIPS and the datum rule under them are deleted (owner:
  "I don't think we need the lines as it runs today with the configuration
  or the dividers") — the head's dek already names the two sides, so they
  were the same sentence twice. `DATUM_Y`/`MARGIN` collapse into `TOP_Y =
  INSET`: ONE 24-unit inset on all four sides, both drawings starting on it
  and ending on the floor. The ledger opens UNRULED now (a hairline at the
  crop's top is a line with no object over it) and still rules every bottom.
  ⚠ **THE FIFTH FACT IS `reach`, ON BOTH SIDES** (`WHERE IT SCALES` · "not
  past the studio" / "into the rest of the business"), drawn as a module the
  seat's own width under the chip on a fourth gold ribbon out of its floor.
  `GAP2 = GAP1`, so the drop IN and the run OUT are both 108 units and the
  board is a CROSS centred on the one lit object. `VB.h` 414 → **548**, the
  ledger's pitch `(FLOOR_Y − TOP_Y) / 5` = 100 exactly.
  ⚠ **THE CHIP ALONE IS TOP-RIGHT-ONLY** (`notch: "tr"`, drawn with the
  kit's `band()` — a housing cut TR and squared at its floor IS the plates'
  silhouette). Lawful by ADR-065 rule 5: a single notch MEANS
  oriented-or-connected, and this is the object four ribbons meet and the
  one that becomes the offer's plates. Every housing around it keeps the
  pair; the corner is pinned from BOTH ends.
  ⚠ **AND THE LEDGER WAS ARRIVING 1-3-2-4.** U3's dormant delays were
  applied in the LIT board's role order, so the rows landed out of reading
  order — and the smoke SORTED the rungs by delay before asserting they
  increase, a walk that can find a dead rung and never a mis-ordered one. It
  reads them in DOM order now: seat 160 · layer 300 · card 440 · tools 580 ·
  reach 720 (1.44s against the board's 0.98s).
  The proof's R4 grammar (ADR-070 U11) copied by hand into
  `components/arcs/board/boardGlyphs.tsx`; the pure modules (`ribbon.ts`,
  `pdaLetters.ts`, `housing`/`band`/`MODULE`) are imported; NO `--pda-*` token
  (they resolve only under `.fl-pda` + `.fl-con`) — every colour is an
  `--arc-board-*` alias of the ADR-077 ramp. ⚠ **SERVER-ONLY** — `ArcBoard`
  draws the whole row; there is no client island (U1 deleted `ArcBoardRow`
  with the `ResizeObserver`). ⚠ **BOTH DISPATCHES**: `ArcSectionRenderer` AND
  the Trinny page's own `TrinnyBeats` switch (which no longer draws
  `configuration`). ⚠ **THE ROW IS WIDTH-LED AND ITS SHARES ARE THE CROPS'**:
  both crops share one height (414) and every share is a fraction of 1400
  (560 + 40 + 800), so `meet` is `W / 1400` on both boards and the head strips
  sit on one datum; the flex bases and the seam are PINNED to the crops by
  `arc-board-fit`, and the svg sits at its own height (`height: auto` — no
  cap, no aspect, no `--arc-board-h`; the beat's slack pools at the floor,
  ADR-099's named cost). The beat pays for its instrument (`--arc-sec-pad`
  and the head's margin tightened on `.arc-sec--board`, `.arc-sec--intel`'s
  precedent; the margin floors at 36px or the head's coord stamp sits on the
  board's datum label at 720h). ⚠ \*\*EVERY DORMANT RULE SITS UNDER `.is-arc-js`
  - `no-preference`**, and the wrapper's `.arc-reveal` rise is overridden —
    no-JS, PRM and terminal render lit, the ladder is the only motion. ⚠ **FIT
    IS DECLARED\*_: `boardGeom` emits every `<text>` with its measure; the vitest
    walks it (fit, the longest word, the floor — 15.3 units paints 11.2px at the
    1022px band —, each letter inside its own object, the lanes wall to wall,
    the label SETS pinned **9 / 16**, and **NO DIGIT on any lettered string** —
    the ledger''''s tools row is COMPOSED at draw time and a string built in a
    renderer is outside every content scanner, ADR-070 U15''''s `8 TEAMS`), and
    the smoke measures the rendered svg (≥ 10px, zero label overlaps, one meet,
    24 wires, zero modules on the ledger and zero rows on the board, the counts
    pinned `[9, 16]`, the crop filling its box) at 1920×1247 and 1280×720. ⚠ `data-board-_`, never `data-arc-\*`; no `transform`ATTRIBUTE and no RESTING transform on any svg element — the overlap walk compares`getBBox`, which is blind to an element's own transform, so two texts are comparable only while every group is at identity; a route may scrub the CSS `transform`PROPERTY on a role`<g>` (`transform-box: fill-box`) provided it is identity whenever a measurement is taken (the Trinny scene's fold, ADR-102, at its clock's zero), never on `<text>`, never the attribute. ⚠ The head stays on
    the TEXT band (the datum guard's x) and the drawing takes the INSTRUMENT
    band. ⚠ Dark is defined by the ramp, unverified until a dark surface adopts
    the kind.
- ⚠ **THE BOARD'S TWO ARRIVAL LADDERS RUN AT DIFFERENT SPEEDS, AND EVERY
  LIT RUNG IS SCOPED `[data-board-state="configured"]`** (ADR-100 U3, owner
  2026-09-14: _"the elements from the studio today should move a bit slower
  into view"_). The board ASSEMBLES — overlapping rungs, one gesture — while
  the ledger is four rows READ IN ORDER at 0.72s and a 140ms stagger, landing
  its last row at 1.30s against the board's 0.92s.
  ⚠ **WITHOUT THE STATE SCOPE THE LIT LADDER IS DEAD.** The rules that START
  the animations (`.is-arc-js .arc-board.is-in .arc-board__in` and `… __wire`)
  are FOUR classes; a bare `.arc-board.is-in [data-board-role="card"]` is two
  classes and an attribute, so the shorthand wins and **`animation:` resets
  `animation-delay` to zero**. It shipped that way in U1: every configured
  module arrived on the same frame, while the dormant rules — carrying a
  second attribute, so they TIE and win on source order — staggered. **A
  delay that does not apply fails silently**: nothing errors, nothing logs,
  the still is identical, and the result reads as a taste decision. The smoke
  asserts each ladder is strictly increasing and that the ledger's is slower.
- **The `steps` kind** (ADR-103) = `{ head, items: [{ id, kicker, name, body,
visual }] }` — ADR-052's **fifth enumerated exception** (dossier ·
  configuration · flow · board · steps). `ArcSteps` (server, no state, no
  listener, `data-steps-*` only) draws the deliverables as a stepped list
  beside a stage: each row an `.arc-plate` with only its head band and a body
  line (the plates' own material — on the Trinny page the phase plates
  collapse to their bands and travel to BECOME these rows, ADR-101 §B's one
  material), each stage that item's drawing. ⚠ **EVERY MOTION CHANNEL IS A
  CUSTOM PROPERTY WITH A FINISHED DEFAULT** (`--tl-row-h`, `--tl-lit`,
  `--tl-vis`, `--scan-s`): the static render, no-JS and reduced motion read
  every row open and filled, every stage shown, the scan complete; a route
  scrubs them (`trinny-london.css`, the writer).
  ⚠ **EVERY STAGE IS ONE INSTRUMENT SINCE ADR-106: THE DIAL** (owner,
  2026-09-15 — the house's diagram language, "the circular things on our
  homepage … behind our brand mark … also in the About section"). The register
  is the About drawing's, ported BY HAND: six concentric rings on an
  alternating dash ladder over ONE OPAQUE DISC, a rim graduated every 15° off
  the cardinals with a longer stub ON each, four radial spokes on the
  diagonals, and two mono designations in the circle's empty TL and BR corners
  (`DiagramLabels`' own shape). The three `visual` kinds are what is SEATED in
  it: `scan` (the generated packshot at the centre — the rings pass BEHIND the
  subject, as the About portrait's do — read by a gold edge that sweeps the
  whole instrument and parks as the verdict's rule, the grading gates' checks
  called out as it passes their anchor), `loop` (THE RUN: four stations on one
  lit run, **a filled node the team's hand and an open one the model** — `by`
  IS the whole reading, and the registry pins at least one of each while the
  smoke pins the fill from BOTH ends), `handover` (THE ARC THAT ENDS: a closed
  inner circle beside a short outer arc terminating at a capped node, the track
  past it drawn BARE — an arc that stops in empty space reads as a rendering
  fault). `field` is DELETED with the rectangular frame it held.
  ⚠ **THE GRAMMAR IS COPIED, NEVER IMPORTED** (ADR-100's precedent):
  `CelestialConnector` / `DiagramSvg` / `shapes/**` are not on the sanctioned
  cross-tree list, they letter in `--dawn-*` and raw `--gold`, and they carry a
  `transform` on every tick; `@/lib/celestial` drags Supabase in through its
  barrel (`@/lib/celestial/orbits` alone is pure). And `PhaseGlyphSvg` is NOT
  reused though it is a ready-made three — those glyphs MEAN Navigate / Encode
  / Build, and a silhouette on this site is a proper noun.
  ⚠ **THE SVG LETTERS NOTHING** — `dialLayout.ts` is pure and emits every
  label's SEAT as a fraction of the crop; the strings are DOM, on their own
  opaque beds. ADR-100's declared-`measure` ladder is therefore deliberately
  absent: it answers a problem SVG `<text>` has and this drawing does not.
  ⚠ **A DRAW-ON RUN MAY NOT TAKE `vector-effect: non-scaling-stroke`** (the
  browser then ignores `pathLength` and the draw breaks into partial arcs); the
  STATIC line work does, so a hairline is one device pixel at every size. A
  dotted ring cannot draw on at all and this beat may not fade, so it is
  revealed by a clip. The closed circle is an explicit TWO-ARC PATH starting at
  twelve o'clock, never a `<circle>` (whose draw-on starts at three o'clock,
  movable only by a rotate this drawing may not carry). NO SPIN — the About
  drawing's three rotating orbit groups are what this beat's law forbids.
  ⚠ **A LABEL'S BOX IS THE FIGURE'S, NOT THE DIAL'S.** The callouts are
  SIBLINGS of `.arc-dial__field`: nested inside it, `right: 0` resolves against
  the drawing and every label's tail runs off the end of it, clipped by a box
  no gate measures. The row spans node → figure's right edge and the LEADER
  takes the slack — never a hand computation off the dial's width.
  ⚠ **AND A CENTRED WORD NEEDS A CONTENT-WIDTH BOX.** The hub was full-width
  with `text-align: center`, and the two side stations sit on exactly that row
  — the overlap walk read `MAKE` as printing through `THE STUDIO` while nothing
  on screen touched. **A box is what a guard measures.**
  ⚠ Copy: `self-sufficient` is banned by the copy law, and `trinny-offer`
  pins that no row restates a phase's name or deliverable line — the owner:
  "not a simulacrum of those three modules". Rules for the scene it lives in:
  `.claude/rules/trinny-london.md` §The head decodes.
- ⚠ **THE WORKSHOP FRAMES THE LOOP BEFORE IT SHOWS IT (ADR-130, Proposed
  2026-09-27).** `/arcs/plopsa/workshop` opens on two panels and Moira's
  argument in the house's drawings. **`list-groups` `layout: "readout"`** is two
  notched plates of READOUT ROWS (key framed and filled, value framed and set
  right), an item's in-page `href` making the row a link to that beat; a layout,
  not a kind, and no prose inside a panel (the registry pins both). **Four
  kinds, ADR-052's eighth to eleventh exceptions**: `stages` (three R4 housings
  on a graticule, width = how long without you, height = how much of the work;
  classes `arc-floor*` because `arc-stage` is a banned substring in reveal
  markup), `curve` (the program board's step ladder, a riser every seven months,
  the seat at NOW the one gold), `horizon` (Moira's two tracks copied by hand, a
  FILLED node a person's hand and an OPEN one the model), `questions` (the work at
  the centre on the TR notch, six TR + BL plates, eight-wire ribbons; gold is what
  the team writes, green the owner; NOT a third `board` mode, which would branch
  `arc-board-fit`). Geometry is pure in `components/arcs/framing/*Layout.ts`;
  the SVG letters nothing, DOM labels ride `--ax`/`--at` over a stage that holds
  its crop's aspect; no `transform` on any SVG node. ⚠ **THE WORKSHOP CLAUSE**:
  ADR-078 U1 still binds proposals and portfolios; a workshop may draw an
  ARGUMENT provided the figure names its source or its own record in its words.
  ⚠ **EVERY FRAMING BEAT PAYS OUT OF ITS OWN AIR** (per-beat classes; the
  workshop format is shared by three pages), the first beat on the STAGE token
  (`--arc-stage-pad`, the curtain's), and the heads on
  `clamp(28px, 18vh − 100px, 112px)` so no eyebrow runs through the client
  mark's hairline at 1280×720. ⚠ Plopsa's `configuration` beat is gone, and
  since ADR-130 U3 the `/arcs` dossier reads the `questions` beat instead
  (`configurationFromQuestions`): ONE row, the work's name (its `line` is a
  sentence and overran the die's one-line note), and the stack items the six
  ANSWERS name. **An edit to an answer moves a chip on the owner's page**, and
  `sheet-config-fit` pins it; an arc carries a picker OR a board, never both.
  ⚠ **U1 (2026-09-27, owner: the instruments "look boring af"; the panels are
  "glorified powerpoint panels") REDRAWS ALL FOUR IN THE BRANDWORLD'S ISOMETRIC
  REGISTER, REVERSING DECISION 3'S OWN RULING** — wireframe machines on a ruled
  grid plane, 1980s vector-display grammar. **`components/arcs/framing/iso.ts`
  is the ONE projection under `components/arcs`** (pure, zero-import): a CABINET
  oblique, because under the map's 2:1 a depth of `d` costs `0.5·d` of HEIGHT
  and no `svh`-capped beat can pay it; `ISO_BASIS_2TO1` is kept byte-equal to
  `mapProjection.iso()` and pinned, COPIED never imported (ADR-106). ⚠ **NO
  LABEL EVER SITS ON AN AXONOMETRIC FACE** — the map city's plaques printed
  through their own plates 10–13 times a sheet with every guard green
  (`.claude/rules/proof.md` §The BOARD archetype) — so each layout exports
  `…Labels()`, the renderer seats DOM spans from exactly that list with a
  one-elbow leader, and `tests/lib/arc-iso.test.ts` walks every PAIR (with a
  negative case: a guard that has never failed is a guard nobody has checked).
  ⚠ **PAINT ORDER IS DEPTH ORDER** (`isoDepth` ascending; SVG has no z-buffer)
  and hidden edges are DASHED — exactly the three meeting the far-bottom vertex.
  ⚠ **A CHAMFER ON A PROJECTED FACE CUTS THE SCREEN'S DIAGONAL, NOT THE
  WORLD'S**: under this basis screen x rises with both axes, so the lawful
  TR + BL pair is `(a+w, b+d)` and `(a, b)`. ⚠ **STATIC LINE WORK TAKES
  `vector-effect`, A DRAW-ON RUN MAY NOT**, and a DASHED run cannot draw on at
  all (its dash array is the channel) — exclude it in the SELECTOR, since the
  draw-on block is declared last and ties on specificity. ⚠ **A WIDTH-BOUND
  DRAWING'S CROP HEIGHT IS PURE LETTERBOX**: trimming it deletes dead band and
  does NOT shrink the drawing; only the column's share does. ⚠ **`exploded` is a
  FIELD on the `readout` layout** (`ArcStackLayer`, 3–5, ≤1 dashed, label ≤16,
  note ≤40, digit-free) — one template drawn between the two panels, the base
  plate the one gold object; ⚠ **every child of its three-column grid declares
  its `grid-row`**, because auto-placement is SPARSE and a figure naming only
  its column lands on a second row, which turned the beat tall and disarmed the
  curtain with nothing failing. ⚠ **THE CLIENT MARK HAS TWO SEATS**: at rest the
  wordmark's own left edge (`--hud-content-inset`), docked at `--hud-margin`,
  keyed on `.arc-root:not(:has(.hud__brand.is-collapsed))` — the wordmark's 0.5vh
  flip, NEVER `data-arc-scrolled` (1vh), so the two move on one frame; scoped to
  `min-width: 961px` and guarded by `tests/lib/arc-hud-client-seats.test.ts`.
  Grammar: [`.claude/skills/thoughtform-design/references/isometric-wireframe-grammar.md`](../skills/thoughtform-design/references/isometric-wireframe-grammar.md).
  ⚠ **U2 (2026-09-27, owner: the drawings "feel very flat … you didn't use any
  of our particle systems, none of the 3D visualizations"; the copy is "AI
  slop … even in Dutch") MAKES ALL FOUR LIVE AND REWRITES THE PAGE.** The SVG
  above becomes the FALLBACK it was always meant to be — `data-holo` absent /
  `"static"` / `"live"` on ADR-080's tri-state, with the printed handout on the
  fallback by design (`pdf-arc.mjs` is headless). **`components/holo-stage/` is
  the SECOND sanctioned dynamic three seam**, and the doctrine test pins both
  leaves by name while closing the hole ADR-080 U3 left open: a STATIC import
  of any three-full holo module under `components/arcs/**` now fails.
  ⚠ **ONE SHELL, FOUR SCENES — the drawing is DATA** (`HoloStageSpec`: world
  polylines, translucent faces, seeded motes, label anchors), because ADR-080's
  component-per-object let its lab and its page drift into two compositions
  with every guard green. ⚠ **THE LIVE POSE REPRODUCES THE STATIC BASIS**
  (azimuth 30°, elevation 24° ⇒ a (0.866, −0.203) · b (0.5, 0.352) · z
  (0, 0.914) against cabinet's (1,0) · (0.433,0.25) · (0,1)) — close, NOT
  identical, and the guard says so; `b` maps to three's **−z** or the record
  draws back to front with nothing failing. ⚠ **A PER-CANVAS ANCHOR CHANNEL** —
  `holoAnchorsRef` is a module singleton and this page mounts four.
  ⚠ **NO BLEED ON THESE FOUR**: the shared `.arc-holo[data-live]` negates the
  instrument margin for a full-width object, and three of these beats are a
  drawing BESIDE their record, where an opaque canvas does not overlap a plate
  but ERASES it (150px measured). ⚠ **THE FIGURE GROWS ONLY UNTIL THE HEAD
  WOULD LOSE ITS SEAT** — U3's `1fr` remainder was built and rejected here, the
  beat being `align-content: center`: a band that fills leaves centring no
  slack and the head lands on the padding (y 207 → 43, its mark to y 8, through
  the HUD row). ⚠ **THE LABEL'S WIDTH IS WRITTEN FROM THE SOLVER'S METRIC** and
  **the drop pass measures `getBoundingClientRect()`**, not `blockH` — the
  model-of-the-drawing defect, a fourth time. ⚠ **TEST LIGHT THROUGH THE
  SWITCH, NEVER `data-theme`** (ADR-093): the painters read the STORE.
  ⚠ **AND THE COPY LAW GREW A DUTCH HALF**: ADR-078 U1's title regexes are
  English and walk the portfolio alone, so eight counting pairs shipped on this
  page. `arcs-registry` walks the Dutch arcs by SLUG against a DE-ACCENTED
  skeleton — ⚠ its own first cut missed "Eén", whose capital `E` no case-fold
  of `é` reaches. Two claims that overstated the record were corrected with it
  (the 28 checks are in ENGLISH; both Live picks are `unstable`, quorum 2).
  Grammar: [`hologram-stage-grammar.md`](../skills/thoughtform-design/references/hologram-stage-grammar.md).
  ⚠ **U4 (2026-09-28, owner) SUPERSEDES U1's CABINET AND U2's PERSPECTIVE
  POSE ON THESE BEATS**: one parallel projection (`ISO_BASIS_STAGE`, Moira's
  22-degree view from the floor's front corner), an orthographic camera that
  frames the SVG's own crop (`stageFrustum`, the canvas mounted in the stage
  box, the fallback's DOM words kept, no `ArcHoloLabels`), no drag, opaque
  shaded faces, crops derived by `framing/floor.ts` `frameAround`, and
  `holo-stage-geom` walking every spec point into its crop — the guard U2's
  clamped lens never had (its agent block ran 85px off the canvas at
  1920x1247). The three drawings share one floor and one time edge; the curve
  is a staircase, the horizon two lanes on the floor. `vandaag` lost its
  exploded stack and is three rows and four links.
  ⚠ **U5 (2026-09-28, owner) REPLACES THE CURVE AND THE HORIZON WITH THE
  MOIRA WORKSHOP'S OWN FIGURES** ("use that graph and copy the
  functionalities"): `ArcCurve` is her frontier chart (lanes, models, list
  prices, the step band, the effort surface) with `ArcCurveSteps` (two
  buttons, `data-step` 0 → 2, drops to the front edge on first view), on
  `framing/curveSurface.ts`; `ArcHorizon` is her two tracks. Copied, never
  imported; house colours (gold lanes, the frontier filled, the other vendor
  dawn, people green). The live stage serves the stages beat alone. On a frame
  under 960px tall the curve's caption goes BESIDE the stage, or the stage
  falls to 532px at 1280x720 and the head runs through the client mark.
  ⚠ **NEVER "plaat" / "platen" IN DUTCH COPY** (owner): "beeld" / "beelden".
  ⚠ **[ADR-140](../../sentinel/decisions/140-the-workshops-three-figures-are-holograms.md)
  (2026-10-01, owner, Proposed) MAKES ALL THREE FIGURES LIVE ON THE ONE
  STAGE, REVERSING U5's "the live stage serves the stages beat alone"** — on
  U4's terms, every one of them kept (one parallel projection, the camera
  frames the SVG's own crop, no drag, the DOM words untouched, opaque shaded
  faces on the dark blocks). The curve is a LIFT (`curveGeom.ts` reads
  `curveSurface.world()` — Moira's floor IS `ISO_BASIS_STAGE` at `k = 1`; the
  identity is pinned to the unit), its second dial a REVEAL GROUP driven off
  the figure's own `data-step`; the spectrum is a FLAT particle field measured
  off the band boxes (a lattice dissolving into a cloud — software is
  deterministic, intelligence is probabilistic), never an isometric strip
  under a horizontal rail; the stages are wire volumes drawn on by one gold
  SWEEP, the agent a translucent gold volume filled with a seeded cloud.
  `stageBatch.ts` is one instanced draw for the dense structure (the P(doom) /
  Evangelion engine's `lines.ts`, copied by hand, MIT; ⚠ depth-TESTED or the
  dark blocks go X-ray), `HoloScanline.ts` a three-px scanline pass at 0.08 on
  dark and ZERO on paper. ⚠ **THREE ONE-UNIT RECTANGLES IN LIGHT, ALL
  MEASURED**: the bloom threshold sits ABOVE the paper's luminance (0.97; at
  0.62 the ground bloomed `237` on `236`), the vignette is zero on paper, and
  the canvas paints the PAGE's ground read off the host's first opaque
  ancestor. The live layer is on wherever the kind renders (the SVG fallback
  is byte-identical on v1, Plopsa and the class-one deck). Guards:
  `holo-stage-geom` (three specs, both identities, groups named, one donor on
  the stages and the curve and NONE on the spectrum — its gold is the DOM
  handle), `arc-iso` (the v2 row, which was missing), `arcs-import-doctrine`
  (`curveGeom` / `spectrumGeom` on the pure list; the two leaves unchanged).
  Shoot HEADED with `scripts/capture-workshop-holo.mjs`; look-dev at
  `/test/workshop-holo-lab` (`data-holo-dials` on a wrapper; every default is
  the page's). Grammar: [`hologram-stage-grammar.md`](../skills/thoughtform-design/references/hologram-stage-grammar.md)
  §The material since ADR-140.
- ⚠ **THE WORKSHOP IS A HOUSE ARC AND THE CLIENT PAGES ARE CUTS OF IT
  (ADR-131, Proposed 2026-09-28, owner).** `/arcs/thoughtform/workshop-v1` carries
  no `client` — ADR-052's own reading of that field — and leads the house block.
  Five chapters (the registry CAP exactly, so the first fork wanting a sixth
  fails loudly), fifteen beats, four figures each in its own beat: `stages`,
  `curve`, `horizon` (ADR-130) and `bench` (ADR-128). No `questions` board, so
  `sheet-config-fit`'s pinned list does not move. ⚠ **THE LAW IS THE PRACTICE'S
  OWN, PUBLISHED** (`practice-snapshot`'s evals workshop shell): one idea per
  section, ONE picture per section, a picture-less section is a BEAT, one screen
  at 1280x720, seven to sixteen sections — and **a sentence that does not fit is
  a sentence to CUT, never a column to widen**. ⚠ **SELF-SUFFICIENCY IS THE
  CHAPTER HEAD'S CLAIM, NEVER A CARD'S**: the four `proof-card` beats are the
  four MOVES, the `studio` card is retitled through `title` to what its pictures
  show, and the homepage record is UNTOUCHED. ⚠ **THE BENCH'S EXAMPLE IS TEXT**
  — the image branch's only on-disk pictures are a client's, and the base every
  fork starts from may not carry another client's evidence. ⚠ **EVERY SHIPPED
  WORKSHOP OVERFLOWS ONE SCREEN AT 1280x720 AND NOTHING MEASURES IT** (claude 16
  beats to +1075, plopsa 6 to +225, this one 3 to +65): the flat kinds carry
  `--arc-sec-pad` at 100.8px a side there, 28 % of the viewport, where a framing
  beat overrides it out of its own class — so the overflow is the FORMAT'S air,
  not the copy, and no rule was written because `cards`/`list-groups` have no
  beat class and the token is shared with three byte-identical pages.
  ⚠ **`--arc-bench-h` DOES NOT BIND** (floor 470, content 561): a lever that is
  not the binding constraint is not a fix. ⚠ **MARKS MAY NOT NEST** — a `voice`
  span containing a `hype` span put two highlights on one phrase with every
  guard green (the registry checks only that a span occurs in the text); found
  by LOOKING. ⚠ **A NEW FILING BUMPS `REAL_TODAY`** in both `sheet-instrument`
  and `sheet-composition`, or the monitor reports "filed after now".
  ⚠ **`arc-iso`'s LABEL WALK IS PER PAGE** — the geometry is fixed but a label's
  box is its TEXT, so a second page mounting the same drawing needs its own row.
  ⚠ **THE DEV SERVER CACHES `generateStaticParams`**: a correctly registered
  route 404s until it restarts.
  ⚠ **U1 (same day, owner) — THE BUILD CHAPTER IS THE PRACTICALS.** A
  `readout` sets up once (app, plugin, keys, IT's network egress — the blocker
  the Plopsa morning hit) and indexes five `anatomy` rungs: one image, a brief,
  formats and layers, motion, make it a skill. ⚠ **Every rung is the same four
  rows in the same order** (Drop in · Ask · You get · The check), so a fork
  swaps words, never shape. `what-you-build` lost its chapter slot to it; the
  page is 22 sections against the shell's 16, each half inside it.
- ⚠ **THE WORKSHOP OPENS ON THE CORRIDOR (ADR-137, Proposed 2026-09-29).**
  `/arcs/thoughtform/workshop-v1` is a STATIC FOLDER under `/arcs` (the third fork
  of ADR-053's recipe): hero → about → the eras (ADR-138) → corridor → the homepage's proof stack in
  `#services` (ring off) → the arc's sections in `#workshop` → contact.
  `[slug]/[leaf]`'s `generateStaticParams` filters the slug (`OWN_ROUTE_SLUGS`); the
  `ArcDef` stays in `ARCS`. The tail renders through `ArcSectionRenderer`,
  reached only through `lazy()`. ⚠ The station is `content-visibility:
visible` or the document grows ~12,400px on arrival. The opening slide is the
  `hero-board` kind, Moira's `BoardMini` copied by hand onto the ramp; its lit
  set is one side and adjacent (registry-pinned), its title two short sentences.
  ⚠ **U1: the hero lifts over a HELD `#about`** (the Trinny route's rule 3a,
  copied as the route sheet's rule 1a, never shared): a scroll-driven hold on
  `#about`'s children, not the station, behind `@supports`, capable rung only.
  ⚠ The GROUND is held too, or it slides up under a still bio.
  ⚠ **U2 AND U3 ARE SUPERSEDED BY [ADR-138](../sentinel/decisions/138-the-workshop-reads-about-the-eras-then-the-arc.md)
  (2026-09-30, owner): the flip, the brandmark on the card's back, the thesis
  decoded from the bio, the orbit morphed into the gate, `about-turn/**`,
  `TurnMark`and`compassGateScreenRef` are all DELETED.** The page reads
  hero → about → **the eras** (`#voidwalker`, the homepage's own station,
  mounted by `VoidwalkerPortal`) → the corridor. One writer,
  `flow/useWorkshopFlow.ts`, on the pure clock `flow/flowClock.ts`:
  - **About → the eras is the homepage's handoff, in the DOM.** The About stage
    keeps U2's runway (`--tw-about-dwell` 50svh + `--tw-about-run` 100svh); the
    era welds itself `-120svh` over it, so it pins at the About's `u` 0.8. The
    copy leaves on leaves, the deck squares up (`--tw-deck-fan`), the card flies
    to `aboutVoidwalkerHandoffRef.portraitSeat` on `translate` / `scale` (never
    `transform`, the reveal's), the name's leaf glides onto the era title and is
    re-seated on its LIVE box once the era pins (the published seat rounds to
    whole pixels); the card resolves on the era's own `--about-handoff-morph`.
  - **The eras → the Arc is the corridor's PRELUDE** (`lib/home-v2/corridorPreludeRef.ts`,
    three-free, identity at `level` 0 in every reader): the scene counts it as
    engagement, the core holds its PARKED look and runs it backwards on the era's
    exit (TRAVEL · FOLD, reseeded from the glyph's raster at the fold's first
    frame), and OPEN grows a square from the glyph's centre, and ⚠ **its edge is a
    SOFT BAND, never a cut** (U1, owner: a hard one read as "a frame going over
    the brand mark"): `aperture.feather` (8 % of the height) is spent by every
    reader — the core fades OUT over the band's outer 60 %, the gate and its
    throat (`GatewayThroat`, its own painter, armed before the square opens) fade
    IN through a factor in their own shaders (`onBeforeCompile` on the gate, 1
    while off; clipping planes can only cut and are deleted with
    `localClippingEnabled`), and the copy layer and the glyph take feathered
    MASKS, the glyph's on the shell's INNER layer so the shell's `drop-shadow`
    halo follows the edge instead of being cut into a tile. The mount is welded `--tw-era-weld` (100svh) under the era, so the
    corridor pins as the era unpins, and the stamp drops the prelude there.
  - ⚠ **Every weld is keyed on the writer's `data-tw-flow` stamp**, the rung is
    the era hook's own (`(min-width: 1101px) and (prefers-reduced-motion:
no-preference)`), and the four lengths are pinned equal between the sheet and
    the clock (`workshop-flow.test.ts`). ⚠ The era's progress is written in its
    OWN rAF, so the writer takes a three-frame tail after every scroll or it
    strands on the previous frame's `p`.
    ⚠ **U4: THE PORTRAIT IS THE HOMEPAGE DECK'S CARD** (route rule 1c,
    `about-deck/usePortraitDeck.ts`). The img shows `portraitBakeFor`'s blob
    (the ring's own bake, `cutTopLeft` false as `raster-photo` bakes it),
    first painted from `PORTRAIT_BACK_SRC` under the LUT's CSS chain; three
    rim-only glass slabs (`.tw-deck`) sit IN FRONT of it and fan out once it
    lands. ⚠ The deck is the portrait's SIBLING (the emerge's `clip-path`
    flattens anything inside the portrait), the orbit is the 3D context, and
    the deck squares up and flies WITH the card (ADR-138). ⚠ The viewpoint is `/`'s
    (upper right) paid as an in-plane step in `%` of the card, with the
    perspective origin left at the orbit's centre the flip was approved on.
- ⚠ **THE AI STORYTELLING COURSE IS ONE PROJECT, NINE GATES (ADR-132, Proposed
  2026-09-28).** `/arcs/thoughtform/ai-storytelling`, a house arc with `cardChip: "course"`:
  a readout, one quote beat, one `anatomy` beat per week with the same four rows
  (Objective · You make · The gate · The tool), a close. The student builds one
  brand world all term, around themselves or a fictional product. ⚠ Motion is
  held to week eight on purpose, once the world has rules a film can obey.
- ⚠ **AND SINCE ADR-134 (2026-09-29, owner) THE COURSE IS ONE TRACK, NOT NINE
  SECTIONS.** He read the nine `anatomy` beats as "section after section with
  the same fucking structure … the same glorified PowerPoint". The `syllabus`
  kind (ADR-052's fourteenth exception) draws the whole term as one picture:
  the two ways in as a fork, a station per class (its numeral, a name ≤16, a
  hairline frame in the SHAPE of what the class makes) under the phase
  brackets, a gate tick after every station, what is launched as the end; the
  open station's sheet under the track carries Objective · You make · The
  gate · The tool ONCE, with an optional link to the worked example on the
  page. ⚠ **A SYLLABUS IS NEVER N IDENTICAL SECTIONS**: the week detail is what
  the instrument shows when a station is picked. ⚠ It is a client island on
  the bench's law (class one open at rest, state only in callbacks, every sheet
  in the DOM for print), `data-syl-*` only. ⚠ **The tablist is `display:
contents`** and each station a subgrid item of the track's grid, so the rail
  runs through every plate's centre with nothing measured; the phone's
  three-by-three overrides the inline columns with `!important`, the one place
  it is lawful. ⚠ **Its sheet is `course.css`, a ROUTE sheet after
  `arcs.css`**, because `arcs.css` is the file two sessions write at once. The
  registry pins one consecutive run per phase in the phases' order, two ways
  in, the four rows, and every example link landing on the page. ⚠ **U1
  (same day) ADDS THE WORKED EXAMPLE** — Tom on the Moon in five beats of five
  grammars: the `path` kind (the fifteenth exception: dated stages of real
  frames on one rail, a set cut to 3:2 cells, the last stage the one gold
  thing, `weight` its share of the row), the `bench`, a `media` wall of one
  wave's frames, two offer `cards`, the client's quote. Frames come from
  `scripts/arcs/prep-ai-storytelling-assets.mjs`, which only reads the ship;
  the registry pins every path frame under `/arcs/`, on disk, sized and alt'd.
- ⚠ **THE CLASS-ONE DECK, AND THE ARCHETYPE'S SITUATION RE-CUT ON THE MOIRA
  SESSION (ADR-136, Proposed 2026-09-29, owner).** `/arcs/thoughtform/ai-storytelling-class-1`
  is a house arc in the workshop format, the course's class-one station linking
  to it (`ArcSyllabusClass.page`, a registered arc's ROOT, never a fragment — a
  gated arc drops one through `/unlock`); it runs the Loop Moira second
  session's flow beat for beat, and `/arcs/thoughtform/workshop-v1`'s situation
  runs the same sequence between its proof and `what-you-build`. **Three kinds,
  ADR-052's sixteenth to eighteenth exceptions, ported by hand** (ADR-106):
  `spectrum` (the tool ↔ collaborator rail; the word frames a BAND, never the
  middle; the handle settles ONCE on `.is-in`, arrival-only motion), `resource`
  (four rows, the open one last with its `misses` line the one gold object —
  the kind is `resource`, never `ledger`: `.arc-ledger*` is the fee table) and
  `signal` (two columns in the board's order, two dated clippings each, every
  card the house plate linking out; it may only FOLLOW a `questions` board on
  its page; the digit ban is SPLIT — the corner, kicker, title, dek and date
  are a dated record and may carry figures, the column heads and a card's mark
  and tag may not). `ArcStage.example` + `stages.own` letter the client's own
  work under each stage IN THE ROW, never on the plinth (the label walk and
  the live stage are untouched). ⚠ **A `questions` board feeds the owner's
  page** — its six answers must name at least one tool the stack matcher chips
  ("In Claude, …"), or `sheet-instrument`, `sheet-composition` and
  `sheet-config-fit` fail on a page nobody opened. The curve's data half is
  `shared/frontierCurve.ts` (both English pages spread it; Plopsa keeps its
  Dutch copy) and Tom on the Moon's path, bench and wall are
  `shared/tom-on-the-moon.ts`, pinned `toBe` across the course and the class.
  ⚠ **Her chips under the leverage cards cost 195px at 1280×720** — the three
  claims are the head's last sentence; a five-row anatomy costs 70. ⚠ The
  hidden browser pane cannot screenshot; the capture script is the still.
- ⚠ **ADR-133 U2 → U6 (2026-09-29, owner) RETIRE THE TRAVELLING SCENE BELOW.**
  Pandora reads Part one (four proof cards, then the return: the `crew`, U6,
  Loop's record ALONE as one row per role read LEFT TO RIGHT, `{ head,
  rows[4] { who, work, line, output } }`, the ROLE on a green seat, a tap, the
  WORKSTREAM on a gold plate with the quantity drawn left, the role and the
  workstream at ONE size (`NAME_FS`) and one person mark on every seat, the
  record's only digit in `line`) · the turn · today (the `board` again: the
  ruled ledger of the current setup beside the configured board, the ledger
  stating the setup and never a gap) · the approach ("Automation runs through
  adoption.", the owned horizon, no time axis and no note) · the map ("A
  system built to compound.") · the three months · the checker · who takes
  part (U6: "What I need" under Thoughtform, an `ArcListGroup.sub`) · the day rate (U5: the rate and about twenty days a
  month, NO month fee and NO total, from the debrief with Rob) · what we
  measure · the About (`portrait` `layout: "orbit"`, U5: the homepage's own —
  copy left, the portrait at 3:4 in grayscale inside the About rings right;
  Rob is off the page) · the close (U6 deleted what you keep and next steps;
  the checker is labelled a mockup; the page sits behind its own password,
  ADR-135, `.claude/rules/auth.md`). ⚠ Headings are names or plain claims,
  never a paired tagline (the voice skill's rule): U5 retired "Priced by the
  day, one month at a time", "Who is in the room, and for how long", "The
  plan, month by month" and "Counted in week one, read every month". `circuit` is a STATIC MAP of the client's
  marketing OS, `{ head, configs[6] { id, name ≤14, line }, os { key, name,
line }, socket, alt }`: six small configurations in the board's cross whose
  CARD IS THE BOARD'S OWN CARD (264 × 104, `notch: "tr"`, gold wash, name at
  the board's name rung over one line at its value rung — both crops are 1400
  units across one text band, so the same units paint the same pixels), every
  gold context plate wired to a vertex of the MARKETING OS at the centre, a
  twelve-sided plate (`shape: "dodecagon"`, the carrier's housing) and the
  largest object, plugging dashed into LATER. The figure's width is capped by
  the height the frame leaves under the head. The left column mirrors the
  right so the context faces the OS (seating mirrors, a cut never does);
  every part rests at identity in all three states, because the crew still
  draws with the same pose record (`data-cir-state="a"`). `CircuitScene`, the
  runway, the pin and the three-beat flow are deleted. The `horizon` gains a
  second reading (`ArcHorizonOwned`, `framing/ownedLayout.ts`): `upstream`
  (the owner's day in three spans) in place of `operated`, an `owner` plate
  beside it in the human's green, the agent's run reaching up three times
  (goal, question, result) on dashed green handoffs, its own gates a row lower
  in gold. Exactly one top track per horizon, an owner plate only with
  `upstream` (registry-pinned); Plopsa's is byte-identical. ⚠ "Flywheel"
  never in copy (the strategy skill's ruling). The bullet below is the record
  of the scene it replaced.
- ⚠ **ON PANDORA THE CONFIGURATION TRAVELS AND THE RETURN SITS WITH THE
  PROOF (ADR-133, Proposed 2026-09-28, owner; second cut, the first was
  pushed, rejected on his read and reverted).** Two kinds, ADR-052's twelfth
  and thirteenth exceptions, on one glyph library (`components/arcs/circuit/**`).
  - **`circuit`** is the Moira workshop's board (one piece of work, six
    questions around it) in the proof's R4 material, ONE SVG whose parts carry
    three poses as custom properties; `data-cir-state` picks a set, so the
    travel is one attribute write on the compositor. **a:** the work alone on
    a plain plate ("typed up by whoever ran it") beside the same work wired:
    the owner above (green), model · context · evaluations left (the last two
    gold, in a dashed frame tagged WRITTEN BY THE TEAM), connectors ·
    interface right. **b (U1):** TWO SIDES. The owner heads the person's side,
    the largest object in the beat, with the two written plates under it;
    the work stays on the machine's side with the three given plates FOLDED
    to their bands under it (`Pose.fold`, a clip to the band); the draft
    runs back up to the owner, who sits above the loop. **c (U1):** a
    BACKPLANE: six workflow chips, each carrying its own six answers as six
    pads, wired into two shared bars, THE CONTEXT and THE EVALUATIONS, which
    run out to one dashed socket, LATER · a brand system, the Defyner
    argument drawn generic. The work's plates fly into its own pads. It
    replaces the `board` on Pandora only.
  - ⚠ **THE DOCTRINE IS THE RECORD (U1, owner: "why is 'good looks like'
    inside the work card? did you check the intelligence-architect /
    thoughtform-strategy skills?").** A configuration is one piece of work
    and five fields: what runs it, what it inherits, what it can reach, how
    much it decides alone, who owns it. **The card letters the work alone**
    (its name and when it runs, `CircuitWork.when`); **the bar is the
    EVALUATIONS' answer** ("evals carry what good looks like"); **the fifth
    field rides the OWNER's plate** as `CircuitQuestion.detail` ("It drafts,
    the PM sends"), as Moira's board has it. `arc-circuit-fit` pins all
    three. ⚠ **A RECEDED PLATE READS AS DISABLED; A FOLDED ONE READS AS
    PUT AWAY**, which is what "into the background or collapse under it"
    asked for. ⚠ **THREE BEATS, THREE SHAPES** (a hub, two columns, a bus):
    the second cut drew c as a second hub and every beat looked alike.
  - ⚠ **FEWER THAN A DOZEN OBJECTS A BEAT, PINNED** (`arc-circuit-fit`). The
    first cut carried forty lettered things in one state and he could not say
    what the section was about. ⚠ **A "TODAY" IS NEVER A COLUMN OF THE
    CLIENT'S GAPS**: one neutral line on the work carries the comparison.
    ⚠ **WRITTEN FOR A CMO WHO DOES NOT KNOW AI**: a name, a question, one
    plain answer per plate; no lane meter, no digit. The model plate names
    the tool the proposal already names everywhere (Claude, on Pandora's own
    account). ⚠ **A WIRE'S DASH IS PADDED BY ITS RIBBON'S WIDTH**: an outer
    conductor runs longer than the base path at a bend, and a dash sized to
    the base left a stray tick on an undrawn wire.
  - ⚠ **THE SCENE ARMS ITSELF** (`data-circuit-scene`, desktop plus motion): a
    sticky 100svh stage, two runway markers read by ONE IntersectionObserver
    at the frame's midline (never a scroll listener), the head decoding in
    place over ghosts of all three beats. Everywhere else the three beats
    FLOW at rest; on a phone they are ruled lists. ⚠ **ONE SECTION, THREE
    MASTHEADS**, which `arc-terminal-markup` counts.
  - **`crew`** is the business case DRAWN, never a calculator (owner: "not
    about exact numbers … a visual thing they can see"): Loop's record left,
    each output drawn as its quantity; the same shape in the studio right,
    its readouts framed and EMPTY. The only digits are the record's. **It
    sits after the proof cards, before the turn** (owner).
  - ⚠ **FIT IS DECLARED PER STATE**: widths, the rendered floor as
    `fs × k × meet` where a part LANDS, the crop, no two letters and no two
    plates on one another on the POSED boxes, every wire on its objects.
    ⚠ **A frame that holds plates paints UNDER them** (drawn after them with a
    fill it hid both, with every gate green). ⚠ **A path box is walked command
    by command.** ⚠ **A traveller paints last.** ⚠ **CSS `font-weight` beats
    the SVG attribute**, so lit is a class.
- ⚠ **THE PANDORA PROPOSAL IS THE FOURTH CUT OF THE FORMAT (ADR-128, Proposed
  2026-09-26; Phase A shipped).** `/arcs/pandora/proposal` is a registered
  arc, never a fork of the Trinny route (a homepage-variant fork is that route's
  whole file list copied; a proposal is read cold). Its proof is ADR-126's
  register on the flat kinds: `films` · a chapter `head` over the `heimdall`
  `dossier` (a dossier cannot carry an authored title, so the "we" line sits on a
  head above it) · `sheets` · `intelligence`, in the pile's order, Loop's
  evidence by reference. ⚠ **The studio today is a `board`, not a
  `configuration`** — the first registered adopter of the kind — and its
  **tools row is ONE LINE composed at draw time**: four product names sliced
  "Planner" onto a second line, so the board carries three (Asana, the wider
  org's board, stays in the prose). **A product name is never abbreviated to
  fit a measure.** `arc-board-fit` walks EVERY registered board now, not only
  `TRINNY_BOARD`; the label-set pin stays Trinny's. ⚠ **`sheet-instrument`'s
  real overview reads on `REAL_TODAY`**, a pinned day at or after the newest
  filing — a monitor read on a day before a filing reports "filed after now".
  Bump it when a newer arc files; never the axis tests' `TODAY`. The fee is a
  day-rate `ledger` (`["Month", "Days on the work", "Fee"]`) derived from one
  constant that the deck's generator shares. ⚠ **THE `proof-card` KIND IS
  BUILT (B1, the SIXTH exception)**: `{ track, head? }`, `ArcProofCard`
  mounts the homepage's `ProofCard` WHOLE inside `.pf-stack > .pf-slot`, whose
  declared rest state seats every arrival channel with no hook; the arc adds
  only the box (`.arc-proof`, the films height law, static slot, gated to the
  complement of the module's inert rung) and imports `proof-stack.css` at the
  route ahead of `arcs.css`; the record resolves the pile's way and THROWS on
  a miss; `KIND_DESIG` letters it `PROOF`; the registry pins the track set,
  `arc` + `card` on each, the pile's order, and that an authored head never
  repeats the card's title. A change to `ProofCard` or its sheet is a
  THREE-surface change now. ⚠ **AND THE `bench` KIND IS BUILT (B2, the
  SEVENTH)**: `{ head, example }`, Moira's Run · Skill · Evals module ported
  BY HAND onto the ramp (`ArcBench`, a client island resting on RUN · input 0;
  three tabpanels always in the DOM, the rail of four checks beside all three,
  a picked check dimming what is not its own). States by SHAPE inside the one
  accent — pass an outline, review dashed `--gold-line`, block filled `--gold`
  — never green, never a traffic light; the picked tab filled (ADR-089 U4).
  The chrome strings are constants in `bench/benchChrome.ts`, walked by
  `arc-bench-chrome` through the copy law and the digit ban (a renderer's
  string is outside every content scanner). The registry pins the record the
  module's way: four checks, one result per check in order, the verdict the
  WORST of them, a free rule with no check, `SKILL.md` first, `evals/`
  present, regions inside the picture, images under `/arcs/` and on disk, NO
  DIGIT but a `src` or an `alt`. ⚠ `[hidden]` is declared one level deeper
  than the panel's `display: grid` (a bare attribute selector ties and loses).
  ⚠ The picture is sized through its inline `aspect-ratio` and the regions
  ride it in percent. Attributes `data-bench-*`, never `data-arc-*`; the
  whole Pandora arc joins `arc-terminal-markup`'s walk.
- ⚠ **A PROPOSAL MAY OPT INTO LINEAR'S RHYTHM (`ArcDef.rhythm: "flow"`,
  ADR-128 U2, landed 2026-09-29; the Pandora proposal only).** `data-arc-rhythm`
  on the root: a HEAD beat is content-height with its head a fixed 128px under
  its own top edge (`--arc-head-datum` REDEFINED, never a second token — the
  bench and the proof card budget against it), where the format's datum seats a
  head for one body height only. Opt-in because the Trinny scene (ADR-102) is
  measured against the centre-solved datum; beats without a head stay whole
  frames. Gated like the datum (≥961px, no PRM).
- ⚠ **NO `phases` KIND, AND THAT IS ADR-078 U1's LAW.** The deck draws its
  phases as a rail; on this surface a drawing plots something that HAPPENED,
  and a plan is an argument. Three phases are three `list-groups` columns,
  which is the deck's own plan table.
- ⚠ **`.arc-cards` COLLAPSES TO TWO AT ≤1280**, which is the reference laptop.
  Three cards land 2+1 with a hole there; four land 2×2. The pricing beat is
  four (M1 · M2 · M3 · Total) for that reason, and the total stopped being a
  footnote to its own table.
- ⚠ **A TIPS TAG IS A CHIP, NOT A CLAUSE.** `.arc-tips__tag` is `nowrap` in a
  120–160px column, so a tag written as a sentence overruns its column and
  prints THROUGH the body beside it. Caught on the first capture; the clause
  belongs in the body.
- **A LOCKED ARC IS TWO HALVES.** `theme: "light"` mounts `ThemeLock` through
  `ArcShell` and the root's own `data-theme` follows it; the route also earns
  a `LIGHT_LOCKED_ROUTES` row BY HAND, and `arcs.css` hides the switch
  (`html[data-theme-lock] .rin-settings__ctl .theme-toggle`) — a lock without
  that rule leaves a control that visibly does nothing. The registry test
  fails a locked arc with no row, and a gateway-plate arc with no
  `HERO_ROUTES` row.
- **A proposal is OUTSIDE `ENVELOPE_ARCS`** and deliberately so: that envelope
  is for a page forwarded to strangers, and a proposal names its fee and its
  addressee. What it does hold is the client-facing copy law — no fleet
  vocabulary, no "self-sufficient", no em dash (`meta.title` exempt: every
  arc's tab title carries the site's own dash) — walked over every
  `format: "proposal"` arc.
- **A new client page is one command**: `node scripts/new-arc.mjs --client
<slug> --name "<Name>" [--engagement proposal] [--dry-run]`. Three fail-loud
  needle edits and one module. ⚠ **The skeleton ships FINISHED copy, not
  placeholders** — Armada's day-one command runs this unattended, and a
  registered arc full of `[brackets]` would leave `npm run verify` failing in
  a repo nobody had opened. The registry test walks for them. It never
  commits and never overwrites. ⚠ **Two rows stay yours**: a scaffolded arc
  passes 22 of 23 registry guards and the one that fails names the missing
  `LIGHT_LOCKED_ROUTES` row. Writing them from the scaffold was built and
  reverted — both lists are pinned `toEqual` by their own tests so a route
  joins or leaves by a reviewed hand, and a generator that edited those tests
  would be quieting its own guards. The red guard IS the handover.
- ⚠ **NO CHAPTER ROW IN THE TOP-LEFT CORNER, AND THE RULE IS NOT HERE**
  (ADR-098 U1, owner: the icons "compete with the hero"). The arcs hid it
  first, then the homepage asked, so `.rin-cl--journey { display: none }` and
  the bracket's return live in `rail-instruments.css` for every surface and the
  arc-scoped copy is DELETED. ⚠ Do not re-add one here — three routes wanting
  one rule is what moved it. ⚠ **The arcs KEEP their section indicator**,
  unlike the pitch page: the header is the site's own (ADR-073) and the readout
  and drawer stay top-right.
- ⚠ **A PROPOSAL'S DISPLAY LINE IS READ, NOT PRESENTED** (ADR-098 U1). The
  interstitial's callout is `clamp(24px, 2.6vw, 40px)` at `max-width: 42ch`
  under `[data-arc-format="proposal"]`, against the deck's own
  `clamp(38px, 5.4vw, 76px)`. Scoped to the FORMAT on purpose: a deck is
  presented in a room from a distance and the callout is where the room looks
  up; a proposal is read at arm's length. ⚠ The MEASURE is part of it — at 34ch
  the sentence broke `AI-first.` across its own hyphen.
- **Capturing any arc:** `node scripts/capture-arc-portfolio.mjs --slug
<slug> --vp 1280x720`. The sweep is the reveal grammar's, which every
  flowing arc shares. ⚠ A light-locked arc ignores `--theme`.
- ⚠ **THE PLAN IS PLATES AND THE FEE IS A LEDGER (ADR-098 U2, owner
  2026-09-13: the three modules "are supposed to be like three blocks, but it
  doesn't really have these borders or dividers, which makes it look very
  chaotic").** `list-groups` takes `layout: "plates"` — each group a bordered
  plate with a head band (mono `label` over `blurb` as the NAME), ruled rows,
  and `group.foot` as an INVERSE band (`--arc-ink` under `--void`, ADR-058's
  swapped pair, so both themes are one rule). `cards` takes
  `ledger: { columns }` — one row per card under the head cells, the LAST
  card the total, the tips BESIDE the table as gold-ruled cards, `footnote`
  as the note. ⚠ **Neither is a new KIND**: the `columns`/`stack` layouts and
  the cards grid are byte-identical, and "no `pricing` kind" stands. ⚠ Both
  drawings render on the Trinny pitch page too (ADR-094 U9) through the same
  components — a change here is a TWO-surface change; run
  `trinny-london-smoke` with the arc smokes.
  ⚠ **AND THE PLATES TAKE THE NOTCH — TOP-RIGHT, AND ONLY TOP-RIGHT**
  (U4 then U5, owner 2026-09-14: "redesign the modular approach cards so they
  have the notch", then, on the still, "I don't think we need a notch in the
  bottom-left corner because … it is too close to the text"). The plate rung
  (`--arc-plate-ch: clamp(16px, 1.8vw, 26px)`, the value `.arc-dossier` and
  `.arc-prog` already cut at), on the TOP end of the canonical diagonal.
  ⚠ **THE FOOT IS NO LONGER INVERSE (ADR-101 §B, owner 2026-09-14: the
  plates' foot had "a black sort of fill. I don't think we have that in the
  AI capability cards, so we use the soft yellow fill").** The head band and
  the foot both paint `--arc-gold-wash` — the BOARD CHIP's own material,
  aliased from one token on `.arc-root` so the two cannot drift — with the
  2px `--gold-line` rule across the head STOPPING AT THE CUT. On
  `/arcs/trinny-london/proposal` that chip literally travels here and lands
  as this band, and a cross-fade between two materials is the one thing the
  owner ruled out; the answer is that there is only one material.
  ⚠ **THE RING IS VISIBLE OVER THE FOOT NOW, AND THAT IS THE POINT** — U2
  relied on the inverse band bleeding to the silhouette to CAP the plate; a
  wash leaves the edge to the ring, which is what draws the cut corner.
  ⚠ Measured composited in light: head and foot land on the identical
  `rgb(223,208,180)`, `--gold-ink` reads 4.81:1 on it and the sans 10.93:1.
  DARK is defined by the ramp and unverified — every proposal route is
  light-locked.
  ⚠ **THE BL CUT WAS NOT FREE**: the plate's floor IS the inverse DELIVERABLE
  band and its text is set inside it, so a chamfer there bites the line the
  reader is on, while the head band under the TR cut carries a short mono
  kicker and sits clear. **A cut is free only where nothing is set against
  it**, and U4 checked the ring's geometry rather than what it cut into.
  ⚠ One corner is lawful by ADR-065's own uniform-SET clause, not in spite of
  it — three plates of one kind, one nesting level, one scale, on the LAWFUL
  diagonal (U4's correction: the operative words are "on the lawful diagonal",
  never the count) — and a single notch MEANS oriented-or-connected, which a
  numbered sequence of phases is. U2's "square (ADR-065)" meant NO 12px
  RADIUS — the deck's soft card is its own material — and was read afterwards
  as "no cut", which U2 never argued. ⚠ **NO `border`: a clip CUTS a border
  and never strokes one**, so the edge is a two-contour `evenodd` RING on
  `::before` with the inner leg `ch - 0.586px`; `clip-path` makes its own
  stacking context, so `z-index: 1` and no `isolation`. ⚠ Rule 4 keeps the
  head band, the rows and the inverse foot SQUARE — the housing's clip takes
  their corners for free. ⚠ The ring is INVISIBLE over the inverse foot by
  construction (`--arc-edge` and `--arc-ink` are one dawn triple at two
  alphas), so the dark band caps the plate. CSS-only: `ArcListGroups` does not
  change and `arc-terminal-markup`'s byte-identity pin holds.
  ⚠ **THE CORNER IS PINNED FROM BOTH ENDS AND IT IS HIT-TESTED, NOT PARSED**
  (ADR-065 U4/U5: a one-sided assertion verifies a cut EXISTS, never that it
  is on the right corner). The computed `clip-path` keeps its percentages and
  `calc()`s, so a pixel-pair regex finds one point in five — it measures the
  SERIALISATION; `elementFromPoint` at 0.35 of the cut in from both edges of
  each corner asks what actually painted. ⚠ Resolving the cut takes a probe
  element: **a custom property is a string until something lays it out.** ⚠ Three pages
  render it (Trinny, Suri, Hungry Minds — Perfect Ted is still `columns`) and
  only `trinny-london-smoke` guards it.
- ⚠ **THE PROPOSAL COPY LAW IS A MODULE** (`lib/arcs/copyLaw.ts`,
  `PROPOSAL_COPY_BANS` + `scanStrings`), read by `arcs-registry` AND
  `trinny-offer.test.ts`. ⚠ It caught "run the waves themselves" on the day it
  moved — the fleet's word had been on the Suri page since the arc shipped,
  and "wave" in any form is the fleet's; the ban's regex is narrower than the
  law it stands for.
- ⚠ **A CLIENT MAY HAVE A PAGE THAT IS NOT AN ARC** (`ClientDef.pages`,
  ADR-098 U2). Listed FIRST on its band and its page as an `ArcCardFace` that
  links out; never an `ArcDef` (the reason "the Trinny pitch as a card" was
  rejected still holds — a link-only arc breaks every `ARCS.map` walk). The
  registry pins a page's `href` outside `/arcs/`; the overview smoke counts
  `ARCS.length + Σ pages`. ⚠ `scripts/new-arc.mjs` still edits `clients.ts` by
  needle — keep `export const CLIENTS: readonly ClientDef[] = [` intact.
- ⚠ **THE OVERVIEW GRID IS CAPPED AT TWO COLUMNS, AND IT IS ARITHMETIC.**
  `repeat(auto-fit, minmax(300px, 420px))` counts repetitions against the MAX
  track — `floor((1194 + 36) / (420 + 36)) = 2` at 1920×1247 — so the `300px`
  has never decided anything, a one-engagement band is ~810px for one poster
  with a `0px` second track, and six links ran 4,710px. Measured 2026-09-13;
  the owner set it aside. Open.

## The dossier housing (ADR-090)

The four dossier beats are one machined housing; the console is a cell inside it.
All of it is `.arc-dossier`-scoped and gated at
`(min-width: 981px) and (prefers-reduced-motion: no-preference)`.

- ⚠ **THE REVEAL OBSERVER HAS A DEAD BAND AND THE HOUSING MAY NOT FILL INTO
  IT.** The ADR-052 reveal runs at `rootMargin: -10%`, so the bottom tenth of
  the viewport never triggers an intersection. Sized to the beat's whole
  budget, the record's LAST block parks there: measured at 1920×1080,
  `.arc-dossier__stack`'s top landed at **975 against a root bottom of 972** and
  stayed at `opacity: 0` forever while the other five revealed.
  `--dos-reveal-clear` reserves it. ⚠ **The cost is DOUBLE the clearance** —
  shrinking a beat re-centres it, so 50px of budget buys ~25px of margin.
  ⚠ **It binds only where the CONSOLE sets the row**, so 1280×720 is unaffected
  and cannot catch it; measure at 1920×1080.
- ⚠ **THE CONTAINING BLOCK IS THE REVEAL WRAPPER, NOT THE HOUSING.** Releasing
  `.arc-head__lead` does not reach `.arc-dossier`: `.arc-head` carries
  `.arc-reveal`, whose transform makes it a containing block for absolute
  descendants, so the designation printed through the title.
  `.arc-dossier .arc-head { position: relative }` is DECLARED — left implicit,
  the band's seat would depend on animation state.
- ⚠ **THE INSET IS PAID FOR BY THE FIELD.** The record column is a fixed
  fraction, so every pixel of `--dos-pad` and of the grid gap comes off the
  console. `.fl-bay__top`'s FEED line neither wraps nor shrinks and is ALREADY
  clipped 28.8px at 1280×720 (pre-existing, ADR-068's budget); both tokens are
  tuned so the field lands back at its pre-housing width.
- ⚠ **A BORDER, NOT ADR-089's CLIPPED RING.** A `clip-path` cuts a border and
  never strokes one, which is why the casefile needs a two-contour path for its
  gold lip. This edge is flat dawn, so a plain border under a single-contour
  clip is correct. ⚠ **And no gold on it** — the record already spends gold on
  the badge, the route arrow and the NOW plate.
- ⚠ **THE BAND'S RULE RUNS FULL WIDTH**, unlike the casefile's, which stops at
  the split because `ConsoleRail` is the field's own header. A dossier console
  has NO rail, so nothing collides with it. It letters the designation ALONE
  (ADR-089 U1) — the bay's FEED line already prints `IN SERVICE {year}`.
- ⚠ **`--con-ground: transparent`, NEVER `background: none`**, and
  **`border-color: transparent`, NEVER `border: 0`** — the light walks read
  that property for their bed, and the border box sizes the field.
- ⚠ **THE HOUSING CHANGES THE RECORD'S BED IN LIGHT.** `--arc-plate` is `.55`
  in dark (walked past) but FULLY OPAQUE in light, so it becomes the bed for
  every rung in the record column. Five of them joined the contrast walk for
  that reason; a new text element in this column belongs there too, because the
  count guard only notices a LISTED selector that stops matching.
- ⚠ **`--arc-seam` IS LIFTED IN LIGHT** (.28 → .42), like every line rung on
  the ramp. Carried across, the two-rung ladder collapses on parchment.
- ⚠ **CSS-ONLY BY DESIGN** — `arc-terminal-markup.test.tsx` pins
  `class="arc-dossier__console arc-ap"` exactly and counts 12
  `data-arc-decode`. Build the band by moving containing blocks, not elements.
- **Verifying:** `arc-portfolio-smoke --project=desktop` AND
  `arc-terminal-smoke --project=desktop`, plus
  `node scripts/capture-arc-portfolio.mjs --vp 1920x1080` in both themes.
  ⚠ Six failures on `iphone-14` / `tablet` are PRE-EXISTING (the ≤960
  `.fl-wire` aspect rung) — stash before blaming a change.

- ⚠ **THE DISPLAY RAMP LANDS ON ITS CAP AT 2560, NOT AT A LAPTOP** (owner,
  2026-10-03, MacBook Air: titles "so stacked underneath each other"). `.arc-title`,
  `.arc-hb__title`, `.arc-inter__line` and the callout are `a + b·vw` solved to hit
  their old caps at 2560 (every wider screen byte-identical) and about a quarter
  smaller at 1470: 32 · 36 · 40 · 48px there. A pure `vw` slope capped at ~1470 and
  set an ultrawide's size in a laptop's column. Retune by re-solving the pair, never
  by raising the slope.
- **No italics.** Emphasis is `ArcTitle.em` → upright gold; markup inside
  copy strings fails `tests/lib/arcs-registry.test.ts`.
- **Content changes** = edit `lib/arcs/content/*` + registry only; run
  the registry test. New arc = content module + registry entry + assets
  under `public/arcs/<slug>/`.
- **Shared evidence lives in `lib/arcs/content/shared/*` and is imported BY
  REFERENCE** (ADR-072) — the roster, the studio cards + the ATL film, the
  operator's lines, the mode legend, the figures. Share the evidence,
  author the frame: every head, sub and placement stays per arc. The
  registry test pins the references `toBe`; a copied array drifts the
  moment either page edits it. `LOOP_FIGURES` is copy-with-parity to the
  casefile's `report.stats` (`cases-registry.test.ts`) — `lib/arcs` keeps
  no `lib/cases` import.
- **The numbers canon fails on EVERY arc** (ADR-072): 42 / forty-two,
  90 % / 95 %, 15+ teams, 20+ Skills/teams, "teams mapped", "8 teams", and
  a `14 teams` that does not say "using the layer".
- **Money on arcs:** the keynote is a client DECK and prints per-ad spend
  in euros on purpose (the exemption is recorded beside `STUDIO_SHOTS` in
  `lib/cases/content/loop-earplugs.ts`). The PORTFOLIO is a page a reader
  forwards and sits inside the casefile's confidentiality envelope —
  `ENVELOPE_ARCS` in the registry test (currency, thousands separators,
  boards, repos, private repo names, surnames); its studio cards go
  through `ratiosOnly()` (SKU + ROAS). Add a forwarded page to that list;
  never widen it to the deck.
- **Next 16:** route `params` is a Promise — `await params`.
- Videos: `preload="none"` + poster, never autoplay — ⚠ ONE exception (ADR-143 U7): an `interstitial`'s `clip` (`ArcClipLoop`) loops muted while in view and never under reduced motion, the GIF of a deck; no gated `.skill`
  downloads via `public/`.

## Terminal motion (ADR-057) — the `-v2` cuts

Two choreography systems live on this surface, selected by
`ArcDef.motion`. Absent/`"reveal"` = the ADR-052 IO reveal;
`"terminal"` = the pinned-beat grammar.

- **Disjoint by gate, never by discipline.** Above the enhanced tier a
  terminal page never gets `is-arc-js` (v1 CSS inert) and a reveal page
  never gets `data-motion` (terminal CSS inert). The class and the
  observer are added or skipped TOGETHER, so "hidden but never revealed"
  is unreachable. Below the tier a terminal page falls back to the reveal
  path — not to a dead static page.
- **`ARC_TERMINAL_MEDIA` (961px) is THE gate**, shared by the hook, the
  ArcShell split and the CSS release. ⚠ That release is
  `(max-width: 960px)`, NOT the v1 reveal block's 900px — borrowing 900
  leaves 901–960px with sticky beats and no clock writing to them.
- **The writer is still `useArcScroll`.** `useArcTerminalMotion` adds no
  scroll listener; it returns an `onFrame` run as the tail of that rAF,
  reading the `scrollY` its caller already sampled. Offsets are cached at
  mount/resize/ResizeObserver — never a per-frame `getBoundingClientRect`.
  ⚠ **That frame stops the instant the reader stops moving**, so any
  TIME-based condition in it must wake itself (`scheduleSettleCheck`).
  The 180ms re-type settle relied on the next scroll frame and stranded
  the masthead blank FOREVER on scroll-up-and-stop — pinned by
  `tests/visual/arc-terminal-smoke.spec.ts` ("scrolling UP into a beat
  and stopping still types it in"). ⚠ And a beat that becomes NEAR between
  scroll events — a jump past the 120 % margin (End key, `scrollTo`, a
  reel click in one step) — parked blank the same way until ADR-072 gave
  the near-callback one frame through the same timer. Found by a stepped
  drive whose last step cleared the margin; real on every terminal arc.
- **The stage pin is `sticky; top: vh − stageH`** (`--arc-stage-pin`,
  measured by the writer with the same numbers `beatOut` parks on): 0
  for a fitting stage; negative for a tall one, which reads through its
  overflow and then pins on its last, fully visible viewport. Measured:
  a plain `top: 0` pin fits only 15 of 23 sections at 1440×900 and 7 at
  1280×720. ⚠ **Never `bottom: 0`** — sticky-bottom only restrains exit
  through the bottom edge, so past the park it never engages and the
  fold plays on a MOVING stage (shipped once; the reverse smoke caught
  the head sliding 48px). Stage height is content-driven — CSS sizes it,
  JS only records it.
- **Terminal padding is deliberately tight.** Pinned, the transition is
  the breath; padding only steals height from content that must fit. Do
  not restore the v1 flow padding here.
- **THE MASTHEAD LAW (owner, twice — services 2026-07-27, arcs
  2026-08-01): the masthead never moves and never fades, either
  direction.** `data-arc-still` = `opacity: 1; transform: none` — NO
  clock factor; visibility lives in the text. It TYPES in at a
  stationary head (down: immediately at park; up-return: after 180ms
  stillness) and UN-TYPES out (down: smoothed out ≥ 0.30; up: ≥12px of
  upward intent while pinned), with two force-blank truncation guards
  (unpin with text; smoothed out ≥ 0.5, ahead of the iris).
  ⚠ **The masthead leaves LAST** — it tops the LIFO ladder, so it must
  stay readable while the cards fold. Thresholds read the SMOOTHED
  channel, and the ordering `RETYPE < UNTYPE < FORCE_BLANK < iris(0.56)`
  is the contract (unit-pinned); `RETYPE_OUT` stays DERIVED
  (`UNTYPE_OUT * 0.4`). Keying these to the RAW ramp fired ~107px into
  an 888px tail — inside the settle hold, smoothed ≈0.001, nothing else
  moved — and blanked the masthead off a parked, legible section.
  Tall beats sticky-pin the head at `--arc-head-pin` (void-backed;
  content passes beneath). The `close` band is the one exception: types
  once at the page foot, never churns. Never give a head a `--dx`/`--dy`.
- **Decode targets are LEAF spans whose attribute equals their text**,
  each with a `.arc-tdec__ghost` twin, and **the live layer stays
  ABSOLUTE** (`inset: 0` over the in-flow hidden ghost — the
  ServicesMasthead recipe). A grid-stacked live layer contributes
  height, typing then changes layout, scroll anchoring nudges scrollY to
  compensate, and the controller reads the nudges as upward intent —
  the beat churns type ↔ un-type forever (720p, adjacent tall beats).
  Blank IMPERATIVELY on arm — `queueScramble` no-ops when text already
  matches, and a pre-rendered blank breaks hydration. `captionScramble`
  only. Quote interstitial lines TYPE (someone else's voice; the law
  still applies).
- **Rungs stay ≤ 0.56**, the LIFO mirror — the departure offset is derived
  as `0.56 − --ci-off`, so a higher rung would leave before the fold began.
- **The iris trails the panels** (opens at out 0.56) and every inset rests
  NEGATIVE — survey marks overhang their border box. `contain: paint`
  stays banned; the iris lives on `.arc-plane`, never on `.arc-stage`
  (which carries the opaque void).
- **No `backdrop-filter` on arcs.** The stages sit on opaque void, so
  there is nothing to frost and no settled-gate problem to inherit.
- **A `-v2` arc shares its v1 `sections` and `hero` BY REFERENCE**
  (registry-test pinned). Never copy the array; fork a single element with
  `.map()` if one ever has to diverge. Promotion = set `motion` on the v1
  def and delete the v2 module.
- **No motion fields on `ArcSectionBase`** — sections are shared with v1,
  so authoring fields would leak motion into content.

**Verifying terminal motion:** `tests/lib/arc-motion.test.ts` (clocks),
`tests/lib/arc-terminal-markup.test.tsx` (conventions + v1 byte-identity)
and `tests/visual/arc-terminal-smoke.spec.ts`, which walks the `-v2` cuts
— the terminal pages. ⚠ **`arc-portfolio-smoke.spec.ts` is NOT one of
them since ADR-076**: that page flows, so it has no stage, no decode
ladder and no fold, and its spec asserts the FLOWING contracts (the
sections' order, the curtain on `.arc-band`, the dossiers at the three
reference shapes in both themes, the walkthrough, the architecture
beat's box/aspect/rail/wheel, PRM, the small-screen unwrap). Run BOTH
when you touch the arc chassis: the terminal spec is what proves a
change to the shared components left the decks alone. Measure at **1280×720 and 1440×800** — the
project's 1440×900 default hides every clipping bug this content has.
Drive REAL stepped scrolls and disable `scroll-behavior: smooth` in the
harness, or the drive lands short. The drive helpers live in
`tests/visual/helpers/arcTerminal.ts`.

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) —
Cycle B when adding a section kind or surface; Cycle A after fixes.


## The instrument (ADR-154)

- **One record, five altitudes.** The intelligence configuration is `InstrumentRecord`
  (`lib/instrument/types.ts`): the six in the owner's order (model, context, evaluations, data,
  interface, owner), the work, and optionally the run, the checks, the plugin, the organisation.
  `recordFaults` is the law: lit ⊆ {context, evals}; the owner is the one human; one skill reads
  the others. `altitudesOf` offers only what the record carries. The three old shapes
  (`questions`, `configuration`, `board`) read in through `lib/instrument/adapt.ts`.
- **One DOM, placed by `[data-altitude]`.** `components/instrument/Instrument.tsx` renders the
  six panels, the chip, the nodes and the frames once; `instrument.css` seats them per altitude.
  The picker (`InstrumentPicker`, the one island) writes one attribute; the engine (css · flip ·
  anime) loads by `import()` on the first pick. Static `gsap`/`animejs` are banned under
  `components/instrument` and `lib/instrument` (`arcs-import-doctrine`).
- **The grammar** is `.claude/skills/thoughtform-design/references/instrument-grammar.md`: the
  housing is `.lat-frame`; its children are square; the panel's label is a header strip INSIDE
  the frame, never on its edge; the chip is the one filled object (a lattice `tr` notch); gold is
  what the team writes, green the owner. Nothing idles (`no-idle-motion.test.ts`).
- **The lab** is `/test/instrument-lab` (`lib/instrument/directions.json` is its registry;
  `scripts/capture-instrument.mjs` its capture; `window.__instrument.measure()` its gate).
- **Retires, as its pages move** (ADR-070 U35: delete with the guard): `questions`,
  `plugin-board`, `repository`, `skill-run`, `guide.system`, `circuit`.
