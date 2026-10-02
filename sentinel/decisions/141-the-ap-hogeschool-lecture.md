# ADR-141: The AP Hogeschool lecture is the workshop's third cut

- **Status:** Proposed (2026-10-01, owner). Built and guarded; flips to Accepted once
  the owner has read the page live and the open items below are settled.
- **Surface:** `/arcs/ap-hogeschool` — a static route folder
  `app/(marketing)/arcs/ap-hogeschool/` (`page.tsx`, `journey.ts`, `WorkshopPortals.tsx`,
  `WorkshopTail.tsx`); `lib/arcs/content/ap-hogeschool.ts`; one asset,
  `public/arcs/ap-hogeschool/itp-nine-sectors-wall.webp`, written by
  `scripts/arcs/prep-ap-hogeschool-assets.mjs`; `lib/arcs/registry.ts` (one row);
  `[slug]`'s `OWN_ROUTE_SLUGS`; `HERO_ROUTES`; `tests/lib/ap-hogeschool.test.ts` (new);
  rows in `arcs-registry`, `arc-iso`, `sheet-config-fit`, `hero-preload`,
  `arcs-instrument-smoke`; `REAL_TODAY` in `sheet-instrument` and `sheet-composition`.
- **Does NOT supersede ADR-139.** v2 is untouched; this is a third route on its share
  rule. ADR-131 (the archetype) and ADR-136 (the class-one deck) stand.
- **Related:** [ADR-139](139-the-workshop-second-cut.md) (the spine, and the rule that
  prototype, sheet and root class fork together or not at all),
  [ADR-136](136-the-class-one-deck-and-the-situation-re-cut.md) (the Thomas More
  class-one deck: the Moira flow re-cut for students, Tom on the Moon and In The Pocket
  as the worked worlds, the shared records), [ADR-138](138-the-workshop-reads-about-the-eras-then-the-arc.md)
  (About → the eras → the Arc, the spine's own telling of who he is and what he did),
  [ADR-131](131-the-workshop-archetype.md) (one idea per viewport, one picture per
  section, seven to sixteen sections, one screen at 1280×720).

## The call

The owner, 2026-10-01: a new variant of the V2 workshop for AP Hogeschool, a Belgian
university college. The room is students, so it cannot be technical: show and tell, his
AI story, the AI films he made at Loop, and concrete brand worlds built with the method,
the way the Thomas More deck drew on Tom on the Moon and In The Pocket. "The point is the
V2 workshop: that's the new template in terms of style."

Asked, he chose: **English** (the spine is English and forks only as prototype + sheet +
root together); **show-and-tell only**, no hands-on chapter and no setup readout; **the
Loop films stay in the proof pile** and are not repeated in the tail; **a new nine-sector
wall for In The Pocket**, built from the signed-off finals.

## The decision

**A third own route on ADR-139's share rule.** `/arcs/ap-hogeschool` copies v2's four
route files and changes the record, the journey's labels and the tail; it shares v1's
prototype, v1's route sheet, `.tw-root`, the About flow, the portrait deck and the proof
by import. The station id `workshop` is the prototype's and cannot change; this page
calls it "The lecture" in the roster and the drawer.

**The spine already tells the story, so the tail does not repeat it.** Who he is is the
About; what he did before is the era stage (the Azeroth era's film is the Thomas More
class); the Arc is the corridor; the Loop films play from the pile's first card, with the
tools, the studio and the layer behind them. The tail begins where the pile ends.

**Sixteen sections, five chapters** (`menuPrimary` at the registry's cap): Today ·
Three ways · The configuration · Tom on the Moon · This week.

|       |                                                                                                             |
| ----- | ----------------------------------------------------------------------------------------------------------- |
| 01    | `today` — a readout: this hour, and the worlds the room will see                                            |
| 02–05 | three ways · the curve · hard to steer · the real question _(the class deck's situation, minus the ledger)_ |
| 06    | the configuration — Tom on the Moon's six questions, the class deck's board **verbatim**                    |
| 07–10 | Tom on the Moon: the path · the bench · the wall · the client's verdict _(the shared records)_              |
| 11    | the nine-sector wall — **NEW**, In The Pocket's finals on one wall                                          |
| 12    | two anchors — In The Pocket's retail hero beside Thoughtform's world, still being found                     |
| 13–15 | ambition · your world in one line each (a takeaway, not a room exercise) · what gets rewarded               |
| 16    | the close                                                                                                   |

**What was cut, and why.** `ground`, `resource`, the two-plates cards, the turn,
`horizon`, `signal`, the five switched beats and their switch, the family, get started
and what is next are a buyer's beats: a student is not choosing between a shelf of tools
and a stack. ⚠ **`horizon` is not re-added as a seventeenth.** The stages' agent example
("a wave: drawn, graded, delivered") is explained three beats later by the bench (graded)
and the wall (drawn, delivered), and the wall's sub uses those three words so the
callback lands. One picture per idea; the compounding-error argument is the technical
half the owner cut.

**The worlds are the shared records, by reference.** Tom on the Moon's path, bench and
wall are `shared/tom-on-the-moon.ts`; the six-question board is the class deck's word for
word, because it is Tom on the Moon's record and not this page's. `arcs-registry` pins
the records `toBe` across the course, the class and this page, and `sheet-config-fit`
derives the same row and the same one chip (Claude, in the interface's answer) for the
owner's `/arcs` dossier.

**The one picture this page adds.** The class deck held In The Pocket as one card; a
student room meets nine briefs in one look better as a wall. The nine sector finals
(2400 × 1792 each, `03_Final/` on the Drive, MANIFEST order) are composed 3 × 3 with the
retail hero, the campaign's anchor, in the centre cell. ⚠ **The cells are 16:9, not the
finals' 4:3**: `.arc-media__frame img` is `width: 100%; height: auto`, so the wall's
aspect IS the beat's height, and a 4:3 wall runs ~750px tall at the 1280 band, which
breaks the one-screen law. 460 × 259 cells, a 4px gap, 1388 × 785, WebP q80, 78 kB. The
crop takes each hero's middle band; the retail hero reappears whole on the anchor card.

**Readout rows may not link to the pile.** `#services` is not an arc section id, and the
registry rejects an in-page link that names none (`arcs-registry` L1226), so the Loop row
in the opening readout carries no href. The pile is one scroll above; the row names it.

## Guards

- `tests/lib/ap-hogeschool.test.ts`: the route shares v1's prototype, sheet, root class,
  proof and flow; the journey order equals v1's; no `worked` on any section and no switch
  in the tail; the readout first, the close last, 7 ≤ sections ≤ 16, the three built
  worlds after the board; the Tom path, bench, wall and the board's anchor and the
  curve's lanes `toBe` the shared records; the wall on disk (the registry checks a
  `media.src` by prefix only).
- `thoughtform-workshop-v2.test.ts`'s folder walk covers the new `OWN_ROUTE_SLUGS` row;
  `hero-preload` the `HERO_ROUTES` row; `arc-iso` walks the stages' labels on a fifth
  page; `sheet-config-fit` the board's row and chip; `arcs-instrument-smoke`'s
  `CONFIGURED` set gains this slug and the `thoughtform-workshop-v2` row it was missing.
- `REAL_TODAY` moves to 2026-10-01 in both suites that read the real overview.

## Open items

1. **The password.** `arcGate` derives `ARC_PASSWORD_AP_HOGESCHOOL` from the path and
   falls back to `ARCS_PASSWORD`; if that fallback is set in Vercel the students need the
   shared password or a key of their own. An owner step in Vercel, not code.
2. **The wall's crop.** 16:9 cells cut the top and bottom of each 4:3 hero. If a sector
   reads badly cropped on the live read, the next cut is 2:1 cells on a wider wall, never
   a smaller one.
3. **The registry position.** Filed after the course's class deck, which it borrows its
   worlds from. One line to move if the lectures are ever grouped.

## Update 1 — the shared sheet wins on specificity, not on order (2026-10-02, owner)

The owner, on the live read: _"the elements are really smushed together, with two
dominant margins on the left and right, which is something we don't have on any of
our other pages."_ Every beat sat in a column ~820px wide at his 2000px window, where
v2's runs the full 1200px band.

- **The cause is cascade order, not this page's CSS.** v1's route sheet releases the
  `#workshop` station (block, no padding, `content-visibility: visible`) with
  `.tw-root .tw-arc`, which is (0,2,0): the same as landing.css's
  `.station:not(.hero)` and below the ≤960 rung's
  `.station:not(.hero):not(.station--cover)` (0,3,0). It only ever won by coming after
  landing.css. The bundler does not keep import order for a sheet three routes share,
  and on this route it put the route sheet BEFORE landing.css, in dev and in production
  (measured on thoughtform.co). The page's only extra import, `course.css`, is what
  changes the order; the page's own import order is unchanged and correct.
- **It lost three things, not one:** the station kept its side padding (189px a side
  at 2000px, 129 at 1280, 32 on a phone), `content-visibility: auto` came back (the arc
  laid out as a placeholder and grew the document on reach, the jump §4 of the sheet
  warns about), and on a phone the station's 140/220 vertical padding too. Every guard
  was green; the parse, registry and fit gates measure the beats, never the station
  around them.
- **The fix names the station by id:** `.tw-root #workshop.station.tw-arc`. An id
  outranks every class-based station rule the landing has, in any order, and
  `#workshop` exists only in this route's prototype. v1 and v2 are unchanged
  (both already resolved to padding 0; measured).
- **Verified:** a cascade audit (every route-sheet rule copied to the end of the
  cascade; a computed value that moves means the rule was losing on order) reports
  zero losers on v2 and on this route at 2000×1024, 1280×720 and 390×844, where it had
  reported the three above. The band is 1200px at x 400 on both pages. All sixteen beats
  are still one frame at 1280×720, 1920×1247 and 2000×1024 in both themes, the shared
  bench's +36px at 1280×720 as before.
- **Guard:** `ap-hogeschool.test.ts` asserts the release rule names `#workshop` and
  outranks both landing selectors that pad a station.
- **The general lesson:** a sheet shared by several routes may not depend on its place
  in the cascade. Every override in it has to win on specificity, because the next
  route to add one import can reorder it.

## Update 2 — the lecture opens on the second cut's slide (2026-10-02, owner)

The owner: _"For the AP workshop we have what AI is and what gets built with it.
Replace it with this … section from the V2 workshop, 'Hand it to an agent. Trust what
comes back.'"_

- **The Today readout is deleted** (`today`, the `list-groups` readout with "This hour"
  and "The worlds you will see"). In its place is v2's opening slide, the `hero-board`
  (`the-workshop`): the promise on the left, the board in miniature on the right, the two
  plates a person writes lit. It previews the configuration beat five sections later.
- **One section, one record.** Two pages now show that slide whole, so it moved to
  `lib/arcs/content/shared/handItToAnAgent.ts` and both v2 and this page put the object
  in their sections array as it is. It is the whole section, head included: the drawing
  letters nothing, so the head is the beat. v1's opening shares the title over a
  different sub and is a different section, not a reader. v2 renders byte-identically.
- **The hero's first action** moves with it: "The workshop" → `#the-workshop`. The
  section count stays sixteen and `menuPrimary` stays five.
- **Verified:** all sixteen beats one frame at 1280×720, 1920×1247 and 2000×1024 in both
  themes (the shared bench +36px at 1280×720, as before); the slide read in both themes.
- **Guards:** `ap-hogeschool.test.ts` pins `sections[0]` `toBe` the shared record, the
  readout absent and the hero's first action on it; `arcs-registry` fails any
  `hero-board` carrying this sub that is not the shared object, and pins its readers to
  this page and v2.

## Update 3 — Prompt to Loop replaces the anchor beat (2026-10-02, owner)

The owner, half an hour before the lecture: _"I just created a breakdown of a super cool
motion design video … integrate this into the AP section … verbatim … Use the
Thoughtform brand tokens … different colours and no rounded corners … replace the anchor
12 near the bottom."_

- **`two-anchors` is deleted** and its course.css caps with it. In its place, between
  `itp-wall` and `ambition`, the tail mounts **thirteen slides** (the breakdown's hero
  and its twelve chapters, Setup to Next time) through `PromptToLoop.tsx`. They are not
  an arc section kind: one person's breakdown is not a reusable grammar, so the arc
  array stays at fifteen and the renderer gained an `indexOffset` to carry numbering
  across the split.
- **Each slide's head is the arc's own** (`ArcSectionHead`: title left, paragraph
  right); **every body is the breakdown's markup verbatim**, generated into
  `promptToLoopSlides.ts` by `scripts/arcs/port-prompt-to-loop.py` from the owner's
  `index.html`. The media leave the file for `public/arcs/ap-hogeschool/prompt-to-loop/`
  (one film, 23 stills, 1.8 MB), and every id is prefixed `ptl-`.
- **The CSS is the breakdown's own, scoped under `.ptl`** (`prompt-to-loop.css`, also
  generated). Its palette is remapped onto the arcs' ink ramp and gold, with green
  for the human, square corners and no shadows; the video's scene palette stays.
  ⚠ **Every breakdown class is prefixed `ptl-` too:** the page already owns `.station`,
  `.plate`, `.hero`, `.title`, `.k` and six others, and the landing's `.station` rule
  (140/220 padding, the starfield) broke "How it runs" until the prefix went on.
  ⚠ **The data file is `promptToLoopSlides.ts`, not `promptToLoop.ts`:** on Windows the
  latter resolves to `PromptToLoop.tsx` and the import comes back undefined.
- **Verified:** all thirteen slides one frame at 2000×1024 in both themes, the film
  playing, no page errors. `ap-hogeschool.test.ts` pins thirteen slides, unique
  prefixed ids, every in-page link landing on a slide and every media path on disk.
- **The cost chapter** prints the evening's API spend at published prices (about $27).
  It is the owner's own spend on his own breakdown, published on his word; the money
  scan reads the arc records, not these bodies.
