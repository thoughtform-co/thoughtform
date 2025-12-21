"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParticleConfig, type ConfigPreset } from "@/lib/contexts/ParticleConfigContext";
import {
  COLOR_PRESETS,
  SHAPE_LABELS,
  GATEWAY_SHAPE_LABELS,
  GATEWAY_SHAPE_IS_ATTRACTOR,
  type LandmarkShape,
  type GatewayShape,
  type LandmarkConfig,
  type ManifoldConfig,
  type GatewayConfig,
  type CameraConfig,
  type SigilConfig,
} from "@/lib/particle-config";

type Tab = "gateway" | "manifold" | "camera" | "landmarks" | "sigil";

// Presets Bar Component
interface PresetsBarProps {
  presets: ConfigPreset[];
  activePresetId: string | null;
  onLoadPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  onCreatePreset: (name: string) => void;
}

function PresetsBar({
  presets,
  activePresetId,
  onLoadPreset,
  onDeletePreset,
  onCreatePreset,
}: PresetsBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const activePreset = presets.find((p) => p.id === activePresetId);

  const handleCreate = () => {
    if (newPresetName.trim()) {
      onCreatePreset(newPresetName.trim());
      setNewPresetName("");
      setShowInput(false);
    }
  };

  return (
    <div className="presets-bar">
      <div className="presets-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="presets-label">
          <span className="presets-icon">◆</span>
          {activePreset ? activePreset.name : "No Preset"}
          {presets.length > 0 && <span className="presets-count">{presets.length}</span>}
        </span>
        <span className={`presets-chevron ${isExpanded ? "expanded" : ""}`}>›</span>
      </div>

      {isExpanded && (
        <div className="presets-content">
          {presets.length > 0 && (
            <div className="presets-list">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`preset-chip ${preset.id === activePresetId ? "active" : ""}`}
                >
                  <button className="preset-chip-name" onClick={() => onLoadPreset(preset.id)}>
                    {preset.name}
                  </button>
                  <button
                    className="preset-chip-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${preset.name}"?`)) {
                        onDeletePreset(preset.id);
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {showInput ? (
            <div className="presets-input-row">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Preset name..."
                className="presets-input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setShowInput(false);
                    setNewPresetName("");
                  }
                }}
              />
              <button className="presets-save-btn" onClick={handleCreate}>
                Create
              </button>
            </div>
          ) : (
            <button className="presets-add-btn" onClick={() => setShowInput(true)}>
              + New Preset
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ParticleAdminPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("gateway");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Draggable panel state - starts near the toggle button (top-right)
  const [position, setPosition] = useState({ x: 500, y: 74 });
  const [hasSetInitialPosition, setHasSetInitialPosition] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Set initial position on mount (top-right corner)
  useEffect(() => {
    if (!hasSetInitialPosition && typeof window !== "undefined") {
      setPosition({ x: window.innerWidth - 420, y: 74 });
      setHasSetInitialPosition(true);
    }
  }, [hasSetInitialPosition]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
    }
  }, []);

  // Handle drag move and end
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      // Keep panel within viewport bounds
      const maxX = window.innerWidth - 400; // panel width
      const maxY = window.innerHeight - 100; // minimum visible height

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const {
    config,
    isLoading,
    hasChanges,
    error,
    storageMode,
    updateManifold,
    updateGateway,
    updateCamera,
    updateSigil,
    updateLandmark,
    addLandmark,
    removeLandmark,
    saveConfig,
    resetToDefaults,
    presets,
    activePresetId,
    saveToPreset,
    loadPreset,
    deletePreset,
    createPreset,
  } = useParticleConfig();

  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  const handleSave = useCallback(() => {
    if (activePresetId) {
      // Save to active preset
      saveToPreset();
      setSaveMessage("Saved!");
      setTimeout(() => setSaveMessage(null), 2000);
    } else {
      // No active preset - prompt for name
      setShowSavePrompt(true);
    }
  }, [activePresetId, saveToPreset]);

  const handleSaveNewPreset = useCallback(() => {
    if (newPresetName.trim()) {
      createPreset(newPresetName.trim());
      setNewPresetName("");
      setShowSavePrompt(false);
      setSaveMessage("Saved!");
      setTimeout(() => setSaveMessage(null), 2000);
    }
  }, [newPresetName, createPreset]);

  const handleReset = useCallback(async () => {
    if (confirm("Reset all particle settings to defaults?")) {
      await resetToDefaults();
      setSaveMessage("Reset to defaults");
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [resetToDefaults]);

  const handleAddLandmark = useCallback(() => {
    const id = `landmark-${Date.now()}`;
    const newLandmark: LandmarkConfig = {
      id,
      sectionId: "new-section",
      name: "New Landmark",
      shape: "ring",
      color: COLOR_PRESETS["Tensor Gold"],
      density: 1.0,
      scale: 1.0,
      position: { x: 0, y: 0, z: 5000 },
      enabled: true,
    };
    addLandmark(newLandmark);
  }, [addLandmark]);

  if (isLoading) return null;

  return (
    <>
      {/* Square Toggle Button - Top Left */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`admin-toggle ${isOpen ? "is-open" : ""}`}
        title="Particle Admin Panel"
      >
        <span className="admin-toggle-icon">{isOpen ? "×" : "⚙"}</span>
        {hasChanges && <span className="admin-toggle-dot" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className={`admin-panel ${isDragging ? "dragging" : ""}`}
          style={{ left: position.x, top: position.y }}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Compact Header */}
          <div className="admin-header admin-drag-handle" onMouseDown={handleDragStart}>
            <div className="admin-header-left">
              <span className="drag-icon">⋮⋮</span>
              <h3 className="admin-title">Particles</h3>
              <span
                className={`storage-badge ${storageMode}`}
                title={storageMode === "server" ? "Synced to Vercel KV" : "Local storage only"}
              >
                {storageMode === "server" ? "☁" : "●"}
              </span>
            </div>
            <div className="admin-header-right">
              {saveMessage && <span className="admin-message">{saveMessage}</span>}
              {error && <span className="admin-error">{error}</span>}
              <button
                onClick={handleReset}
                className="admin-icon-btn"
                disabled={isSaving}
                title="Reset to defaults"
              >
                ↺
              </button>
              <button
                onClick={handleSave}
                className={`admin-icon-btn save ${hasChanges ? "has-changes" : ""}`}
                disabled={isSaving || !hasChanges}
                title={hasChanges ? "Save changes" : "No changes"}
              >
                {isSaving ? "…" : "✓"}
              </button>
            </div>
          </div>

          {/* Presets Bar */}
          <PresetsBar
            presets={presets}
            activePresetId={activePresetId}
            onLoadPreset={loadPreset}
            onDeletePreset={deletePreset}
            onCreatePreset={createPreset}
          />

          {/* Save Prompt Modal */}
          {showSavePrompt && (
            <div className="save-prompt-overlay" onClick={() => setShowSavePrompt(false)}>
              <div className="save-prompt" onClick={(e) => e.stopPropagation()}>
                <div className="save-prompt-title">Save as New Preset</div>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Enter preset name..."
                  className="save-prompt-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveNewPreset();
                    if (e.key === "Escape") setShowSavePrompt(false);
                  }}
                />
                <div className="save-prompt-actions">
                  <button className="save-prompt-cancel" onClick={() => setShowSavePrompt(false)}>
                    Cancel
                  </button>
                  <button
                    className="save-prompt-save"
                    onClick={handleSaveNewPreset}
                    disabled={!newPresetName.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === "gateway" ? "active" : ""}`}
              onClick={() => setActiveTab("gateway")}
            >
              Gateway
            </button>
            <button
              className={`admin-tab ${activeTab === "manifold" ? "active" : ""}`}
              onClick={() => setActiveTab("manifold")}
            >
              Manifold
            </button>
            <button
              className={`admin-tab ${activeTab === "camera" ? "active" : ""}`}
              onClick={() => setActiveTab("camera")}
            >
              Camera
            </button>
            <button
              className={`admin-tab ${activeTab === "landmarks" ? "active" : ""}`}
              onClick={() => setActiveTab("landmarks")}
            >
              Landmarks
            </button>
            <button
              className={`admin-tab ${activeTab === "sigil" ? "active" : ""}`}
              onClick={() => setActiveTab("sigil")}
            >
              Sigil
            </button>
          </div>

          {/* Content */}
          <div className="admin-content">
            {activeTab === "gateway" && (
              <GatewayControls gateway={config.gateway} onUpdate={updateGateway} />
            )}
            {activeTab === "manifold" && (
              <ManifoldControls manifold={config.manifold} onUpdate={updateManifold} />
            )}
            {activeTab === "camera" && (
              <CameraControls camera={config.camera} onUpdate={updateCamera} />
            )}
            {activeTab === "landmarks" && (
              <LandmarksControls
                landmarks={config.landmarks}
                onUpdate={updateLandmark}
                onAdd={handleAddLandmark}
                onRemove={removeLandmark}
              />
            )}
            {activeTab === "sigil" && <SigilControls sigil={config.sigil} onUpdate={updateSigil} />}
          </div>
        </div>
      )}

      <style jsx global>{`
        .admin-toggle {
          position: fixed;
          top: 26px;
          right: calc(clamp(48px, 8vw, 120px) + 100px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: transparent;
          border: none;
          color: rgba(202, 165, 84, 0.4);
          font-family: var(--font-data, "PT Mono", monospace);
          cursor: pointer;
          transition: color 150ms ease;
        }

        .admin-toggle:hover {
          color: rgba(202, 165, 84, 1);
        }

        .admin-toggle.is-open {
          color: var(--dawn, #ebe3d6);
        }

        .admin-toggle-icon {
          font-size: 12px;
          line-height: 1;
        }

        .admin-toggle-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 5px;
          height: 5px;
          background: #ff6b35;
          border-radius: 50%;
        }

        .admin-panel {
          position: fixed;
          z-index: 9998;
          width: 400px;
          max-height: 70vh;
          background: rgba(10, 9, 8, 0.98);
          border: 1px solid rgba(236, 227, 214, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          overscroll-behavior: contain;
        }

        .admin-panel.dragging {
          opacity: 0.95;
          cursor: grabbing;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid rgba(236, 227, 214, 0.08);
          gap: 8px;
        }

        .admin-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .admin-header-right {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .admin-drag-handle {
          cursor: grab;
          user-select: none;
        }

        .admin-drag-handle:active {
          cursor: grabbing;
        }

        .drag-icon {
          opacity: 0.3;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .admin-title {
          font-family: var(--font-data, monospace);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--dawn, #ebe3d6);
          margin: 0;
        }

        .storage-badge {
          font-size: 10px;
          opacity: 0.5;
        }

        .storage-badge.server {
          color: #5ba882;
        }

        .storage-badge.local {
          color: #caa554;
        }

        .admin-icon-btn {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(236, 227, 214, 0.05);
          border: 1px solid rgba(236, 227, 214, 0.15);
          border-radius: 4px;
          color: rgba(236, 227, 214, 0.6);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .admin-icon-btn:hover:not(:disabled) {
          background: rgba(236, 227, 214, 0.1);
          color: rgba(236, 227, 214, 0.9);
        }

        .admin-icon-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .admin-icon-btn.save.has-changes {
          background: rgba(202, 165, 84, 0.15);
          border-color: rgba(202, 165, 84, 0.4);
          color: #caa554;
        }

        .admin-icon-btn.save.has-changes:hover {
          background: rgba(202, 165, 84, 0.25);
        }

        .admin-message {
          font-size: 9px;
          color: #5ba882;
          white-space: nowrap;
        }

        .admin-error {
          font-size: 9px;
          color: #ff6b35;
          white-space: nowrap;
        }

        /* Presets Bar */
        .presets-bar {
          border-bottom: 1px solid rgba(236, 227, 214, 0.08);
          background: rgba(0, 0, 0, 0.2);
        }

        .presets-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .presets-header:hover {
          background: rgba(236, 227, 214, 0.03);
        }

        .presets-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-data, monospace);
          font-size: 10px;
          color: rgba(236, 227, 214, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .presets-icon {
          font-size: 8px;
          color: var(--gold, #caa554);
        }

        .presets-count {
          background: rgba(202, 165, 84, 0.2);
          color: var(--gold, #caa554);
          padding: 1px 5px;
          border-radius: 8px;
          font-size: 9px;
        }

        .presets-chevron {
          font-size: 12px;
          color: rgba(236, 227, 214, 0.4);
          transition: transform 0.2s;
        }

        .presets-chevron.expanded {
          transform: rotate(90deg);
        }

        .presets-content {
          padding: 0 12px 10px;
        }

        .presets-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }

        .preset-chip {
          display: flex;
          align-items: center;
          background: rgba(236, 227, 214, 0.06);
          border: 1px solid rgba(236, 227, 214, 0.12);
          border-radius: 4px;
          overflow: hidden;
        }

        .preset-chip.active {
          background: rgba(202, 165, 84, 0.15);
          border-color: rgba(202, 165, 84, 0.4);
        }

        .preset-chip.active .preset-chip-name {
          color: var(--gold, #caa554);
        }

        .preset-chip-name {
          padding: 4px 8px;
          background: transparent;
          border: none;
          color: rgba(236, 227, 214, 0.8);
          font-family: var(--font-data, monospace);
          font-size: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .preset-chip-name:hover {
          background: rgba(202, 165, 84, 0.15);
          color: var(--gold, #caa554);
        }

        .preset-chip-delete {
          padding: 4px 6px;
          background: transparent;
          border: none;
          border-left: 1px solid rgba(236, 227, 214, 0.1);
          color: rgba(236, 227, 214, 0.3);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .preset-chip-delete:hover {
          background: rgba(255, 100, 100, 0.15);
          color: rgba(255, 100, 100, 0.8);
        }

        .presets-empty {
          font-size: 10px;
          color: rgba(236, 227, 214, 0.3);
          font-style: italic;
          margin-bottom: 8px;
        }

        .presets-input-row {
          display: flex;
          gap: 4px;
        }

        .presets-input {
          flex: 1;
          padding: 5px 8px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(236, 227, 214, 0.2);
          border-radius: 4px;
          color: rgba(236, 227, 214, 0.9);
          font-family: var(--font-data, monospace);
          font-size: 10px;
        }

        .presets-input:focus {
          outline: none;
          border-color: var(--gold, #caa554);
        }

        .presets-save-btn {
          padding: 5px 10px;
          background: rgba(202, 165, 84, 0.2);
          border: 1px solid rgba(202, 165, 84, 0.4);
          border-radius: 4px;
          color: var(--gold, #caa554);
          font-family: var(--font-data, monospace);
          font-size: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .presets-save-btn:hover {
          background: rgba(202, 165, 84, 0.3);
        }

        .presets-add-btn {
          width: 100%;
          padding: 6px;
          background: transparent;
          border: 1px dashed rgba(236, 227, 214, 0.15);
          border-radius: 4px;
          color: rgba(236, 227, 214, 0.4);
          font-family: var(--font-data, monospace);
          font-size: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .presets-add-btn:hover {
          border-color: var(--gold, #caa554);
          color: var(--gold, #caa554);
        }

        /* Save Prompt Modal */
        .save-prompt-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .save-prompt {
          background: rgba(20, 18, 16, 0.98);
          border: 1px solid rgba(236, 227, 214, 0.2);
          border-radius: 8px;
          padding: 16px;
          width: 280px;
        }

        .save-prompt-title {
          font-family: var(--font-data, monospace);
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--dawn, #ebe3d6);
          margin-bottom: 12px;
        }

        .save-prompt-input {
          width: 100%;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(236, 227, 214, 0.2);
          border-radius: 4px;
          color: var(--dawn, #ebe3d6);
          font-family: var(--font-data, monospace);
          font-size: 12px;
          margin-bottom: 12px;
        }

        .save-prompt-input:focus {
          outline: none;
          border-color: var(--gold, #caa554);
        }

        .save-prompt-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .save-prompt-cancel {
          padding: 8px 14px;
          background: transparent;
          border: 1px solid rgba(236, 227, 214, 0.2);
          border-radius: 4px;
          color: rgba(236, 227, 214, 0.6);
          font-family: var(--font-data, monospace);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .save-prompt-cancel:hover {
          border-color: rgba(236, 227, 214, 0.4);
          color: rgba(236, 227, 214, 0.9);
        }

        .save-prompt-save {
          padding: 8px 14px;
          background: rgba(202, 165, 84, 0.2);
          border: 1px solid rgba(202, 165, 84, 0.5);
          border-radius: 4px;
          color: var(--gold, #caa554);
          font-family: var(--font-data, monospace);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .save-prompt-save:hover:not(:disabled) {
          background: rgba(202, 165, 84, 0.3);
        }

        .save-prompt-save:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .admin-btn {
          padding: 6px 12px;
          font-family: var(--font-data, monospace);
          font-size: 10px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          border: 1px solid;
          transition: all 0.15s;
        }

        .admin-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .admin-btn-primary {
          background: var(--gold, #caa554);
          border-color: var(--gold, #caa554);
          color: #0a0908;
        }

        .admin-btn-primary:hover:not(:disabled) {
          background: #e0bc6a;
        }

        .admin-btn-secondary {
          background: transparent;
          border-color: rgba(236, 227, 214, 0.3);
          color: rgba(236, 227, 214, 0.7);
        }

        .admin-btn-secondary:hover:not(:disabled) {
          border-color: rgba(236, 227, 214, 0.5);
          color: var(--dawn, #ebe3d6);
        }

        .admin-tabs {
          display: flex;
          border-bottom: 1px solid rgba(236, 227, 214, 0.08);
        }

        .admin-tab {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          font-family: var(--font-data, monospace);
          font-size: 11px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgba(236, 227, 214, 0.5);
          cursor: pointer;
          transition: all 0.15s;
        }

        .admin-tab:hover {
          color: rgba(236, 227, 214, 0.8);
        }

        .admin-tab.active {
          color: var(--gold, #caa554);
          border-bottom: 2px solid var(--gold, #caa554);
        }

        .admin-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          overscroll-behavior: contain;
        }

        .admin-panel:hover {
          /* Prevent page scroll when hovering over panel */
        }

        .admin-section {
          margin-bottom: 20px;
        }

        .admin-section-title {
          font-family: var(--font-data, monospace);
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(236, 227, 214, 0.5);
          margin-bottom: 12px;
        }

        .admin-field {
          margin-bottom: 16px;
        }

        .admin-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-family: var(--font-data, monospace);
          font-size: 10px;
          color: rgba(236, 227, 214, 0.7);
        }

        .admin-value {
          color: var(--gold, #caa554);
        }

        .admin-slider {
          width: 100%;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(236, 227, 214, 0.15);
          outline: none;
          cursor: pointer;
        }

        .admin-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: var(--gold, #caa554);
          cursor: pointer;
        }

        .admin-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: var(--gold, #caa554);
          cursor: pointer;
          border: none;
        }

        .admin-color-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .shape-category-label {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 6px;
        }

        .shape-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }

        .shape-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 8px 4px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-size: 10px;
          transition: all 0.15s;
        }

        .shape-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.9);
        }

        .shape-btn.active {
          background: rgba(202, 165, 84, 0.2);
          border-color: var(--gold, #caa554);
          color: var(--gold, #caa554);
        }

        .shape-btn.attractor {
          background: rgba(202, 165, 84, 0.05);
          border-color: rgba(202, 165, 84, 0.2);
        }

        .shape-btn.attractor:hover {
          background: rgba(202, 165, 84, 0.15);
          border-color: rgba(202, 165, 84, 0.4);
        }

        .shape-icon {
          font-size: 18px;
          line-height: 1;
        }

        .shape-name {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
        }

        .admin-color-btn {
          width: 24px;
          height: 24px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
        }

        .admin-color-btn:hover {
          transform: scale(1.1);
        }

        .admin-color-btn.active {
          border-color: white;
        }

        .admin-color-input {
          width: 60px;
          height: 24px;
          border: 1px solid rgba(236, 227, 214, 0.3);
          background: transparent;
          cursor: pointer;
        }

        .admin-select {
          width: 100%;
          padding: 8px;
          background: rgba(10, 9, 8, 0.8);
          border: 1px solid rgba(236, 227, 214, 0.2);
          color: var(--dawn, #ebe3d6);
          font-family: var(--font-data, monospace);
          font-size: 11px;
        }

        .admin-input {
          width: 100%;
          padding: 8px;
          background: rgba(10, 9, 8, 0.8);
          border: 1px solid rgba(236, 227, 214, 0.2);
          color: var(--dawn, #ebe3d6);
          font-family: var(--font-data, monospace);
          font-size: 11px;
        }

        .landmark-card {
          background: rgba(236, 227, 214, 0.03);
          border: 1px solid rgba(236, 227, 214, 0.1);
          padding: 12px;
          margin-bottom: 12px;
        }

        .landmark-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .landmark-name {
          font-family: var(--font-data, monospace);
          font-size: 11px;
          color: var(--gold, #caa554);
        }

        .landmark-delete {
          background: transparent;
          border: none;
          color: rgba(236, 227, 214, 0.4);
          font-size: 16px;
          cursor: pointer;
        }

        .landmark-delete:hover {
          color: #ff6b35;
        }

        .landmark-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .admin-checkbox {
          width: 16px;
          height: 16px;
          accent-color: var(--gold, #caa554);
        }

        .admin-add-btn {
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1px dashed rgba(236, 227, 214, 0.2);
          color: rgba(236, 227, 214, 0.5);
          font-family: var(--font-data, monospace);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .admin-add-btn:hover {
          border-color: var(--gold, #caa554);
          color: var(--gold, #caa554);
        }

        .admin-hint {
          font-size: 9px;
          color: rgba(236, 227, 214, 0.4);
          margin-top: 4px;
        }
      `}</style>
    </>
  );
}

// Gateway Controls Component (Three.js portal)
interface GatewayControlsProps {
  gateway: GatewayConfig;
  onUpdate: (updates: Partial<GatewayConfig>) => void;
}

function GatewayControls({ gateway, onUpdate }: GatewayControlsProps) {
  return (
    <div>
      <div className="admin-section">
        <div className="admin-section-title">Visibility</div>
        <div className="admin-field">
          <label className="landmark-toggle">
            <input
              type="checkbox"
              checked={gateway.enabled}
              onChange={(e) => onUpdate({ enabled: e.target.checked })}
              className="admin-checkbox"
            />
            <span className="admin-label" style={{ margin: 0 }}>
              Show Gateway Portal
            </span>
          </label>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Portal Shape</div>

        {/* Geometric Shapes */}
        <div className="admin-field">
          <div className="shape-category-label">Geometric</div>
          <div className="shape-selector">
            {(Object.keys(GATEWAY_SHAPE_LABELS) as GatewayShape[])
              .filter((k) => !GATEWAY_SHAPE_IS_ATTRACTOR[k])
              .map((shapeKey) => (
                <button
                  key={shapeKey}
                  className={`shape-btn ${gateway.shape === shapeKey ? "active" : ""}`}
                  onClick={() => onUpdate({ shape: shapeKey })}
                  title={GATEWAY_SHAPE_LABELS[shapeKey]}
                >
                  <span className="shape-icon">
                    {shapeKey === "circle" && "○"}
                    {shapeKey === "hexagon" && "⬡"}
                    {shapeKey === "octagon" && "⯃"}
                    {shapeKey === "diamond" && "◇"}
                    {shapeKey === "arch" && "⌓"}
                    {shapeKey === "ellipse" && "⬭"}
                  </span>
                  <span className="shape-name">{GATEWAY_SHAPE_LABELS[shapeKey]}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Strange Attractors */}
        <div className="admin-field">
          <div className="shape-category-label">Strange Attractors</div>
          <div className="shape-selector">
            {(Object.keys(GATEWAY_SHAPE_LABELS) as GatewayShape[])
              .filter(
                (k) =>
                  GATEWAY_SHAPE_IS_ATTRACTOR[k] &&
                  ![
                    "torus",
                    "hyperboloid",
                    "vortex",
                    "spiralTorus",
                    "mobius",
                    "hypersphere",
                  ].includes(k)
              )
              .map((shapeKey) => (
                <button
                  key={shapeKey}
                  className={`shape-btn attractor ${gateway.shape === shapeKey ? "active" : ""}`}
                  onClick={() => onUpdate({ shape: shapeKey })}
                  title={GATEWAY_SHAPE_LABELS[shapeKey]}
                >
                  <span className="shape-icon">
                    {shapeKey === "lorenz" && "∞"}
                    {shapeKey === "thomas" && "◎"}
                    {shapeKey === "aizawa" && "◉"}
                    {shapeKey === "sprott" && "◌"}
                    {shapeKey === "rossler" && "⟳"}
                    {shapeKey === "dadras" && "⚛"}
                    {shapeKey === "galaxy" && "✦"}
                  </span>
                  <span className="shape-name">{GATEWAY_SHAPE_LABELS[shapeKey]}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Portal Surfaces */}
        <div className="admin-field">
          <div className="shape-category-label">Portal Surfaces</div>
          <div className="shape-selector">
            {(Object.keys(GATEWAY_SHAPE_LABELS) as GatewayShape[])
              .filter((k) =>
                ["torus", "hyperboloid", "vortex", "spiralTorus", "mobius", "hypersphere"].includes(
                  k
                )
              )
              .map((shapeKey) => (
                <button
                  key={shapeKey}
                  className={`shape-btn attractor ${gateway.shape === shapeKey ? "active" : ""}`}
                  onClick={() => onUpdate({ shape: shapeKey })}
                  title={GATEWAY_SHAPE_LABELS[shapeKey]}
                >
                  <span className="shape-icon">
                    {shapeKey === "torus" && "⊚"}
                    {shapeKey === "hyperboloid" && "⧫"}
                    {shapeKey === "vortex" && "🌀"}
                    {shapeKey === "spiralTorus" && "⟐"}
                    {shapeKey === "mobius" && "∞"}
                    {shapeKey === "hypersphere" && "◈"}
                  </span>
                  <span className="shape-name">{GATEWAY_SHAPE_LABELS[shapeKey]}</span>
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Colors</div>
        <div className="admin-field">
          <div className="admin-label">Primary Color (Ring/Structure)</div>
          <div className="admin-color-row">
            {Object.entries(COLOR_PRESETS).map(([name, color]) => (
              <button
                key={name}
                className={`admin-color-btn ${gateway.primaryColor === color ? "active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => onUpdate({ primaryColor: color })}
                title={name}
              />
            ))}
            <input
              type="color"
              value={gateway.primaryColor}
              onChange={(e) => onUpdate({ primaryColor: e.target.value })}
              className="admin-color-input"
            />
          </div>
        </div>
        <div className="admin-field">
          <div className="admin-label">Accent Color (Gold Details)</div>
          <div className="admin-color-row">
            {Object.entries(COLOR_PRESETS).map(([name, color]) => (
              <button
                key={name}
                className={`admin-color-btn ${gateway.accentColor === color ? "active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => onUpdate({ accentColor: color })}
                title={name}
              />
            ))}
            <input
              type="color"
              value={gateway.accentColor}
              onChange={(e) => onUpdate({ accentColor: e.target.value })}
              className="admin-color-input"
            />
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Size & Position</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Scale</span>
            <span className="admin-value">{gateway.scale.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="20"
            max="500"
            value={gateway.scale * 100}
            onChange={(e) => onUpdate({ scale: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Position X (Horizontal)</span>
            <span className="admin-value">{gateway.positionX.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="-500"
            max="500"
            value={gateway.positionX * 100}
            onChange={(e) => onUpdate({ positionX: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Position Y (Vertical)</span>
            <span className="admin-value">{gateway.positionY.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-300"
            max="300"
            value={gateway.positionY * 100}
            onChange={(e) => onUpdate({ positionY: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Appearance</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Particle Density</span>
            <span className="admin-value">{gateway.density.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="10"
            max="500"
            value={gateway.density * 100}
            onChange={(e) => onUpdate({ density: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Tunnel Depth</span>
            <span className="admin-value">{gateway.tunnelDepth.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="10"
            max="500"
            value={gateway.tunnelDepth * 100}
            onChange={(e) => onUpdate({ tunnelDepth: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Gateway Rotation (Ring Facing)</span>
            <span className="admin-value">{(gateway.rotationY * (180 / Math.PI)).toFixed(0)}°</span>
          </div>
          <input
            type="range"
            min="-314"
            max="314"
            value={gateway.rotationY * 100}
            onChange={(e) => onUpdate({ rotationY: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Tunnel Curvature</span>
            <span className="admin-value">{((gateway.tunnelCurve || 0) * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="-300"
            max="300"
            value={(gateway.tunnelCurve || 0) * 100}
            onChange={(e) => onUpdate({ tunnelCurve: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Tunnel Width (Back)</span>
            <span className="admin-value">{((gateway.tunnelWidth || 1) * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="30"
            max="500"
            value={(gateway.tunnelWidth || 1) * 100}
            onChange={(e) => onUpdate({ tunnelWidth: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
      </div>

      {/* Algorithmic Effects / Latent Space Field - Only for circle shape */}
      {gateway.shape === "circle" && (
        <div className="admin-section">
          <div className="admin-section-title">Algorithmic Effects (Latent Space Field)</div>
          <div className="admin-field">
            <label className="landmark-toggle">
              <input
                type="checkbox"
                checked={gateway.algorithmicEffects || false}
                onChange={(e) => onUpdate({ algorithmicEffects: e.target.checked })}
                className="admin-checkbox"
              />
              <span className="admin-label" style={{ margin: 0 }}>
                Enable Algorithmic Effects
              </span>
            </label>
            <div
              className="admin-hint"
              style={{ marginTop: "8px", fontSize: "11px", opacity: 0.6 }}
            >
              Mathematical patterns (spirals, Lissajous curves, field lines) that emanate from the
              gateway
            </div>
          </div>

          {gateway.algorithmicEffects && (
            <>
              <div className="admin-field">
                <div className="admin-label">
                  <span>Intensity</span>
                  <span className="admin-value">
                    {((gateway.algorithmicIntensity || 1.0) * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={(gateway.algorithmicIntensity || 1.0) * 100}
                  onChange={(e) =>
                    onUpdate({ algorithmicIntensity: parseInt(e.target.value) / 100 })
                  }
                  className="admin-slider"
                />
              </div>

              <div className="admin-field">
                <div className="admin-label">Pattern Type</div>
                <div className="shape-selector" style={{ marginTop: "8px" }}>
                  {(["spiral", "lissajous", "fieldLines", "particleStreams", "all"] as const).map(
                    (pattern) => (
                      <button
                        key={pattern}
                        className={`shape-btn ${gateway.algorithmicPattern === pattern ? "active" : ""}`}
                        onClick={() => onUpdate({ algorithmicPattern: pattern })}
                        style={{ fontSize: "10px", padding: "6px 10px" }}
                      >
                        {pattern === "spiral" && "🌀"}
                        {pattern === "lissajous" && "∞"}
                        {pattern === "fieldLines" && "⚡"}
                        {pattern === "particleStreams" && "✨"}
                        {pattern === "all" && "★"}
                        <span style={{ marginLeft: "4px" }}>
                          {pattern === "spiral" && "Spiral"}
                          {pattern === "lissajous" && "Lissajous"}
                          {pattern === "fieldLines" && "Field Lines"}
                          {pattern === "particleStreams" && "Streams"}
                          {pattern === "all" && "All"}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Manifold Controls Component
interface ManifoldControlsProps {
  manifold: ManifoldConfig;
  onUpdate: (updates: Partial<ManifoldConfig>) => void;
}

function ManifoldControls({ manifold, onUpdate }: ManifoldControlsProps) {
  return (
    <div>
      <div className="admin-section">
        <div className="admin-section-title">Color</div>
        <div className="admin-field">
          <div className="admin-color-row">
            {Object.entries(COLOR_PRESETS).map(([name, color]) => (
              <button
                key={name}
                className={`admin-color-btn ${manifold.color === color ? "active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => onUpdate({ color })}
                title={name}
              />
            ))}
            <input
              type="color"
              value={manifold.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="admin-color-input"
            />
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Density</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Rows</span>
            <span className="admin-value">{manifold.rows}</span>
          </div>
          <input
            type="range"
            min="40"
            max="200"
            value={manifold.rows}
            onChange={(e) => onUpdate({ rows: parseInt(e.target.value) })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Columns</span>
            <span className="admin-value">{manifold.columns}</span>
          </div>
          <input
            type="range"
            min="30"
            max="100"
            value={manifold.columns}
            onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
            className="admin-slider"
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Topology</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Wave Amplitude</span>
            <span className="admin-value">{manifold.waveAmplitude}</span>
          </div>
          <input
            type="range"
            min="50"
            max="400"
            value={manifold.waveAmplitude}
            onChange={(e) => onUpdate({ waveAmplitude: parseInt(e.target.value) })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Wave Frequency</span>
            <span className="admin-value">{manifold.waveFrequency.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            value={manifold.waveFrequency * 100}
            onChange={(e) => onUpdate({ waveFrequency: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Spread</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Horizontal (X)</span>
            <span className="admin-value">{manifold.spreadX.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="50"
            max="200"
            value={manifold.spreadX * 100}
            onChange={(e) => onUpdate({ spreadX: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Depth (Z)</span>
            <span className="admin-value">{manifold.spreadZ.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="50"
            max="200"
            value={manifold.spreadZ * 100}
            onChange={(e) => onUpdate({ spreadZ: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Appearance</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Opacity</span>
            <span className="admin-value">{Math.round(manifold.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={manifold.opacity * 100}
            onChange={(e) => onUpdate({ opacity: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
      </div>
    </div>
  );
}

// Camera Controls Component
interface CameraControlsProps {
  camera: CameraConfig;
  onUpdate: (updates: Partial<CameraConfig>) => void;
}

function CameraControls({ camera, onUpdate }: CameraControlsProps) {
  return (
    <div>
      <div className="admin-section">
        <div className="admin-section-title">Vantage Point</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Pitch (Vertical Tilt)</span>
            <span className="admin-value">{camera.pitch}°</span>
          </div>
          <input
            type="range"
            min="-20"
            max="60"
            value={camera.pitch}
            onChange={(e) => onUpdate({ pitch: parseInt(e.target.value) })}
            className="admin-slider"
          />
          <div className="admin-hint">0° = horizon, higher = more top-down</div>
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Yaw (Horizontal Rotation)</span>
            <span className="admin-value">{camera.yaw}°</span>
          </div>
          <input
            type="range"
            min="-45"
            max="45"
            value={camera.yaw}
            onChange={(e) => onUpdate({ yaw: parseInt(e.target.value) })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Roll (Frontal Tilt)</span>
            <span className="admin-value">{camera.roll}°</span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            value={camera.roll}
            onChange={(e) => onUpdate({ roll: parseInt(e.target.value) })}
            className="admin-slider"
          />
          <div className="admin-hint">Tilts the view like tilting your head</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Camera Position (Truck)</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Horizontal (Left/Right)</span>
            <span className="admin-value">{camera.truckX}</span>
          </div>
          <input
            type="range"
            min="-500"
            max="500"
            value={camera.truckX}
            onChange={(e) => onUpdate({ truckX: parseInt(e.target.value) })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Vertical (Up/Down)</span>
            <span className="admin-value">{camera.truckY}</span>
          </div>
          <input
            type="range"
            min="-300"
            max="300"
            value={camera.truckY}
            onChange={(e) => onUpdate({ truckY: parseInt(e.target.value) })}
            className="admin-slider"
          />
          <div className="admin-hint">Moves camera position in space</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Perspective</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Focal Length</span>
            <span className="admin-value">{camera.focalLength}</span>
          </div>
          <input
            type="range"
            min="150"
            max="800"
            step="10"
            value={camera.focalLength}
            onChange={(e) => onUpdate({ focalLength: parseInt(e.target.value) })}
            className="admin-slider"
          />
          <div className="admin-hint">Lower = more dramatic perspective</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Vanishing Point</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Horizontal Position</span>
            <span className="admin-value">{Math.round(camera.vanishX * 100)}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="80"
            value={camera.vanishX * 100}
            onChange={(e) => onUpdate({ vanishX: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Vertical Position</span>
            <span className="admin-value">{Math.round(camera.vanishY * 100)}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="80"
            value={camera.vanishY * 100}
            onChange={(e) => onUpdate({ vanishY: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Terrain Clipping</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Clip Above</span>
            <span className="admin-value">{Math.round(camera.terrainClipY * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            value={camera.terrainClipY * 100}
            onChange={(e) => onUpdate({ terrainClipY: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
          <div className="admin-hint">0 = full screen, higher = clip more from top</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Presets</div>
        <div className="admin-color-row" style={{ gap: "4px" }}>
          <button
            className="admin-btn admin-btn-secondary"
            style={{ flex: 1, fontSize: "9px", padding: "8px 4px" }}
            onClick={() =>
              onUpdate({
                pitch: 0,
                yaw: 0,
                roll: 0,
                truckX: 0,
                truckY: 0,
                focalLength: 400,
                vanishX: 0.7,
                vanishY: 0.5,
                terrainClipY: 0.35,
              })
            }
          >
            Default
          </button>
          <button
            className="admin-btn admin-btn-secondary"
            style={{ flex: 1, fontSize: "9px", padding: "8px 4px" }}
            onClick={() =>
              onUpdate({
                pitch: 25,
                yaw: 0,
                roll: 0,
                truckX: 0,
                truckY: 0,
                focalLength: 400,
                vanishX: 0.5,
                vanishY: 0.55,
                terrainClipY: 0.2,
              })
            }
          >
            Top-Down
          </button>
          <button
            className="admin-btn admin-btn-secondary"
            style={{ flex: 1, fontSize: "9px", padding: "8px 4px" }}
            onClick={() =>
              onUpdate({
                pitch: 35,
                yaw: 15,
                roll: 5,
                truckX: 100,
                truckY: -50,
                focalLength: 350,
                vanishX: 0.5,
                vanishY: 0.5,
                terrainClipY: 0,
              })
            }
          >
            Bird&apos;s Eye
          </button>
        </div>
      </div>
    </div>
  );
}

// Landmarks Controls Component
interface LandmarksControlsProps {
  landmarks: LandmarkConfig[];
  onUpdate: (id: string, updates: Partial<LandmarkConfig>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

function LandmarksControls({ landmarks, onUpdate, onAdd, onRemove }: LandmarksControlsProps) {
  return (
    <div>
      {landmarks.map((landmark) => (
        <div key={landmark.id} className="landmark-card">
          <div className="landmark-header">
            <input
              type="text"
              value={landmark.name}
              onChange={(e) => onUpdate(landmark.id, { name: e.target.value })}
              className="admin-input"
              style={{ maxWidth: "200px" }}
            />
            <button
              className="landmark-delete"
              onClick={() => onRemove(landmark.id)}
              title="Delete landmark"
            >
              ×
            </button>
          </div>

          <div className="landmark-toggle">
            <input
              type="checkbox"
              checked={landmark.enabled}
              onChange={(e) => onUpdate(landmark.id, { enabled: e.target.checked })}
              className="admin-checkbox"
            />
            <span className="admin-label" style={{ margin: 0 }}>
              Enabled
            </span>
          </div>

          <div className="admin-field">
            <div className="admin-label">Section ID</div>
            <input
              type="text"
              value={landmark.sectionId}
              onChange={(e) => onUpdate(landmark.id, { sectionId: e.target.value })}
              className="admin-input"
            />
          </div>

          <div className="admin-field">
            <div className="admin-label">Shape</div>
            <select
              value={landmark.shape}
              onChange={(e) => onUpdate(landmark.id, { shape: e.target.value as LandmarkShape })}
              className="admin-select"
            >
              {Object.entries(SHAPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <div className="admin-label">Color</div>
            <div className="admin-color-row">
              {Object.entries(COLOR_PRESETS).map(([name, color]) => (
                <button
                  key={name}
                  className={`admin-color-btn ${landmark.color === color ? "active" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdate(landmark.id, { color })}
                  title={name}
                />
              ))}
              <input
                type="color"
                value={landmark.color}
                onChange={(e) => onUpdate(landmark.id, { color: e.target.value })}
                className="admin-color-input"
              />
            </div>
          </div>

          <div className="admin-field">
            <div className="admin-label">
              <span>Density</span>
              <span className="admin-value">{landmark.density.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              value={landmark.density * 100}
              onChange={(e) =>
                onUpdate(landmark.id, {
                  density: parseInt(e.target.value) / 100,
                })
              }
              className="admin-slider"
            />
          </div>

          <div className="admin-field">
            <div className="admin-label">
              <span>Scale</span>
              <span className="admin-value">{landmark.scale.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              value={landmark.scale * 100}
              onChange={(e) =>
                onUpdate(landmark.id, {
                  scale: parseInt(e.target.value) / 100,
                })
              }
              className="admin-slider"
            />
          </div>

          {/* Position Controls */}
          <div className="admin-section-title" style={{ marginTop: "12px" }}>
            Position
          </div>

          <div className="admin-field">
            <div className="admin-label">
              <span>X (Horizontal)</span>
              <span className="admin-value">{landmark.position.x}</span>
            </div>
            <input
              type="range"
              min="-2500"
              max="2500"
              step="50"
              value={landmark.position.x}
              onChange={(e) =>
                onUpdate(landmark.id, {
                  position: {
                    ...landmark.position,
                    x: parseInt(e.target.value),
                  },
                })
              }
              className="admin-slider"
            />
            <div className="admin-hint">Move across the manifold (full width)</div>
          </div>

          <div className="admin-field">
            <div className="admin-label">
              <span>Y (Vertical)</span>
              <span className="admin-value">{landmark.position.y}</span>
            </div>
            <input
              type="range"
              min="-400"
              max="400"
              step="25"
              value={landmark.position.y}
              onChange={(e) =>
                onUpdate(landmark.id, {
                  position: {
                    ...landmark.position,
                    y: parseInt(e.target.value),
                  },
                })
              }
              className="admin-slider"
            />
            <div className="admin-hint">Up/Down from terrain level</div>
          </div>

          <div className="admin-field">
            <div className="admin-label">
              <span>Z (Depth/Distance)</span>
              <span className="admin-value">{landmark.position.z}</span>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="100"
              value={landmark.position.z}
              onChange={(e) =>
                onUpdate(landmark.id, {
                  position: {
                    ...landmark.position,
                    z: parseInt(e.target.value),
                  },
                })
              }
              className="admin-slider"
            />
            <div className="admin-hint">Further back = appears during later scroll</div>
          </div>
        </div>
      ))}

      <button className="admin-add-btn" onClick={onAdd}>
        + Add Landmark
      </button>
    </div>
  );
}

// Sigil Controls Component
interface SigilControlsProps {
  sigil: SigilConfig;
  onUpdate: (updates: Partial<SigilConfig>) => void;
}

function SigilControls({ sigil, onUpdate }: SigilControlsProps) {
  return (
    <div>
      <div className="admin-section">
        <div className="admin-section-title">Visibility</div>
        <div className="admin-field">
          <label className="landmark-toggle">
            <input
              type="checkbox"
              checked={sigil.enabled}
              onChange={(e) => onUpdate({ enabled: e.target.checked })}
              className="admin-checkbox"
            />
            <span className="admin-label" style={{ margin: 0 }}>
              Show Sigil
            </span>
          </label>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Size & Density</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Size</span>
            <span className="admin-value">{sigil.size}px</span>
          </div>
          <input
            type="range"
            min="100"
            max="400"
            value={sigil.size}
            onChange={(e) => onUpdate({ size: parseInt(e.target.value) })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Particle Count</span>
            <span className="admin-value">{sigil.particleCount}</span>
          </div>
          <input
            type="range"
            min="100"
            max="800"
            step="50"
            value={sigil.particleCount}
            onChange={(e) => onUpdate({ particleCount: parseInt(e.target.value) })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Particle Size</span>
            <span className="admin-value">{sigil.particleSize.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="50"
            max="300"
            value={sigil.particleSize * 100}
            onChange={(e) => onUpdate({ particleSize: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Appearance</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Opacity</span>
            <span className="admin-value">{Math.round(sigil.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="30"
            max="100"
            value={sigil.opacity * 100}
            onChange={(e) => onUpdate({ opacity: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">Color</div>
          <div className="admin-color-row">
            <button
              className={`admin-color-btn ${sigil.color === "202, 165, 84" ? "active" : ""}`}
              style={{ backgroundColor: "rgb(202, 165, 84)" }}
              onClick={() => onUpdate({ color: "202, 165, 84" })}
              title="Tensor Gold"
            />
            <button
              className={`admin-color-btn ${sigil.color === "236, 227, 214" ? "active" : ""}`}
              style={{ backgroundColor: "rgb(236, 227, 214)" }}
              onClick={() => onUpdate({ color: "236, 227, 214" })}
              title="Dawn"
            />
            <button
              className={`admin-color-btn ${sigil.color === "180, 180, 180" ? "active" : ""}`}
              style={{ backgroundColor: "rgb(180, 180, 180)" }}
              onClick={() => onUpdate({ color: "180, 180, 180" })}
              title="Silver"
            />
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Motion</div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Wander Strength</span>
            <span className="admin-value">{sigil.wanderStrength.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={sigil.wanderStrength * 100}
            onChange={(e) => onUpdate({ wanderStrength: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
          <div className="admin-hint">How much particles drift around</div>
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Pulse Speed</span>
            <span className="admin-value">{sigil.pulseSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="50"
            max="300"
            value={sigil.pulseSpeed * 100}
            onChange={(e) => onUpdate({ pulseSpeed: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
          <div className="admin-hint">Breathing/pulsing animation speed</div>
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Return Strength</span>
            <span className="admin-value">{sigil.returnStrength.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="50"
            max="300"
            value={sigil.returnStrength * 100}
            onChange={(e) => onUpdate({ returnStrength: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
          <div className="admin-hint">How strongly particles snap back to shape</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Presets</div>
        <div className="admin-color-row" style={{ gap: "4px" }}>
          <button
            className="admin-btn admin-btn-secondary"
            style={{ flex: 1, fontSize: "9px", padding: "8px 4px" }}
            onClick={() =>
              onUpdate({
                size: 220,
                particleCount: 500,
                particleSize: 1.0,
                opacity: 1.0,
                wanderStrength: 1.0,
                pulseSpeed: 1.0,
                returnStrength: 1.0,
              })
            }
          >
            Default
          </button>
          <button
            className="admin-btn admin-btn-secondary"
            style={{ flex: 1, fontSize: "9px", padding: "8px 4px" }}
            onClick={() =>
              onUpdate({
                size: 280,
                particleCount: 700,
                particleSize: 0.8,
                opacity: 0.9,
                wanderStrength: 0.3,
                pulseSpeed: 0.5,
                returnStrength: 2.0,
              })
            }
          >
            Dense
          </button>
          <button
            className="admin-btn admin-btn-secondary"
            style={{ flex: 1, fontSize: "9px", padding: "8px 4px" }}
            onClick={() =>
              onUpdate({
                size: 200,
                particleCount: 300,
                particleSize: 1.5,
                opacity: 0.7,
                wanderStrength: 1.8,
                pulseSpeed: 2.0,
                returnStrength: 0.6,
              })
            }
          >
            Organic
          </button>
        </div>
      </div>
    </div>
  );
}
