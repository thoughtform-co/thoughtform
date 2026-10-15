import type { ArcDef } from "../types";

/**
 * The portfolio, as a house arc (owner, 2026-10-15): "Prompt to Loop", the
 * breakdown of one real motion ad Claude made for Loop Experience 2 Gold,
 * converted out of its generated slides into the register the X-Bionic
 * proposal and the UX meetup talk set: statements that glitch in where they
 * stand, the proposal's isometric stack for the setup, and one drawing a
 * beat, each lettered in DOM on the ramp.
 *
 * ⚠ AN OWN ROUTE (`app/(marketing)/arcs/thoughtform/portfolio/`), because
 * eleven of its beats are one case's bodies, not a grammar: those live in
 * the route's `chapters.ts` and `PortfolioChapters.tsx`. The beats that ARE
 * the house's kinds (the statements, the stack, the close) are authored
 * here, and the route interleaves the two in `PORTFOLIO_RUN`'s order.
 *
 * ⚠ ONE CASE, ONE SET OF MEDIA. Every picture is the breakdown's own, under
 * `public/arcs/prompt-to-loop/` (ADR-143's record); nothing is copied.
 */
export const THOUGHTFORM_PORTFOLIO_ARC: ArcDef = {
  slug: "thoughtform-portfolio",
  leaf: "portfolio",
  format: "portfolio",
  kind: "production",
  /* Titles decode where they stand; nothing slides (the talk's grammar). */
  motion: "terminal",
  /* The ad shipped; the chip tells this card from Loop's portfolio. */
  status: "shipped",
  cardChip: "case",
  date: "2026-10-15",
  cardTitle: "Portfolio · Prompt to Loop",
  cardLede:
    "One real motion ad for Loop, from one prompt to a 10-second loop: the skill, then every step in order.",
  cardImage: { src: "/arcs/prompt-to-loop/ptl-02.jpg", alt: "" },
  hero: {
    eyebrow: "Portfolio · Loop Experience 2 Gold · October 2026",
    title: { pre: "From one prompt", em: "to a 10-second ad." },
    lede: "How the studio's motion skill is set up, then every step of one real video, in the order it happened.",
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    plate: "gateway",
    curtain: true,
    actions: [
      { id: "film", label: "The film", href: "#film", primary: true },
      { id: "steps", label: "The steps", href: "#the-video" },
    ],
  },
  meta: {
    title: "Prompt to Loop · portfolio — Thoughtform",
    description:
      "How Claude made a 10-second motion ad for Loop: the skill that holds the method, then every step of one real video.",
  },
  sections: [
    {
      id: "the-skill",
      kind: "interstitial",
      variant: "statement",
      glitch: true,
      menuLabel: "The skill",
      menuPrimary: true,
      eyebrow: "Part one · The skill",
      line: { pre: "You ask in your own words.", em: "The skill does the rest." },
    },
    {
      id: "setup",
      kind: "stack",
      menuLabel: "Setup",
      head: {
        eyebrow: "01 · The setup",
        title: { pre: "Where it lives.", em: "A skill, in a plugin, on Loop's shelf." },
        sub: "Nobody installs anything by hand. Turn the plugin on once, and the skill is there in every Claude app.",
      },
      figure: {
        tiers: ["tiles", "layer", "host", "shared"],
        lit: "layer",
        callouts: {
          tiles: {
            label: "What it reaches",
            lines: ["Figma for the ads, Vesper for paper,", "ElevenLabs for sound, Gemini to watch."],
          },
          layer: {
            label: "The plugin",
            lines: ["Loop Studio AI Motion.", "One install, and it updates itself."],
            chip: "Skill · evals · tools",
          },
          host: {
            label: "The marketplace",
            lines: ["Loop AI Studio: the shelf,", "a repository of the studio's plugins."],
          },
          shared: {
            label: "Loop's Claude",
            lines: ["Everyone signs in once", "with their Loop account."],
          },
        },
        tiles: [
          { id: "figma", bucket: "Ads", name: "Figma" },
          { id: "vesper", bucket: "Paper", name: "Vesper" },
          { id: "elevenlabs", bucket: "Sound", name: "ElevenLabs" },
          { id: "gemini", bucket: "Eyes", name: "Gemini" },
        ],
        courses: { skills: ["studio-ai-motion"], evals: ["5 requests × 3 runs"] },
        /* The tools' words left, so the lit plugin keeps the right side alone. */
        sides: { tiles: "left" },
        alt: "The setup as a stack: Loop's Claude at the base, the Loop AI Studio marketplace on it, the Loop Studio AI Motion plugin lit on that with its skill and evals, and on top the four tools it reaches: Figma, Vesper, ElevenLabs and Gemini.",
      },
    },
    {
      id: "the-video",
      kind: "interstitial",
      variant: "statement",
      glitch: true,
      menuLabel: "The video",
      menuPrimary: true,
      eyebrow: "Part two · One real video",
      line: { pre: "Every step of one real video,", em: "in the order it happened." },
    },
    {
      id: "the-check",
      kind: "interstitial",
      variant: "statement",
      glitch: true,
      menuLabel: "The check",
      menuPrimary: true,
      eyebrow: "Part three · The check",
      line: {
        pre: "If something reads wrong, it goes,",
        em: "however long it took to build.",
      },
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "Contact",
      head: {
        eyebrow: "Thoughtform",
        title: { pre: "One prompt.", em: "Your own skill next." },
        sub: "The method on this page is one skill in one plugin. The same can be set up for your team.",
      },
      actions: [
        {
          id: "mail",
          label: "vince@thoughtform.co",
          href: "mailto:vince@thoughtform.co",
          primary: true,
        },
      ],
      footerLine: "Thoughtform · Portfolio · October 2026",
      signature: "Vince Buyssens",
    },
  ],
};
