# ADR-059: Rail instruments — the journey's sections as corner marks

**Status:** Accepted · 2026-08-02 — **read Update 2 first; it is the live arrangement**
**Flags:** `RAIL_INSTRUMENTS`, `SETTINGS_CLUSTER` (`components/landing/v7/rail-instruments/flags.ts`), both default ON
**Extends:** ADR-058 — the toggle keeps its slot below 960px and moves outboard onto the frame line above it
**Lab:** `/test/hud-instruments-lab`, route `r4` + `rTelemetry` + `rName`

> ⚠ **§2's geometry is live again; §3 is not.** Update 1 merged the two
> clusters into one top-left row for a day; Update 2 split them back apart
> and put the destinations and the settings controls on ONE LINE in the
> bottom-right, which is the thing §2 concluded was impossible. Read §2 for
> the 180° rotation (still exact), then Update 2 for why its "the corner
> cannot hold both" no longer binds. §3's bottom-left toggle move never
> came back.

## Context

The frame shipped as "a ruler with nothing on it": a 13-tick ladder down the
left rail, and a right rail empty since ADR-044 retired `ServicesRailRegister`.
The corner brackets marked corners and said nothing. Three rounds in the lab
(commit `b43ad58a` onward) tried to fill that space; this is what survived.

## Decision

Five marks top-left for the APPROACH (hero, thesis, navigate, encode, build),
five bottom-right for the DESTINATIONS (proof, services, about | practice,
contact), each cluster replacing the corner bracket it stands in for. The right
rail carries BEARING / SECTOR / LOCAL on rungs of the same ladder, plus the
active section's name set vertically.

### 1. Position is STRUCTURE, not progress

Rounds 1 and 2 both ran marks ALONG the left rail and argued about spacing.
Owner verdict on round 1: _"they just feel like showing progression, and that's
not really what I want."_ The cause is structural rather than cosmetic — a
column of marks at their true scroll offsets is a SCALE, and a scale reads as a
progress bar however it is styled. Round 2's fixed seats escaped that but still
occupied the ladder.

Here the ladder keeps its own job and the sections live in the corners, where
GROUPING carries the meaning: which corner a mark sits in says what kind of
section it is. Only state moves.

### 2. The two corners are an exact 180° rotation

The approach row's TOP edge sits on the top margin line; the dock row's BOTTOM
edge sits on the bottom margin line. Labels stack inward in both. Each
cluster's TERMINAL mark is centred on its rail's track — the same line the
ticks hang off and the diamond rides — anchored to `--hud-rail-guide-inset`
rather than a measured pixel, so the assembly stays rigid if that token ever
leaves 0.

Two placements were tried and rejected before this, both instructive:

- Seating the dock INSIDE the rail box put the 2px track through the terminal
  glyph.
- Centring it in the strip between the rail's terminus and the toggle got the
  glyphs out but left their labels poking into the rail. A cluster whose labels
  overlap the rail is not a mirror of one sitting clear of it.

Measured symmetric at 1920 / 1440 / 1280 / 1100 with every label showing: row
inset from the frame edge identical to 0.1px, clearance from each rail matching
within 1px.

### 3. The ADR-058 toggle moves to the bottom-LEFT

A geometric consequence, not a preference. The symmetric dock lands in the band
the toggle occupied, and the strip between the right rail's terminus and that
control is ~26px against a ~36px glyph-plus-label row — the corner cannot hold
both.

ADR-058's own reasoning survives the move intact, mirrored: the offset is the
same expression measured inboard of the `--bl` bracket instead of the `--br`
one, and it still pairs with the ADR-043 wordmark (which sits at
`--hud-content-inset`, so the mirrored slot clears it by ~14px at 1440 with no
measured pixel). The band now reads toggle at the left end, dock at the right.

Kept as its own const (`THEME_TOGGLE_DOCKS_LEFT`) so that flipping the
instruments off does not silently move a shipped control back under a cluster
that is no longer there to justify it.

### 4. What was tried and NOT taken

- **The left rail's station roster.** Owner, 2026-08-02: the ladder stays a
  ladder, and the approach cluster is the left side's whole contribution.
- **The corner RANGE register (`cBr`).** It printed `scroll01 × 100`, and so
  does BEARING in the telemetry stack. The lab only got away with both because
  they were never on screen together.
- **Drawn station silhouettes (`glyphs.ts`).** Retired in the lab: at 14×10
  every clip-path cut collapsed to the same rectangle. The marks here are open
  STROKE figures rather than a shared bordered box with a notch taken out of
  it, which is a different medium — but whether they read as instrument
  geometry or as app icons is still an open judgement, not a settled one.

## The traps

- **`.hud__rail` is a flex column.** A hosted child must be `position: absolute`
  or it becomes a flex item and leaves the ticks' percentage box.
- **NOT `[data-tools-rail-root]`.** That slot has sat empty since ADR-044, but
  `services.css:2809` still owns it — `[data-tools-rail-root] > div` forces
  `position: absolute; inset: 0` on every direct child at a specificity a
  single class cannot beat, which stretched the dock to the rail's full 62×692
  box. The same block hides it at a breakpoint these instruments do not share.
- **A label points AWAY from its host's clipped edge.** Every host carries a
  curtain clip whose top inset saturates at 0px, so nothing survives above a
  host's own box at rest. Approach labels hang below, dock labels go above.
  Reverse either and it vanishes silently.
- **Both curtain clips are widened to −340px on the sides.** Production ships
  −100px on the rail and 0 on the TL corner's left; the dock reaches ~130px
  inboard and the approach row's first mark sits half a mark outboard. At the
  shipped values both were sliced with no error — a clip failure looks exactly
  like a layout mistake.
- **`RailInstruments` is a LEAF by contract.** All state lives inside it. A
  subscription in `LandingPage` re-renders it, re-applies the
  `dangerouslySetInnerHTML` body, and orphans the nested roots.
- **No new scroll writer (ADR-002).** `useJourneyMarks` is a second reader of
  the existing `<html>` bus, deliberately not an extension of
  `useActiveSection` — that hook keys state on the readout ROW so the Arc's
  four beats settle as one, and the approach cluster needs the opposite.
  Continuous values bypass React entirely and are delta-gated on the formatted
  string.
- **Ink goes through `--dawn-rgb`, never a literal.** The lab's `--hil-passed`
  is a literal, which is why the lab's other routes are dark-only. The 0.44
  passed value was MEASURED, not chosen; do not push past ~0.5.

## Verifying

Gates confirmed live at 1920 / 1440 / 1280 / 1100 / 960 / 390: marks and
telemetry present above 960 and gone at/below it with the rails, the vertical
name dropping at 1100 alongside the bearing labels, and the corner brackets
coming BACK when the clusters leave. Both themes. No page errors.

Journey tracking confirmed through a real scroll — hero → build → services →
contact, with BEARING 000 → 031 → 074 → 100 and SECTOR 01/06 → 06/06.

## Update 1 — four corners, four jobs (2026-08-02, owner)

> _"can't we make it so that the bottom RIGHT corner includes everything
> related to settings… I like that we have glyphs / sigils in the top left
> corner so let's harmonize."_

The frame now reads by corner: **journey** top-left, **nav** top-right,
**brand** bottom-left, **settings** bottom-right.

### The two clusters merge into one row

The destinations came up to join the approach, so the top-left carries all
ten marks. The approach/destination split survives as RULES inside the row
(approach │ record │ destination) rather than as distance across the frame.
That is a weaker signal than two corners were, and it is the acknowledged
cost of the scheme.

Gap tightens 22px → 18px: ten marks and two rules at 22px ran 404px across
the top of the frame; at 18px it is 360px.

⚠ **Two clocks in one row.** The Arc's beats exist only on the MANIFEST
index (`READOUT_SECTIONS` collapses all four to one `arc` row) and `proof`
exists only on the READOUT index (ADR-056 — the casefile has no manifest
entry). Each mark declares which resolves it. Feed one the wrong index and
it silently lights the wrong glyph; nothing throws.

### The per-mark label is dropped in production

Measured collisions at y 64–76 with `services-masthead__desig`
("SVC / TITLE · 01") and the corridor's `home-v2-stack-label__num`. Above
the row is unavailable — the corner's curtain inset saturates at 0px — so
there was nowhere to move it.

It was also redundant: with the vertical rail name and the ADR-055 nav
corner, the active section would have been named three times. The gold mark
says where you are; something else already says what it is called. The lab
keeps its labels, which is where the glyph question gets judged.

### Settings, and what is NOT in it

`SettingsCluster` replaces the standalone `LightModeToggle` on the landing
route (`/arcs` still mounts that directly, having no cluster to join). It
carries the theme switch plus a session mark.

**The session mark renders only for a signed-in allowlisted user** — it is
absent from the DOM entirely otherwise, verified. There is deliberately no
"sign in" control: a login affordance on a public page tells every visitor
there is an admin surface and where it is, for the benefit of one person who
already knows. The door stays `/admin` by URL; this is the way back to the
tools once you are through it. Its glyph borrows the `encode` mark's
bracket vocabulary so the corner reads as the same instrument family as the
journey row.

⚠ **Still its own fixed overlay outside `.hud`** — ADR-058's constraint,
unchanged by the corner's new contents. Anything hosted in a rail or corner
is invisible for the whole hero and pops in as the curtain lifts, and
settings has to work on screen one. `.rin-settings` and
`.theme-toggle-overlay` are deliberately the SAME expression: move one,
move both, or the two public surfaces put the same control in two places.

⚠ **Settings is never responsive-gated.** It is `position: fixed`, owes
nothing to the rails, and a theme switch that vanishes on a phone is a bug.

### Consequences for §3 above

The toggle's bottom-LEFT move is reverted — it only moved while the
destination marks held that corner. `THEME_TOGGLE_DOCKS_LEFT` is deleted;
`SETTINGS_CLUSTER` replaces it. Only the TOP-LEFT bracket is now suppressed:
the settings cluster sits inboard of the bottom-right bracket rather than
replacing it, so that corner keeps its frame.

## Update 2 — the corner holds both (2026-08-03, owner)

> _"we need to move some [glyphs] to the bottom right corner and also fold
> the light mode / dark mode in there; so remove the bottom right corner
> and then move some glyphs there."_

The clusters are two again — approach top-left, destinations bottom-right —
and the bottom-right corner carries the DESTINATION MARKS AND THE SETTINGS
CONTROLS ON ONE LINE. Both working corners now suppress their bracket.

### Why §2's ruling no longer binds

§2 measured a ~26px strip against a "~36px glyph-plus-label row" and
concluded the corner could not hold a cluster and a control. **The labels
are what did not fit.** Update 1 dropped them from production for an
unrelated reason (the y 64–76 collision with the services masthead), and
what is left is a 16px glyph row, which sits beside a 36px control on the
same line with room over.

That is the whole unlock, and it is worth stating plainly because the
original ruling was correct when it was made and reads as a permanent
constraint. It was a constraint on a row that no longer exists.

### One flex row, marks outboard

Reading left to right: `[session] [theme] ┃ proof · services · about │
practice · contact`, right-anchored so the LAST MARK'S CENTRE lands on the
right rail's track — the exact 180° mirror of the approach row's first mark
on the left rail's track. Measured at 1440×900 and 1280×720: **+1px on the
right, −1px on the left**, the two rails' 2px tracks being what that pixel
is. The controls take the inboard end — the seat the approach row's zone
label used to hold at the other corner.

**And that label is now gone from both** (owner, same day). The
bottom-right could never have a counterpart: the controls own its inboard
terminus, and a word wedged between a glyph row and a theme switch labels
neither. Captioning one corner and not the other made the two rows read as
different kinds of object rather than one instrument seen from both ends,
so the frame prints no zone anywhere. `CLUSTER_ZONES` survives for the lab
only, which keeps it for the same reason it keeps per-mark labels.

ONE flex row rather than two anchored boxes is load-bearing: the session
mark is present only for an allowlisted signed-in user, so the control
group's width is not knowable at author time. Two boxes would need that
width as a constant, and the constant would be wrong for every visitor who
is not the owner.

Gap back to §2's 22px from Update 1's 18px — that tightening paid for ten
marks and two rules in one row (404px), and five marks run 168px.

### The controls move outboard, but only above 960

`.rin-settings` keeps ADR-058's expression as its BASE and shifts to the
frame line under `html[data-rail-instruments]` at `min-width: 961px`.

Both halves of that are forced, not stylistic:

- **The gate is 960** because the marks stop there (the `.hud__rail` gate
  takes the telemetry with it and the corner brackets come back). A control
  alone on the track line would then sit inside the returning `--br`
  bracket, and at the small end of `--hud-margin` (16px) a 36px button
  centred on that line overhangs the viewport by 2px. Below the gate the
  row is the ADR-058 slot again, 11px clear of the bracket — measured.
- **The base stays byte-identical to `.theme-toggle-overlay`**, which
  `/arcs` still mounts. That page keeps its `--br` bracket and has no row to
  put beside the control, so it has nothing to reach out for. The two
  surfaces diverge above 960 for a reason a reader can see on screen, and
  converge below it.

### The marks carry the curtain clip; the control does not

The marks must be UNCOVERED by the hero exactly as the frame chrome is —
five glyphs sitting on screen one would break the ADR-031 U16 reveal — and
the toggle beside them must not, because settings has to work on the first
screen. They are in the same fixed overlay, so `.rin-settings__row` carries
its own copy of `.hud__corner--br`'s clip expression and the controls sit
outside it.

⚠ `height: 100%` on that row is what makes the copy exact. The expression
assumes a box `--hud-corner-zone` tall on the bottom margin line; let the
row shrink-wrap its 16px glyphs and the reveal lands ~14px of scroll late.
Verified at rest: inset `78.03px` against `--hud-margin` 40.5 +
`--hud-corner-zone` 37.53 at 1440×900, with the row 37.5px tall — fully
covered at `--hero-lift: 0`, the toggle unclipped beside it.

### A second reader of the bus, deliberately

`SettingsCluster` calls `useJourneyMarks` itself rather than taking a value
from `RailInstruments`. They are siblings under `LandingPage`, and the only
place to hold state between them is `LandingPage` — which owns the
`dangerouslySetInnerHTML` body and must not re-render. The hook is a pure
reader (one attribute-filtered `MutationObserver`, one gated passive
listener); ADR-002 bans new scroll WRITERS, and this adds none.

`MarkRow` is now shared by both corners, so the two rows cannot drift.

### What is NOT settled

The glyphs themselves — §4's open question — are untouched here. The lab
still prints all ten in ONE labelled row, which is deliberately not
production's shape: that row exists to judge the drawings side by side, and
the geometry was settled on the live frame.

## Rollback

`RAIL_INSTRUMENTS = false` drops both mark rows and the telemetry: no host
is created, `data-rail-instruments` is never set and every selector keyed on
it is unmatched — BOTH bracket suppressions, both widened clips, and the
bottom-right row's outboard anchor, which returns the theme switch to its
ADR-058 slot. The frame comes back byte-identically.

The destination marks are gated on that flag INSIDE `SettingsCluster` for
exactly this reason: they are journey marks, and the switch beside them is
not.

`SETTINGS_CLUSTER` is separate and must be flipped separately. It is not
gated by the flag above, because the theme switch is a shipped control that
predates these instruments — turning the journey marks off must not take the
site's only theme affordance with it. Flipping it back means restoring
`<LightModeToggle />` in `LandingPage`.
