# ADR-105: The page ends on a bold footer, and `#practice` is deleted

- **Status:** Proposed (2026-09-15) — shipped and guarded. **Update 1 (same day, owner's
  live read) makes the plate full bleed; see the Update at the foot.**
  ⚠ **Update 4 (2026-09-24) is the live ending: the footer rises OVER the pinned
  musings list, and Update 3's bed is deleted.**
- **Surface:** the homepage's ending — `#voidwalker` → `#contact`
- **Supersedes:** ADR-056's `#practice` breather (deleted) and the parsed `.contact` /
  `<footer class="foot">` markup. ADR-030 §6's cover lockstep is re-pointed, not repealed.
- **Rules:** [`.claude/rules/landing-v7.md`](../../.claude/rules/landing-v7.md),
  [`.claude/rules/voidwalker.md`](../../.claude/rules/voidwalker.md)

## The ask

Owner, 2026-09-15, in the same breath as bringing the site online:

> After the era section, we still have a sort of parallax section sliding over it.
> That shouldn't happen. I think once you slide out of the era section, we should have
> maybe a super simple slick contact form. The footer: I don't think we need "Plot Your
> Course" or the current footer. Maybe we can use one of our key visuals for the footer.
> That way it's nicely aligned with our hero section … I would put the contact form
> there as well, along with some links to my socials. That way we can combine the
> contact form and the bold footer.

## What was actually there

Three things, and only the first was obvious:

1. **`#practice` — an EMPTY station.** Its one child (`approach`) is stripped at parse
   time, so what shipped was a bare shell. Its only remaining job was to be the opaque
   COVER that ends the WebGL corridor ambient, because `#voidwalker` in hologram mode is
   a pinned TRANSPARENT stage. **That blank shell sliding up over the era stage is the
   "parallax section" the owner saw** — it is not a parallax at all.
2. **"Plot your course."** was the `#contact` station's display title, with the
   voidwalker foot linking to it as `Next · Plot your course ↓`.
3. **`<footer class="foot">`** — brandmark, "Navigate intelligence.", and
   `Twitter / LinkedIn / GitHub` **all three `href="#"`.**

All three were parsed out of the v7 prototype HTML. None was React.

## The decision

`#voidwalker` → **one** footer: a key visual bleeding up from the floor, the ask, the
contact form's slot, and the socials, on a legal bar over the plate. Composition is the
Zellic reference the owner supplied. `#practice` is deleted and the footer inherits its
cover role.

```
┌──────────────────────────────────────────────────────┐
│ ·· CONTACT                                           │
│ Navigate intelligence         [ START A CONVERSATION ]│
│ with your team.                 hello@thoughtform.co  │
│ One sentence.                                         │
│ ░░░░░░░ the key visual bleeds up from the floor ░░░░░ │
│ ──────────────────────────────────────────────────────│
│ ◇ Thoughtform · 2026                    in  x  ig  yt │
└──────────────────────────────────────────────────────┘
```

## Why it is built this way

### ⚠ IT KEEPS `id="contact"` AND STAYS A `<section class="station">`

Four things read that, and a `<footer id="contact">` falls out of all of them: the
rail-manifest drift guard matches `<section … data-station="…">` over the body HTML
**string**; `useLandingScroll` collects `.station`; the mobile padding floor keys on
`#contact.station`; and the corridor's cover rule is a `~` SIBLING selector, which also
means the footer must stay inside `<main class="stations">`. `role="contentinfo"` goes
on the React root instead — a `<footer>` nested in a `<section>` is not `contentinfo`
anyway. Keeping the id also keeps the HUD's bottom-right Contact control resolving, and
means **only `practice` leaves the manifest**.

### ⚠ IT IS A PORTAL INTO AN AUTHORED SHELL — THE HOUSE PATTERN, A FOURTH TIME

`#about` carries `[data-about-root]` and `#voidwalker` carries `[data-voidwalker-root]`;
`#contact` now carries `[data-site-footer-root]` and `SiteFooterPortal` mounts into it.
Two prototype edits (gut the station, delete the trailing `<footer>`) and one portal.

⚠ **The existing machinery could not strip the footer bar.**
`removeStationsFromBody` only matches `<section|div … id="X">`; that element had no id,
was neither tag, and sat **outside** `<main>`. It had to go from the source. Editing the
prototype fires no HMR — hard-reload after.

⚠ **`contact` may NOT join `removeStations`**: that list also rewrites every
`href="#<id>"` to the corridor mount, which would strip the id being kept.

⚠ **AND THE NESTED ROOT IS WHAT WILL KEEP THE FORM SAFE.** `LandingPage` hosts every
nested root, and a re-render of it re-applies the innerHTML and **orphans them all — the
services cards vanish with no error**. A controlled input re-rendering on every keystroke
would be exactly that. Inside its own root, the form's state cannot reach `LandingPage`.

### ⚠ THE COVER LOCKSTEP MOVES IN ONE COMMIT (ADR-030 §6, recorded a sixth time)

`home-v2.css`'s `~ #practice` rule, `useCorridorExitScroll`'s `practiceEl` query and
`landing.css`'s `content-visibility` opt-out all name `#contact` now. Splitting them
hard-cuts the canvas at one of their edges. The opt-out moved with a NEW reason: both
halves of the lockstep key on the cover's RECT, and a 100vh placeholder for a
1–2 viewport footer puts the kill edge where the reader is not (`mobile-sections.md` §4
measured that lie at 360px on the old `#contact`).

### ⚠ THE STATION KEEPS ITS OWN OPAQUE GROUND; THE PLATE IS A LAYER INSIDE IT

The handoff guard asserts the cover has `alpha === 1` **and** a background image. So
`.station:not(.hero)`'s `var(--void)` + stars are untouched and the key visual is an
absolutely-inset layer. A station whose only ground is the image fails one of the two.

### ⚠ THE PLATE IS PER THEME, AND ONE KEPT-DARK IMAGE WAS TRIED FIRST

The owner picked `Key Visual 14d` — parchment above, void below — and bleeding its VOID
half up is right in dark. **In light it cost the FRAME two readings:** the right rail's
`LOCAL` label and the bottom-left brandmark are dark ink, they are FIXED at z 60, and
they print over whatever is beneath them (ADR-043). On the still `LOCAL` was gone and
only its gold value survived. Light takes the hero's own `Gateway_v2-light.webp`
instead — which is also the closest reading of _"aligned with our hero section"_: the
page opens and closes on the same pair.

⚠ **AND THAT CHOICE DELETED AN ENTIRE CLASS OF EXCEPTION.** A single kept-dark plate
needed two values pinned against ADR-058's swap — cream ink for the bar sitting on it,
a dark wash under that ink — and the first cut re-pinned `--dawn-rgb` on the bar, which
fixed the ink and **silently INVERTED the wash**: it lightened the plate's foot in light,
against the very ink it was there to bed. With light on a light plate the bar's ink IS
the page's ink and the wash IS the page's ground, both plain tokens, and `theme.css`
needs no block for this sheet at all. **The exception was not tuned away; it stopped
existing.**

⚠ `display: none` + `loading="lazy"` is what keeps each theme from fetching the other's
plate (theme.css:950-968's recipe), and there is **no `HERO_ROUTES` row**: a footer is
below the fold and must never compete with the hero's LCP.

### ⚠ THE STATION GIVES UP ITS BOTTOM PADDING, THROUGH THE TOKEN AND A `max()`

`.station`'s base is a literal `140px 0 220px`, so the plate's floor sat 220px above the
page's last pixel and the key visual **floated in a band of void** — the one thing the
reference does not do. landing.css's own note says why the replacement is written with
`max()`: a station's padding at id specificity outranks the ≤960 mobile chrome floor
outright, with no pixel change to say so, so the floor is reproduced rather than opted
out of.

⚠ **AND THE FLEX CHILD IS THE PORTAL'S SLOT, NOT `.ft-foot`.** The station is a centring
flex column and what it lays out is the authored `[data-site-footer-root]` div, with the
footer one level inside. A `flex: 1` on `.ft-foot` grows nothing — measured, the footer's
bottom sat at 781 in a 900 viewport and the plate floated with it.

### ⚠ THE BAND IS JOINED, NOT RE-INSET, AND THE BAR CLEARS THE HUD

`max-width: var(--band-max); margin-inline: var(--rail-inset)` — ADR-048, and ADR-099
U1's own finding. ⚠ `--rail-inset` is 0 below the 1200px crossover, so a divergence here
is invisible at 1280×720 and 1440×800 and shows only around 1920, which is the owner's
window. Measured there: band left 357 = `--hud-content-inset` 189 + `--rail-inset` 168,
width exactly `--band-max`.

The legal bar pays `--hud-margin + --hud-corner-zone` of bottom padding — the same two
tokens the rails stop short on (ADR-043) — because with the station's bottom padding
gone it would otherwise run straight under the brandmark and the settings cluster.

### ⚠ A SOCIAL LINK IS EITHER REAL OR ABSENT

`lib/site/socials.ts` is one record with two readers (the footer, and the About stage's
identically dead list). `href: null` means the channel is decided and the URL has not
landed — the renderers skip it, so the page is CORRECT while the record is incomplete.
`"#"` is a guard failure. **The four URLs are the one input this ADR is still waiting
on**; filling one in lights it in both places at once.

## What the deletion of `#practice` cost, and what it found

One commit: `page.tsx`'s `CORRIDOR_REPLACED_STATIONS`, the manifest's union and row,
`HudNav`'s hardcoded drawer item (parse-time cleanup cannot reach it — that file's own
comment warns of exactly this), `clusters.ts`'s prose, `landing.css`'s three rules, and
~185 lines of dead `#practice` choreography in `LandingPage` that had early-returned on
every production render since ADR-021. The brandmark journey's `practiceEl` and `orbit`
keyframe are left: both are null-guarded and the orbit's anchor was already absent, so
they degrade exactly as they already did.

Two guards had been proving things by coincidence, and both are now proving them
directly:

- ⚠ **`trinny-london-journey`'s SECTOR denominator.** It asserted the variant's roster
  length `!== READOUT_SECTIONS.length` — 6 against 7 — as proof the hook reads the ROSTER
  rather than production. Its own comment predicted the failure ("if a future variant
  happened to have seven rows, the bug would be invisible again"), and it arrived from
  the other side: deleting the `practice` row brought production DOWN to six. The
  discriminating roster is CONSTRUCTED now, so neither side moving can blunt it.
- ⚠ **Two scroll waypoints past the end of the document.** `#practice` was ~1 viewport of
  tail; without it, "walk 0.3 viewports inside the cover" lands 113px past `maxScroll` at
  1440×900 (measured). `scrollTo` clamps silently and `waitForFunction` does not, so the
  smoke waited out its whole timeout on a page already exactly where it was asked to go.
  Both helpers clamp now.
- ⚠ **And the cover's own assertion was `top < 0`** — a proxy for "the walk got inside"
  that only holds while something follows the station. The footer is the last viewport,
  so its top rests at exactly 0. What the ambient's death actually depends on is that an
  opaque station FILLS the screen, and that is what is measured.

## Guards

- `about-voidwalker-handoff-boundaries` — the cover is `#contact`, opaque, and fills the
  viewport when the corridor dies. 8/8.
- `rail-manifest` · `v7-parse` · `section-label` · `detentTable` ·
  `rail-instrument-marks` · `voidwalker-data` — the drift lockstep, all re-pointed.
  ⚠ `rail-manifest`'s hand-copied `PRODUCTION_PARSE_OPTIONS` moves with `page.tsx`; it is
  a copy of the thing whose whole job is to fire when the two disagree.
- `socials.test.ts` — **new**: no `"#"`, absolute `https` or `null`, the four channels.
- `type-material-tokens` + `theme-css-sweep` — `site-footer.css` is registered in BOTH at
  zero, authored token-only from line one. (`proof-stack.css` sat in neither for a week
  while its own header said it was in both.)
- `mechanical.mjs --scope ".ft-foot" --prm` — **PASS in both themes**. ⚠ It first reported
  five `fonts` failures on the WRAPPERS, which inherit `--font-mono` (IBM Plex Mono,
  ADR-067's standing trap) while lettering nothing; `.ft-foot` declares the prose face
  now, so anything added under it inherits the right one.
- `scripts/capture-site-footer.mjs` — **new**, and it is the one that matters: nothing
  mechanical measures contrast over an IMAGE. Headed, real scrolls, and it prints the HUD
  corners' boxes against the plate's.

## Left open

- **The contact form.** Decided with the owner: a Supabase row AND an email, so a
  delivery failure cannot lose the lead. Needs `RESEND_API_KEY`, which does not exist on
  this machine. Until then the ask is answered by the mail CTA and the page has a correct
  ending either way. The CSP already admits it — `form-action 'self'`, `connect-src
'self'` — and the route is same-origin by design, which is the proof.
- **The four social URLs.**
- **`landing-page.spec.ts`'s percentage-scroll snapshots** re-shoot: the document lost a
  viewport and gained a footer. ⚠ `seam-practice-to-about.png` names a station that no
  longer exists and wants renaming. ⚠ `-g "HUD"` must pass WITHOUT `--update-snapshots` —
  those are element-scoped and are the proof the chrome did not move.
- **`.approach*` and `.foot*` CSS stay in `landing.css`.** The first is inert (its markup
  is stripped); the second is still shipped by `/claude-workshop` and
  `/arcs/trinny-london/proposal` from their OWN prototypes, **neither of which has a
  visual guard on its footer** — the breakage would be invisible until someone looked.
- **`sectionGlyphs`' `practice` drawing** is now a glyph with no station and no seat, the
  first of its kind. A candidate for deletion once the footer has been read live.
- **The right rail's `LOCAL` label over a busy part of the plate** is marginal in light.
  The hero has the same condition under the same rails; named rather than chased.

---

## Update 1 — the plate is the station's whole ground (2026-09-15, owner)

> It looks really bad, especially in dark mode; the visual needs to be as full bleed as
> possible.

He read it live against his own reference folder (Zellic, Lighthouse, Meridian, GIC NY,
Eclipsera) and footer.design. **Every one of them makes the image the footer's GROUND**;
this one made it a band at the floor.

### Why it read as a strip, and only one of the four reasons was the CSS

1. `.ft-foot__plate` was `height: clamp(300px, 46svh, 620px)` anchored `bottom: 0`.
2. ⚠ **`Key Visual 14d` IS PARCHMENT ABOVE AND VOID BELOW**, so it could only ever be
   shown cropped to its bottom half (`object-position: center bottom`) — **the plate was
   a strip because the picture could not be anything else.** Choosing a half-and-half
   plate is what forced the band; the height was downstream of it.
3. The scrim ran `void → .62 @20% → 0 @56%` plus a `.72` bottom band: over half the
   picture washed out.
4. The station's own `--void` + stars sat above the plate's top edge in a different
   black — a visible tonal seam, with the ring floating in the gap.

### The decision

**Both plates are the hero's now.** Dark takes `Gateway_v1b` (the hero's own
`<picture>`, AVIF + WebP) and light keeps `Gateway_v2-light`. `Key Visual 14d` retires
from this surface.

⚠ **THIS IS THE ORIGINAL ASK ARRIVING IN FULL** — _"nicely aligned with our hero
section"_. U0 delivered half of it: light was already the hero's plate, dark was not.
Now the page opens and closes on the same pair in **both** themes, the dark plate costs
**zero extra bytes** (the hero preloaded that exact file, so it is a cache hit), and
`Gateway_v1b`'s composition is the reference's composition — the ring right-of-centre
over deep void, its trail running out to the **left third, which is where the copy
sits**.

### The geometry: the plate's box IS the station's border box

```css
#contact.station {
  --ft-pad-top: max(var(--station-pad-top), var(--mobile-chrome-top, 0px));
  --ft-pad-bottom: max(var(--station-pad-bottom), var(--mobile-chrome-bottom, 0px));
  padding-top: var(--ft-pad-top);
  padding-bottom: var(--ft-pad-bottom);
}
.ft-foot__plate {
  top: calc(-1 * var(--ft-pad-top));
  bottom: calc(-1 * var(--ft-pad-bottom));
  left: calc(50% - 50vw);
  right: calc(50% - 50vw);
}
```

⚠ **THE PADDING IS DECLARED AS TOKENS SO THE PLATE CAN READ IT BACK, AND THAT IS WHAT
MAKES IT ORDER-INDEPENDENT.** The obvious alternative — `#contact.station { padding-top:
0 }` with the air moved into `.ft-foot__band` — works on `/` only because
`site-footer.css` is imported **after** `landing.css` in `page.tsx`, so it beats
`landing.css:12414`'s `#contact.station { padding-top: max(--station-pad-top,
--mobile-chrome-top) }` at equal specificity on source order alone. Any surface that
imports in another order silently re-inserts the mobile chrome band above the plate.
Reading the same two tokens from both sides cannot do that: whichever declaration wins,
both evaluate to the same value and the plate negates exactly it.

⚠ **NO `overflow: hidden` ON THE STATION.** The plate lands on the station's edge **by
construction**, so there is nothing to clip — and clipping there would cut into the
cover choreography's stacking. The containing-block chain is what makes this exact:
`.station` → the slot (`flex: 1 1 auto; align-self: stretch`) → `.ft-foot` (same), so
`.ft-foot`'s box **is** the station's content box. ⚠ `.ft-foot` may therefore never gain
padding, margin or a border of its own.

⚠ **`--ft-bleed` IS DELETED, AND WITH IT A LOCKSTEP.** It tracked the station's
horizontal inset, which is `--hud-content-inset` on desktop but a **32px literal** at
≤960 (`landing.css:2430-2433`, not `--hud-content-inset`'s `clamp(24px, 6vw, 40px)`) —
so the sheet carried its own copy of that literal on its own rung, and the two had to
move together. `calc(50% - 50vw)` is the identity `.station:not(.hero)` already uses for
its own 100vw margin: 50 % of a box that is `(100vw − 2·pad)` wide, minus 50vw, is
exactly `−pad` on **every** rung, whatever the pad is. One expression, no rung.

### ⚠ THE BAND GAVE UP ITS SECOND COLUMN, AND THE CAPTURE IS WHAT SAID SO

The two-column band put the CTA at ~55 % of `--band-max` — which on a full-bleed
`Gateway_v1b` is **exactly where the ring's bright metal trail sweeps through**. The
first still had a `--gold-line` rim and 12px gold mono sitting on near-white. Shifting
the crop cannot fix it: at 1920×1247 the plate is height-bound with ~297px of horizontal
slack, i.e. ±148px against a collision ~250px wide. So the **layout** yielded — head and
ask stack in one column capped at `min(var(--band-max), 52ch)`, and the ring gets its
half uninterrupted.

That is also what the reference set does (one copy block, the picture whole), and it is
the durable form: a two-column band re-opens the same collision at any viewport where
the crop lands differently, and nothing measures type against a photograph.

### ⚠ THE MOBILE WINDOWS GO OPPOSITE WAYS, AND THAT IS THE PLATES' DOING

A portrait box has **no vertical slack** — cover scales the landscape plate to the box's
HEIGHT (390 of ~1500px), so the `y` term does nothing and the visible 26 % slice is
picked by `x` alone.

- **Dark 88 %.** The first cut took 78 %, framing the ring's upper-left _approach_ —
  which is its bright trail, and it ran straight through the lede and the CTA. 88 %
  frames the ring's **body**, whose bright limb is low, under the copy rather than
  through it.
- **Light 24 %.** The opposite end, because `Gateway_v2-light` is ink-on-parchment: its
  dark mass is the ring at centre-right and its quiet ground is the empty left third
  above the horizon. ⚠ **And in light the bed cannot rescue it** — the scrim washes
  toward `--void-rgb`, which ADR-058 swaps to PARCHMENT, so it lightens the ring instead
  of bedding the ink. The rule is the same on both rungs (put the copy on quiet ground);
  the numbers differ because the pictures do. The cost is named: at 24 % the phone shows
  the horizon and the drafting marks rather than the ring. On a 390px column the title is
  full-bleed width, so any ring intrusion lands on it — legibility takes the rung.
- ⚠ **The bed ROTATES with the column too.** Desktop copy is the left third and the bed
  runs `to right`; on a phone the band is full width at the top, so a horizontal bed
  washes the wrong half. The ≤960 rung restates it `to bottom`, with its stops read off
  the band's measured box (it ends at ~49 % of the station at 390×844) rather than
  guessed.

### The scrim: three layers, one job each

A top feather (6→16 %) welding the plate into `#voidwalker`'s void above; a **directional
bed** (`to right`, .42 → 0 at 60 %) under the copy column only; a bottom band
(.78 → 0 at 30 %) for the legal bar and the HUD's fixed bottom corners. The stops mirror
`.hero__video__overlay` one notch lighter — the dark plate's left third is already
near-black. Still `--void-rgb`, never `--void-deep-rgb` (U0's reason holds: light
resolves that to a different parchment and re-tints a plate that was already correct).

### What else the pass found

- ⚠ **`#contact.station::before` HAD BEEN PAINTING NOTHING.** The alternating radial
  atmosphere (`landing.css:2458`) sits at z 0 under a slot forced to z 1 — which since
  U0 holds an opaque cover-fit image. Removed from the cadence; **`#contact.station > *`
  STAYS**, because that is what gives the slot its stacking context and the plate / band
  / bar are ordered inside it.
- ⚠ **AN UNTERMINATED COMMENT HAD SWALLOWED ITS OWN DECLARATION'S PROSE.** site-footer.css
  opened a `/*` inside an already-open block; the outer `*/` closed both, so the
  paragraph explaining `--ft-plate-h` was dead text while the declaration under it was
  live. Fixed in passing — and `--ft-plate-h` is deleted anyway.
- ⚠ **TWO COMMENTS CLAIMED A theme.css BLOCK THAT NEVER EXISTED.** Both said the bar's
  ink was "re-pinned in theme.css on this element"; `grep ft-foot theme.css` is empty,
  and this ADR's own U0 text says the exception stopped existing. Deleted. A comment
  describing a mechanism that was removed during the same pass is the durable half of
  this finding.
- The light plate's intrinsic dimensions in the TSX were **2880×1620**; the file is
  **2912×1632**. Harmless under `cover`, wrong in the markup.

### Guards

Unchanged and still green by design: the handoff guard still reads `#contact`'s **own**
computed style (`alpha === 1` + a background image), which the plate does not touch —
that the plate covers those pixels is irrelevant to the assertion, and the station's
opaque ground is still what makes the assertion true. `type-material-tokens` (0/0/0) and
`theme-css-sweep` pass with the sheet still token-only; the only `[data-theme]` rules in
it remain the two plates' `display` swap.

`capture-site-footer.mjs` gained the three readings that would catch a regression no
smoke can see: **`plateIsStation`** (the plate's rect equals the station's within 1px —
this is what fails if one side of the padding pair moves alone), and **`plateSrc` /
`heroSrc`**, which must be the same file in dark, with the hidden theme's `currentSrc`
empty (proof that neither theme fetches the other's plate).

### Left open

- `Gateway_v1b` carries a **baked caption** at ~65–75 % x / 86–91 % y. At 1280×720 there
  is no vertical crop, so it lands in the bar's row; the .78 bottom band should bury it
  — read the still, and nudge `object-position` to `center 45%` if it shows.
- The CTA column starts ~55 % x at 1440, where the dust trail runs. If the 12px gold mono
  reads badly on the capture, cap the band at `min(var(--band-max), 62%)` at ≥1200.
- `contact-95.png` still wants re-shooting (it did before this pass too).

## Update 2 — the footer gains its link grid, and the plate is measured (2026-09-17, owner)

Owner, reading U1 live: still not satisfied, with five references supplied
(`_01_GENERAL REFERENCES/Footer` — Eclipsera, Zellic, Meridian, Lighthouse,
GIC). **Every one of them carries a NAMED LINK GRID of three to five columns
and ours carried none**, which is the gap. He picked the **Zellic**
composition: a hairline with the wordmark and a tracked tagline, a link grid,
the key visual as the whole ground, the legal bar on the floor.

### 1 · The grid ships TWO columns, because three have nowhere to point

Audited before a row was designed.

**Linkable:** the landing's own station anchors (resolved through
`MANIFEST_ENTRIES`, so a renamed station is a test failure rather than a dead
anchor), `/claude-workshop` (the only other indexable route, by explicit owner
decision, ADR-053), and `mailto:`.

⚠ **`/arcs` AND EVERY ARC SLUG ARE BARRED, AND IT IS NOT A STYLE QUESTION.**
`app/robots.ts` leaves them crawlable _only_ so each page's
`robots: { index: false }` is visible; `app/sitemap.ts` names them "noindexed
client decks, deliberately absent"; and `ARCS` holds **three live client
proposals**. A footer link there publishes them. `tests/lib/footer-nav.test.ts`
asserts every internal path is a member of the sitemap's URL set — which makes
the mistake **unmergeable** rather than merely discouraged, and the guard was
verified to fail on an `/arcs` row before it was trusted.

⚠ **A "PRACTICE" COLUMN OF THE FOUR FORMATS IS BLOCKED, NOT OMITTED.** Nothing
reads a URL to open a card (grepped `ServicesStage` / `ServicesCardRing` for
`location.hash` and `searchParams`), so four rows would all point at
`#services` — four rows, one destination, four lies. It returns behind a
`?service=<id>` deep link, which is its own change.

⚠ **`LEGAL` IS AUTHORED WITH BOTH ROWS `null`.** Privacy and Terms have no
routes. A legal label that is not a link is worse than an absent one, so the
blocked column is recorded IN CODE — `footerColumns()` drops a column left
empty — and lights up the day the pages exist. The bar's right side stays
deliberately bare until then.

`lib/site/footer-nav.ts` is the record; the track is count-agnostic
(`grid-auto-flow: column`), so a third column costs one data entry and no rung.

### 2 · The composition is solved against a MEASURED plate

`scripts/measure-plate-luminance.mjs` is new and runs **per asset, not per
viewport**. Both plates are `cover` against a box that IS the station box, and
every desktop rung is height-bound (station aspect 1.540 / 1.600 / 1.778
against image 1.778), so

> **image-y fraction === station-y fraction, exactly, on every desktop rung**,
> and only x is cropped: `u(imageX) = 0.5 + (imageX − 0.5) · A/S`.

`Gateway_v1b`'s bright mass measures **y 0.23–0.67, x 0.563–0.896** in image
fractions — mask share 0.021, one clean connected component.

⚠ **THAT REFUTES THE PLAN THIS PASS STARTED FROM.** The hypothesis was that
the band could sit in a quiet upper region above the trail, the way Zellic's
does over near-black sky; it needed `trailTopFrac ≥ 0.51` and the plate returns
**0.23**. There is no quiet upper region. **The band clears the ring
HORIZONTALLY instead — which is U1's own conclusion, reached with a number
instead of an eye.** `u(0.563)` is 0.573 at 1920×1247 and 0.570 at 1440×900, so
`--ft-band-right: 54vw` leaves ~3.4 % of clearance; measured `bandRightFrac`
0.539 / 0.538.

⚠ **AND THAT IS WHY THE LINK COLUMNS SIT UNDER THE ASK RATHER THAN BESIDE IT.**
54vw leaves ~680px at 1920×1247 — enough for the ask (whose display run needs
~500px) **or** a column row beside it, not both. U1's principle stands: the
layout yields, the picture stays whole. The owner's composition survives in
everything that carries it — the crest, the named grid, the plate as ground,
the legal bar — and departs only where our plate is busier than Zellic's.

⚠ **AN OPEN ITEM CLOSES WITH ARITHMETIC RATHER THAN A STILL.** U1 left "nudge
`object-position: center 45%` if the baked caption shows" as the named fix for
the caption at ~86–91 % y. Height-bound means **there is no vertical crop to
move** — that nudge is a NO-OP at every rung this site is read at, and only
becomes a lever above 16:9. The caption is buried by the scrim's bottom band,
which is the only mechanism available.

### 3 · The bed rotates, and it needs TWO knobs

The desktop `to right` bed died at 60 %, short of a band that now carries a
grid. It rotates to `to bottom` — which is not an invention but the **≤960
rung's own resolution**, stated there for a band that runs full width
("a horizontal bed washes the wrong half. Rotated — and the stops are read off
the band's own box rather than guessed"). **That deletes the ≤960 `background`
override entirely**: one three-layer family for both rungs.

⚠ **BUT ONE KNOB WAS NOT ENOUGH, AND THE PHONE IS WHY.** The desktop band sits
on the plate's quiet left third; the phone's `object-position` frames the ring's
**bright body** behind the whole column. Same gradient, different ground — so
the alphas are a rung value like the floor is. Measured at the desktop's
0.56/0.46, the phone's lede read **2.84:1** and its CTA **1.61:1**.

⚠ **`--ft-band-floor` IS THE BED'S EXTENT AND G3 VALIDATES IT — not the band's
box.** The capture prints `bandBottomFrac` (0.815 desktop) as the bound the bed
never needs to reach: the link grid below it sits on quiet ground at 7.99:1, so
bedding it would grey the picture to fix nothing.

### 4 · The gate that decides, and the defect in its first cut

`capture-site-footer.mjs` gains an ink-contrast reading: hide the ink with
`visibility` (keeping layout), screenshot the band's own rect so the plate
arrives WITH its scrim and ground composited, read it back through an
`OffscreenCanvas`, and measure each text rect against its own computed colour.

⚠ **ITS FIRST CUT WAS WRONG IN THE WAY THIS HOUSE KEEPS GETTING WRONG.** It
gated on the darkest pixel anywhere in each text RECT and reported
`.ft-foot__link` at **1.36:1** in light on a footer that reads perfectly —
because a 44px row's box is mostly background and the light plate's line-art
landscape runs through it where no glyph does. **A guard measuring a MODEL of
the drawing rather than the drawing**, one surface further on. The fix is not a
looser number: two shots, and a pixel that differs between them IS ink. Masked,
the same link reads **10.32:1**.

⚠ **AND THE MASK DID NOT EXCUSE EVERYTHING — ONE FAILURE WAS REAL.** At
`--ft-bed-top` 0.46 the title measures **4.45:1** glyph-masked over 22,421 ink
pixels, where the display run reaches toward the ring's upper-left approach.
0.56 is load-bearing; both values were measured and the lower one does not
survive. `.ft-foot__tagline` and `.ft-foot__col-head` also came in at 4.41 and
3.89 on the mechanical gate at 10px and take `.62`, the rung `.ft-foot__mark`
already proves here.

### 5 · The coverage assertion could only ever pass by luck

`about-voidwalker-handoff-boundaries:500` asserts `bottom >= vh`. This station
is the document's LAST element and its height is its content's, which is
fractional — text line boxes and `svh` clamps do not land on integers. The
browser CEILS `scrollHeight` to compute max scroll, so at the true bottom

    bottom = vh − 1 + frac(documentHeight)

and an exact `>= vh` passes **only when that fraction is zero**. It was, before
this pass, and it was luck: any copy edit anywhere above the footer moves it.
Measured at the failure: body 18979.75, scrollHeight 18980, bottom 799.75
against 800 — a quarter of a CSS pixel, below the device grid at DPR 1.
⚠ A 1px overscan on the station was tried first and bought NOTHING, because
adding an integer does not change a fraction. The assertion carries one
sub-pixel of tolerance now; the property it tests is unchanged.

### 6 · Also

The **social icon row is deleted** — LinkedIn and X are named rows in Connect,
and the same two channels as icons in the bar is the same thing said twice on
one screen. `socials.ts` keeps its `href: null` contract and the Connect column
is what reads it. The capture's counter moves to `[data-social]` (a count still
walking `.ft-foot__socials a` would read 0 forever and report it as correct)
and its dead-link probe widens to `href=""` and a missing `href`.
`.ft-foot` still takes **no padding, margin or border** — the crest carries the
hairline, and `plateIsStation` is the assertion that says so.

### Verifying

```bash
node scripts/measure-plate-luminance.mjs            # per asset, not per viewport
node scripts/capture-site-footer.mjs --vp 1920x1247 --theme dark|light
node scripts/capture-site-footer.mjs --vp 1440x900  --theme dark|light
node scripts/capture-site-footer.mjs --vp 390x844   --theme dark|light
npx playwright test tests/visual/about-voidwalker-handoff-boundaries.spec.ts --workers=1
npx vitest run tests/lib/footer-nav.test.ts tests/lib/socials.test.ts \
  tests/lib/type-material-tokens.test.ts tests/lib/theme-css-sweep.test.ts \
  tests/lib/rail-manifest.test.ts
node scripts/design-eval/mechanical.mjs --url / --theme dark|light --scope ".ft-foot" --prm
```

All six capture cells: **G3 pass**, `plateIsStation true`, `dead links 0`,
`bandRightFrac` 0.538–0.539 desktop against a ring at 0.570–0.573. Mechanical
passes in both themes. 8/8 on the boundary spec, 1599 unit tests.

### Still open

- **The LinkedIn and X URLs.** Two lines in `lib/site/socials.ts`; the Connect
  column shows Email alone until they land, which is correct rather than
  broken.
- **Privacy / Terms**, and with them the bar's right side and the Legal column.
- **The third link column**, behind a `?service=<id>` deep link.
- **Three brand instances in one viewport** — the fixed HUD wordmark, the
  crest, and the bar's mark. Read live before accepting; if it is repetition,
  the BAR's mark shortens to `◆ 2026`, never the crest.
- The contact form still needs `RESEND_API_KEY`, and
  `landing-page.spec.ts`'s percentage-scroll snapshots want re-shooting AFTER
  this (the document grew) — `-g "HUD"` must pass WITHOUT `--update-snapshots`.

## Update 3 — the footer is a bed the rack scrolls over (2026-09-22, owner)

> I want the footer, like the general intelligence company's footer, to be visible
> and parallaxed. That needs to be fixed, and the musings section needs to scroll
> over it.

**The record lives in [ADR-119](119-the-musings-rack.md)**, because it is one
change with the new station and neither half works alone. The short form:

```css
html[data-ft-reveal] #contact.station {
  position: sticky;
  bottom: 0;
  z-index: 0;
}
```

- ⚠ **EVERY TERM OF U1 AND U2's GEOMETRY IS UNTOUCHED** — `--ft-pad-*`, the
  plate's negation of exactly those, `--ft-band-right: 54vw`, the three-layer bed,
  the two plates' `display` swap. At the document's end a sticky-bottom box sits
  at its natural seat, so sticky is a **no-op** there and `plateIsStation` still
  measures the rect it always did. The capture is unchanged and still passes.
- ⚠ **THIS STATION IS NO LONGER THE CORRIDOR'S COVER**, and that is what made it
  possible: `home-v2.css` gives the cover `position: relative; z-index: 6` during
  the exit band, and **a cover cannot also be the thing being uncovered**.
  `#musings` — the first opaque station below the corridor now — takes the role.
  U0's own §"IT KEEPS `id=\"contact\"`" is untouched: the station, its id, its
  place inside `<main class="stations">` and the four things that read them all
  stand.
  ⚠ **RE-POINTED BY [ADR-119 U1](119-the-musings-rack.md) (2026-09-22): ON THE
  CAPABLE RUNG THE COVER IS `.mu__band`, NOT `#musings`.** That station is a
  TRANSPARENT stage there — the era's own recipe, because an opaque station in
  normal flow could only arrive by travelling over a pinned one, which the owner
  read as parallax — and its opaque end is one 100svh full-bleed band at the foot
  of its runway. Nothing about this station's half changes; what changes is the
  EDGE the stamp arms on (below).
- ⚠ **THE GATE IS THE MECHANISM, NOT A REFINEMENT.** Ungated, sticky-bottom pulls
  this station to the frame's floor from scroll 0 — and `#voidwalker` on the
  capable path is a pinned TRANSPARENT stage, so the footer would paint straight
  through the era stage over the live corridor. `useMusingsScroll` arms the stamp
  only once the beat's opaque edge has passed the frame's top, and clears it on
  the way back up, on unmount and on the inert rung.
  ⚠ **AND THAT EDGE MOVED WITH ADR-119 U1.** On the stage rung it is the BAND's
  top — the last viewport of the station — because the three viewports above it
  are now transparent over a live canvas, and a bed armed there would hold the
  footer at z 0 under the corridor for the whole beat. Off that rung the runway's
  own top is still right, and the fallback is not a convenience: it is the other
  two rungs. The band's top is also the frame in which the corridor dies, so the
  bed arms exactly where the canvas stops painting.
- ⚠ **PINNED, NEVER TRANSFORMED**, and the GIC reference does not move either —
  it is uncovered. A main-thread `translateY` off a scroll variable lags the
  compositor by one wheel step, every step.
- ⚠ **NOT ON THE PHONE**, which is a property of the stamp rather than a media
  query: the writer parks on that rung. `#contact` is a snap stop at ≤960 and its
  bottom padding is solved against fixed chrome in the DYNAMIC viewport.
- **Also in this pass:** the `Musings` row in `lib/site/footer-nav.ts` is lit
  (`/musings`, the three posts published), and `lib/site/socials.ts`'s LinkedIn
  URL — one of the two inputs U2 left open — has landed. The Connect column and
  the About stage light together, which is the whole reason that record is one
  array.

## Update 4: the footer rises over the list (2026-09-24, owner)

> I think it already looks good, but I want it to be parallax-scrolled over the
> previous section. In a previous iteration, we did the reverse … That doesn't
> work because it adds dead space … When you scroll away from the muse section,
> I want the footer to scroll over it in a subtle way. … the title, "Navigate
> intelligence with your team," should be full caps. I think the "Thoughtform"
> above it and "navigating code build" should be removed. … look at [inversa.com]
> and try to replicate the smooth scroll at the footer.

**This supersedes Update 3 (the bed) and ADR-119 U1's `.mu__band`.**

### 1 · Why the dead space existed

Under Update 3 the page ended in three steps:

1. `#musings` was a transparent pinned stage.
2. A 100svh opaque `.mu__band` sat at the foot of its runway. It was the
   corridor's cover and the bed's arm edge.
3. `html[data-ft-reveal] #contact.station { position: sticky; bottom: 0 }` held
   the footer at the floor, to be uncovered.

After the list, the reader therefore scrolled through one viewport of empty stars
before the footer began to show. That viewport was the dead space.

### 2 · The rise

This applies on both pinned rungs (`.mu[data-mu-ready]`: 961px and up, with motion
allowed).

- **The musings runway gains a RISE.** It becomes
  `calc(100svh + var(--mu-dwell) + var(--mu-rise))`, with `--mu-rise: 100svh`, so
  the stage stays pinned for one more viewport after the dwell.
- **`#contact` is welded up over exactly that viewport.** It takes
  `margin-top: calc(-1 * var(--ft-weld))` with `--ft-weld: 100svh`, plus
  `position: relative; z-index: 8`.
- **Both key on the same stamp**, `#musings:has(.mu[data-mu-ready]) ~ #contact.station`,
  so the weld and the tail always turn on together.
- **`musings-row.test.ts` pins `--mu-rise` equal to `--ft-weld` by arithmetic.**
  Neither station can read the other's custom properties.
- **The footer's top enters at the floor exactly at the end of the dwell.** It
  reaches the frame's top exactly as the runway releases, so the stage never
  unpins uncovered.
- **`--mu-rise` is `0px` unless a footer follows the station.** The labs mount the
  station without one.
- **The band, the bed and `data-ft-reveal` are deleted**, together with the bed's
  three clear paths. The document is one viewport shorter.
- **Phones, reduced motion and no-JS keep plain flow.**

### 3 · The footer is the corridor's cover again

While the ambient lives, the corridor's canvas sits fixed at z 2 inside a z 3 host
with an opaque void. Any station below z 3 is invisible under it, so the rising
footer has to BE the cover.

- **`useCorridorExitScroll`'s stage-rung cover is `contactEl ?? musingsEl`.** It was
  the band.
- **The ambient fades as the footer's top rises** from 0.6 of the frame to its top,
  and dies once the frame is covered.
- **The ADR-030 §6 lockstep moved in one commit.** The handoff spec's cover case and
  the ring smoke's ambient hold now read `#contact`. `home-v2.css`'s musings
  promotion is untouched.
- **This reverses a ruling in ADR-119 U1.** That ADR records an opaque station
  travelling over a pinned stage as the parallax the owner rejected. He now asks for
  exactly that geometry for the footer.

### 4 · The list stays until it is covered

The footer covering the list is now the list's exit. Folding the list first would
leave the footer rising over an empty frame.

- **The writer measures `p` over the dwell alone:**
  `runway.offsetHeight − vh − risePx()`, with the rise read off a probe box.
  `p` therefore saturates at 1 through the rise, and no threshold moved.
- **`ROW_ARRIVE_END`, `HEAD_LEAVE_AT` and `HEAD_RETURN_BELOW` are deleted.** The
  list and the head close only on the way back up.
- **Scrolling back up, the footer lifts off a whole list.**

### 5 · The drift, the dim and the glide, all driven by the compositor

Each is a CSS scroll timeline behind `@supports (animation-timeline: view())` and
the rung. A main-thread writer against a compositor scroll lands one wheel step
behind (the Trinny hero curtain's measurement).

- **The drift.** `.mu__stage` moves `translateY(0 → −0.25 × rise)` on the RUNWAY's
  own view timeline, over `contain calc(100% − var(--mu-rise)) contain 100%`. That is
  a quarter of the scroll speed, which was the owner's pick when asked.
- **The dim.** A void veil on `::after` goes from opacity 0 to 0.4. The stage itself
  never takes an opacity: the notes are glass, and a translucent ancestor blinds a
  `backdrop-filter`.
- **The glide.** Measured live on inversa.com, its footer box travels 1:1 and one
  thing inside it, the wordmark, travels at about 0.72×. That page is also smoothed
  sitewide by Lenis; the owner chose to take the footer only. Here the key visual's
  `<img>` is taller than its plate by `--ft-par` (25svh) and slides from `−par` to 0
  over `entry` on `.ft-foot`'s own view timeline, so it rises at 0.75×. The plate
  already clips; the station never does.
- **Without timeline support (Firefox today),** the weld and the pin still hold, and
  the footer covers a still list.

### 6 · The copy

- **The crest is deleted:** the `Thoughtform` wordmark and the
  `Navigate · Encode · Build` tagline, with `arcTagline()` and its test. This
  overrules U2's "never the crest" on the owner's word.
- **The grid is `1fr auto`**, and the frame's top hairline went with the crest.
- **The title is AUTHORED in capitals, never transformed**, so ratchet C stays 0.
- **It takes the house caps-display tracking, `0.04em`.** That is the literal
  `.services-masthead__title`, `.mu__title`, `.arc-title` and `.voidwalker__name`
  already spell. The sheet's A pin moved from 0 to 1, recorded.
- **Everything else is untouched:** size, weight, colour, `Let's build`, the ask
  and the nav.
- **The subpages take the copy too**, because `SheetClose` mounts the same footer.

### 7 · Measured

Taken with the list capture (headed, real scrolls) and the rise probe.

| stop (1920×1247 dark) | footer top (want) | stage drift (want) | veil | list · head | ambient | readout |
| --------------------- | ----------------- | ------------------ | ---- | ----------- | ------- | ------- |
| rise 0.25             | 935.8 (935.3)     | −77.8 (−77.9)      | 0.1  | in · whole  | alive   | musings |
| rise 0.5              | 623.8 (623.5)     | −155.8 (−155.9)    | 0.2  | in · whole  | alive   | musings |
| rise 0.75             | 311.8 (311.8)     | −233.8 (−233.8)    | 0.3  | in · whole  | alive   | contact |
| rise 1                | 0.8 (0)           | −311.5 (−311.7)    | 0.4  | in · whole  | dead    | contact |

- **Frames during the rise:** 3% long frames under real wheel steps (mean 5.9ms, p95
  12.4ms), against the 15% bar. The one 58ms frame is the corridor's teardown.
- **Contrast:** the caps title's worst glyph over the plate is 6.71:1 in dark and
  10.06:1 in light, against a 4.5 floor. The plate still equals the station.
- **Captures pass** at 1920×1247 light, 1280×720, 1024×768 (the 961–1100 rung),
  390×844, and on both lab hosts.
- **Specs pass:** `about-voidwalker-handoff-boundaries`, `services-ring-smoke`,
  `landing-page -g HUD` (unchanged, no snapshot update), `landing-corridor-smoke`,
  and `mobile-section-seams` on both iPhones.
- **The mechanical gate passes**: `mechanical.mjs --scope ".ft-foot" --prm`, in both
  themes.

### Still open

- **The footer's leading edge has no hairline.** It is the station's opaque top.
  Judge it live; the fallback is a hairline on the STATION, never on `.ft-foot`.
- **The title sets on three lines at every desktop width.** At 72px the capitals
  cannot hold the authored two-line break inside the band's 54vw.
- **At 1280×720 the footer is 307px taller than the frame**, so it keeps scrolling
  after it has covered the list.
