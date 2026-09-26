import type { ArcDef } from "../types";

import { MODE_LEGEND } from "./shared/loop-tools";

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
 * ⚠ THE STUDIO TODAY IS A BOARD, NOT A CONFIGURATION. The argument is
 * operations → review → agents, one studio, one setup; the configuration's
 * picker over workstreams is the instrument the owner replaced on Trinny
 * ("a lot of things to look at"). The board letters NO digit.
 *
 * ⚠ EVERY FEE DERIVES FROM ONE CONSTANT (`DAY_RATE`), the same number the
 * deck's generator carries; change it in both in one commit.
 *
 * ⚠ THE BANNED WORD is said as the behaviour everywhere ("runs it alone",
 * "without us in the room"); the homepage's own card title is not repeated
 * on this page's copy for that reason.
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
    title: { pre: "We embed in your studio", em: "until it runs without us." },
    lede: "A proposal for Pandora's Global Brand Creative Studio, from Vince Buyssens and Rob Weston. What three years inside Loop's creative team taught us, brought to Copenhagen for three months: first the workflows run with AI, a person pressing the button. Then the same workflows run for agents, with a person keeping the last word.",
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
      id: "in-practice",
      kind: "head",
      menuLabel: "In practice",
      menuPrimary: true,
      head: {
        eyebrow: "Part one · how it looks in practice",
        title: { pre: "Four things we do inside a creative team,", em: "at Loop." },
        sub: "In the order every team goes through them. Loop is the illustration: about 700 paid-social assets a month from two designers and one copywriter, a briefing that moves from the board into Figma without being retyped, a checker that took most of the manual review off the art director, and a program manager who gave himself a week back a month with a planning tool he built in Claude. The setup is what Pandora would own.",
      },
    },
    {
      id: "frontier",
      kind: "films",
      menuLabel: "Films",
      ariaLabel: "The above-the-line films Loop made with AI",
      head: {
        eyebrow: "Loop Earplugs · the frontier",
        title: { pre: "We push the frontiers of", em: "AI creative." },
        sub: "Two thirty-second films by the same creative team, made with generative models to the craft bar of live action and run as paid media. And a line drawn where photography stays real, which is the line Pandora has already drawn for itself: no generated people in anything a customer sees.",
      },
    },
    {
      id: "tools-head",
      kind: "head",
      head: {
        eyebrow: "Loop Earplugs · the tools",
        title: { pre: "We build the tools", em: "the work needs." },
        sub: "Built with the people who run the workflow, where creative work jams: production, operations and the review between them. The one below is the operations tool, the briefing that goes from the board into Figma with nothing retyped, because operations is where Pandora's studio is jammed.",
      },
    },
    {
      /* The operations tool is the beat this proposal turns on, because the
         ask is operations. It is Loop's own record, by reference. */
      id: "studio-pm",
      kind: "dossier",
      menuLabel: "Own software",
      toolId: "heimdall",
      legend: MODE_LEGEND.Repair,
    },
    {
      id: "studio",
      kind: "sheets",
      menuLabel: "Studio",
      ariaLabel: "Loop Studio, the output, the rule and the limit",
      head: {
        eyebrow: "Loop Earplugs · the studio",
        title: { pre: "We embed until the team", em: "runs it alone." },
        sub: "Creative technology inside the studio until the team briefs, makes, judges and ships without a specialist in the loop. Half of what a conservative brand has to trust is what the setup may not make: the line and the red line below are how Loop decided that, and Pandora's own lines are the same kind of decision, written down first.",
      },
    },
    {
      id: "layer",
      kind: "intelligence",
      menuLabel: "The layer",
      ariaLabel: "The layer Loop's agents run on: the work, and the configuration",
      head: {
        eyebrow: "Loop Earplugs · the layer",
        title: { pre: "We build the layer", em: "the agents run on." },
        sub: "Team by team, what each one knows is written down once, as the briefing every agent inherits, with checks it runs on its own work and a person with the last word. The map below is Loop's marketing work by workstream, and by how far each stream runs without a person.",
      },
    },
    {
      id: "turn",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "Part two · Pandora",
      line: { pre: "And now we bring this", em: "to Pandora." },
      subline:
        "First the workflows run with AI, a person pressing the button. Once a workflow has held for a few weeks, an agent runs it on a schedule and the team checks in every hour instead of every five minutes. A person keeps the last word on everything a customer will see.",
    },
    {
      id: "today",
      kind: "board",
      menuLabel: "Pandora today",
      menuPrimary: true,
      head: {
        eyebrow: "Pandora · where the studio stands",
        title: { pre: "The studio today, and", em: "configured." },
        sub: "Left, the Global Brand Creative Studio as it runs today: the operational work by hand, held up by freelancers, nothing about the way of working written down. Right, the same studio with its configuration seated, on the tools it already uses.",
      },
      states: [
        {
          mode: "today",
          label: "As it runs today",
          alt: "Pandora's brand creative studio as it runs today, written out as a ledger: nobody owns AI as their day job, the operational work is done by hand and held up by freelancers, the way of working is not written down, three tools that nothing connects, and nothing that reaches past the studio.",
          seat: { q: "Who owns it", a: "Nobody, as their day job" },
          card: { name: "The work", work: "by hand, held up by freelancers" },
          layer: { label: "The context", sub: "not written down", rows: [] },
          tools: {
            label: "The tools",
            items: [
              { id: "figma", name: "Figma" },
              { id: "primo", name: "Primo" },
              { id: "hub-planner", name: "Hub Planner" },
            ],
          },
          reach: { label: "Where it scales", value: "not past the studio" },
        },
        {
          mode: "configured",
          label: "With a configuration",
          alt: "The same studio with its configuration seated: the studio lead owns it with Kristin's sign-off, an AI capability the studio owns runs at the centre on Pandora's own account, it reads the context the studio keeps, it runs inside the tools the studio already uses, and it scales into the rest of marketing.",
          seat: { q: "Who owns it", a: "The studio lead, with Kristin's sign-off." },
          card: { name: "AI capability", work: "owned by the studio" },
          layer: {
            label: "The context",
            rows: [
              { id: "rules", tag: "Rules" },
              { id: "examples", tag: "Examples" },
              { id: "sources", tag: "Sources" },
              { id: "loops", tag: "Loops" },
            ],
          },
          tools: {
            label: "Where it runs",
            items: [
              { id: "figma", name: "Figma" },
              { id: "primo", name: "Primo" },
              { id: "hub-planner", name: "Hub Planner" },
            ],
          },
          reach: { label: "Where it scales", value: "into the rest of marketing" },
        },
      ],
    },
    {
      /* The bench's three tabs (Run · Skill · Evals) as three plates, until
         the `bench` kind lands (ADR-128 Phase B). No image, no digit. */
      id: "checker",
      kind: "list-groups",
      menuLabel: "The checker",
      layout: "plates",
      head: {
        eyebrow: "Pandora · creative review",
        title: { pre: "A checker that reads a retouch", em: "the way your retoucher does." },
        sub: "One check, written down: what it looks at, what it is allowed to decide, and the cases it is tested against. Shown here on a Loop product image, because Pandora's own retouches are not on this page yet. For Pandora the checks are the metal shade, the sparkle on the stones, the stone colour and the composition.",
      },
      groups: [
        {
          id: "run",
          label: "The run",
          blurb: "One draw, against the reference",
          items: [
            {
              id: "identity",
              tag: "Block",
              name: "Identity",
              body: "A clip the product does not have. The checker stops it before anyone opens the file.",
            },
            {
              id: "proportions",
              tag: "Block",
              name: "Proportions",
              body: "Two domes where the band has two low pockets.",
            },
            {
              id: "texture",
              tag: "Pass",
              name: "Texture",
              body: "The knit reads as knit at the size it has in the frame.",
            },
            {
              id: "colour",
              tag: "Review",
              name: "Colour",
              body: "Bluer than the product. A person decides.",
            },
          ],
          foot: {
            label: "Verdict",
            lines: ["Block. Back to the retoucher with the two failed checks named."],
          },
        },
        {
          id: "skill",
          label: "The skill",
          blurb: "One folder the studio owns",
          items: [
            {
              id: "skillmd",
              tag: "SKILL.md",
              name: "What the checker is for, in the retoucher's words",
              body: "Which product, which views, what a pass looks like and what must never pass. Written with the person who reviews today.",
            },
            {
              id: "references",
              tag: "references",
              name: "The rubric, the product sheet, the approved register",
              body: "The real shots the checker compares against, and the list of what has already been approved.",
            },
            {
              id: "evals",
              tag: "evals",
              name: "The cases every change to the rubric is run against",
              body: "A retouch that must pass and one that must block. A rule change that flips either is reverted.",
            },
            {
              id: "scripts",
              tag: "scripts",
              name: "Grade a folder, build the page the reviewer ticks",
              body: "Runs on a folder of retouches overnight. The reviewer opens only what it flagged.",
            },
          ],
          foot: {
            label: "Where it lives",
            lines: ["On Pandora's own Claude account, beside Primo and Figma."],
          },
        },
        {
          id: "evals-rules",
          label: "The evals",
          blurb: "How strictly each rule holds",
          items: [
            {
              id: "fixed-a",
              tag: "Fixed",
              name: "One continuous band, closure at the back",
              body: "Checked word for word. Pass or block.",
            },
            {
              id: "fixed-b",
              tag: "Fixed",
              name: "Two low pockets, never a dome",
              body: "Pass or block.",
            },
            {
              id: "adapt-a",
              tag: "Adapt",
              name: "Matte knit with a fine rib, judged at frame size",
              body: "Checked with judgment. Pass or review.",
            },
            {
              id: "adapt-b",
              tag: "Adapt",
              name: "Teal stays in its hue family; the light may shift it",
              body: "Pass or review.",
            },
            {
              id: "free",
              tag: "Free",
              name: "Pose, setting and light, once the product is right",
              body: "Not checked. Left to the retoucher.",
            },
          ],
          foot: {
            label: "Cases on file",
            lines: ["The blocked draw must block. The approved one must pass."],
          },
        },
      ],
    },
    {
      id: "phases",
      kind: "list-groups",
      menuLabel: "Phases",
      menuPrimary: true,
      layout: "plates",
      head: {
        eyebrow: "Pandora · the three months",
        title: { pre: "Three months,", em: "in three phases." },
        sub: "Operations first, because that is where the studio's week goes. Then the review. Then the same workflows handed to agents, and the setup shown to the next team. Each month ends on one thing that has to work before the next begins, and each month can be the last.",
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
              body: "Pandora's own reference shots and the producers' rules in their words: the metal shade, the sparkle, the stone, the finish. Every retouch graded before a producer opens it",
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
              body: "The producer is the last gate. What the producers say twice becomes a check",
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
      id: "how-we-work",
      kind: "list-groups",
      menuLabel: "The loop",
      layout: "columns",
      head: {
        eyebrow: "Pandora · inside every phase",
        title: { pre: "How we work together,", em: "inside every phase." },
        sub: "One loop, run with your team. We set it up in week one, then run it beside them until they are running it without us. Shown on the review workstream; the operational workflows run on the same loop.",
      },
      groups: [
        {
          id: "loop",
          label: "The loop, on one workstream",
          blurb: "Creative review, M2. The operational workflows of M1 run on the same loop.",
          items: [
            {
              id: "owns",
              tag: "Who owns it",
              name: "The producers, and Kristin as the last gate",
              body: "The producers decide what passes a retouch. Kristin decides what the checker may decide alone.",
            },
            {
              id: "runs",
              tag: "What runs it",
              name: "Pandora's Skills, in Claude",
              body: "The review rules, the product facts and the naming conventions as plain files, on Pandora's own account.",
            },
            {
              id: "bar",
              tag: "The bar",
              name: "The producers' rubric, in their words",
              body: "Every retouch is graded against it before anyone opens the file. What they say twice becomes a check.",
            },
            {
              id: "where",
              tag: "Where it runs",
              name: "Claude, reading Primo and Figma",
              body: "Connected to the asset library, to the design files and to the schedule in Asana.",
            },
          ],
        },
        {
          id: "people",
          label: "In the loop, and how much",
          blurb: "Who is in the room, and what it costs them in time.",
          items: [
            {
              id: "kristin",
              tag: "Pandora",
              name: "Kristin, owner and sponsor",
              body: "The kickoff and the handover, one session a week in between, and the monthly read with Jenny.",
              meta: "One session a week",
            },
            {
              id: "taskforce",
              tag: "Pandora",
              name: "The AI task force, the first to learn it",
              body: "In every session in month one. From month two they give the sessions to their colleagues.",
              meta: "Two sessions a week in M1, then their own",
            },
            {
              id: "pms",
              tag: "Pandora",
              name: "The PMs and producers, who run the work",
              body: "In the workflows from week one. The producers' review time is what the checker learns from, so it is not optional.",
              meta: "Sessions in months one and two",
            },
            {
              id: "jenny",
              tag: "Pandora",
              name: "Jenny, on scope and the wider organisation",
              body: "The kickoff, and the blueprint in month three.",
              meta: "Two sessions",
            },
            {
              id: "vince",
              tag: "Thoughtform",
              name: "Vince, on AI and creative technology",
              body: "About five days a month in Copenhagen, the rest in the team's own channels. Builds and encodes with the studio, then watches.",
              meta: "About twenty days a month",
            },
            {
              id: "rob",
              tag: "Thoughtform",
              name: "Rob, on structure and the senior conversations",
              body: "In the background, and in the room when senior presence helps: the business case, the read with Jenny, how the team changes as the work does.",
              meta: "One session a month",
            },
          ],
        },
      ],
    },
    {
      id: "needs-keeps",
      kind: "list-groups",
      menuLabel: "Needs and keeps",
      layout: "columns",
      head: {
        eyebrow: "Pandora · the terms of the work",
        title: { pre: "What we need, and", em: "what you keep." },
        sub: "Five things before we start. Six things that stay behind when we stop showing up.",
      },
      groups: [
        {
          id: "needs",
          label: "What this needs from Pandora",
          items: [
            {
              id: "claude",
              tag: "01",
              name: "Claude for the studio",
              body: "The enterprise access Kristin is pursuing with D&T. It is the one dependency the plan cannot start without; the task force's own seats let week one begin.",
            },
            {
              id: "access",
              tag: "02",
              name: "Access, in Pandora's name",
              body: "A Figma seat, read access to Primo and the MRM, Asana and Hub Planner, a shared folder and a place to keep versions. Opened in Pandora's name so nothing needs migrating later.",
            },
            {
              id: "record",
              tag: "03",
              name: "The record as it stands",
              body: "The last quarter's review recaps, a handful of reference shots and retouched assets with the producers' verdicts, the brand book, the tone of voice and the naming convention.",
            },
            {
              id: "week",
              tag: "04",
              name: "A first week of watching",
              body: "Nothing is built in week one. We join the meetings, read the tools and write down how the work runs today.",
            },
            {
              id: "time",
              tag: "05",
              name: "The studio's time",
              body: "Kristin's and the task force's, and the producers' review time. The checker learns from what they send back.",
            },
          ],
        },
        {
          id: "keeps",
          label: "What Pandora has at the end",
          items: [
            {
              id: "skills",
              tag: "Keeps",
              name: "The Skills",
              body: "Naming, the upload, the recap, the schedule, resourcing and the review rules, as files Pandora owns and edits.",
            },
            {
              id: "workflows",
              tag: "Keeps",
              name: "The workflows, on Pandora's own accounts",
              body: "Running inside Figma, Primo and Asana. No platform to license beyond the tools the studio already has.",
            },
            {
              id: "checker",
              tag: "Keeps",
              name: "The retouching checker",
              body: "On Pandora's own reference shots, with the producers as the last gate.",
            },
            {
              id: "team",
              tag: "Keeps",
              name: "A team that runs it",
              body: "The task force gives its own sessions. Handover is a production week, not a document.",
            },
            {
              id: "blueprint",
              tag: "Keeps",
              name: "The blueprint for the wider marketing organisation",
              body: "Which teams next, what each would write down first, and what it would save.",
            },
            {
              id: "nodep",
              tag: "Keeps",
              name: "No fee to us afterwards",
              body: "No retainer, nothing that breaks if we stop answering. Check-ins at one month and at three.",
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
        sub: "One day rate, remote or on site. About twenty days a month, five of them in Copenhagen. Invoiced at each month end on the days worked, and each month can be the last.",
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
        "Month one stands on its own. Stop after it and the studio keeps four working workflows and the Skills behind them.",
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
      id: "people",
      kind: "cards",
      menuLabel: "Who does it",
      columns: 2,
      head: {
        eyebrow: "Thoughtform · who shows up",
        title: { pre: "Two people, both of whom", em: "did this at Loop." },
        sub: "One built the capability inside the creative team. The other ran the organisation it had to work for.",
      },
      cards: [
        {
          id: "vince",
          kicker: "AI and creative technology",
          title: "Vince Buyssens",
          body: "Built Loop's AI capability inside its creative team over three years, then led its company-wide adoption of Claude. Runs the sessions, the encoding and the graded rounds. About five days a month in Copenhagen.",
        },
        {
          id: "rob",
          kicker: "Commercial and organisation",
          title: "Rob Weston",
          body: "Ran the Commercial and Marketing teams at Loop and sat on the executive team that decided, in 2024, to make Loop AI-first. Focuses on organisation, process, the business case and the senior conversations. In the background, in the room when it helps.",
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
        sub: "Three of them, and the first is a date in a diary.",
      },
      cards: [
        {
          id: "week",
          n: "01",
          title: "Confirm the first week in Copenhagen",
          body: "Five days of watching, not building. We work around the producers' calendar first.",
        },
        {
          id: "claude",
          n: "02",
          title: "Claude access, in Pandora's name",
          body: "The enterprise conversation with D&T, with Jenny's support. The appendix below is written for it.",
        },
        {
          id: "scope",
          n: "03",
          title: "Settle the scope with Jenny",
          body: "The studio alone, or the wider marketing organisation from month three. The plan holds either way; the blueprint changes size.",
        },
      ],
    },
    {
      id: "business-case",
      kind: "list-groups",
      menuLabel: "Appendix",
      layout: "columns",
      head: {
        eyebrow: "Appendix · the business case",
        title: { pre: "Measured on your own numbers,", em: "not on a claim." },
        sub: "A baseline in the first week, read again at each month end, so Jenny reads a before and an after. What it measured at Loop, and how we would measure it here.",
      },
      groups: [
        {
          id: "measures",
          label: "What we measure",
          items: [
            {
              id: "hours",
              tag: "Hours",
              name: "The operational hours a week",
              body: "What the PMs and producers spend on naming, uploads, the schedule, recaps and resourcing. Counted in week one, counted again at each month end.",
            },
            {
              id: "freelance",
              tag: "Days",
              name: "Freelance days booked against operational work",
              body: "The budget Kristin wants back. Read from the bookings, month by month.",
            },
            {
              id: "review",
              tag: "Cycle",
              name: "A retouch batch, from in to verdict",
              body: "How long a batch waits for a producer today, and how long once the checker has read it first.",
            },
            {
              id: "rounds",
              tag: "Rounds",
              name: "Retouch rounds per asset",
              body: "Fewer rounds when the first version is checked against the rules the retoucher already knows.",
            },
          ],
        },
        {
          id: "loop",
          label: "What it measured at Loop",
          items: [
            {
              id: "assets",
              tag: "Loop",
              name: "About 700 paid-social assets a month",
              body: "From two designers and one copywriter, with 97% of the briefings involving AI and the campaigns beating their return target.",
            },
            {
              id: "checker",
              tag: "Loop",
              name: "Manual review down about tenfold",
              body: "The asset checker reads every generated image against the real product before the art director opens the sheet.",
            },
            {
              id: "planning",
              tag: "Loop",
              name: "A week a month, given back",
              body: "A program manager who was not a developer built a resource-planning tool in Claude over a set of convoluted boards.",
            },
            {
              id: "briefing",
              tag: "Loop",
              name: "Nothing retyped between the board and Figma",
              body: "The briefing plugin took the copy-and-paste out of the project managers' day. Copywriters became copy editors and brand storytellers.",
            },
          ],
        },
      ],
      closing:
        "Loop's numbers are Loop's. Pandora's will be read from Pandora's own bookings, files and calendars, which is why the first week is spent counting rather than building.",
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
