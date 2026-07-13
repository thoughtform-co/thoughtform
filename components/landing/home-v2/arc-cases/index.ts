/**
 * Arc Cases Terrace (ADR-034) — the four production cases on one
 * landscape screen that rises out of the substrate topography at the
 * Build park, click-armed via the bottom-right rail CTA. Supersedes
 * the ADR-033 orbit ring.
 */
export { ArcCasesTerraceScreen, type ArcCasesTerraceScreenProps } from "./ArcCasesTerraceScreen";
export { ArcCasesTerraceGate } from "./ArcCasesTerraceGate";
export { ArcCasesTerraceCta } from "./ArcCasesTerraceCta";
export {
  bakeCaseScreenFace,
  buildTerraceVeilCanvas,
  buildGlowCanvas,
  loadImage,
  waitForCardFonts,
  TERRACE_BAKE_W,
  TERRACE_BAKE_H,
  TERRACE_DOT_PITCH,
} from "./caseScreenBake";
