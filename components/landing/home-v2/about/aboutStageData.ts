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
  /** The h2, two lines — the second renders gold (voidwalker__name em). */
  name: "Vince Buyssens",
  nameEm: "// Voidwalker.",
  role: "Founder · Navigator · Loop Earplugs AI Strategy",
  bios: [
    [
      { strong: "Vince" },
      " has spent a decade moving teams through the tides of digital change — the web, mobile, creator economies, and now ",
      { em: "intelligence itself." },
    ],
    [
      "Through Thoughtform he teaches organisations how to think and build with AI — keynotes, intensives, and embedded residencies with teams ready to ship.",
    ],
    [
      "Inside Loop Earplugs he runs the same practice from the inside: shaping AI strategy and using AI to prototype the tools that power the marketing engine.",
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
