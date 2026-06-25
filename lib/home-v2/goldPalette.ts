/**
 * goldPalette — single source of truth for the corridor + #services gold so the
 * brandmark, its orbit armillary, and the substrate sphere all read as ONE
 * consistent "Tensor Gold" (2026-06-25 harmonization follow-up).
 *
 * Two families, deliberately separate:
 *
 *   HANDOFF_* — the FLAT-rest / flight gold. This is the brand gold = the SVG
 *     fill, so the matched-pixel SVG → particle handoff (ADR-023 Invariant 13)
 *     is color-seamless. LOCKED at the canonical `#caa554` / `#e9c97a`; shifting
 *     it pops the handoff. Do not change without also re-painting the SVG glyph.
 *
 *   TENSOR_* — the LANDED / #services gold. The settled wireframe + its orbit
 *     armillary read in this slightly-more-yellow, less-orange gold. The corridor
 *     shader lerps body/accent from HANDOFF_* toward TENSOR_* as the mark settles
 *     (`vWireCrisp`), and the production #services hologram uses TENSOR_* directly,
 *     so the corridor → #services transition is one continuous color, not a swap.
 *
 *   SPHERE_GOLD — the substrate sphere's gimbal + interior particle bed. These
 *     are ADDITIVE in the corridor, so overlapping warm dots bloomed toward an
 *     orange cast; a more-yellow base pulls that bloom back toward gold without
 *     touching the broadly-shared `COLOR_GOLD` (`artifactGeom`, 17 consumers).
 *
 * Tuned live against `/test/services-demo` (the parked reference) — see ADR-023.
 */

/** FLAT-rest / flight body gold — brand gold, == SVG fill. LOCKED (ADR-023). */
export const HANDOFF_GOLD = "#caa554";
/** FLAT-rest / flight accent. LOCKED. */
export const HANDOFF_ACCENT = "#e9c97a";

/** Landed / #services body gold — the harmonized "Tensor Gold," pushed clearly
 *  more yellow / less orange (hue ≈ 50° vs the old `#b08b42` ≈ 40°). */
export const TENSOR_GOLD = "#c2af4c";
/** Landed / #services limb accent — brighter, more-yellow counterpart. */
export const TENSOR_ACCENT = "#e6d27c";

/** Substrate sphere gimbal + interior particle bed gold — a more-yellow `#caa554`
 *  (`0xc8ad52`) so the additive bloom reads gold rather than orange. Exported as a
 *  NUMBER to match the type of `artifactGeom`'s `COLOR_GOLD` (`0xcaa554`) it
 *  replaces in the corridor shell files. */
export const SPHERE_GOLD = 0xceb852;
