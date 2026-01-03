"use client";

import { getComponentById } from "../catalog";
import type {
  UIComponentPreset,
  StyleConfig,
  WorkspaceTab,
  SurveyViewBundledProps,
  FoundryFrameConfig,
  FoundryVariant,
} from "./types";
import { VaultView } from "./VaultView";
import { FoundryView } from "./FoundryView";
import { SurveyView } from "./SurveyView";

// ═══════════════════════════════════════════════════════════════
// CENTER PANEL - VAULT / FOUNDRY / SURVEY TABS
// ═══════════════════════════════════════════════════════════════

export interface CenterPanelProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  style: StyleConfig;
  foundryFrame: FoundryFrameConfig;
  presets: UIComponentPreset[];
  variants: FoundryVariant[];
  onLoadPreset: (preset: UIComponentPreset) => void;
  onDeletePreset: (id: string) => void;
  onRemoveVariant: (id: string) => void;
  onApplyVariant: (variant: FoundryVariant) => void;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
  // Survey props bundled for cleaner API
  survey?: SurveyViewBundledProps;
}

export function CenterPanel({
  activeTab,
  onTabChange,
  selectedComponentId,
  componentProps,
  style,
  foundryFrame,
  presets,
  variants,
  onLoadPreset,
  onDeletePreset,
  onRemoveVariant,
  onApplyVariant,
  isFocused,
  onFocusChange,
  survey,
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
            foundryFrame={foundryFrame}
            def={def}
            variants={variants}
            onRemoveVariant={onRemoveVariant}
            onApplyVariant={onApplyVariant}
            isFocused={isFocused}
            onFocusChange={onFocusChange}
          />
        )}
        {activeTab === "survey" && survey && (
          <SurveyView
            items={survey.items}
            selectedItemId={survey.selectedItemId}
            loading={survey.loading}
            searchQuery={survey.searchQuery}
            isSearching={survey.isSearching}
            onSelectItem={survey.onSelectItem}
            onUpload={survey.onUpload}
            onSearchQueryChange={survey.onSearchQueryChange}
            onSearch={survey.onSearch}
            onAnnotationsChange={survey.onAnnotationsChange}
            onResizingChange={survey.onResizingChange}
          />
        )}
      </div>
    </div>
  );
}
