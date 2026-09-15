# ADR-043: Wordmark moves to the bottom-left corner

**Date:** 2026-07-16
**Status:** Accepted
**Scope:** `components/landing/v7/landing.css` (`.hud__brand`, `.hud__rail`,
`.hero__flywheel--ipa`), `public/prototypes/v7/landing-v7-motion.html`
(`.hud` corner markup), `/claude-workshop` (inherits via shared CSS).
Origin lab: `app/(internal)/test/services-wordmark/`.

## Context

Section titles want to live in the top band, aligned to the left rail
(the Linear-style masthead validated in `/test/services-wordmark`), but
the top-left corner was owned by the wordmark lockup (`.hud__brand`) —
a big-title experiment there previously died because it **competed with
the wordmark** (owner, 2026-07-16). The lab tested the fix: relocate the
wordmark to the bottom-left, freeing the top band.

De-risking established the bottom-left corner is functionally empty:

- `#hudBrandmark` (the sigil dock) is **vestigial** — nothing toggles
  `.is-visible`, its `<img>` children are hard-hidden, and the current
  brandmark journey's keyframes are the five `data-brand-anchor` slots;
  the bottom-left slot is not one of them.
- The BL bracket's border-fade trigger (`.hud--brandmark-active`) is
  never applied by any JS — a dead rule from the retired ADR-010/012
  dock choreography.
- Nothing in `lib/v7-parse/` or the test suite pins the `.hud` corner /
  brand markup (only `data-brand-anchor` slots and the rail shells).

## Decision

1. **`.hud__brand` anchors bottom-left** (`bottom: var(--hud-margin)`,
   `left` unchanged), `transform-origin: bottom left` so the scroll
   collapse stays pinned in its corner. Same width, z-index, trigger.
2. **The wordmark's corner carries no bracket** — the rule follows the
   wordmark: the BL bracket div is removed from the prototype markup and
   the **top-left bracket is restored** (`.hud__corner--tl`, whose CSS
   always existed). `.hud__corner--bl` CSS stays (the workshop prototype
   markup isn't edited and may keep its own corners).
3. **Collapse scale 0.82 → 0.68** — once scrolled, the wordmark reads as
   a quiet signature, not a nav element (owner: "even smaller").
4. **The hero pronunciation line (`.hero__flywheel--ipa`) mirrors to the
   bottom-RIGHT** (`left: auto; right: var(--hud-content-inset)`, with
   28px/32px mirrors in the ≤640/≤960 blocks) — the bottom-left gutter
   now belongs to the wordmark.
5. **Rail bottom clearance budgets the lockup**: the sigil-height term
   `clamp(24px, 2.5vw, 40px)` in `.hud__rail`'s `bottom` calc becomes
   `clamp(44px, 3.6vw, 63px)` (the lockup's rendered height at its
   ~300:126 aspect), preserving the ~26-32px breathing gap between the
   rails' lowest ticks and the mark.
6. **`#hudBrandmark` stays in the DOM untouched** (inert). Removing the
   dead dock machinery is separate cleanup, not part of this move.

## Consequences

- `/claude-workshop` imports the same `landing.css` but its prototype
  markup carries **no `.hud__brand` element** (verified live), so no
  wordmark moves there; the only inherited change is the rail-bottom
  budget (rails end ~20px higher — cosmetic). Its own TL+BL brackets
  are authored in its own prototype HTML and are unchanged.
- `tests/visual/landing-page.spec.ts` screenshots `.hud__corner--tl`;
  restoring the element revives that snapshot — a visual-baseline update
  is expected fallout, not a regression.
- The top band is now clear for rail-aligned section mastheads (the
  Linear-register direction explored in `/test/services-wordmark`; its
  right-rail-paragraph question remains open under ADR-031).

## Update (2026-07-16) — rail bottom mirrors the top; last tick is the terminus

Owner niggle, two rounds. Round 1 read "the corners are not connecting
with the last tick" as _extend the hairline into the corner chrome_ — a
bare track dangling past the last tick (left) and welding into the BR
bracket (right). **Rejected on sight**: the rail's terminus must be the
LAST TICK; the track never extends past it and never touches the corner
chrome.

Round 2 (shipped): the `.hud__rail` bottom clearance now **mirrors
`--hud-rail-y-start`** (`margin + corner-zone + breathing`) instead of
budgeting this wordmark's height on both sides. Ticks sit at 0–100% of
the rail box (`lib/v7-parse/hudTicks.ts`), so the 100% tick rides the
new bottom edge as the terminus — holding the same breathing gap above
the BR bracket as the first tick holds below the TL bracket, and making
the rail vertically centred (mid-rail = viewport midline, the ADR-031 U8
register anchor; it was ~6.5px off before). A `max()` arm guards THIS
wordmark on short viewports (lockup taller than the corner zone → the
rail ends 8px above it instead). Verified at 1280/1920/2560/961: track
dangle 0.0 both sides, 21–30px tick→bracket, 6–12px tick→wordmark.

## Update (2026-07-19) — the corner texts align to the editorial columns, not the chrome

Owner: on wider viewports the bottom-corner texts read as detached from
the hero copy — the wordmark floated out at the rail gutter while the
headline column began ~113px inboard, and the pronunciation line sat the
same ~113px inboard of the top-right nav. Both now align to their column,
superseding **point 1** (`.hud__brand` `left` was "unchanged" = rail
gutter, `var(--hud-margin)`) and **point 4** (`.hero__flywheel--ipa` at
`var(--hud-content-inset)`):

- **`.hud__brand` `left` → `var(--hud-content-inset)`** — the wordmark's
  left edge now tracks the hero content column (headline / subhead / CTAs,
  set by `.hero`'s `padding-left`), reading as the foot of that column.
  On `≤960` a `.hud__brand { left: 32px }` rule matches the hero's flat
  32px padding (this rule also covers `≤640` — the `≤960` block wins on
  source order, the same cascade quirk that already pins the hero's own
  `padding-left` to 32px below 640).
- **`.hero__flywheel--ipa` `right` → `var(--hud-margin)`** (base + the
  `≤960`/`≤640` mirrors, which were `32px`/`28px`) — its right edge now
  aligns with the top-right nav (`.hud-nav-overlay`, also at
  `--hud-margin`), the mirror of the wordmark's move on the left.

Verified at 1600/900/500: wordmark left ≈ content left and pronunciation
right ≈ nav right at every breakpoint (residual ≤3px is glyph side-bearing),
no wordmark↔pronunciation collision on mobile. The rail-clearance geometry
above is untouched — this is a horizontal alignment only.

### Follow-up (2026-07-19, owner) — the collapse DOCKS the wordmark back to the rail

The content-column alignment above is a HERO-only rest position. Owner:
"make the wordmark move to the bottom-left corner of the left rail like it
used to when you scroll from the hero into the second section." So the
`.is-collapsed` state (toggled by `HudNav` past 50vh, entering section 2)
now sets **`left: var(--hud-margin)`** in addition to the `scale(0.68)`, and
`left` joins the `.hud__brand` `transition` (`0.4s var(--ease-out)`). The
wordmark therefore rests inboard on the hero (aligned with the copy) and, on
scroll-off, glides to the rail's bottom-left corner AND shrinks in one move —
`transform-origin: bottom left` keeps the shrunk mark pinned there. This
restores the original ADR-043 resting spot (`--hud-margin`) for the SCROLLED
state while keeping the new content-aligned hero position. Verified at 1440×900:
hero `left` ≈ content edge (145 vs 142), collapsed `left` = `--hud-margin`
(41 vs 40.5); `transition-property` includes `left`.

## Update (2026-09-15) — the July ruling stands, a third time; the end ticks sit flush

Owner, on the Trinny deck's PDF (which copies this frame): "the left rail
and the bottom-left tick, as well as the bottom-right tick, are not properly
connected … it's also on our homepage, so we need to fix it once and for
all." Two things were wrong with how that was read.

**What he meant** was the END TICKS: the 100% tick's ink had hung 2px BELOW
the rail box since the ladder was authored (a tick is positioned by its top
edge with no translate), so the rail's last mark was not on the rail. Fixed
in CSS alone: ticks are centred on their percent line (`translate: 0 -50%`,
like the labels, the diamond and the telemetry seats), the `:first-child` of
`#leftTicks` / `#rightTicks` sits at `0` and the `:last-child` at `-100%`;
the emitter and its markup pins are untouched.

**What was built instead, for one morning,** was the 2026-07-16 round-1
reading again — the track extended into the top-left bracket's foot and
down onto the bottom corner band, the collapsed wordmark shifted so the
track ran into the T-stem of THOUGHT, and the Trinny deck given a top-right
bracket for its rail to land on. The owner had ticked a "(Recommended)"
option that described it, never having seen it; on the first still he
rejected it on sight, exactly as in July: "our brand mark and the Trinny
London logo are overlapping with the left and right rails … the top-right
corner is connected to the rail. If you look at our Thoughtform design
language, this should never happen." **A rail never touches a corner mark
or a logo; the site's top-right is the nav and carries no bracket.** The
July geometry is restored to the pixel — `--hud-rail-y-start` =
`margin + corner-zone + clamp(16px, 1.8vw, 32px)`, the bottom mirroring it
with the wordmark `max()` arm, the lockup at `--hud-margin`.

What survives from the morning, because it is an improvement in its own
right: the rail's bottom is a TOKEN now, `--hud-rail-y-end`, read by
`.hud__rail { bottom }`, the casefile's `--fl-rail-bot`, both labs and
`scripts/capture-hud-panel-lab.mjs` — the mirror that used to be a literal
copy can no longer drift; and the dead `--hud-rail-top` /
`--hud-rail-bottom` tokens are gone.

Two lessons for the record: **an option the owner has not SEEN cannot be
"recommended"** — a geometry change on the frame is shown as a still before
it is offered; and **a still must be read for overlaps between chrome and
marks before anything ships** — the morning's stills showed the rail
entering the lockup and the reviewer called it "intentional".

Verified after the restore, headed at 1280×720 / 1440×800 / 1920×1247, dark
and light: TL bracket foot → rail top 23.0 / 25.9 / 32.0, rail bottom →
settings box top 24.1 / 26.5 / 32.0 (the July numbers), first-tick top −
rail top 0.0, last-tick bottom − rail bottom 0.0, mid-rail within 1px of
the midline. Out of scope, noted: at 1280×720 the manifest diamond still
paints on the left rail (the desktop hide is `min-width: 1101px and
min-height: 760px`), and the two "HUD" element snapshots in
`landing-page.spec.ts` are vacuous (a clipped empty box and an opacity-0
element).
