// Arc Cases Card (ADR-036; sigil trigger + phased reveal ADR-041) — public
// barrel:
//   - the in-canvas 3D tools card + its capability gate (mounted inside the
//     gyro assembly by BrandmarkAccretionShell);
//   - the arming SIGIL, a world-anchored marker on the sphere's front pole
//     (mounted in the copy layer by CopyAnchors; replaces the ADR-035 chip);
//   - the accessible DOM stepper row + CLOSE (mounted in HomeCorridor).
export { ArcCasesCardGate } from "./ArcCasesCard";
export { ArcCasesSigil } from "./ArcCasesSigil";
export { ArcCasesStepper } from "./ArcCasesStepper";
export { prefetchCaseCardImages } from "./caseCardBake";
