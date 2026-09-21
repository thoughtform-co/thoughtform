# The owner's words, decoded

Verbatim and dated. What he says twice becomes a check.

## 2026-09-20 — the brief

> "our current arcs look bad"

The negative pole. Today's `/arcs` is a centred hero over a gutter grid of
chamfered posters, one per client, with no page rules. Shot once from the
pre-change commit into `skill/assets/negative/` and graded in wave 00 as lane
`sa`; the rubric predicts it fails C1, B1, B2, A5 and C6 and still passes A1,
A3, A6 and D2.

> "It's very important that there's some variety in how we build blocks like
> this … not every section has just three blocks."

The variety law. Mechanised in `lib/sheet/composition.ts` (split first, close
last, no two consecutive sections of one kind, no kind more than twice, at
least three kinds, three cells at most once) and read on the stills by rubric
block F1.

> "Lighthouse is a very good reference but also draws inspiration from the
> different retrofuturistic references."

The balance the rubric holds: block B and C are Lighthouse (the ruled sheet,
the editorial split); block E is the instrument references (the console's head
bar, the readout column, selection as elaboration). A page that is all of one
fails F2 either way.

> Hermeus `/propulsion`'s second section for the sessions page: "text on the
> right, paragraph below, then a timeline corresponding with the dates; no
> hero visual; keep it simple."

The `head` knob's two values are the two readings of that sentence (title left
and paragraph right, or kicker left and the pair stacked right); C1 bans the
hero; C3 requires the timeline to plot the dates.

> The arcs "rebuilt from scratch": a title and paragraph head, one section per
> client, each with "a terminal interface that provides some simple
> information about the client" and "live dashboards, as in how many projects
> are running", a fixed left panel and portrait cards on the right that
> hybridise the homepage proof stack with the services card (title top,
> paragraph bottom).

The console (E1–E4): a sticky panel, a derived readout, a pile of flashcards
with the services card's three registers.

> "build a design grid"

The twelve-column band with its own rules (B1–B3).

> "create your own eval pipeline to create all of the landing pages … a
> balance between [retrofuturistic interfaces and frontend best practice] …
> encode all these different references from the artifacts' branding into our
> Astrolabe MCP while following semantic design best practices … Don't skip
> any steps."

This ship.

## Decisions taken with him, 2026-09-20

- Session dates: "No dates yet, build with a first draft" — four mornings in
  `lib/sessions/registry.ts`, owner-to-confirm.
- Client readouts: "Derived from the registry" — never authored.
- Blog posts: "MDX files in the repo".
- Routes: `/home-sessions` and `/musings`.
- The negative pole: "Shoot once, keep stills".

## 2026-09-21 — the arcs overview becomes an instrument

> First off, this page should only be accessible to me when I am logged in,
> so it should not be accessible to external people.

The gate (ADR-117): the overview is gated in the page on a signed pass; the
client pages and the arcs stay public by link. Not a rubric check — a
property of the route, proven against a production build.

> for the first section, the hero section, it should be full viewport, and it
> should look like a sort of grid timeline, like the fourth screenshot that
> indicates the different projects mapped onto it.

The monitor (block M): one full screen, a gridded plot with a datum strip and
a terminus strip, every engagement plotted at its date (M1–M4). The fourth
screenshot is Vilimovský's "Quest custom display" — decoded in `DRIVE.md`,
attached as image 3 on the monitor still.

> in the next section, which should be like a new viewport, with "new
> viewport" I mean it should not overlap with the hero section

The log starts where the monitor ends. Asserted by the smoke as geometry
(monitor bottom = log top, nothing of the monitor in view when seated), never
graded by eye.

> on the left side we have a minimalistic list of the different Arcs, the
> different clients. Maybe we can have subsections per client, so they really
> feel like quests from a video game. When you click on them, on the right
> side, a card should then appear, a bit like the second screenshot, with all
> the information of that specific Arc.

The log (block L): client group heads over one-line rows (L1), one filled row
(L2), one dossier seated on the list (L3) that IS the filled row (L4). The
first and third screenshots (the codex, the journal) and the second (the
detail card) are image 3 on the log stills.

> This is a bigger redesign, but this feels for me much closer to an
> interface and the look and feel of Thoughtform.

Why AR stops being a document: the rubric's grading rules scope the
document-only checks away from it (0.2.0), and the stranger's read for it
files "document" and "card grid" as findings.

> Really think through this, analyze it, and then really run your eval
> pipeline like you did when you created this.

This ship, again: the decode, a second negative pole (SF, the sheet overview,
promoted byte-identical), rubric 0.2.0, a calibration wave, then wave 03.

## Verdicts

### 2026-09-20 — the first read of the wave-01 gallery (the house direction's arcs overview)

> Just a general note: those vertical borders, or vertical dividers, which you
> took from Lighthouse, I do not want those. We already have our rails so
> remove them across all our pages. Thank you

Decoded: the two full-height hairlines at the band's edges duplicate the
frame's own rails; a sheet page divides itself with SEAMS and nothing else.
The `rules` knob (sheet · seams) is decided at "seams" and deleted with its
direction SC; B1 is rewritten ("the page divides itself with seams … no
vertical rule of the page's own"); the gallery's first screen becomes the
first negative anchor of the sheet itself. Applied on every page the same
hour (ADR-114 U1); wave 02 re-shoots the remaining three directions at the new
state. Not yet ruled on: the two-up figure's short dashed divider, which is
stripe.dev's and not a rail's length — flagged in the reply, left in place.
