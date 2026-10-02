import type { ArcDef } from "../types";

import { FRONTIER_CURVE } from "./shared/frontierCurve";
import { WRITING_BENCH } from "./shared/writingBench";
import { TOOL_AND_COLLABORATOR } from "./shared/toolAndCollaborator";

/**
 * The Thoughtform workshop, as an arc: the ARCHETYPE the practice runs, and
 * the page every client fork starts from.
 *
 * ⚠ IT HAS NO `client`, AND THAT IS THE POINT (ADR-052's own reading of the
 * field: absent ⇒ a Thoughtform format, a shape the practice sells rather
 * than a piece of work done for one company). `/arcs/plopsa-workshop` and
 * `/arcs/suri-workshop` are engagements; this is what they are cuts of.
 *
 * One idea per viewport, five chapters on the house arc — today, the proof,
 * navigate, encode, build. Plopsa's team had already met the practice, so
 * their page opens on the frame; a room that has not needs chapter zero,
 * which is why the archetype carries it.
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
 * ⚠ THE SITUATION IS THE MOIRA WORKSHOP'S SECOND SESSION (ADR-136, owner
 * 2026-09-29: the archetype's "from prompt to tool to agent" was outdated;
 * "we take that from the Moira one"). After the proof, the page runs her
 * opening in her order: a prompt, a tool, an agent; each release finishes
 * longer work; it is hard to steer (the spectrum); we measure it like
 * software (the resource); the real question; one piece of work with six
 * questions around it (the board); the two plates the team writes (the
 * leverage); person or agent; why it needs the checks (the horizon); and
 * what the market is paying for (the signal, which replaces the callout that
 * said its left column in prose). The self-sufficiency pair, the bench and
 * the practicals stand where they were. The proof chapter is untouched.
 *
 * ⚠ THE BOARD'S WORK IS THE PRACTICE'S OWN, like the bench's. The base every
 * fork starts from may not carry another client's evidence (ADR-131), so
 * the six questions are answered for the house's own writing skill — the
 * same one the bench runs — and a fork swaps the work.
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
      { id: "start", label: "The workshop", href: "#the-workshop", primary: true },
      { id: "arc", label: "Three ways", href: "#three-ways" },
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
    /* ── The opening slide (ADR-137) ─────────────────────────────────────
       The page opens on the corridor now (hero, About, the Arc, the proof
       stack), so the arc's own Today readout, proof head and four proof cards
       are gone: the homepage's pile is the proof, by reference. This beat is
       the hand-over from that opening into the workshop, and it is the Moira
       workshop template's session hero, ported: the promise on the left, the
       board in miniature on the right, the plates a team writes lit. */
    {
      id: "the-workshop",
      kind: "hero-board",
      menuLabel: "The workshop",
      menuPrimary: true,
      head: {
        eyebrow: "01 · The workshop",
        title: { pre: "Hand it to an agent.", em: "Trust what comes back." },
        sub: "Three ways to work with AI: ask it, have it build you a tool, or give it the goal and let it run. This workshop is about the third, and it ends with the checks your team writes so it can.",
      },
      lit: [
        ["right", 0],
        ["right", 1],
      ],
    },

    /* ── Chapter three · NAVIGATE ────────────────────────────────────────
       The situation, in the Moira session's order (ADR-136): where the room
       already is, why it gets harder from here, and what the thing is. */
    {
      id: "three-ways",
      kind: "stages",
      menuLabel: "Three ways",
      menuPrimary: true,
      head: {
        eyebrow: "02 · A prompt, a tool, an agent",
        title: { pre: "A prompt, a tool, an agent.", em: "Each runs longer without you." },
        sub: "Ask it and check every answer. Have it build a tool, and you still run it. Give it the goal and the checks, and it runs for hours while you do other work.",
      },
      axes: { time: "How long, without you", work: "How much of the work" },
      ends: { near: "minutes", far: "half a day", top: "all of it" },
      /* The studio's own line of work, one tool across three stages: a
         prompt helper, then a checker, then packaging end to end. A picture
         of the argument, not a measurement. */
      own: "Loop's own",
      stages: [
        {
          id: "prompt",
          label: "A prompt",
          name: "Ask, and check the answer",
          body: "One question, one answer. You do the rest, and you check every one.",
          example: "One image, one prompt at a time",
        },
        {
          id: "tool",
          label: "A tool",
          name: "It builds, you operate",
          body: "It writes the tool. You still press every button, and check the output.",
          example: "An image tool with a checker inside it",
        },
        {
          id: "agent",
          label: "An agent",
          name: "It runs the loop",
          body: "You set the goal and the checks. It runs, checks, retries, and asks.",
          example: "Packaging, from brief to render",
          lit: true,
        },
      ],
    },
    {
      id: "the-curve",
      kind: "curve",
      menuLabel: "The curve",
      head: {
        eyebrow: "03 · The curve",
        title: { pre: "Each release finishes longer work,", em: "and costs more per token." },
        sub: "Each release makes fewer small mistakes, so it gets further on long and difficult work. And every model has a second dial: how hard it thinks.",
      },
      /* The record is shared with the course's class-one deck
         (`shared/frontierCurve.ts`); this page authors only the head. */
      ...FRONTIER_CURVE,
    },
    {
      id: "between",
      kind: "spectrum",
      menuLabel: "Hard to steer",
      head: {
        eyebrow: "04 · Hard to steer",
        title: {
          pre: "But it is hard to steer,",
          em: "because it is a tool and a collaborator at once.",
        },
        sub: "Sometimes you tell it exactly what to do. Sometimes you explain what you are after and let it work it out. Nothing we worked with before was both.",
      },
      ...TOOL_AND_COLLABORATOR,
    },
    {
      id: "resource",
      kind: "resource",
      menuLabel: "A resource",
      head: {
        eyebrow: "05 · A strange resource",
        title: { pre: "We work with an intelligence,", em: "but measure it like software." },
        sub: "We count it in tokens, the way we count software in seats. Tokens say how much it read and wrote, and nothing about whether the work was any good.",
      },
      columns: ["Resource", "Counted in", "What the count tells you"],
      rows: [
        { id: "people", resource: "People", unit: "Hours", tells: "How long the work took" },
        { id: "money", resource: "Money", unit: "Euros", tells: "What the work cost" },
        { id: "software", resource: "Software", unit: "Seats", tells: "Who can use it" },
        {
          id: "intelligence",
          resource: "Intelligence",
          unit: "Tokens",
          tells: "How much the model read and wrote",
          misses: "Nothing about what it was worth, or whether it worked",
          open: true,
        },
      ],
    },
    {
      /* A beat: no picture, and twenty seconds of silence in the room. */
      id: "real-question",
      kind: "interstitial",
      variant: "question",
      eyebrow: "06 · The real question",
      line: {
        pre: "The real question is:",
        em: "how should intelligence take part in the work?",
      },
      subline:
        "Which model, how many tokens, whether it was any good: every question a team asks about it sits downstream of this one.",
    },

    /* ── Chapter four · ENCODE ───────────────────────────────────────────
       The gap is not capability. It is context, and what good looks like. */
    {
      /* ⚠ THE WORK IS THE PRACTICE'S OWN, like the bench's below: the base
         every fork starts from may not carry another client's evidence
         (ADR-131). A fork swaps the work and keeps the six questions. */
      id: "configuration",
      kind: "questions",
      menuLabel: "The configuration",
      head: {
        eyebrow: "07 · The configuration",
        title: { pre: "One piece of work.", em: "Six questions around it." },
        sub: "The answer is written down, per piece of work. Here it is for one of mine. Today is about the two your team writes.",
      },
      work: {
        label: "The work",
        name: "A post in my voice",
        line: "One post, written from a brain dump and read against the house's own rules before it goes out.",
        bar: {
          label: "Good looks like",
          line: "Reads like me, says one thing, and claims nothing nobody measured.",
        },
      },
      left: [
        {
          id: "model",
          title: "The model",
          question: "What runs it",
          answer: "The everyday lane",
        },
        {
          id: "context",
          title: "The context",
          question: "What it knows",
          answer: "The voice, as a skill",
          lit: true,
        },
        {
          id: "evals",
          title: "The evaluations",
          question: "How we know it is good",
          answer: "Posts that went out, and posts sent back",
          lit: true,
        },
      ],
      right: [
        {
          id: "data",
          title: "The data",
          question: "What it can reach",
          answer: "My own posts, and the phrasebook",
        },
        {
          id: "interface",
          title: "The interface",
          question: "Where you meet it",
          answer: "In Claude, before it is posted",
        },
        {
          id: "owner",
          title: "The owner",
          question: "Who answers for it",
          answer: "I do. It drafts, I post",
          human: true,
        },
      ],
      tag: "You write this",
      alt: "One piece of work, a post in the founder's voice, with six questions wired around it: the context and the evaluations lit, the owner in green",
    },
    {
      id: "leverage",
      kind: "cards",
      menuLabel: "Your two plates",
      columns: 2,
      /* ⚠ NOT "leverage" (Moira's word for this beat): it is on the voice
         skill's post-2022 list and the grader fails the page on it. */
      head: {
        eyebrow: "08 · The two you write",
        title: { pre: "The two plates", em: "only your team can write." },
        sub: "The model, the data and the tools are set up across the company. What it knows and what good looks like can only come from the team that does the work: owned by the team, written once, and it outlives the model.",
      },
      /* ⚠ NO TIPS STRIP, AND ONE-LINE BODIES: with Moira's three chips under
         the two cards the beat ran past one screen at 1280×720 on the
         class-one deck, the room's own frame. The chips' three claims are the
         sub's last sentence now. */
      cards: [
        {
          id: "context",
          kicker: "The context",
          title: "What it knows",
          body: "How this team works, written down so a model can read it.",
          metaRows: [
            { label: "Rules", value: "What the team always checks" },
            { label: "Examples", value: "Good work, and work sent back" },
            { label: "Sources", value: "Where to look it up" },
          ],
        },
        {
          id: "evals",
          kicker: "The evaluations",
          title: "How we know it is good",
          body: "Real inputs, the result each must produce, and where it stops.",
          metaRows: [
            { label: "Cases", value: "Real inputs, with the expected result" },
            { label: "Checks", value: "What must be true of every output" },
            { label: "Gates", value: "Where it stops and asks a person" },
          ],
        },
      ],
    },
    {
      /* The turn, as a beat. The horizon is its proof. */
      id: "person-or-agent",
      kind: "interstitial",
      variant: "question",
      eyebrow: "09 · The turn",
      line: { pre: "Is the workflow for a person,", em: "or for an agent?" },
      subline:
        "A workflow for a person has a person check in at every step. An agent that runs for hours needs the context and the evals instead, and finds the steps itself.",
    },
    {
      id: "the-horizon",
      kind: "horizon",
      menuLabel: "The horizon",
      menuPrimary: true,
      head: {
        eyebrow: "10 · Why it needs checks",
        title: { pre: "It can only work for hours", em: "when it has the context and the evals." },
        sub: "A tool you operate needs you at every step. An agent on a long task checks its work against the evals, retries when it slips, and stops to ask when it should.",
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
      note: "Small slips compound. One slip in twenty every ten minutes leaves a four-hour task about a three-in-ten chance of ending clean. Checks that catch a slip early keep it going.",
    },
    {
      /* What the market is paying for, on the board's two written plates.
         Four public sources, each dated on its card. Companies and
         publications are named; no person is. It replaces the callout that
         said the left column in prose. */
      id: "signal",
      kind: "signal",
      menuLabel: "The market",
      head: {
        eyebrow: "11 · Where the money goes",
        title: {
          pre: "The labs just bet billions",
          em: "on the two things only your team can write.",
        },
        sub: "Both labs are paying to put engineers inside companies to write their context down. The teams that write evals are the ones pulling ahead.",
      },
      columns: [
        {
          id: "context",
          plate: "context",
          label: "The context",
          line: "The labs are paying to embed engineers who write a company's way of working down.",
          cards: [
            {
              id: "openai",
              mark: "OpenAI",
              corner: "$10B",
              tag: "Joint venture",
              kicker: "Launch · May 2026",
              title: "OpenAI launches the Deployment Company.",
              dek: [
                { text: "$4B from 19 investment partners", strong: true },
                {
                  text: " at a $10B valuation, and about 150 forward deployed engineers from day one, to build AI into how companies work.",
                },
              ],
              source: "openai.com",
              date: "11 May 2026",
              href: "https://openai.com/index/openai-launches-the-deployment-company/",
            },
            {
              id: "anthropic",
              mark: "Anthropic",
              corner: "$1.5B",
              tag: "Joint venture",
              kicker: "Launch · May 2026",
              title: "Anthropic's $1.5B answer.",
              dek: [
                { text: "With Blackstone, Hellman & Friedman and Goldman Sachs: " },
                { text: "engineers placed inside mid-sized companies", strong: true },
                { text: " to bring Claude into their most important work." },
              ],
              source: "CNBC",
              date: "4 May 2026",
              href: "https://www.cnbc.com/2026/05/04/anthropic-goldman-blackstone-ai-venture.html",
            },
          ],
        },
        {
          id: "evals",
          plate: "evals",
          label: "The evaluations",
          line: "The teams that write down what good looks like are pulling ahead.",
          cards: [
            {
              id: "lennys",
              mark: "Lenny's",
              corner: "35→83%",
              tag: "Hiring · Results",
              kicker: "Newsletter · Sep 2026",
              title: "Nearly half of 25 product job openings ask for evals.",
              dek: [
                { text: "Ramp's receipt matching: " },
                { text: "35% to 83% precision", strong: true },
                { text: ". Shopify's workflow builder: " },
                { text: "2.2× faster, 68% cheaper", strong: true },
                { text: ". Cursor's routing: " },
                { text: "41% lower cost.", strong: true },
              ],
              source: "Lenny's Newsletter",
              date: "22 Sep 2026",
              href: "https://www.lennysnewsletter.com/p/advanced-evals-how-to-find-and-fix",
            },
            {
              id: "claude",
              mark: "Claude",
              corner: "90.5%",
              tag: "Engineering blog",
              kicker: "Engineering · Sep 2026",
              title: "Anthropic automates designing the evals.",
              dek: [
                {
                  text: "Claude interviews you, builds the tests and the grader, and pauses for your approval. On support tickets held back from tuning: ",
                },
                { text: "78.6% to 90.5%", strong: true },
                { text: ", at about a fifth of the cost." },
              ],
              source: "claude.dev",
              date: "28 Sep 2026",
              href: "https://claude.dev/blog/automating-eval-design-and-hillclimbing/",
            },
          ],
        },
      ],
      caption:
        "Four public sources from May to September 2026, dated on each card. The figures are theirs, not Loop's, and none of it is a study.",
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
        eyebrow: "12 · What you build",
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
        eyebrow: "13 · Who does what",
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
        eyebrow: "14 · What good looks like",
        title: { pre: "A check", em: "your team wrote." },
        sub: "A Skill is how you work, written down. An eval is what good looks like, so a model can check itself. Here is ours, running.",
      },
      example: WRITING_BENCH,
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
        eyebrow: "15 · Hands on",
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
        eyebrow: "16 · One image",
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
        eyebrow: "17 · A brief",
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
        eyebrow: "18 · Formats and layers",
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
        eyebrow: "19 · Motion",
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
        eyebrow: "20 · Make it a skill",
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
        eyebrow: "21 · What follows",
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
