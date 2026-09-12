# ADR-097 — The proof card is a folder

**Status:** Proposed (shipped and guarded, 2026-09-12; pending the owner's live read)
**Supersedes on the SKIN:** [ADR-094 U4](094-trinny-proof-stack-and-proposal.md)'s
flat `scale(1 − .02·cover)` + dawn wash, and [ADR-096](096-proof-stack-on-the-homepage.md)'s
opaque `--pf-plate` — the card's IA, its registers, its type ladder and the
stack mechanic are untouched
**Extends:** [ADR-089](089-casefile-is-one-housing.md) (the gold lip on a housing) ·
[ADR-065](065-corner-law.md) (§1 argued a tab as a fourth silhouette; **U1 below
retired it the same day** — the card is the chamfered housing it was) ·
[ADR-092](092-type-material-tokens.md) (the flat lip; two ratchets now pin the sheet)
**Related:** [ADR-030](030-tools-section-cover-stack.md) (the hook grows one channel) ·
[ADR-058](058-light-mode-theme.md) · [ADR-063 U2](063-map-reading-rail-and-wheel.md)

---

## The ask

Owner, 2026-09-12, on reading the proof stack live:

> I really like our new cards in the proof section. In terms of information
> architecture it's much easier on the eyes and easier to read, and there's a
> clearer narrative. What I do want to change is a bit of the look and feel.
> Right now they feel a bit out of place — we need to make them more like
> these retrofuturistic digital folder-type cards. Just like we have in our
> services section, that golden border should have a sort of glass-like
> effect, a bit transparent. The way they stack — now they're stacking
> horizontally, but maybe we can make them feel a bit more like 3D stacked
> cards. When the first card comes into view we need some opacity fade,
> because right now it's pretty harsh. And the top of the card where we have
> the client name could take a specific colour, a soft gradient — if I have
> another client I can then use another colour.

Four references: the Cyberpunk 2077 braindance monitors and the encrypted-log
panels (a label TAB at the top-left whose right end steps 45° down to the
body; panels behind peeking as a staircase of tabs; translucent bodies), and
the 4ST store's gold-outlined cards. He confirmed the folder-tab silhouette
and that the client colour itself is _"not important"_ — the mechanism is.

## What the card was, measured

- An **opaque** plate (`rgb(var(--void-deep-rgb))`) with **no opacity on the
  plate at all** — only the record and the field faded in. Card 1 caught
  mid-arrival (`--pc-enter` .35): card opacity **1.000**, record .025. That is
  the harsh entrance, as a number.
- One stroke, a dawn-.18 clipped ring; a full-width 52px head row with a rule
  under it; a flat 2 % scale on cover, so every covered card was the same
  card and the pile read as horizontal strips.
- `"Loop Earplugs"` a string literal in JSX — the one string on the surface
  the record did not supply — and no colour field anywhere on `CaseDef`.
- Five of the seven ingredients already present: the TR+BL chamfer, the
  `evenodd` ring, the exact `−0.586px` inner leg, a token-honest ground, the
  recession. The pass is additive.

## The decision

### 1 · The head row is the TAB

`--pf-tab-w: clamp(320px, 34%, 460px)` flat along the top, then a 45° step of
run = rise = the peek band (`--pf-tab-h: var(--pc-peek)`) down to the body's
top edge, which runs to the TR chamfer; BL stays. The grid row stays
`--pc-peek`, so the body, its insets, the type ladder and the **measured
runway** are byte-identical — only the silhouette moved. The head is
`width: tab-w + tab-h`, seated at the row's start, right-padded by the step
so the ordinal clears the diagonal, and it draws **no rule** (a folder's tab
is continuous with its body). The floor is the longest kicker
(`LOOP EARPLUGS · NAVIGATE`, 24 chars ≈ 198px + `04` + paddings ≈ 310).
Measured head widths: 399 @1280 · 443 @1440 · 512 @1920.

⚠ **UNDER ADR-065 THE STEP IS THE HOUSING'S OWN SILHOUETTE**, in the same 45°
vocabulary as its chamfers. It is not a notch (nothing is cut away from a
corner), not a bracket (the box is not rectangular) — a fourth form, the
folder's tab, lawful by **rule 5** (asymmetry is earned: the tab names the file
and marks the edge the pile is gripped by) and keeping **rule 4** because the
head itself carries **no cut**: the tint is a layer on the card's own
`background`, sized to the tab, that the housing's clip cuts. The nearest
precedent was astrogation's `--survey-notch-w/h` header step, which predates
the law and it never cited.

⚠ **THE RING'S INNER CONTOUR AT THE STEP INSETS −0.414px AT BOTH ENDS.** A 45°
line offset 1px inward is the same line shifted √2 in x, so the convex corner
AND the reflex foot move by tan 22.5° in the same direction. The first draft
had `+0.414` at the foot — a 0.8px kink in the ring on every card.

⚠ **≤960px THE TAB COMES OFF**, because the head wraps and may exceed the peek:
`--pf-tab-w: calc(100% − ch); --pf-tab-h: 0px` collapses BOTH polygons to
today's exact TR+BL shape (the duplicated vertices are degenerate) and the tint
layer to zero height; the head goes back to full width and paints the tint
itself. The inert rung (≤680h / PRM) keeps the tab and floors the head at the
peek — its rows are `auto auto`, and without the floor the head is ~12px while
the step is still 52, clipping the body's top-right away.

### 2 · Glass, and a FLAT gold lip

`--pf-plate: rgba(var(--void-deep-rgb), var(--pf-glass-a))` at **.62** (the
housing ran .42 with only the parked brandmark behind it; this card carries
dense copy over the same bed), `backdrop-filter: blur(14px)` under
`@supports`, no `brightness()` (the plate's OPEN-state lift turns a whole
housing grey — hud-panel-lab's finding), the plate's scanline UNDER the copy,
a **pixel-sized** bloom off the body's top-right (`460px 300px` — the plate's
`130% 70%` lights a whole quadrant on anything wider than a card). Measured:
`rgba(5, 4, 3, 0.62)` dark, `rgba(228, 218, 201, 0.62)` light.

The lip is **`color-mix(in srgb, var(--gold-line) 30%, transparent)`** — the
housing's own value. `--gold-line` is byte-equal to `--gold` in dark and
`#8a6b20` in light, so the lip re-derives for parchment with **no theme
branch**; measured `color(srgb .79 .65 .33 / .3)` dark, `(.54 .42 .13 / .3)`
light. ⚠ **FLAT, NOT THE SERVICES PLATE'S FOUR-STOP RAMP** — ADR-092 stage 1
U1 measured that a 168° ramp puts a wide frame's two longest edges through
its `.1` middle, so the biggest edges are the faintest; this card is that
frame class. The ramp is a one-line swap if the owner's still wants it.

⚠ **THE PADDED-GRADIENT SHELL IS NOT AVAILABLE ON GLASS** — at .42 the shell
reads straight through and lights the plate warm-grey (hud-panel-lab.css:378).
The ring is mandatory, and the card already had it.

⚠ **THE CONSOLE IS A CELL IN A GLASS HOUSING.** `--con-ground` — `--con-void`,
opaque outside `.fl-case` — went `transparent` on this route; otherwise two of
the four cards carried a solid slab over 60 % of a glass plate. The PAINT token
only: `--con-void` stays, because it is the bed for the station diamond and
`--pda-void`, the map's whole drawing floor (console.css:59–67).

⚠ **THE ARC DOSSIER WENT THE OTHER WAY, AND THE SCOPE IS THE ANSWER.** ADR-089's
own ruling: a console is a SCREEN you look into and takes a dawn edge; a
housing is the DEVICE the screen is set into and takes the gold lip. A card
holding a console is the housing case; `arc-dossier` is a record column with
three gold objects already in it and no console — its "no gold on it" stands.

### 3 · The pile recedes by DEPTH

The hook (`useStackedCardsScroll`) gains **one additive channel**,
`--pc-depth` = Σ of the enters above a slot (continuous, 0..n−1; 0 in the
parked branch; the same 0.001 delta gate). Its easing and `data-pc-state`
are untouched, and `/test/project-cards` ignores it. CSS windows the nearest
term — `--pc-dp = depth − cover + cov` — so the cover law survives: a card
never starts receding before the card covering it is visible.

`transform: scale(1 − .03·dp)` about `50% 0` (every top edge stays on its
sticky line, the tabs staircase inward one step per card — geometrically a
`translateZ` toward a top-centre vanishing point, without a `perspective` the
hook's `top` read could not survive); `opacity` dims `.08·dp`; the wash goes
toward the **ground** (`rgba(void-deep, .14·min(dp,3))` — void in dark,
parchment in light, where the dawn haze it replaced lightened one and darkened
the other). And a covered card's CONTENT leaves on the cover channel
(`record`/`field` opacity `× (1 − cov)`), so the front card's glass looks onto
an **empty folder** — its tab and its plate — not onto blurred text behind
text; `visibility: hidden` on a covered `.pf-card__body` keeps its controls
out of the focus order.

### 4 · The plate fades in

`--pc-in-plate = clamp(0, enter / .45, 1)` on the already-eased channel;
`opacity` on `.pf-card` = in-plate × the depth dim. Fully in before the record
(.34 → .84) finishes; exactly 1 at every pin, which is where the smoke reads
it. Measured mid-arrival: **.78** at 1440×900, .86 at 1920×1247 (was 1.000).

### 5 · The client's colour is a record field

`CaseDef.accent?: { rgb: readonly [number, number, number] }` — **numbers**,
because `cases-registry.test.ts` walks every STRING under the confidentiality
envelope and `"rgb(202,165,84)"` trips its thousands-separator rule. Sampled
from the client, never derived from the site's gold (`/trinny-london`'s
`--tl-brand-rgb` precedent). `proofStackClient()` hands `{ name, accentRgb }`
to `ProofStack`, which writes `--pf-accent-rgb` inline on `.pf-stack` only when
the record carries one; the sheet's fallback is `--gold-rgb`. The tab tint is
`linear-gradient(90deg, rgba(accent, --pf-tab-a) → × .25)`, `.28` dark, `.22`
light. `ProofCard` prints `client.name` — the literal is gone.

Loop's record sets **no accent** (owner: not important) — the tab is a soft
gold band today and any hue is one triple on `loop-earplugs.ts`. ⚠ A hue in
the mechanical gate's 230–300° band (purple/blue) would be a finding on the
card element; an owner ruling then.

### 6 · Light

`theme.css` BLOCK 4c on `.pf-stack`: `--pf-bloom-a .13 → .08` (gold on
parchment is a smear, not a catch), `--pf-tab-a .28 → .22`, and the blur off
(the bed under the pile is faded on that side — the `.fl-con` ruling above
it). The lip and the ground need nothing: both are already the parchment
values by token.

## What the guards did not see, and do now

- **`proof-stack.css` was in neither CSS ratchet.** The sheet's header and
  `.claude/rules/proof-stack.md` both claimed `type-material-tokens` pinned it
  at zero literals; the PINS map kept the sheet's OLD home
  (`trinny-london.css`) and never gained the new one, and `theme-css-sweep`'s
  SHEETS never had it. Both carry it now (0/0/0 — verified clean on adding).
- **The trinny smoke read the glyph width and the rail insets off TRANSFORMED
  rects**, and passed only because the recession was 2 % (`21 × .98` rounds
  back to 21). At `.91` it is 19. `mark` is `offsetWidth` now and the inset
  deltas are divided by the card's rendered-over-layout ratio — a rect is a
  picture of a layout.
- **The seat helper's rewind was a bet on a smooth scroll.** `<html>` scrolls
  smoothly, so `window.scrollTo` is an animation; the helper waited 250ms,
  the rewind was still ~900px short under load, the slot was still stuck,
  `offsetTop` read 743 instead of 0 and the solve overshot by a pitch onto
  `covered`. `settleScroll()` waits for scrollY to stop moving — and it is
  needed on BOTH scrolls: once the rewind actually lands, the SOLVE is the
  longer animation (~3000px to the last card) and a fixed 450ms read it
  mid-flight as `incoming`. The probe that found it is the record:
  `yBefore 8179` against a rewind target of `7260`, `offsetTop 743` for a slot
  whose flow offset is 0.
- **The mechanical gate is unchanged by the pass, and the pass did not clean
  it.** Under `--prm` on `.pf-stack` it reports 80 (dark) / 93 (light)
  findings on both routes, every one pre-existing and none naming the tab,
  the lip, the glass or the depth: the film's play disc (`border-radius:
50%`), the sheets plate's gold-outlined ads and the verdict's gold rule
  (`accent`), the casefile's verdict kicker and wire labels at the chrome
  floor (`contrast`, ADR-068's own standing numbers), and 71 wrappers
  reporting the page's inherited `IBM Plex Mono` (`fonts`). Their own pass,
  not this one.
- **The landing PNG baselines are LOCAL.** `tests/visual/*-snapshots/` is
  gitignored; the one frame that moved (`seam-corridor-to-services`, 50 %,
  13 % of pixels — the pile's top) was re-generated on this machine and the
  HUD pair passed unchanged. Nothing to commit for it.
- **New smoke asserts:** the tab (head < 60 % of the top edge, seated at the
  left, the ordinal clear of the diagonal), the lip (gold, r > b, α ∈ (.2,.4),
  whichever way the engine serialises `color-mix()`), the glass (plate α < 1),
  the mid-arrival fade (card 1 at enter ∈ (.25,.45) has opacity ∈ (.2,.95)),
  the pile (states `covered ×3 + pinned`, depth₀ ≥ 2.9, scale₀ < scale₂ < 1,
  the open card unscaled, the covered body hidden).
- **The mechanical gate cannot see a clipped ring** — it judges `border*Color`
  and `outline`, never a pseudo's `backgroundImage`, and its `parse()` skips
  `color(srgb …)`. `.pf-card::before` is in `ACCENT_ALLOW` as a declaration of
  the ruling, not as a gate.
- **`capture-proof-stack.mjs`** gained `--mid` (card 1 mid-arrival), `--perf`
  (a rAF-delta sampler through the whole pile) and the folder's readouts.

## Cost

Perf, the whole pile scrolled at reading speed, long-frame share (>33ms):
1440×900 **17.9 % → 14.9 %**, 1920×1247 **22.4 % → 15.1 %**. The glass costs
nothing measurable against the corridor already under it; the fallback
(covered cards drop the blur, `--pf-glass-a` densifying on cover) stays
unbuilt.

## Update 1 — the band, not the tab (2026-09-12, owner, on the live read)

> Overall, it looks good, but I think having the gradient only on the left,
> where we have the client title, doesn't really work. I want the full top
> row to have that gradient, and let's keep that notch in the top-right
> corner because I feel like you removed the top part you shouldn't have.

**The tab-only cut is off; the folder is the BAND.** The head is a full-width
row again (its rule under it restored, `gap: 24px`, `padding: 0 --pf-card-px`
— the composition he approved before this pass), tinted end to end with the
client's gradient (`.pf-card__head { background: linear-gradient(90deg,
rgba(accent, --pf-head-a) → × .25) }`), and the card's silhouette is the plain
TR+BL housing: the top-right region the tab left open is back, notch and all.
Glass, lip, depth, fade and the client plumbing are untouched.

What it corrects in §1's reading of the references: the braindance panels'
teal header is a band that runs the full width of a panel whose corners stay
cut — the folder read comes from the BAND over a body, not from a step in the
outline. The log panels' stepped tab was the one reference of three that had
the cut, and the composed pile gets its staircase from the depth scale
anyway. §1's ADR-065 argument for the step is therefore moot; nothing new is
claimed under the corner law — the card is the chamfered housing it was.

Mechanically: `--pf-tab-w/h/d`, the tint layer on the card's background, the
eight-point polygons and their `−0.414px` inner step, the ≤960 collapse and
the head's step padding are all gone; `--pf-tab-a` is `--pf-head-a` (sheet +
theme.css). The bloom returns to the card's own top-right (`−40px`). The
smokes' tab reads became band reads (head ≥ 98 % of the card, a gradient
`backgroundImage`, the ordinal inside it), pinned from both ends as before.
Measured: head 1150px @1440 (the card's width), the lip and plate unchanged.

## Update 2 — the rail on the record's datum (2026-09-12, owner, third live read)

> I don't think the gradient works with the tabs. I do think that we need to
> harmonize the tabs. I think we should move down the tabs in the cards that
> have them so they're vertically aligned with the title in the left panel.
> They need to be a bit higher, and then the line on which the visual and the
> text live needs to connect to those tabs. Right now, they're disconnected,
> but they need to be connected.

Measured before touching anything, at 1440×900: the rail sat at the body's top
edge, **37px above the title**, its boxes were **22–23px tall inside a 34px
row**, and the divider between record and field ran the full height with an
**18px gap** to the rail — nothing on the field side shared a line with
anything on the record side. That is the "disconnected", as numbers.

**Three changes, one datum.** `--pf-card-py` is the record's top padding, so it
is the term the title hangs off; the field now takes it as `padding-top`, and
its `::before` draws a 1px `--pf-rule` at exactly that y, `left: 0` to
`right: 0`. The field's border box begins where the record's `border-right`
ends (measured: 0px between them), so the rule terminates ON the divider — a T
weld — and runs 690px to the card's right edge. The rail's row starts on that
same line, and the stations hang `--pf-rail-hang` (8px) below it at
`--pf-rail-h` (30px), stretched rather than centred so the row's height IS the
box's. Measured after: rail top 153, title top 153, station 30px, weld 0px.

⚠ **THE RULE MAY NOT BE COLLINEAR WITH THE BOXES' TOP BORDERS, AND THE FIRST
CUT WAS.** The reasoning was that one continuous line — the rule and each box's
own 1px `--pf-rule` edge on one y — is stronger than a line plus a row, and it
avoids two hairlines in a 5px band (ADR-089 U3's doubled-rule defect). On the
still it is the opposite: the boxes cover 97 % of the run, so all that paints is
an **18px stub at each end**, and at dawn .18 an 18px stub is invisible. The
divider and the first station still read as disconnected — the exact defect the
rule was added to fix. **A line a box sits on is a line you have deleted.**
Found by looking at a 3× crop of the junction, after the computed style had
already reported the rule present, 1px, correct colour, correct y.

⚠ **AND THE PROBE THAT FOUND IT NEARLY DID NOT RUN**: `getPropertyValue
("--pf-card-py")` returns the `clamp()` EXPRESSION, so `parseFloat` gave `NaN`
and the screenshot clip was rejected as "outside the resulting image". A custom
property is a string until something lays it out — `.claude/rules/interface-kit.md`
states this law and this is its third surface. Read the resolved
`paddingTop` off the element instead.

**The cost, stated:** the bay loses 41px (37 of datum + 8 of hang − 4 the
shorter row gives back), so the height-bound film narrows 347 → 316px and its
caption wraps to two lines at 1440×900. Nothing clips. The film cannot be given
the height back without breaking U8's floor rule, which is the other half of
what makes the two columns read as one card.

**The gradient is untouched.** "I don't think the gradient works with the tabs"
resolves as a spacing complaint rather than a colour one: the band and the rail
were 5px apart, so the tint's quiet end sat directly on the stations. With the
rail 37px down on its own datum the band is alone on the top row.

## Update 3 — the frame opens into the rail (2026-09-12, owner, fourth live read)

> Okay, this looks good, but the horizontal divider or border for the frame
> where the images live, we shouldn't have that. The vertical lines should
> just connect to the tabs above it.

U2 put the rail on the record's datum and left the framed kinds untouched, so
each still drew a full box **13px below the rail** — a lid under the row of
boxes, and two side walls that stopped short of the stations they belong to.
The frame is a bay the rail is the HEAD of; it opens into it.

**Three terms, all deletions.** `--pf-field-gap` — "the rail's clearance" — is
gone from `.pf-field`'s inset, which now runs `0 0 var(--pf-card-py) 0`;
`--con-gap` is `0px` on this route, so the console's box IS the field's box
rather than 5px inside it; and both framed kinds take `border-top: 0` — the
shared `.fl-con__console` (sheets, map) and the tools' own `.pf-field--tools`
bay. The walls now rise into the stations' outer edges: measured frame left
620 = first station left 620, frame top = rail bottom.

⚠ **THE TOKEN IS DELETED, NOT ZEROED.** `--pf-field-gap` was subtracted in two
derived heights — the film's width (`100cqh − gap − py − …`) and the wire's —
so zeroing it would have left a no-op term in two arithmetic chains that the
next reader has to disprove before touching either. All three sites moved
together.

⚠ **THE PIN IS FROM BOTH ENDS.** A box that had lost ALL its borders would
satisfy "no top border" perfectly, so the smoke asserts the lid is `0px` AND
that the left wall is not — plus the wall reaching the rail and landing on the
first station's edge. The same shape as ADR-065 U4's corner guard, and for the
same reason.

**What it gives back:** the film gains the 13px the gap was holding
(316 → 326px wide). Its caption still wraps to two lines at 1440×900 — one
line needs ~347px, which the datum's 41px does not leave. Recorded rather than
chased: the alignment is the ask and the wrap costs nothing but a line.

## Update 4 — the rail is full-bleed (2026-09-12, owner, fifth live read)

> I do think, though, that the tabs need to connect with the vertical rail
> that separates the left and the right panel. That way, it really feels like
> an integrated thing. I think the tabs should be full width and should also
> reach the edge on the other side. The visuals and the text can remain
> centered with some padding or margin, but for these tabs, it needs to be
> like this.

`.pf-card__tabs` negates the field's `padding-inline`, so the first station's
left edge lands ON the divider and the last one's right edge on the card's own
edge. Measured: 0px at both ends, where each was 18px. Everything else — the
bay, the frame, every drawing — keeps `--pf-field-px` untouched.

⚠ **THIS REVERSES ADR-094 U8's ≥15px RAIL INSET, WHICH WAS THE OWNER'S OWN
NOTE** ("too close to the center border and the right border"). It is not a
contradiction and should not be recorded as one: U8 was about the elements
INSIDE the panel, and this is the ruling that **the rail is not one of them**.
The rail is the panel's head; the panel's contents are what keep a margin.

⚠ **AND IT NARROWS U3's ALIGNMENT CLAUSE, WHICH LASTED ONE PASS.** U3 read
"the vertical lines should just connect to the tabs above it" as the frame's
walls rising into the stations' OUTER EDGES, and pinned `frameLeft ===
stnLeft`. With the rail full-bleed those are 18px apart by design. What
survives of U3 is the part that was actually asked for — the frame has no lid
and its walls reach the RAIL's underside; where they land horizontally was my
inference, not his instruction. The smoke now pins the difference in both
directions: the rail on the field's edges, the frame on the field's padding.
A rail that drifted inboard and a frame that went full-bleed would each look
like the other's fix, so neither half can be asserted alone.

## Update 5 — the datum stops being drawn (2026-09-12, owner, sixth live read)

> Remove the line above the tabs.

The hairline `.pf-card__field::before` drew at the field's datum is deleted,
and the datum stays — it is `padding-top` on the field, so the row is still on
the title's line. `--pf-rail-hang` stays too, as the air over the row rather
than as clearance under a drawn thing.

**It was two statements of one weld, and U4 is what made it so.** U2 added the
rule for a reason that was true when it was added: the rail was inset 18px
from the divider, so something had to reach across. U4 took the rail
full-bleed onto the divider — the rail now IS the connection — and the rule
was drawing the same relationship a second time, one line higher. The
instruction to delete it is the correct reading of a surface where the earlier
fix has been superseded by a later one.

⚠ **THE SMOKE'S POLARITY IS INVERTED, NOT DROPPED.** It asserted `ruleContent
!== "none"`; it asserts `=== "none"` now, beside the unchanged datum check.
Deleting the assertion instead would have left the rule free to come back on
the next pass through this block — which, across five updates in one day, is
the failure mode this surface actually has.

## Update 6 — the rail moves into the band (2026-09-12, owner, seventh live read)

> Can you maybe try to integrate the tabs into the top part where we have the
> client name … before you implement it show me a screenshot from a test page
> on how a proof card would look like.

Then, on the first cut:

> This looks ugly and it should never extend too much to the left side where
> the left panel sits, it should remain on the right side.

### Drawn before it was chosen

`/test/proof-card-head-lab` draws the REAL card three ways — `ProofCard` took
one optional `railSeat`, so nothing about production moved while the question
was open. Two rounds: the first put the rail across the whole band, the second
answered both halves of the note above.

### The band is the body's grid now

The first cut let the rail flex across the row, and at four stations it reached
a third of the way over the RECORD: a control for the right panel, drawn above
the left one. So `.pf-card__head` carries the body's own `2fr 3fr` tracks when
a rail is in it — the identity takes the record's cell, the rail takes the
field's. **Crossing the split stopped being something the rule can do**, which
is a different guarantee from it happening not to.

It sits on `--pf-field-px`, the FIELD's inset, not the card's: the stations
land ON the bay's verticals rather than near them, and a 4px miss there is the
kind nobody can name.

### The station is flat

A bordered, filled box in the band reads as a control bolted onto a label —
that is what "ugly" was. The lit station is the one gold thing and its diamond
is the marker, which satisfies ADR-063's law by the MARK rather than by a fill.
Measured after: the lit label is 5.26:1 on light and 8.80:1 on dark, and the
dim station is the kicker's own colour, so the band is one row in one voice.

⚠ **THE BORDER GOES TRANSPARENT, NOT AWAY.** Zeroing the width moves every
label a pixel and re-flows the row — this repo's own standing lesson one
surface over (`border-bottom-color: transparent`, never `border-bottom: 0`).

### Three of this ADR's own rulings are retired BY THEIR REASONS

- **U2, the rail on the record's datum.** The datum survives; the BAY inherits
  it. `--pf-card-py` is the record's top padding and the field's, one term, so
  the delta is still 0 by construction.
- **U3, the frame opens into the rail.** The lid came off because "the vertical
  lines should just connect to the tabs above it" — the rail WAS the bay's
  head. With the rail in the band the box was left with two walls rising into
  40px of empty field, which the lab's own still showed plainly. **The lid is
  back**, pinned from both ends so a frame that got every border back fails as
  loudly as one that lost them all.
- **U4, the rail is full-bleed.** That was about a rail spanning the PANEL it
  sat on; this rail does not sit on one. What survives is an INEQUALITY: the
  row starts at or right of the divider and stops at or inside the card.

U1 (the band is the client's), U5 (the datum is undrawn) and the folder skin
are untouched.

### Rejected

**The boxes in the band** (`panel` in the lab, drawn and shot). It keeps
ADR-089 U4's fill-among-outlines law and U4's connection to the divider, and
at four stations it is genuinely good — but the films card carries two, where
each box becomes a 450px slab, and it sits two slots above the tools card in
one pile. A grammar that changes weight with its own item count is not one
grammar.

## Left open

- The owner's read of the remaining dial: the flat lip vs the plate's ramp,
  and the console's transparent ground.
- Loop's tab colour — any triple, one line, when he wants one.
- `bedOf()` in the light walk now walks past the glass card to `body` for the
  map and sheets cards (optimistic by the glass-over-page delta). Hardening:
  accumulate `over()` through translucent ancestors.
- `/trinny-london` wears the whole skin (one sheet, by design) and now shows
  Loop's gold tab two beats before Trinny's coral turn — correct, and he
  should see it.
- The capture's seat for the LAST card scrolls 35 % into a dwell that slot
  does not have in full, so its still sits 14–39px above the pin; a real
  scroll pins it. Pre-existing; the smoke is unaffected.
