"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParticleConfig } from "@/lib/contexts/ParticleConfigContext";
import {
  COLOR_PRESETS,
  SHAPE_LABELS,
  type LandmarkShape,
  type LandmarkConfig,
  type ManifoldConfig,
  type GatewayConfig,
} from "@/lib/particle-config";

type Tab = "gateway" | "manifold" | "landmarks";

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
    if (!hasSetInitialPosition && typeof window !== 'undefined') {
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
    updateLandmark,
    addLandmark,
    removeLandmark,
    saveConfig,
    resetToDefaults,
  } = useParticleConfig();

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);
    const success = await saveConfig();
    setIsSaving(false);
    setSaveMessage(success ? "Saved!" : "Failed to save");
    setTimeout(() => setSaveMessage(null), 3000);
  }, [saveConfig]);

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
      color: COLOR_PRESETS.gold,
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
        >
          <div 
            className="admin-header admin-drag-handle"
            onMouseDown={handleDragStart}
          >
            <h3 className="admin-title">
              <span className="drag-icon">⋮⋮</span>
              Particle System
            </h3>
            <div className="admin-actions">
              {/* Storage mode indicator */}
              <span className={`storage-badge ${storageMode}`} title={
                storageMode === "server" 
                  ? "Saving to Vercel KV (synced across devices)" 
                  : "Saving to browser localStorage (this device only)"
              }>
                {storageMode === "server" ? "☁" : "💾"} {storageMode === "server" ? "KV" : "Local"}
              </span>
              {saveMessage && (
                <span className="admin-message">{saveMessage}</span>
              )}
              {error && <span className="admin-error">{error}</span>}
              <button
                onClick={handleReset}
                className="admin-btn admin-btn-secondary"
                disabled={isSaving}
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                className="admin-btn admin-btn-primary"
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

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
              className={`admin-tab ${activeTab === "landmarks" ? "active" : ""}`}
              onClick={() => setActiveTab("landmarks")}
            >
              Landmarks
            </button>
          </div>

          {/* Content */}
          <div className="admin-content">
            {activeTab === "gateway" && (
              <GatewayControls
                gateway={config.gateway}
                onUpdate={updateGateway}
              />
            )}
            {activeTab === "manifold" && (
              <ManifoldControls
                manifold={config.manifold}
                onUpdate={updateManifold}
              />
            )}
            {activeTab === "landmarks" && (
              <LandmarksControls
                landmarks={config.landmarks}
                onUpdate={updateLandmark}
                onAdd={handleAddLandmark}
                onRemove={removeLandmark}
              />
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .admin-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: var(--surface-0, #0A0908);
          border: 1px solid rgba(236, 227, 214, 0.15);
          color: rgba(202, 165, 84, 0.5);
          font-family: var(--font-data, 'PT Mono', monospace);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .admin-toggle:hover {
          color: rgba(202, 165, 84, 1);
          border-color: rgba(202, 165, 84, 0.5);
          background: rgba(202, 165, 84, 0.08);
        }

        .admin-toggle.is-open {
          color: var(--dawn, #ebe3d6);
          border-color: rgba(236, 227, 214, 0.3);
        }

        .admin-toggle-icon {
          font-size: 18px;
          line-height: 1;
        }

        .admin-toggle-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 6px;
          height: 6px;
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
        }

        .admin-panel.dragging {
          opacity: 0.95;
          cursor: grabbing;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid rgba(236, 227, 214, 0.08);
        }

        .admin-drag-handle {
          cursor: grab;
          user-select: none;
        }

        .admin-drag-handle:active {
          cursor: grabbing;
        }

        .drag-icon {
          opacity: 0.4;
          margin-right: 8px;
          font-size: 10px;
          letter-spacing: 2px;
        }

        .admin-title {
          font-family: var(--font-data, monospace);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--dawn, #ebe3d6);
          margin: 0;
        }

        .admin-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .storage-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 2px;
        }

        .storage-badge.server {
          background: rgba(91, 168, 130, 0.15);
          color: #5ba882;
          border: 1px solid rgba(91, 168, 130, 0.3);
        }

        .storage-badge.local {
          background: rgba(202, 165, 84, 0.15);
          color: #caa554;
          border: 1px solid rgba(202, 165, 84, 0.3);
        }

        .admin-message {
          font-size: 10px;
          color: #5ba882;
        }

        .admin-error {
          font-size: 10px;
          color: #ff6b35;
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
            min="50"
            max="300"
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
            min="-300"
            max="100"
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
            min="-200"
            max="200"
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
            min="30"
            max="200"
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
            min="30"
            max="200"
            value={gateway.tunnelDepth * 100}
            onChange={(e) => onUpdate({ tunnelDepth: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
        <div className="admin-field">
          <div className="admin-label">
            <span>Rotation (Inward Angle)</span>
            <span className="admin-value">{(gateway.rotationY * (180 / Math.PI)).toFixed(0)}°</span>
          </div>
          <input
            type="range"
            min="-157"
            max="157"
            value={gateway.rotationY * 100}
            onChange={(e) => onUpdate({ rotationY: parseInt(e.target.value) / 100 })}
            className="admin-slider"
          />
        </div>
      </div>
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
            onChange={(e) =>
              onUpdate({ waveAmplitude: parseInt(e.target.value) })
            }
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
            onChange={(e) =>
              onUpdate({ waveFrequency: parseInt(e.target.value) / 100 })
            }
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
            onChange={(e) =>
              onUpdate({ spreadX: parseInt(e.target.value) / 100 })
            }
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
            onChange={(e) =>
              onUpdate({ spreadZ: parseInt(e.target.value) / 100 })
            }
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
            onChange={(e) =>
              onUpdate({ opacity: parseInt(e.target.value) / 100 })
            }
            className="admin-slider"
          />
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

function LandmarksControls({
  landmarks,
  onUpdate,
  onAdd,
  onRemove,
}: LandmarksControlsProps) {
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
              onChange={(e) =>
                onUpdate(landmark.id, { enabled: e.target.checked })
              }
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
              onChange={(e) =>
                onUpdate(landmark.id, { sectionId: e.target.value })
              }
              className="admin-input"
            />
          </div>

          <div className="admin-field">
            <div className="admin-label">Shape</div>
            <select
              value={landmark.shape}
              onChange={(e) =>
                onUpdate(landmark.id, { shape: e.target.value as LandmarkShape })
              }
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
                onChange={(e) =>
                  onUpdate(landmark.id, { color: e.target.value })
                }
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

          <div className="admin-field">
            <div className="admin-label">Position Z (Depth)</div>
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
            <div className="admin-label">
              <span></span>
              <span className="admin-value">{landmark.position.z}</span>
            </div>
          </div>
        </div>
      ))}

      <button className="admin-add-btn" onClick={onAdd}>
        + Add Landmark
      </button>
    </div>
  );
}

