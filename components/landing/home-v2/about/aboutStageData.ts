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
 * `{ em }` and `{ strong }` segments are semantic-dawn (owner 2026-07-20 —
 * upright per the no-italics rule; weight is the only emphasis they carry
 * now, not color). `{ accent }` is the ONE exception: a phrase-specific
 * HIGHLIGHT (`.voidwalker__bio-accent`) — gold FILL with latent-night ink,
 * the section menu's inverse-video block, not gold text. Reserved for a
 * single owner-named phrase — do not reuse it for general emphasis, that is
 * what `em`/`strong` are for.
 *
 * `{ mark }` is the quietest of the four (owner, 2026-07-27): dawn ink with
 * a gold UNDERLINE (`.voidwalker__bio-mark`). It names a real-world entity
 * inside running copy — currently "Loop Earplugs" — where the accent block
 * would shout and `em`/`strong` would say nothing. It is NOT a link: there
 * is no href, so it must not render as an `<a>` or take link affordances.
 */

export type BioSegment =
  | string
  | { em: string }
  | { strong: string }
  | { accent: string }
  | { mark: string };

export const ABOUT_STAGE = {
  /** The h2 — the name only, rendered UPPERCASE via CSS (owner 2026-07-17:
   *  "just my name in caps"). The "// Voidwalker." alias line was dropped. */
  name: "Vince Buyssens",
  role: "Creative Technologist · Founder · AI Adoption",
  bios: [
    [
      { strong: "Vince" },
      " has been navigating the tides of digital change for over a decade: social media, online communities, now ",
      { em: "intelligence itself." },
    ],
    [
      "AI is different: it isn't software to command, but an ",
      { accent: "intelligence to navigate" },
      ". Through Thoughtform, he helps teams build that relationship, mapping the fit between their work and the intelligence available.",
    ],
    [
      "He runs the same practice inside ",
      { mark: "Loop Earplugs" },
      ", leading AI adoption: advising leadership, embedding with teams, building the tools behind the marketing engine.",
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
