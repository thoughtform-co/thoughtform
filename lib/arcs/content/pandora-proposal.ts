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
 * ⚠ THE STUDIO TODAY IS A CIRCUIT SINCE ADR-133 (owner, 2026-09-28, after
 * Rob's read): one configuration drawing that TRAVELS through three beats of
 * one pinned scene — the studio today and one configured piece of work, what
 * the team gets back, the studio's AI capability plugged into the larger
 * machine. It replaced the board here (the board still draws Trinny), and it
 * letters NO digit. The configuration's picker stays out: it is the
 * instrument the owner replaced on Trinny ("a lot of things to look at").
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
 * ⚠ THE SPINE SINCE ADR-133 (2026-09-28): Loop (part one) · the turn · THE
 * CIRCUIT (the studio today and configured → what the team gets back → the
 * studio's AI capability, one pinned scene) · THE GOAL (a `horizon`, the
 * approach from adoption to automation, before the plan) · the plan · the
 * checker ON PANDORA'S OWN PICTURE · who is in the room · what you keep, which
 * IS the configuration (the drawing's parts in words) · the fee · THE RETURN
 * (a `crew`: Loop's record drawn beside the four numbers we count and never
 * promise) · who does it · next steps. See each beat's comment.
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
      id: "turn",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "Part two · Pandora",
      line: { pre: "Pandora does not need", em: "three years of this." },
      subline:
        "The products, the brand and the producers' eye are already Pandora's. We bring the order to do it in, starting with the operational work around the creative.",
    },
    {
      /* THE CIRCUIT (ADR-133, owner 2026-09-28): ONE configuration drawing
         that TRAVELS through three beats of one pinned scene, which together
         are the offer from adoption to automation. (a) the studio today as a
         ruled ledger beside one piece of work configured, the review recap
         Kristin named on the call, with its six questions wired around it
         (the house grammar of the Moira workshop and the Dublin keynote);
         (b) the same work shrunk to one configuration among its siblings,
         each plugged into the team it gives time back to, which is her
         specific ask: her team does more and the operational freelance tail
         goes (the count and her target stay off the page); (c) every
         configuration on one shared layer, the studio's AI capability,
         plugged into what runs around the studio and into a brand system for
         all of marketing. That last socket is Rob's partner's ground, drawn
         GENERIC by owner ruling: the page speaks to Pandora. We start with
         the people because they steer it; the layer we write is what a
         system like that reads. The drawing letters no digit. */
      id: "today",
      kind: "circuit",
      menuLabel: "Pandora today",
      menuPrimary: true,
      head: {
        eyebrow: "Pandora · where the studio stands",
        title: { pre: "The studio today, and", em: "configured." },
        sub: "Left, one piece of the studio's operational work as it runs today: the recap after a creative review, typed up by hand and written down nowhere. Right, the same work configured: someone who answers for it, the context and the checks written down, running in the tools the studio already uses.",
      },
      work: {
        id: "recap",
        name: "The review recap",
        good: "Every note in, nothing made up",
        today: "Typed up after every review",
      },
      questions: [
        {
          id: "context",
          key: "The context",
          question: "What it knows",
          answer: "The notes and the brief",
          today: "In people's heads",
        },
        {
          id: "owner",
          key: "The owner",
          question: "Who answers for it",
          answer: "The PM who ran it",
          today: "Whoever was in the room",
        },
        {
          id: "evals",
          key: "The evals",
          question: "How we know it is good",
          answer: "Past recaps, replayed",
          today: "The next review",
        },
        {
          id: "model",
          key: "The model",
          question: "What runs it",
          answer: "The everyday lane",
          today: "Copilot, now and then",
        },
        {
          id: "reach",
          key: "The reach",
          question: "What it can reach",
          answer: "Figma notes and Asana",
          today: "Notes and an inbox",
        },
        {
          id: "interface",
          key: "The interface",
          question: "Where you meet it",
          answer: "A draft, ready to send",
          today: "A blank email",
        },
      ],
      rails: {
        context: [
          { key: "Rules", value: "The recap's format" },
          { key: "Examples", value: "Recaps that worked" },
          { key: "Sources", value: "Notes, brief, Asana" },
        ],
        evals: [
          { key: "Cases", value: "Past reviews" },
          { key: "Checks", value: "Every note owned" },
          { key: "Gates", value: "A PM sends it" },
        ],
      },
      people: {
        head: {
          eyebrow: "Pandora · the team",
          title: { pre: "What the team", em: "gets back." },
          sub: "Each configuration takes one piece of the operational work off someone's week, from the Primo upload to the review recap. The PMs still press the button and the producers still sign off. The hours go back to the creative work and the people, and the freelance days that carried this work can go to the shoot instead.",
        },
        teams: [
          {
            id: "pms",
            name: "The PMs",
            hand: "Press the button",
            configs: ["filing", "recap", "schedule", "resourcing"],
            freed: "The relationships",
          },
          {
            id: "producers",
            name: "The producers",
            hand: "Sign off the batch",
            configs: ["retouch"],
            freed: "The shoot and the talent",
          },
          {
            id: "designers",
            name: "The designers",
            hand: "Work from the page",
            configs: ["brief"],
            freed: "The concept",
          },
          {
            id: "email",
            name: "The email managers",
            hand: "Write the brief",
            configs: ["brief"],
            freed: "The strategy",
          },
        ],
        freedKey: "More time for",
      },
      machine: {
        head: {
          eyebrow: "Pandora · the larger machine",
          title: { pre: "The studio's", em: "AI capability." },
          sub: "Each workflow is its own configuration, and every one of them reads one layer: the context and the checks the team writes once. That layer is machine-readable, so it plugs into what runs around the studio, and into a brand system for all of marketing when Pandora builds one. We start with the people, because they are the ones who steer it.",
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
          name: "The studio's AI capability",
          line: "The context and the checks, machine-readable and shared",
          chips: ["Written once", "Owned by the team", "Outlives the model"],
        },
        sockets: [
          { id: "dam", key: "Your DAM", name: "Primo, and the MRM on it" },
          { id: "projects", key: "Projects", name: "Asana, across marketing" },
          { id: "adaptation", key: "Adaptation", name: "Your adaptation agency" },
          { id: "marketing", key: "Marketing", name: "The rest of marketing" },
          { id: "brand", key: "Brand system", name: "One for all of marketing", future: true },
        ],
      },
      alts: {
        a: "One piece of the studio's work, the review recap, written out as a ledger of how it runs today, beside the same work configured: an owner, the context and the checks the team writes, the model it runs on, what it can reach and where you meet it.",
        b: "The same configuration among its siblings, each wired to the team it gives time back to: the PMs, the producers, the designers and the email managers, and what each of them gets more time for.",
        c: "Every configuration on one shared layer, the studio's AI capability, plugged into Primo, Asana, the adaptation agency, the rest of marketing and a brand system for all of marketing that does not exist yet.",
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
        sub: "Today the operational work is done by hand, or with a prompt and a person checking every step. With the studio's context and its checks written down, the same work runs for hours on its own and the team checks in at the end. The hours that go on it today go back to the creative, and that is what the three months are for.",
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
        sub: "The configurations above, in the studio's own hands: someone whose job each one is, the context and the checks written down, the workflows on your accounts, inside the tools you already use. That is the product. We build it with the team, and it stays when we leave.",
      },
      groups: [
        {
          id: "parts",
          label: "The configuration, part by part",
          blurb: "What the drawings above show, as it stands on the last day of month three.",
          items: [
            {
              id: "owner",
              tag: "The owner",
              name: "A person for every workflow",
              body: "The one who decides what runs, what is checked and what stays by hand, with the studio lead and Kristin signing off.",
            },
            {
              id: "context",
              tag: "The context",
              name: "Rules, examples, sources",
              body: "The naming convention, the review rules in the producers' words, the brand book and the approved shots, and the loop that turns a note said twice into a check.",
            },
            {
              id: "evals",
              tag: "The evals",
              name: "Cases, checks, gates",
              body: "Past work replayed against those rules, so the team can see a workflow still does what it did before anyone changes it.",
            },
            {
              id: "where",
              tag: "Where it runs",
              name: "Figma, Primo and Hub Planner",
              body: "Inside the tools the studio already pays for, on Pandora's own Claude account. Nothing new to license, nothing of ours in the middle.",
            },
            {
              id: "layer",
              tag: "The layer",
              name: "The studio's AI capability",
              body: "Every workflow reads the same written context and checks, in a form a brand system for all of marketing can plug into. The blueprint with Jenny takes it to the next team.",
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
      /* THE RETURN, DRAWN (ADR-133, owner 2026-09-28, after Rob's read: the
         marketing director will ask about the impact). "It's not about exact
         numbers ... it should be a visual thing they can see", and the
         reasoning is Loop's own team shape: two designers and 700 assets, the
         PMs pre-filling copy that one copy editor checks. So the left half is
         Loop's RECORD, the printable figures only (the three spoken on the
         call plus the copy editor), each output drawn as the quantity it is;
         the right half is the same shape in the studio with the four measures
         we count in week one, FRAMED AND EMPTY. No Pandora estimate, no
         calculator. */
      id: "return",
      kind: "crew",
      menuLabel: "The return",
      head: {
        eyebrow: "Pandora · the business case",
        title: { pre: "What it returned", em: "at Loop." },
        sub: "Left, four things the same work did at Loop, from the record: a few people, one configuration each, and what came out. Right, the same shape in the studio, with the four numbers we count in week one and read beside every month's fee. We promise the counting; the numbers are yours to read.",
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
