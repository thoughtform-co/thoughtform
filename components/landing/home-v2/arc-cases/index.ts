// Arc Cases Card (ADR-036; phased reveal ADR-041; DOM cue trigger ADR-042) —
// public barrel:
//   - the in-canvas 3D tools card + its capability gate (mounted inside the
//     gyro assembly by BrandmarkAccretionShell);
//   - the arming CUE, a dotted-leader + label docked under the Build station
//     title (mounted by CorridorStationHeaders; replaces the ADR-041 sphere
//     sigil, which replaced the ADR-035 chip);
//   - the transparent hit layer welded over the baked pager + ✕ (mounted in
//     the copy layer by CopyAnchors; replaces the floating stepper row).
export { ArcCasesCardGate } from "./ArcCasesCard";
export { ArcCasesCue } from "./ArcCasesCue";
export { ArcCasesHitLayer } from "./ArcCasesHitLayer";
export { prefetchCaseCardImages } from "./caseCardBake";
