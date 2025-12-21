// ═══════════════════════════════════════════════════════════════════
// DEFAULT VALUES - Default content and dimensions for elements
// ═══════════════════════════════════════════════════════════════════

import type {
  ElementType,
  ElementContent,
  SectionType,
  SectionContent,
  TextContent,
  ImageContent,
  VideoContent,
  ButtonContent,
  ContainerContent,
  DividerContent,
  HeroContent,
  QuoteContent,
  TaglineContent,
  CTAContent,
  ProblemContent,
  ShiftContent,
  ServicesContent,
  AboutContent,
} from "@/types";

// Default element dimensions
export const DEFAULT_ELEMENT_DIMENSIONS: Record<ElementType, { width: number; height: number }> = {
  text: { width: 400, height: 100 },
  image: { width: 300, height: 200 },
  video: { width: 560, height: 315 },
  button: { width: 150, height: 44 },
  container: { width: 400, height: 300 },
  divider: { width: 200, height: 2 },
};

// Default content for new elements
export const DEFAULT_ELEMENT_CONTENT: Record<ElementType, ElementContent> = {
  text: {
    html: "<p>Click to edit text</p>",
    fontSize: 16,
    fontFamily: "sans",
    fontWeight: "normal",
    color: "dawn-70",
    textAlign: "left",
  } as TextContent,
  image: {
    src: "",
    alt: "Image description",
    objectFit: "cover",
  } as ImageContent,
  video: {
    src: "",
    type: "url",
    autoplay: false,
    loop: false,
    muted: true,
  } as VideoContent,
  button: {
    text: "CLICK ME",
    href: "#",
    variant: "solid",
    size: "md",
  } as ButtonContent,
  container: {
    children: [],
    direction: "column",
    alignItems: "start",
    justifyContent: "start",
    gap: 16,
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
  } as ContainerContent,
  divider: {
    orientation: "horizontal",
    thickness: 1,
    color: "dawn-15",
    style: "solid",
  } as DividerContent,
};

// Default content for each section type
export const DEFAULT_SECTION_CONTENT: Record<SectionType, SectionContent | null> = {
  hero: {
    logoType: "text",
    logoText: "THOUGHT + FORM",
    headline: "Thoughtform pioneers intuitive human-AI collaboration.",
    subheadline: "We teach teams how to navigate AI for creative and strategic work.",
    primaryButton: { text: "GUIDE ME", href: "#contact", variant: "solid" },
    secondaryButton: { text: "LEARN MORE", href: "#manifesto", variant: "ghost" },
    contentAlign: "left",
    showLogo: true,
    showHeadline: true,
    showSubheadline: true,
    showButtons: true,
  } as HeroContent,
  quote: {
    quote:
      "The future belongs to those who understand that doing more with less is compassionate, prosperous, and enduring, and thus more intelligent than the opposite.",
    attribution: "— R. Buckminster Fuller",
  } as QuoteContent,
  tagline: {
    tagline: "CLARITY IN COMPLEXITY",
    subtext: "Navigate the noise. Find your signal.",
  } as TaglineContent,
  cta: {
    headline: "Charting a new course.",
    subheadline: "Ready to navigate AI with intention?",
    primaryButton: { text: "SCHEDULE A CALL", href: "#contact", variant: "solid" },
    secondaryButton: { text: "VIEW SERVICES", href: "#services", variant: "ghost" },
  } as CTAContent,
  problem: {
    title: "You're already behind.",
    description:
      "While you're reading best practices from last quarter, the landscape has already shifted. The old playbooks don't account for a world where AI can draft, design, and decide in seconds.",
    symptoms: [
      { icon: "⬡", text: "Drowning in AI options" },
      { icon: "⬢", text: "Team resistance" },
      { icon: "⬡", text: "Hallucination anxiety" },
      { icon: "⬢", text: "No clear ROI path" },
    ],
  } as ProblemContent,
  shift: {
    title: "THOUGHTFORM",
    definition: "Architecture of intention. How ideas take shape.",
    cards: [
      { icon: "N", title: "NAVIGATE", description: "Map the AI landscape with clarity" },
      { icon: "E", title: "EVALUATE", description: "Test what works for your context" },
      { icon: "S", title: "SYNTHESIZE", description: "Integrate AI into existing workflows" },
    ],
  } as ShiftContent,
  services: {
    title: "Services",
    services: [
      { title: "AI Navigation Sessions", description: "1:1 strategic guidance for leaders" },
      { title: "Team Workshops", description: "Hands-on training for creative teams" },
      { title: "Workflow Audits", description: "Find AI opportunities in your process" },
      { title: "Implementation Support", description: "Ongoing guidance as you scale" },
    ],
  } as ServicesContent,
  about: {
    title: "About",
    bio: "Strategic consultant bridging human creativity and artificial intelligence. Former creative director now helping organizations navigate the AI landscape with intention.",
    credentials: [
      "10+ years creative direction",
      "Fortune 500 AI strategy",
      "Published author on human-AI collaboration",
    ],
  } as AboutContent,
  proof: null, // Uses logos, handled differently
  musings: null, // Uses blog posts, handled differently
  freeform: null,
};
