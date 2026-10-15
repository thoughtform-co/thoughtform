import type { ArcDef } from "../types";

/**
 * The portfolio, as a house arc (owner, 2026-10-15): "Prompt to Loop", the
 * breakdown of one real motion ad Claude made for Loop Experience 2 Gold,
 * converted out of its generated slides into the register the X-Bionic
 * proposal and the UX meetup talk set: two part statements and one drawing
 * a beat, each lettered in DOM on the ramp. It flows, as a portfolio does.
 *
 * ⚠ AN OWN ROUTE (`app/(marketing)/arcs/thoughtform/portfolio/`), because
 * eleven of its beats are one case's bodies, not a grammar: those live in
 * the route's `chapters.ts` and `PortfolioChapters.tsx`. The beats that ARE
 * the house's kinds (the statements, the close) are authored
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
  /* No `motion`: the portfolio FLOWS (ADR-076). The pinned deck grammar
     held every beat through a tail of runway after its words had un-typed,
     so the reader scrolled past pictures with no text (owner, 2026-10-15). */
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
      id: "the-video",
      kind: "interstitial",
      variant: "statement",
      glitch: true,
      menuLabel: "The video",
      menuPrimary: true,
      eyebrow: "Part one · One real video",
      line: { pre: "Every step of one real video,", em: "in the order it happened." },
    },
    {
      id: "the-check",
      kind: "interstitial",
      variant: "statement",
      glitch: true,
      menuLabel: "The check",
      menuPrimary: true,
      eyebrow: "Part two · The check",
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
