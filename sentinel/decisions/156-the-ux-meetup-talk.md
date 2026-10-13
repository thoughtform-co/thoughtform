# ADR-156: The UX meetup talk is a cut of the workshop's third house cut

- **Status:** Proposed (2026-10-13, owner). Built and guarded on branch `feat/arcs-ux-meetup`
  (cut from `origin/main`), not pushed; flips to Accepted once the owner has read the page
  live, which is Thursday 15 October in the room.
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
- **The closing beat does not point at the handshake yet.** It joins the tail only if the
  owner has signed off that file's words (ADR-157).

## Verification

- `tests/lib/ux-meetup.test.ts`: the share with v3, one hero inside the house measure, the
  one lede, no worked switch, the order, the evidence by reference and on disk, the copy law
  on the page's own words.
- Headless walk at 1280×720: twelve sections mounted, no console error, every beat one
  screen but the bench (the kind's own known overflow at that frame).

## Left open

- Every line in the tail is a first cut from his notes, his to rewrite.
- Whether Tom on the Moon and In The Pocket may be shown to a public room is his call.
- `sentinel/DIGEST.md`'s list of the era stage's readers did not name Suri's lunch and
  learn before this change and still does not; this change adds only its own page.
