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
        sub: "In the order every team goes through them, with Loop as the illustration: about 700 paid-social assets a month from two designers and one copywriter, a briefing that moves from the board into Figma without being retyped, a checker that took most of the manual review off the art director, and a program manager who gave himself a week back a month with a planning tool he built in Claude. The line Loop drew where photography stays real is the line Pandora has already drawn for itself, and the operations tool on the second card is where Pandora's studio is jammed. The setup is what Pandora would own.",
      },
    },
    /* ⚠ THE FOUR PROOF BEATS ARE THE HOMEPAGE'S OWN FOLDER CARDS, AT REST
       (ADR-128 Phase B): one Loop project a beat, in the pile's order, the
       card lettering the arc line as its title and Loop's own claims beneath.
       No head on any of them — the card is the head — and the chapter above
       says why they are here. Phase A drew the same four as `films` · a head
       over the `heimdall` dossier · `sheets` · `intelligence`; the record is
       the same, the housing is the one the owner is "really happy with". */
    {
      id: "practice-frontier",
      kind: "proof-card",
      menuLabel: "Films",
      track: "atl-films",
    },
    {
      id: "practice-tools",
      kind: "proof-card",
      menuLabel: "Tools",
      track: "tooling",
    },
    {
      id: "practice-studio",
      kind: "proof-card",
      menuLabel: "Studio",
      track: "studio",
    },
    {
      id: "practice-layer",
      kind: "proof-card",
      menuLabel: "The layer",
      track: "ai-transformation",
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
      /* THE BENCH (ADR-128 B2): Moira's Run · Skill · Evals module, ported by
         hand, with the practice's own evals example — the Loop asset checker
         on the Eclipse draw pair the owner released for this page — and
         Pandora's own checks named in the head. The record letters no digit;
         the chrome is the renderer's (`bench/benchChrome.ts`). */
      id: "checker",
      kind: "bench",
      menuLabel: "The checker",
      head: {
        eyebrow: "Pandora · creative review",
        title: { pre: "A checker that reads", em: "like your retoucher." },
        sub: "One check, written down: what it looks at, what it is allowed to decide, and the cases it is tested against. Shown on a Loop product image from our own evals workshop, because Pandora's retouches are not on this page yet. For Pandora the checks are the metal shade, the sparkle on the stones, the stone colour and the composition.",
      },
      example: {
        id: "eclipse",
        task: "Puts a generated image of the Eclipse sleep mask beside the real product and asks four named questions.",
        checks: [
          {
            id: "identity",
            label: "Identity",
            line: "It is the Eclipse: one continuous band, two low eye pockets, the closure at the back.",
          },
          {
            id: "proportions",
            label: "Proportions",
            line: "Two low pockets, not one dome and not two balls.",
          },
          {
            id: "texture",
            label: "Texture",
            line: "Knit reads as knit: a matte technical knit with a fine rib, not a moulded surface.",
          },
          {
            id: "colour",
            label: "Colour",
            line: "Teal is deep blue-green. Gone green, turquoise or navy it fails, unless the light explains it.",
          },
        ],
        inputs: [
          {
            id: "draw-a",
            label: "Draw A, on a train",
            brief:
              "A lifestyle image of the Eclipse in teal, worn, against a train window at night. The real render is attached.",
            output: {
              kind: "image",
              image: {
                src: "/arcs/pandora-proposal/mask-draw-a.webp",
                alt: "A generated image: a person asleep against a train window, wearing a teal Loop sleep mask.",
                width: 720,
                height: 540,
              },
              regions: [
                {
                  label: "The cups",
                  check: "proportions",
                  left: 32.4,
                  top: 29.3,
                  width: 31.2,
                  height: 40,
                },
                {
                  label: "A clip",
                  check: "identity",
                  left: 62.4,
                  top: 10.1,
                  width: 14,
                  height: 15.7,
                },
              ],
            },
            results: [
              { check: "identity", state: "block", note: "A clip the product does not have." },
              {
                check: "proportions",
                state: "block",
                note: "Two domes where the band has two low pockets.",
              },
              {
                check: "texture",
                state: "pass",
                note: "The knit reads as knit at the size it has in the frame.",
              },
              {
                check: "colour",
                state: "review",
                note: "Bluer than the product. A person decides.",
              },
            ],
            verdict: {
              state: "block",
              label: "Block, never keep",
              line: "Back to the retoucher with the two failed checks named.",
            },
            actions: [
              "Redraw: low pockets in the band, no domes.",
              "One band, closure at the back. No clip.",
            ],
          },
          {
            id: "draw-b",
            label: "Draw B, in bed",
            brief:
              "A lifestyle image of the Eclipse in teal, worn, in bed before sunrise. The real render is attached.",
            output: {
              kind: "image",
              image: {
                src: "/arcs/pandora-proposal/mask-draw-b.webp",
                alt: "A generated image: a person asleep in bed, in profile, wearing a teal Loop sleep mask.",
                width: 720,
                height: 540,
              },
              regions: [],
            },
            results: [
              { check: "identity", state: "pass", note: "One band, the closure at the back." },
              { check: "proportions", state: "pass", note: "Two low pockets, as on the product." },
              { check: "texture", state: "pass", note: "The knit holds at this size." },
              { check: "colour", state: "pass", note: "Held. One earlier run saw it bluer." },
            ],
            verdict: {
              state: "pass",
              label: "Pass, keep",
              line: "Clean on every check. A person still looks, against the real product.",
            },
            actions: ["To the review page. A person ticks it, or types what is wrong."],
          },
        ],
        skill: {
          folder: "the-asset-checker/",
          files: [
            {
              name: "SKILL.md",
              line: "What the checker is for, in the reviewer's words: which product, which views, what a pass looks like, what must never pass.",
            },
            {
              name: "references/",
              line: "The rubric, the product sheet, the approved register, and the real render it compares against.",
              image: {
                src: "/arcs/pandora-proposal/mask-reference.webp",
                alt: "The product render: a teal Loop sleep mask seen from the side, with its closure at the back.",
                width: 720,
                height: 540,
              },
            },
            {
              name: "evals/",
              line: "The cases every change to the rubric is run against, known-bad draws among them.",
            },
            {
              name: "scripts/",
              line: "Grade a folder of images, build the page the reviewer ticks.",
            },
          ],
        },
        rules: [
          {
            band: "fixed",
            line: "The cups are two low pockets formed in the band. Never a dome, never two balls.",
            check: "proportions",
          },
          {
            band: "fixed",
            line: "One continuous band with its closure at the back. No buckle, slider or clip.",
            check: "identity",
          },
          {
            band: "adapt",
            line: "Matte knit with a fine rib, judged at the size the mask has in the frame.",
            check: "texture",
          },
          {
            band: "adapt",
            line: "Teal stays in its hue family. The scene's light may shift it; nothing else may.",
            check: "colour",
          },
          { band: "free", line: "Pose, setting and light, once the product is right." },
        ],
        cases: [
          {
            id: "pinned",
            label: "Draw A, kept on file",
            line: "The proportions check must fail it. A change to the rubric that lets it pass is reverted.",
            expect: "block",
            checks: ["proportions", "identity"],
          },
          {
            id: "approved",
            label: "Draw B, kept on file",
            line: "Every check must hold on it. A change that fails it has gone too strict.",
            expect: "pass",
            checks: ["identity", "proportions", "texture", "colour"],
          },
          {
            id: "light",
            label: "The reviewer's own note",
            quote: "It reads bluer under the window",
            line: "Why the colour check adapts to the light rather than measuring a value: what a person said twice became the rule.",
            checks: ["colour"],
          },
        ],
        record:
          "Loop's own asset checker on the Eclipse, from the evals workshop we gave there. At Pandora the same instrument reads a retouch against the approved shot, with the producers' rules in place of these.",
      },
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
