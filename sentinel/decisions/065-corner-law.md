# ADR-065: The corner law

- **Status:** Accepted
- **Date:** 2026-08-06
- **Owner call:** yes
- **Surface:** sitewide shape law; applied in this pass to
  `components/landing/home-v2/services/casefile/console/**`
- **Builds on:** [ADR-007](007-chamfered-card-polygon-design.md) (the chamfer
  TECHNIQUE — background by `clip-path`, stroke by SVG), ADR-029 / ADR-050 (the
  services card, which is where the diagonal was set),
  [ADR-064](064-casefile-console-frame.md) (the console this pass corrects)

## Context

The owner, 2026-08-06:

> what is our logic, our design language for notches? I don't feel it's super
> consistent. Maybe we don't need notches everywhere. For example, in the
> services section, the cards do have a notch in the bottom left corner. Maybe
> that's our standard, but how do we avoid it looking too uniform or too flat?
> Should we maybe have two styles of notches?

The system had three corner treatments and no rule. The shape law says only
_"zero border-radius; diamonds not circles; corner brackets/chamfers for
frames"_ — which names the vocabulary and says nothing about **which**,
**where**, or **how deep**. ADR-007 is a technique record for one panel in
astrogation, not a doctrine.

**The inventory, taken before deciding anything:**

| object                                        | corners     | depth                           |
| --------------------------------------------- | ----------- | ------------------------------- |
| `.svc-plate__sh` (services DOM plate)         | **TR + BL** | `--ch` 16px seed → 26px open    |
| WebGL card face (`traceChamferPath`)          | **TR + BL** | `BAKE_CH` 52 @2× = 26px         |
| …its TIGHT face (the shipped one)             | **BL only** | 26px                            |
| Extruded glass slab                           | **TR + BL** | `RING_SLAB_CHAMFER_FRAC` 52/840 |
| ADR-047 portrait BACK face (`…Mirrored`)      | **TL + BR** | 26px                            |
| `.arc-card__sh` / `__bd` (`/arcs`)            | **TR + BL** | `--arc-card-ch` 26px            |
| `arc-cases/cardLayout.ts`                     | **TR + BL** | same fraction                   |
| `.pcl-card` (v7 tools-cards)                  | **any ONE** | `--ch`, `data-corner` picks it  |
| `.arc-portrait__corner`                       | all four    | L-brackets, additive            |
| **`.fl-con__outer` / `__console` (casefile)** | **TL + BR** | `clamp(14px, 2.6cqw, 22px)`     |

The last row is the finding. The casefile console cut the **opposite**
diagonal from every card in the system — while its own comment asserted
_"the same asymmetric diagonal the services card cuts, so the two objects are
one family."_ They were not one family, and a comment asserting a relationship
the geometry contradicts is worse than none: it is why the inconsistency
survived a review. The owner could see the result without being able to name
it.

The second finding is that the depth values are already a ladder — 16 / 26 /
0 — that nobody wrote down, so each new object re-derives it by eye.

## Decision 1 — three grammars, each answering a different question

They are not three styles of the same thing. They say different things, and
"which notch" is answerable only once that is stated.

| grammar     | form                                        | says                                           | belongs to                          |
| ----------- | ------------------------------------------- | ---------------------------------------------- | ----------------------------------- |
| **Chamfer** | subtractive; the silhouette follows the cut | _a machined housing you are looking INTO_      | consoles, plates, cards             |
| **Notch**   | ONE corner, asymmetric                      | _this object is oriented, or it plugs in_      | a card in a set; anything connected |
| **Bracket** | additive L; the box stays rectangular       | _framed and observed, but not itself a device_ | HUD corners, portraits              |

## Decision 2 — the five rules

1. **One grammar per object.** Never chamfer _and_ bracket the same box. Two
   corner treatments on one silhouette is how a surface starts reading as
   decorated rather than built.

2. **The diagonal is TOP-RIGHT + BOTTOM-LEFT.** Every card-family object
   already cuts it; there was exactly one exception and it is corrected here.
   ⚠ **TL + BR is legal only as the mirrored back of a physically flipped
   object** — `traceChamferPathMirrored` on the ADR-047 portrait back is
   correct precisely because the plane carries `rotation.x = π`, so in world
   space it is cutting the same two corners. A TL+BR object that is not the
   back of something is a bug.

3. **Depth is a three-rung ladder, by role, and it is not authored per site:**

   | rung       | value  | for                                             |
   | ---------- | ------ | ----------------------------------------------- |
   | **seed**   | `16px` | a collapsed or small object                     |
   | **plate**  | `26px` | a card or a console                             |
   | **chrome** | `0`    | tabs, rows, chips, tiles, anything inside a box |

   The console's `clamp(14px, 2.6cqw, 22px)` is the **plate** rung expressed
   responsively — a plate mounted in a narrower column gets a proportionally
   smaller cut, which is the same decision as `--ch: 16px → 26px` on open.

4. **The nesting rule — the children of a chamfered box are square.** This is
   the answer to _"how do we avoid it looking too uniform or too flat"_. Once
   the housing is machined, what sits inside it is flat stock. So a surface
   never shows two chamfers of the same depth adjacent to each other, and the
   variation a reader sees is **hierarchy** — one cut housing containing square
   content — rather than a sheet of identical stickers.

   Which also answers _"should we have two styles of notches?"_: **no — two
   ROLES for a cut corner**, distinguished by whether the corner carries
   content. A second decorative style would give the eye two things to learn
   and tell it nothing.

5. **Asymmetry is EARNED, never decorative.** A single-corner notch appears
   only where the corner is doing work:
   - it **points at what the object connects to** — `ServicesPlateCluster`
     already does exactly this, _"always the corner pointing at the mark"_,
     with left-half cards plugging in at TR and right-half cards at BL; or
   - it **marks the fixed edge** — the tight card face keeps BL because
     _"it is the corner the tray never touches"_, so the surviving notch is the
     one the mechanism does not use.

   If nothing sits in the cut and nothing is attached to it, use the symmetric
   pair or leave the corner square.

## Decision 3 — what moved

**Only the casefile console.** `.fl-con__outer` and `.fl-con__console` flip to
TR + BL, and the false comment is replaced with the record above.

⚠ **The flip moves two bites, and both were adjusted rather than assumed.**

- The rail sits on the console's top edge, so the chamfer now bites its
  **last** station instead of its first. The clearance is arithmetic: at
  height `y` the right boundary is `100% − (ch − y)`, and a label whose top
  edge sits ~11px down against a 22px chamfer clears a 10px inset by about
  −1px. `.fl-con__stn:last-of-type` carries the extra inset that buys it.
- The foot loses its bottom-right bite for a bottom-left one. Its text is
  centred inside `clamp(16px, 4cqw, 40px)` of padding and the cut is gone
  ~22px up from the bottom, so nothing had to move; its top hairline now
  terminates on the left diagonal, which is the rule following the silhouette.

**What did NOT move, and why it is recorded rather than swept:**

- `.pcl-card`'s `data-corner` primitive already parameterises a single notch to
  any corner. It is the rule-5 tool, correctly built, and it is used on a lab
  route. Left alone.
- `navigate-copy-lab.css`'s TL/BR pair is lab-only.
- `.fl-row__glyph`'s 7–9px folder-tab polygons are an ICON silhouette, not a
  frame chamfer, and the ladder's `chrome` rung does not apply to a glyph
  drawn at 14×10.

## Consequences

- The shape law in the design skill gains the diagonal, the ladder and the
  nesting rule. Its one-line _"corner brackets/chamfers for frames"_ was true
  and unusable.
- A future object asks two questions instead of guessing: _is this a housing,
  a connected card, or a framed region?_ and _what is inside it?_ The second
  one is the one that was never being asked.
- ⚠ The comment that lied is the durable lesson. Assert relationships that a
  reader can check, or do not assert them.

## Update 1 (2026-08-07, with ADR-068) — a notched SET inside a chamfered housing

Rule 4 said the children of a chamfered box are square. The tool dossier
(ADR-068) seats a 2×2 SET of Q&A detail plates inside the chamfered console,
each carrying a single notch — so the rule gains its one exception, stated
narrowly:

**A uniform set of device cards inside a chamfered housing may carry a single
notch on the lawful diagonal — all cards the SAME corner, one nesting level
deep at most, at card scale (`clamp(9px, 1.7cqw, 13px)` — the seed rung scaled
to the card, never the plate rung).** The set reads as cards seated in the
housing; uniformity across the set is rule 2's one-grammar-per-object applied
to the set as the object. A LONE notched child inside a housing remains
banned — that is a second grammar, not a seated set.

The dossier's plates take **BL** (the mockup drew TL and was flipped to the
lawful diagonal). The route diagram's step marks are symmetric TR+BL chamfer
pairs in SVG line work — ordinary rule-1 housings at drawing scale, no
exception needed.

## Update 2 (2026-08-07, owner override) — the proof console carries TL+BR

The owner's canonical mockup (`proof-page-blocks-left.html`, drawn AFTER this
law and after Decision 3's correction) chamfers the proof panel **top-left +
bottom-right**, and the owner confirmed it on the live build: _"a super clean
right panel with a notch in the top-left corner. I want you to replicate
that."_ So the casefile console — the very object Decision 3 corrected to
TR+BL — now carries TL+BR **as the standing owner exception**, recorded here
rather than smuggled.

The law is otherwise unchanged: TR+BL remains the diagonal for everything
else, and the TL+BR clause ("the mirrored back of a flipped object") gains
this one enumerated sibling. Consequence handled with it: the TL cut bites
the rail's FIRST station instead of the last, so the clearance inset moved
from `:last-of-type` to `:first-of-type` — same arithmetic, mirrored,
measured at four viewports.

## Update 3 (2026-08-12, owner) — the seated set's LEADING member carries the cut

Owner: _"fix the notch in the top left corner of the configuration and
substrate tabs; ONLY the work tab should have that."_

Update 1's exception licenses a uniform set of cards inside a chamfered
housing to carry **the same** notch. The console's rail is exactly such a set
— and it is the case where uniformity produces the wrong drawing, because the
housing's own cut lands on one member of the set.

Measured: the console removes every point where `x + y < --con-ch`
(15.9 / 17.9 / 22px at 1280×720 / 1440×800 / 1920×1080) and a station removes
`x + y < --stn-ch + 2` (10.6 / 11.6 / 13px). The leading plate's cut is
**subsumed at every rung of both clamps**, with ≥ 8px of slack, so it paints
nothing of its own. Uniformity therefore does not read as uniformity: it
renders as one housing chamfer plus N−1 diagonals floating 185–581px along the
rail, where no edge explains them. That is rule 5's decorative asymmetry
arriving through a rule meant to prevent it.

So the exception gains a clause:

**Where the housing's own chamfer falls on one member of a seated set, the cut
belongs to that member alone and the rest are square.** The set still reads as
seated — the leading plate shares the housing's corner, which is what the
notch was saying — and rule 5 is satisfied by construction, because the only
cut left is the one a real edge produces.

Applies to every `ConsoleRail` (map readings, tools, films, Studio sheets).
Not a general repeal of Update 1: a set inside a housing whose chamfers fall
on no member keeps the uniform notch.

## Update 4 (2026-08-13, with ADR-069 U1) — "on the lawful diagonal" was the operative clause

Reading 01's twenty work cartridges were a textbook Update 1 set: a uniform grid
of device cards inside the chamfered casefile console, each carrying **a single
notch, all the same corner**. They satisfied every clause of the exception except
the one that does the work — **the notch was TOP-LEFT**, which has never been a
lawful diagonal for anything but the mirrored back of a flipped object, and since
Update 2 for one enumerated console.

The exception was read as licensing _a_ notch and was in fact licensing a notch
**on the lawful diagonal**. Nothing caught it because the set was internally
consistent, which is what the eye checks and what a reviewer reading the rule's
first clause checks too.

It surfaced from the other end entirely: ADR-069's flying object is the same card
in two readings, and reading 02 had been moved onto the canonical TR+BL diagonal
by ADR-070 U13. So the object **changed silhouette in mid-flight** — and that is
what made the corner a measurable defect rather than a preference. The twenty
cards now carry the TR+BL chamfer pair, which is rule 1's ordinary housing at
drawing scale, so the exception is no longer invoked here at all.

Two notes for the next object:

- **The clause to check first is the DIAGONAL, not the count.** A set can be
  perfectly uniform and still be wrong, and uniformity is the property that makes
  the error invisible.
- **A single notch means "oriented or connected".** Twenty identical cards in a
  grid are not oriented toward anything and are connected to nothing, so on this
  set the notch was never carrying the meaning the law assigns it — it was a
  corner treatment. The chamfer pair says "machined housing", which is what a work
  cartridge is.
