/**
 * Build case content for the production v7 landing page.
 *
 * Source of truth for the four creative-tech tools shown in section 05.
 * Copy is adapted from the Loop creative-tech showcase export (April 2026)
 * and trimmed for the editorial slide format. Screenshots come from
 * `public/showcase/creative-tech/screenshots/<case>/*.png` (renamed to
 * lowercase-dashed slugs by `scripts/normalize-creative-tech-filenames.ps1`).
 *
 * If you want to wire these into the latent-case prototype too, prefer the
 * canonical entries here and have the prototype consume this module — the
 * goal is for `/test/latent-cases` and the production landing to drift no
 * further apart.
 */

export type BuildCaseWorkflow = "repair" | "compress" | "invent";
export type BuildCaseStatus = "production" | "wip";

export interface BuildCaseScreenshot {
  src: string;
  alt: string;
  /**
   * "wide" — fills the visual frame (laptop / app shell).
   * "tall" — portrait crop, used for inset capabilities or annotations.
   */
  shape?: "wide" | "tall";
}

export interface BuildCaseCapability {
  title: string;
  body: string;
}

export interface BuildCaseMetric {
  value: string;
  label: string;
}

export interface BuildCase {
  id: "vesper" | "mimir" | "babylon" | "heimdall";
  /** Slide index, eg "01 / 04". */
  index: string;
  /** Domain crumb shown in the eyebrow ("Studio · Design · Product"). */
  domain: string;
  /** Big display name (rendered with a trailing diamond/period accent). */
  name: string;
  tagline: string;
  /** One-line italic subline rendered under the name. */
  subline: string;
  workflow: BuildCaseWorkflow;
  /** 1-2 sentence body explaining the workflow shift. */
  workflowBody: string;
  status: BuildCaseStatus;
  /** Three metric callouts. Keep values short — they render as display type. */
  metrics: [BuildCaseMetric, BuildCaseMetric, BuildCaseMetric];
  /** Stack pills displayed in the editorial column. Limit ~6 items. */
  stack: string[];
  /** 3-4 capability cards rendered under the body or visual. */
  capabilities: BuildCaseCapability[];
  hero: BuildCaseScreenshot;
  /** Optional 1-2 supporting shots used as decorative inserts in the frame. */
  inserts?: BuildCaseScreenshot[];
  repoUrl: string;
}

export const BUILD_CASES: readonly BuildCase[] = [
  {
    id: "vesper",
    index: "01 / 04",
    domain: "Studio · Design · Product",
    name: "Vesper",
    tagline: "AI image & video generation",
    subline: "Replaced Krea. Built in-house.",
    workflow: "compress",
    workflowBody:
      "One interface for prompt enhancement, multi-model generation, and image-to-video. Only the models Studio actually uses, with full cost transparency per generation.",
    status: "production",
    metrics: [
      { value: "Daily", label: "Campaigns shipped" },
      { value: "0%", label: "Margin vs. Krea" },
      { value: "6+", label: "Models unified" },
    ],
    stack: ["Next.js", "Supabase", "Claude", "Gemini", "Replicate", "Kling"],
    capabilities: [
      {
        title: "Prompt enhancement",
        body: "Claude-powered refinement, linked to the Loop product catalogue.",
      },
      {
        title: "Multi-model generation",
        body: "Gemini Flash Image, Veo 3.1, Seedream, Kling — one shell, one cost line.",
      },
      {
        title: "Animate still",
        body: "Image-to-video without leaving the tab. Small fix, big flow.",
      },
      {
        title: "PDF image extraction",
        body: "Pulls references straight out of brief docs. No more manual paste.",
      },
    ],
    hero: {
      src: "/showcase/creative-tech/screenshots/vesper/vesper-home.png",
      alt: "Vesper home — multi-model generation interface with prompt enhancement and cost transparency",
      shape: "wide",
    },
    inserts: [
      {
        src: "/showcase/creative-tech/screenshots/vesper/vesper-prompt.png",
        alt: "Vesper prompt enhancement panel",
        shape: "wide",
      },
      {
        src: "/showcase/creative-tech/screenshots/vesper/vesper-img-2-video.png",
        alt: "Vesper image-to-video controls",
        shape: "wide",
      },
    ],
    repoUrl: "https://github.com/tensalir/Loop-Vesper",
  },
  {
    id: "mimir",
    index: "02 / 04",
    domain: "Strategy · Product · Insights",
    name: "Mímir",
    tagline: "Brand intelligence",
    subline: "Loop’s own knowledge, structured.",
    workflow: "invent",
    workflowBody:
      "Customer voice, ad performance, strategic research, and market signals in one place. Composable building blocks that turn evidence into briefs and personas.",
    status: "wip",
    metrics: [
      { value: "4+", label: "Intelligence sources" },
      { value: "Briefs", label: "+ personas" },
      { value: "Co.-wide", label: "Scope" },
    ],
    stack: ["Claude", "Supabase", "Meta Graph", "Exa", "Perplexity"],
    capabilities: [
      {
        title: "Customer voice",
        body: "Synthesised evidence across reviews, buyer feedback, and the brand growth framework.",
      },
      {
        title: "Ad performance",
        body: "First-party experiment data with KPI facets and variant-level drill-down.",
      },
      {
        title: "Structured briefs",
        body: "Three-panel composer that turns evidence into structured briefs.",
      },
      {
        title: "External signals",
        body: "Meta Ads Library, Reddit listening, and Exa trend mining (next).",
      },
    ],
    hero: {
      src: "/showcase/creative-tech/screenshots/mimir/mimir-feed.png",
      alt: "Mímir intelligence feed — customer reviews, ad performance, and strategic signals in one view",
      shape: "wide",
    },
    inserts: [
      {
        src: "/showcase/creative-tech/screenshots/mimir/mimir-loop-ads-closeup.png",
        alt: "Mímir Loop Ads close-up",
        shape: "wide",
      },
      {
        src: "/showcase/creative-tech/screenshots/mimir/mimir-personas.png",
        alt: "Mímir generated personas",
        shape: "wide",
      },
    ],
    repoUrl: "https://github.com/tensalir/mimir",
  },
  {
    id: "babylon",
    index: "03 / 04",
    domain: "Studio · UGC · Pipeline",
    name: "Babylon",
    tagline: "Localization & dubbing pipeline",
    subline: "One approval step instead of five.",
    workflow: "invent",
    workflowBody:
      "Pull assets from Monday and Frontify, transcribe, verify captions, translate with brand voice, dub, caption, and review — all without leaving the pipeline.",
    status: "wip",
    metrics: [
      { value: "30+", label: "Languages supported" },
      { value: "1", label: "Review step" },
      { value: "End-to-end", label: "Pipeline" },
    ],
    stack: ["Next.js", "Supabase", "ElevenLabs", "Claude", "Gemini", "Remotion"],
    capabilities: [
      {
        title: "Monday + Frontify sync",
        body: "One-click ingest from Creative Briefs. Dedup on re-sync.",
      },
      {
        title: "Caption-verified transcription",
        body: "Gemini visual check against on-screen captions for tight timing.",
      },
      {
        title: "Loop Localization skill",
        body: "Brand-voice-aware translation across 30+ languages via Claude Skills.",
      },
      {
        title: "Timeline editor",
        body: "Drag-and-drop caption editing with Remotion-powered animated captions.",
      },
    ],
    hero: {
      src: "/showcase/creative-tech/screenshots/babylon/babylon-overview.png",
      alt: "Babylon overview — localization and dubbing pipeline UI",
      shape: "wide",
    },
    inserts: [
      {
        src: "/showcase/creative-tech/screenshots/babylon/babylon-dubbing-example.png",
        alt: "Babylon dubbing timeline example",
        shape: "wide",
      },
      {
        src: "/showcase/creative-tech/screenshots/babylon/babylon-analytics.png",
        alt: "Babylon analytics dashboard",
        shape: "wide",
      },
    ],
    repoUrl: "https://github.com/tensalir/babylon",
  },
  {
    id: "heimdall",
    index: "04 / 04",
    domain: "Cross-department · Orchestration",
    name: "Heimdall",
    tagline: "Project management orchestration",
    subline: "Connects the tools that won’t merge.",
    workflow: "repair",
    workflowBody:
      "Bridges Monday, Figma, and Frontify. Briefings move automatically; feedback is summarised across systems that will never share a database.",
    status: "production",
    metrics: [
      { value: "8+", label: "Integrations" },
      { value: "Web + 2", label: "Figma plugins" },
      { value: "Live", label: "In production" },
    ],
    stack: ["Next.js", "Supabase", "Vercel KV", "Claude", "Figma Plugin API"],
    capabilities: [
      {
        title: "Briefing sync",
        body: "Monday webhooks → Claude field extraction → Figma plugin builds the page.",
      },
      {
        title: "Iterator plugin",
        body: "In-Figma variant generation and format derivation (9:16, 4:5, 1:1).",
      },
      {
        title: "Feedback summariser",
        body: "Aggregates Figma comments and stakeholder feedback across briefings.",
      },
      {
        title: "Forecast",
        body: "Capacity-vs-forecast dashboards with sprint assignment push.",
      },
    ],
    hero: {
      src: "/showcase/creative-tech/screenshots/heimdall/heimdall-briefing-overview.png",
      alt: "Heimdall briefing overview — orchestration across Monday, Figma, and Frontify",
      shape: "wide",
    },
    inserts: [
      {
        src: "/showcase/creative-tech/screenshots/heimdall/heimdall-figma-plugin.png",
        alt: "Heimdall Figma plugin",
        shape: "wide",
      },
      {
        src: "/showcase/creative-tech/screenshots/heimdall/heimdall-feedback-summarizer.png",
        alt: "Heimdall feedback summariser",
        shape: "wide",
      },
    ],
    repoUrl: "https://github.com/tensalir/heimdall",
  },
];

const WORKFLOW_LABELS: Record<BuildCaseWorkflow, string> = {
  repair: "Repair",
  compress: "Compress",
  invent: "Invent",
};

export function workflowLabel(mode: BuildCaseWorkflow): string {
  return WORKFLOW_LABELS[mode];
}
