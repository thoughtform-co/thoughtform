/**
 * lib/arcs/legacyRoutes — every address an arc page has had and no longer
 * has, and where it lives now. Read by `next.config.mjs` as 308 redirects.
 *
 * An arc is an UNLISTED page whose whole distribution is a link somebody
 * forwarded, so the links in the wild are in inboxes: the cheapest way to
 * keep them working is to forward the address rather than ask anyone to
 * re-send it. That was ADR-098 §2's reason to keep the engagements flat;
 * ADR-142 nested them under their group (owner, 2026-10-03) and kept the
 * reason here instead.
 *
 * ⚠ PLAIN .mjs, NO IMPORTS: `next.config.mjs` loads it before any
 * TypeScript exists. `tests/lib/arcs-routes.test.ts` holds it to the
 * registry instead — every destination a live page, no source a live page,
 * and every address the site ever handed out still answering.
 *
 * ⚠ ONE FLAT ADDRESS IS NOT HERE: `/arcs/ap-hogeschool` was the lecture and
 * is now the school's own page, which lists the lecture. A redirect would
 * hide that page, so the old link lands one card away from the lecture.
 *
 * ⚠ ONE HOP, ALWAYS. A destination is never itself a source; an older row
 * whose page moved again is re-pointed at the page's address today.
 */

/** @type {ReadonlyArray<readonly [source: string, destination: string]>} */
export const LEGACY_ARC_ROUTES = [
  // Renamed before ADR-142: the Loop arc was authored at `/arcs/portfolio`,
  // the Trinny pitch at `/trinny-london` (ADR-099).
  ["/arcs/portfolio", "/arcs/loop/portfolio"],
  ["/trinny-london", "/arcs/trinny-london/proposal"],
  // ADR-142: the clients' engagements, under their client.
  ["/arcs/loop-earplugs", "/arcs/loop/portfolio"],
  ["/arcs/suri-proposal", "/arcs/suri/proposal"],
  ["/arcs/suri-workshop", "/arcs/suri/workshop"],
  ["/arcs/perfect-ted-proposal", "/arcs/perfect-ted/proposal"],
  ["/arcs/hungry-minds-proposal", "/arcs/hungry-minds/proposal"],
  ["/arcs/pandora-proposal", "/arcs/pandora/proposal"],
  ["/arcs/plopsa-workshop", "/arcs/plopsa/workshop"],
  // ADR-142: the house formats, under the house.
  ["/arcs/thoughtform-workshop", "/arcs/thoughtform/workshop-v1"],
  ["/arcs/thoughtform-workshop-v2", "/arcs/thoughtform/workshop-v2"],
  ["/arcs/claude-workshop", "/arcs/thoughtform/claude-workshop-v1"],
  ["/arcs/claude-workshop-v2", "/arcs/thoughtform/claude-workshop-v2"],
  ["/arcs/ai-keynote", "/arcs/thoughtform/keynote-v1"],
  ["/arcs/ai-keynote-v2", "/arcs/thoughtform/keynote-v2"],
  ["/arcs/ai-storytelling", "/arcs/thoughtform/ai-storytelling"],
  ["/arcs/ai-storytelling-class-1", "/arcs/thoughtform/ai-storytelling-class-1"],
  ["/claude-workshop", "/arcs/thoughtform/claude-workshop-corridor"],
];
