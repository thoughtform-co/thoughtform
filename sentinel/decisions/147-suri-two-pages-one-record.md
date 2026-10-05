# ADR-147: Suri's two pages, one record

- **Status:** Proposed (2026-10-04, owner). Built and guarded on branch `feat/arcs-suri`
  (cut from `feat/arcs-armada` after its rebase onto main and its renumbering to ADR-146),
  not pushed; flips to Accepted once the owner has read both pages live, which is Monday
  5 October in the room.
- **Surface:** `/arcs/suri/lunch-and-learn` (an OWN ROUTE, `app/(marketing)/arcs/suri/lunch-and-learn/**`,
  `lib/arcs/content/suri-lunch-and-learn.ts`) and `/arcs/suri/configuration` (the generic
  route, `lib/arcs/content/suri-configuration.ts`); the shared record
  `lib/arcs/content/shared/suriWork.ts`; `lib/arcs/content/thoughtform-armada.ts` reading it;
  `SURI_LOOP_GROUPS` and `SURI_ASK_CARDS` exported from `suri-workshop.ts`; `OWN_ROUTE_SLUGS`;
  two `HERO_ROUTES` rows; the registry; `media.aspect` on the `media` kind and
  `.arc-media[data-media-aspect="portrait"]`; `words` on the `syllabus` kind
  (`ArcSyllabusWords`, `syllabusWords()`) and two glyphs (`skill`, `plugin`);
  `public/arcs/suri/no-reflection.mp4` + `-poster.jpg`; `tests/lib/suri-pages.test.ts` (new),
  `arcs-registry` (a reader pin for the shared bodies, the `three-ways` readers, the glyph
  list, a `words` pin), `sheet-config-fit` (the lunch-and-learn's board), `hero-preload`.
- **Related:** [ADR-143](143-the-workshop-third-house-cut.md) (the cut this page is cut
  from), [ADR-146](146-the-armada-companion.md) (the house page that carries the same three
  pieces of work, and the `repository` kind), [ADR-141](141-the-ap-hogeschool-lecture.md) (the
  client own-route precedent), [ADR-134](134-the-course-is-one-track.md) (the `syllabus` kind
  this page reuses with its own words), [ADR-142](142-arcs-nest-under-their-group.md) (the
  address), [ADR-135](135-the-arcs-sit-behind-a-password.md) (the gate, which this page does
  not set).

## The call

The owner, 2026-10-04, before a week embedded at Suri in London (Mon 5 to Thu 8 October, a
kick-off at 13:00 on Monday): a lunch-and-learn page "as a copy of the V3 Thoughtform
workshop", a "Creative Intelligence Configuration" page for Suri ("not Armada") that says
what to do, what to connect and how, in phases, and a working document for himself. On the
plan: **Suri's own three pieces of work as the tabs, no motion breakdown** (Loop's Prompt to
Loop stays on v3); then, reviewing it: **"I would add the motion video though I made because
it's visual and tangible. It's a nice way of ending my presentation."**

## The decision

**One record for Suri's work, three readers.** The Armada companion (ADR-146) already drew the
brief, the Monday read and the statics as its worked tabs, module-private. Those bodies are
hoisted to `shared/suriWork.ts` in the `theHorizon(eyebrow)` idiom (share the body, author the
frame): `suriConfiguration`, `suriRepository`, `suriUsing`, `suriWrong`, `suriOnceTwice` and
`suriMonth` each take a `SuriFrame` (the eyebrow, the menu words) and spread the body under the
record's own title and sub. The Armada page reads them back byte-identically (a temporary
equivalence test compared every section of the old and new module and was deleted once green);
both Suri pages read them; `arcs-registry` pins each reader `toBe` the bodies and pins the
reader lists. The bodies stay role-only (the house page's name walk reads them); a client page
names people only in the frames it authors.

**The lunch and learn is v3's page with the record swapped, on the AP lecture's own-route
shape.** The same prototype, v1's sheet by path, `.tw-root` with `data-tw-cut="v3"`, v3's
`hero.ts`, `about.ts` and `WorkshopProof` BY IMPORT, the four `WORKSHOP_INTRO` seams exactly as
v3 passes them, so the owner's intro edits to v3 (which another session was making the same
day) land here without a copy. The tail is v2's shape (one run plus `ArcWorkedSwitch`, no
`runs.ts`): the shared board with Suri's own head ("What this looks like at Suri."), the
situation by reference, the three pieces of work as tabs, the two you write for Suri's work,
the kickoff's loop and asks by reference, the month, an IT beat written from `IT.md`, then the
ending, then the close. The journey file is a copy, as every own route's is. ⚠ **v3's
equilibrium opener (ADR-143 U7, the same afternoon, still moving through U8 and U9) is NOT
on this page**: the owner ports v3's later changes to it himself, so the corridor is v3's
without that one station, and `suri-pages` pins the journey as exactly that.

**The ending is the loop he made, as a `media` beat, and the kind grew an `aspect`.** The
15-second "No reflection" Halloween loop (2 October, from one line and Suri's own product
photograph) is the last beat before the close: `controls`, `preload="none"`, the poster, so
nothing loads until he presses play, with sound. Re-encoded from the 27 MB master to 1.6 MB at
720×1280 with its AAC track; the poster is frame 0, "a finished picture". The `media` kind's
frame is `max-width: min(100%, 880px)` with the video at `width: 100%`, which would run a 9:16
piece ~1,560px tall, so `media.aspect: "portrait"` stamps `data-media-aspect` on the figure and
three rules solve the beat to one screen: the beat's own padding tightens
(`--arc-sec-pad: clamp(28px, 4vh, 72px)`), a head budget of `calc(210px + 12svh)` is reserved
for the eyebrow, the title, the lede and the caption, and `.arc-media__frame` takes
`width: min(100%, (100svh − budget) × 9 / 16)`, centred. ⚠ The cap sits on the FRAME, never on
the figure: the first cut capped the figure and the caption wrapped under a narrow column, so
the beat ran 911px at 1280×720 with the cap "working". Measured: the beat is exactly the frame
at both references (720 at 1280×720 with the video 365px tall and 41px of floor; 1247 at
1920×1247 with the video 827px tall and 40px), and zero video bytes move before play. Landscape
media carries no attribute and is byte-identical.

**The configuration page is the course's track with its own words.** The month as steps is
exactly what the `syllabus` kind draws (a tablist of stations under phase brackets, a gate
after each, the open station's four-row sheet, every sheet in the DOM for print), and what it
could not do was letter anything but a course: `SYLLABUS_ROWS`, `SYLLABUS_CLASS_WORD`,
`SYLLABUS_TABLIST_LABEL` were constants. `words?: { station, tablist, rows }` on the section,
resolved once in `syllabusWords()`, lets this page letter _Step · The steps · What you do · What
you end with · Done when · Where_; the row IDS never change, so the gate row's wash and the
record's fields hold, and a course without `words` renders as before. Two hairline glyphs join
the closed set, `skill` (a file with lines) and `plugin` (nested boxes). The steps are written
from the doctrine and the plugin repository, never invented: the bench's first session (one
skill), the encoding questions (write it down), the new-skill skill and `docs/TEAMS.md` (into
the plugin), `docs/FEEDBACK.md` (feedback), the offering's handover test (hand over). What to
connect is two `readout` plates from `IT.md`, `SETUP.md` and `FEEDBACK.md`, no digit, no key,
no price. The repository, the two chats, the dial and the month are the shared bodies.

**Open by link.** ADR-135 fails open; `ARC_PASSWORD_SURI_CONFIGURATION` can be set in Vercel if
the owner wants the setup page gated. The kickoff page `/arcs/suri/workshop` stays as the
printed handout; nothing is deleted.

## What the guards hold

- `suri-pages.test.ts`: the own route shares rather than forks (the root class and cut, v1's
  sheet by path, v3's hero/about/proof modules by import, no breakdown sheet), the opening is
  the shared board with its own head and sub, the situation is by reference, every switched
  group carries the three pieces of work in the record's order, the loop and the asks are the
  kickoff's objects, the IT beat is this page's own, the ending is a portrait video whose
  files are on disk under the client's folder, grids are twos or fours, beats number in order
  with a switched group counted once; the configuration page is on the generic route with
  `cardChip: "setup"`, letters the owner's four phases in the owner's order, says what to
  connect with no digit, and closes on the shared close.
- `arcs-registry`: the shared bodies `toBe` on every reader and the reader lists; the
  `three-ways` readers gain the lunch and learn; the glyph list and a four-label `words` pin.
- `sheet-config-fit`: the lunch and learn's board derives the Armada page's row and chips.
- `thoughtform-workshop-v2`'s folder walk, `hero-preload`, `thoughtform-armada` (unchanged,
  green on the hoisted module).

## U1 (2026-10-05, owner, the morning of the room)

- **The opener is v3's.** The equilibrium station (ADR-143 U7 to U11) is spliced in BY IMPORT
  (`insertEquilibriumStation`, `equilibrium.css` by path, `EquilibriumMount` in the portals), so
  the journey is v3's exactly and `suri-pages` pins it equal now, where it pinned the absence.
- **The signal line is shorter, on the shared record** (v3 takes it too): EMBED UNTIL THE TEAM /
  RUNS IT ALONE. It no longer says "self-sufficient" a scroll before the studio card does.
- **The studio card follows the films on these cuts** (`WORKSHOP_INTRO.proof.order`, read by
  `workshopV3Tracks`; the homepage keeps ADR-126's order), and its lede is the guardrails the
  studio drew for itself, every clause from the card's own sheets: real photography wherever an
  image says who Loop is, no AI-generated creators, the time saved going back into live-action
  craft. `workshop-intro` pins the order and that every pile track appears once.
- **The opening beat takes a key visual in place of the board** (`hero-board.plate`, additive:
  absent, the board draws as before). MF-01 (Midjourney `6f2a7b44`), encoded at its native
  1456x816 to `public/arcs/suri/at-suri-mf01.webp` (88 kB, lazy); the hero is MF-04 and the
  footer MF-10, so no keeper is seen twice. Unframed, its edges dissolving into the ground
  (`closest-side` mask). ⚠ Kept-dark imagery: in light it reads as a dark oval on parchment.

## Next

- The owner reads both pages live, then presents the first on Monday; the second goes to
  Nadine and IT with the GitHub and Google Cloud requirements he promised on 1 October.
- Merge: `feat/arcs-suri` carries the Armada companion too. It rebases onto main once the
  other session's hero and footer work (ADR-145) is committed; merging and pushing publish
  thoughtform.co and are the owner's word.
- The names branch of `suri-ai-studio` (`names/0.6.0`) must merge before Monday or the plugins
  the pages name go in under the old names; `skill-file-fidelity` and the Armada test read the
  renamed tree through `SURI_AI_STUDIO_DIR` until then.
- The `-motion` seam on v3 (a `worked` switch by workstream) is what this page's tabs are: the
  day v3 takes it, `suriWork.ts` is the pattern.
