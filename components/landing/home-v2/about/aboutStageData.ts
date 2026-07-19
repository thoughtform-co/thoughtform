/**
 * aboutStageData — copy for the ADR-047 pinned #about deck-flip stage
 * (the capable-desktop path).
 *
 * LOCKSTEP: these strings DUPLICATE the static `.voidwalker` fallback
 * markup in `public/prototypes/v7/landing-v7-motion.html` (the #about
 * station block) — the mobile / reduced-motion / WebGL-fallback surface.
 * Edit BOTH when the bio changes (the accepted dual-source pattern:
 * serviceData/servicePlateData, MAINTENANCE 2026-07-16).
 *
 * `{ em }` segments render as UPRIGHT GOLD (the site's no-italics rule);
 * `{ strong }` segments render gold at weight 500 (the `.voidwalker__bio
 * strong` treatment).
 */

export type BioSegment = string | { em: string } | { strong: string };

export const ABOUT_STAGE = {
  /** The h2 — the name only, rendered UPPERCASE via CSS (owner 2026-07-17:
   *  "just my name in caps"). The "// Voidwalker." alias line was dropped. */
  name: "Vince Buyssens",
  role: "Founder · Navigator · Loop Earplugs AI Strategy",
  bios: [
    [
      { strong: "Vince" },
      " has been navigating the tides of digital change for over a decade: social media, online communities, now ",
      { em: "intelligence itself." },
    ],
    [
      "AI is different: it isn't software to command, but an intelligence to navigate. Through Thoughtform, he helps teams build that relationship, mapping the fit between their work and the intelligence available.",
    ],
    [
      "He runs the same practice inside Loop Earplugs, leading AI adoption: advising leadership, embedding with teams, building the tools behind the marketing engine.",
    ],
  ] as readonly BioSegment[][],
  meta: [
    { k: "Base", v: "Antwerp · BE" },
    { k: "Practice", v: "10+ yrs" },
    { k: "Also at", v: "Loop Earplugs" },
  ],
  links: [
    { href: "#", label: "LinkedIn", icon: "linkedin" },
    { href: "#", label: "X / Twitter", icon: "x" },
    { href: "#", label: "Instagram", icon: "instagram" },
    { href: "mailto:vince@thoughtform.co", label: "Email", icon: "email" },
  ],
} as const;
