"use client";

import { getComponentById } from "../catalog";
import type { UIComponentPreset, StyleConfig, WorkspaceTab } from "./types";
import { VaultView } from "./VaultView";
import { FoundryView } from "./FoundryView";

// ═══════════════════════════════════════════════════════════════
// CENTER PANEL - VAULT / FOUNDRY TABS
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
}: CenterPanelProps) {
  const def = selectedComponentId ? (getComponentById(selectedComponentId) ?? null) : null;

  return (
    <div className="center-panel">
      {/* Tab Header */}
      <div className="workspace-tabs">
        <button
          className={`workspace-tab ${activeTab === "vault" ? "workspace-tab--active" : ""}`}
          onClick={() => onTabChange("vault")}
        >
          <span className="workspace-tab__icon">◇</span>
          <span>VAULT</span>
        </button>
        <button
          className={`workspace-tab ${activeTab === "foundry" ? "workspace-tab--active" : ""}`}
          onClick={() => onTabChange("foundry")}
        >
          <span className="workspace-tab__icon">⬡</span>
          <span>FOUNDRY</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="workspace-content">
        {activeTab === "vault" ? (
          <VaultView
            selectedComponentId={selectedComponentId}
            componentProps={componentProps}
            style={style}
            presets={presets}
            onLoadPreset={onLoadPreset}
            onDeletePreset={onDeletePreset}
            onFocusChange={onFocusChange}
          />
        ) : (
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
      </div>
    </div>
  );
}
