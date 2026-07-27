import type { ArcDef } from "../types";

/**
 * Claude workshop arc — port of Shards `/claude-workshop-v1`
 * (01_thoughtform_shards). Section order follows the Shards mount order;
 * the interactive machinery (role filter, carousel, parallax pairs, the
 * live composer) is flattened onto static primitives per ADR-052
 * Mapping A. Copy is verbatim from the Shards page consts and content
 * modules (`content/intelligence-layer.ts`, `content/operator.ts`,
 * `content/skills-deck.ts`, `content/claude-workshop.ts`); the
 * EncodingInterstitial (mounted on the page but absent from the mapping
 * table) ports as the `encoding` interstitial.
 */
export const CLAUDE_WORKSHOP_ARC: ArcDef = {
  slug: "claude-workshop",
  format: "workshop",
  cardTitle: "The Claude workshop",
  cardLede:
    "A hands-on getting-started chapter — the right toggles, the right models, connectors, and your first Skills.",
  cardImage: { src: "/images/services/workshop.webp", alt: "Claude workshop" },
  hero: {
    eyebrow: "Thoughtform · Claude workshop",
    title: { pre: "The intelligence layer for AI", em: "inside the work." },
    lede: "Every team’s way of working, encoded into a layer any AI can use. Built inside the work, owned by the team, survives any model change.",
    actions: [
      { id: "see-layer", label: "See the layer", href: "#substrate-map", primary: true },
      { id: "receipts", label: "See the receipts", href: "#skills-engine" },
    ],
    image: { src: "/images/Gateway_v1b.webp", alt: "", width: 2880, height: 1620 },
  },
  meta: {
    title: "Claude workshop — Thoughtform",
    description:
      "A hands-on Claude working session: settings, models, connectors, and your first Skills.",
  },
  sections: [
    {
      id: "diagnosis",
      kind: "cards",
      menuLabel: "Diagnosis",
      head: {
        title: { pre: "We have the know-how,", em: "but it isn’t compounding yet." },
        sub: "The know-how lives in heads, and the system can’t see it. So every new tool, hire, or model has to learn the work from scratch.",
      },
      cards: [
        {
          id: "hooks",
          kicker: "Creative Strategy · Hook Synthesis",
          title: "Every campaign restarts hook ideation from zero.",
          body: "Strategists fan out hook ideas from memory, not from evidence. The same Reddit threads and review quotes get re-mined every brief. Hooks ship without a desire, a funnel stage, or a customer-language anchor.",
        },
        {
          id: "personas",
          kicker: "Creative Strategy · Persona Mining",
          title: "Personas live in slides, not in retrieval.",
          body: "Audience documents get assembled once and rarely consulted at brief time. Use-case segments (sleep, noise-sensitivity, productivity, parenting) get re-discovered every campaign instead of feeding the engine.",
        },
        {
          id: "reviews",
          kicker: "Creative Strategy · Review Grounding",
          title: "Strategists author from memory, not evidence.",
          body: "The strongest customer phrasing — specific numbers, taboo words, age call-outs, time-period anchors — gets paraphrased away before it reaches the brief. Low-score reviews never become hook material.",
        },
        {
          id: "briefings",
          kicker: "Creative Strategy · Briefing Synthesis",
          title: "Briefings restart Reddit, Magic Brief, SharePoint every week.",
          body: "Customer voice, ad performance and competitive signals sit in different surfaces. Each brief re-mines them by hand. The strongest insight from week one is rarely the strongest input for week two.",
        },
      ],
      footnote: "Shared gap · Four functions. The same missing layer.",
    },
    {
      id: "substrate-map",
      kind: "list-groups",
      menuLabel: "The layer",
      layout: "columns",
      head: {
        title: { pre: "What’s missing is an", em: "intelligence layer." },
        sub: "Loop already owns these pieces. The layer connects them, so every headless AI surface inherits the same judgment.",
      },
      groups: [
        {
          id: "sources",
          label: "01 · Trusted sources",
          blurb:
            "Where the work already lives. An ontology AI can read, built on the systems Loop already runs.",
          items: [
            {
              id: "ontology",
              tag: "Knowledge Graph",
              name: "Customer · Brief · Persona · Hook · Campaign",
            },
            { id: "snowflake", name: "Snowflake" },
            { id: "thoughtspot", name: "ThoughtSpot" },
            { id: "frontify", name: "Frontify" },
            { id: "monday", name: "Monday" },
            { id: "notion", name: "Notion" },
            { id: "sap-arena-crm", name: "SAP / Arena / CRM" },
          ],
        },
        {
          id: "substrate",
          label: "02 · Encoded substrate · Authority layer",
          blurb:
            "How the team decides. Rules, examples, voice, review gates — encoded once, owned internally, model-portable.",
          items: [
            { id: "rules", tag: "Rules", name: "How the team decides" },
            { id: "examples", tag: "Examples", name: "What good looks like" },
            { id: "voice", tag: "Voice", name: "How Loop sounds" },
            { id: "loops", tag: "Loops", name: "Who confirms what" },
            { id: "substrate-tags", name: "Owned internally · Versioned · Model-portable" },
          ],
        },
        {
          id: "surfaces",
          label: "03 · Headless surfaces · Headless wrapper",
          blurb:
            "Where Loop calls the engine. Same engine, many surfaces. Pick the surface that fits the moment.",
          items: [
            { id: "cursor", name: "Cursor" },
            { id: "claude", name: "Claude" },
            { id: "web-app", name: "Web app" },
            { id: "rest", name: "REST" },
            { id: "slack", name: "Slack" },
            { id: "agents", name: "Agents" },
          ],
        },
      ],
      closing: "Work stays in place. Substrate carries the judgment. Surfaces inherit it.",
    },
    {
      id: "signal",
      kind: "cards",
      menuLabel: "Signal",
      head: {
        eyebrow: "The signal",
        title: { pre: "The labs just bet", em: "billions", post: "on the same layer." },
        sub: "Not a model problem. A deployment problem. Both labs just said so out loud.",
      },
      cards: [
        {
          id: "palantir",
          kicker: "Origin · The FDE Pattern",
          title: "The role every AI lab is now copying.",
          body: "Palantir invented the Forward Deployed Engineer: embed inside customer ops, encode the workflow, leave behind a running system. The shape that defined enterprise software.",
          byline: "Palantir · FDE program",
          href: "https://www.palantir.com/careers/forward-deployed-engineer/",
        },
        {
          id: "stripe",
          kicker: "Hiring · Forward Deployed",
          title: "Stripe creates a role that did not exist a year ago.",
          body: "Multiple six figures to embed AI-natives inside marketing. Each assigned to 20 marketers until self-sufficient. AI as default, not occasional tool.",
          byline: "@andruyeung · via X",
          href: "https://www.wsj.com/articles/ai-startups-have-a-new-old-secret-weapon-forward-deployed-engineers-d18ee609",
        },
        {
          id: "openai",
          kicker: "Press release · May 2026",
          title: "OpenAI launches the Deployment Company.",
          body: "$10B JV, 19 partners. Acquired Tomoro for ~150 Forward Deployed Engineers on day one. Deployment is the new distribution.",
          byline: "openai.com · May 2026",
          href: "https://openai.com/index/openai-launches-the-deployment-company/",
        },
        {
          id: "anthropic",
          kicker: "Bloomberg · enterprise",
          title: "Anthropic's $1.5B answer.",
          body: "Blackstone, Hellman & Friedman, Goldman Sachs. Applied AI engineers deployed into PE portfolios to build custom Claude. Zero consulting firms in the cap table.",
          byline: "Bloomberg · enterprise track",
          href: "https://www.wsj.com/business/deals/anthropic-nears-1-5-billion-joint-venture-with-wall-street-firms-8f5448ee",
        },
      ],
    },
    {
      id: "skills-engine",
      kind: "list-groups",
      menuLabel: "Receipts",
      layout: "stack",
      head: {
        title: { em: "The Skills, already filling the layer." },
        sub: "Each card below is one team’s workflow, encoded as substrate other teams can call into. Some shipped, some in build, all running on the same engine. The know-how is starting to compound.",
      },
      groups: [
        {
          id: "product-design",
          label: "Product Design & UX",
          blurb:
            "From CMF to packaging to UX foundations — designers ship the substrate they used to brief.",
          items: [
            {
              id: "cmf-skill",
              tag: "IN USE",
              name: "CMF Skill in Vesper",
              body: "Generates the CMF PDF — material specs and SKU renders — end-to-end through Vesper, no manual rebuilds.",
              meta: "Damien",
            },
            {
              id: "packaging-skill",
              tag: "SCOPING",
              name: "Packaging Skill",
              body: "Same eco-system idea applied to packaging: structural designers, graphic designers, and engineers pull shared specs from one place.",
              meta: "Ana · Damien",
            },
            {
              id: "ux-foundations-skill",
              tag: "BUILT",
              name: "UX Foundations",
              body: "Encodes the UX heuristics, research patterns, and review checklists Aurélie’s team uses to keep product judgement consistent.",
              meta: "Aurélie",
            },
          ],
        },
        {
          id: "product-program-management",
          label: "Product & Program Management",
          blurb:
            "Ideation up front, status and risk in the middle, sustainability reporting at the close — the management spine encoded as Skills.",
          items: [
            {
              id: "product-ideation",
              tag: "BUILT",
              name: "Product Ideation",
              body: "Structured ideation flow that turns raw briefs into scoped product bets, grounded in Loop’s PM rituals.",
              meta: "Carlota",
            },
            {
              id: "program-status-updates",
              tag: "IN BUILD",
              name: "Program Status Updates",
              body: "Reads meeting transcripts, checks risk boards on consistent templates, reviews the roadmap board, and writes the weekly delta.",
              meta: "Robert",
            },
            {
              id: "risk-management",
              tag: "IN BUILD",
              name: "Risk Management",
              body: "Encodes Loop’s program-risk taxonomy and the rubric Sander uses to score, escalate, and close program risks.",
              meta: "Sander",
            },
            {
              id: "vsme-reporting",
              tag: "SCOPING",
              name: "VSME Reporting",
              body: "Drafts the Voluntary Sustainability Reporting Standard answers for non-listed SMEs — basic and comprehensive modules.",
            },
          ],
        },
        {
          id: "warehousing-product-ops",
          label: "Warehousing & Product Ops",
          blurb:
            "Fraud signals on Shopify, rubric-based ticket review against the CX partner, vendor invoices with built-in scam checks.",
          items: [
            {
              id: "fraud-detection",
              tag: "BUILT",
              name: "Shopify Fraud Detection",
              body: "Scans Shopify order logs for fraud-pattern signals and surfaces the cases that need a human call before fulfilment.",
              meta: "Toby · Maud",
            },
            {
              id: "ticket-quality-auditor",
              tag: "BUILT",
              name: "Ticket Quality Auditor",
              body: "Evaluates the CX partner’s ticket handling against an internal rubric, side-by-side with the AI response, ahead of weekly review.",
              meta: "Toby · Maud",
            },
            {
              id: "invoice-processor",
              tag: "IN BUILD",
              name: "Invoice Processor",
              body: "Ingests vendor invoices, extracts line items, and flags scam patterns and amount mismatches before they reach Finance.",
              meta: "Dennis",
            },
          ],
        },
        {
          id: "pmm",
          label: "Product Marketing (PMM)",
          blurb:
            "Marketing calendars stop being PDFs and become databases — wired straight into the briefing agent that uses them.",
          items: [
            {
              id: "retail-marketing-calendar",
              tag: "IN USE",
              name: "Retail Marketing Calendar",
              body: "Claude-Design retail calendar wired into Mímir’s database — briefings inherit the same year, retailer, and event grid the PMM team plans against.",
              meta: "Pixie",
            },
            {
              id: "partnership-calendar",
              tag: "SCOPING",
              name: "Partnership Calendar",
              body: "Same calendar-as-substrate idea applied to partnerships and brand events, so the briefing agent reads from a single source.",
              meta: "Caro · Katie",
            },
          ],
        },
        {
          id: "brand-partnerships",
          label: "Brand & Partnerships",
          blurb:
            "Triage the inbox, automate the social readout, lock the founder’s voice — three skills, one tier of brand decisions.",
          items: [
            {
              id: "partnership-inbox-filtering",
              tag: "IN BUILD",
              name: "Partnership Inbox Filtering",
              body: "Sorts incoming partnership requests into Tier 1 / 2 / 3 and drafts the response by tier — gradient thinking for nuanced calls.",
              meta: "Nathalie · Stijn",
            },
            {
              id: "social-reporting-automation",
              tag: "IN BUILD",
              name: "Social Reporting Automation",
              body: "Pulls Dash Hudson into the monthly report for Rob and threads Brandwatch listening into the same readout the team interprets together.",
              meta: "Monica",
            },
            {
              id: "founder-tov",
              tag: "IN BUILD",
              name: "Founder Tone-of-Voice",
              body: "Encodes Maartje’s tone-of-voice as a Skill so founder-led copy stays consistent across LinkedIn, internal notes, and press.",
              meta: "Sayrade",
            },
          ],
        },
      ],
    },
    {
      id: "question",
      kind: "interstitial",
      variant: "question",
      line: { pre: "But how do you actually get here?" },
      subline: "By tackling the hardest challenge first.",
    },
    {
      id: "evans",
      kind: "interstitial",
      variant: "quote",
      line: {
        pre: "A lot of the challenge is working out",
        em: "how to ask",
        post: "for what you want.",
      },
      subline:
        "Treat it like a colleague. If a really smart new colleague joined your team tomorrow, what would you need to explain to them before they could do useful work?",
      attribution: "Benedict Evans · On the hidden work behind useful AI",
    },
    {
      id: "tool-collab",
      kind: "cards",
      ariaLabel: "Why we treat AI like a colleague — the tool-to-collaborator continuum",
      columns: 3,
      head: {
        title: { pre: "Why we treat AI", em: "like a colleague." },
        sub: "AI sits between a tool and a collaborator. Sometimes you give it commands. Sometimes you brainstorm with it. The same surface plays both registers, often in the same conversation. The teams that get value learn to navigate both.",
      },
      cards: [
        {
          id: "tool",
          kicker: "Tool",
          title: "Executes commands",
          body: "Predictable software that does what we ask, or gives clear errors when it fails.",
        },
        {
          id: "middle",
          kicker: "AI lives here",
          title: "Both, at once",
          body: "Trained on us, but not like us. A new paradigm no LinkedIn bro teaches you how to navigate.",
        },
        {
          id: "collab",
          kicker: "Collaborator",
          title: "Interprets intent",
          body: "Opinionated. Brainstorms with you, challenges your ideas, just listens when you vent.",
        },
      ],
    },
    {
      id: "vision",
      kind: "head",
      head: {
        title: { pre: "Good automation starts with", em: "the right adoption", post: "." },
        sub: "Navigate first. Then encode what works into something both the team and the agents you build can reuse. Tacit knowledge stops living with a few people, and the team takes on work it couldn’t do before.",
      },
    },
    {
      id: "approach",
      kind: "cards",
      menuLabel: "Flywheel",
      columns: 3,
      head: {
        title: { pre: "The AI flywheel", em: "running inside the work." },
        sub: "Three motions, one team at a time. Navigate, encode, build, compounding into the substrate every surface inherits.",
      },
      cards: [
        {
          id: "navigate",
          n: "01",
          kicker: "Navigate",
          title: "Teach the teams what they are working with",
          body: "AI sits between a tool and a collaborator. Deterministic enough to automate, interpretive enough to think with. Trained on us, but not like us. Before a team can encode their work into it or build on top, they have to learn how it actually behaves.",
          receipt: "Outcome · AI intuition and a workflow brief per team.",
        },
        {
          id: "encode",
          n: "02",
          kicker: "Encode",
          title: "Turn how the team works into a portable layer any agent can use.",
          body: "Once a team knows what they want AI to take on, you encode how they actually do it: brand nuances, standards, review process — written down so any agent can inherit them. At Loop, dozens of workflows now live as substrate: brand voice, claim gates, marketplace copy. A teammate can read it. An agent can run on it. Models change. The encoded layer carries forward.",
          receipt: "Outcome · A Skill the team owns. Versioned. Headless.",
        },
        {
          id: "build",
          n: "03",
          kicker: "Build",
          title: "Hand the team a running system they actually own.",
          body: "With substrate in place, AI collapses the distance between knowing the problem and shipping the tool. The work starts in a Teams call where Creative Technology listens for the frustration, turns the transcript into a user story in Cursor, then either builds the interface around it or exposes the logic headlessly through MCP. The finished tool lands with the person closest to the work. Nobody understands their domain better than they do.",
          receipt: "Outcome · A thin running surface the team uses daily.",
        },
      ],
    },
    {
      id: "claude-bridge",
      kind: "interstitial",
      variant: "question",
      menuLabel: "Claude",
      eyebrow: "Claude · let’s get going",
      line: { pre: "Let’s get Claudin’." },
      subline: "Open the app, switch on the right toggles, and put the smartest model to work.",
    },
    {
      id: "claude-settings",
      kind: "cards",
      ariaLabel: "Claude settings and configuration",
      columns: 3,
      head: {
        title: { pre: "Switch on the", em: "right toggles", post: "." },
        sub: "Three settings carry most of what makes Claude feel like a colleague who remembers you. Turn them on once and the rest of the work stops starting from zero.",
      },
      cards: [
        {
          id: "search-chats",
          n: "01",
          title: "Search and reference chats",
          body: "Claude can search your previous conversations for context, so a new chat lands inside the thread instead of restarting it.",
        },
        {
          id: "memory",
          n: "02",
          title: "Generate memory from chat history",
          body: "An ambient memory layer learns your preferences over time. Tone, recurring projects, the way you brief work, what good looks like.",
        },
        {
          id: "artifacts",
          n: "03",
          title: "Artifacts and live visualizations",
          body: "Lets Claude produce HTML dashboards and interactive views inside the chat instead of describing them in text.",
        },
      ],
      tips: [
        {
          id: "memory-tip",
          tag: "TIP · MEMORY",
          body: "Review and edit memories every few weeks. Claude can over-fixate on details mentioned multiple times.",
        },
        {
          id: "instructions-tip",
          tag: "TIP · INSTRUCTIONS",
          body: "Leave the custom instructions field empty. Memory and Skills carry preferences better, and constraints here (like “don’t use em dashes”) flatten creativity across every chat.",
        },
      ],
    },
    {
      id: "claude-models",
      kind: "cards",
      ariaLabel: "Claude model selection and token usage",
      columns: 3,
      head: {
        title: { pre: "Pick the smartest model,", em: "every time", post: "." },
        sub: "Opus is the lever that decides whether the answer compounds or evaporates. Pair it with extended thinking and the cost difference earns itself back in one good run.",
      },
      cards: [
        {
          id: "opus",
          n: "01",
          title: "Opus first",
          body: "Opus is the smartest model. Sonnet and Haiku are cheaper, not smarter. For analysis and creative work, default to Opus.",
        },
        {
          id: "extended-thinking",
          n: "02",
          title: "Extended thinking on",
          body: "Keep the extended thinking toggle on. It reduces hallucinations and gives the model room to actually reason instead of pattern-matching.",
        },
        {
          id: "budget",
          n: "03",
          title: "Budget reality",
          body: "Average is around 80 euros per person per month. Power users land at 180 to 200. Treat the first weeks as exploration, not as a budget exercise.",
        },
      ],
      receipt: "Hit a limit? Reach out. The upgrade is instant.",
    },
    {
      id: "connectors",
      kind: "list-groups",
      ariaLabel: "Claude connectors and integrations",
      layout: "stack",
      head: {
        title: { pre: "Wire Claude into", em: "the tools you already use", post: "." },
        sub: "The point of a connector is to stop copy-pasting. Each one Claude reaches into shortens the loop between a question and the answer that already lives in the system.",
      },
      groups: [
        {
          id: "live",
          label: "LIVE",
          blurb: "Working today across the team.",
          items: [
            {
              id: "gmail-calendar",
              name: "Gmail and Calendar",
              body: "Query the inbox, label threads, prep the week, and summarise long threads into something you can read in a minute.",
            },
            {
              id: "monday",
              name: "Monday",
              body: "Format meeting transcripts and populate boards with structured data automatically.",
            },
            {
              id: "google-docs-notion",
              name: "Google Docs and Notion",
              body: "Store and retrieve ways of working, meeting notes, and team documentation.",
            },
            {
              id: "figma",
              name: "Figma",
              body: "Link Figma files to review copy, summarise comments, and read assets against creative strategies.",
            },
            {
              id: "canva",
              name: "Canva",
              body: "Read templates to encode Skills about well-performing creatives, or draft mock-ups from copy.",
            },
            {
              id: "shopify",
              name: "Shopify",
              body: "Testing live for inventory levels and e-commerce data.",
            },
          ],
        },
        {
          id: "wip",
          label: "IN PROGRESS",
          blurb: "Wired up, waiting on the right gate.",
          items: [
            {
              id: "meta-ads",
              name: "Meta Ads",
              body: "MCP connector in progress. Waiting on legal approval because of account ban risk.",
            },
            {
              id: "tiktok-ads",
              name: "TikTok Ads",
              body: "Integration being explored in parallel with Meta.",
            },
          ],
        },
        {
          id: "gap",
          label: "NOT YET",
          blurb: "No connector available; workarounds in place.",
          items: [
            {
              id: "frontify",
              name: "Frontify",
              body: "No direct connector. Workarounds exist via the API and manual exports.",
            },
            {
              id: "contentino",
              name: "Contentino",
              body: "No MCP or API available today.",
            },
          ],
        },
      ],
    },
    {
      id: "encoding",
      kind: "interstitial",
      variant: "question",
      eyebrow: "Encode",
      line: { pre: "Encode it once,", em: "inside the work." },
      subline:
        "What gets encoded is the judgment people carry in their heads: how they decide, what good looks like, where to push back. Every new team picks up from there instead of starting from zero.",
    },
    {
      id: "skill-anatomy",
      kind: "anatomy",
      menuLabel: "Skills",
      badge: "Claude · Skill",
      head: {
        title: { pre: "A Skill is one file", em: "that hands Claude your judgment", post: "." },
        sub: "A Skill is a text file with instructions and reference materials that encodes the way you think about a specific kind of work. Claude reads the Skill the same way a new colleague would read a notebook: it picks up the rules, the examples, and the taste, then applies them inside the chat.",
      },
      rows: [
        {
          id: "skills-vs-projects",
          label: "Skills vs Projects",
          body: "Projects cluster related chats. Skills carry judgment, and they stack. Three Skills (say, presentation creation plus brand voice plus an adoption playbook) can run on the same answer. Use Projects as folders for chat organisation, encode the actual workflow in Skills.",
        },
        {
          id: "creating-a-skill",
          label: "Creating a Skill",
          body: "Start with /skillcreator. Bring examples, documents, and a short narration of how you think about the task. Claude detects the pattern from the inputs and drafts the Skill back to you.",
        },
        {
          id: "sharing",
          label: "Sharing Skills",
          body: "Skills can be shared company-wide. Today there is a display bug that hides some shared Skills, and there is no clean collaboration flow for editing a Skill together. Both are known and on the roadmap.",
        },
      ],
    },
    {
      id: "the-shift",
      kind: "list-groups",
      layout: "columns",
      head: {
        title: { pre: "From rules engineered", em: "to context encoded." },
        sub: "Mímir's ranker handles deterministic scoring (LF8 overlap, stage match, arc completeness). The Skill handles the judgment — picking the right desire, choosing which review carries the hook, knowing when to stop. Two halves, same axes.",
      },
      groups: [
        {
          id: "old-contract",
          label: "Old contract · Briefing checklist",
          blurb: "EVERY BRIEF RESTARTED",
          items: [
            { id: "rule-desire", name: "if no desire: pick from memory" },
            { id: "rule-review", name: "if no review match: paraphrase one" },
            { id: "rule-stage", name: "if stage missing: default to product" },
            { id: "rule-arc", name: "if arc unclear: skip the field" },
            { id: "rule-evidence", name: "if evidence thin: ship anyway" },
            { id: "rule-more", name: "... more shortcuts" },
            {
              id: "old-coverage",
              name: "COVERAGE GROWS BY ADDING REVIEWERS",
              body: "Works for small volumes and high-judgment teams. Breaks down when scale forces shortcuts and the converting language gets paraphrased away.",
            },
          ],
        },
        {
          id: "new-contract",
          label: "New contract · Skills",
          blurb: "ONE FILE. ONE INTELLIGENCE.",
          items: [
            {
              id: "skill",
              tag: "SKILL",
              name: "rules + examples + voice + guards",
              body: "the strategy contract",
            },
            {
              id: "intelligence",
              tag: "INTELLIGENCE",
              name: "interprets context inside boundaries",
            },
            {
              id: "new-coverage",
              name: "COVERAGE GROWS BY IMPROVING CONTEXT",
              body: "The work shifts upstream: encode the axes once, validate the hooks the model returns. Customer language stays verbatim, not paraphrased.",
            },
          ],
        },
      ],
      closing:
        "Bottleneck: From mining Reddit every week to curating Mímir's substrate. Delivery: From four ad-hoc surfaces to one engine with four faces. Governance: From taste-by-memory to a registry of golden nuggets and evals.",
    },
    {
      id: "degrees",
      kind: "anatomy",
      badge: "Workstream 01 · Creative Strategy",
      head: {
        title: { pre: "One Skill.", em: "Three degrees of freedom." },
        sub: "Every Skill ships with the same three bands. Some things stay locked, so every team calling in gets the same foundations. Some shift with context, where judgment matters more than rules. Some stay open, where the AI should be free to create. The same Skill holds all three, and getting the balance right is most of the work. Creative Strategy turns customer evidence into campaigns. Here is what the team locks down, what it guides, and what it leaves open for the AI to compose.",
      },
      rows: [
        {
          id: "low",
          label: "Low freedom",
          body: "Locked. The strategic foundations the AI must not invent. Customer needs — the AI works from the team’s agreed list of human desires and motivations, never a new one it made up. Awareness stage — whether the customer knows they have the problem, is comparing solutions, or is ready to buy. Evidence rule — every claim ties back to a real customer review or research source. No source, no claim.",
        },
        {
          id: "medium",
          label: "Medium freedom",
          body: "Guided. Choices the AI makes inside the team’s frame. Hook angle — the AI picks how to lean in: a story, a comparison, a regret moment, a point-of-view shift, and so on. Audience persona — which segment the campaign speaks to (sleep, focus, parenting, music lover, etc.). Funnel stage and format — awareness, consideration, retention, or objection-handling, and the format that fits (UGC, founder voice, listicle, press).",
        },
        {
          id: "high",
          label: "High freedom",
          body: "Open. Where the AI is free to compose. Hook copy — the actual sentence, in Loop’s voice. Customer quote — which review the AI picks to anchor the hook. Angle phrasing — how the AI makes the chosen angle land for the audience.",
        },
      ],
    },
    {
      id: "skills-at-loop",
      kind: "list-groups",
      ariaLabel: "Claude Skills to take home from the workshop",
      layout: "stack",
      head: {
        title: { pre: "Four Skills", em: "to take home", post: "." },
        sub: "Two encoded inside Loop, two pulled in from outside. Each one is a single bundle you can drop into Claude today: download, upload to Claude.ai, run.",
      },
      groups: [
        {
          id: "take-home",
          label: "Four Skills",
          items: [
            {
              id: "frontend-design",
              tag: "by Anthropic",
              name: "Frontend Design",
              body: "Builds distinctive, production-grade frontend code instead of generic AI slop. Pairs bold aesthetic direction with seven references covering typography, color, motion, spatial composition, and UX writing.",
              href: "https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design/skills/frontend-design",
              meta: "anthropics/claude-code",
            },
            {
              id: "creating-presentations",
              tag: "by Vince",
              name: "Creating Presentations",
              body: "Turns a brief into a slide deck with a clear arc and rhythm. Carries Loop’s editorial templates, brand assets, and a render script so the output drops straight into .pptx or HTML.",
              meta: "Loop · internal · on request",
            },
            {
              id: "ai-adoption-loop",
              tag: "by Vince",
              name: "AI Adoption · Loop",
              body: "The way Loop runs its own Claude rollout: how to read a team, prep a workshop, write the recap, log Skills on Monday. Ships with the exec comms cadence and stakeholder map as references.",
              meta: "Loop · internal · on request",
            },
            {
              id: "plain-english",
              tag: "by b1rdmania",
              name: "Plain English",
              body: "Two-pass prose audit. First pass strips classical bloat (Orwell, Gowers); second pass strips AI tics (em-dash overuse, banned vocabulary, preamble openers, reflex rule-of-three). Run it on Claude’s output before you ship.",
              href: "https://github.com/b1rdmania/claude-plain-english-skill",
              meta: "b1rdmania/claude-plain-english-skill",
            },
          ],
        },
      ],
      closing:
        "Each bundle ships as a `.skill` archive Claude.ai accepts directly. Two are public (frontend-design, plain-english). Two are Loop-grown and available on request.",
    },
    {
      id: "software-few",
      kind: "interstitial",
      variant: "callout",
      line: { pre: "Tools the team", em: "builds for itself." },
      subline:
        "Most of Loop’s bottlenecks live in software too specific to buy off the shelf, and too small to justify an agency build. That category sat unsolved for years. AI models crossed a threshold at the end of 2025 where the team that owns the problem can now build the tool itself. The Skills above are what those tools run on.",
    },
    {
      id: "cases",
      kind: "cards",
      menuLabel: "Cases",
      columns: 2,
      head: {
        eyebrow: "Cases · in production",
        title: { pre: "Removing workflow bottlenecks,", em: "one tool at a time." },
        sub: "At Loop, software for few became practical. Creative Technology works alongside each team — compressing existing workflows, repairing broken handoffs, inventing new ones from scratch with AI.",
      },
      cards: [
        {
          id: "mimir",
          n: "01",
          kicker: "Mímir · Brand Intelligence",
          title: "Briefing Agent",
          body: "Creative Strategy drove the briefings, but each cycle meant manual digging across Reddit, ad dashboards, Meta Ad Library, and past notes, with Loop's proprietary ad data too sensitive to hand to outside tools.",
          image: { src: "/arcs/cases/mimir.webp", alt: "Mímir" },
          receipt: "Loop's own knowledge, structured.",
          byline: "Invent · Performance · Creative Strategy · 2025",
        },
        {
          id: "vesper",
          n: "02",
          kicker: "Vesper · AI Image & Video Generation",
          title: "AI Image & Video Suite",
          body: "Studio was losing creative flow to scattered generation tools, opaque costs, and too many model choices. The team needed one opinionated canvas tied to Loop's product context.",
          image: { src: "/arcs/cases/vesper.webp", alt: "Vesper" },
          receipt: "Replaced Krea. Built in-house.",
          byline: "Compress · Studio · Design | Product Design · 2025",
        },
        {
          id: "babylon",
          n: "03",
          kicker: "Babylon · UGC Localization",
          title: "UGC Dubber",
          body: "UGC localization had to scale across 30+ markets without turning every language into another agency handoff, Figma copy-paste loop, and reviewer queue.",
          image: { src: "/arcs/cases/babylon.webp", alt: "Babylon" },
          receipt: "Top-performing UGC, dubbed at scale.",
          byline: "Invent · Performance · Localization & Expansion · 2025",
        },
        {
          id: "heimdall",
          n: "04",
          kicker: "Heimdall · Workflow Orchestration",
          title: "Studio PM Orchestrator",
          body: "Built for the project managers around the creative team, collapsing the manual workflow that lives around the design work itself: briefings flow from Monday into Figma, copy gets extracted for proofreaders, and assets sync back through Frontify.",
          image: { src: "/arcs/cases/heimdall.webp", alt: "Heimdall" },
          receipt: "Everything around the creative work, in one tool.",
          byline: "Repair · Studio · Project Management · 2025",
        },
      ],
      tips: [
        {
          id: "compress",
          tag: "Compress",
          body: "Collapse fragmented steps into one continuous flow.",
        },
        {
          id: "repair",
          tag: "Repair",
          body: "Fix the gaps between tools the team must keep using.",
        },
        { id: "invent", tag: "Invent", body: "Build a workflow that didn't exist before." },
      ],
      footnote:
        "The easier it becomes to build interfaces, the more important the underlying layer becomes.",
    },
    {
      id: "headless",
      kind: "interstitial",
      variant: "callout",
      line: { pre: "Software is going", em: "headless." },
      subline:
        "Salesforce shipped Headless 360. The same shape is showing up one layer up in marketing — voice, claims, localization encoded once, every surface (Slack, Cursor, agents) inheriting the same judgment. Loop is building this same shape one team at a time — voice, claims, localization encoded once, every surface inheriting the same substrate.",
    },
    {
      id: "surface-pick",
      kind: "list-groups",
      layout: "columns",
      head: {
        title: { pre: "Pick the surface", em: "that fits the workflow." },
        sub: "Same engine, scaled across the team. Each role reaches it on the surface that fits — developers in Cursor, comms in Claude, PMs in Slack, marketers in their own UIs, ops in agents. Three ways in: MCP, API, CLI.",
      },
      groups: [
        {
          id: "three-ways-in",
          label: "Three ways in",
          items: [
            {
              id: "mcp",
              tag: "MCP",
              name: "Cursor / Claude",
              body: "The AI-native protocol. Drop the engine into any MCP-aware tool and the prompt context comes with it — Cursor, Claude, the cohort's own copilots.",
              meta: "Default",
            },
            {
              id: "api",
              tag: "API",
              name: "REST · server-to-server",
              body: "Same engine, called from a script, an internal tool, or any automation. No LLM in the loop required.",
            },
            {
              id: "cli",
              tag: "CLI",
              name: "curl from your terminal",
              body: "One-liner from the shell. Batch runs, quick checks, cron jobs that need to ask the engine without a UI.",
            },
          ],
        },
        {
          id: "where-it-lands",
          label: "Where it lands",
          items: [
            { id: "developer", tag: "Developer", name: "Cursor", meta: "code-aware copilot" },
            { id: "pr-comms", tag: "PR · Comms", name: "Claude", meta: "long-form drafting" },
            { id: "pm", tag: "PM", name: "Slack", meta: "where the team already lives" },
            { id: "marketer", tag: "Marketer", name: "Web app", meta: "team-built UIs" },
            { id: "ops", tag: "Ops", name: "Agents", meta: "scheduled, autonomous" },
          ],
        },
      ],
      closing: "Build once → scale through surfaces → cohort inherits the capability",
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "Close",
      head: {
        title: { pre: "The layer is the asset.", em: "The surfaces are interchangeable." },
        sub: "Encode the judgment once. Every tool, every agent, every interface inherits it. The next model wins something cheaper, not something that starts from zero.",
      },
      actions: [
        { id: "vision", label: "Back to the vision", href: "/", primary: true },
        { id: "talk", label: "Talk to Vince", href: "mailto:vince@thoughtform.co" },
      ],
      footerLine: "Thoughtform · Claude Workshop · A getting-started chapter for teams.",
      signature: "Scoped by Vince · 2026.",
    },
  ],
};
