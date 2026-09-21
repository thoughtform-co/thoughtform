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

### 2026-09-21 — the first live read of the instrument's log (before any gallery)

> Ok thanks, good foundation but it looks messy. It needs more breathing room
> between the two panels. And each section on the left side needs to feel more
> like blocks instead of glorified word document. So let's simplify the arc
> subpage.

With the codex list as his reference: a column of bordered plates, a wide gap,
one panel. Decoded against the still: the list was an OUTLINE (six client heads
over one-line rows on hairlines, five heads over one row; a chip restating every
title; 43 strings, 15 hairlines), the chosen row butted into the dossier (the
zero gutter was ADR-118 §3's own design), and the list ended ~100px above the
dossier's floor. Applied the same hour (ADR-118 U1): one bordered block per
engagement, the client and the date over the title; no heads, no chips; a
gutter of `clamp(48px, 6vw, 112px)`; the filter level with the dossier's band;
the blocks dividing the device so the list ends on the dossier's floor; the
runs ordered by their newest filing. The `rows` knob and direction SH are
deleted — he read one value and the house went past the other. His read agreed
with wave 03's stranger ("archive", never "quest journal") before he had seen
the galleries. For wave 04: L1 becomes blocks, L2 one filled block, L3 a gutter
and one floor, and wave 03's house log stills become a negative pole (SR).

### 2026-09-21 — the read of U1's stills (the log as blocks), with three references

> I don't really like our design because it really feels like a fucking
> glorified PowerPoint … Have you actually looked at these references?

With three screens beside it: a game inventory's circuit board, a red codex
list, and a vendor's software list split OWNED / STORE. His points, verbatim
where they carry the ruling:

> the title of the client should be more prominent, not too big

> [the tabs] should not be tabs on top. They should actually divide the list on
> the left, like we have in the third screenshot

> I don't mind that it extends beyond the viewport section … we can keep the
> right panel sticky

> The card should also have notches on the left of it. I feel there should also
> be some sort of icon like we have on the red one

> that key visual with the text: what the fuck is that? … What I want instead is
> like a visual of the intelligence configuration … that sort of node from a
> computer, like we have on our homepage in the proof section, and also that
> first screenshot

Asked, he set the diagram's model himself:

> At the center, we should showcase the type of intelligence configuration:
> generate images, generate ads, or generate a video. That's the core
> intelligence configuration they want. Around it, we can link the LLM they
> use, like whether they use Figma, etc. It should just really be a scalable
> thing because, for some other clients, it might be more complex

and kept, of the old panel, "the one-line brief, status readings, Open arc
button + key hints"; drew it for the proposals only ("is that not every type
of arc has this intelligence configuration?"); and chose the kind of page for
the icon.

Decoded: U1 and the cut before it both took the references BY ROLE ("a list",
"a card") and rebuilt each role in the sheet's own document grammar — a ruled
column under a tab strip beside a picture with a text plate. **A reference's
COMPOSITION is the brief; its roles are not** (his era-stage verdict on the
title-over-columns skeleton, a second time). Applied the same day (ADR-118
U2): the kinds divide the list under heads level with the dossier's band; a
block is a page icon beside a plate notched bottom-left, the client as its
title over the bracketed engagement and the date; the dossier keeps its band,
brief, status strip and CTA, and for a proposal draws its configuration — an
ink die of the workstreams at the centre, chips for what they run on and
inside, buses between, the links read out of the proposal's own sentences. The
`dossier` knob and direction SJ are deleted. For wave 04: the L rows want the
sections, the icons and the notched plates, the dossier's board gets checks of
its own, and L1's "cut off" clause allows a block cut by the screen's bottom,
which he allowed.
