"use client";

import { getComponentById } from "../catalog";
import type { UIComponentPreset, StyleConfig, WorkspaceTab, SurveyViewBundledProps } from "./types";
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
  presets: UIComponentPreset[];
  onLoadPreset: (preset: UIComponentPreset) => void;
  onDeletePreset: (id: string) => void;
  onSavePreset: () => void;
  presetName: string;
  onPresetNameChange: (name: string) => void;
  canSave: boolean;
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
  presets,
  onLoadPreset,
  onDeletePreset,
  onSavePreset,
  presetName,
  onPresetNameChange,
  canSave,
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
            def={def}
            onSavePreset={onSavePreset}
            presetName={presetName}
            onPresetNameChange={onPresetNameChange}
            canSave={canSave}
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
