# Brief — subpages, the sheet

**Client:** the practice itself (thoughtform.co). **Owner:** Vince.
**Started:** 2026-09-20. **Record:** ADR-114 in the site repo.

## What is asked

A design system for the site's OVERVIEW subpages — the arcs index and client
pages, the Home sessions event page, a blog index and its posts — and an eval
pipeline that builds and grades them. The site has a grammar for the corridor
and another for the decks under `/arcs`; it had none for a page that lists
things.

## What the references say

Five clusters, decoded in `DRIVE.md`, each one law the pages obey and the
rubric checks:

| cluster                 | references                                                   | the law                                                                                                         |
| ----------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| A · the ruled sheet     | Lighthouse, Tensorlake, Prime Intellect, Kindled, stripe.dev | the page draws its own rules; cells share edges; one weight, one hue, three alphas; nothing floats              |
| B · the instrument      | Vilimovský monitors, Rocket-001, Ledger, Astrolabe           | a head bar with designations, a readout column, selection as elaboration, every readout a record                |
| C · the editorial split | Hermeus §2, Graphic Hunters, flashform, uxmachina            | the head is a split, never a centred hero; sections carry ordinal, kicker and rule; consecutive sections differ |
| D · timelines           | Hermeus roadmap and detail, speedy.io, SkyLine               | dates on an axis; one lit node; the open item elaborated, the rest one line                                     |
| E · the article index   | stripe.dev, Astrolabe's canon index                          | figures framed with a caption bar; the index a ruled table; the post a sticky metadata column                   |

## What is delivered

- The sheet: `components/sheet/**`, `lib/sheet/**`, ten arrangements, five
  knobs, the variety law in code.
- Six routes: `/home-sessions`, `/arcs`, `/arcs/<client>`, `/musings`,
  `/musings/<slug>`, `/test/subpage-kit`.
- This ship: the register strips, the negative pole, rubric 0.1, the capture,
  wave 00 (calibration) and wave 01 (four directions).

## What he decides after wave 01

Split or stacked head · ordinals on or off · pile or grid · axis or rail
(full-height rules or seams was ruled on 2026-09-20: seams alone) · whether the Loop console expands its four dossier
beats into flashcards · the twelve-gold budget · the four session dates and
each client's `since` year.
