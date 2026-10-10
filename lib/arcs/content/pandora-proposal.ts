import type { ArcDef } from "../types";

import { LOOP_IN_PRACTICE, LOOP_PROOF_CARDS, LOOP_RETURN, VINCE_ABOUT } from "./shared/loopProof";

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
 * ⚠ THE FEE IS THE DAY RATE AND NOTHING ELSE (ADR-133 U5, owner
 * 2026-09-29, from the debrief with Rob: absolute totals "might put them
 * off"). The page states the rate and about twenty days a month and lets the
 * reader do the sum; no month fee and no three-month total is printed.
 * `DAY_RATE` is the same number the deck's generator carries; change it in
 * both in one commit.
 *
 * ⚠ THE FOUR CARDS SPEAK IN THE PAST TENSE HERE (owner, 2026-09-28). The
 * homepage says the arc lines as the practice's offer ("We push the
 * frontiers of AI creative"); this page looks back at what was done at Loop,
 * so each `proof-card` carries its own `title` ("We pushed …"). The record's
 * lines are untouched: they are the Dublin keynote's, word for word.
 *
 * ⚠ THE SPINE SINCE ADR-133 U5 (2026-09-29): Loop (part one: four proof
 * cards, then THE RETURN, a `crew`, one row per role read left to right) ·
 * the turn · TODAY (the `board`) · THE APPROACH (the owned `horizon`) · THE
 * SYSTEM (the `circuit` map) · the three months · the checker ON PANDORA'S OWN
 * PICTURE, a mockup · who takes part (and what I need) · the day rate · what
 * we measure · the About, the homepage's own. U6 dropped "what you keep" and
 * the next steps (owner). Rob advises in the background
 * and is named in the covering email, not on the page (owner).
 */

const DAY_RATE = 1500;
const eur = (n: number) => `€${n.toLocaleString("en-GB")}`;

export const PANDORA_PROPOSAL_ARC: ArcDef = {
  slug: "pandora-proposal",
  leaf: "proposal",
  format: "proposal",
  client: "pandora",
  // A proposal is out until the client answers it (ADR-114).
  status: "proposed",
  // Filed the day after the call; the overview's monitor plots it (ADR-118).
  date: "2026-09-26",
  theme: "light",
  // Linear's rule for the head beats (ADR-128 U2): the head 128px under the
  // beat's top edge, the beat as tall as its content.
  rhythm: "flow",
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
    LOOP_IN_PRACTICE,
    ...LOOP_PROOF_CARDS,
    LOOP_RETURN,
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
      /* THE STUDIO TODAY, AND CONFIGURED (ADR-133 U2, owner 2026-09-29: "I
         want it to look like how it was originally: on the left side a list
         of the current setup and on the right side the intelligence
         configuration"). The `board` beat as it stood before ADR-133: a ruled
         ledger of the studio's setup beside the same five facts configured.
         ⚠ THE LEDGER STATES THE SETUP, NEVER A GAP: three of its rows first
         read "nobody", "not written down" and "not past the studio", which is
         the column of the client's shortcomings he ruled out on 2026-09-28;
         the contrast lives in the paragraph. */
      id: "today",
      kind: "board",
      menuLabel: "Pandora today",
      menuPrimary: true,
      head: {
        eyebrow: "Pandora · where the studio stands",
        title: { pre: "The studio today, and", em: "configured." },
        sub: "Left, the studio as it runs today. Right, the same studio once its AI work has an owner and its rules are written down, in the tools it already uses.",
      },
      states: [
        {
          mode: "today",
          label: "As it runs today",
          alt: "Pandora's brand creative studio as it runs today, written out as a ledger: each PM owns their own work, the way of working is held by the producers, the operational work is done by hand with freelancers, in Figma, Primo and Hub Planner, within the studio.",
          seat: { q: "Who owns it", a: "Each PM, for their own work" },
          card: { name: "The work", work: "by hand, with freelancers" },
          layer: { label: "The context", sub: "held by the producers", rows: [] },
          tools: {
            label: "The tools",
            items: [
              { id: "figma", name: "Figma" },
              { id: "primo", name: "Primo" },
              { id: "hub-planner", name: "Hub Planner" },
            ],
          },
          reach: { label: "Where it scales", value: "within the studio" },
        },
        {
          mode: "configured",
          label: "With a configuration",
          alt: "The same studio once its AI work is set up: the studio lead owns it with Kristin's sign-off, an AI capability the studio owns runs at the centre on Pandora's own account, it reads the context the studio keeps, it runs inside the tools the studio already uses, and it scales into the rest of marketing.",
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
      /* AUTOMATION RUNS THROUGH ADOPTION (ADR-133 U2, owner 2026-09-29: first
         "Your team owns it", moved after the studio today and retitled on the
         practice's own position, between adoption and automation; "flywheel"
         stays out of copy by the strategy's ruling. His brief:
         "merge it with from the button to the goal … the owner gets more time
         for more upstream work and the agent takes care of the rest … on the
         left side, the owner panel, and on the right side, an adopted version
         of those two timelines"). The horizon re-cut: the top track is the
         owner's own day, spent upstream (Kristin on the call: "the volume of
         creative campaign work is where I want to put the team", "brand
         storytelling, concepting, the creative ideas"), and the agent's run
         below reaches up three times. ADR-078 U1 asks a drawing here to stand
         on a record: the note names the plan's own two months. The freelancer
         count is deliberately NOT in this beat (owner). */
      id: "goal",
      kind: "horizon",
      menuLabel: "The approach",
      head: {
        eyebrow: "Pandora · the approach",
        title: { pre: "Automation runs", em: "through adoption." },
        sub: "In the workshops the PMs and producers learn to work with the AI they already have and write down how the work is done. An agent takes the operational work from there and checks in when it needs a person, so the team's time goes to the brief, the concepting and the campaign imagery.",
      },
      owner: {
        key: "The owner",
        name: "The PMs and producers",
        rows: [
          { tag: "Writes", line: "How the work is done" },
          { tag: "Sets", line: "What a good result looks like" },
          { tag: "Decides", line: "What goes out" },
        ],
      },
      upstream: {
        label: "Your team, upstream",
        spans: ["The brief", "Concepting", "Campaign imagery"],
        line: "The brief, the concepting and the campaign imagery, with the agent checking in once.",
      },
      agent: {
        label: "The agent, on the rest",
        start: "You set the goal and the checks",
        gates: [
          { kind: "check", at: 0.18, label: "Checks its own work" },
          { kind: "retry", at: 0.5, label: "Steps back and retries" },
          { kind: "ask", at: 0.72, label: "Checks in with you" },
        ],
        end: "You judge the result",
      },
    },
    {
      /* ONE LAYER, EVERY WORKFLOW (ADR-133 U2, owner 2026-09-29: "a nice
         overview of different configurations put together, like the restored
         configuration … I don't think we should see all the texts of the
         smaller panels … it should just become a high-level map of different
         nodes"). Each workflow in the plan is a small configuration in the
         board's own shape, lettered with its name alone; every one's context
         plate is wired into the MARKETING OS at the centre, a twelve-sided plate
         and not a card (owner: "the center card should have a different type
         of shape and really represent that marketing OS"), which plugs,
         dashed, into the brand system Pandora may build later (Rob's point,
         drawn generic). Each card is the board's own AI capability card, at
         the same size (owner: "the exact same cards … all at the same
         height"). */
      id: "layer",
      kind: "circuit",
      menuLabel: "The system",
      head: {
        eyebrow: "Pandora · the marketing OS",
        title: { pre: "A system built", em: "to compound." },
        sub: "Each workflow becomes a configuration its team owns, and all of them run on one layer: Pandora's marketing OS. Every one written gives the team time back, and the next starts from what is already there.",
      },
      configs: [
        { id: "filing", name: "Filing", line: "owned by the producers" },
        { id: "recap", name: "Review recap", line: "owned by the PMs" },
        { id: "schedule", name: "Schedule", line: "owned by the PMs" },
        { id: "resourcing", name: "Resourcing", line: "owned by the PMs" },
        { id: "retouch", name: "Retouch check", line: "owned by the producers" },
        { id: "brief", name: "Brief to Figma", line: "owned by the designers" },
      ],
      os: {
        key: "Pandora's",
        name: "Marketing OS",
        line: "built by your own teams",
      },
      socket: { key: "Later", name: "A brand system for all marketing" },
      alt: "Pandora's marketing OS as a map: six workflows, each its own small configuration with an owner, the work, its tools and where it goes. Filing, owned by the producers; the review recap, the schedule and resourcing, owned by the PMs; the retouch check, owned by the producers; and the brief to Figma, owned by the designers. Every one is wired to the marketing OS at the centre, built by the teams themselves, which plugs into a dashed socket below: a brand system for all of marketing, later.",
    },
    {
      id: "phases",
      kind: "list-groups",
      menuLabel: "Phases",
      menuPrimary: true,
      layout: "plates",
      head: {
        eyebrow: "Pandora · the three months",
        title: { pre: "The", em: "three months." },
        sub: "Operations first, then the review and the briefs, then the same workflows running on their own. Each month ends on something that works, and you can stop after any of them.",
      },
      /* ⚠ HIGH-LEVEL AND STILL CONCRETE (owner, 2026-09-29: "avoid
         committing to one specific line … without understanding the business,
         but I don't want it to be too vague"). Each month names the work it
         is about, from the call, and leaves the order inside it to week one.
         The review is not a month on its own: it shares month two with the
         briefs and whatever month one turns up. */
      groups: [
        {
          id: "m1",
          label: "M1 · about four weeks",
          blurb: "Operations",
          items: [
            {
              id: "m1-week",
              tag: "Week one · Copenhagen",
              name: "How the week really runs",
              body: "We sit in on the meetings and write the operational work down as it is, the freelancers' part included.",
            },
            {
              id: "m1-setup",
              tag: "The current setup",
              name: "More out of the tools you have",
              body: "Figma, Primo, Asana and Hub Planner as they are, with Claude working inside them.",
            },
            {
              id: "m1-flows",
              tag: "Around the team's flows",
              name: "The first configurations",
              body: "Filing and the Primo upload, the review recap, the schedule, resource planning. Week one decides the order.",
            },
          ],
          foot: {
            label: "Done when",
            lines: [
              "A PM runs the first workflows without us",
              "Each task-force member has written one workflow down",
            ],
          },
        },
        {
          id: "m2",
          label: "M2 · about four weeks",
          blurb: "Review and briefs",
          items: [
            {
              id: "m2-review",
              tag: "Review",
              name: "The retouching check, in the producers' words",
              body: "Starting with the metal's shade and the sparkle, on Pandora's own shots. The producer still decides.",
            },
            {
              id: "m2-briefs",
              tag: "Briefs",
              name: "The brief, straight into Figma",
              body: "The email managers' brief becomes a Figma page the designers work from.",
            },
            {
              id: "m2-next",
              tag: "What month one found",
              name: "The next workflows",
              body: "What month one turned up, set up the same way.",
            },
          ],
          foot: {
            label: "Done when",
            lines: [
              "The producers change a rule of the check themselves",
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
              id: "m3-agents",
              tag: "Agents",
              name: "From a button to a schedule",
              body: "The workflows run on their own and check in when they need a person.",
            },
            {
              id: "m3-skills",
              tag: "Written down",
              name: "The Skills, as files the studio owns",
              body: "The brand nuance, the tone and the review rules, kept where the team can change them.",
            },
            {
              id: "m3-handover",
              tag: "Scaling · Copenhagen",
              name: "The blueprint and the handover",
              body: "The same setup written down for the next team, with Jenny, then a production week the team runs without us.",
            },
          ],
          foot: {
            label: "Done when",
            lines: [
              "The team runs a month without us",
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
      menuLabel: "The retouch check",
      head: {
        eyebrow: "Pandora · a mockup",
        title: { pre: "The retouching", em: "check." },
        sub: "A mockup on one of Pandora's own pictures. The first two checks are the ones Kristin named on the call.",
      },
      example: {
        id: "rings",
        task: "Puts a retouched picture beside the approved shot and checks four things.",
        checks: [
          {
            id: "metal",
            label: "Metal shade",
            line: "Each ring is its own metal, as in the approved shot: the silver cool and white, the gold warm. No cast.",
          },
          {
            id: "sparkle",
            label: "Sparkle",
            line: "Every stone keeps its points of light. A flat grey stone fails.",
          },
          {
            id: "identity",
            label: "Identity",
            line: "The same six rings, in the same places, with the same settings.",
          },
          {
            id: "retouch",
            label: "The retouch",
            line: "Cleaned, not redrawn: a prong or a band keeps its edge.",
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
            line: "From the call. A note the producers keep repeating becomes a new check.",
            checks: ["metal", "sparkle"],
          },
        ],
        record:
          "A mockup on Pandora's own press picture of its lab-grown diamond rings, with a retouch mistake we added for this page. The rules are placeholders; in month two they come from your producers.",
      },
    },
    {
      /* WHO TAKES PART (owner, 2026-09-28, on the readout version: "too
         condensed … two different fonts … rework this section so it's super
         clear for the stakeholders"). Suri's own grammar for this beat
         (`columns`, a name, one sentence on what the person does, the time it
         costs them as the meta line), which he called the core. What Pandora
         has to provide sits under "From Thoughtform", as what I need. */
      id: "how-we-work",
      kind: "list-groups",
      menuLabel: "Who takes part",
      layout: "columns",
      head: {
        eyebrow: "Pandora · how we work",
        title: { pre: "Who", em: "takes part." },
        sub: "About five days a month in Copenhagen, the rest in the team's own channels, until the team runs it without us.",
      },
      groups: [
        {
          id: "pandora",
          label: "From Pandora",
          blurb: "What the three months ask of each.",
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
          blurb: "In the studio and beside it.",
          items: [
            {
              id: "vince",
              tag: "Thoughtform",
              name: "Vince, on AI and creative technology",
              body: "Five days a month in Copenhagen, the rest remote. Runs the sessions, writes the Skills with the team, then steps back.",
              meta: "About twenty days a month",
            },
          ],
          /* WHAT I NEED (U6, owner: "a new subsection that asks what I need:
             access to Claude and all the tools in week 1 so I can map out
             everything"). It takes over the next steps' asks. */
          sub: {
            label: "What Thoughtform needs",
            blurb: "Before week one.",
            items: [
              {
                id: "claude",
                tag: "Week one",
                name: "Access to Claude",
                body: "An account on Pandora's own Claude, set up with D&T.",
              },
              {
                id: "tools",
                tag: "Week one",
                name: "Access to the tools",
                body: "Figma, Primo, Asana and Hub Planner, so the work can be mapped as it runs.",
              },
            ],
          },
        },
      ],
    },
    {
      /* THE DAY RATE (ADR-133 U5, owner 2026-09-29): the rate and the days,
         no month fee and no total. From the debrief with Rob: absolute
         numbers "might put them off"; a day rate and about twenty days a
         month lets them make the calculation themselves. Four cards, because
         `.arc-cards` sets two across at the reference laptop. */
      id: "pricing",
      kind: "cards",
      menuLabel: "Pricing",
      menuPrimary: true,
      columns: 4,
      head: {
        eyebrow: "Pandora · the fee",
        title: { pre: "The", em: "day rate." },
        sub: "One rate for every day on the work, remote or in Copenhagen.",
      },
      cards: [
        {
          id: "rate",
          kicker: "Rate",
          title: `${eur(DAY_RATE)} a day`,
          body: "The same rate remote or in Copenhagen.",
        },
        {
          id: "days",
          kicker: "Time",
          title: "About twenty days a month",
          body: "Five of them on site in Copenhagen.",
        },
        {
          id: "invoicing",
          kicker: "Invoicing",
          title: "At each month end",
          body: "On the days actually worked, so a lighter month costs less.",
        },
        {
          id: "renewal",
          kicker: "Renewal",
          title: "Month to month",
          body: "Either side can stop at the end of any month.",
        },
      ],
      footnote:
        "Travel at cost. Model usage runs on Pandora's own Claude account. Everything built belongs to Pandora, including if you stop after the first month.",
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
      menuLabel: "What we measure",
      columns: 4,
      head: {
        eyebrow: "Pandora · the business case",
        title: { pre: "What we", em: "measure." },
        sub: "Four numbers from Pandora's own bookings, files and calendars, counted from week one and read beside each month's invoice.",
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
          body: "Read from the bookings each month.",
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
    VINCE_ABOUT,
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
      ],
      footerLine: "Thoughtform · Proposal for Pandora · September 2026.",
      signature: "Prepared for Kristin, Global Brand Creative Studio.",
    },
  ],
};
