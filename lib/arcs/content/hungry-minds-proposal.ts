import type { ArcDef } from "../types";

import { MODE_LEGEND } from "./shared/loop-tools";

/**
 * Hungry Minds, the proposal, as an arc (ADR-098).
 *
 * Scaffolded by `scripts/new-arc.mjs`, then written. The house parts are the
 * scaffold's; what is this engagement's own is the rule section, the
 * configuration's teams, the phases, the fee, the people and the appendix.
 *
 * ⚠ IT IS ADDRESSED TO ONE READER, so it may print the fee, the names and
 * the dates, and it is therefore deliberately OUTSIDE `ENVELOPE_ARCS`,
 * whose job is a page forwarded to strangers.
 *
 * ⚠ THE PROOF IS LOOP'S, BY REFERENCE. The films, the sheets and the
 * briefing agent resolve the casefile's own records, so a correction lands
 * in one place and nothing about Loop is retyped here.
 *
 * ⚠ THIS CLIENT'S BOOKS ARE DRAWN BY HAND, and the category they sell into
 * is suspicious of AI for that reason. So the page carries a section the
 * other proposals do not: `the-rule`, which says in two columns what a model
 * would make here and what no model ever touches. It is placed BEFORE the
 * configuration on purpose. A reader who has not been told where the line is
 * reads every later beat as a threat.
 *
 * ⚠ TWO NAMES ARE NOT KNOWN YET, and the copy law bans a bracket, so they
 * are written by ROLE: the creative director who carries this into the room,
 * and the person at the client who reads it. `signature` stays off the close
 * until the second one is known. See the engagement's MEMORY.md, Open.
 */
export const HUNGRY_MINDS_PROPOSAL_ARC: ArcDef = {
  slug: "hungry-minds-proposal",
  format: "proposal",
  client: "hungry-minds",
  kind: "production",
  theme: "light",
  cardTitle: "Hungry Minds · the proposal",
  cardLede:
    "A creative strategy that writes its own briefs, for a team whose books are drawn by hand.",
  cardImage: { src: "/images/services/embedded.webp", alt: "" },
  hero: {
    eyebrow: "Proposal · Hungry Minds · September 2026",
    title: { pre: "The brief is where", em: "the work starts." },
    lede: "A proposal for Hungry Minds, from Vince Buyssens and the creative director. Three years of building AI capability inside a creative team, pointed at the part of this one that is a research problem and not a drawing problem.",
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    plate: "gateway",
    curtain: true,
    actions: [{ id: "read", label: "What AI touches", href: "#the-rule", primary: true }],
  },
  meta: {
    title: "Hungry Minds · proposal — Thoughtform",
    description:
      "A creative strategy that writes its own briefs, for a team whose books are drawn by hand.",
  },
  sections: [
    {
      id: "what-we-build",
      kind: "cards",
      menuLabel: "What we build",
      menuPrimary: true,
      columns: 4,
      head: {
        eyebrow: "Thoughtform · what is actually delivered",
        title: { pre: "What we", em: "actually build." },
        sub: "The measure of this work is what the team can do after we leave, and whether it can run at the pace of external change.",
      },
      cards: [
        {
          id: "people",
          n: "01",
          kicker: "Upskilling",
          title: "People who reach for it",
          body: "Marketers and designers who use AI the way they use Figma, because they know what it is good at and where it will confidently get things wrong.",
        },
        {
          id: "encoded",
          n: "02",
          kicker: "Encoding",
          title: "Your way of working, written down",
          body: "Brand, tone of voice, standards and what gets sent back, as plain files any new hire can read and any agent can follow.",
        },
        {
          id: "handover",
          n: "03",
          kicker: "Handover",
          title: "A setup they run themselves",
          body: "The team works the loop with their own hands before we stop showing up. Handover is a real production run, not a document.",
        },
        {
          id: "independence",
          n: "04",
          kicker: "Independence",
          title: "Running at the pace of change",
          body: "Files and their own accounts. No platform to license, no subscription to renew. When a better model ships, the setup takes it: nothing to migrate, no one to wait on.",
        },
      ],
    },
    {
      id: "loop-decided",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "Part one · Loop, 2024 to now",
      line: {
        pre: "In 2024, Loop's executive team decided the company would be",
        em: "AI-first.",
      },
      subline:
        "Creative operations was the biggest immediate win, so it became the first focus. What follows is what that decision produced, in the order it happened.",
    },
    {
      id: "films",
      kind: "films",
      menuLabel: "Films",
      menuPrimary: true,
      ariaLabel: "The above-the-line films Loop made with AI",
      head: {
        eyebrow: "Loop Earplugs · September 2025",
        title: { pre: "The first films made with AI,", em: "above the line." },
        sub: "Two thirty-second films, made end to end with AI by the same director, editor, colourist and sound team as Loop's live-action spots. On air in October, among the first brands in the world to do it.",
      },
    },
    {
      id: "studio",
      kind: "sheets",
      menuLabel: "Studio",
      ariaLabel: "Loop Studio, the output, the rule and the limit",
      head: {
        eyebrow: "Loop Earplugs · December 2025",
        title: { pre: "Every designer makes", em: "their own ads." },
        sub: "By the end of 2025 the studio produced its paid social in-house, above the return threshold, with nothing about the creative standard lowered to get there. The line and the red line are how it decides what AI may make.",
      },
    },
    {
      /* The briefing agent is the beat this whole proposal turns on, because
         the ask is a briefing system. It is Loop's own record, by reference. */
      id: "briefing-agent",
      kind: "dossier",
      menuLabel: "Own software",
      toolId: "mimir",
      legend: MODE_LEGEND.Invent,
    },
    {
      id: "four-phases",
      kind: "cards",
      menuLabel: "Four phases",
      columns: 4,
      head: {
        eyebrow: "Loop Earplugs · May 2026",
        title: { pre: "AI runs in all four phases of", em: "the creative process." },
        sub: "Every phase has its own tool and its own owner inside the team. Presented as a case study with Google at OMR Hamburg, May 2026. Each tool was written by the team that uses it and stays with Loop.",
      },
      cards: [
        {
          id: "insight",
          n: "01",
          kicker: "Insight and briefing",
          title: "Finding the insight, writing the brief",
          body: "Customer voice, performance and competitor work mined into the brief while it is written, not in a report afterwards.",
          byline: "Briefing agent · creative strategy",
        },
        {
          id: "operations",
          n: "02",
          kicker: "Operations",
          title: "Running the creative operation",
          body: "Briefs move from the board into Figma and finished assets back into the brand library, with nothing retyped in between.",
          byline: "Studio orchestrator · project management",
        },
        {
          id: "generating",
          n: "03",
          kicker: "Generating",
          title: "Making the imagery and the film",
          body: "One canvas for image and video, on the models the studio actually uses, tied to the product catalogue and the brand.",
          byline: "Image and video suite · studio",
        },
        {
          id: "translating",
          n: "04",
          kicker: "Translating",
          title: "Taking what works to every market",
          body: "Top-performing social video transcribed, translated and dubbed for thirty markets, with the human review step kept where culture matters.",
          byline: "Dubbing tool · localisation",
        },
      ],
    },
    {
      id: "turn",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "Part two · Hungry Minds",
      line: { pre: "Hungry Minds does not need", em: "three years of this." },
      subline:
        "The books, the reviews and the taste that decides what is good are already yours. We bring the order to do it in, and the method for writing a team's judgment down. And we bring one boundary, because the thing you sell is the one thing a model must not be allowed near.",
    },
    {
      /* ⚠ THE SECTION THIS PAGE EXISTS TO CARRY. It sits before the
         configuration because a reader who has not been told where the line
         is reads every later beat as a threat. Two groups, and the second is
         longer than the first on purpose. */
      id: "the-rule",
      kind: "list-groups",
      menuLabel: "What AI touches",
      menuPrimary: true,
      layout: "columns",
      head: {
        eyebrow: "Hungry Minds · the boundary, first",
        title: { pre: "What AI will, and", em: "will not, touch." },
        sub: "Your books are drawn by hand and the people who draw them are the reason anyone buys one. So the line is not drawn at a department. It is drawn at the artwork, and it is written into the prompts, the review rules and the contract, in these words.",
      },
      groups: [
        {
          id: "will",
          label: "What it makes",
          blurb:
            "The part of the work that was never the craft: reading, sorting, drafting, and photographing an object into a room.",
          items: [
            {
              id: "w-research",
              tag: "Research",
              name: "Reads every review you have ever had",
              body: "A thousand customer reviews, the crowdfunding comments, the press, sorted into what is actually being said and by whom. A person could do it. Nobody has the week.",
            },
            {
              id: "w-insight",
              tag: "Insight",
              name: "Turns what it read into records you can check",
              body: "Each one carries the customer's own sentence and a link to where it was said. An insight with no source is marked as a guess and sails as one.",
            },
            {
              id: "w-brief",
              tag: "Briefing",
              name: "Writes the brief, in your file, in your format",
              body: "The idea, why, the audience, the formats, the variants, the visual direction, the copy direction, the product and the test. Written into Figma as a page the studio can work from.",
            },
            {
              id: "w-staging",
              tag: "Staging",
              name: "Photographs the real book into a room",
              body: "The book on a stand, on a desk, among other books, handed over. The room is made. The book in it is your photograph of your book.",
            },
          ],
        },
        {
          id: "will-not",
          label: "What it never touches",
          blurb:
            "Not a scope decision that a fee could revisit. The first rule of the engagement, and the reason the rest of it is safe to run.",
          items: [
            {
              id: "n-art",
              tag: "The artwork",
              name: "No illustration is ever generated",
              body: "Not drawn, not extended, not restyled, not cleaned up, not used as a style to imitate. Not as a test, not as a demonstration of what not to do.",
            },
            {
              id: "n-pages",
              tag: "The pages",
              name: "Nothing generated is ever open",
              body: "No page, no spread, no chapter opener. Every instruction says the book is closed, and a picture showing a page is thrown away rather than argued about.",
            },
            {
              id: "n-cover",
              tag: "The cover",
              name: "The cover is copied, never invented",
              body: "The engraving, the spine and the case come from your photographs. When a picture gets them wrong, your photograph is put back over it in code. The drawing is never improved.",
            },
            {
              id: "n-people",
              tag: "The illustrators",
              name: "No one is replaced, and no one is imitated",
              body: "The artists keep the work that is theirs. Nothing in this engagement produces an image that could be mistaken for something they drew.",
            },
            {
              id: "n-words",
              tag: "The words",
              name: "No customer is ever quoted who did not speak",
              body: "A testimonial on a frame is a real sentence from a real review, with a link. A figure is a figure you have confirmed, or it is not on the frame.",
            },
          ],
        },
      ],
      closing:
        "Loop settled the same question with one line, and it has held for two years: an image that makes an identity claim about the brand is shot for real, and an image that illustrates a scenario can be generated, so the function of the image decides. Here the line sits one step further back, because here the identity claim is the drawing itself.",
    },
    {
      id: "configuration",
      kind: "configuration",
      menuLabel: "The setup",
      menuPrimary: true,
      ariaLabel: "The AI capability the Hungry Minds team would own",
      head: {
        eyebrow: "Hungry Minds · what the team owns",
        title: { pre: "AI capability", em: "your team owns." },
        sub: "One setup that your team runs and keeps building after we leave. Adoption writes the layer, automation runs on it. Pick a workstream to see how the same layer is read differently.",
      },
      owner: "Owned by Hungry Minds",
      layer: [
        { id: "rules", tag: "Rules", name: "how the team decides" },
        { id: "examples", tag: "Examples", name: "what good looks like" },
        { id: "sources", tag: "Sources", name: "what it can read" },
        { id: "loops", tag: "Loops", name: "who confirms it" },
      ],
      seam: {
        adoption: "The team learns on its own work and writes down what good looks like.",
        automation: "The layer runs inside the tools they already use, and hands the time back.",
      },
      teams: [
        {
          id: "strategy",
          name: "Strategy and briefing",
          work: "research to brief, M1",
          layers: ["rules", "examples", "sources", "loops"],
          owner: "The creative director, the last gate",
          runs: "The strategy Skill, on your own keys",
          bar: "A brief the studio can act on, grounded in a review you can open",
          reach: "Your reviews, your results, and the brand's own words",
          where: "Claude, writing into Figma",
        },
        {
          id: "composition",
          name: "Composition",
          work: "brief to four variants, M2",
          layers: ["rules", "examples", "loops"],
          owner: "The designers, with the creative director",
          runs: "The briefing template and the composition Skill",
          bar: "Variants that differ on a declared axis and sit inside the safe zones",
          reach: "The brief, the photography, and the illustrations exactly as they are",
          where: "Figma, with Claude connected",
        },
        {
          id: "staging",
          name: "Staging imagery",
          work: "the room, never the drawing, M2",
          layers: ["rules", "examples", "sources", "loops"],
          owner: "The creative director, with a veto from the artists",
          runs: "The staging Skill",
          bar: "The real book in a made room, the artwork untouched",
          reach: "Your product photography. Never the artwork",
          where: "Claude, with image generation",
        },
      ],
      next: { name: "Localisation", work: "six languages, the next workstream" },
      kickers: ["One configuration", "The people run it", "No vendor in the way"],
    },
    {
      id: "phases",
      kind: "list-groups",
      menuLabel: "Phases",
      menuPrimary: true,
      layout: "plates",
      head: {
        eyebrow: "Hungry Minds · the shape of the work",
        title: { pre: "We propose a modular approach", em: "that compounds." },
        sub: "The process from research to finished ad has many moving parts, so the work is built in modules: your team can take the low-hanging fruit first, or run them in parallel. The first module is the heaviest, and it stands on its own.",
      },
      groups: [
        {
          id: "m1",
          label: "M1 · about four weeks",
          blurb: "Creative strategy and the briefing system",
          items: [
            {
              id: "m1w1",
              tag: "Week 1 · on site",
              name: "Kickoff, and the setup on your own stack",
              body: "Configured with the team, in Figma and Claude. The research record opened and the first customer reviews read into it",
            },
            {
              id: "m1w2",
              tag: "Week 2",
              name: "Insight records, personas and the first concept slate",
              body: "What your customers actually said, with the sentence and the source kept. The first briefs written into Figma by Claude",
            },
            {
              id: "m1w3",
              tag: "Week 3",
              name: "The team runs research to brief without us",
              body: "Four experiments briefed by whoever writes briefs now, on their own keys",
            },
            {
              id: "m1w4",
              tag: "Week 4",
              name: "Review, and the rules written from what came back",
              body: "What the creative director says twice becomes a check the system applies before anyone opens a page",
            },
          ],
          foot: {
            label: "Deliverable",
            lines: [
              "The research record, the insight records and the briefing system in Figma",
              "A team that briefs on its own",
            ],
          },
        },
        {
          id: "m2",
          label: "M2 · about three weeks",
          blurb: "Composition, variants and staging",
          items: [
            {
              id: "m2w1",
              tag: "Week 1",
              name: "Visual and semantic analysis of what already ran",
              body: "Art direction, layout and copy conventions codified into the system as rules the brief can call on",
            },
            {
              id: "m2w2",
              tag: "Week 2",
              name: "Brief to four variants, inside the template",
              body: "Formats, safe zones and copy slots tested by the designers in real time, and the results encoded",
            },
            {
              id: "m2w3",
              tag: "Week 3",
              name: "The staging lane, under the rule",
              body: "The real book photographed into rooms it was never in, graded against your own photographs before anyone sees it",
            },
          ],
          foot: {
            label: "Deliverable",
            lines: [
              "Compounding layers for ad creation, and a staging setup with its boundary written in",
              "A team that runs M1 and M2 on its own",
            ],
          },
        },
        {
          id: "m3",
          label: "M3 · about three weeks",
          blurb: "Creative operations and scaling",
          items: [
            {
              id: "m3w1",
              tag: "Week 1",
              name: "All layers unified in one production-ready workflow",
              body: "Results come back as the next brief, joined to the letter that earned them",
            },
            {
              id: "m3w2",
              tag: "Week 2",
              name: "Localisation across the languages you sell in",
              body: "What works in one market taken to the others, with the human review step kept where culture matters",
            },
            {
              id: "m3w3",
              tag: "Week 3",
              name: "Handover workshop",
              body: "A real production run with the team's own hands, then check-ins at one and three months",
            },
          ],
          foot: {
            label: "Deliverable",
            lines: [
              "A working setup: research in, brief out, results back in",
              "A blueprint for scaling beyond the creative team",
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
        eyebrow: "Hungry Minds · inside every phase",
        title: { pre: "How we work together,", em: "inside every phase." },
        sub: "One loop, run with your team. We set it up in week one, then run it beside them until they are running it without us.",
      },
      groups: [
        {
          id: "loop",
          label: "The loop, on one workstream",
          blurb: "The briefing workstream, M1. Composition and staging follow on the same loop.",
          items: [
            {
              id: "owns",
              tag: "Who owns it",
              name: "The creative director, and whoever writes briefs",
              body: "The creative director decides what passes. The brief writers run the rounds themselves.",
            },
            {
              id: "runs",
              tag: "What runs it",
              name: "Your Skills, in Claude",
              body: "The research, the insight records, the brand rules and the review rules as plain files, on your own keys.",
            },
            {
              id: "bar",
              tag: "The bar",
              name: "The creative director's rubric, in their words",
              body: "Every brief is graded against it before anyone opens a page. What they say twice becomes a check.",
            },
            {
              id: "where",
              tag: "Where it runs",
              name: "Figma, and the files you already have",
              body: "Claude connected to Figma, to your reviews and to your product facts.",
            },
          ],
        },
        {
          id: "people",
          label: "In the loop, and how much",
          blurb: "Who is in the room, and what it costs them in time.",
          items: [
            {
              id: "director",
              tag: "Hungry Minds",
              name: "The creative director, and the last gate",
              body: "Writes the review rules in their own words in week one, then grades every round.",
              meta: "Two half-days a week",
            },
            {
              id: "writers",
              tag: "Hungry Minds",
              name: "Whoever writes the briefs today",
              body: "In every session from day one. From week two they run the rounds themselves.",
              meta: "Two sessions a week, then their normal week",
            },
            {
              id: "founders",
              tag: "Hungry Minds",
              name: "A founder, on ambition, volume and channels",
              body: "The kickoff interviews and one review at the end of each phase.",
              meta: "One session a phase",
            },
            {
              id: "vince",
              tag: "Thoughtform",
              name: "Vince, on AI and creative technology",
              body: "On site for week one, then encoding what comes back from the reviews. By the third phase, watching.",
              meta: "Week one full time, then two sessions a week",
            },
            {
              id: "cd",
              tag: "Thoughtform",
              name: "The creative director on our side",
              body: "Carries the creative argument, and sits with the founders on how the team changes as the work does.",
              meta: "Each phase",
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
        eyebrow: "Hungry Minds · the terms of the work",
        title: { pre: "What we need, and", em: "what you keep." },
        sub: "Four dependencies. Six things that stay behind when we stop showing up.",
      },
      groups: [
        {
          id: "needs",
          label: "What this needs from Hungry Minds",
          items: [
            {
              id: "reviews",
              tag: "01",
              name: "Your reviews, exported",
              body: "The research is built from what your own customers wrote. Public reviews get us a sample; the export turns a sample into a measurement.",
            },
            {
              id: "ads",
              tag: "02",
              name: "The ad account, or a read of it",
              body: "Without it we can say what to test but not what already worked. Until it arrives, those parts of the record stay marked empty rather than guessed at.",
            },
            {
              id: "access",
              tag: "03",
              name: "Access",
              body: "Figma, plus the accounts and API access. Opened in your name so nothing needs migrating later.",
            },
            {
              id: "time",
              tag: "04",
              name: "Stakeholder time",
              body: "A founder and the creative director for interviews and sign-off. The review time is what the rubric learns from, so it is not optional.",
            },
          ],
        },
        {
          id: "keeps",
          label: "What Hungry Minds has at the end",
          items: [
            {
              id: "research",
              tag: "Keeps",
              name: "The research record",
              body: "What your customers said, sorted, with every sentence traceable to where it was said.",
            },
            {
              id: "skills",
              tag: "Keeps",
              name: "Claude Skills",
              body: "Strategy, briefing, composition and staging. Brand, tone of voice and the review rules, as files.",
            },
            {
              id: "template",
              tag: "Keeps",
              name: "The briefing system in Figma",
              body: "A template, and the route that writes a brief into it from a sentence.",
            },
            {
              id: "workflow",
              tag: "Keeps",
              name: "A tested workflow",
              body: "Best practice and red flags earned through graded rounds, not assumed.",
            },
            {
              id: "team",
              tag: "Keeps",
              name: "A team that runs it",
              body: "Half a day on a real production run, then check-ins at one and three months.",
            },
            {
              id: "nodep",
              tag: "Keeps",
              name: "No dependency",
              body: "No platform to license, no retainer, nothing that breaks if we stop answering.",
            },
          ],
        },
      ],
    },
    {
      id: "pricing",
      kind: "cards",
      menuLabel: "Pricing",
      columns: 4,
      ledger: { columns: ["Phase", "What", "Fee"] },
      head: {
        eyebrow: "Hungry Minds · the fee",
        title: { pre: "Priced", em: "one phase at a time." },
        sub: "Each phase is a stage gate, priced on its own, so nothing beyond it is committed until it has earned the next.",
      },
      cards: [
        {
          id: "fee-m1",
          kicker: "M1",
          title: "£10,000",
          body: "Creative strategy and the briefing system",
        },
        {
          id: "fee-m2",
          kicker: "M2",
          title: "+£15,000",
          body: "Composition, variants and staging",
        },
        {
          id: "fee-m3",
          kicker: "M3",
          title: "+£20,000",
          body: "Creative operations, results and localisation",
        },
        {
          id: "fee-total",
          kicker: "Total",
          title: "£45,000",
          body: "If all three phases are commissioned",
        },
      ],
      footnote:
        "M1 stands on its own. If Hungry Minds stops after it, the team still has the research record, the insight records and a briefing system that writes into Figma.",
      tips: [
        {
          id: "separate",
          tag: "Commitment",
          body: "Each phase is a separate decision, and nothing beyond M1 is committed upfront. If M1 shows that localisation or organic is the nearer-term need, we say so before pricing anything else.",
        },
        {
          id: "expenses",
          tag: "Expenses",
          body: "Travel at cost. Model and API usage billed to Hungry Minds directly by the providers, typically low hundreds per month at this volume.",
        },
        {
          id: "owns",
          tag: "Ownership",
          body: "Hungry Minds owns its configured setup, its Skills, its research and its outputs outright. The underlying method is not exclusive.",
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
        title: { pre: "Two people, and one of them", em: "did this at Loop." },
        sub: "One built the capability inside a creative team. The other carries the creative argument into the room.",
      },
      cards: [
        {
          id: "vince",
          kicker: "AI and creative technology",
          title: "Vince Buyssens",
          body: "Built Loop's AI capability inside its creative team over three years, and now leads its company-wide AI transformation. Runs the workshops, the encoding and the graded rounds.",
        },
        {
          id: "cd",
          kicker: "Creative direction",
          title: "The creative director",
          body: "Brings the relationship, the read on the work and the judgment about what this brand can and cannot do. Sits with the founders on how the team changes as the work does.",
        },
      ],
    },
    {
      id: "next-steps",
      kind: "cards",
      menuLabel: "Next steps",
      columns: 3,
      head: {
        eyebrow: "Hungry Minds · from here",
        title: { pre: "Next", em: "steps." },
        sub: "Three of them, and the first one has already been arranged.",
      },
      cards: [
        {
          id: "meeting",
          n: "01",
          title: "The conversation next week",
          body: "Where the boundary gets agreed before anything else does. Nothing in this proposal survives a no on that.",
        },
        {
          id: "access",
          n: "02",
          title: "The reviews and the ad account",
          body: "Two exports. They are what turns a sample into a measurement, and they take longer to arrange than to use.",
        },
        {
          id: "kickoff",
          n: "03",
          title: "Kick off M1",
          body: "The setup in on day one. First briefs in your own Figma file by the end of week two.",
        },
      ],
    },
    {
      id: "appendix",
      kind: "list-groups",
      menuLabel: "Appendix",
      layout: "columns",
      head: {
        eyebrow: "Appendix",
        title: { pre: "Why not just ask", em: "a chatbot for briefs?" },
        sub: "Because it would be the same models either way. The question is not which model writes the sentence. It is what the sentence was written from, and where the answer goes when the tab is closed.",
      },
      groups: [
        {
          id: "chat",
          label: "A chat window, open in another tab",
          blurb: "What it costs, and where it leaves the work.",
          items: [
            {
              id: "c-pay",
              tag: "What you pay for",
              name: "A seat per person, per month, for as long as you use it",
            },
            {
              id: "c-where",
              tag: "Where the work happens",
              name: "In the tab. The answer is copied out and pasted into Figma by hand",
            },
            {
              id: "c-reads",
              tag: "What it reads",
              name: "Whatever was pasted into it, and nothing else about you",
            },
            {
              id: "c-better",
              tag: "How it gets better",
              name: "It does not. Each conversation starts from nothing",
            },
            {
              id: "c-record",
              tag: "Who holds the record",
              name: "Nobody. The reasoning goes when the tab does",
            },
            {
              id: "c-line",
              tag: "Where the line is",
              name: "Wherever the person typing decides that day",
            },
          ],
        },
        {
          id: "own",
          label: "Your own configuration",
          blurb: "Claude, on your keys, reading your own material.",
          items: [
            {
              id: "o-pay",
              tag: "What you pay for",
              name: "The setup and the adoption, once. Model usage at cost. No seats",
            },
            {
              id: "o-where",
              tag: "Where the work happens",
              name: "In your Figma file, as a page the studio can work from",
            },
            {
              id: "o-reads",
              tag: "What it reads",
              name: "Your reviews, your results, your brand rules and what worked last time",
            },
            {
              id: "o-better",
              tag: "How it gets better",
              name: "What the creative director says twice becomes a check the system applies",
            },
            {
              id: "o-record",
              tag: "Who holds the record",
              name: "You do. Every brief traces to the review that caused it",
            },
            {
              id: "o-line",
              tag: "Where the line is",
              name: "Written into the files, so it holds when nobody is watching",
            },
          ],
        },
      ],
      closing:
        "A chat window is a good tool and it stays available. The question is where your team's judgment ends up: in a tab that closes, or written down in your own setup, where the next person to join inherits it.",
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "Close",
      head: {
        title: { pre: "Talk it", em: "through." },
        sub: "Questions on any of it, or a date for the on-site week.",
      },
      actions: [
        {
          id: "vince",
          label: "Vince Buyssens",
          href: "mailto:vince@thoughtform.co",
          primary: true,
        },
        { id: "home", label: "thoughtform.co", href: "/" },
      ],
      footerLine: "Thoughtform · Proposal for Hungry Minds · September 2026.",
    },
  ],
};
