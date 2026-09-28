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
 *
 * ⚠ TWO HALVES: THE STORY, THEN HANDS ON (ADR-131 U1, owner 2026-09-28). The
 * Plopsa morning proved the shape: within the hour of the practical half the
 * team was making stop-motion spots, cutting edits from rushes and building
 * layered files. So the BUILD chapter is the practicals, a ladder of five
 * rungs that starts small (one image, then a brief) and ends on the skill,
 * and the theory's own build talk rides under Encode. Every rung is the same
 * four rows — drop in · ask · you get · the check — so a fork swaps the words
 * and never the shape. Each half sits inside the shell's sixteen; the page as
 * a whole does not, because the shell was written for one short session.
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
    "The story first, then hands on: from one picture to a skill your team runs without me.",
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
        title: { pre: "The story first,", em: "then hands on." },
        sub: "We go from what this technology actually is to the configuration your own team runs. Nothing on this page asks you to buy a tool.",
      },
      groups: [
        {
          id: "session",
          label: "The session",
          blurb: "What this is",
          items: [
            { id: "who", tag: "Who", name: "Your team, and the work you already do" },
            { id: "long", tag: "How it runs", name: "The story, then your own files" },
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
              name: "Hands on, from an image to a skill",
              href: "#practicals",
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

    /* Encode's close: where it goes, and why it goes there rather than into a
       subscription. ⚠ NOT A CHAPTER SINCE ADR-131 U1 — the row is at its cap
       of five, and the BUILD chapter is the practicals below, where the room
       makes things instead of hearing about them. */
    {
      id: "what-you-build",
      kind: "list-groups",
      menuLabel: "What you build",
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

    /* ── Chapter five · BUILD — the practicals ───────────────────────────
       Part two of the morning (ADR-131 U1). The setup once, then a ladder of
       five rungs, each built on the one before. Every rung is the same four
       rows in the same order, so the room learns the shape once. */
    {
      id: "practicals",
      kind: "list-groups",
      menuLabel: "Build",
      menuPrimary: true,
      layout: "readout",
      head: {
        eyebrow: "11 · Hands on",
        title: { pre: "Now you", em: "drive." },
        sub: "Five rungs on your own files, each one built on the last. Start with a picture, end with a skill that checks its own work.",
      },
      /* ⚠ THE EGRESS ROW IS THE ONE THE PLOPSA MORNING PAID FOR: the video
         keys failed until IT allowed network egress in Claude's admin
         settings, mid-session. It belongs on the page before the day. */
      groups: [
        {
          id: "setup",
          label: "Set up once",
          blurb: "Before the first rung",
          items: [
            { id: "app", tag: "App", name: "Claude desktop, in Cowork" },
            { id: "plugin", tag: "Plugin", name: "Your studio plugin, dragged in" },
            { id: "keys", tag: "Keys", name: "The .env with the image and video keys" },
            { id: "it", tag: "IT", name: "Network egress allowed, before the day" },
          ],
          foot: {
            label: "The blocker",
            lines: ["Without network egress the video keys fail. Ask IT a week ahead."],
          },
        },
        {
          id: "ladder",
          label: "The ladder",
          blurb: "One rung at a time",
          items: [
            { id: "image", tag: "Rung one", name: "One image", href: "#rung-image" },
            { id: "brief", tag: "Rung two", name: "A brief", href: "#rung-brief" },
            {
              id: "formats",
              tag: "Rung three",
              name: "Formats and layers",
              href: "#rung-formats",
            },
            { id: "motion", tag: "Rung four", name: "Motion", href: "#rung-motion" },
            { id: "skill", tag: "Rung five", name: "Make it a skill", href: "#rung-skill" },
          ],
          foot: {
            label: "The rule",
            lines: ["Each rung keeps what the one before it proved."],
          },
        },
      ],
    },
    {
      id: "rung-image",
      kind: "anatomy",
      menuLabel: "One image",
      badge: "Rung one · Image",
      head: {
        eyebrow: "12 · One image",
        title: { pre: "Start with", em: "one picture." },
        sub: "A real photograph you already own. Nothing is made from nothing, and that is the first rule.",
      },
      rows: [
        {
          id: "drop",
          label: "Drop in",
          body: "One photograph of your own: a place, a product, a room.",
        },
        {
          id: "ask",
          label: "Ask",
          body: "Make this work as a vertical story, and keep everything in it real.",
        },
        {
          id: "get",
          label: "You get",
          body: "The same scene, re-framed, with the edges it had to invent marked.",
        },
        {
          id: "check",
          label: "The check",
          body: "Nothing in it the photograph does not show. An invented forest fails.",
        },
      ],
    },
    {
      id: "rung-brief",
      kind: "anatomy",
      menuLabel: "A brief",
      badge: "Rung two · Brief",
      head: {
        eyebrow: "13 · A brief",
        title: { pre: "Let it write", em: "the brief." },
        sub: "The picture answers a brief nobody wrote down. Write it down, and the brief becomes the thing you keep.",
      },
      rows: [
        {
          id: "drop",
          label: "Drop in",
          body: "The picture from rung one, and one line on who it is for.",
        },
        {
          id: "ask",
          label: "Ask",
          body: "Write the brief this picture answers, then make three more from it.",
        },
        {
          id: "get",
          label: "You get",
          body: "A brief in your own format, and three pictures made from it, not from you.",
        },
        {
          id: "check",
          label: "The check",
          body: "Would your team sign the brief before seeing a single picture?",
        },
      ],
    },
    {
      id: "rung-formats",
      kind: "anatomy",
      menuLabel: "Formats",
      badge: "Rung three · Formats",
      head: {
        eyebrow: "14 · Formats and layers",
        title: { pre: "One visual,", em: "every format." },
        sub: "The slow part of the week is rarely the picture. It is the same picture again, in every size, with the logo in the right place.",
      },
      rows: [
        {
          id: "drop",
          label: "Drop in",
          body: "One layered file you already made: a PSD or a Figma frame.",
        },
        {
          id: "ask",
          label: "Ask",
          body: "Learn how this is built, then make it in every format we publish.",
        },
        {
          id: "get",
          label: "You get",
          body: "Each format as an editable file, its layers named, nothing flattened.",
        },
        {
          id: "check",
          label: "The check",
          body: "Logo, colour and call to action placed by your rule, never by eye.",
        },
      ],
    },
    {
      id: "rung-motion",
      kind: "anatomy",
      menuLabel: "Motion",
      badge: "Rung four · Motion",
      head: {
        eyebrow: "15 · Motion",
        title: { pre: "From rushes", em: "to an edit." },
        sub: "It watches a video the way it reads a file: the cuts, the rhythm, the sound. Then it builds the timeline itself.",
      },
      rows: [
        {
          id: "drop",
          label: "Drop in",
          body: "Raw footage, or a finished spot you like as a reference.",
        },
        {
          id: "ask",
          label: "Ask",
          body: "Watch this, cut a short spot from it, and put our text on it.",
        },
        {
          id: "get",
          label: "You get",
          body: "A timeline it built itself, text cued to the frame, no editor opened.",
        },
        {
          id: "check",
          label: "The check",
          body: "The cut keeps the reference's rhythm, and the text stays on brand.",
        },
      ],
    },
    {
      id: "rung-skill",
      kind: "anatomy",
      menuLabel: "Make it a skill",
      badge: "Rung five · Skill",
      head: {
        eyebrow: "16 · Make it a skill",
        title: { pre: "Now make it", em: "a skill." },
        sub: "Every note you gave today was a rule nobody had written down. This is where it gets written down.",
      },
      rows: [
        {
          id: "drop",
          label: "Drop in",
          body: "Every note you gave on the four rungs before this one.",
        },
        {
          id: "ask",
          label: "Ask",
          body: "Turn my notes into checks, update the skill, and run it again.",
        },
        {
          id: "get",
          label: "You get",
          body: "A skill with its own evals, checking the next picture before you do.",
        },
        {
          id: "check",
          label: "The check",
          body: "The second run needs fewer notes than the first. That is the point.",
        },
      ],
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "What follows",
      head: {
        eyebrow: "17 · What follows",
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
