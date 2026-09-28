import type { ArcDef } from "../types";

/**
 * The Thoughtform workshop, as an arc: the ARCHETYPE the practice runs, and
 * the page every client fork starts from.
 *
 * ⚠ IT HAS NO `client`, AND THAT IS THE POINT (ADR-052's own reading of the
 * field: absent ⇒ a Thoughtform format, a shape the practice sells rather
 * than a piece of work done for one company). `/arcs/plopsa-workshop` and
 * `/arcs/suri-workshop` are engagements; this is what they are cuts of.
 *
 * Fifteen beats, one idea per viewport, four chapters on the house arc —
 * navigate, encode, build — with an introduction in front of them. Plopsa's
 * team had already met the practice, so their page opens on the frame; a room
 * that has not needs chapter zero, which is why the archetype carries it.
 *
 * ⚠ THE LAW IS THE PRACTICE'S OWN, ALREADY PUBLISHED. `practice-snapshot`'s
 * evals workshop shell states it: one idea per section, exactly ONE picture
 * per section, a "beat" is a section with no picture, each section fills one
 * screen at 1280x720 and never scrolls, seven to sixteen sections. And the
 * sentence that settles every argument about width: a sentence that does not
 * fit is a sentence to CUT, never a column to widen.
 *
 * ⚠ SELF-SUFFICIENCY IS THE CHAPTER'S CLAIM, NOT A CARD'S (owner,
 * 2026-09-28). The homepage's four Loop cards are the four MOVES that got a
 * team there; on this page the outcome is stated once, on the chapter head
 * above them, and the studio card is retitled to what its own pictures show.
 * The record is untouched — `proof-card`'s `title` override exists for this.
 *
 * ⚠ FOUR FIGURES, EACH IN ITS OWN BEAT, NONE OF THEM NEW: the three the
 * Moira workshop argues with, ported by ADR-130 (stages, curve, horizon), and
 * the bench ported by ADR-128. No `questions` board — a picker or a board,
 * never both, and this page carries neither.
 */
export const THOUGHTFORM_WORKSHOP_ARC: ArcDef = {
  slug: "thoughtform-workshop",
  format: "workshop",
  /* No `client`, no `kind` (kindOf derives "workshop" from the format), no
     `theme` (it reads in both), no `motion` (reveal is the default). */
  status: "running",
  date: "2026-09-28",
  cardTitle: "The Thoughtform workshop",
  cardLede:
    "Fifty minutes from what this technology is to the configuration your team runs without me.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Workshop",
    title: { pre: "The capability", em: "your team owns." },
    lede: "AI is not software to command, and a team that learns to work with it stops needing me.",
    actions: [
      { id: "start", label: "Today", href: "#today", primary: true },
      { id: "proof", label: "The proof", href: "#the-proof" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    /* The homepage's own key visual, delivered the landing's way (ADR-075):
       the gateway plate, theme-dependent, which earns the route its
       `HERO_ROUTES` row and drops the static preload. */
    plate: "gateway",
    curtain: true,
  },
  meta: {
    title: "The Thoughtform workshop",
    description:
      "How to work with an intelligence rather than command it, and what a team keeps afterwards.",
  },
  sections: [
    /* ── Chapter one · TODAY ─────────────────────────────────────────────
       The agenda, as the readout's two plates. The right plate's rows are
       the day's index: each one links to the beat that answers it. */
    {
      id: "today",
      kind: "list-groups",
      menuLabel: "Today",
      menuPrimary: true,
      layout: "readout",
      head: {
        eyebrow: "01 · Today",
        title: { pre: "Fifty minutes,", em: "and what you keep." },
        sub: "We go from what this technology actually is to the configuration your own team runs. Nothing on this page asks you to buy a tool.",
      },
      groups: [
        {
          id: "session",
          label: "The session",
          blurb: "What this is",
          items: [
            { id: "who", tag: "Who", name: "Your team, and the work you already do" },
            { id: "long", tag: "How long", name: "Fifty minutes, four chapters" },
            { id: "keep", tag: "You keep", name: "A configuration your team runs" },
          ],
          foot: {
            label: "Not this",
            lines: ["No tool to buy, and no workflow moved out of what you already own."],
          },
        },
        {
          id: "chapters",
          label: "The arc",
          blurb: "Where we go",
          items: [
            {
              id: "proof",
              tag: "Proof",
              name: "What this looked like at Loop",
              href: "#the-proof",
            },
            {
              id: "navigate",
              tag: "Navigate",
              name: "A prompt, a tool, an agent",
              href: "#three-ways",
            },
            {
              id: "encode",
              tag: "Encode",
              name: "Context, and what good looks like",
              href: "#the-horizon",
            },
            {
              id: "build",
              tag: "Build",
              name: "Inside what you already pay for",
              href: "#what-you-build",
            },
          ],
          foot: {
            label: "The order",
            lines: ["Navigate, encode, build. You cannot build on what nobody has encoded."],
          },
        },
      ],
    },

    /* ── Chapter two · THE PROOF ─────────────────────────────────────────
       Chapter zero of the room: who this is, for a team that has not met
       the practice. The OUTCOME is claimed here, once. The four cards under
       it are the four moves, and none of them re-claims it. */
    {
      id: "the-proof",
      kind: "head",
      menuLabel: "The proof",
      menuPrimary: true,
      head: {
        eyebrow: "02 · Where this comes from",
        title: { pre: "The creative team", em: "runs it without me." },
        sub: "I am Vince. At Loop Earplugs I sat inside the studio team as its intelligence architect, and the work was to make them not need me. Four moves got them there; the next four cards are the record of each one, and you can open any of them.",
      },
    },
    /* ⚠ NO AUTHORED `head` ON THE FOUR CARDS. The card IS the head (ADR-128
       B1): its band letters the client and its title letters the arc line, so
       a masthead above it both repeats the title and pushes the beat past one
       viewport at 1280x720. The order is the pile's own (`PROOF_STACK_ORDER`)
       and the registry pins it. The titles are this page's, in the PAST tense
       — the homepage says them in the present, as the offer. */
    {
      id: "proof-films",
      kind: "proof-card",
      menuLabel: "The films",
      track: "atl-films",
      title: "We pushed the frontiers of AI creative",
    },
    {
      id: "proof-tools",
      kind: "proof-card",
      menuLabel: "The tools",
      track: "tooling",
      title: "We built the tools the work needed",
    },
    {
      /* ⚠ RETITLED, AND THE RULING IS THE REASON (owner, 2026-09-28): the
         record's line for this track claims self-sufficiency, which is the
         chapter's claim above. This card's evidence is the ads and the red
         line, so its title says that instead. */
      id: "proof-studio",
      kind: "proof-card",
      menuLabel: "The studio",
      track: "studio",
      title: "We made the ads, and drew the line",
    },
    {
      id: "proof-layer",
      kind: "proof-card",
      menuLabel: "The layer",
      track: "ai-transformation",
      title: "We built the layer the agents run on",
    },

    /* ── Chapter three · NAVIGATE ────────────────────────────────────────
       Where the room already is, and why it gets harder from here. */
    {
      id: "three-ways",
      kind: "stages",
      menuLabel: "Three ways",
      menuPrimary: true,
      head: {
        eyebrow: "03 · A prompt, a tool, an agent",
        title: { pre: "How long it runs", em: "without you." },
        sub: "Everyone starts at a prompt. Then you notice it can build the tool instead of the answer. Then it runs the work itself and hands you something to judge.",
      },
      axes: { time: "How long, without you", work: "How much of the work" },
      ends: { near: "minutes", far: "half a day", top: "all of it" },
      stages: [
        {
          id: "prompt",
          label: "A prompt",
          name: "You ask, and you check",
          body: "Summarise this, pull the text out of that. One answer at a time, and you read every one of them.",
        },
        {
          id: "tool",
          label: "A tool",
          name: "You operate it",
          body: "It builds the dashboard instead of the number. You press the button, and you still check after every step.",
        },
        {
          id: "agent",
          label: "An agent",
          name: "It runs the work",
          body: "You set the goal and the checks; it works for hours, stops where you told it to stop, and reports back.",
          lit: true,
        },
      ],
    },
    {
      id: "the-curve",
      kind: "curve",
      menuLabel: "The curve",
      head: {
        eyebrow: "04 · The curve",
        title: { pre: "Each release finishes longer work,", em: "and costs more per token." },
        sub: "Each release makes fewer small mistakes, so it gets further on long and difficult work. And every model has a second dial: how hard it thinks.",
      },
      /* ⚠ THE SAME FIGURE AS `/arcs/plopsa-workshop`, AND THE SAME NUMBERS.
         These are the vendors' own list prices, read on the date in the note.
         The guard only checks that output costs more than input; nothing
         checks that a price is TRUE, so the two pages move together when a
         vendor reprices. Search the repo for the lane ids before editing one. */
      axes: { y: "What it can finish", x: "More intelligence →" },
      step: "The step",
      key: { own: "Claude" },
      prices: {
        show: "Show the price per token",
        unit: "Price per million tokens, in and out",
        promo: "Promotion",
        words: ["in", "out"],
      },
      effort: {
        axis: "← More effort",
        levels: ["Low", "High", "Max"],
        show: "Show the effort dial",
        note: "The second dial is effort. Turned up, the same model thinks longer about the same task, and spends more tokens doing it.",
      },
      lanes: [
        {
          id: "fast",
          label: "FAST",
          models: [
            { name: "Claude Sonnet 4.6", input: 3, output: 15 },
            { name: "Claude Haiku 4.5", input: 1, output: 5 },
          ],
        },
        {
          id: "everyday",
          label: "EVERYDAY",
          models: [{ name: "Claude Opus 5", input: 5, output: 25 }],
        },
        {
          id: "frontier",
          label: "FRONTIER",
          models: [{ name: "Claude Fable 5.1", input: 10, output: 50 }],
        },
      ],
      others: [
        {
          label: "OpenAI",
          points: [
            { t: 0.6, model: { name: "GPT-5.6 Sol", input: 4, output: 20, promo: true } },
            { t: 0.77, model: { name: "GPT-6 Astra", input: 10, output: 50 } },
          ],
        },
      ],
      note: "Source: METR. The task an agent finishes half the time roughly doubles every seven months. List prices from Anthropic's and OpenAI's own pages on 22 September 2026; the marked one is a promotion.",
    },
    {
      /* A beat: no picture, and twenty seconds of silence in the room. */
      id: "tool-or-agent",
      kind: "interstitial",
      variant: "question",
      eyebrow: "05 · The question",
      line: {
        pre: "Is it a tool you command,",
        em: "or a colleague you brief?",
      },
      subline:
        "It behaves like both and is neither: capable in ways no tool is, strange in ways no colleague is. That is the thing to get used to before you build anything on it.",
    },

    /* ── Chapter four · ENCODE ───────────────────────────────────────────
       The gap is not capability. It is context, and what good looks like. */
    {
      id: "the-horizon",
      kind: "horizon",
      menuLabel: "The horizon",
      menuPrimary: true,
      head: {
        eyebrow: "06 · The gates",
        title: { pre: "Where it stops", em: "on its own." },
        sub: "Smart enough, it already is. What it does not have is your judgement, so you put your judgement into the run as gates and let it work between them.",
      },
      axis: { from: "five minutes", to: "half a day" },
      operated: {
        label: "A tool you operate",
        check: "you check",
        steps: 8,
        line: "You check after every step, eight times over.",
      },
      agent: {
        label: "An agent on a long task",
        start: "You set the goal and the checks",
        gates: [
          { kind: "check", at: 0.27, label: "Checks its own work" },
          { kind: "retry", at: 0.52, label: "Steps back and tries again" },
          { kind: "ask", at: 0.77, label: "Stops and asks you" },
        ],
        end: "You judge the result",
      },
      note: "The difference is not intelligence, it is context. An agent that knows what good looks like can run for hours; one that does not has to ask you every few minutes.",
    },
    {
      /* ⚠ THE OUTPUT IS TEXT, NOT A PICTURE, AND THAT IS DELIBERATE. The
         bench's image branch wants two or three pictures with marked regions;
         the only ones on disk belong to a client, and the base every fork
         starts from may not carry another client's evidence. Writing is also
         the one craft every room in the building shares, so the example reads
         for a studio, a finance team and an engineering team alike. */
      id: "the-bench",
      kind: "bench",
      menuLabel: "The bench",
      head: {
        eyebrow: "07 · What good looks like",
        title: { pre: "A check", em: "your team wrote." },
        sub: "A Skill is how you work, written down. An eval is what good looks like, so a model can check itself. Here is ours, running.",
      },
      example: {
        id: "writing",
        task: "Reads a paragraph against the house's own writing rules and answers four named questions about it.",
        checks: [
          {
            id: "plain",
            label: "Plain words",
            line: "The shortest words that carry it, and no word a reader would have to look up.",
          },
          {
            id: "claim",
            label: "A claim, checked",
            line: "A claim a reader could check, or it is cut. Nothing asserted that nobody measured.",
          },
          {
            id: "hype",
            label: "No hype",
            line: "No revolutionary, no game-changing, no unlock, no seamless. The work is the argument.",
          },
          {
            id: "voice",
            label: "One voice",
            line: "One person, with a position. Not a committee, and not a brochure.",
          },
        ],
        inputs: [
          {
            id: "draft",
            label: "A first draft",
            brief: "The opening paragraph of a proposal, written fast, before anyone read it back.",
            output: {
              kind: "text",
              text: "Our revolutionary AI platform unlocks seamless transformation across your organisation, and teams see dramatic gains from day one.",
              marks: [
                {
                  span: "revolutionary",
                  check: "hype",
                  state: "block",
                  note: "A word the work has to earn, doing the work's job instead.",
                },
                {
                  span: "seamless",
                  check: "hype",
                  state: "block",
                  note: "Nothing is seamless. It names a feeling, not a behaviour.",
                },
                {
                  span: "dramatic gains",
                  check: "claim",
                  state: "block",
                  note: "Nobody measured this, so it cannot be written down.",
                },
              ],
            },
            results: [
              {
                check: "plain",
                state: "review",
                note: "Long words carrying little, three in one sentence.",
              },
              {
                check: "claim",
                state: "block",
                note: "Two claims nobody measured, and no source on either.",
              },
              {
                check: "hype",
                state: "block",
                note: "Revolutionary, unlocks, seamless, dramatic. In one sentence.",
              },
              { check: "voice", state: "review", note: "No position in it, and nobody in it." },
            ],
            verdict: {
              state: "block",
              label: "Does not go out",
              line: "Rewrite it: claims nobody measured, in words nobody would say.",
            },
            actions: ["Goes back with the notes attached, and nothing ships until they are cut."],
          },
          {
            id: "rewrite",
            label: "The same, rewritten",
            brief: "The same paragraph after the checks were read, with the unmeasured claims cut.",
            output: {
              kind: "text",
              text: "We make your team self-sufficient with AI and leave them with a configuration they run. At Loop that meant four pieces of work, each one on the record.",
              marks: [
                {
                  span: "self-sufficient",
                  check: "plain",
                  state: "pass",
                  note: "The word the team used about itself, so it stays.",
                },
                {
                  span: "a configuration they run",
                  check: "claim",
                  state: "pass",
                  note: "Checkable: either they run it or they do not.",
                },
                {
                  span: "on the record",
                  check: "claim",
                  state: "pass",
                  note: "Points at evidence the reader can open on this page.",
                },
              ],
            },
            results: [
              {
                check: "plain",
                state: "pass",
                note: "Short words, and none a reader would have to look up.",
              },
              {
                check: "claim",
                state: "pass",
                note: "Both claims point at something the reader can open.",
              },
              { check: "hype", state: "pass", note: "None left." },
              {
                check: "voice",
                state: "review",
                note: "Strong, though the middle sentence could name the work.",
              },
            ],
            verdict: {
              state: "review",
              label: "Goes out, with a note",
              line: "Publishable. One note left: name the pieces of work, or link them.",
            },
            actions: ["Publish, and link each piece of work from the record."],
          },
        ],
        skill: {
          folder: "writing/",
          files: [
            {
              name: "SKILL.md",
              line: "What the house sounds like, and the four checks every paragraph is read against.",
            },
            {
              name: "evals/",
              line: "The cases on file: the paragraphs that must pass, and the ones that must not.",
            },
            {
              name: "references/banned.md",
              line: "The words the house does not use, each with the reason it was cut.",
            },
            {
              name: "references/voice.md",
              line: "Passages from the owner's own writing, as the thing a draft is supposed to sound like.",
            },
          ],
        },
        rules: [
          {
            band: "fixed",
            check: "hype",
            line: "The banned words are a list, and the list is checked word for word.",
          },
          {
            band: "fixed",
            check: "claim",
            line: "A claim with no source attached is cut before anyone else reads the draft.",
          },
          {
            band: "adapt",
            check: "plain",
            line: "Plain is judged, not counted: a technical room is allowed its technical words.",
          },
          {
            band: "free",
            line: "How long a paragraph runs, and where it breaks. Nobody checks that, and nobody should.",
          },
        ],
        cases: [
          {
            id: "brochure",
            label: "The brochure paragraph",
            line: "The first draft above. It has to come back blocked, on the claim check and on the hype check.",
            expect: "block",
            checks: ["claim", "hype"],
          },
          {
            id: "rewrite",
            label: "The same, rewritten",
            line: "Has to pass the claim and hype checks, and may still be sent back on voice.",
            expect: "review",
            checks: ["plain", "claim", "hype", "voice"],
          },
          {
            id: "technical",
            label: "A note written for engineers",
            line: "Full of technical words, and it has to pass: plain is judged against the room, not against a word list.",
            expect: "pass",
            checks: ["plain"],
          },
        ],
        record:
          "The practice's own writing Skill, the one every page on this site is read against.",
      },
    },
    {
      /* A beat: no picture. ⚠ NOT A QUOTE — an earlier cut attributed a
         paraphrase to a named person, which is a sentence nobody said on a
         public page. The callout states what is observable instead. */
      id: "the-hard-part",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "08 · Why now",
      line: {
        pre: "The labs are hiring people",
        em: "to write this down inside companies.",
      },
      subline:
        "Engineers embedded in a client's team, encoding how that team works so the models can use it. The models cannot supply that, and it is the part nobody has had to write down before.",
    },

    /* ── Chapter five · BUILD ────────────────────────────────────────────
       Where it goes, and why it goes there rather than into a subscription. */
    {
      id: "what-you-build",
      kind: "list-groups",
      menuLabel: "What you build",
      menuPrimary: true,
      layout: "plates",
      head: {
        eyebrow: "09 · What you build",
        title: { pre: "Build it inside", em: "what you already pay for." },
        sub: "Most of this already sits in the building. What you add is the part only your team can write.",
      },
      groups: [
        {
          id: "have",
          label: "What you already own",
          blurb: "The foundation",
          items: [
            {
              id: "model",
              tag: "HAVE",
              name: "A frontier model",
              body: "Claude or ChatGPT on an enterprise plan, approved and already paid for.",
            },
            {
              id: "reach",
              tag: "HAVE",
              name: "The tools it can reach",
              body: "Your board, your files, your design tool.",
            },
            {
              id: "people",
              tag: "HAVE",
              name: "The people who know what good is",
              body: "The judgement a check encodes is the team's.",
            },
          ],
          foot: {
            label: "Cost",
            lines: ["Nothing new. You are already paying for all three of them."],
          },
        },
        {
          id: "wrapper",
          label: "What a wrapper resells you",
          blurb: "The layer on top",
          items: [
            {
              id: "api",
              tag: "SAME",
              name: "The same models, marked up",
              body: "A thin layer over APIs you can already call yourself.",
            },
            {
              id: "spend",
              tag: "COST",
              name: "A credit pack, not a bill",
              body: "Credits at rates that are not the API's. Hard to read.",
            },
            {
              id: "memory",
              tag: "LOSS",
              name: "The context stays behind",
              body: "Work done elsewhere never accumulates in your own assistant.",
            },
          ],
          foot: {
            label: "The catch",
            lines: ["Their business runs on your token spend. Yours does not."],
          },
        },
        {
          id: "build",
          label: "What you build instead",
          blurb: "The configuration",
          items: [
            {
              id: "skills",
              tag: "BUILD",
              name: "The way you work, written down",
              body: "How this team briefs, decides and finishes one piece of work.",
            },
            {
              id: "evals",
              tag: "BUILD",
              name: "What good looks like, as checks",
              body: "Rules that catch a bad output before a person has to.",
            },
            {
              id: "keys",
              tag: "BUILD",
              name: "Your own keys for the rest",
              body: "An image model, a video model. Billed at cost.",
            },
          ],
          foot: {
            label: "You keep",
            lines: ["A configuration your team runs, and can carry to another model."],
          },
        },
      ],
    },
    {
      id: "delegate-down",
      kind: "cards",
      menuLabel: "Delegate down",
      /* ⚠ FOUR, NOT THREE, AND THE REASON IS THE ROOM'S OWN PROJECTOR.
         `arcs.css` forces two columns at `max-width: 1280px` — inclusive — so
         a three-card beat orphans its last card at exactly the viewport this
         page is authored for. Four fills 2x2 there and runs 4-up above it. */
      columns: 4,
      head: {
        eyebrow: "10 · Who does what",
        title: { pre: "Map it high,", em: "then hand it down." },
        sub: "Intelligence is a resource, and the order you spend it in decides the cost.",
      },
      cards: [
        {
          id: "map",
          n: "01",
          title: "Map it at the top",
          body: "A frontier model reads the whole workflow and catches what nobody wrote down. Expensive, and you do it once.",
        },
        {
          id: "hand",
          n: "02",
          title: "Hand the work down",
          body: "Once the shape is written down, a cheaper model runs it. Delegating down is easy; the other way round is not.",
        },
        {
          id: "keep",
          n: "03",
          title: "Keep the judgement here",
          body: "What good looks like cannot be bought in. It is your team's, which is why they end up not needing me.",
        },
        {
          id: "further",
          n: "04",
          title: "Then move it further down",
          body: "Once the shape holds, more of it runs on smaller and cheaper models, and some of it on models you host. Written down once, it travels.",
        },
      ],
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "What follows",
      head: {
        eyebrow: "11 · What follows",
        title: { pre: "Then it runs", em: "without me." },
        sub: "The first workstream goes through the loop with your own team at the controls. Then a second, with the checks that have accumulated. Then we hand over, with a date on it, and come back once to see what changed.",
      },
      actions: [
        {
          id: "mail",
          label: "vince@thoughtform.co",
          href: "mailto:vince@thoughtform.co",
          primary: true,
        },
      ],
      footerLine: "Thoughtform · Antwerp · 2026",
      signature: "Vince Buyssens",
    },
  ],
};
