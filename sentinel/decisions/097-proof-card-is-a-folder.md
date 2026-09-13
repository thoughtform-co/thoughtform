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

## Update 7 — the ordinal goes, and the rail comes home (2026-09-13, owner)

> Remove the numbers (01 etc) — and I don't think the tabs in the header is
> working; can't we restore them in their original position?

**Two deletions, one of them a retirement.** `.pf-card__arc` and its rule are
gone from the card and the sheet; `ProofCard`'s `railSeat` default goes back to
`"field"`, which retires U6's band seat on both hosts. The `railSeat` prop,
the `"panel"` / `"flat"` skins and `/test/proof-card-head-lab` all stay — they
are the comparison lever, and ADR-070 U35's rule is that the losing drawing
goes WITH its guards once the owner has read it, not before.

⚠ **THE CSS REVERTED ITSELF, WHICH IS WHY THE SEAT WAS SAFE TO FLIP.** Every
band rule is scoped to `[data-pf-rail]`, an attribute only the head seats
write, so the field seat restores U3's open frame and U4's full-bleed rail with
no rule edited. The SMOKES did not: U6 had rewritten the folder block to read
the rail from the head, to expect the frame's lid back and to expect a flat
station, so restoring the seat meant restoring those three pins as well. A
skin that reverts by attribute and a guard that reverts by hand are the two
halves of one change, and only one of them is automatic.

⚠ **THE PEEK BAND HAS NOTHING LEFT TO TELL THE PILE APART.** The ordinal held
the head's right slot from ADR-094 U4 precisely because `01 … 04` differs per
card; three of the four `phase` values read `Build`, so the sliver a covered
card shows is now `LOOP EARPLUGS · BUILD` on cards 1–3 and `· NAVIGATE` on 4.
That is the defect U1 and U4 both solved, re-opened deliberately — the owner
has read this pile with the numbers on it for a week. `track.arc.step` stays in
the RECORD and `trinny-proof-order.test.ts` still pins the sequence against it;
it letters nowhere on the card.

⚠ **BOTH SMOKES PIN THE ABSENCE, NOT THE SILENCE.** The ordinal assertion was
`["01","02","03","04"]`; it is `arcs === 0` per card now, beside
`headRails === 0`. Deleting the assertions instead would leave the head's right
slot free to refill one card at a time — and across seven updates in two days,
that is this surface's actual failure mode.

## Update 8 — the rail is the frame's width, and the columns lose their line (2026-09-13, owner)

> So the length of the tabs should be the same as the right panel where the
> image and text lives. Let's maybe also remove the vertical divider between
> the left and right panel.

`.pf-card__tabs` drops U4's negative margin and takes the field's own
`padding-inline`, so the rail's two ends ARE the frame's two ends — 620 → 1274
at 1440×900, one column with the rail as its head. `.pf-card__record` loses its
`border-right`.

⚠ **THIS REVERSES U4 BY U4's OWN REASON.** U4's point was that the rail should
share an edge with what it heads; it read "reach the edge on the other side" as
the CARD's edge because the divider was still drawn to reach on the near side.
With the divider gone there is nothing to meet out there, and the only edge
worth sharing is the frame's. ADR-094 U8's `--pf-field-px` inset — reversed at
U4, restored here — is back in force for the whole panel, rail included.

⚠ **THE SPLIT SURVIVES THE LINE.** It is the body's `2fr 3fr` grid, which is
why removing the border changes no geometry: the field's box still begins
exactly where the record's ends (measured 0px), and the smoke still pins that.
What separates the halves now is what the right one IS — a framed box inset off
a column edge. The stacked rung keeps its own `border-bottom` at ≤960: there is
no left and right there, and two columns running into each other vertically is
a different problem.

⚠ **THE GUARDS WENT BACK THROUGH THREE STATES IN TWO DAYS** — U8's ≥15px inset,
U4's full-bleed equality, U6's sign-check inequality for the band seat, and now
U8's floor again. Each was correct for the seat it was written against, which
is why the smoke's message strings name the seat and not just the number: a
bare `>= 15` tells the next reader nothing about which of the four rulings it
is enforcing.

## Update 9 — the frame's floor is the card's lip (2026-09-13, owner)

> The borders left and right of the image needs to touch the bottom border.

Measured first: the framed box closed on its own bottom **37px above the
card's edge** on all four cards — `--pf-card-py`, ADR-094 U8's "EVERY FIELD
ENDS ON THE RECORD'S FLOOR" — leaving the walls terminating in a band of bare
plate with the card's gold lip below them. `.pf-field`'s inset goes to `0` on
all four sides and both framed kinds take `border-bottom: 0`, so the box fills
its bay and the CARD's lip closes it. Measured after: frame bottom = card
bottom, 0px, on every card.

⚠ **THIS RETIRES ADR-094 U8's FLOOR RULE, AND THE ANSWER IS THE SAME ONE U3
GAVE AT THE TOP.** U8 inset the field because a console running to the card's
edge drew its own bottom line 37px under the record's last rule — two floors.
The fix is not to move the box back up but to stop drawing the second line: no
lid because the rail is the head, no floor because the lip is the floor. The
frame draws walls and nothing else.

⚠ **THE COST IS THE ALIGNMENT U8 BOUGHT.** The record's last rule now sits
~37px above the field's floor rather than on it. That asymmetry is what U8
existed to remove, and it is re-opened deliberately; the trinny smoke's
`register and box share one floor` equality is replaced by the relation that
survives — the register ends at or above the box's floor, by the record's own
padding and no more, so a register overrunning its column still fails.

⚠ **THE FLOOR TERM WAS IN TWO DERIVED HEIGHTS**, exactly as the top inset was
at U3: the film's width and the wire's both subtracted `--pf-card-py`. Deleted,
not zeroed. `--pf-card-py` is now the record's padding and the field's DATUM
only — its comment says so, because a token used at one end and not the other
is the kind of thing the next reader assumes is symmetric.

## Update 10 — the card is a terminal of frames (2026-09-13, owner)

Read live beside Vilimovský's Cyberpunk 2077 panels (the medical screens, the
quest display, the industrial monitors — every region a discrete bordered frame
with air between, the tab row a row of detached boxes with the open one filled)
and Starfield's starmap TRAVEL DATA panel (a full-width `JUMP [X]` button at
its foot):

> I think we can harmonize it and try to connect everything with lines. I don't
> think it really works — it's like uniformizing and harmonizing all the cards.
> If you look at the screenshots, you also have a sort of terminal interface,
> and in that interface you have different frames. I think that's what we also
> need to do. I think the tabs don't need to have a border connected to them.
> They're just items, and when you click on them, things switch.
>
> The text at the bottom [THE STANDARD] also needs to be a separate frame. It
> needs to be a bit higher, and the left and right borders should not touch the
> bottom panel. Instead, it should have a horizontal divider so it really feels
> like a separate frame/block. And then [on "We built the tools the work
>
> > needed"] IN SERVICE — we need to remove that. That also gives us some extra
> > real estate. Watch Walkthrough should also be a bit higher, and the same with
> > every frame at the bottom in the right panel. The bottom needs to be aligned
> > horizontally with the bottom divider of the left panel … the elements on the
> > right side should never be lower than that one. For Watch Walkthrough we can
> > maybe make a bigger button like the Starfield one.

Asked the three things it left open, he chose: the button a **gold OUTLINE
that fills on hover**; the **left column stays ruled text** (its last rule IS
the floor); the **films card gets the same frame** as the other three.

**Measured before** (1440×900, dark): lid `0px` and floor `0px` on every
framed kind, frame bottom = card bottom (U9), the record's last rule 37px above
that floor, the tools box a three-row apparatus (`IN SERVICE 2025` at 30px, the
watch bar at 30px, fused), the film unframed.

**The panel is three DISCRETE regions on one inset, all square, all at
`--pf-rule`, one token of air between them, the last one on the record's last
rule.** THE RAIL — its boxes were already the detached-items grammar; what
joined them to the frame was the frame's walls rising to their bottom edge, and
that goes. THE EVIDENCE FRAME — a closed four-sided box on EVERY kind: the
shared `.fl-con__console` (sheets, map — its own edge was dawn .08 against the
tools box's .18, and one panel cannot carry two frame weights),
`.pf-field--tools`, and `.pf-field--films`. THE FOOT — an optional second box
under the frame: the studio's verdict, the tools' walkthrough button; the films
and the map put nothing there and their frame ends on the floor itself.
`--pf-frame-gap` (10px, fixed — chrome air like `--pf-rail-hang`) is the field's
`row-gap`, so rail→frame and frame→foot are one number.

**Measured after** (`capture-proof-stack`'s new `panel` line): borders
`1/1/1/1` on all four kinds; `rowGap` 10; rail→frame 10 on all four;
frame→foot 10 on the studio and tools cards; the last region's bottom against
the record's last claim rule **0px on every card**, at every shape read —
1440×900 dark and light, the owner's 1920×1247, 1280×720, and the ≤680h inert
rung; `.pf-bay__head` 0. The button is 60px at 1920×1247, 50 at 1440×900 and
44 (its floor) at 1280×720; the verdict block 89 / 84 / 82. ⚠ The mechanical
gate (`--prm`, both themes) now lists the button under `accent` — a gold
outline 654×50, beside the three ads' own gold borders — which is the owner's
chosen rim and the gate doing its job (ADR-091: gold buys one thing); its other
findings (`fonts` 71 — IBM Plex Mono inherited on the containers, `radius` 1 —
the film's cue, the 8.5px wireframe labels and the light kicker under 4.5:1)
predate U10 and are unchanged by it.

⚠ **THIS RETIRES U3's OPEN LID AND U9's OPEN FLOOR TOGETHER, BY THE OWNER'S
OWN READING.** Both fused the frame to a neighbour — U3 to the rail ("the
vertical lines should just connect to the tabs"), U9 to the lip ("touch the
bottom border") — so the walls would connect. Read beside the references,
connecting was the defect: a terminal's regions connect to nothing, and the air
between them is what makes each one a frame. Nine updates on this surface were
about how the rail, the frame and the floor JOIN; the ruling is that they do
not.

⚠ **ADR-094 U8's ONE FLOOR IS BACK, AS THE FIELD'S OWN `padding-bottom`.** U9
retired "every field ends on the record's floor" and paid for it with a 37px
asymmetry; the owner's "aligned horizontally with the bottom divider of the
left panel" is that rule restated. It returns symmetric with the datum —
`.pf-card__field { padding-block: var(--pf-card-py) }`, one term at both ends,
the same term the record pads by — so the rail's row and the title start on one
line and the panel's last frame and the record's last rule end on one. The
trinny smoke's `[0, 60]` relation (U9's relaxation, which under U10 would have
stayed green while asserting nothing) is the `≤ 2` equality again. ⚠ U8's
apparatus HEAD does not come back with its floor: `IN SERVICE {year}` is deleted
from the card (the year stays in the record and on the homepage bay's FEED
line), and the tools box is the drawing's alone.

⚠ **THE FOOT IS A PORTAL SLOT OUTSIDE THE SIZE CONTAINER, AND `:empty` IS ITS
ROW.** `ProofCard` renders `.pf-card__foot` after the bay as an IMPLICIT third
grid row, holds its host in state through a ref callback (the `railHost`
mechanism), and `ProofField` portals the tools' `.pf-watch` into it and hands
it to `SheetsPlate` as `verdictHost` — the plate's SECOND additive seam, on the
rail's terms exactly: omitted, byte-identical, which the casefile and the arc
portfolio's `fillUnion` pin rely on. Two reasons it is a portal and not a CSS
split: the bay is the size container and every drawing derives from its
`100cqh`, so a foot OUTSIDE it shrinks the bay by the foot's height and no chain
has to know — a foot inside it is one more term in every chain, which is what
the head row and the watch row were until now; and a CSS split cannot close the
console's box ABOVE a verdict that lives inside the console's own flex column
without reaching into `casefile.css`. `.pf-card__foot:empty { display: none }`
is what gives the films and the map no row and no second gap — never a third
EXPLICIT track (an empty explicit track still takes a `row-gap`), and the JSX is
a self-closing div (a whitespace child defeats `:empty`). Both blocks render IN
PLACE until the host exists (the server, the first client render), so hydration
matches and a no-JS reader keeps both; the host is set in the layout phase and
they move before the first paint.

⚠ **TWO CHAIN TERMS ARE DELETED, NOT ZEROED.** `--pf-bay-head-h` and
`--pf-watch-h` leave `--pf-wire-h`, which is `100cqh − 2px − 2·pad` now (the 2px
is the lid and floor a closed box has); the film's width gains the same 2px.

⚠ **THE BUTTON IS A BUTTON, NOT A BAR.** ≥44px (`clamp(44px, 5.5svh, 60px)`),
the panel's width, the label centred in a three-track grid so the duration chip
— the reference's `[X]` key, an outlined box in the button's own ink — can never
push it off centre. Outline in `--gold-line` with `--gold-ink` ink at rest,
`--gold` with `--gold-contrast` on hover and focus: the services drawer's
big-CTA precedent (ADR-050) and this rail's own lit station. NOT gold at rest,
by the owner's choice and two standing reasons — a gold slab under a gold
station is two lit things in one panel (ADR-063's count), and a full-width gold
bar is the drawer's booking CTA's silhouette (ADR-050 Addendum 5). The two
alternatives are two-line swaps, recorded here and not in the sheet: **(b)** the
reference's light fill — `border-color: var(--pf-ink); background:
var(--pf-ink); color: rgb(var(--void-deep-rgb))`, both tokens ADR-058-swapped;
**(c)** gold at rest — `border-color: var(--gold); background: var(--gold);
color: var(--gold-contrast)`. All three pass `theme-css-sweep` (never `--void`
ink on a gold fill). ⚠ The type stays 11px PT Mono: the stations above it are
11px, and a button one rung larger than its tabs is a second chrome size —
height and the rim are what make it bigger.

⚠ **THE VERDICT IS STATED, NOT INHERITED.** Outside `.fl-con` and `.fl-case`
the casefile rule's `--con-hair`, `--fl-plate-px`, `--fl-chrome-sm` and
`--fl-ink-dim` are undeclared — its `border-top` invalidates at computed-value
time and its paddings fall to fallbacks — so `.pf-card__foot .fl-verdict`
declares every value on `--pf-*` tokens; the family and the uppercase still
reach it by class. Its paragraph reserves two line boxes (`min-height: 2.8em`):
the three verdicts run one or two lines at card width, and a foot that changed
height on a rail switch would resize the bay and re-solve every `cqh`-derived
drawing above it.

⚠ **A CLOSED CONSOLE DOUBLES THE RED LINE'S OWN HAIRLINES.** `casefile.css`
gives that sheet's four bands a top rule each (the first at gold .24) and the
last a bottom rule, drawn for a console that opened into its rail and closed on
its verdict; inside a closed frame the first sits 0px under the dawn lid and the
last 0px over the dawn floor — the doubled seam its own
`.fl-caps--sheet + .fl-verdict` rule exists to avoid. Two
`.pf-field--sheets`-scoped overrides zero them. The ads take
`clamp(10px, 1.6cqw, 18px)` of air inside their frame for the same reason the
tools keep `--pf-bay-pad`: flush against four hairlines a photo reads as cropped
by the frame. That inset is a dial.

⚠ **THE ≤960 RUNG'S FLOOR IS `--pf-field-px`, NOT `--pf-card-py`.** Stacked,
there is no record floor beside the field to land on: the record's padding
leaves a band of plate under the frame, and 0 puts the frame's floor on the
lip's own pixel row — U9's doubled line. The field's inline inset is what the
frame already sits inside on its two sides. And `console.css`'s ≤980 unwrap
sets the console's `border: 0` at (0,1,0); the frame law's (0,3,0) wins there
on purpose — the flow rung is a terminal too.

⚠ **THE LAB'S LID RULE IS DELETED AS A NO-OP.** U6's
`[data-pf-rail] … { border-top: 1px }` gave the frame its lid back while the
rail was in the band; every frame carries its lid on every seat now.

**Guards.** Homepage smoke: the lid and the floor pinned `1px`, both walls
non-zero; `frameTop − tabsBottom = rowGap` (fused at 0 and floating at 30 both
fail) with the gap itself pinned `[8, 14]`; `fieldPadBottom = paddingTop`
(datum and floor one term); the foot present on the tools card, the button its
child, one gap under the frame, ≥44px, rimmed, spanning the frame; the foot's
bottom on the record's last claim rule (≤2); `.pf-bay__head` count 0; per card
in the clip sweep `frameClosed`, `floorDelta ≤ 2`, the foot row present exactly
on the studio and tools cards, the verdict the foot's child on the studio card;
in light, the button's label ≥ 4.5:1 on its bed. Trinny smoke: the same
relations through `k` (the covered cards' scale), the `[0, 60]` back to `≤ 2`,
`bayHeads === 0`, the film's and the map's frames closed and on the floor with
no foot. Unchanged and green: the datum, the rail's `[4, 14]` hang, the rail =
frame width, the ≥15 inset, `recordBorderRight`, `arcs`/`headRails` 0;
`type-material-tokens` at `{0,0,0}`, `theme-css-sweep`, `arc-portfolio-smoke`
(the plate's byte-identity).

## Update 11 — the first card materialises (2026-09-13, owner)

> It would also be cool that, when you scroll into the proof section where you
> see the big cards, we have a cool glitch effect where the first card appears.
> The others can just scroll over it as it is now. From an experience point of
> view it would be nice to have it appear in a glitch effect.

Card 0 alone. Everything about the pile's mechanic, its geometry and the other
three cards is untouched.

**Three ways to spend it, and the owner picked the first.** (a) The card is
ABSENT through its whole rise and is struck into existence in its last ~140px;
(b) it still slides up as today and arrives mid-burst; (c) the burst fires only
once it is fully pinned. (b) puts two motions on one object at once, and (c)
leaves a reader who stops a few pixels short looking at nothing. **The cost of
(a) is named: for most of its travel the first card is not there**, so what the
reader watches on the approach is the corridor's own dissipate — which is the
beat that runs there anyway, and the card then announces itself rather than
drifting in.

### The trigger is a CHANNEL, never `data-pc-state`

`ProofStack` writes `data-pf-arrive` — `await` | `in` | `out` — on the SLOT,
off the hook's own `--pc-enter`, with a hysteresis of **0.92 in / 0.82 out**.

⚠ **`data-pc-state` HAS NO MEMORY OF DIRECTION.** A covered card returns to
`pinned` the moment the card above it scrolls back down, so a state-keyed
animation would re-fire the burst on a card that never left — four times on the
way back up the pile. `--pc-enter` stays at 1 for the whole time slot 0 is
covered, so a threshold on it fires exactly once per real arrival and re-arms
only on a real departure. Measured: `out` at ratio 0.60 on the way back, `in`
again on the way down, and **card 0 sitting `covered` at opacity 0.760** —
which is the depth dim still reaching it, i.e. the proof that the burst ended
on the cascade.

⚠ **IT READS THE INLINE VALUE, NOT THE COMPUTED ONE.** `proof-stack.css`
declares `--pc-enter: 1` on every slot as its SSR rest state, so a
`getComputedStyle` read at mount says 1 for a card three viewports below the
fold — it would fire the burst where nobody is looking and then never fire it
again. The inline property is empty until the hook writes, which is also the
event the observer is waiting for. (It is the cheaper read besides: no style
resolution inside the hook's own frame.)

⚠ **IT OBSERVES, IT DOES NOT LISTEN.** A `MutationObserver` on the slot's
`style` attribute — the hook's writes are delta-gated at 1e-3, so it is silent
at rest and runs inside the hook's existing rAF. This surface has ONE scroll
reader and does not get a second.

⚠ **A CARD ALREADY COVERED IS SEEDED SHOWN, SILENTLY.** On a reload deep in the
pile slot 0 is `covered` with `--pc-enter` at 1; a burst there would fire on
something nobody can see and leave it lit under three other cards.

### The skin, and where its grammar comes from

640ms, three animations on `.pf-card`, in the exact inverse of the pile's inert
rung (`min-width: 961px` and `min-height: 681px` and
`prefers-reduced-motion: no-preference`).

- **`pf-glitch-bands`** (420ms, `steps(1, end)`) — band dropout as `clip-path`
  combs: eighths, lit in a SHUFFLED rank ({2,5} → {0,2,5,7} → … → whole), which
  is `themeGlitch`'s own law (a monotonic order reads as a wipe, and a wipe is
  the one thing a glitch must not look like). **Band 0 carries the TR cut and
  band 7 the BL**, so the silhouette is never square for a frame.
  ⚠ **A COMB IS ONE POLYGON**: each lit band traced clockwise, bridged down the
  left edge and closed back up it, where the bridges and the return are
  collinear and enclose nothing — **non-zero winding, never `evenodd`**, which
  would cancel them.
  ⚠ **`clip-path`, NOT `mask`.** The chamfer is already a clip on this element;
  the bands ride the same mechanism rather than introducing a second one over a
  `backdrop-filter` whose behaviour under a mask is unverified.
- **`pf-glitch-strike`** (640ms, linear) — the `#about` terminal power-on as
  TIME rather than as scroll: strike to 0.62, drop out to 0.12, settle to 1,
  with the house's self-cancelling 2.5px lateral tear. Verified against the
  keyframes at five offsets (0.352 at 40ms, 0.353 at 140, 0.149 at 260, 1 at
  420 — the curve, to three decimals).
- **`pf-glitch-chroma`** (640ms, `steps(1, end)`) — the hologram's `vwhSettle`
  chromatic split, resolving over the settle half only.
  ⚠ **THE SPLIT CARRIES IT, NOT THE BRIGHTNESS.** The hologram's own peak is
  1.5; at that value here the whole card washed olive, because **`filter`
  applies to this element's rendered output, which INCLUDES its
  `backdrop-filter`** — so lifting it lifts the blurred corridor behind the
  glass and the frame reads as an exposure change rather than as the card
  resolving. 1.16 with a wider (3px) offset keeps the event on the object.
  Both frames were shot and compared.
- **`pf-glitch-out`** (260ms) — shorter, because leaving is not an arrival
  played backwards at the same length. It ends VISIBLE at opacity 0 and lets
  the cascade's `hidden` take over, so nothing has to interpolate `visibility`.

⚠ **EVERYTHING ANIMATES ON `.pf-card`, NEVER ON THE SLOT.** A `filter`,
`opacity`, `clip-path` or `mask` on an ANCESTOR makes that ancestor the backdrop
root and the card's `backdrop-filter` goes blind — the glass flashing flat for
the length of the burst. And the hook reads the SLOT's rect: a transform there
parks the whole pile.

⚠ **THE LAST FRAME IS THE IDENTITY AND `fill-mode` IS `none`.** Every animation
ends on exactly what the cascade already says at a pinned card — the card's own
chamfer, opacity 1 through `--pc-in-plate`, zero translate, no filter — so
removing the animation cannot pop. A `forwards` fill would pin `opacity: 1` over
the depth dim and the card would refuse to recede under the three that cover it.
The smoke pins the shape by STRING EQUALITY against card 1, which never glitches.

⚠ **HIDDEN, NOT MERELY TRANSPARENT.** A transparent card still takes the clicks
its rail and its buttons would, and removes nothing from the tab order.

⚠ **THE THRESHOLD IS WHERE THE CARD IS ALREADY COMPOSED.** `--pc-enter` is
already smoothstepped, so 0.92 is raw ratio ~0.83 — the last ~140px at 1440×900,
by which point the plate, record and field windows have all saturated AND the
`--pc-rise` translate has closed. The card materialises in place; only its
sticky travel remains.

### Opt-in, not a rule in the sheet

`ProofStack` takes `arrival?: "glitch"` and `ServicesStage` passes it. There are
exactly two call sites and the other one — `/trinny-london`, wherever that route
currently lives — passes nothing, so the effect returns at its first line, no
attribute is written and the selectors cannot match. ⚠ **The trinny smoke could
NOT be run as the gate this time**: that route is mid-move in the shared tree
(another session, `app/(marketing)/arcs/trinny-london/`), so the byte-identity
proof here is the call site plus the prop's default. Re-run it once that move
has landed.

### Guards

`settleArrival(page, idx)` waits on `getAnimations().finished`, and it is
load-bearing rather than tidy: ⚠ **`seatProofCard` returns the moment the hook
publishes `pinned`, and its retry wait is 450ms against a 640ms burst** — so
every plate reading after it would sample the strike's own dropout (opacity
0.12) on any pass but the first. That is a load-dependent flake that looks like
a broken card rather than a race. The smoke then pins: `data-pf-arrive` is `in`
and the animations are finished; the settled clip equals card 1's, with no
residual translate and no residual filter; card 0 caught at 40 % of its travel
is `visibility: hidden` at opacity 0; and it re-arms after a rewind. A separate
reduced-motion case pins the slot static, `animation-name: none` and the card
lit — ⚠ with an explicit `browser.newContext`, this file's own precedent, because
`test.use({ reducedMotion })` inside a nested describe never reached the page
(the slot came back `sticky`, i.e. the assertion was measuring nothing).

**Calibrated, twice.** Disabling the media gate fails with
`Received: "none"` against `/pf-glitch-bands/`; restoring the card's visibility
during the rise fails with its own sentence, _"the first card is painting on its
way up"_.

### Looking at it

`node scripts/capture-proof-stack.mjs --glitch 0,40,140,260,420,620` replays the
burst on a PAUSED clock — the attribute is toggled to restart the animations,
then each is paused and seeked — so the same frame comes back every run.
⚠ **CANCEL BEFORE RESTARTING**: toggling the attribute alone does not replace a
CSS animation the WAAPI has already paused, it ADDS one, and the count climbed
3 → 6 → 9 → 12 across a five-frame strip while every computed value still looked
correct.

### Left open

- The threshold pair (0.92 / 0.82), the band count (8) and the burst's length
  (640ms) are dials; nothing measures whether the burst reads as fast or slow.
- A scanline fleck across the bands (`themeGlitch` has one) was designed and not
  shipped — one effect at a time until he has read this live.
- Cards 2–4 are deliberately untouched, per the ask. If the pile should ever
  read as one system, it is a new decision and not an extension of this one.

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
- U10's two dials: the walkthrough button's fill ((b) light, (c) gold at rest
  — two-line swaps, above) and its 11px label; and the ads' inset inside
  their closed frame (`clamp(10px, 1.6cqw, 18px)`).
