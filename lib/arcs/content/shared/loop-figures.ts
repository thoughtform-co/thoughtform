/**
 * The Loop figures an arc may print — ONE SET (ADR-072).
 *
 * Copy-with-parity, the repo's precedent (`STUDIO_SHOTS`): `lib/arcs`
 * stays free of `lib/cases` imports, so these are retyped here and
 * `tests/lib/cases-registry.test.ts` asserts them equal to
 * `LOOP_EARPLUGS_CASE.report.stats` — a sweep that moves one moves the
 * other or fails loudly. Sources, per field:
 *
 *   workshops   22        board count of team sessions BRIEFED
 *                         (`ROLLOUT_ROWS`, `report.stats[0]`)
 *   skills      47+       Skills tagged to the five shapes (`MAP_GROUPS`
 *                         sums to 47; 42 / "forty-two" superseded 2026-08-02)
 *   tools       4         `PROJECT_CASES` / `CASE_TOTAL`
 *   people      5 → 130+  on the layer, organic pull (`report.stats[3]`)
 *   studioAi    97%       of paid-social briefings involve AI — canonical
 *                         across Proof, the keynote and the portfolio
 *   teamsUsing  14        teams with published Skill cards — USING the
 *                         layer, a DIFFERENT SET from the 22 briefed. Never
 *                         "22 teams mapped"; never lend one number the
 *                         other's meaning (`.claude/rules/proof.md`).
 */
export const LOOP_FIGURES = {
  workshops: "22",
  skills: "47+",
  tools: "4",
  people: "5 → 130+",
  studioAi: "97%",
  teamsUsing: "14",
} as const;
