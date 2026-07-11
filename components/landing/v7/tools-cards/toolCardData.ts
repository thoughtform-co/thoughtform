/**
 * toolCardData — content model for the landing #tools section (and the
 * /test/project-cards look-dev lab, which imports it back).
 *
 * Seeded from the shards ai-adoption case set (00_shards/content/operator.ts),
 * curated down to what a stacked card carries: one tightened challenge
 * paragraph, one shift paragraph, exactly four capabilities. Emphasis is
 * modeled as `em` title segments rendered as UPRIGHT GOLD (`<em>` restyled;
 * the site never sets italics — brand rule).
 *
 * Export names keep the lab-era `ProjectCase`/`PROJECT_CASES` spelling so
 * the five lab skins didn't churn when the file was promoted (ADR-030).
 */

export type TitleSegment = { text: string; em?: boolean };

export type CaseMode = "INVENT" | "COMPRESS" | "REPAIR";

export interface CaseCapability {
  title: string;
  desc: string;
}

export interface ProjectCase {
  id: "mimir" | "vesper" | "babylon" | "heimdall";
  /** Rendered as `01 / 04` etc. */
  index: string;
  title: TitleSegment[];
  codename: string;
  tagline: string;
  subline: string;
  team: string;
  status: string;
  year: number;
  mode: CaseMode;
  challenge: string;
  shift: string;
  capabilities: [CaseCapability, CaseCapability, CaseCapability, CaseCapability];
  stack: string[];
  surfaces: string[];
  image: { src: string; alt: string; width: number; height: number };
}

export const CASE_TOTAL = "04";

export const PROJECT_CASES: ProjectCase[] = [
  {
    id: "mimir",
    index: "01",
    title: [{ text: "Briefing " }, { text: "Agent", em: true }],
    codename: "Mímir",
    tagline: "Brand Intelligence",
    subline: "Loop's own knowledge, structured.",
    team: "Performance · Creative Strategy",
    status: "Production",
    year: 2025,
    mode: "INVENT",
    challenge:
      "Every briefing cycle meant manual digging across Reddit, ad dashboards, Meta Ad Library, and past notes — with Loop's proprietary ad data too sensitive for outside tools.",
    shift:
      "Mímir unifies customer voice, ad performance, competitive signals, and prior briefings into a permissioned knowledge graph that surfaces insight while the brief is being written.",
    capabilities: [
      {
        title: "Permissioned graph",
        desc: "Customer voice, paid performance, competitor ads, and prior strategy as one substrate.",
      },
      {
        title: "Proactive briefing",
        desc: "Relevant insights surface while strategists compose, not after another search pass.",
      },
      {
        title: "Headless substrate",
        desc: "The same interpretation layer answers the web app, Claude, Cursor, Slack, and ChatGPT.",
      },
      {
        title: "Shared BI layer",
        desc: "Expanded from Creative Strategy into Insights and Product Marketing use cases.",
      },
    ],
    stack: ["Next.js", "Supabase", "Gemini", "Claude Skills", "MCP", "Slack"],
    surfaces: ["Web app", "MCP server", "Claude", "Cursor", "Slack", "ChatGPT"],
    image: {
      src: "/project-cards/mimir.png",
      alt: "Mímir briefing agent interface",
      width: 1971,
      height: 1263,
    },
  },
  {
    id: "vesper",
    index: "02",
    title: [{ text: "AI Image & Video " }, { text: "Suite", em: true }],
    codename: "Vesper",
    tagline: "AI Image & Video Generation",
    subline: "Replaced Krea. Built in-house.",
    team: "Studio · Design",
    status: "Production",
    year: 2025,
    mode: "COMPRESS",
    challenge:
      "Studio was losing creative flow to scattered generation tools, opaque costs, and too many model choices — the team needed one opinionated canvas tied to Loop's product context.",
    shift:
      "One canvas runs prompt enhancement, multi-model generation, and image-to-video on only the models Studio actually uses.",
    capabilities: [
      {
        title: "Prompt enhancement",
        desc: "Claude refines visual prompts using the Loop product catalogue.",
      },
      {
        title: "Multi-model generation",
        desc: "Gemini Flash Image, Veo 3.1, Seedream, Kling under one tab.",
      },
      {
        title: "Image-to-video",
        desc: "Animate a still without leaving the canvas. Small fix, big flow.",
      },
      {
        title: "Headless REST + MCP",
        desc: "Same Skill behind Claude.ai and the in-product enhance button.",
      },
    ],
    stack: [
      "Next.js",
      "TanStack Query",
      "Supabase",
      "Prisma",
      "Anthropic",
      "Gemini",
      "Replicate",
      "Kling",
    ],
    surfaces: ["Web app", "MCP server", "REST", "Claude / Cursor"],
    image: {
      src: "/project-cards/vesper.png",
      alt: "Vesper generation canvas",
      width: 2254,
      height: 1253,
    },
  },
  {
    id: "babylon",
    index: "03",
    title: [{ text: "UGC " }, { text: "Dubber", em: true }],
    codename: "Babylon",
    tagline: "UGC Localization",
    subline: "Top-performing UGC, dubbed at scale.",
    team: "Performance · Localization & Expansion",
    status: "Production",
    year: 2025,
    mode: "INVENT",
    challenge:
      "UGC localization had to scale across 30+ markets without turning every language into another agency handoff, Figma copy-paste loop, and reviewer queue.",
    shift:
      "Transcribe, translate, dub, and Gemini-verify in one pipeline, so reviewers only judge the rows where culture actually matters.",
    capabilities: [
      {
        title: "30+ markets",
        desc: "Linear scale-out across languages, not reviewers.",
      },
      {
        title: "Auto-verification",
        desc: "Gemini cross-check against on-screen captions.",
      },
      {
        title: "Custom review module",
        desc: "Cultural judgment surfaced where it actually matters.",
      },
      {
        title: "Single proofread surface",
        desc: "Share-link review, no Figma seat needed.",
      },
    ],
    stack: ["Next.js", "Supabase", "Anthropic", "Gemini"],
    surfaces: ["Web app", "Share-link review"],
    image: {
      src: "/project-cards/babylon.png",
      alt: "Babylon dubbing pipeline overview",
      width: 2263,
      height: 1260,
    },
  },
  {
    id: "heimdall",
    index: "04",
    title: [{ text: "Studio PM " }, { text: "Orchestrator", em: true }],
    codename: "Heimdall",
    tagline: "Workflow Orchestration",
    subline: "Everything around the creative work, in one tool.",
    team: "Studio · Project Management",
    status: "Production",
    year: 2025,
    mode: "REPAIR",
    challenge:
      "Briefings lived in Monday, designers worked in Figma, assets shipped through Frontify — every handoff was manual copy-paste, and proofreaders waited on whoever could pull the latest copy out by hand.",
    shift:
      "One webhook chain moves briefings from Monday into Figma, pulls copy out for proofreading, and routes finished assets back through Frontify — without a single manual copy-paste.",
    capabilities: [
      {
        title: "Monday → Figma sync",
        desc: "Structured briefings, GraphQL pipeline, instant Figma plugin update.",
      },
      {
        title: "Frontify integration",
        desc: "Asset intake, naming conventions, brand surface alignment.",
      },
      {
        title: "Iterator plugin",
        desc: "Spins up variants from the best-performing ads.",
      },
      {
        title: "Briefing split orchestrator",
        desc: "Turns revenue projections and use-case splits into clear briefing assignments.",
      },
    ],
    stack: ["Next.js", "Supabase", "Vercel KV", "Monday", "Figma", "Frontify", "Meta", "Anthropic"],
    surfaces: ["Web app", "Figma plugin", "Iterator plugin", "GPT Actions API"],
    image: {
      src: "/project-cards/heimdall.png",
      alt: "Heimdall briefing overview",
      width: 2252,
      height: 1248,
    },
  },
];
