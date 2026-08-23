import type { ArcDef } from "../types";

import { LOOP_SKILL_GROUPS } from "./shared/loop-skills";
import { AI_ATL_SECTION, STUDIO_AD_CARDS } from "./shared/loop-studio";
import { MODE_TIPS } from "./shared/loop-tools";
import { SOFTWARE_FEW_LINE, VINCE_BIO_LEAD, VINCE_PORTRAIT } from "./shared/vince";

/**
 * Creative AI keynote arc — port of Shards `/ai-keynote`
 * (01_thoughtform_shards), itself a cut of `/creative-ai-workshop`.
 * Section order follows the Shards mount order; parallax pairs and the
 * axis-driven skills UI flatten onto static primitives per ADR-052
 * Mapping B. Copy is verbatim from the Shards page consts
 * (`workshopHero`, `workshopDiagnosisCards`, `workshopSubstrateMap`,
 * `workshopSignal`, `workshopHowWeRun`, …) and the content modules the
 * page spreads (`content/claude-adoption.ts`,
 * `content/claude-adoption-teams.ts`, `content/intelligence-layer.ts`,
 * `content/operator.ts`, `content/claude-workshop.ts`).
 */
export const AI_KEYNOTE_ARC: ArcDef = {
  slug: "ai-keynote",
  format: "keynote",
  cardTitle: "The creative AI keynote",
  cardLede:
    "The speed layer for creative teams — proof from the floor, the substrate argument, and where agents take it.",
  cardImage: { src: "/images/services/keynote.webp", alt: "Creative AI keynote" },
  hero: {
    eyebrow: "Thoughtform · Creative AI keynote",
    title: { pre: "Make AI work", em: "the way you do." },
    lede: "On its own, AI is pretty good, and pretty good is generic. The judgment that makes the work yours is stuck in people’s heads. Encode it once, and everything you build on top runs on it.",
    actions: [
      { id: "see-how", label: "See how it works", href: "#about-vince", primary: true },
      { id: "proof", label: "See the proof", href: "#proof-ai-atl" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2560,
      height: 1440,
    },
  },
  meta: {
    title: "Creative AI keynote — Thoughtform",
    description:
      "The creative AI keynote: proof from the floor, the substrate argument, and where agents take it.",
  },
  sections: [
    {
      id: "about-vince",
      kind: "portrait",
      menuLabel: "About",
      ariaLabel: "About Vince Buyssens",
      head: {
        eyebrow: "About",
        title: { pre: "Vince Buyssens" },
        sub: "Founder, Thoughtform · AI adoption lead, Loop Earplugs",
      },
      image: VINCE_PORTRAIT,
      bio: [
        VINCE_BIO_LEAD,
        "He runs the same practice inside Loop Earplugs, leading AI adoption across the company.",
      ],
      meta: [
        { label: "Base", value: "Antwerp · BE" },
        { label: "Practice", value: "10+ yrs" },
        { label: "Also at", value: "Loop Earplugs" },
      ],
    },
    AI_ATL_SECTION,
    {
      id: "proof-studio",
      kind: "cards",
      ariaLabel: "Loop Studio — 97% of briefings done with AI",
      columns: 3,
      head: {
        eyebrow: "Loop Studio · AI in production",
        title: { pre: "97% of briefings done", em: "with AI." },
        sub: "Loop has spearheaded AI adoption in Studio, using AI everywhere we can where it makes sense — concepting, copy, post, performance. Three recent cuts, all paid out.",
      },
      cards: STUDIO_AD_CARDS,
      footnote:
        "AI-generated visuals, Claude-assisted copy, Studio design. ROAS measured against the Loop performance benchmark.",
    },
    {
      id: "where-from-here",
      kind: "interstitial",
      variant: "question",
      eyebrow: "So — the next move.",
      line: { pre: "Where do you go", em: "from there?" },
    },
    {
      id: "agents",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "The answer everyone reaches for",
      line: { em: "Agents." },
    },
    {
      id: "agent-context",
      kind: "interstitial",
      variant: "quote",
      line: { pre: "Everyone wants an agent.", em: "Yet most fail." },
    },
    {
      id: "diagnosis",
      kind: "cards",
      menuLabel: "Diagnosis",
      head: {
        title: { pre: "Where AI keeps", em: "falling short." },
        sub: "You’ve run into all four of these. They look like separate problems, but they share one cause: nothing holds how your team actually works.",
      },
      cards: [
        {
          id: "cold-start",
          n: "01",
          title: "You explain yourself from scratch every time.",
          body: "Each new chat starts cold. The AI doesn’t know your team, your standards, or what you decided last week, so you retype the same context again and again.",
        },
        {
          id: "generic-output",
          n: "02",
          title: "The output is generic.",
          body: "Ask without context and you get the safe, average answer. It reads fine. It just doesn’t sound like you, and it doesn’t reflect how you actually work.",
        },
        {
          id: "tacit-knowledge",
          n: "03",
          title: "Your best thinking stays in people’s heads.",
          body: "How your strongest people work is rarely written down. AI can’t draw on it, new people can’t learn it, and it walks out the door when they leave.",
        },
        {
          id: "blank-page",
          n: "04",
          title: "Every project starts from a blank page.",
          body: "Nothing carries over. The work you did last month doesn’t make this month faster, so you rebuild the same things over and over.",
        },
      ],
      footnote:
        "Shared gap · All four come from the same gap: nothing holds how your team works in a form AI can use.",
    },
    {
      id: "substrate-map",
      kind: "list-groups",
      menuLabel: "The layer",
      layout: "columns",
      head: {
        title: { pre: "What’s missing is an", em: "intelligence layer." },
        sub: "Three parts, and you already have the first one. The work lives in your tools. The way you work gets captured once in the middle. Every AI tool you use draws from it.",
      },
      groups: [
        {
          id: "sources",
          label: "01 · Trusted sources",
          blurb:
            "Where the work already lives. The tools and files you already use: client notes, briefs, docs, whatever holds your real work. AI reads from these instead of guessing.",
          items: [
            { id: "ontology", tag: "Your stack", name: "CRM · Docs · Drive · Board" },
            { id: "your-crm", name: "Your CRM" },
            { id: "your-docs", name: "Your docs" },
            { id: "your-drive", name: "Your shared drive" },
            { id: "your-board", name: "Your project board" },
          ],
        },
        {
          id: "substrate",
          label: "02 · Encoded substrate · Authority layer",
          blurb:
            "How the team decides. Your rules, your examples, your voice, and who signs off. Captured once, owned by you, and it keeps working when the AI models change.",
          items: [
            { id: "rules", tag: "Rules", name: "How the team decides" },
            { id: "examples", tag: "Examples", name: "What good looks like" },
            { id: "voice", tag: "Voice", name: "How you sound" },
            { id: "sign-off", tag: "Sign-off", name: "Who confirms what" },
            { id: "substrate-tags", name: "Owned by you · Versioned · Survives model changes" },
          ],
        },
        {
          id: "surfaces",
          label: "03 · Headless surfaces · Headless wrapper",
          blurb:
            "Where you actually use it. One source of truth, many places to use it. A chat, a doc, a website, whatever fits the moment.",
          items: [
            { id: "chat", name: "Chat" },
            { id: "docs", name: "Docs" },
            { id: "website", name: "Website" },
            { id: "slack", name: "Slack" },
          ],
        },
      ],
      closing:
        "Your work stays where it is, the layer holds the judgment, and every tool draws from it.",
    },
    {
      id: "signal",
      kind: "cards",
      menuLabel: "Signal",
      head: {
        eyebrow: "The signal",
        title: { pre: "The labs just bet", em: "billions", post: "on the same layer." },
        sub: "Both labs just said it out loud: the problem was never the model, it was getting it deployed.",
      },
      cards: [
        {
          id: "palantir",
          kicker: "Palantir · 2010s",
          title: "The role every AI lab is now copying.",
          body: "Palantir invented the Forward Deployed Engineer: someone who embeds in a customer’s team, captures how they work, and leaves behind a running system. The shape that defined enterprise software.",
          byline: "Palantir · FDE program",
          href: "https://www.palantir.com/careers/forward-deployed-engineer/",
        },
        {
          id: "stripe",
          kicker: "Stripe · 2026",
          title: "Stripe created a role that didn’t exist a year ago.",
          body: "Multiple six figures to embed AI-natives inside marketing. Each one assigned to 20 marketers until the team can run it alone. AI as default, not occasional tool.",
          byline: "@andruyeung · via X",
          href: "https://www.wsj.com/articles/ai-startups-have-a-new-old-secret-weapon-forward-deployed-engineers-d18ee609",
        },
        {
          id: "openai",
          kicker: "OpenAI · $10B · May 2026",
          title: "OpenAI launched the Deployment Company.",
          body: "A $10B joint venture, 19 partners, and around 150 forward-deployed engineers on day one from the Tomoro acquisition. Deployment is the new distribution.",
          byline: "openai.com · May 2026",
          href: "https://openai.com/index/openai-launches-the-deployment-company/",
        },
        {
          id: "anthropic",
          kicker: "Anthropic · $1.5B",
          title: "Anthropic’s $1.5B answer.",
          body: "Blackstone, Hellman & Friedman, Goldman Sachs. Applied AI engineers placed inside their portfolio companies to build custom Claude. No consulting firms involved.",
          byline: "Bloomberg · Enterprise track",
          href: "https://www.wsj.com/business/deals/anthropic-nears-1-5-billion-joint-venture-with-wall-street-firms-8f5448ee",
        },
      ],
    },
    {
      id: "question",
      kind: "interstitial",
      variant: "question",
      eyebrow: "Deep dive",
      line: { pre: "But how do you actually get here?" },
    },
    {
      id: "vision",
      kind: "head",
      head: {
        title: { pre: "Adoption and Automation are", em: "the same flywheel." },
        sub: "Adoption is the loop run inside real work: navigate with the team, encode what works, build small tools on top. Automation is what comes out the other side. Same flywheel, two readings.",
      },
    },
    {
      id: "how-we-run",
      kind: "cards",
      menuLabel: "Flywheel",
      ariaLabel: "What the flywheel looks like in practice — Loop's rollout as a worked example",
      columns: 3,
      head: {
        title: { pre: "What the flywheel looks like", em: "in practice." },
        sub: "Loop Earplugs is running this flywheel across every team. Same short kickoff, one Skill per workflow, all of them landing in a shared library the next team builds on — and when three teams hit the same pattern, that’s where the next tool comes from.",
      },
      cards: [
        {
          id: "same-start",
          n: "01",
          kicker: "Navigate",
          title: "Every team starts here",
          body: "Same short kickoff, same Claude. Each team leaves with one workflow worth capturing as a Skill.",
          receipt: "22 workshops, one per team",
        },
        {
          id: "every-record",
          n: "02",
          kicker: "Encode",
          title: "The work feeds the layer",
          body: "Meeting recorded and transcribed, captured as a Skill, lands in the same shared board. The ones that prove out move to a shared, versioned library.",
          receipt:
            "The transcript becomes a Skill, and every team’s result lands in the same place.",
        },
        {
          id: "patterns-become-tools",
          n: "03",
          kicker: "Build",
          title: "Patterns become tools",
          body: "Three teams doing the same work means a Skill worth sharing. Three teams needing the same tool means one worth building.",
          receipt:
            "Creative strategy, product marketing, and campaign management all needed the same briefing help, so it became one shared briefing tool.",
        },
      ],
    },
    {
      id: "navigate-properties",
      kind: "anatomy",
      ariaLabel: "Why you can't treat AI like normal software — Navigate",
      badge: "Navigate",
      head: {
        title: { pre: "Why you can’t treat AI like", em: "normal software." },
        sub: "AI gets sold as software. It isn’t. It’s the first intelligence you can use as a tool and work with like a colleague, often both at once. Learning to work with it is its own skill, and it comes before anything compounds.",
      },
      rows: [
        {
          id: "alien",
          label: "Alien",
          body: "Trained on everything we’ve written, but it doesn’t reason like we do. The surface feels familiar; the process underneath isn’t.",
        },
        {
          id: "geometric",
          label: "Geometric",
          body: "It turns meaning into geometry, so how you frame a request shifts the output more than what you literally ask.",
        },
        {
          id: "generative",
          label: "Generative",
          body: "It always generates. Insight and fabrication can sound identical, so your judgment rides on top.",
        },
      ],
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
      id: "navigate-levin",
      kind: "media",
      head: {
        title: { pre: "Intelligence is", em: "navigable", post: "." },
        sub: "Michael Levin shows that even biological intelligence is alien — cells, tissues, and selves cohere through interfaces we are still learning to read. AI lands in the same family. The skill is the same: navigate the interface, do not assume the substrate.",
      },
      media: {
        type: "video",
        src: "/videos/michael-levin-cognitive-interfaces.mp4",
        poster: "/arcs/posters/levin.jpg",
      },
      caption: {
        label: "Michael Levin",
        role: "Tufts University · Cognitive interfaces in biology",
        sourceLabel: "Thoughtform Canon · Videos & Podcast",
      },
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
      id: "skills-by-team",
      kind: "list-groups",
      menuLabel: "Skills",
      ariaLabel: "Skills shipped at Loop Earplugs, shown as a workshop case study",
      layout: "stack",
      head: {
        eyebrow: "Proof",
        title: { pre: "What’s being", em: "encoded.", post: "At Loop" },
        // 42 → 47 with the landing casefile's sweep (2026-08-02): the
        // Intelligence Map plate there SUMS the per-shape counts on screen,
        // so a surviving 42 on this deck would be a second variant of a
        // claim the reader can now check. One number, both surfaces.
        sub: "A real rollout at Loop Earplugs. Forty-seven Skills across every team — each one captures how that team handles a specific piece of work, so people and agents can build on what the company already knows.",
      },
      groups: LOOP_SKILL_GROUPS,
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
      id: "encode-anthropic",
      kind: "media",
      head: {
        title: { pre: "The lab's own", em: "prompting advice", post: "." },
        sub: "Anthropic walks through how to brief Claude well — context, examples, constraints, iteration. Watch it once, then stop re-teaching the model every chat: encode the patterns into a Skill and let every conversation start from there.",
      },
      media: {
        type: "video",
        src: "/videos/anthropic-prompting-advice.mp4",
        poster: "/arcs/posters/anthropic.jpg",
      },
      caption: {
        label: "Anthropic",
        role: "Prompting advice for Claude (with subtitles)",
        sourceLabel: "anthropic.com",
        sourceHref: "https://www.anthropic.com/",
      },
    },
    {
      id: "skill-anatomy",
      kind: "anatomy",
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
      id: "software-few",
      kind: "interstitial",
      variant: "callout",
      line: { pre: "Tools the team", em: "builds for itself." },
      subline: SOFTWARE_FEW_LINE,
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
      tips: MODE_TIPS,
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
      footerLine: "Thoughtform · Creative AI Keynote · A speed layer on the creative process.",
      signature: "Scoped by Vince · 2026.",
    },
  ],
};
