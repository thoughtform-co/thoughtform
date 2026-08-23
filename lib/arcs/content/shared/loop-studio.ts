import type { ArcCardItem, ArcSectionOf } from "../../types";

/**
 * Loop Studio's proof — SHARED EVIDENCE (ADR-072).
 *
 * The three paid-social cuts and the world-first AI ATL film, hoisted
 * verbatim out of `ai-keynote.ts`. The keynote imports them by reference;
 * the portfolio arc takes the cards through `ratiosOnly()`.
 *
 * ⚠ MONEY. The cards carry per-ad spend and order value in euros. The
 * keynote is a client DECK — shown live, unlisted — and prints them
 * deliberately (the exemption is recorded beside `STUDIO_SHOTS` in
 * `lib/cases/content/loop-earplugs.ts`). The portfolio is a page a reader
 * forwards, so it sits inside the casefile's confidentiality envelope:
 * NO currency, NO thousands separators. `ratiosOnly` keeps the SKU and the
 * ROAS — a ratio is clean — and the arcs registry test scans the portfolio
 * for the rest. The 97 % in the studio head stays canonical across the
 * landing, the keynote and the portfolio (parity-pinned).
 */
export const STUDIO_AD_CARDS: readonly ArcCardItem[] = [
  {
    id: "exp-sb93-filter",
    title: "Loop Switch ad",
    body: "It's parenting, but just the good bits — earplug case with hear/filter checklist.",
    image: {
      src: "/arcs/studio-ads/exp-sb93-filter.jpg",
      alt: "Loop Switch ad: It's parenting, but just the good bits — earplug case with hear/filter checklist.",
    },
    metaRows: [
      { label: "SKU", value: "EXP-SB93TOF · Filter · Engage · Mix" },
      { label: "Spend", value: "€ 5.553,67" },
      { label: "Order value", value: "€ 15.226,25" },
      { label: "ROAS", value: "2,7" },
    ],
  },
  {
    id: "exp-lm103-highlight",
    title: "Loop fashion ad",
    body: "monochrome portrait of a man with a Loop earplug highlighted by a square reticle.",
    image: {
      src: "/arcs/studio-ads/exp-lm103-highlight.jpg",
      alt: "Loop fashion ad: monochrome portrait of a man with a Loop earplug highlighted by a square reticle.",
    },
    metaRows: [
      { label: "SKU", value: "EXP-LM103 · Highlight · Mix · Fashion" },
      { label: "Spend", value: "€ 1.328,79" },
      { label: "Order value", value: "€ 7.082,45" },
      { label: "ROAS", value: "5,33" },
    ],
  },
  {
    id: "exp-sb92-ski",
    title: "Loop Engage ad",
    body: "stress-free ski trips — skier in helmet and goggles, three callout chips around the ear.",
    image: {
      src: "/arcs/studio-ads/exp-sb92-ski.jpg",
      alt: "Loop Engage ad: stress-free ski trips — skier in helmet and goggles, three callout chips around the ear.",
    },
    metaRows: [
      { label: "SKU", value: "EXP-SB92BOF · Ski · Engage · Mix" },
      { label: "Spend", value: "€ 1.200,60" },
      { label: "Order value", value: "€ 7.371,58" },
      { label: "ROAS", value: "6,14" },
    ],
  },
];

/** The same card, with the money rows stripped — SKU and ROAS survive. */
export function ratiosOnly(card: ArcCardItem): ArcCardItem {
  return {
    ...card,
    metaRows: card.metaRows?.filter((row) => row.label === "SKU" || row.label === "ROAS"),
  };
}

/** Loop's world-first AI above-the-line film, as a media beat. */
export const AI_ATL_SECTION: ArcSectionOf<"media"> = {
  id: "proof-ai-atl",
  kind: "media",
  menuLabel: "Proof",
  ariaLabel: "Loop's world-first AI above-the-line video",
  head: {
    eyebrow: "Loop Earplugs · September 2025",
    title: { pre: "World-first", em: "AI ATL", post: "video." },
    sub: "Loop was the first brand to make a full AI above-the-line video. Concept, casting, shot list, comp, edit — the whole pipeline shaped through AI, finished by the team.",
  },
  media: {
    type: "video",
    src: "/videos/loop-smug-owl-ai-atl.mp4",
    poster: "/arcs/posters/smug-owl.jpg",
  },
  caption: {
    label: "Smug Owl · Loop ATL",
    meta: "16:9 master · 30 sec",
    sourceLabel: "Loop Earplugs creative archive",
  },
};
