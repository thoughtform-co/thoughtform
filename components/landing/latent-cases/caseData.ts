export type WorkflowMode = "repair" | "compress" | "invent";

export type CaseStatus = "production" | "wip";

export interface LoopCaseMetric {
  value: string;
  label: string;
}

export interface LoopCaseCapability {
  title: string;
  body: string;
}

export interface LoopCaseStudy {
  id: string;
  slug: string;
  index: string;
  domainEyebrow: string;
  name: string;
  tagline: string;
  subline: string;
  summary: string;
  workflowMode: WorkflowMode;
  workflowBody: string;
  status: CaseStatus;
  metrics: LoopCaseMetric[];
  stack: string[];
  capabilities: LoopCaseCapability[];
  repoUrl: string;
  /** Accent for diamond / status strip (Thoughtform gold tier + domain tint) */
  accentVar: string;
}

export const LOOP_CASE_STUDIES: LoopCaseStudy[] = [
  {
    id: "vesper",
    slug: "vesper",
    index: "01 / 04",
    domainEyebrow: "Studio · Design · Product",
    name: "Vesper",
    tagline: "AI Image & Video Generation",
    subline: "Replaced Krea. Built in-house.",
    summary:
      "Internal generation platform. Multi-model, prompt-enhanced, cost-transparent. Designed around the Studio team's daily flow.",
    workflowMode: "compress",
    workflowBody:
      "One interface: prompt enhancement, generation, and image-to-video in a single flow. Only the models Studio uses. Full cost transparency per generation.",
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
        body: "Gemini Flash Image, Veo 3.1, Seedream, Kling in one interface.",
      },
      {
        title: "Animate still",
        body: "Image-to-video without leaving the tab.",
      },
      {
        title: "PDF image extraction",
        body: "Pulls references out of brief docs directly.",
      },
    ],
    repoUrl: "https://github.com/tensalir/Loop-Vesper",
    accentVar: "var(--gold)",
  },
  {
    id: "mimir",
    slug: "mimir",
    index: "02 / 04",
    domainEyebrow: "Creative Strategy · Product · Insights",
    name: "Mímir",
    tagline: "Brand Intelligence",
    subline: "Loop's own knowledge, structured.",
    summary:
      "Brand intelligence for the whole company. Customer voice, ad performance, strategic research, and market signals in one place.",
    workflowMode: "invent",
    workflowBody:
      "One interface surfaces best-performing ads, customer reviews, strategic insight themes, and competitive signals as composable building blocks.",
    status: "wip",
    metrics: [
      { value: "4+", label: "Intelligence sources" },
      { value: "Briefs + personas", label: "Core uses" },
      { value: "Company-wide", label: "Scope" },
    ],
    stack: ["Claude", "Supabase", "Meta Graph API", "Exa", "Perplexity"],
    capabilities: [
      {
        title: "Customer voice",
        body: "Synthesised evidence across reviews, buyer feedback, and brand growth framework.",
      },
      {
        title: "Ad performance intelligence",
        body: "First-party ad experiment data with KPI facets and variant-level drill-down.",
      },
      {
        title: "Structured brief generation",
        body: "Three-panel composer that turns evidence into structured briefs.",
      },
      {
        title: "External signals (next)",
        body: "Meta Ads Library, Reddit social listening, and Exa trend mining.",
      },
    ],
    repoUrl: "https://github.com/tensalir/mimir",
    accentVar: "rgba(109, 79, 166, 0.95)",
  },
  {
    id: "babylon",
    slug: "babylon",
    index: "03 / 04",
    domainEyebrow: "Studio · UGC",
    name: "Babylon",
    tagline: "Copy, Localization & Dubbing Pipeline",
    subline: "One approval step instead of five.",
    summary:
      "Translate, transcribe, dub, caption, QA — for video and copy. One pipeline connected to the Monday + Frontify workflow Loop already runs.",
    workflowMode: "invent",
    workflowBody:
      "One pipeline: pull assets from Monday and Frontify, transcribe, verify captions, translate with brand voice, dub, caption, and review.",
    status: "wip",
    metrics: [
      { value: "30+", label: "Languages supported" },
      { value: "1", label: "Review steps" },
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
        body: "Gemini visual check against on-screen captions for timecode accuracy.",
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
    repoUrl: "https://github.com/tensalir/babylon",
    accentVar: "rgba(91, 122, 78, 0.95)",
  },
  {
    id: "heimdall",
    slug: "heimdall",
    index: "04 / 04",
    domainEyebrow: "Cross-department",
    name: "Heimdall",
    tagline: "Project Management Orchestration",
    subline: "Connects the tools that won't merge.",
    summary:
      "The orchestration layer. Bridges Monday, Figma, and Frontify, moving information between systems that will never share a database.",
    workflowMode: "repair",
    workflowBody:
      "Monday webhooks trigger automatic briefing creation in Figma via a plugin. Feedback from Figma and Monday is summarised into a single sheet.",
    status: "production",
    metrics: [
      { value: "8+", label: "Integrations" },
      { value: "Web + 2 Figma plugins", label: "Surfaces" },
      { value: "Production", label: "Uptime" },
    ],
    stack: ["Next.js", "Supabase", "Vercel KV", "Claude", "Figma Plugin API"],
    capabilities: [
      {
        title: "Briefing sync",
        body: "Monday webhooks → Claude field extraction → Figma plugin creates template pages.",
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
    repoUrl: "https://github.com/tensalir/heimdall",
    accentVar: "rgba(202, 165, 84, 0.9)",
  },
];
