// ═══════════════════════════════════════════════════════════════
// ASTROGATION COMPONENTS - Barrel Export
// ═══════════════════════════════════════════════════════════════

// Types & Constants
export * from "./types";

// Utilities
export { DynamicSVG } from "./DynamicSVG";
export type { DynamicSVGProps } from "./DynamicSVG";

export { ThoughtformLogo } from "./ThoughtformLogo";
export type { ThoughtformLogoProps } from "./ThoughtformLogo";

export { cornersToToken, tokenToCorners, CornerSelector, HUDWrapper } from "./helpers";
export type { CornerSelectorProps, HUDWrapperProps } from "./helpers";

export { generateJSXCode } from "./generateJSXCode";

// Panels
export { CatalogPanel } from "./CatalogPanel";
export type { CatalogPanelProps } from "./CatalogPanel";

export { FoundryTemplatesPanel } from "./FoundryTemplatesPanel";
export type { FoundryTemplatesPanelProps } from "./FoundryTemplatesPanel";

export { CenterPanel } from "./CenterPanel";
export type { CenterPanelProps } from "./CenterPanel";

export { VaultView } from "./VaultView";
export type { VaultViewProps } from "./VaultView";

export { VaultPickerOverlay } from "./VaultPickerOverlay";
export type { VaultPickerOverlayProps } from "./VaultPickerOverlay";

export { FoundryView } from "./FoundryView";
export type { FoundryViewProps } from "./FoundryView";

export { FoundryCanvas } from "./FoundryCanvas";
export type { FoundryCanvasProps } from "./FoundryCanvas";

export { SpecPanel } from "./SpecPanel";
export type { SpecPanelProps } from "./SpecPanel";

export { DialsPanel } from "./DialsPanel";
export type { DialsPanelProps } from "./DialsPanel";

// Survey Panels
export { SurveyView } from "./SurveyView";
export type { SurveyViewProps } from "./SurveyView";

export { SurveyCatalogPanel } from "./SurveyCatalogPanel";
export type { SurveyCatalogPanelProps } from "./SurveyCatalogPanel";

export { SurveyInspectorPanel } from "./SurveyInspectorPanel";
export type { SurveyInspectorPanelProps } from "./SurveyInspectorPanel";
export { Select } from "./Select";
export type { SelectProps, SelectOption } from "./Select";
export { SurveyUploadModal } from "./SurveyUploadModal";
export type { SurveyUploadModalProps } from "./SurveyUploadModal";

// Slide Templates (used by ComponentPreview for rendering slide previews)
export {
  BUILT_IN_SLIDE_TEMPLATES,
  SLIDE_TEMPLATE_CATEGORIES,
  getSlideTemplatesByCategory,
  getSlideTemplateById,
} from "./slideTemplates";
export type { SlideTemplateCategory } from "./slideTemplates";

// Previews
export { ComponentPreview } from "./previews/ComponentPreview";
export type { ComponentPreviewProps } from "./previews/ComponentPreview";

// Registry Map (Phase 2.1)
export {
  REGISTRY_MAP,
  getRegistryComponent,
  isRegistryComponent,
  getRegistryKeys,
  getRegistryComponentsByCategory,
  getRegistryCategories,
  renderRegistryComponent,
  CATALOG_TO_REGISTRY_MAP,
  getRegistryKeyForCatalog,
} from "./registry-map";
export type { RegistryComponentDef } from "./registry-map";

// Vector Editor
export { VectorEditor } from "./vector-editor";
export type { VectorEditorProps, VectorDocument, EditorTool } from "./vector-editor";

// Design Cards (Phase 3: mcp-ui compatible proposals)
export {
  DesignCard,
  DesignCardList,
  createProposalFromPatch,
  createProposalFromVariant,
} from "./DesignCard";
export type {
  DesignOperation,
  DesignCardProposal,
  DesignCardProps,
  DesignCardListProps,
} from "./DesignCard";

// Selection Connector (Spider-Man style rail tick)
export { SelectionConnector } from "./SelectionConnector";
