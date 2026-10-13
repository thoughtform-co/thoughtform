import type { ArcSectionOf } from "../../types";

/**
 * In The Pocket's nine sector heroes on one wall — SHARED EVIDENCE.
 *
 * The AP lecture's one new picture (ADR-141), hoisted the day a second page
 * showed it (ADR-156, the UX meetup talk): one section, one record. Each page
 * authors its own head and reads the wall and its caption by reference.
 *
 * The wall is written by `scripts/arcs/prep-ap-hogeschool-assets.mjs`, which
 * reads the Drive finals only; the file keeps the path it was first shipped at.
 */
export const ITP_WALL_MEDIA: ArcSectionOf<"media">["media"] = {
  type: "image",
  src: "/arcs/ap-hogeschool/itp-nine-sectors-wall.webp",
  alt: "A wall of nine In The Pocket sector heroes in one look, the retail hero at the centre: finance, government, health, insurance, public transport, social secretariats, telco and utilities around it",
};

export const ITP_WALL_CAPTION: ArcSectionOf<"media">["caption"] = {
  label: "Nine briefs, one look",
  meta: "Nine sector heroes, signed off in August for the September campaign",
  sourceLabel: "In The Pocket · AI readiness",
};
