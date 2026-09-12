import type { ArcDef } from "../types";

import { MODE_LEGEND } from "./shared/loop-tools";

/**
 * Suri — the proposal, as an arc (ADR-098).
 *
 * The proposal deck this repo's owner built as a local HTML file, moved
 * onto the site, because the site's own frame is the argument (ADR-093's
 * finding, one surface later). The deck stays where it is for a client who
 * asks for a file; the page is the deliverable.
 *
 * ⚠ IT IS ADDRESSED TO ONE READER, so it prints the fee, the names and the
 * dates — and it is therefore deliberately OUTSIDE `ENVELOPE_ARCS`, whose
 * job is a page forwarded to strangers. Unlisted and noindexed like every
 * arc; anyone holding the link can read it, which is the same exposure the
 * pitch page already carries and the reason nothing here is a secret.
 *
 * ⚠ THE PROOF IS LOOP'S, BY REFERENCE. The films, the studio's sheets and
 * the briefing agent are `films` / `sheets` / `dossier` beats that resolve
 * the casefile's own records — so the evidence a prospect reads is the
 * evidence the portfolio and the landing carry, and a correction lands in
 * one place. Nothing about Loop is retyped here; the frames around them are
 * this page's own.
 *
 * ⚠ COPY LAW (the deck's, and this surface's): titles are names or the
 * question the reader is about to ask; say the behaviour rather than naming
 * it; no italics, no em dashes, nothing from the fleet's vocabulary. The
 * savings figures Rob carries are his and unverified, so they are not on
 * the page.
 */
export const SURI_PROPOSAL_ARC: ArcDef = {
  slug: "suri-proposal",
  format: "proposal",
  client: "suri",
  /* Light, like the pitch page: this is composed on paper and there is no
     dark reading of it. ⚠ The route's row in `LIGHT_LOCKED_ROUTES` is the
     other half, added by hand — the registry test fails without it. */
  theme: "light",
  cardTitle: "Suri · the proposal",
  cardLede:
    "Three phases that leave Suri's creative team running its own imagery, on its own keys.",
  /* The house key visual until Suri approves something of their own. The
     ask for brand imagery is open with the client; a product shot nobody
     has signed off does not go on a page with their name at the top. */
  cardImage: { src: "/images/services/embedded.webp", alt: "" },
  hero: {
    eyebrow: "Proposal · Suri · September 2026",
    title: { pre: "Creative teams that", em: "scale themselves." },
    lede: "A proposal for Suri, from Rob Weston and Vince Buyssens. Three years of building AI capability inside Loop's creative team, turned into three phases for Suri's own team.",
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    /* The landing's plate, delivered the landing's way (ADR-075), which is
       what earns the route its `HERO_ROUTES` row and drops the static
       preload. The curtain is declared rather than inherited (ADR-078 U1):
       the choreography is a decision, the plate only answers for paint. */
    plate: "gateway",
    curtain: true,
    actions: [{ id: "read", label: "The configuration", href: "#configuration", primary: true }],
  },
  meta: {
    title: "Suri · proposal — Thoughtform",
    description:
      "Three phases that leave Suri's creative team running its own imagery, on its own keys.",
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
          body: "Designers who use AI the way they use Figma, because they know what it is good at and where it will confidently get things wrong.",
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
      /* The reel, by reference (`LOOP_ATL_FILMS`). ⚠ The head says what the
         films WERE, not what they saved: the cost and duration figures are
         Rob's, unverified, and a number a client could quote back is not
         something to put on a page on somebody else's authority. */
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
      /* The studio's three sheets, by reference: the ads, the rule and the
         red line. Half of what a creative team has to trust is what the
         setup is NOT allowed to make, which is why the sheets travel rather
         than a grid of output. */
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
      /* One tool, drawn from its own record. Mímir because it is the one a
         creative team recognises: the brief is where their work starts. */
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
      id: "suri-turn",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "Part two · Suri",
      line: { pre: "Suri does not need", em: "three years of this." },
      subline:
        "The products, the brand and the review taste are already Suri's. We bring the order to do it in, and the method for writing a team's judgment down. The tools wrapping the models change every quarter, and every subscription is a bet on one of them. What lasts is a team that works the models directly.",
    },
    {
      /* The drawing the whole proposal turns on: what Suri's team ends up
         owning, and what changes when the next workflow joins it. */
      id: "configuration",
      kind: "configuration",
      menuLabel: "The setup",
      menuPrimary: true,
      ariaLabel: "The AI capability Suri's team would own",
      head: {
        eyebrow: "Suri · what the team owns",
        title: { pre: "AI capability", em: "your team owns." },
        sub: "One setup that Suri's team runs and keeps building after we leave. Adoption writes the layer, automation runs on it. Pick a workstream to see how the same layer is read differently.",
      },
      owner: "Owned by Suri",
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
          id: "imagery",
          name: "Imagery",
          work: "stills and video, M1",
          layers: ["rules", "examples", "sources", "loops"],
          owner: "Kate, the last gate",
          runs: "The imagery Skill, on Suri's keys",
          bar: "On-brand, graded before Kate opens the sheet",
          reach: "Suri's products and brand definition",
          where: "Claude, with image generation",
        },
        {
          id: "composition",
          name: "Composition",
          work: "layout, type and motion, M2",
          layers: ["rules", "examples", "loops"],
          owner: "Kate, with the creative team",
          runs: "The composition Skill",
          bar: "Layout, type and CTA that pass the rubric",
          reach: "The approved frames and the design standards",
          where: "Claude, connected to Figma",
        },
        {
          id: "ads",
          name: "Ads",
          work: "brief to finished ad, M3",
          layers: ["rules", "sources", "loops"],
          owner: "Whoever writes the brief",
          runs: "The briefing Skill",
          bar: "A finished ad, on brand, from one brief",
          reach: "The imagery and composition Skills, the product facts",
          where: "Claude, where the brief is written",
        },
      ],
      next: { name: "[Next team]", work: "the next workflow" },
      kickers: ["One configuration", "The people run it", "No vendor in the way"],
    },
    {
      /* The deck draws this as a rail. On this surface a drawing plots
         something that HAPPENED (ADR-078 U1), and a plan has not happened
         yet — so the three phases are the deck's own plan table, as three
         columns, with the outcome as each column's last ruled row. */
      id: "phases",
      kind: "list-groups",
      menuLabel: "Phases",
      menuPrimary: true,
      layout: "columns",
      head: {
        eyebrow: "Suri · the shape of the work",
        title: { pre: "We propose running this in", em: "three phases." },
        sub: "Discovery, imagery and video first, then composition, then ads and the handover. One motion leads each phase, and M2 and M3 firm up once M1 discovery has told us what they should be.",
      },
      groups: [
        {
          id: "m1",
          label: "M1 · Discovery, imagery and video",
          blurb: "Navigate leads. Weeks 1 to 3, building the intuition on Suri's own work.",
          items: [
            {
              id: "m1w1",
              tag: "Week 1",
              name: "On site",
              body: "Kickoff with Mark, Kate and Nick. The systems mapped, and the setup stood up with the designers.",
            },
            {
              id: "m1w2",
              tag: "Week 2",
              name: "Brand and tone of voice encoded, in Kate's words",
              body: "First imagery waves, run by the designers, graded with Kate in the room.",
            },
            {
              id: "m1w3",
              tag: "Week 3",
              name: "First video: approved stills animated into simple clips",
              body: "M1 review with Mark.",
            },
            {
              id: "m1out",
              tag: "Outcome",
              name: "Imagery Skill and first clips live",
              meta: "About three weeks",
            },
          ],
        },
        {
          id: "m2",
          label: "M2 · Composition",
          blurb: "Encode leads. Weeks 4 to 6, writing down the judgment the team is already using.",
          items: [
            {
              id: "m2w1",
              tag: "Week 1",
              name: "Kickoff workshop: the team reviews M1 output",
              body: "Designers begin layout, type and CTA in Figma.",
            },
            {
              id: "m2w2",
              tag: "Week 2",
              name: "Iteration workshops",
              body: "Guardrails encoded from what Kate sends back. Simple animations composed into the formats.",
            },
            {
              id: "m2w3",
              tag: "Week 3",
              name: "The designers run composition alone",
              body: "M2 review with Mark.",
            },
            {
              id: "m2out",
              tag: "Outcome",
              name: "Composition Skill encoded",
              meta: "About three weeks",
            },
          ],
        },
        {
          id: "m3",
          label: "M3 · Ads and handover",
          blurb: "Build leads. Weeks 7 to 9, handing the system over while we watch.",
          items: [
            {
              id: "m3w1",
              tag: "Week 1",
              name: "Workshop: the team builds the briefing Skill with us",
              body: "Structure and above-the-line session, Rob and Mark.",
            },
            {
              id: "m3w2",
              tag: "Week 2",
              name: "A designer takes a brief to a finished ad, tested",
              body: "The handover pack: files, rubric and record, on Suri's keys.",
            },
            {
              id: "m3w3",
              tag: "Week 3",
              name: "Handover workshop: the team runs it, we watch",
              body: "Then it scales: the next asset type, campaign and team.",
            },
            {
              id: "m3out",
              tag: "Outcome",
              name: "Handover complete, ready to scale",
              meta: "About three weeks",
            },
          ],
        },
      ],
      closing:
        "M2 and M3 are our current view of the work. They confirm at the end of M1, when discovery has said what they should be.",
    },
    {
      id: "how-we-work",
      kind: "list-groups",
      menuLabel: "The loop",
      layout: "columns",
      head: {
        eyebrow: "Suri · inside every phase",
        title: { pre: "How we work together,", em: "inside every phase." },
        sub: "One loop, run with Suri's team. We set it up in week one, then run it beside them until they are running it without us.",
      },
      groups: [
        {
          id: "loop",
          label: "The loop, on one workstream",
          blurb: "The imagery workstream, M1. Composition and briefing follow on the same loop.",
          items: [
            {
              id: "owns",
              tag: "Who owns it",
              name: "Kate, and the designers",
              body: "Kate decides what passes. The designers run the waves themselves.",
            },
            {
              id: "runs",
              tag: "What runs it",
              name: "Suri's Skills, in Claude",
              body: "Brand, tone of voice and the review rules as files, on Suri's own keys. The imagery Skill first.",
            },
            {
              id: "bar",
              tag: "The bar",
              name: "Kate's rubric, in her words",
              body: "Every frame is graded against it before she opens the sheet. What she says twice becomes a check.",
            },
            {
              id: "where",
              tag: "Where it runs",
              name: "Figma and the image models",
              body: "Claude connected to Figma, to the image models, and to Suri's product facts.",
            },
          ],
        },
        {
          id: "people",
          label: "In the loop, and how much",
          blurb: "Who is in the room, and what it costs them in time.",
          items: [
            {
              id: "kate",
              tag: "Suri",
              name: "Kate, creative lead and the last gate",
              body: "Writes the review rules in her words in week one, then grades every wave.",
              meta: "Two half-days a week",
            },
            {
              id: "designers",
              tag: "Suri",
              name: "The designers, who make the work",
              body: "In every session from day one. From week two they run the waves themselves.",
              meta: "Two sessions a week, then their normal week",
            },
            {
              id: "leads",
              tag: "Suri",
              name: "Mark and Nick, on ambition, volume and channels",
              body: "The kickoff interviews and one review at the end of each phase.",
              meta: "One session a phase",
            },
            {
              id: "vince",
              tag: "Thoughtform",
              name: "Vince, on AI and creative technology",
              body: "On site for week one, then encoding what Kate sends back. By the third phase, watching.",
              meta: "Week one full time, then two sessions a week",
            },
            {
              id: "rob",
              tag: "Thoughtform",
              name: "Rob, on strategic marketing and culture",
              body: "The sessions with Mark on structure and how the team changes as the work does.",
              meta: "With Mark, each phase",
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
        eyebrow: "Suri · the terms of the work",
        title: { pre: "What we need, and", em: "what you keep." },
        sub: "Three dependencies. Six things that stay behind when we stop showing up.",
      },
      groups: [
        {
          id: "needs",
          label: "What this needs from Suri",
          items: [
            {
              id: "brand",
              tag: "01",
              name: "Brand definition",
              body: "Works best where identity, tone of voice and guidelines exist. Where they do not, defining them becomes part of M1 and affects pace.",
            },
            {
              id: "access",
              tag: "02",
              name: "Access",
              body: "Figma, plus the accounts and API access for image generation. Opened in Suri's name so nothing needs migrating later.",
            },
            {
              id: "time",
              tag: "03",
              name: "The creative team's time",
              body: "Kate and the designers are in every working session: this is done with them, not for them. Kate's grading is what the rubric learns from.",
            },
          ],
        },
        {
          id: "keeps",
          label: "What Suri has at the end",
          items: [
            {
              id: "setup",
              tag: "Keeps",
              name: "The configuration",
              body: "Claude, Figma and image generation in Suri's environment, on Suri's keys.",
            },
            {
              id: "skills",
              tag: "Keeps",
              name: "Claude Skills",
              body: "Brand, tone of voice, design standards and the review rules.",
            },
            {
              id: "workflow",
              tag: "Keeps",
              name: "A tested workflow",
              body: "Best practice and red flags earned through graded waves, not assumed.",
            },
            {
              id: "assets",
              tag: "Keeps",
              name: "Assets at volume",
              body: "On-brand and ready for paid social. Composition still takes human oversight.",
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
      menuPrimary: true,
      columns: 4,
      head: {
        eyebrow: "Suri · the fee",
        title: { pre: "Priced", em: "one phase at a time." },
        sub: "Twenty thousand a phase. M1 is scoped and priced now. M2 and M3 are our current view, and they confirm at the end of M1.",
      },
      cards: [
        {
          id: "fee-m1",
          kicker: "M1",
          title: "£20,000",
          body: "Discovery, imagery and video. Scoped and priced now.",
        },
        {
          id: "fee-m2",
          kicker: "M2",
          title: "+£20,000",
          body: "Composition. Confirms at the end of M1.",
        },
        {
          id: "fee-m3",
          kicker: "M3",
          title: "+£20,000",
          body: "Ads and handover. Confirms at the end of M2.",
        },
        {
          id: "fee-total",
          kicker: "Total",
          title: "£60,000",
          body: "If all three phases are commissioned. M1 stands on its own: stop after it and the team still has a working imagery setup and the Skills behind it.",
        },
      ],
      /* ⚠ THE TAGS ARE CHIPS, NOT SENTENCES. `.arc-tips__tag` is a nowrap
         chip in a 120-160px column, so a tag written as a clause overruns
         its own column and prints through the body beside it (measured on
         the first capture). The clause belongs in the body. */
      tips: [
        {
          id: "separate",
          tag: "Commitment",
          body: "Each phase is a separate decision, and nothing beyond M1 is committed upfront. If M1 shows that video or localisation is the nearer-term need, we say so before pricing anything else.",
        },
        {
          id: "expenses",
          tag: "Expenses",
          body: "Travel at cost. Model and API usage billed to Suri directly by the providers, typically low hundreds per month at this volume.",
        },
        {
          id: "owns",
          tag: "Ownership",
          body: "Suri owns its configured setup, its Skills and its outputs outright. The underlying method is not exclusive to Suri.",
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
          body: "Built Loop's AI capability inside its creative team over three years, and now leads its company-wide AI transformation. Runs the workshops, the encoding and the graded waves.",
        },
        {
          id: "rob",
          kicker: "Commercial and organisation",
          title: "Rob Weston",
          body: "Ran the Commercial and Marketing teams at Loop and sat on the executive team that decided, in 2024, to make Loop AI-first. Focuses on organisation, process, governance and the senior stakeholder relationships.",
        },
      ],
    },
    {
      id: "next-steps",
      kind: "cards",
      menuLabel: "Next steps",
      columns: 3,
      head: {
        eyebrow: "Suri · from here",
        title: { pre: "Next", em: "steps." },
        sub: "Three of them, and the first is a date in a diary.",
      },
      cards: [
        {
          id: "onsite",
          n: "01",
          title: "Confirm the on-site week",
          body: "Five days in London. We work around Kate's availability first.",
        },
        {
          id: "prep",
          n: "02",
          title: "Short prep calls",
          body: "An hour each with Mark, Kate and Nick, so week one starts with the questions already asked.",
        },
        {
          id: "kickoff",
          n: "03",
          title: "Kick off M1",
          body: "The setup in on day one. First graded imagery wave by the end of week two.",
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
        title: { pre: "Why not just subscribe to", em: "a generation tool?" },
        sub: "Because the same models sit behind both. A subscription rents your team a front end to them. This puts them inside the tools the team already uses, on Suri's own keys, learning from Suri's own work.",
      },
      groups: [
        {
          id: "subscription",
          label: "A generation tool on subscription",
          blurb: "What a seat buys, and where it leaves the work.",
          items: [
            {
              id: "s-pay",
              tag: "What you pay for",
              name: "A seat per person, per month, for as long as you use it",
            },
            {
              id: "s-where",
              tag: "Where the work happens",
              name: "In their app. The prompt is written somewhere else and pasted in",
            },
            {
              id: "s-keys",
              tag: "Who holds the keys",
              name: "They do. History and settings live in their account",
            },
            {
              id: "s-models",
              tag: "Which models",
              name: "The frontier models, behind their front end",
            },
            {
              id: "s-new",
              tag: "When a better model ships",
              name: "When they add it",
            },
            {
              id: "s-better",
              tag: "How it gets better",
              name: "A prompt enhancer of its own, kept apart from the Claude your team talks to",
            },
          ],
        },
        {
          id: "own",
          label: "Your own configuration",
          blurb: "Claude, on Suri's keys, inside the tools the team already has open.",
          items: [
            {
              id: "o-pay",
              tag: "What you pay for",
              name: "The setup and the adoption, once. Model usage at cost. No seats",
            },
            {
              id: "o-where",
              tag: "Where the work happens",
              name: "Inside Claude and Figma, where the team already works",
            },
            {
              id: "o-keys",
              tag: "Who holds the keys",
              name: "Suri does. Files, accounts and outputs stay Suri's",
            },
            {
              id: "o-models",
              tag: "Which models",
              name: "The same frontier models, called directly, with Claude running them",
            },
            {
              id: "o-new",
              tag: "When a better model ships",
              name: "The setup takes it. A new key, not a new tool",
            },
            {
              id: "o-better",
              tag: "How it gets better",
              name: "The Claude your team already uses, with its memory of your work and your written rules",
            },
          ],
        },
      ],
      closing:
        "A subscription tool is a good tool, and it stays available: connect it and the team's own setup gets smarter either way. The question is where Suri's judgment ends up, in a vendor's account or written down in Suri's own setup, where the next team inherits it.",
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
        { id: "rob", label: "Rob Weston", href: "mailto:weston.rob@gmail.com" },
      ],
      footerLine: "Thoughtform · Proposal for Suri · September 2026.",
      signature: "Prepared for Mark Rushmore.",
    },
  ],
};
