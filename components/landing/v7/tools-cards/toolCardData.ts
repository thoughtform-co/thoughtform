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
  /**
   * The four capability blocks — ONE canonical set per tool, and since
   * ADR-068 U2 (owner, 2026-08-08) it renders in BOTH homes: the Arc orbit
   * card / `ToolCardConsole` tiles AND the casefile's detail 2×2, which now
   * prints title + claim instead of the retired WHO/WHAT Q&A register
   * (`ToolDetailFact` and the `detail` field are deleted — the owner filled
   * the blocks with the portfolio site's capability copy instead). Both
   * surfaces read THIS array, so a copy edit lands everywhere at once; the
   * registry pins title ≤24 (one mono line on the ARC tile, the tighter of
   * the two homes) and desc ≤95.
   */
  capabilities: [CaseCapability, CaseCapability, CaseCapability, CaseCapability];
  /**
   * The casefile rail's handle for this tool — the FUNCTION, mono caps, no
   * ordinal (ADR-066: no ordinal survives anywhere on that surface).
   *
   * ≤14 chars, and it is arithmetic, not taste: at four stations a quarter
   * of the 594.5px console leaves ~122px after padding and gap, which is
   * ~14 characters at the 10px control floor. A fifteenth character is what
   * costs the rail its diamond.
   */
  tab: string;
  /**
   * The BEFORE → NOW route, drawn as the plate's spine. Not prose: the
   * before-state is a sequence of steps a reader can count, and the whole
   * claim of a Software-for-Few tool is that the count collapses to one.
   */
  route: {
    /** 3–5 steps in the order the work used to move, each ≤12 chars — one
     *  mono cell on the route rail; a longer step wraps and breaks the row. */
    before: readonly string[];
    /** What the steps collapsed INTO, ≤10 chars — it sits in a single
     *  terminal cell the same width as one `before` step. */
    now: string;
    /** The cost of the old route, ≤44 chars — one mono line under the rail. */
    beforeMeta: string;
    /** What the new route buys, ≤44 chars — same line, opposite side. */
    nowMeta: string;
  };
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
   *  generation of loss; 30 buys 36% and holds up at 2x zoom on UI text.
   *  `duration` is printed on the watch bar ("1:20") — an honest CTA beats a
   *  bare verb, and the values are read off the encodes, not guessed. */
  walkthrough?: { src: string; poster: string; duration: string };
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
        desc: "Relevant insights surface while strategists compose the brief, not after another search pass.",
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
    tab: "BRIEFING AGENT",
    route: {
      before: ["REDDIT", "AD LIBRARY", "PERFORMANCE", "REVIEW NOTES", "PERSONAS"],
      now: "ONE BRIEF",
      beforeMeta: "FIVE SOURCES · BY HAND · EVERY CYCLE",
      nowMeta: "ONE SURFACE · WHILE THE BRIEF IS WRITTEN",
    },
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
      duration: "1:20",
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
    tab: "IMAGE & VIDEO",
    route: {
      before: ["PICK A TOOL", "PROMPT", "GENERATE", "EXPORT", "ANIMATE"],
      now: "ONE CANVAS",
      beforeMeta: "THREE TOOLS · COST INVISIBLE",
      nowMeta: "ONE CANVAS · DRAW VISIBLE PER RUN",
    },
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
      duration: "1:22",
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
    /* 2026, not 2025 — a factual correction (2026-08-07). Babylon's first
       commit is 2026-02-03; the 2025 here was carried over from the seed
       set. Mímir and Vesper stay 2025 (Vesper's first commit is
       2025-10-25, and Mímir's capability entered service under Heimdall's
       chain in 2025). The plate header prints this as `IN SERVICE …`, so a
       wrong year is a wrong claim on a client's record. */
    year: 2026,
    mode: "INVENT",
    challenge:
      "UGC localization had to scale across 30+ markets without turning every language into another agency handoff, Figma copy-paste loop, and reviewer queue.",
    shift:
      "Transcribe, translate, dub, and Gemini-verify in one pipeline so reviewers only judge the rows where culture matters.",
    /* Synced to the portfolio site's four blocks (owner, 2026-08-08 —
       ADR-068 U2). "30+ markets" and "Auto-verification" left with the sync;
       the 30+ claim survives in `metric` and the challenge, and the Gemini
       verify step still reads in `shift`. ⚠ "Localization roadmap" is the
       site's "Broader localization roadmap" compressed to the registry's
       24-char one-line tile budget — the site's own title wraps the Arc
       card's tile grid. */
    capabilities: [
      {
        title: "Proofreader integration",
        desc: "Integrates proofreading in the loop without giving access to the full system.",
      },
      {
        title: "Localization roadmap",
        desc: "Expanding to other use-cases such as exporting PDP copy from Figma in bulk.",
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
    tab: "UGC DUBBER",
    route: {
      before: ["TRANSCRIBE", "TRANSLATE", "DUB", "CAPTION", "QA"],
      now: "ONE REVIEW",
      beforeMeta: "FIVE HANDOFFS · THIRTY-PLUS MARKETS",
      nowMeta: "ONE FLOW · THE REVIEW STEP KEPT",
    },
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
      duration: "1:09",
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
    /* 2026 — same correction as Babylon above; Heimdall's first commit is
       2026-02-10. */
    year: 2026,
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
        desc: "A prototype that quickly spins up variants from the best-performing ads.",
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
    tab: "STUDIO PM",
    route: {
      before: ["READ BOARD", "FIND FILE", "CREATE PAGE", "PASTE"],
      now: "ONE ROUTE",
      beforeMeta: "RE-ENTRY ON EVERY BRIEF",
      nowMeta: "BOARD TO CANVAS · NOTHING RETYPED",
    },
    /* ⚠ HEIMDALL HAS NO MCP SERVER — never claim one anywhere on this
       record. Its surfaces are the board connector, the canvas plugin and
       the asset system; the encoded Skill runs inside that chain, not
       behind a headless endpoint. */
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
      duration: "0:40",
    },
  },
];
