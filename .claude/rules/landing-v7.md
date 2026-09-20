---
paths:
  - "components/landing/v7/**"
  - "app/(marketing)/**"
  - "public/prototypes/v7/landing-v7-motion.html"
description: Landing v7 compositing, layers, and brandmark journey
---

# Rule: Landing v7

When editing files under `components/landing/v7/**` or `app/(marketing)/**`, you are in a **layered composite** (fixed gateway, sticky hero, opaque stations) — not a flat page.

**Read first**

- [ADR-008: Landing v7 background layers](../sentinel/decisions/008-landing-v7-background-layers.md)
- [ADR-010: Brandmark choreography](../sentinel/decisions/010-brandmark-choreography.md)
- [ADR-031: Rail Manifest](../sentinel/decisions/031-rail-manifest.md)
- [ADR-033: Arc Cases Orbit + funnel](../sentinel/decisions/033-arc-cases-orbit.md) (orbit superseded; funnel live)
- [ADR-034: Arc Cases Terrace](../sentinel/decisions/034-arc-cases-terrace.md) (superseded by ADR-035)
- [ADR-035: Arc Cases Terminal](../sentinel/decisions/035-arc-cases-terminal.md) (reveal surface superseded by ADR-036)
- [ADR-036: Arc Cases Card](../sentinel/decisions/036-arc-cases-card.md) (the live cases reveal; §3/§5 superseded by ADR-041)
- [ADR-041: Arc Cases Sigil + phased reveal](../sentinel/decisions/041-arc-cases-sigil.md) (the phased reveal + ordering; its §2 sphere-sigil trigger is superseded by ADR-042)
- [ADR-042: Arc Cases cue under the Build title](../sentinel/decisions/042-arc-cases-cue.md) (the live trigger — a DOM dotted-leader + label, off the sphere)
- [ADR-048: Editorial band](../sentinel/decisions/048-editorial-band.md) (the shared horizontal frame for section text — `--band-max`/`--band-margin`/`--rail-inset`; never re-widen the inset per-section)
- [ADR-054: Proof station + client cases](../sentinel/decisions/054-proof-station-client-cases.md) (`#proof` — the Loop Earplugs case — REPLACES #continuum in the funnel; plain opaque DOM, content generated from `lib/cases/` at parse time, and the ambient-kill cover after #about). **Supersedes [ADR-049](../sentinel/decisions/049-continuum-rail-stage.md)** on production: the crail stage, its clocks and its band math are deleted; only the `uBand*` shader block survives, dormant at 0 gain. Rules: [`.claude/rules/proof.md`](proof.md)
- Skill: `.claude/skills/landing-v7-compositing/SKILL.md`
- Skill: `.claude/skills/brandmark-choreography/SKILL.md`

**LandingPage must stay render-stable.** It owns the
`dangerouslySetInnerHTML` prototype body, and `ServicesPortal` /
`ServicesRailRegisterPortal` mount nested `createRoot`s into placeholder
nodes inside that markup. A LandingPage re-render that re-applies the
innerHTML orphans those nested roots (cards silently vanish, no error).
Do NOT add `useAuth` or other post-mount-updating subscriptions to
LandingPage — push them into leaf components (see `CelestialEditorGate`).
Ref: BEST-PRACTICES "Nested-root portals".

⚠ **THE PAGE ENDS ON A BOLD FOOTER, AND `#practice` IS DELETED
([ADR-105](../sentinel/decisions/105-the-page-ends-on-a-bold-footer.md), 2026-09-15,
owner).** `#contact` IS the footer: a key visual bleeding up from the floor, the ask,
the contact form's slot and the socials, over a legal bar. What the owner read as _"a
parallax section sliding over"_ the era stage was `#practice` — an EMPTY station (its
one child `approach` is stripped at parse time) kept alive only to be the opaque COVER
that ends the corridor ambient, because a hologram `#voidwalker` is a pinned
TRANSPARENT stage. **The footer takes that role**, so ADR-030 §6's lockstep moves in
one commit: `home-v2.css`'s `~ #practice` rule, `useCorridorExitScroll`'s `practiceEl`
query and `landing.css`'s `content-visibility` opt-out all name `#contact`.

- ⚠ **IT STAYS A `<section class="station" data-station="contact">` INSIDE `<main
class="stations">`.** Four things read that and a `<footer id="contact">` falls out
  of all of them: the rail-manifest drift guard matches the SECTION tag over the body
  HTML string, `useLandingScroll` collects `.station`, the mobile padding floor keys on
  `#contact.station`, and the cover rule is a `~` SIBLING selector (which is also why
  it cannot leave `<main>`, and why the cover's `z-index: 6` still means something —
  `.stations` is the stacking context it is measured in). `role="contentinfo"` lives on
  the React root; a `<footer>` nested in a `<section>` is not `contentinfo` anyway.
- ⚠ **IT IS A PORTAL INTO AN AUTHORED SHELL — the fourth of these.** `#contact` carries
  `[data-site-footer-root]` and `SiteFooterPortal` mounts into it, exactly as `#about`
  and `#voidwalker` do. ⚠ **`contact` MAY NOT JOIN `removeStations`** — that list also
  rewrites every `href="#<id>"`, so it would strip the id being kept. ⚠ And
  `removeStationsFromBody` could NOT reach the old `<footer class="foot">`: no id,
  neither tag, and outside `<main>`. It went from the prototype source, which fires no
  HMR — hard-reload after.
- ⚠ **THE NESTED ROOT IS WHAT WILL KEEP THE CONTACT FORM SAFE.** A `LandingPage`
  re-render re-applies the innerHTML and ORPHANS every nested root — the services cards
  vanish with no error — and a controlled input re-rendering per keystroke is exactly
  that. Inside its own root the form's state cannot reach `LandingPage`. ⚠ `useEffect`
  is no longer imported there at all; anything that adds one back is adding a re-render
  path to the component that hosts every portal on the page.
- ⚠ **IT CARRIES A NAMED LINK GRID, AND WHAT IT MAY POINT AT IS A RULE
  ([ADR-105 U2](../sentinel/decisions/105-the-page-ends-on-a-bold-footer.md),
  2026-09-17, owner).** `lib/site/footer-nav.ts` is the record; it DERIVES from
  `MANIFEST_ENTRIES` rather than re-typing it, so a renamed station is a test
  failure and never a dead anchor. ⚠ **`/arcs` AND EVERY ARC SLUG ARE BARRED** —
  robots.ts leaves them crawlable only so each page's `noindex` is visible, the
  sitemap names them deliberately absent, and three LIVE CLIENT PROPOSALS sit
  behind them. `tests/lib/footer-nav.test.ts` asserts every internal path is in
  the sitemap's URL set, which makes that unmergeable rather than discouraged.
  ⚠ `href: null` means NOT PUBLISHED and renders nothing (socials.ts's own
  contract), so a blocked column — `Legal`, and the four formats until a
  `?service=<id>` deep link exists — is recorded in code, not in a comment.
- ⚠ **THE BAND CLEARS THE RING HORIZONTALLY, AND THAT IS MEASURED.**
  `scripts/measure-plate-luminance.mjs` profiles the plate per ASSET: every
  desktop rung is height-bound, so image-y fractions ARE station-y fractions and
  only x is cropped. `Gateway_v1b`'s bright mass is y 0.23–0.67 — there is NO
  quiet upper region, which is why `--ft-band-right: 54vw` cuts the band's WIDTH
  (never its inset) and why the link columns sit UNDER the ask rather than
  beside it: 54vw leaves ~680px at 1920, enough for the ask or a column row, not
  both. ⚠ The same arithmetic makes `object-position` **y** a NO-OP at every rung
  the site is read at — the baked caption is buried by the scrim's bottom band
  or not at all.
- ⚠ **THE BED IS ROTATED AND TAKES TWO KNOBS.** `--ft-band-floor` is its EXTENT
  (G3 validates it, not the band's box) and `--ft-bed-top/-mid/-low` its weight,
  because the desktop band sits on the plate's quiet left third while the phone's
  crop frames the ring's BRIGHT BODY. One gradient family for both rungs — the
  ≤960 `background` override is deleted. ⚠ `--ft-bed-top` 0.46 puts the title at
  4.45:1 glyph-masked; 0.56 is load-bearing.
- ⚠ **THE INK GATE MASKS TO THE GLYPHS, AND ITS FIRST CUT DID NOT.** Gating on
  the darkest pixel in a text RECT reported a link at 1.36:1 on a footer that
  reads perfectly, because a 44px row's box is mostly background — a guard
  measuring a MODEL of the drawing. Two shots; a pixel that differs IS ink.
- ⚠ **`bottom >= vh` ON `#contact` COULD ONLY PASS BY LUCK.** The station is the
  document's last element, its height is fractional, and the browser ceils
  `scrollHeight`, so `bottom = vh − 1 + frac(documentHeight)`. The boundary
  spec carries one sub-pixel of tolerance; adding a 1px overscan was tried and
  bought nothing, because an integer does not change a fraction.
- ⚠ **THE STATION KEEPS ITS OWN OPAQUE `var(--void)` GROUND AND THE PLATE IS A LAYER
  INSIDE IT.** The handoff guard asserts the cover has `alpha === 1` AND a background
  image; a station whose only ground is the image fails one of the two.
- ⚠ **U1 (same day, owner: _"it looks really bad, especially in dark mode; the visual
  needs to be as full bleed as possible"_): THE PLATE IS THE STATION'S WHOLE GROUND, AND
  BOTH PLATES ARE THE HERO'S.** U0 anchored a 46svh strip to the floor and washed half of
  it out — and the reason it _had_ to be a strip was the picture: `Key Visual 14d` is
  parchment ABOVE and void BELOW, so it could only ever be shown cropped to its bottom
  half. Dark takes `Gateway_v1b` (the hero's own `<picture>`, AVIF + WebP) and light
  keeps `Gateway_v2-light`, so the page opens and closes on the same pair in BOTH themes
  — the original ask in full — at **zero extra bytes**, since the hero preloaded that
  exact file. `Key Visual 14d` retires from this surface. ⚠ That choice also DELETED a
  class of exception: a kept-dark plate needed cream ink and a dark wash pinned against
  ADR-058's swap, and U0's first cut re-pinned `--dawn-rgb` on the bar — fixing the ink
  and **silently inverting the wash**. Two plates the theme flip already handles makes
  both plain tokens, and `theme.css` needs no block for this sheet at all.
  ⚠ `display: none` + `loading="lazy"` is what stops either theme fetching the other's
  plate — **on the `<img>`, never the `<picture>`**, since source selection is part of
  the img's own deferred fetch; **no `HERO_ROUTES` row and no `fetchpriority`**, a footer
  must never compete with the hero's LCP.
- ⚠ **THE PLATE'S BOX IS THE STATION'S BORDER BOX, BY CONSTRUCTION.** The station's
  padding is declared as `--ft-pad-top` / `--ft-pad-bottom` (`max(token, mobile floor)`)
  and `.ft-foot__plate` negates exactly those, with `calc(50% - 50vw)` on the horizontal
  — the identity `.station:not(.hero)` uses for its own 100vw margin, so no bleed token
  has to track the station's inset (`--hud-content-inset` on desktop, a **32px literal**
  at ≤960). **No `overflow: hidden` on the station**: there is nothing to clip, and
  clipping there would cut into the cover choreography's stacking. ⚠ Reading the tokens
  from both sides is what makes it ORDER-INDEPENDENT — moving the padding into the footer
  instead only works because `site-footer.css` is imported after `landing.css`, whose
  `#contact.station` padding rule (12414) has equal specificity. ⚠ `.ft-foot` may never
  gain padding, margin or a border: its box IS the station's content box, which is what
  the negation is measured against. ⚠ **AND THE FLEX CHILD IS THE PORTAL'S SLOT, NOT
  `.ft-foot`** — measured, the footer's bottom sat at 781 in a 900 viewport.
- ⚠ **THE BAND IS ONE COLUMN AND THE PICTURE OWNS THE OTHER HALF (U1).** Two columns put
  the CTA at ~55 % of the band, which on a full-bleed `Gateway_v1b` is where the ring's
  BRIGHT METAL TRAIL sweeps — gold rim and 12px gold mono on near-white. The crop cannot
  fix it (±148px of slack against a ~250px collision), so the layout yields: head and ask
  stack, capped at `min(var(--band-max), 52ch)`. ⚠ **On a phone the windows go OPPOSITE
  ways** — a portrait box has no vertical slack, so `x` alone picks the slice: dark 88 %
  (the ring's body, whose bright limb sits low) and light **24 %** (the empty left third,
  because `Gateway_v2-light` is ink-on-parchment and the bed washes toward PARCHMENT
  there, so it lightens the ring instead of bedding the ink). Same rule, different
  numbers, because the two pictures put their subject in different places. ⚠ The text bed
  rotates with the column too: `to right` on desktop, `to bottom` at ≤960.
- ⚠ **`#contact` IS OUT OF THE `::before` RADIAL CADENCE (U1)** — those two washes sit at
  z 0 under a slot forced to z 1 that holds an opaque cover-fit image, so they painted
  nothing. **`#contact.station > *` STAYS**: it is what gives the slot its stacking
  context, and plate / band / bar are ordered inside it.
- ⚠ **THE BAND IS JOINED, NOT RE-INSET** (ADR-048): `margin-inline: var(--rail-inset)`,
  with only its WIDTH cut (U1's `min(var(--band-max), 52ch)`) — a fraction of the band,
  never a second inset. `--rail-inset` is 0 below the 1200px crossover, so
  a divergence is invisible at 1280×720 and 1440×800 — **measure at 1920×1247** (band
  left 357 = inset 189 + rail 168, width exactly `--band-max`). The legal bar pays
  `--hud-margin + --hud-corner-zone` of bottom padding, the two tokens the rails stop
  short on, or it runs under the brandmark and the settings cluster.
- ⚠ **A SOCIAL LINK IS EITHER REAL OR ABSENT.** `lib/site/socials.ts` is ONE record with
  two readers (the footer and the About stage, whose four links were `href="#"` too).
  `null` = decided but unpublished and renders nothing; `"#"` is a guard failure
  (`tests/lib/socials.test.ts`).
- ⚠ **"PLOT YOUR COURSE" IS DELETED** with the voidwalker terminus link that pointed at
  it (`VOIDWALKER_HEAD.next`, its render site and `.vw-foot__next`'s rules). It aimed at
  `#contact`, which is now the footer directly beneath — a "next" link to what was
  already arriving — and it was the display-aphorism shape ADR-078's copy law bans.
- ⚠ **TWO GUARDS WERE PROVING THINGS BY COINCIDENCE, AND THE DELETION EXPOSED BOTH.**
  `trinny-london-journey` asserted the variant's SECTOR total `!== READOUT_SECTIONS
.length` (6 against 7) as proof the hook reads the ROSTER — its own comment predicted
  the failure and it arrived from the other side when production came DOWN to six; the
  discriminating roster is CONSTRUCTED now. And two scroll waypoints asked for 0.3
  viewports INSIDE the cover: `#practice` was ~1 viewport of tail, and without it that
  target lands 113px past `maxScroll` at 1440×900 — `scrollTo` clamps silently,
  `waitForFunction` does not, so the smoke waited out its timeout on a page already
  exactly where it was asked to go. Both clamp. ⚠ The cover's own assertion was
  `top < 0`, a proxy that only holds while something FOLLOWS the station; the footer is
  the last viewport, so what is measured now is that an opaque station FILLS the screen.
- ⚠ **`.approach*` AND `.foot*` CSS STAY IN `landing.css`.** The first is inert; the
  second is still shipped by `/claude-workshop` and `/arcs/trinny-london/proposal` from
  their OWN prototypes, **neither of which has a visual guard on its footer**.
- **Verifying:** `node scripts/capture-site-footer.mjs --vp 1920x1247 --theme dark`
  (and `--theme light`, and `--vp 390x844`) — headed, real scrolls, and it prints the
  HUD corners' boxes against the plate's, because **nothing mechanical measures contrast
  over an image**. Since U1 it also prints `plateIsStation` (the plate's rect equals the
  station's within 1px — what fails if one side of the padding pair moves alone) and
  `plateSrc` / `heroSrc`, which must be the SAME file in dark with the hidden theme's
  `currentSrc` empty. Plus `about-voidwalker-handoff-boundaries`, the five drift guards
  (`rail-manifest` · `v7-parse` · `section-label` · `detentTable` ·
  `rail-instrument-marks`) and `mechanical.mjs --scope ".ft-foot" --prm` in both themes.

⚠ **ADR-082 U2: `#voidwalker` is the HOLOGRAM on the capable path** — a
pinned, starless transparent stage the corridor ambient survives, with the
opaque cover passing to `#practice`. Its inner reveal is reversible and
finishes a horizontal exit before sticky release; the retained ADR-081 time
tunnel is not the production composition.

**The funnel is the ADR-033 order, as amended by ADR-054, ADR-056 and ADR-074:** hero →
corridor (thesis + the Arc) → services (opening with the casefile) → about (bio) → **voidwalker (the hologram through-line — [`.claude/rules/voidwalker.md`](voidwalker.md))** → **contact (the SITE FOOTER, and the capable-path opaque cover — ADR-105; `practice` is deleted)**. The paragraph that follows is ADR-054's wording and names **proof (the
client case)** → practice → contact.
`#tools` and `#build` retired — the four production cases live ONLY on
the Arc's Build-park cases reveal (click-armed via the CUE — a dotted-leader

- label docked under the Build title, ADR-042; the node streams fold onto an
  in-canvas 3D tools card's slab edges and the card then materializes into the
  frame they made, NO camera move — see ADR-036 + ADR-041 + ADR-042). The order is owned by the parse arrays in
  `app/(marketing)/page.tsx` (`CORRIDOR_REPLACED_STATIONS` /
  `CORRIDOR_RELOCATED_STATIONS`) — never by prototype-HTML edits — in
  lockstep with `MANIFEST_ENTRIES` and the drift-guard tests
  (`tests/lib/rail-manifest.test.ts`, `tests/lib/v7-parse.test.ts`).
  `PROJECT_CASES` (`tools-cards/toolCardData.ts`) is the single canonical
  case module; the retired `#tools` STATION — its console-plate skin
  (`tools-cards.css`), its chrome and its rail register — survives only as
  the `/test/project-cards` lab's shared core and is never remounted on
  the landing. ⚠ `useStackedCardsScroll` is a different thing: a
  three-free scroll MECHANIC (sticky-sibling slots, `--pc-enter` /
  `--pc-cover`) that a variant route may drive with its own route-scoped
  skin — `/trinny-london`'s proof stack does (ADR-094) without importing
  the plate skin.

**Arc Cases is an in-canvas 3D card — no camera channel (ADR-036, supersedes ADR-035).** The cases reveal is `ArcCasesCard`, ONE in-canvas portrait tools card mounted in the gyro assembly (a sibling of `ShellStack`) between the two Build-park stack columns, in front of the sphere; the accessible stepper row `ArcCasesStepper` (◂ 01 02 03 04 ▸ + CLOSE, region id `arc-cases-terminal`) is mounted in `HomeCorridor`. On arm the sources/surfaces DOM labels fade out on `arcCasesLevelRef` (single writer = the card's R3F `useFrame` at priority −5; readers = `gateStackLabel` label fade + the caption-card fade + the stepper's own rAF + `ShellStack`, which folds the source/surface node streams onto the card's actual left/right slab side walls so the screen reads as mounted on the nodes). The ref carries the card's slab edges (`cardEdges`, shell-local — the single source of truth for that mount geometry, direct math, NO viewport unprojection / `panelRect`). The corridor camera is a pure Z dolly through arm/disarm. Gate parity: the JS `ARC_CASES_MEDIA` gate == the CSS hide of BOTH the cue and the stepper. No scroll writer, no scroll lock, no backdrop; inert is reconciled every frame; DOM order = focus order. Do NOT re-introduce a camera channel, the DOM overlay panel, or the `panelRect` unprojection latch.

**The reveal is PHASED (ADR-041, supersedes ADR-036 §3/§5); the trigger is a CUE under the Build title (ADR-042, supersedes ADR-041 §2).** ONE damped arm level, TWO ordered phases: the node fold runs on `arcFoldInput(level)` (complete at `ARC_FOLD_DONE` 0.62 — feed `arcLatchEnvelope` the BARE clamped ratio; it supplies the easing, pre-easing double-eases) and the CARD reads `arcCardPresence(level)` (`smootherstep(0.62, 1)`), published as `cardPresence` on `arcCasesLevelRef` by the same single writer. So the beat is **labels fade → nodes fold and latch → card materializes into the frame they made**; close plays it backwards. The card's material opacities / visibility / scale-in / depth-write AND the stepper's opacity+inert all read `cardPresence`, never the raw `level` — the strict invariant (`arcCardPresence === 0` while `arcFoldInput < 1`) is unit-pinned. The sphere sigil is DELETED (ADR-042): the trigger is `ArcCasesCue`, a DOM dotted-leader + label docked UNDER the Build station title (mounted as the Build `StationBlock`'s `afterContent` in `CorridorStationHeaders`; it inherits the Build header's per-frame opacity, so it writes no scroll-coupled opacity of its own). Its world anchor (`intelligence.sigil`), `gateSigil`, and `SIGIL_Z` are gone. It keeps the ADR-041 contracts verbatim: `aria-controls="arc-cases-terminal"` + `aria-expanded`, every-frame `inert` reconciliation, stable callback ref, and the auto-disarm watcher. It arms only once the notes have SETTLED (`sigilSettle`, `ARC_SIGIL_SETTLE` [0.70, 0.84] on the smoothed stack — **measured against the live corridor; re-measure before retuning**); below the gate it is `inert` and CSS fades it out (`.is-armable`, toggled by its rAF). Because it sits at the TOP of the viewport, clear of the centred card, it **stays visible AND interactive while armed** (a second click / Escape closes it; Escape refocus falls out for free — it was never inert) — no phantom-click guard, no fade-to-0/pointer-events drop. The stepper ✕ CLOSE stays. Do NOT retune `ARC_BAND_IN` to "fix" its stale stack comment — the park (0.9225) sits below the accretion peak (0.95), so raising it would gate the card off entirely; sequencing is enforced on the trigger instead. In Playwright the cue rides the Build header's gyro parallax, so `locator.click()` can still flake ("element is not stable") — click at its box centre via `page.mouse.click`.

**#about is the pinned deck-flip stage (ADR-047; the ADR-046 cartridge
dock is REMOVED).** Across the services exit clock the four WebGL cards
STACK into a deck (azimuth sweep — never a Cartesian lerp; math in
`lib/services-ring/aboutDeckMath.ts`, exact identity at exit 0); the
pinned TRANSPARENT `#about` stage (250svh runway, `AboutStagePortal` →
`[data-about-root]`) then FLIPS the deck π on X to the shared portrait
back face (back planes carry `rotation.x = π` — Rx(π)∘Rx(π) = identity,
upright/unmirrored; the bake's chamfer chrome is MIRRORED to match the
flipped slab) and the deck lands on `.about-stage__slot`
(`aboutSlotRef`, viewport-first per frame). Beat 1 translates the cluster
right (the DOM owns the motion; the deck follows the rect) while the copy
reveals via scrubbed `--ci-off` stagger (never `useRevealMotion` — portal
nodes are unobserved and `.is-in` is one-shot); the EXIT beat then slides
the copy column LEFT + the cluster (deck welded to its slot) RIGHT
off-screen on `--about-exit` over the live corridor bed (ADR-047 Update 8
— NO fade-to-void-shield; `#continuum`'s `--continuum-bg-in` tail is the
lockstep cover, and the mark re-inks DURING the slide via
`continuumFormT`). Two clamped clocks
(`exitProgressForRunway` + `aboutStageProgressRef`), single writer
`useAboutStageScroll`; the corridor ambient SURVIVES through #about AND the
capable #voidwalker hologram and dies at `#practice` (ADR-082 U2; gate keyed to the SAME rect as
the fade envelope — the ADR-030 seam-cut bug). Fail-opaque shield
(`--about-bg-in`, default 1 — written 0 for the whole engaged life now,
restored only via the disengage var-clear) + fail-static attribute
(`data-about-mode` absent ⇒ static `.voidwalker` + ADR-045 emerge —
mobile/PRM/fallback/flag-off). Flag: `ABOUT_DECK_STAGE`. Paint-stack rows
4c–4e in ADR-008. Every disengage path must clear `data-about-mode`
(including the media-flip null-render — the hook disengages when its
stage ref goes null).
⚠ **ON THE PHONE RUNG `#about` IS A BAND SINCE ADR-115 (2026-09-20)** —
`AboutStage` mounts `AboutBand` there instead of the stage: the parsed
`.voidwalker` block becomes a sticky 100svh band inside a 240svh station
(name · role · the portrait's seat · ¶1 · the rest behind a chevron), welded
to the services band by `-100svh`, the ring's deck stacking on the services
exit and flipping to the portrait on the band's clock, handing over to a DOM
image of the same bake before the band unpins. The prototype carries the
`.voidwalker__more` button, the `.voidwalker__rest` wrapper, the portrait
`<picture>` (phone source = the bake's own photo) and two snap targets; all
of it is `display: contents` / `none` off the rung, so the desktop and the
PRM/fallback about are byte-identical. The orbit cluster and its ADR-045
emerge are `display: none` on every ≤960 rung (his "remove the parallax
section"). Rules: `mobile-sections.md` §11.

**Proposed About→Voidwalker portrait handoff — unshipped/unpushed, pending visual
approval.** Only the capable path (`min-width: 1101px`, motion allowed, flags
active, live corridor) may overlap `#voidwalker` by `-120svh`, creating a
shared `20svh` pin seam. This is layout only: the `#about` and `#voidwalker`
station wrappers never animate; contained actors own every reveal/glitch.
`ServicesCardRing` is the sole portrait-transform owner and reads a Three-free
viewport-seat ref inside the existing canvas. The portal atomically publishes
portrait, FACTS-dossier and era-title targets only — no duplicate portal
transform, no revived `--about-portal`, no second canvas, and no
Three/Fiber/Drei import into the landing DOM graph. About's name and dossier
are sibling transform actors under a layout-only shell. Proposed windows:
entry `[0, .14]`, renderer/title takeover `[0, .08]`, existing exit
`[.74, .96]`. At 961–1100 and on mobile/PRM/corridor-fallback/flag-off paths,
the boundary stays normal-flow.

**The left-rail manifest is parse-injected (ADR-031).** Its skeleton is
built at parse time (`lib/v7-parse/railManifest.ts`) into the authored
`<nav data-rail-manifest-root>` shell; `RailManifestController` mutates
it in place. Never `createRoot` into `[data-rail-manifest-root]` (it
clobbers the server skeleton); keep the shell markup in the prototype
HTML byte-exact (the parse regex + `tests/lib/rail-manifest.test.ts`
pin it); journey order lives in `lib/rail-manifest/entries.ts` under a
drift-guard test. The marker detent (Update 9 diamond) is a 350ms `top`
glide gated behind `data-ready`, and its position is a pure function of
`activeIdx` into a layout-computed detent table — never scroll-scrubbed,
no new scroll writers (recompute the table on resize/layout only). The
13-tick ladder always stays (ADR-031 Update 2).

**⚠ THE JOURNEY INDICATOR IS THE NAV-CORNER READOUT (ADR-055,
2026-07-28, owner) — the left/right section menus are DELETED.**
`CorridorSectionMenu`, its CSS and `lib/home-v2/terminalReveal.ts` are
gone (they only existed above `1101×760`, so laptops and phones had no
indicator at all). `HudNav` now carries a section readout that is ALSO
the drawer trigger, on every viewport. Contracts:

- **Source:** `useActiveSection` → `resolveActiveIdx` (the shared
  resolver) → `sectionReadout` (`lib/rail-manifest/sectionLabel.ts`).
  No new scroll writer — a MutationObserver on the `<html>` bus plus one
  passive listener gated on `idx <= LAST_CORRIDOR_IDX` for the seam rule.
- **The Arc is ONE row.** All four corridor phases map to `THE ARC`;
  there are NO subsections anywhere. That collapse is what makes the
  hero→corridor seam flicker-free (three indices, one string, and
  `queueScramble` no-ops on equal text). Unit-pinned in
  `tests/lib/section-label.test.ts`.
- **`.hud__nav__sector__name` is rendered CHILDLESS and written only
  imperatively.** Give it a React child and the decode stops firing
  silently (React commits the label first, so `from === to`).
- **`captionScramble` only.** Never `scrambleText`-style capture-restore
  on this node (ADR-031 U21).
- **`.bars` stay** as the trigger below 641px pre-collapse and on
  `/claude-workshop` (whose station order is not the manifest's).
- **`HudNav` state stays LOCAL** (nested-root safety) and it remains the
  only writer of `.hud__brand.is-collapsed` — the ADR-043 wordmark dock.
- The desktop detent diamond stays hidden (ADR-031 U20), now because the
  corner serves every viewport. The 13-tick ladder always stays.
- ⚠ `/arcs` HAD its own reel (`ArcMenu`, same gate, same complaint); it is
  DELETED (ADR-073) and the arcs mount the corner readout instead —
  porting the readout there is an open follow-up, not an oversight.

**⚠ The hero curtain CLIP-UNCOVERS the frame chrome (ADR-031 Update 16
rev c, 2026-07-19, owner):** the corner brackets + both rails
(tracks/ticks/labels/manifest/diamond) are REVEALED by the hero sliding
over them — a spatial clip, NOT an opacity fade, NOT a z-index pop. Each
frame element clips ONLY its top edge to the hero's bottom edge:
`.hud__rail`/`.hud__corner--tl`/`.hud__corner--br { clip-path: inset(max(0px,
calc((1 − var(--hero-lift))·100dvh − <its own top offset>)) <sides>) }`
(rail top `--hud-rail-y-start`, TL corner `--hud-margin`, BR corner
`margin + corner-zone − lift·100dvh`). The RAIL's side/bottom insets MUST be
negative (`−100px`) — its tick marks + manifest diamond OVERHANG the rail box
~21px, so `0` sides clip them off (the bug the ticks vanished from). `--hero-lift` is the hero's LINEAR
off-screen fraction (`scrollY/vh`) written by the SAME single
`useLandingScroll` writer as `--hero-cover` (no new writer, ADR-002; NOT
the smootherstep `--hero-cover` — the clip edge must track the hero's 1:1
scroll). The inset saturates to 0 once the hero is gone (`lift → 1`), so
NO `data-corridor-entry` gate / past-curtain rule is needed; reduced-motion
just `clip-path: none`. WHY per-element and not a whole-`.hud` clip: the
WORDMARK (`.hud__brand`) must stay VISIBLE on the hero, and a parent clip
clips all descendants — so `.hud` itself is un-clipped and the wordmark
docks into its corner via the EXISTING `.hud__brand.is-collapsed` scale
(HudNav, 50vh). WHY not z-index: `.hud` sits OUTSIDE the `.stations` (z 10)
stacking context, so any z is entirely under or over the sections — a
z-swap always pops (rev a's failure). Top-right nav (`.hud-nav-overlay`,
separate z 60) untouched. Supersedes Update 9's "diamond visible from the
hero" + the rev-0 fade / rev-a z-swap / rev-b whole-`.hud`-clip drafts;
`cornerDraw` retired. "The ladder always stays" now means: in the DOM at
every beat, UNCOVERED everywhere except the hero. Do NOT reintroduce a
fade, a z-swap, or a whole-`.hud` clip (it hides the wordmark). That the
top-right nav is exempt from all of this is why ADR-055 could put the
journey readout there with no curtain choreography at all.

**⚠ A RAIL NEVER TOUCHES A CORNER MARK OR A LOGO (ADR-043, 2026-07-16, re-
affirmed 2026-09-15 — a connected version shipped for one morning each time
and was rejected on sight both times).** The rails stop `clamp(16px, 1.8vw,
32px)` short of the TL bracket's foot and of the bottom corner band (the
settings cluster, the wordmark); the site's top-right is the nav and carries
no bracket. Both rail ends are TOKENS — `--hud-rail-y-start` and
`--hud-rail-y-end` in landing.css — read by `.hud__rail`, the casefile's
`--fl-rail-bot`, both labs and the panel-lab script; never a second literal
copy of either. The 0% / 100% ticks sit FLUSH at the rail's ends via
`translate` on `:first-child` / `:last-child` of `#leftTicks` /
`#rightTicks` (what "not properly connected" ever meant). Any change to the
frame's geometry is shown to the owner as a STILL before it is offered, and
every still is read for chrome-over-mark overlaps before it ships.

**The left rail is a single detent diamond (ADR-031 Update 9, supersedes
the Update 3/6/7/8 rolodex; Update 12 supersedes it ON DESKTOP).** The
rail DISPLAYS one gold diamond (12px,
`.rail-manifest__diamond`, centred on the 2px rail track) that snaps to a
detent per journey entry — EVERY `MANIFEST_ENTRIES` row plus future
interstitials, at BEAT granularity in the corridor: hero → thesis →
**Navigate → Encode → Build** → services → about → continuum → practice
→ contact (the single "arc" entry is retired; the diamond follows the
corridor's structure, not just section boundaries). Do NOT re-add the
rolodex reel, the 3-pillar roster, per-row buttons, or the terminal
selection bar. Detent positions are scroll-PROPORTIONAL (each entry's
real scroll offset normalized 0..1 via `detentTable.ts` +
`scrollTargetForEntry` in `clickToNavigate.ts`; the corridor beats sit at
their parks — paintProgress × EPILOGUE_START → fractions 0.30/0.48/0.70),
recomputed on mount/resize/`ResizeObserver` only — the position write
(`--rail-diamond-top`) stays a pure function of the active index; do NOT
scroll-scrub it or add a per-frame scroll writer. The active corridor
beat comes from `data-corridor-phase`, which now publishes
`thesis|navigate|encode|build` (single writer: the CorridorStationHeaders
RAF, hand-offs `CORRIDOR_BEAT_ENTER` 0.2/0.48/0.78 — MIRRORS
CorridorProgressRail's STAGES band starts, keep in lockstep). The diamond
is visible from the hero (owner; SUPERSEDED twice — by Update 16, which
made the whole rail hero-dormant so the diamond first showed at section 2,
then by **Update 20 (2026-07-20, owner): the diamond is hidden on the WHOLE
desktop gate, unconditionally** — the U12 hide used to enumerate phases and
left it painting alone in section 2, since the menu drops hero/thesis too.
Desktop = tick ladder only since ADR-055 retired the menu — the diamond
still survives ONLY below `1101×760`, controller untouched. Do NOT re-add a
phase/station enumeration to that media block). On
hover/focus it reveals the active
entry's title via a hidden `.rail-manifest__title` chip, gated on
`data-has-title`; `manifestTitle(entry)` (`entries.ts`) is `null` for
`hideActiveName` (hero) or a blank `name` (interstitials), so those
reveal nothing. `RAIL_ROWS`/`glyph` are REMOVED. A separate loadout bay
was tried and retired (Update 5) — do NOT reintroduce
`RailLoadout`/`data-rail-loadout-root`.

**⚠ The Arc register is RETIRED (Update 12), and so is the menu that
replaced it (ADR-055):** the Arc's Navigate/Encode/Build live on NO rail
and in NO menu — the corner readout names the Arc as one section and
there are no subsections anywhere. `CorridorProgressRail` stays unmounted
(kept on disk for rollback). The "sub-items on the right" half of the
uniformity contract below is history; the paragraph stays for context +
the Services/SOURCE-BUS lineage. Do NOT remount `CorridorProgressRail`.

**Rail uniformity — each pillar: name on the left, sub-items on the
right (ADR-031 Updates 7–8; the Arc's right register RETIRED by Update
12).** During the Arc the right rail carries
Navigate/Encode/Build via `CorridorProgressRail` (a right-rail register
styled like `.tools-rail-register`, header `THE ARC · 03`), and
Services shows `SOURCE BUS · 04` via `ServicesRailRegister` (the
services half of the retired ToolsRailRegister — ADR-033; it mounts
into the legacy-named `[data-tools-rail-root]` slot, CSS in
`services.css`). About carries no register yet (follow-up candidate).
Do NOT move the Arc register back to a top-centre breadcrumb; pure read
of `paintProgress`, no new scroll writer. **Both registers share one
grid (Update 8):** they hang off mid-rail via
`calc(50% ± n·var(--rail-register-pitch))` (NOT the old
33.3/41.7/50/58.3%vh gauge), centred on the viewport midline
(`--rail-register-pitch` in `variables.css`). Keep the Arc and Services
registers on the SAME token — tighten/space them together, never one
alone. **Active signature = underline** (Update 8): the active row is
marked by a gold `text-decoration` underline (both registers), NOT a
filled diamond — the diamond markers stay passive outline ticks. (The
LEFT rail is now the Update 9 travelling detent diamond, not the terminal
rolodex — the two rails are still a deliberate pair, but the left's mark
is the single gold diamond, the right's is the register underline.)

**Process**

- Before non-trivial changes: [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) (Cycle B if adding a section; Cycle A after fixes).
- After any non-trivial fix: same file, Cycle A checklist.
