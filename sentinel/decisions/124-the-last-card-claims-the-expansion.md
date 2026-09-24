# ADR-124: The last proof card claims the expansion, the Embedded card says what it does, and the third reading is the layer

- **Status:** Proposed (2026-09-24, owner) — shipped and guarded; flips to
  Accepted once the owner has read it live.
- **Surface:** the landing's `#services`: proof card 4 (`ai-transformation`,
  `lib/cases/content/loop-earplugs.ts`), the Embedded service card
  (`servicePlateData.ts`, `serviceData.ts`, `serviceDesignations.ts`), and the
  PDA console's third reading (`casefile/map/pda/{PdaConsole,pdaRecord,PdaCarrier}`);
  the Trinny proposal's proof stack, which mounts the same cards.
- **Extends on copy:** [ADR-111](111-the-embedded-card-carries-the-configuration.md)
  — narrowed, on the owner's word: the Embedded card's baked face names the
  marketing team as the room the configuration is built in, where ADR-111 sold
  the shape for any team. The general claim keeps its place as the last
  sentence of `serviceData.body`. [ADR-070](070-configuration-is-a-switchboard.md)
  — reading 03 is renamed; its id does not churn.
- **Related:** [ADR-112](112-the-portrait-raster-and-the-four-services.md) (the
  leadership altitude on the Embedded card, untouched),
  [ADR-062](062-intelligence-map-city.md) (the four proof blocks as readings of
  the drawing beside them), [ADR-085](085-proof-design-pass.md) (the hub's
  brief), [ADR-094](094-trinny-proof-stack-and-proposal.md) (the proposal page
  mounts the same cards).

## The ask

Owner, 2026-09-24, dictated, after the Suri kickoff (21 Sep) and the Samako syncs
(23 and 24 Sep):

> "Building that intelligence configuration inside creative teams, inside
> marketing departments, is really working. In fact, the Suri deal just landed."

> "In our proof section … we took it to the rest of the company. That's actually
> the main thing … It should be the fulcrum, the climax."

> "The product/service I'm actually building sits between adoption and
> automation … me coming into a company, embedding myself in the teams, looking
> at their marketing setup, and then building all the tools around it. It goes
> from creative production to creative operations, but also creative review."

> "I like the visual of the configuration; it's super clear, but I think the
> wording and the overall flow should be improved … the Substrate is too vague.
> The idea there was that you can see patterns across different things, but for
> me, that feels too specific, so maybe it should be more simplified."

> "The last card in our proof section, but also the embedded section. I don't
> think that says enough about what it does."

Asked two things the same day, he chose: the third reading becomes **the
layer**, the same dial with plainer words and the five-shape vocabulary off the
drawing (not a prompt-tool-agent redraw); and the Embedded card keeps its three
priced workstreams as its lines, with "from production to operations to review"
in the lede.

## What the record already said

- The card's own comment (since 2026-08-02) flagged that its lede "still
  describes the MAP where the beat claims the EXPANSION", and left the words to
  the owner. The strategy skill's proof reference tells the Loop story in five
  steps, the fourth being "we expanded it to the rest of the company: the same
  move, team by team, until the layer ran company-wide".
- The proposals (Suri, Perfect Ted, Hungry Minds) already carry the seam in one
  line, "Adoption writes the layer, automation runs on it", with its two halves:
  the team learns on its own work and writes down what good looks like; the
  layer runs inside the tools they already use and hands the time back. The
  landing said none of it.
- The vault's September account of the practice: the creative intelligence
  configuration is the offering, adoption is the part that does not scale, and
  the founder keeps it to two or three clients at a time.

## The ruling

1. **Card 4 claims the expansion.** Its arc title stays "We took it to the rest
   of the company". Its lede: _"The same move, team by team: embed in the work,
   write down what good looks like, build the tools around it, hand it over.
   First the studio, then every team at Loop."_ Its four blocks keep their glyph
   keys; block 1 keeps the board's reading (27 modules), block 2 keeps the
   Skills sum ("47 Skills encoded once", so the total guard still reads 47), and
   blocks 3 and 4 are the proposals' seam lines, word for word: "Adoption writes
   the layer" / "Automation runs on it". The owner's verbatim `brief` is
   untouched.
2. **The Embedded card says what the work is.** Title, bullets, spec, includes
   and CTA stay (the leadership session stays at exactly two mentions). The lede
   becomes _"Embedded in your marketing team, from production to operations to
   review: a setup on your own keys, in your own tools, that the team runs by
   itself."_ (148 characters). The word "creative" stays off the baked face and
   the phone back, per ADR-111; it appears once, in `serviceData.body`, which
   opens the same way and keeps its general last sentence. The hologram's crown
   callout reads "THREE STAGES / production to review".
3. **The third reading is the layer.** The tab reads LAYER (id `substrate`
   unchanged). The foot: "03 · The layer" and _"47 Skills, each written down
   once by the team that needed it. Every team after draws on it, and a new model
   inherits it."_ (the count interpolated from the record). The hub: _"What stays
   when the model changes: judgment encoded once, drawn on by every team after."_
   (four lines at the hub's measure; keeps the guard's "encoded once", no digit,
   none of the console's own jargon). The five band names come off the dial in a
   separate commit, so that change reverts alone.
4. **Pins and rules move in the same commit.** `trinny-london-smoke.spec.ts`
   and `arc-portfolio-smoke.spec.ts` read LAYER; `services-ring.md` §The Proof
   map describes the console as it is; `proof.md`'s three mentions of the third
   reading follow.

## Left open

- **Card 2's title**, "We made the creative team self-sufficient", is the
  story's own words and is untouched; the language bank would say the
  behaviour. The owner's call.
- **The prompt-tool-agent reading** (how far each stream runs without a person,
  on the workshop's isometric floor) was offered and declined this round.
- **The headlines and ledes are drafts** in the site's register. They pass the
  copy law and the tone-of-voice bans; they are not the owner's sentences.

## Verifying

```
npm run verify
npx playwright test tests/visual/trinny-london-smoke.spec.ts tests/visual/arc-portfolio-smoke.spec.ts --project=desktop
npx playwright test tests/visual/services-ring-smoke.spec.ts --project=desktop --project=iphone-14-pro-max-chromium
```

Then `http://localhost:3003/#services` at 1440 and on a phone width, and
`http://localhost:3003/arcs/trinny-london/proposal`.
