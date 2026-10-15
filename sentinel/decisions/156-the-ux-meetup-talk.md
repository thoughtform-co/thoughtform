# ADR-156: The UX meetup talk is a cut of the workshop's third house cut

- **Status:** Shipped (2026-10-13, owner: "push to main"), two days before the talk, as the
  first cut stood. Flips to Accepted once the owner has read the page live, which is
  Thursday 15 October in the room.
- **Surface:** `/arcs/thoughtform/ux-meetup` (an OWN ROUTE,
  `app/(marketing)/arcs/thoughtform/ux-meetup/**`, `lib/arcs/content/ux-meetup.ts`); the new
  shared record `lib/arcs/content/shared/in-the-pocket.ts` and `ap-hogeschool.ts` reading it;
  an optional `ledes` argument on `workshop-v3/WorkshopProof.tsx`; `OWN_ROUTE_SLUGS`; one
  `HERO_ROUTES` row; the registry; `tests/lib/ux-meetup.test.ts` (new), `arcs-registry` (the
  `three-ways`, `the-curve` and `between` reader pins), `hero-preload`, `sheet-instrument` and
  `sheet-composition` (`REAL_TODAY`).
- **Related:** [ADR-143](143-the-workshop-third-house-cut.md) (the cut this page is cut
  from, "the template the owner's next presentations are cut from"),
  [ADR-147](147-suri-two-pages-one-record.md) (the precedent: v3's page with the record
  swapped), [ADR-141](141-the-ap-hogeschool-lecture.md) (the lecture, whose nine-sector wall
  this page shares), [ADR-139](139-the-workshop-second-cut.md) (the share rule),
  [ADR-142](142-arcs-nest-under-their-group.md) (the address),
  [ADR-131](131-the-workshop-archetype.md) (one idea per screen).

## The call

The owner, 2026-10-13, two days before a talk at the UX Gent AI-design meetup: "create an
Arcs page where we can do the presentation. I think we can have a hero section, our About
section, and the Arc. I think we already had a template for that." Asked where it lives and
in what form: "a page on our Thoughtform website (arcs/Thoughtform) for a UX meetup. It's a
new Arc, a new page on my Thoughtform website with all the animations."

His notes of 11 and 12 October set the talk: not a portfolio; digital content and digital
products become a commodity within two years; what is left for designers is interfaces for
and with an intelligence. The geopolitics and the jobs tangent are his own cuts.

## The decision

**A house arc at `/arcs/thoughtform/ux-meetup`, v3's page with the record swapped.** The
same shape as Suri's lunch and learn (ADR-147): v1's prototype, route sheet and `.tw-root`,
`data-tw-cut="v3"`, v3's `replaceHeroCopy` / `insertEquilibriumStation` / `replaceAboutBio`
by import, v3's proof and opener mount by import, v1's two hooks. "All the animations" is the
spine whole: hero → the equilibrium → About → the eras → the Arc → the Loop proof pile.

**The intro is `WORKSHOP_INTRO`'s, by reference, with two things the talk's own:**

- **The hero.** `UX_MEETUP_HERO` ("AI is not software." and one sentence), written over the
  prototype's by v3's seam, and pinned equal to the arc's own `hero` so the room's page and
  the overview's card say one thing.
- **One proof lede.** v3's last card ends "The rest of today is how", a promise a talk does
  not keep. `workshopV3Tracks(ledes)` and the default export take an optional `ledes`; not
  passed, the record's, so v3 and Suri's cut are unchanged. The talk passes the record's
  ledes with that one clause removed.

**The tail is twelve sections on existing kinds, no new kind.** The claim; the stages, the
curve and the spectrum as the SHARED RECORDS at the lecture's positions (their eyebrows
letter 02 · 03 · 04, so each is the shared object and the registry's reader pins gain this
page); the electricity beat; Tom on the Moon's path, bench and wall by reference; In The
Pocket's nine sectors; the turn; four cards on what is left to design; the close.

**The nine-sector wall is a shared record now.** It was the lecture's own picture
(ADR-141); a second page showing it makes it `shared/in-the-pocket.ts` (`ITP_WALL_MEDIA`,
`ITP_WALL_CAPTION`), read by both by reference and pinned `toBe` in `ux-meetup.test.ts`. The
file keeps the path it shipped at.

**The page loads `course.css`**, as the lecture does: the `path` kind is styled there and
nowhere else.

## What is not built

- **No standalone file.** The owner asked for the page; the standing rule that a talk is
  also a file in its folder was put to him and he chose the page.
- **No station is dropped.** A talk that wanted hero, About and the Arc alone would fork the
  prototype, the sheet and the root class together (ADR-139). First cut keeps the spine.
- **The closing beat does not point at the handshake.** That file went live the same day
  (ADR-157); whether the talk ends on it is the owner's call and is not built.

## Verification

- `tests/lib/ux-meetup.test.ts`: the share with v3, one hero inside the house measure, the
  one lede, no worked switch, the order, the evidence by reference and on disk, the copy law
  on the page's own words.
- Headless walk at 1280×720: twelve sections mounted, no console error, every beat one
  screen but the bench (the kind's own known overflow at that frame).

## U1 · The tail follows the owner's storyline (2026-10-15, the morning of the talk)

The owner's brain dump of 15 October set the order the talk is told in, and the first cut's tail
did not carry most of it: the marginal cost going to zero and why it goes this fast, the open-source
clone that is not the threat, "nobody opens the other software", the two ways out, and headless or
told. The tail is rewritten in his order, still sixteen sections at most and no new kind:

- **The reality**: the claim (`the-claim`), why so fast (`why-so-fast`, four cards: trained on all of
  it, a product in a few weeks, open models follow, a utility), the clone (`rebuilt`) and the threat
  (`the-threat`), three beats with no picture.
- **An intelligence**: the electricity line (`not-software`, the consciousness caveat in its
  subline), then the curve and the spectrum as the SHARED DRAWINGS UNDER THIS TALK'S HEADS
  ("No ceiling yet", "An intelligence"), the way v3 and Suri's cut turn them. The page is no longer a
  word-for-word reader of either, and `arcs-registry` no longer names it.
- **Trusting it**: Tom on the Moon's path, bench and wall and In The Pocket's nine sectors, by
  reference, unchanged but renumbered.
- **Two ways out** (`two-ways`): toward the authentic, toward the intelligence.
- **What is left to design**: the turn, the four cards (the physical card moved into the two ways
  out; "Interfaces nobody has drawn yet" takes its place), and **headless or told**
  (`headless-or-told`, `list-groups` in columns, Told first because the first group is the lit one).
- The stages (prompt, tool, agent) LEFT: workshop material, in a twenty-five minute slot.
- Five chapters in the header: the reality, not software, Tom on the Moon, two ways out, the turn.

The spoken script, beat by beat with timings, is `docs/talks/2026-10-15-ux-meetup.md`. Nothing on
the page waits on an asset: the clone, a game built with AI and an artifact are shown live in the
browser, which the script cues.

**Verified** (headless, 1280×720 and 1920×1247, dark and light): sixteen sections, no console
error, every beat one screen but the bench (its known 25px). `ux-meetup.test.ts` pins the
storyline's order, the five chapters, every eyebrow's number against its position, and the shared
curve and spectrum data by reference. `npm run lint` fails on `main` at 338 of 337 before and after
this change (none of it in these files); typecheck passes; the suite's three failures
(`skill-file-fidelity`, `thoughtform-armada`, `trinny-mark`) read sibling repositories or exact
bytes on disk and fail the same without it.

## Left open

- Every line in the tail is a first cut from his notes, his to rewrite (U1 included).
- Whether Tom on the Moon and In The Pocket may be shown to a public room is his call.
- `sentinel/DIGEST.md`'s list of the era stage's readers did not name Suri's lunch and
  learn before this change and still does not; this change adds only its own page.
