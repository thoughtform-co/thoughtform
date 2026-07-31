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

/** One headline metric per case (ADR-033) — folded in from the retired
 *  `build-cases/buildCaseData.ts` triplets so PROJECT_CASES is the single
 *  canonical case module. Rendered on the arc orbit card's caption row. */
export interface CaseMetric {
  value: string;
  label: string;
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
  /** Headline metric for the arc orbit card (optional — cards without one
   *  simply omit the caption row's right slot). */
  metric?: CaseMetric;
  stack: string[];
  surfaces: string[];
  image: { src: string; alt: string; width: number; height: number };
  /** Screen-recorded walkthrough, played in the casefile's `MediaLightbox`
   *  (ADR-056 Update 9). Poster-first by contract: no `<video>` element
   *  exists until a click, so a tool nobody opens costs nothing. Ported from
   *  the shards `/ai-operator` case set and re-encoded at crf 30 — the
   *  sources were already well compressed, so crf 26 bought 4% for a
   *  generation of loss; 30 buys 36% and holds up at 2x zoom on UI text. */
  walkthrough?: { src: string; poster: string };
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
      "Creative Strategy drove the briefings, but each cycle meant manual digging across Reddit, ad dashboards, Meta Ad Library, and past notes, with Loop's proprietary ad data too sensitive to hand to outside tools.",
    shift:
      "Mímir unifies customer voice, ad performance, competitive signals, and prior briefings into a permissioned knowledge graph that surfaces relevant insight while a brief is being written.",
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
    metric: { value: "4+", label: "Intelligence sources" },
    stack: ["Next.js", "Supabase", "Gemini", "Claude Skills", "MCP", "Slack"],
    surfaces: ["Web app", "MCP server", "Claude", "Cursor", "Slack", "ChatGPT"],
    image: {
      src: "/project-cards/mimir.webp",
      alt: "Mímir briefing agent interface",
      width: 1000,
      height: 641,
    },
    walkthrough: {
      src: "/videos/tools/mimir.mp4",
      poster: "/videos/tools/mimir-poster.jpg",
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
      "Studio was losing creative flow to scattered generation tools, opaque costs, and too many model choices. The team needed one opinionated canvas tied to Loop's product context.",
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
    metric: { value: "0%", label: "Margin vs. Krea" },
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
      src: "/project-cards/vesper.webp",
      alt: "Vesper generation canvas",
      width: 1000,
      height: 556,
    },
    walkthrough: {
      src: "/videos/tools/vesper.mp4",
      poster: "/videos/tools/vesper-poster.jpg",
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
      "Transcribe, translate, dub, and Gemini-verify in one pipeline so reviewers only judge the rows where culture matters.",
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
    metric: { value: "30+", label: "Languages supported" },
    stack: ["Next.js", "Supabase", "Anthropic", "Gemini"],
    surfaces: ["Web app", "Share-link review"],
    image: {
      src: "/project-cards/babylon.webp",
      alt: "Babylon dubbing pipeline overview",
      width: 1000,
      height: 557,
    },
    walkthrough: {
      src: "/videos/tools/babylon.mp4",
      poster: "/videos/tools/babylon-poster.jpg",
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
      "Built for the project managers around the creative team, collapsing the manual workflow that lives around the design work itself: briefings flow from Monday into Figma, copy gets extracted for proofreaders, and assets sync back through Frontify.",
    shift:
      "One webhook chain moves briefings from Monday into Figma, pulls copy out for proofreading, and routes the finished assets back through Frontify, without a single manual copy-paste.",
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
        /* Shortened from "Briefing split orchestrator" (2026-07-31): at 27
           chars it wrapped to a second line in the casefile's foot tiles and
           knocked its row's descriptions out of alignment with the other
           three. The desc carries the meaning; every sibling title is ≤20. */
        title: "Briefing splits",
        desc: "Turns revenue projections and use-case splits into clear briefing assignments.",
      },
    ],
    metric: { value: "8+", label: "Integrations" },
    stack: ["Next.js", "Supabase", "Vercel KV", "Monday", "Figma", "Frontify", "Meta", "Anthropic"],
    surfaces: ["Web app", "Figma plugin", "Iterator plugin", "GPT Actions API"],
    image: {
      src: "/project-cards/heimdall.webp",
      alt: "Heimdall briefing overview",
      width: 1000,
      height: 554,
    },
    walkthrough: {
      src: "/videos/tools/heimdall.mp4",
      poster: "/videos/tools/heimdall-poster.jpg",
    },
  },
];
