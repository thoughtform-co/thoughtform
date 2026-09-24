# ADR-122: The musings list

- **Status:** Proposed (2026-09-24). Shipped and guarded, pending the owner's live read. Not pushed.
- **Surface:** `#musings`, the homepage's writing station, between the era stage
  and the footer.
- **Supersedes:** [ADR-121](121-the-musings-row-opens-on-hover.md) **on the form**.
  The flex row of strips is retired. Everything else in that record stands:
  - the station and its transparent stage;
  - the weld over the era stage (U3);
  - the head's seat on the services line (U2);
  - the band's end yielding to the telemetry (U1, re-keyed to the note's inset);
  - the glass on the stage rung and its perf gate;
  - the notch;
  - the one dwell;
  - the cover lockstep and the footer's bed.
  - The centre-out **aperture leaves this station**. It stays the house's on its two
    other hosts, the proof card and the Trinny route.
- **Source:** `/test/musings-gallery`, direction **v17** (round six, with v4's titles). Six rounds, seventeen directions.
- **Rules:** [`.claude/rules/musings.md`](../../.claude/rules/musings.md)

## The ask

Owner, 2026-09-24, after reading round six:

> Let's go for V17 and maybe we can show more, maybe 5 in total. Implement this on
> our homepage and, I think, the animation for when the cards appear I don't think
> we should use the scan line effect. It looks a bit cringe. Maybe we can do
> something more elegant. We can keep the glitch effect for the text, but I think
> the cards should first be a line and then unfold downwards.

v17 came from three earlier rulings by the owner:

- **v13's closed folder cards.** "I'm not really a fan of horizontal dividers that
  don't close."
- **The cover unframed and on the right.** Round six: "It needs to be aligned on the
  right and the call to action and the author should be aligned to the bottom of
  that visual."
- **v4's titles.** "What I like about v4 still is the big title size."

## The decision

The station is a **list of at most five notes**. Each note is a closed folder card
with the same skin as before (the proof card's):

- glass at .62, blurred on the stage rung;
- a flat gold lip that rises to the full line on the open note;
- a scanline under the copy;
- a bloom stated in pixels;
- one notch, top-right.

**A closed note is one row.** It holds the title at v4's scale, whole on one line,
over its date and reading time. The beat chip sits to the right, and the note's
drawn cover sits in the last column at thumbnail size, unframed.

**The open note** changes in two ways:

- its cover column grows to a 240px square;
- its excerpt unrolls beneath the title.

The byline and the way in ("Read the note") sit on the **cover's floor**.

At rest the newest note is open. There is no timer. Hover or focus opens a note, and
**it stays open when the pointer leaves**.

**The head is unchanged.** It still decodes in place on the services masthead's
clock.

**The notes arrive after the head.** Each is drawn first as a line: its own top edge,
drawn from the left. It then unfolds downward into the card. The notes arrive one
after another. On the way back, all of them fold together.

## Why it is built this way

### ⚠ FIVE AT MOST, AND THE ROWS ARE SOLVED FROM THE COUNT

`MUSINGS_LIST_MAX` is 5, replacing `MUSINGS_ROW_MAX` (7).

On the pinned rung, `.mu__notes` is a size container that spans from the head to the
rails' last tick. `100cqh` is its height. The budget is spent in this order:

1. **The open card's floor comes first:** `--mu-note-open-min`, which is
   `clamp(180px, 20svh, 240px)`.
2. **The way out is paid next:** `--mu-foot-h`.
3. **The closed rows split what is left.** They use v4's 8.6svh where it fits, and
   never go under 64px or over 108px.
4. **The open cover takes what the rows then leave**, up to 240px.

This works because custom properties substitute where they are used. That puts
`100cqh` on the notes' own box, one container up from each row.

**At the owner's viewport (1920×1247):**

- five notes and the open card end exactly on the rails' last tick (1116);
- the list does not scroll;
- every title is 48px.

**At 1280×720, five notes cannot fit.** Five 64px rows, the open card's 180px floor
and the way out add up to more than the 440px box. The list then scrolls inside
itself, with a thin scrollbar. This is a measured trade-off, and it is listed under
Left open.

### ⚠ THE TITLE IS v4's SCALE, SET WHOLE

The title size is:

```css
--mu-note-title: min(clamp(22px, 2.5vw, 48px), calc((var(--mu-note-row) - 26px) * 0.9));
```

The cap is whatever the row leaves above the meta line. A short row therefore gets a
smaller title rather than a clipped one.

The title is `nowrap` with an ellipsis. The ellipsis is only a safety net: the capture
fails the run if any title is cut.

### ⚠ THE OPEN NOTE GROWS ON TWO TRANSITIONS AND ONE CLOCK

The cover is a single element shown at two sizes. The note's grid is:

```css
grid-template-columns: minmax(0, 1fr) var(--mu-note-col);
```

`--mu-note-col` moves from the thumbnail width to `--mu-note-open`. At the same time,
the excerpt's wrapper goes from `grid-template-rows: 0fr` to `1fr`.

Both transitions run on `--mu-note-grow`: 560ms, `cubic-bezier(0.16, 1, 0.3, 1)`.
This is the house's expo-out, the same reasoning ADR-121 gave for a pointer response
(it starts immediately).

Nothing is posed, measured or written per frame.

### ⚠ THE SIGN ENDS ON THE COVER'S FLOOR, BY ARITHMETIC

The cover spans both grid rows, starting 10px down, and is `aspect-ratio: 1`. The
detail's height is solved so its content box ends exactly where the cover ends:

```
open + 10px + inset − row
```

The sign row is then pushed to that line with `margin-top: auto`.

⚠ **The gap above the sign is a minimum (12px), not a spacing.** At 28px, a
three-line excerpt (the live "Encode the context") pushed the sign 7.9px below the
cover's floor at 1920×1247. `margin-top: auto` is what places the sign. The gap only
sets how close the sign may come to the excerpt. The capture measures the offset on
every open note, at rest, on hover and on Tab. The result is 0px at every viewport.

### ⚠ THE OPEN NOTE STAYS WHERE THE READER LEFT IT

ADR-121's row reset to the newest card on `pointerleave` / `focusout`. That worked in
a row, where only widths moved sideways and every card kept its place.

It does not work in a list. The open note is 2.5 times as tall as a closed one, so
resetting it moves every note below it. A hand travelling out of the list, or
back into it, would find a different note under it than the one it left.

So the writer listens only to `pointerover` and `focusin`, gated on the rung. The
last note opened stays open until another one is. Scrolling out of the station and
back in reopens the newest note (`park()`).

### ⚠ THE ARRIVAL IS A LINE THAT UNFOLDS: GEOMETRY ONLY

The owner read ADR-119's centre-out aperture as a "scan line". It is replaced by two
`clip-path` keyframe sets. Each uses five points, so the path interpolates vertex by
vertex:

- **`mu-unfold`.** At 0% it is a zero-width 1px line at the top-left. At 40% it is the
  note's full-width top edge. At 100% it is the notched plate, string-equal to the
  cascade's own clip.
- **`mu-unfold-lip`.** It lights the ring at `--gold-line` while the note is still a
  line, so the line reads as an edge being drawn. It fades to the lip's resting value
  as the note unfolds.

The timing:

- **Arrival:** each note on `--mu-unfold-in` (820ms, the house's ease-in-out, because
  the reader did not cause this arrival), `--mu-slot × 90ms` apart, top to bottom.
  The fill is `backwards`: a waiting note is a zero-width line, and the final frame is
  the cascade's own silhouette.
- **Way out:** "All musings" unfolds last, on the same curve, with the rectangle's
  `inset()` pair.
- **Leaving:** everything folds together (`mu-fold`, 420ms). The fold holds `opacity`
  and `visibility` itself, because the `out` state hides the notes, and a clip-only
  close would play on nothing (ADR-097 U12's close).

⚠ **No opacity curve, no filter, no flash.** ADR-097 U12's photosensitivity ruling
covers this station. A source ratchet refuses both inside the `in` keyframes.

**The head's decode is kept, as the owner asked.**

⚠ **The aperture's number pair stays pinned on its two remaining hosts.**
`proof-stack.css` and the Trinny route still carry 720ms / 420ms on
`cubic-bezier(0.65, 0, 0.35, 1)`, and `musings.css` must no longer mention the
aperture.

### ⚠ THE COVER IS THE ABOUT DRAWING, RE-SEATED AS THE RECORD

`MusingOrbit` draws each note's own record in the grammar of the About section's
diagram, copied by hand and never imported (ADR-106). The drawing has:

- six rings on an alternating dash pattern;
- twenty rim ticks and four cardinal stubs;
- a twelve-month halo with the note's own month lit;
- the year's other notes as dots on the outer ring;
- the note's day on the gold track, with the arc of the year elapsed and a hand;
- the beat glyph at the centre.

The DOM labels are the day of the year, the year and the quarter months.

`lib/musings/orbit.ts` is pure. It reads the date **from the string**, and there is
no `new Date()` anywhere, for the time-zone reason recorded in ADR-119.

The thumbnail is the same element at the same size in pixels. The container query
`@container mu-cv (max-width: 140px)` strips it down to the gold track, the inner
ring and the glyph.

### ⚠ THE BYLINE IS ON THE CARD RECORD

`MusingCardData` gains `author`, projected by `cardsFor()` from the frontmatter's
existing field. The body still never reaches a client chunk.

## Measured (headed, real scrolls, `capture-musings-row.mjs`)

| host · viewport · theme     | titles         | sign → cover floor     | notes end / rail end | list scrolls | telemetry air |
| --------------------------- | -------------- | ---------------------- | -------------------- | ------------ | ------------- |
| landing · 1920×1247 · dark  | 48px, none cut | 0px (rest, hover, Tab) | 1116 / 1116          | no           | 187.6px       |
| landing · 1920×1247 · light | 48px           | 0px                    | 1116 / 1116          | no           | 187.6px       |
| lab n5 · 1920×1247 · dark   | 48px           | 0px                    | 1116 / 1116          | no           | 187.6px       |
| landing · 1280×720 · dark   | 32px           | 0px                    | 629.9 / 629.9        | no           | 17.9px        |
| lab n5 · 1280×720 · light   | 32px           | 0px                    | 629.9 / 629.9        | **yes**      | 27.9px        |
| lab n7 · 1280×720 · dark    | 32px           | 0px                    | 629.9 / 629.9        | **yes**      | 27.9px        |
| landing · 390×844 · dark    | wrap, 20–26px  | flows                  | flows                | no           | —             |

**Perf at 1920×1247, dark, with the glass on every note:** 0% long frames while
parked, and 0% while the pointer sweeps the list twice (mean 4.7ms, p95 8.4ms).

## Deleted

- **Components.** `MusingCard.tsx` and `MusingCover.tsx` are deleted. The beat
  glyph's paths (`BEAT_PATHS`, `ENCODE_CELLS`) moved to `MusingOrbit.tsx`, and the
  gallery lab imports them from there.
- **The row's mechanic and every token it read:**
  - `flex-grow`, `--mu-closed`, `--mu-strip`, `--mu-open-w`, `--mu-open-min`,
    `--mu-grow`, `--mu-gap`;
  - `--mu-body-*`, `--mu-measure`, `--mu-lede-lines`, `--mu-glyph`, `--mu-card-*`.
- **`MUSINGS_ROW_MAX`.**
- **The writer's `pointerleave` / `focusout` restore.**
- **The aperture keyframes in `musings.css`.** The gallery lab keeps its own copy,
  because its directions still use them.

## Guards

- **`tests/lib/musings-row.test.ts`, rewritten for the list:**
  - the window of five;
  - the orbit's arithmetic;
  - the two transitions and their clock;
  - the rows solved from the count;
  - the sign's floor arithmetic;
  - the title's scale;
  - the excerpt budget;
  - the writer's two events;
  - the unfold keyframes and their stagger;
  - the aperture still on its two hosts;
  - the stamp gate on every pinned-list rule.
- **`scripts/capture-musings-row.mjs` has new gates:**
  - note 0 open at rest;
  - every title whole on one line;
  - every row a focusable link;
  - the covers unframed, one thumbnail size, the open one square and grown;
  - the notes inside the rails' last tick;
  - five notes not scrolling on a frame ≥ 1000px tall;
  - the sign on the cover's floor (±1.5px) at rest, on hover and on Tab;
  - hover opening note 2 and closing note 0, and leaving keeping note 2 open;
  - Tab into note 1 opening it.

  It waits on `state: "attached"`, because the notes are hidden while the arrival
  waits for the head.

- **`mobile-section-seams.spec.ts` names `.mu__list`** among the areas that may
  never be a snap stop.

## Left open

- **Five notes scroll inside the frame below roughly 1000px of height.** Options are
  a count that yields to the frame, a smaller open floor, or accepting the scroller.
  This is the owner's call.
- **The landing publishes three notes.** The list shows three until more are
  written. The placeholder host at `/test/musings-row?n=5` is how five reads today.
- **The gallery lab stays for now.** ADR-070 U35 says the losing directions go, with
  their guards, once the owner has read the winner live.
- **Touch at ≥961px.** A tap still opens and navigates in one gesture, as in ADR-121.
