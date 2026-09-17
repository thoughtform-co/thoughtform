# ADR-111 — The Embedded card carries the configuration

- **Status:** Proposed (2026-09-17, owner) — shipped and guarded; flips to
  Accepted once the owner has read it live.
- **Supersedes on copy:** nothing. The four FORMAT NAMES on the site already
  matched the doctrine; what was stale was what the Embedded card described.
- **Related:** [ADR-029](029-services-card-ring.md) (the ring),
  [ADR-086](086-services-card-carries-the-work.md) (the live face and the four
  edge rules), [ADR-110](110-the-card-turns-over.md) (the phone back is the
  spec), [ADR-083](083-mobile-evidence-instruments.md) (the accordion).

## What changed, and where it came from

The `thoughtform-strategy` skill landed **V47, `creative-configuration-praxis-
folded-armada`, 2026-09-12 — "the offering made tangible"**. Its own summary:
the position half was touched on purpose, because the position changed.

The thing a client buys is now named as ONE OBJECT — **an intelligence
configuration they own**: the model, the substrate it runs on, what it may
reach, how much it decides alone, and who owns it once it runs. Every format is
a depth of building that configuration with the team. The most proven instance,
the **creative intelligence configuration**, is sold as **a modular sprint in
three stage-gated workstreams** (setup/insight/briefing → asset generation and
design → creative operations and scaling), headless, on the client's own keys,
inside the tools the team already works in, with no platform to license.
Capacity moved from one company to **two or three**. Production is the proof
wave that calibrates the configuration and **never an ongoing retainer**.

⚠ **NOTHING ON THE SITE WAS SUPERSEDED BY NAME.** Keynote · Workshop ·
Embedded AI Partner · Strategic Advisory are exactly the doctrine's four
canonical formats, and `guided-build` hosting Advisory is a documented slot-key
misnomer that stays (`serviceData.ts`: the id is a spatial key). What was stale
is that the Embedded card still described a sustained engagement in the general
— it said what the work IS and never what is BOUGHT.

## The ruling: the card names the SHAPE, creative is the PROOF

The doctrine's licence is exact — _"the embedded partner's productised shape for
creative teams is the configuration sprint described above; other teams get the
same shape with their own workstreams."_ So the card sells the shape, and the
creative instance is evidence rather than definition.

The words that carry the generality, in order of load:

| word                                          | why it generalises                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **workstream**                                | the unit of the sprint. Creative has three named ones; every other team has its own. **Naming the UNIT rather than the ASSET is the whole trick.**                                         |
| **briefing**                                  | the doctrine's own general mechanism — "it is how you brief a person: hire an intelligence, give it the briefing as context, show it what success looks like, then judge what comes back." |
| **generation and design**                     | the middle stage's general name. "Image, video and ad design" is the creative instance and stays OFF the card.                                                                             |
| **operations and scaling**                    | already domain-free.                                                                                                                                                                       |
| **your own keys / the tools you already use** | the headless claim, true of any stack.                                                                                                                                                     |
| **the last gate**                             | the general form of "its own designers as the last gate".                                                                                                                                  |

⚠ **The creative instance appears EXACTLY ONCE**, in `serviceData.body`, a DOM
surface with no bake budget, phrased as evidence: _"Proven first on creative
work; the same shape takes any team's own workstreams."_ It may not travel to
the baked face or the phone back — and the fit arithmetic below is why it
cannot.

## Why there is still no price field

The source says each workstream is _"a stage gate priced on its own"_, which is
the strongest invitation to add one this surface has ever had. It is refused.
`servicePlateData.ts` has carried the owner's 2026-07-25 ruling since: **"money
stays in the proposal. Do not add one without asking."** The STAGES may be
named; the PRICES may not. A named stage is a shape a reader can evaluate; a
price on a public card is the proposal's job, and the two are not the same
decision.

## The bans this copy is written against

From the doctrine's language bank, checked line by line against every new
string: **no "self-sufficiency"** — the approved substitute _"a setup the team
runs by itself"_ is used verbatim, and the landing already bans the word
(`CorridorStationHeaders.tsx`, ADR-018); **no "flywheel"**, even though the
owner says it in the room; **no "fractional"**, which may never travel without
the cadence and the dated handover in the same breath; no prompts-as-product;
**no founder-as-offer** — no person is named in any new string; and
Navigate/Encode/Build are never presented as three products.

⚠ **PRODUCTION IS NOT MENTIONED AT ALL.** The retainer boundary is carried
instead by `duration: "Fixed term, dated handover"`, which the doctrine itself
says _"is what separates it from a retainer."_ Mentioning production would
require carrying its whole boundary clause, and there is no room on a card.

⚠ **THE DATA-LAYER SEAM IS HELD.** Nothing says ontology, knowledge graph,
systems of record or permissions. The object is JUDGMENT — the brief, the
standards, the last gate. "Do not drift into data modeling. Stay in the
judgment half and name the seam."

⚠ **AND THE DISCIPLINE THAT IS EASIEST TO DROP IS HELD TWICE.** The doctrine:
_"state the layer's value and its dependence in the same breath … said as value
alone, the claim arms whoever wants to cut the experts."_ So
`participants: "Your team, as the last gate"` and
`leavesWith: "The layer, and the team that runs it"` name the team as the
MECHANISM in two separate rows — the noun hierarchy verbatim (_"the layer is
half of what stays; the team that runs it is the other half"_). The card cannot
be read as replacing the team, which is a live misreading risk for an offer
whose subject is automation.

## The back-face cost model — solved before a file was opened

`tests/lib/services-ring-mobile-gate.test.ts` walks every plate through
`backFaceLayout` with `modelMeasure` and asserts it fits above
`BACK_CONTENT_LIMIT`. That gate fails FIRST on long copy, so the arithmetic is
the design step, not the verification step.

```
CTA_Y0 1232 · BACK_CONTENT_LIMIT 1208 · BACK_MAX_W 736 · BACK_COL_W 368
title  58px x 0.48 = 27.84 px/ch -> 26 ch/line, HARD CAP 2 lines
bullet 42px x 0.50 = 21.00 px/ch -> 33 ch/line
dd     40px x 0.50 = 20.00 px/ch -> 17 ch/line narrow, 35 wide
```

Baseline `contentBottom` 1141, **slack 67**. The costs: a third TITLE line is
+66 **and fails the `<= 2` assertion outright** (a title over ~52ch is dead on
arrival); a third line on any bullet +48; `leavesWith` 1 → 2 lines +44.
⚠ **`participants` and `language` growing to two lines cost NOTHING** — their
rows are already 132px tall because `duration` and `format` are two-line, and
`rowH = max(...)`. The free lines live there, and knowing which rows are free is
the whole reason this model is written down.

**So the budget is exactly ONE PAID LINE**, and it is spent on `leavesWith`,
because that is where the dependence sentence has to sit. Measured after:
`contentBottom` **1185 against the 1208 limit — 23px of slack**, title 2 lines.

⚠ **TWO CANDIDATES DIED IN THAT PASS AND NEVER REACHED A FILE:** _"An
intelligence configuration your team owns."_ (45ch → three title lines) and
`format: "Proven on creative work, true of any workstream"` (47ch → four dd
lines, `contentBottom` 1273, **65px over**). **That second failure is why the
creative-proof sentence lives only on the DOM surfaces** — it is not an
editorial preference, it is the back face refusing it.

**The front face gets strictly safer.** The `card` variant bakes chip + lede +
drawing (`title` does not bake there). At 146ch the lede is four lines at every
advance in `probe-bake-advance.mjs`'s measured range, clearing the drawing by
~99px; five lines is the real ceiling at 49px. The new lede is **10ch SHORTER**
than the one it replaces.

## The MESH: amended minimally, and what was refused

⚠ **THE DRAWING CANNOT SAY "THREE STAGE GATES" WITHOUT BREAKING ONE OF THIS
FILE'S OWN LAWS, AND THAT FINDING OUTRANKS THE BRIEF.** Every device that
encodes _gating_ is barred: a dashed gold TRAVERSE across the marks is the
SURVEY's own property one card over (`guided-build`), and reusing it would
collapse two of the four edge rules into one; a bracket, a gate glyph or a
numeral is new vocabulary, which `cardViz.ts`'s doctrine forbids in terms
(_"varying only the edges is what makes a SET"_ — the file has made the
opposite mistake once already); and a legend is banned outright on this surface.

**So the copy carries "stage-gated" and the drawing carries "three, in order,
seated inside one body that holds itself up"** — which is true, and is already
what the mesh means. A drawing that needs explaining is worse than one that
says less.

What was actually wrong, and is fixed: the three marks were `byDepth[0/4/8]`,
sorted by DEPTH alone, so their positions in the plane were incidental — three
marks could clump or read in no order at all. They are now seated **one per
horizontal third of the front twelve** and their radius ramps **6 → 7 → 8, left
to right**. Size is already a live variable in this file (`route()` marks its
head at 7 and its tail at 8 precisely to say the two are not the same thing),
and the survey's five marks are uniform 6 and are read by the traverse — so the
ramp borrows nothing new and nothing of the survey's. One mark type, one stroke
grammar, no legend, no new colour.

⚠ **THE RAMP IS SUBTLE AT CARD SCALE, AND IT IS A DIAL.** Read live on the
phone the three marks are clearly three and clearly spread; the growth is at the
edge of perception. If the owner wants the order louder the step goes 6 → 8 → 10;
if he reads it as noise, `6 + k` returns to a flat 6 and **the copy loses
nothing**, because it was never the drawing's job to letter the stages.

**Also: `embedded` is named in the dispatch now.** It was reached through
`default:` — the service with the most copy churn arriving by fall-through,
which is one rename away from silently painting the wrong card. `default:`
stays, as the safe branch for an id this file does not know.

## The masthead is deliberately NOT touched

`"AI CAPABILITY" / "YOUR TEAM OWNS."` stays. It is the SECTION's beat over all
four services, not this card's line, and it stays true under the new copy — the
new title is written to rhyme with it rather than contradict it. It is also
hardcoded in two beats (`CorridorStationHeaders.tsx`, `MobileEpilogueSignal.tsx`)
so the beat and the offer say one thing in one voice, and pinned by four tests
across two routes.

⚠ **The obvious next question, flagged rather than taken:** the doctrine's noun
hierarchy says _capability is what is sold, the configuration is the object it
is bought as_ — so the masthead is arguably already the MORE correct of the two
words. Changing it is a six-file, two-smoke, one-ADR change with its own fit
question (`CONFIGURATION` is four characters longer on a display line that
`arc-board-fit` measures). It belongs to a masthead pass.

## Doc drift fixed in the same commit

`.claude/rules/services-ring.md` said "**six** files in lockstep" over a table
of **ten** rows, and `CLAUDE.md` said "**Five**". Three counts, all wrong.
**The prose stops counting** — the table is the record. And the rule gains a
**copy law** section, which it did not have: no price field, lede ≤160ch,
back-face fit solved before writing, and the doctrine's hard bans. Those bans
were codified only in `.claude/rules/arcs.md` and `trinny-london.md`; the
services surface — the one that sells the offer — had no guard at all, which is
exactly how this would regress silently.

## Verifying

```bash
npx vitest run tests/lib/services-ring-mobile-gate.test.ts \
               tests/lib/ring-type.test.ts \
               tests/lib/service-scan-notes.test.ts \
               tests/lib/cases-registry.test.ts
npx playwright test tests/visual/services-ring-smoke.spec.ts --workers=1
node scripts/capture-services-mobile.mjs --theme dark
node scripts/capture-services-mobile.mjs --theme light
```

⚠ **RUN THE SMOKE AT `--workers=1`.** In parallel, five browser projects share
one dev server and starve the WebGL ring past its 20s arrival timeout: the run
reports `Open Keynote details` not found on a card this change never touched.
Measured — serial is **19 passed** against the baseline's identical 19, and the
only failures are the three documented environmental photo-resolution cases
(`/images/services/strategic.webp` returning status 0, a thrown fetch, while the
asset serves 200 to `curl`).

Measured after: `embedded` back `contentBottom` **1185 / limit 1208 / slack 23**,
title 2 lines. Front lede four lines, clearing the drawing.

## Left open

- The desktop `meta` rows and the longer `serviceData.body` have **no test
  coverage** — they were eyeballed in the browser, and a future pass that grows
  them has nothing to fail against.
- The masthead's `CAPABILITY` vs `CONFIGURATION` question, above.
- The mesh's radius ramp, above — a dial with a recorded fallback.
