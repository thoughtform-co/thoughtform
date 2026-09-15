# ADR-105: The page ends on a bold footer, and `#practice` is deleted

- **Status:** Proposed (2026-09-15) — shipped and guarded, pending the owner's live read
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
