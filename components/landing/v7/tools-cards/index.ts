export { PROJECT_CASES, CASE_TOTAL } from "./toolCardData";
export type { CaseCapability, CaseMode, ProjectCase, TitleSegment } from "./toolCardData";
export {
  BarcodeStrip,
  CaseImage,
  DataField,
  IndexReadout,
  LabelChip,
  ModeBadge,
  ReticleBrackets,
  TickRuler,
  TitleSegs,
  seedDigits,
} from "./chrome";
export { NotchOutline } from "./NotchOutline";
export type { Corner } from "./NotchOutline";
export { useStackedCardsScroll } from "./useStackedCardsScroll";
export { ToolCardConsole } from "./ToolCardConsole";
// ToolsCardStack / ToolsPortal / ToolsRailRegisterPortal /
// ToolsTitleTypewriter retired with the #tools station (ADR-033).
// What survives here is the case DATA (PROJECT_CASES — now the single
// canonical case module, consumed by the Arc cases orbit bake) and the
// V2 console skin + chrome + stack hook the /test/project-cards
// look-dev lab still mounts.
