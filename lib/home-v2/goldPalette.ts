/**
 * goldPalette — single source of truth for the corridor + #services gold so the
 * brandmark, its orbit armillary, and the substrate sphere all read as ONE
 * consistent gold (2026-06-25 harmonization → unify-on-one-color → orange pass).
 *
 *   TENSOR_* — the unified corridor + #services gold. The brandmark reads in
 *     this single gold across its ENTIRE journey: the 2D rest SVG
 *     (`ProjectedBrandmarkActor` paints `BrandmarkGlyph` with `TENSOR_GOLD`),
 *     its drop-shadow glow, the matched-pixel particle flight (`FLAT_WIRE_*` in
 *     `BrandmarkPhysicsCoreActor`), the landed in-sphere wireframe, the orbit
 *     armillary, and the production #services hologram all use `TENSOR_*`. The
 *     matched-pixel SVG → particle handoff (ADR-023 Invariant 13) is
 *     color-seamless because the SVG fill and the particle FLAT color are the
 *     same gold, and there is no mid-journey color lerp — the whole corridor
 *     brandmark is one continuous color. The value is the "darker yellow-orange"
 *     retrofuturistic glow (`#b08b42`) — reverted from a too-yellow Tensor
 *     (`#c2af4c`) at the user's request; the name `TENSOR_*` is kept as a stable
 *     semantic label so the ~30 import sites don't churn. Distinct from the
 *     global site brand gold `#caa554` (`--gold`, `app/styles/variables.css`),
 *     which is unchanged.
 *
 *   SPHERE_GOLD — the substrate sphere's gimbal + interior particle bed. These
 *     are ADDITIVE in the corridor; `#caa554` (`0xcaa554`) is the established
 *     sphere gold (the broadly-shared `COLOR_GOLD` from `artifactGeom`, 17
 *     consumers), kept here as the corridor-local copy so the sphere reads as
 *     the retrofuturistic orange, a touch lighter than the `#b08b42` mark.
 *
 * Tuned live against `/test/services-demo` (the parked reference) — see ADR-023.
 */

/** Unified corridor + #services body gold — the "darker yellow-orange"
 *  retrofuturistic glow (hue ≈ 40°). Used for the brandmark rest SVG, the
 *  particle flight, the landed wireframe, the orbits, and #services. */
export const TENSOR_GOLD = "#b08b42";
/** Unified limb accent — brighter, warmer counterpart. */
export const TENSOR_ACCENT = "#dcc176";

/** Substrate sphere gimbal + interior particle bed gold — `#caa554`
 *  (`0xcaa554`), the established retrofuturistic-orange sphere gold. Exported as
 *  a NUMBER to match the type of `artifactGeom`'s `COLOR_GOLD` (`0xcaa554`) it
 *  replaces in the corridor shell files. */
export const SPHERE_GOLD = 0xcaa554;
