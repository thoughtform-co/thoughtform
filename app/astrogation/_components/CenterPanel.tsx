"use client";

import { getComponentById } from "../catalog";
import type {
  UIComponentPreset,
  StyleConfig,
  WorkspaceTab,
  SurveyViewBundledProps,
  FoundryVariant,
  VectorDocument,
  FoundryCanvasDocument,
  FoundryViewport,
} from "./types";
import { VaultView } from "./VaultView";
import { FoundryView } from "./FoundryView";
import { SurveyView } from "./SurveyView";
import type { FilterState } from "./FilterButton";

// ═══════════════════════════════════════════════════════════════
// CENTER PANEL - VAULT / FOUNDRY / SURVEY TABS
// ═══════════════════════════════════════════════════════════════

export interface CenterPanelProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  style: StyleConfig;
  presets: UIComponentPreset[];
  variants: FoundryVariant[];
  onLoadPreset: (preset: UIComponentPreset) => void;
  onDeletePreset: (id: string) => void;
  onRemoveVariant: (id: string) => void;
  onApplyVariant: (variant: FoundryVariant) => void;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
  onPropsChange: (props: Record<string, unknown>) => void;
  // Survey props bundled for cleaner API
  survey?: SurveyViewBundledProps;
  // Forge mode props
  isForgeMode?: boolean;
  forgeDoc?: VectorDocument | null;
  forgeSvg?: string | null;
  onForgeDocChange?: (doc: VectorDocument, svg: string) => void;
  onForgeClose?: () => void;
  // Filter props
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
  projects?: Array<{ id: string; name: string }>;
  // ═══════════════════════════════════════════════════════════════
  // FOUNDRY CANVAS PROPS (Phase 1)
  // ═══════════════════════════════════════════════════════════════
  foundryDocument?: FoundryCanvasDocument;
  foundrySelectedItemId?: string | null;
  onFoundrySelectItem?: (id: string | null) => void;
  onFoundryMoveItem?: (id: string, x: number, y: number) => void;
  onFoundryResizeItem?: (id: string, w: number, h: number) => void;
  onFoundryDeleteItem?: (id: string) => void;
  onFoundryDuplicateItem?: (id: string) => void;
  onFoundrySetViewport?: (viewport: Partial<FoundryViewport>) => void;
}

export function CenterPanel({
  activeTab,
  onTabChange,
  selectedComponentId,
  componentProps,
  style,
  presets,
  variants,
  onLoadPreset,
  onDeletePreset,
  onRemoveVariant,
  onApplyVariant,
  isFocused,
  onFocusChange,
  onPropsChange,
  survey,
  isForgeMode,
  forgeDoc,
  forgeSvg,
  onForgeDocChange,
  onForgeClose,
  filters = { categoryId: null, projectId: null },
  onFiltersChange,
  projects = [],
  // Foundry canvas props
  foundryDocument,
  foundrySelectedItemId,
  onFoundrySelectItem,
  onFoundryMoveItem,
  onFoundryResizeItem,
  onFoundryDeleteItem,
  onFoundryDuplicateItem,
  onFoundrySetViewport,
}: CenterPanelProps) {
  const def = selectedComponentId ? (getComponentById(selectedComponentId) ?? null) : null;

  return (
    <div className="center-panel">
      {/* Tab Header */}
      <div className="workspace-tabs" role="tablist">
        <div
          className={`workspace-tab ${activeTab === "vault" ? "workspace-tab--active" : ""}`}
          onClick={() => onTabChange("vault")}
          role="tab"
          aria-selected={activeTab === "vault"}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onTabChange("vault")}
        >
          <span className="workspace-tab__icon">◇</span>
          <span className="workspace-tab__label">VAULT</span>
        </div>
        <div
          className={`workspace-tab ${activeTab === "foundry" ? "workspace-tab--active" : ""}`}
          onClick={() => onTabChange("foundry")}
          role="tab"
          aria-selected={activeTab === "foundry"}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onTabChange("foundry")}
        >
          <span className="workspace-tab__icon">⬡</span>
          <span className="workspace-tab__label">FOUNDRY</span>
        </div>
        <div
          className={`workspace-tab ${activeTab === "survey" ? "workspace-tab--active" : ""}`}
          onClick={() => onTabChange("survey")}
          role="tab"
          aria-selected={activeTab === "survey"}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onTabChange("survey")}
        >
          <span className="workspace-tab__icon">⎔</span>
          <span className="workspace-tab__label">SURVEY</span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="workspace-content">
        {activeTab === "vault" && (
          <VaultView
            selectedComponentId={selectedComponentId}
            componentProps={componentProps}
            style={style}
            presets={presets}
            onLoadPreset={onLoadPreset}
            onDeletePreset={onDeletePreset}
            onFocusChange={onFocusChange}
          />
        )}
        {activeTab === "foundry" && (
          <FoundryView
            selectedComponentId={selectedComponentId}
            componentProps={componentProps}
            style={style}
            def={def}
            variants={variants}
            onRemoveVariant={onRemoveVariant}
            onApplyVariant={onApplyVariant}
            isFocused={isFocused}
            onFocusChange={onFocusChange}
            onPropsChange={onPropsChange}
            isForgeMode={isForgeMode}
            forgeDoc={forgeDoc}
            forgeSvg={forgeSvg}
            onForgeDocChange={onForgeDocChange}
            onForgeClose={onForgeClose}
            // Foundry canvas props
            foundryDocument={foundryDocument}
            foundrySelectedItemId={foundrySelectedItemId}
            onFoundrySelectItem={onFoundrySelectItem}
            onFoundryMoveItem={onFoundryMoveItem}
            onFoundryResizeItem={onFoundryResizeItem}
            onFoundryDeleteItem={onFoundryDeleteItem}
            onFoundryDuplicateItem={onFoundryDuplicateItem}
            onFoundrySetViewport={onFoundrySetViewport}
          />
        )}
        {activeTab === "survey" && survey && (
          <SurveyView
            items={survey.items}
            selectedItemId={survey.selectedItemId}
            selectedAnnotationId={survey.selectedAnnotationId}
            loading={survey.loading}
            searchQuery={survey.searchQuery}
            isSearching={survey.isSearching}
            onSelectItem={survey.onSelectItem}
            onUpload={survey.onUpload}
            onSearchQueryChange={survey.onSearchQueryChange}
            onSearch={survey.onSearch}
            onAnnotationsChange={survey.onAnnotationsChange}
            onAnnotationSelect={survey.onAnnotationSelect}
            onResizingChange={survey.onResizingChange}
            segments={survey.segments}
            showSegments={survey.showSegments}
            isSegmenting={survey.isSegmenting}
            onGenerateSegments={survey.onGenerateSegments}
            onToggleSegments={survey.onToggleSegments}
            onUpdateSegmentLabel={survey.onUpdateSegmentLabel}
            onDeleteSegment={survey.onDeleteSegment}
            filters={filters}
            onFiltersChange={onFiltersChange}
            projects={projects}
          />
        )}
      </div>
    </div>
  );
}
