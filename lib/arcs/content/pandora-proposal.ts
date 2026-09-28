import type { ArcDef } from "../types";

/**
 * Pandora, the proposal, as an arc (ADR-098; the fourth cut of the format,
 * ADR-128).
 *
 * Written from the 25 September call with the head of Pandora's Global Brand
 * Creative Studio in Copenhagen and the same-day debrief with Rob. The ask is
 * not creative production: it is the operational work around the creative
 * (naming, uploads, the schedule, the recaps, resourcing) and the review
 * (retouching QA by eye), carried today by seven or eight freelancers.
 *
 * ⚠ IT IS ADDRESSED TO ONE READER, so it may print the fee, the names and
 * the dates, and it is therefore deliberately OUTSIDE `ENVELOPE_ARCS`,
 * whose job is a page forwarded to strangers.
 *
 * ⚠ THE PROOF IS LOOP'S, BY REFERENCE, AND IN THE HOMEPAGE'S OWN REGISTER
 * (ADR-126): four beats in the pile's order, each headed by what we DO rather
 * than what we did, so the page reads as the practice and not as a portfolio.
 * The films, the operations tool, the sheets and the map resolve the
 * casefile's records; nothing about Loop is retyped here.
 *
 * ⚠ THE STUDIO TODAY IS A CIRCUIT SINCE ADR-133 (owner, 2026-09-28): one
 * configuration drawing that travels through three beats of one pinned
 * scene, on the Moira board's six questions. It replaced the board here (the
 * board still draws Trinny) and letters NO digit. The configuration's picker
 * stays out: it is the instrument the owner replaced on Trinny.
 *
 * ⚠ EVERY FEE DERIVES FROM ONE CONSTANT (`DAY_RATE`), the same number the
 * deck's generator carries; change it in both in one commit.
 *
 * ⚠ THE FOUR CARDS SPEAK IN THE PAST TENSE HERE (owner, 2026-09-28). The
 * homepage says the arc lines as the practice's offer ("We push the
 * frontiers of AI creative"); this page looks back at what was done at Loop,
 * so each `proof-card` carries its own `title` ("We pushed …"). The record's
 * lines are untouched: they are the Dublin keynote's, word for word.
 *
 * ⚠ THE SPINE SINCE ADR-133 (2026-09-28): Loop (part one) · THE RETURN (a
 * `crew`: Loop's record drawn beside the four numbers we count and never
 * promise) · the turn · THE CIRCUIT (the review recap today and configured →
 * the team owns it → one layer, every workflow: one pinned scene) · THE GOAL
 * (a `horizon`, the approach in a CMO's words, before the plan) · the plan ·
 * the checker ON PANDORA'S OWN PICTURE · who is in the room · what you keep ·
 * the fee · the four numbers · who does it · next steps.
 */

const DAY_RATE = 1500;
const DAYS_A_MONTH = 20;
const MONTHS = 3;
const eur = (n: number) => `€${n.toLocaleString("en-GB")}`;
const FEE_MONTH = eur(DAY_RATE * DAYS_A_MONTH);
const FEE_TOTAL = eur(DAY_RATE * DAYS_A_MONTH * MONTHS);

export const PANDORA_PROPOSAL_ARC: ArcDef = {
  slug: "pandora-proposal",
  format: "proposal",
  client: "pandora",
  // A proposal is out until the client answers it (ADR-114).
  status: "proposed",
  // Filed the day after the call; the overview's monitor plots it (ADR-118).
  date: "2026-09-26",
  theme: "light",
  cardTitle: "Pandora · the proposal",
  cardLede:
    "Three months inside the Global Brand Creative Studio: the operational work first, then the review, then the agents that run both.",
  cardImage: { src: "/images/services/embedded.webp", alt: "" },
  hero: {
    eyebrow: "Proposal · Pandora · September 2026",
    title: { pre: "We embed", em: "until it runs without us." },
    lede: "Three years of building AI capability inside Loop's creative team, turned into three months for Pandora's studio.",
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    plate: "gateway",
    curtain: true,
    actions: [{ id: "read", label: "The three months", href: "#phases", primary: true }],
  },
  meta: {
    title: "Pandora · proposal — Thoughtform",
    description:
      "Three months inside the Global Brand Creative Studio: the operational work first, then the review, then the agents that run both.",
  },
  sections: [
    {
      /* PART ONE IS SURI'S OPENING (owner, 2026-09-28: the "four things we
         do" head and its paragraph were "a regression from the core one").
         The callout is `suri-proposal`'s own line; its subline drops Suri's
         "in the order it happened", because the cards below follow the
         pile's order, which is not the calendar's. */
      id: "in-practice",
      kind: "interstitial",
      variant: "callout",
      menuLabel: "In practice",
      menuPrimary: true,
      eyebrow: "Part one · Loop, 2024 to now",
      line: {
        pre: "In 2024, Loop's executive team decided the company would be",
        em: "AI-first.",
      },
      subline:
        "Creative operations was the biggest immediate win, so it became the first focus. What follows is what that decision produced.",
    },
    /* ⚠ THE FOUR PROOF BEATS ARE THE HOMEPAGE'S OWN FOLDER CARDS, AT REST
       (ADR-128 Phase B): one Loop project a beat, in the pile's order, the
       card lettering the arc line as its title and Loop's own claims beneath.
       No head on any of them — the card is the head — and the Part one
       callout above says why they are here. Phase A drew the same four as
       `films` · a head over the `heimdall` dossier · `sheets` ·
       `intelligence`; the record is the same, the housing is the one the
       owner is "really happy with". */
    {
      id: "practice-frontier",
      kind: "proof-card",
      menuLabel: "Films",
      track: "atl-films",
      title: "We pushed the frontiers of AI creative",
    },
    {
      id: "practice-tools",
      kind: "proof-card",
      menuLabel: "Tools",
      track: "tooling",
      title: "We built the tools the work needed",
    },
    {
      id: "practice-studio",
      kind: "proof-card",
      menuLabel: "Studio",
      track: "studio",
      title: "We made the creative team self-sufficient",
    },
    {
      id: "practice-layer",
      kind: "proof-card",
      menuLabel: "The layer",
      track: "ai-transformation",
      title: "We built the layer the agents run on",
    },
    {
      /* THE RETURN, DRAWN (ADR-133, owner 2026-09-28, after Rob's read: the
         marketing director will ask about the impact). "It's not about exact
         numbers ... it should be a visual thing they can see", and the
         reasoning is Loop's own team shape. It sits WITH the proof it comes
         from, before the turn to Pandora (owner: "should be after the
         proof"). Left, Loop's RECORD, the printable figures only, each output
         drawn as the quantity it is; right, the same shape in the studio with
         the four measures we count in week one, FRAMED AND EMPTY. No Pandora
         estimate, no calculator. */
      id: "return",
      kind: "crew",
      menuLabel: "The return",
      head: {
        eyebrow: "Loop · what it returned",
        title: { pre: "What it returned", em: "at Loop." },
        sub: "Left, four things the same work did at Loop, from the record: a few people, one configuration each, and what came out. Right, the same shape in Pandora's studio, with the four numbers we count in week one and read beside every month's fee. We promise the counting; the numbers are yours to read.",
      },
      record: {
        label: "At Loop, from the record",
        rows: [
          {
            id: "assets",
            who: "Two designers and a copywriter",
            people: 3,
            config: "The studio's Skills",
            output: { kind: "field", count: 700 },
            value: "About 700",
            unit: "paid-social assets a month",
          },
          {
            id: "copy",
            who: "The PMs",
            people: 2,
            config: "The briefing sync",
            output: { kind: "funnel", lines: 12 },
            value: "One copy editor",
            unit: "checks what they pre-fill",
          },
          {
            id: "review",
            who: "The head of design",
            people: 1,
            config: "The review agent",
            output: { kind: "tenfold" },
            value: "About ten times",
            unit: "less review by hand",
          },
          {
            id: "planning",
            who: "A program manager",
            people: 1,
            config: "The planning tool",
            output: { kind: "month" },
            value: "A week a month",
            unit: "back from resource planning",
          },
        ],
      },
      plan: {
        label: "In the studio, counted from week one",
        rows: [
          {
            id: "hours",
            who: "The PMs and producers",
            config: "Filing, recap, schedule",
            measure: "Operational hours a week",
            source: "Read from their calendars",
          },
          {
            id: "days",
            who: "The freelancers",
            config: "The same, on a schedule",
            measure: "Freelance days on operations",
            source: "Read from the bookings",
          },
          {
            id: "cycle",
            who: "The producers",
            config: "The retouch check",
            measure: "A batch, in to verdict",
            source: "How long a batch waits",
          },
          {
            id: "rounds",
            who: "The retouchers",
            config: "The retouch check",
            measure: "Rounds per asset",
            source: "How often one goes back",
          },
        ],
      },
      alt: "The business case as two halves. At Loop, from the record: two designers and a copywriter making about 700 paid-social assets a month with the studio's Skills; the PMs pre-filling copy through the briefing sync for one copy editor to check; the head of design's review agent taking about ten times less review by hand; a program manager's planning tool giving back a week a month. In the studio, the same shape with four measures counted from week one and left empty: operational hours a week, freelance days on operations, a retouch batch from in to verdict, and rounds per asset.",
    },
    {
      id: "turn",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "Part two · Pandora",
      line: { pre: "Pandora does not need", em: "three years of this." },
      subline:
        "The products, the brand and the producers' eye are already Pandora's. We bring the order to do it in, starting with the operational work around the creative.",
    },
    {
      /* THE CIRCUIT (ADR-133, owner 2026-09-28, after Rob's read): ONE
         configuration drawing that TRAVELS through three beats of one pinned
         scene, on the Moira workshop's board (one piece of work, six
         questions around it; owner: "I like the simplicity of this") in the
         proof's R4 material (the reading he called "super clear"). Beat a:
         the recap after a review as it is done today, a lone plate, beside
         the same work configured. Beat b: the team owns it (the owner and
         what the team writes come forward; the rest recedes). Beat c: every
         workflow as its own small circuit, all wired to the same written
         context and checks, and the one socket outside the studio, dashed.
         ⚠ WRITTEN FOR A CMO WHO DOES NOT KNOW AI: every plate is a question a
         person would ask, answered in plain words; no lane meter, no model
         family, no digit. ⚠ The first cut of this kind was rejected the same
         evening as too dense and its "today" column as depressing; this one
         draws today as the work alone, neutral, and connected to nothing. */
      id: "today",
      kind: "circuit",
      menuLabel: "Pandora today",
      menuPrimary: true,
      head: {
        eyebrow: "Pandora · the review recap",
        title: { pre: "Today,", em: "and configured." },
        sub: "Left, the recap after a creative review as it happens today: someone types it up. Right, the same recap set up once, with six things written down around it: who answers for it, what runs it, what it knows, how it is checked, what it can reach and where the team meets it. Then it runs.",
      },
      work: {
        id: "recap",
        name: "The review recap",
        good: "Every note in, nothing made up, each next step owned",
        today: "Typed up after every review by whoever ran it, from their notes",
      },
      questions: [
        {
          id: "owner",
          key: "The owner",
          question: "Who answers for it",
          answer: "The PM who ran the review",
        },
        {
          id: "model",
          key: "The model",
          question: "What runs it",
          answer: "Claude, on your account",
        },
        {
          id: "context",
          key: "The context",
          question: "What it knows",
          answer: "The notes and the brief",
        },
        {
          id: "evals",
          key: "The evaluations",
          question: "How we know it is good",
          answer: "Checked on past recaps",
        },
        {
          id: "reach",
          key: "The reach",
          question: "What it can reach",
          answer: "Figma comments and Asana",
        },
        {
          id: "interface",
          key: "The interface",
          question: "Where you meet it",
          answer: "A draft in your inbox",
        },
      ],
      tag: "Written by the team",
      people: {
        head: {
          eyebrow: "Pandora · the team",
          title: { pre: "Your team", em: "owns it." },
          sub: "In the workshops the PMs and producers write down how the work is done: what a recap contains, what a good retouch looks like, how a file is named. That is what the agent runs on, and it is theirs. So the same people do things they could not before: a recap in minutes, every retouch checked before anyone opens it, the schedule read straight from the review notes. Nobody codes.",
        },
      },
      machine: {
        head: {
          eyebrow: "Pandora · the larger whole",
          title: { pre: "One layer,", em: "every workflow." },
          sub: "Each workflow is its own small circuit, and all of them read the same written context and checks. Written once, owned by the team, kept when the model changes. When Pandora builds a brand system for all of marketing, this is what plugs into it.",
        },
        configs: [
          { id: "filing", name: "Filing and upload" },
          { id: "recap", name: "The review recap" },
          { id: "schedule", name: "The schedule" },
          { id: "resourcing", name: "Resourcing" },
          { id: "retouch", name: "The retouch check" },
          { id: "brief", name: "Brief into Figma" },
        ],
        layer: {
          context: "How the studio works, written down",
          evals: "What a good result looks like",
        },
        chips: ["Written once", "Owned by the team", "Outlives the model"],
        socket: { key: "Later", name: "A brand system for all marketing" },
      },
      alts: {
        a: "The review recap as it is done today, typed up by whoever ran the review, beside the same recap configured: the PM who ran it answers for it, Claude on Pandora's own account runs it, it knows the review notes and the brief, it is checked against past recaps, it reaches Figma comments and Asana, and the team meets it as a draft in their inbox.",
        b: "The same drawing with the owner and the two things the team writes, the context and the evaluations, brought forward on one green bus, and the model, the reach and the interface receded.",
        c: "Six workflows as small circuits in a ring, filing and upload, the review recap, the schedule, resourcing, the retouch check and the brief into Figma, every one wired to the same two shared plates, the context and the evaluations, with a dashed socket below for a brand system for all of marketing.",
      },
    },
    {
      /* THE GOAL (owner, 2026-09-28): the approach from adoption to
         automation, shown BEFORE the plan — "to allow people to steer agents
         that can do longer-horizon tasks … so more time becomes available for
         them". Moira's own figure (ADR-130's `horizon`: a tool you operate,
         checked by a person after every step, above an agent on one long
         task with the model's own gates on it), on a proposal by his ruling.
         ADR-078 U1 asks a drawing here to stand on a record: the note names
         the plan's own two months, which is the record this one stands on.
         The freelancer count is deliberately NOT in this beat (owner). */
      id: "goal",
      kind: "horizon",
      menuLabel: "The goal",
      head: {
        eyebrow: "Pandora · where this goes",
        title: { pre: "From the button", em: "to the goal." },
        sub: "Today a person runs the work step by step and checks every step, so it saves minutes. The goal of the three months is the lower line: the team sets the goal and the checks once, the work runs for hours on its own, and a person looks at the result. That is where the time comes back, and it only works once the team trusts it, which is why the checks come first.",
      },
      axis: { from: "five minutes", to: "half a day" },
      operated: {
        label: "A tool you operate",
        check: "you check",
        steps: 8,
        line: "A person checks after every step, eight times in a row.",
      },
      agent: {
        label: "An agent on a long task",
        start: "You set the goal and the checks",
        gates: [
          { kind: "check", at: 0.27, label: "Checks its own work" },
          { kind: "retry", at: 0.52, label: "Steps back and retries" },
          { kind: "ask", at: 0.77, label: "Stops and asks you" },
        ],
        end: "You judge the result",
      },
      note: "Month one builds the top lane: the filing, the recap and the schedule run with AI and a PM presses the button. Month three moves them to the bottom one: the same workflows on a schedule, the checker on every upload, and the team checking in every hour instead of every five minutes.",
    },
    {
      id: "phases",
      kind: "list-groups",
      menuLabel: "Phases",
      menuPrimary: true,
      layout: "plates",
      head: {
        eyebrow: "Pandora · the three months",
        title: { pre: "The plan,", em: "month by month." },
        sub: "Operations first, because that is where the studio's week goes, then the review, then the same workflows handed to agents and shown to the next team. Each month ends on something that has to work before the next one starts, and you can stop after any of them.",
      },
      groups: [
        {
          id: "m1",
          label: "M1 · about four weeks",
          blurb: "Operations",
          items: [
            {
              id: "m1w1",
              tag: "Week 1 · Copenhagen",
              name: "Watch before building",
              body: "The stack, the PM and producer meetings, the freelancers' week written down as it is. The task force kicks off. Claude access sorted with D&T",
            },
            {
              id: "m1w2",
              tag: "Week 2",
              name: "File naming and the Primo upload, as one Skill",
              body: "Run by a PM pressing the button, on the studio's own Claude account",
            },
            {
              id: "m1w3",
              tag: "Week 3",
              name: "The recap after a creative review, and the schedule",
              body: "Who said what, the decisions, the next steps with dates, written from the review notes. The Asana schedule read from the same notes",
            },
            {
              id: "m1w4",
              tag: "Week 4",
              name: "Resource planning, briefed like a new planner",
              body: "Hub Planner read from Asana. One lunch-and-learn a week throughout, homework in between",
            },
          ],
          foot: {
            label: "Done when",
            lines: [
              "A PM files a campaign into Primo with the right names and writes the review recap without us",
              "Each task-force member has encoded one workflow of their own",
            ],
          },
        },
        {
          id: "m2",
          label: "M2 · about four weeks",
          blurb: "Review",
          items: [
            {
              id: "m2w1",
              tag: "Weeks 1 and 2",
              name: "The retouching checker, with the producers",
              body: "Pandora's own reference shots and the producers' rules in their words, starting with the metal shade and the sparkle. Every retouch graded before a producer opens it",
            },
            {
              id: "m2w2",
              tag: "Week 3",
              name: "The brief into Figma, without the deck",
              body: "The email managers' brief goes into the Figma template as a page the designers work from. Nobody rebuilds a PowerPoint",
            },
            {
              id: "m2w3",
              tag: "Week 4",
              name: "The recap in daily use, the checker on every batch",
              body: "A producer still signs off every batch, and a note they keep repeating becomes a new check",
            },
          ],
          foot: {
            label: "Done when",
            lines: [
              "The producers grade a retouch batch with the checker and change one rule themselves",
              "A brief arrives in Figma without being retyped",
            ],
          },
        },
        {
          id: "m3",
          label: "M3 · about four weeks",
          blurb: "Agents and scaling",
          items: [
            {
              id: "m3w1",
              tag: "Weeks 1 and 2",
              name: "From a button to a schedule",
              body: "The filing, the schedule and the recap run on their own and the team checks in every hour. The checker runs on every upload to Primo",
            },
            {
              id: "m3w2",
              tag: "Week 3",
              name: "Pandora's Skills, written down as files the studio owns",
              body: "Brand nuance, tone, the CMO's read, the review rules. The blueprint for the wider marketing organisation, with Jenny",
            },
            {
              id: "m3w3",
              tag: "Week 4 · Copenhagen",
              name: "Handover: a production week with us out of the room",
              body: "Check-ins at one month and at three",
            },
          ],
          foot: {
            label: "Done when",
            lines: [
              "The team runs the month without us",
              "Kristin has the next three workflows listed",
            ],
          },
        },
      ],
    },
    {
      /* THE BENCH (ADR-128 B2): Moira's Run · Skill · Evals module, ported by
         hand. ON PANDORA'S OWN PICTURE since 2026-09-28 (owner: "a loop
         example is a bit weird"): the rings group from Pandora's own press
         library (`cdn.media.amplience.net/i/pandora/AW23_E_Pandora_Diamonds_
         Rings_Group_19_RGB`, cropped 4:3), with a retouch slip put into it IN
         CODE for the mockup — the two silver rings' mid-tones pushed warm and
         one stone's points of light compressed — and a clean second pass. A
         retouch defect is a curve on the pixels, never a re-render (Armada's
         law: finishing an approved frame is editing it; a second draw is a
         second subject). The Eclipse pair stays on disk, unreferenced. The
         record letters no digit; the chrome is the renderer's
         (`bench/benchChrome.ts`). */
      id: "checker",
      kind: "bench",
      menuLabel: "The checker",
      head: {
        eyebrow: "Pandora · creative review",
        title: { pre: "A checker that reads", em: "like your retoucher." },
        sub: "One check, written down: what it looks at, what it may decide, and the cases it is tested against, shown on one of Pandora's own pictures. The two questions Kristin asked on the call come first: is the metal the right shade, and is the sparkle the right sparkle.",
      },
      example: {
        id: "rings",
        task: "Puts a retouched picture beside the approved shot of the same rings and asks four named questions.",
        checks: [
          {
            id: "metal",
            label: "Metal shade",
            line: "Each ring is its own metal, as in the approved shot: the silver cool and white, the gold warm. No cast.",
          },
          {
            id: "sparkle",
            label: "Sparkle",
            line: "Every stone keeps its points of light. Flattened to a grey disc, or blown into a starburst, it fails.",
          },
          {
            id: "identity",
            label: "Identity",
            line: "The same six rings, in the same places, with the same settings. Nothing added, nothing straightened away.",
          },
          {
            id: "retouch",
            label: "The retouch",
            line: "Cleaned, never redrawn: a prong or a band keeps its edge, a reflection stays where the light put it.",
          },
        ],
        inputs: [
          {
            id: "retouch-a",
            label: "Retouch A",
            brief:
              "The rings group from the shoot, back from retouching for the product page. The approved shot is attached.",
            output: {
              kind: "image",
              image: {
                src: "/arcs/pandora-proposal/ring-retouch-a.webp",
                alt: "A retouched product shot of six Pandora diamond rings on a white ground: the two silver rings have gone warm and one large stone has lost its sparkle.",
                width: 720,
                height: 540,
              },
              regions: [
                { label: "Top silver", check: "metal", left: 34, top: 14, width: 26, height: 22 },
                {
                  label: "The stone",
                  check: "sparkle",
                  left: 56.5,
                  top: 33.5,
                  width: 12,
                  height: 16,
                },
                { label: "Solitaire", check: "metal", left: 31, top: 65, width: 24, height: 19 },
              ],
            },
            results: [
              {
                check: "metal",
                state: "block",
                note: "Both silver rings read warm.",
              },
              {
                check: "sparkle",
                state: "block",
                note: "The large stone has gone to a flat grey disc.",
              },
              {
                check: "identity",
                state: "pass",
                note: "Six rings, the same six, in their places.",
              },
              {
                check: "retouch",
                state: "review",
                note: "Edges hold. A person looks at the prongs.",
              },
            ],
            verdict: {
              state: "block",
              label: "Block, never keep",
              line: "Back to the retoucher with the two failed checks named.",
            },
            actions: [
              "Silver back to cool white on both rings.",
              "The stone's points of light put back.",
            ],
          },
          {
            id: "retouch-b",
            label: "Retouch B",
            brief:
              "The same rings group, second pass from retouching. The approved shot is attached.",
            output: {
              kind: "image",
              image: {
                src: "/arcs/pandora-proposal/ring-retouch-b.webp",
                alt: "A retouched product shot of six Pandora diamond rings on a white ground, the silver cool and every stone sharp.",
                width: 720,
                height: 540,
              },
              regions: [],
            },
            results: [
              {
                check: "metal",
                state: "pass",
                note: "Silver cool, gold warm, each as the approved shot.",
              },
              { check: "sparkle", state: "pass", note: "Every stone keeps its points of light." },
              { check: "identity", state: "pass", note: "The same six rings, in their places." },
              {
                check: "retouch",
                state: "pass",
                note: "The ground lifted a touch. Nothing on a ring redrawn.",
              },
            ],
            verdict: {
              state: "pass",
              label: "Pass, keep",
              line: "Clean on every check. A producer still looks, against the approved shot.",
            },
            actions: ["To the review page. A producer ticks it, or types what is wrong."],
          },
        ],
        skill: {
          folder: "the-retouch-checker/",
          files: [
            {
              name: "SKILL.md",
              line: "What the checker is for, in the producers' words: which pieces, which views, what a pass looks like, what must never pass.",
            },
            {
              name: "references/",
              line: "The rules, the metal and stone references, and the approved shots it compares against.",
              image: {
                src: "/arcs/pandora-proposal/ring-reference.webp",
                alt: "The approved shot: six Pandora diamond rings in gold and silver on a white ground.",
                width: 720,
                height: 540,
              },
            },
            {
              name: "evals/",
              line: "The cases every change to the rules is run against, known-bad retouches among them.",
            },
            {
              name: "scripts/",
              line: "Grade a batch of retouches, build the page the producer ticks.",
            },
          ],
        },
        rules: [
          {
            band: "fixed",
            line: "Each metal keeps its shade against the approved shot: silver cool and white, gold warm. A cast fails it.",
            check: "metal",
          },
          {
            band: "fixed",
            line: "The pieces in the approved shot, and only those. Nothing added, moved or straightened away.",
            check: "identity",
          },
          {
            band: "adapt",
            line: "Sparkle is judged at the size the stone has in the frame; a crop shows more points than a full shot.",
            check: "sparkle",
          },
          {
            band: "adapt",
            line: "Dust, scratches and a stray reflection may go. An edge, a prong or a facet may not be redrawn.",
            check: "retouch",
          },
          {
            band: "free",
            line: "Crop, ground and the direction of the light, once the pieces are right.",
          },
        ],
        cases: [
          {
            id: "pinned",
            label: "Retouch A, kept on file",
            line: "The metal check must fail it. A change to the rules that lets it pass is reverted.",
            expect: "block",
            checks: ["metal", "sparkle"],
          },
          {
            id: "approved",
            label: "Retouch B, kept on file",
            line: "Every check must hold on it. A change that fails it has gone too strict.",
            expect: "pass",
            checks: ["metal", "sparkle", "identity", "retouch"],
          },
          {
            id: "call",
            label: "Kristin's own question",
            quote: "Is the metal the correct shade? Is the sparkle the right sparkle?",
            line: "From the call: where the producers' reviews start, and how the next checks get written. What is said twice becomes a check.",
            checks: ["metal", "sparkle"],
          },
        ],
        record:
          "Pandora's own press picture of its lab-grown diamond rings, with a retouch slip we put into it for this page. The rules are our starting set; in month two the producers' words replace them, on the studio's own reference shots.",
      },
    },
    {
      /* WHO IS IN THE ROOM (owner, 2026-09-28, on the readout version: "too
         condensed … two different fonts … rework this section so it's super
         clear for the stakeholders"). Suri's own grammar for this beat
         (`columns`, a name, one sentence on what the person does, the time it
         costs them as the meta line), which he called the core. What Pandora
         has to provide stays in the next steps, where it is asked for. */
      id: "how-we-work",
      kind: "list-groups",
      menuLabel: "Who is in the room",
      layout: "columns",
      head: {
        eyebrow: "Pandora · how we work",
        title: { pre: "Who is in the room,", em: "and for how long." },
        sub: "We set the loop up in week one and run it beside the team until they run it without us: about five days a month in Copenhagen, the rest in the team's own channels.",
      },
      groups: [
        {
          id: "pandora",
          label: "From Pandora",
          blurb: "Four people and the task force, and what the three months ask of each.",
          items: [
            {
              id: "kristin",
              tag: "Pandora",
              name: "Kristin, head of the studio and the last gate",
              body: "Decides what runs and what stays by hand, signs off the review rules in week one and reads each month's result.",
              meta: "One session a week",
            },
            {
              id: "taskforce",
              tag: "Pandora",
              name: "The AI task force, the first to run it",
              body: "In the sessions from week one. Each member encodes one workflow of their own in month one, then gives the sessions themselves.",
              meta: "Two sessions a week in month one, then one",
            },
            {
              id: "pms",
              tag: "Pandora",
              name: "The PMs and producers, whose week it is",
              body: "In the workflows from week one: the PM who files a campaign into Primo, the producer who grades a retouch batch.",
              meta: "Inside their normal week",
            },
            {
              id: "jenny",
              tag: "Pandora",
              name: "Jenny, on the scope and the business case",
              body: "The kickoff and the scope, then month three's blueprint for the wider marketing organisation.",
              meta: "The kickoff, and month three",
            },
          ],
        },
        {
          id: "thoughtform",
          label: "From Thoughtform",
          blurb: "Vince inside the studio, Rob behind it.",
          items: [
            {
              id: "vince",
              tag: "Thoughtform",
              name: "Vince, on AI and creative technology",
              body: "Five days a month in Copenhagen, the rest remote. Runs the sessions, writes the Skills with the team, then steps back.",
              meta: "About twenty days a month",
            },
            {
              id: "rob",
              tag: "Thoughtform",
              name: "Rob, on the organisation and the business case",
              body: "Mostly in the background; in the room for the kickoff, the business case and the senior conversations.",
              meta: "One session a month",
            },
          ],
        },
      ],
    },
    {
      /* WHAT YOU KEEP IS THE CONFIGURATION (owner, 2026-09-28: "that's
         basically our product, our offering: that configuration … it needs to
         be tied together. Otherwise it's just another section with a random
         block"). So the first column IS the board's right-hand side in words:
         its five facts, in the order the board draws them, as they stand on
         the last day. The second column is what that means once we are out
         of the room. The needs list stays folded into the next steps. */
      id: "what-you-keep",
      kind: "list-groups",
      menuLabel: "What you keep",
      layout: "columns",
      head: {
        eyebrow: "Pandora · what you keep",
        title: { pre: "What you keep is", em: "the configuration." },
        sub: "The right-hand side of the board above, in the studio's own hands: someone whose job it is, the context written down, the workflows on your accounts, inside the tools you already use. That is the product. We build it with the team, and it stays when we leave.",
      },
      groups: [
        {
          id: "parts",
          label: "The configuration, part by part",
          blurb: "The five facts the board draws, as they stand on the last day of month three.",
          items: [
            {
              id: "owner",
              tag: "Who owns it",
              name: "The studio lead, with Kristin's sign-off",
              body: "One person whose job it is: decides what runs, what is checked and what stays by hand.",
            },
            {
              id: "capability",
              tag: "The capability",
              name: "AI capability the studio owns",
              body: "The operational workflows and the retouching checker as Skills the team edits itself, on Pandora's own Claude account.",
            },
            {
              id: "context",
              tag: "The context",
              name: "Rules, examples, sources, loops",
              body: "The naming convention, the review rules in the producers' words, the brand book and the approved shots, and the loop that turns a note said twice into a check.",
            },
            {
              id: "where",
              tag: "Where it runs",
              name: "Figma, Primo and Hub Planner",
              body: "Inside the tools the studio already pays for. Nothing new to license, nothing of ours in the middle.",
            },
            {
              id: "scale",
              tag: "Where it scales",
              name: "Into the rest of marketing",
              body: "The blueprint with Jenny: the same shape written down for the next team, and the task force to bring it there.",
            },
          ],
        },
        {
          id: "after",
          label: "After month three",
          blurb: "What keeps running with us out of the room.",
          items: [
            {
              id: "team",
              tag: "The team",
              name: "Gives its own sessions",
              body: "The task force runs the lunch-and-learns. The handover is a production week the team runs on its own.",
            },
            {
              id: "next",
              tag: "The next workflow",
              name: "Built by the studio",
              body: "Kristin's list of the next three, and the people who built the first ones.",
            },
            {
              id: "nodep",
              tag: "No retainer",
              name: "Nothing stops when we stop answering",
              body: "Check-ins at one month and at three. Model usage on Pandora's own account, billed by the provider.",
            },
          ],
        },
      ],
    },
    {
      id: "pricing",
      kind: "cards",
      menuLabel: "Pricing",
      menuPrimary: true,
      columns: 4,
      ledger: { columns: ["Month", "Days on the work", "Fee"] },
      head: {
        eyebrow: "Pandora · the fee",
        title: { pre: "Priced by the day,", em: "one month at a time." },
        sub: "One day rate whether we work remote or on site, for about twenty days a month, five of them in Copenhagen.",
      },
      cards: [
        {
          id: "fee-m1",
          kicker: "Month one",
          title: FEE_MONTH,
          body: "About twenty days, five of them in Copenhagen. Operations.",
        },
        {
          id: "fee-m2",
          kicker: "Month two",
          title: FEE_MONTH,
          body: "About twenty days, five on site. Review.",
        },
        {
          id: "fee-m3",
          kicker: "Month three",
          title: FEE_MONTH,
          body: "About twenty days, five on site. Agents and scaling.",
        },
        {
          id: "fee-total",
          kicker: "Three months",
          title: `About ${FEE_TOTAL}`,
          body: `Sixty days at ${eur(DAY_RATE)} a day, invoiced monthly on the days worked.`,
        },
      ],
      footnote:
        "If you stop after month one, the studio keeps the four operational workflows and the Skills behind them.",
      tips: [
        {
          id: "rate",
          tag: "Rate",
          body: `${eur(DAY_RATE)} a day. Invoiced at each month end on the days actually worked, so a lighter month costs less.`,
        },
        {
          id: "renewal",
          tag: "Renewal",
          body: "Month by month. Either side stops at a month end; nothing beyond the current month is committed.",
        },
        {
          id: "expenses",
          tag: "Expenses",
          body: "Travel and stay at cost, Antwerp to Copenhagen. Model usage on Pandora's own Claude account, billed by the provider. Everything built belongs to Pandora.",
        },
      ],
    },
    {
      /* THE BUSINESS CASE WITHOUT A NUMBER (owner, 2026-09-28: the appendix
         "feels a bit random … I don't want to promise any absolute numbers").
         Kristin asked on the call for something Jenny can take to the business
         case, so this is the counting, promised, and no figure: four numbers
         read from Pandora's own systems, beside the fee. The Loop figures are
         on the proof cards' own registers and are not repeated here. */
      id: "measures",
      kind: "cards",
      menuLabel: "How you will know",
      columns: 4,
      head: {
        eyebrow: "Pandora · the business case",
        title: { pre: "Counted in week one,", em: "read every month." },
        sub: "Four numbers from Pandora's own bookings, files and calendars, set beside that month's fee. We promise the counting; the numbers are yours to read.",
      },
      cards: [
        {
          id: "hours",
          kicker: "Hours",
          title: "Operational hours a week",
          body: "What the PMs and producers spend on naming, uploads, the schedule, the recaps and resourcing.",
        },
        {
          id: "days",
          kicker: "Days",
          title: "Freelance days on operational work",
          body: "Read from the bookings, month by month, beside the month's fee.",
        },
        {
          id: "cycle",
          kicker: "Cycle",
          title: "A retouch batch, from in to verdict",
          body: "How long a batch waits for a producer today, and how long once the checker has read it first.",
        },
        {
          id: "rounds",
          kicker: "Rounds",
          title: "Retouch rounds per asset",
          body: "How often an asset goes back before a producer approves it.",
        },
      ],
    },
    {
      id: "people",
      kind: "cards",
      menuLabel: "Who does it",
      columns: 2,
      head: {
        eyebrow: "Thoughtform · who shows up",
        title: { pre: "Vince and Rob,", em: "who did this at Loop." },
        sub: "Both of us worked at Loop: Vince inside the creative team, Rob on the executive team.",
      },
      cards: [
        {
          id: "vince",
          kicker: "AI and creative technology",
          title: "Vince Buyssens",
          body: "Built Loop's AI capability inside its creative team over three years, then led its company-wide adoption of Claude. Runs the sessions and writes the Skills with the team. About five days a month in Copenhagen.",
        },
        {
          id: "rob",
          kicker: "Commercial and organisation",
          title: "Rob Weston",
          body: "Ran the Commercial and Marketing teams at Loop and sat on the executive team that decided, in 2024, to make Loop AI-first. Works on the organisation, the process, the business case and the senior conversations, and joins in the room when that helps.",
        },
      ],
    },
    {
      id: "next-steps",
      kind: "cards",
      menuLabel: "Next steps",
      menuPrimary: true,
      columns: 3,
      head: {
        eyebrow: "Pandora · from here",
        title: { pre: "Next", em: "steps." },
        sub: "Three things to settle before the first week.",
      },
      cards: [
        {
          id: "week",
          n: "01",
          title: "Confirm the first week in Copenhagen",
          body: "Five days of watching before anything is built, planned around the producers' calendar. Before it: last quarter's review recaps, a handful of retouched assets with the producers' verdicts, the brand book and the naming convention.",
        },
        {
          id: "claude",
          n: "02",
          title: "Claude access, in Pandora's name",
          body: "The enterprise conversation with D&T, with Jenny's support. Figma, Primo, Asana and Hub Planner opened in Pandora's name too, so nothing needs migrating later.",
        },
        {
          id: "scope",
          n: "03",
          title: "Settle the scope with Jenny",
          body: "The studio alone, or the wider marketing organisation from month three. The plan is the same either way; only the blueprint gets bigger.",
        },
      ],
    },
    {
      id: "close",
      kind: "close",
      head: {
        eyebrow: "Pandora",
        title: { pre: "Talk it", em: "through." },
        sub: "Questions on any of it, or a date for the first week in Copenhagen.",
      },
      actions: [
        {
          id: "vince",
          label: "Vince Buyssens",
          href: "mailto:vince@thoughtform.co",
          primary: true,
        },
        { id: "rob", label: "Rob Weston", href: "mailto:weston.rob@gmail.com" },
      ],
      footerLine: "Thoughtform · Proposal for Pandora · September 2026.",
      signature: "Prepared for Kristin, Global Brand Creative Studio.",
    },
  ],
};
