import type { ArcDef } from "@/lib/arcs/types";

/**
 * The cases page (`/cases`, owner, 2026-10-19): the swarm
 * proposal's opening (the layer, the three steps, Marketing then every team)
 * and the case dossier, for no client, so it can be sent to anyone as "an
 * overview of what we've been doing".
 *
 * ⚠ A PUBLIC PAGE, NOT AN ARC (owner, 2026-10-19: "this is basically a
 * public page"): it sits at the root, unlisted in the arcs registry, with
 * no password, and is indexed. It borrows the arc record's shape (`ArcDef`)
 * so `ArcShell`, `ArcHero` and `ArcSectionRenderer` draw it; the opening is
 * the swarm's drawn sections and the cases are the dossier
 * (`components/arcs/case-dossier/`). The old arc address 308s here.
 *
 * ⚠ NO CLIENT NAMED BUT THE CASES' OWN: the opening is lettered for no one
 * (`NetworkOrg org={null}`, `EmbedStack house`), and the route's test walks
 * the rendered page for any other client's name.
 */
export const CASES_PAGE: ArcDef = {
  slug: "thoughtform-cases",
  leaf: "cases",
  format: "portfolio",
  kind: "production",
  /* No `motion`: it flows, and the swarm's canvas needs the sections in
     flow (a pinned beat would clip its track). */
  status: "shipped",
  cardChip: "cases",
  date: "2026-10-19",
  cardTitle: "Approach and cases",
  cardLede:
    "The approach in three steps, then three brands where it runs: an asset library, a briefing flow and a motion ad.",
  cardImage: { src: "/images/services/embedded.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Cases · October 2026",
    title: { pre: "AI capability", em: "your teams own." },
    // One sentence, at most 120 characters: the homepage's measure (copyLaw.ts).
    lede: "How the approach works, then three brands where it runs today, step by step.",
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    plate: "gateway",
    curtain: true,
    actions: [
      { id: "approach", label: "The approach", href: "#vision", primary: true },
      { id: "cases", label: "The cases", href: "#cases" },
    ],
  },
  meta: {
    title: "Cases — Thoughtform",
    description:
      "How Thoughtform makes a team self-sufficient with AI, and three brands where it runs today.",
  },
  sections: [
    {
      id: "the-line",
      kind: "interstitial",
      variant: "callout",
      menuLabel: "Three brands",
      menuPrimary: true,
      line: { pre: "How we've made brands", em: "self-sufficient with AI." },
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "Contact",
      head: {
        eyebrow: "Thoughtform",
        title: { pre: "Your team,", em: "next." },
        sub: "The same approach, set up on your own work. Write with a question on any of the three.",
      },
      actions: [
        {
          id: "mail",
          label: "vince@thoughtform.co",
          href: "mailto:vince@thoughtform.co",
          primary: true,
        },
      ],
      footerLine: "Thoughtform · Cases · October 2026",
      signature: "Vince Buyssens",
    },
  ],
};
