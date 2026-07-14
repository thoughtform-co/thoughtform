"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  CelestialConfig,
  CelestialDesign,
  LinePattern,
  Orientation,
  Size,
  Rotation,
  TickDensity,
  CenterShape,
} from "@/lib/celestial/schema";
import {
  PRESETS,
  LINE_PATTERNS,
  SIZES,
  ROTATIONS,
  TICK_DENSITIES,
  CENTER_SHAPES,
  DEFAULT_CONFIG,
} from "@/lib/celestial/schema";
import type { Preset } from "@/lib/celestial/schema";
import { DiagramSvg } from "@/components/landing/v7/CelestialConnector/DiagramSvg";
import { useCelestialDrafts } from "./useCelestialDrafts";
import { randomizeConfig } from "./randomize";
import "./celestial-editor.css";

type PresetOverrides = Partial<Pick<CelestialConfig, "labels" | "lines" | "size">> & {
  diagram?: Partial<CelestialConfig["diagram"]>;
};

const PRESET_DEFAULTS: Partial<Record<Preset, PresetOverrides>> = {
  meridian: {
    labels: {
      tl: { emphasis: "N · 180", text: "meridian" },
      tr: { text: "" },
      bl: { text: "" },
      br: { emphasis: "DESC", text: "bearing" },
    },
    lines: { topPattern: "v-converge", bottomPattern: "v-diverge" },
  },
  squareCascade: {
    labels: {
      tl: { emphasis: "Ch · 03", text: "lock" },
      tr: { text: "" },
      bl: { text: "" },
      br: { emphasis: "FRAME", text: "signal" },
    },
    lines: { topPattern: "parallel-3", bottomPattern: "parallel-3" },
  },
  heroOrb: {
    labels: {
      tl: { emphasis: "N · 000", text: "origin" },
      tr: { text: "" },
      bl: { text: "" },
      br: { emphasis: "LOCK", text: "waypoint" },
    },
    lines: { topPattern: "v-converge", bottomPattern: "v-diverge" },
    size: "lg",
  },
  reticle: {
    labels: {
      tl: { emphasis: "TARGET", text: "sector" },
      tr: { text: "" },
      bl: { text: "" },
      br: { emphasis: "LOCK", text: "mark" },
    },
    lines: { topPattern: "single", bottomPattern: "single" },
  },
  compassRose: {
    labels: {
      tl: { emphasis: "AZIMUTH", text: "field" },
      tr: { text: "" },
      bl: { text: "" },
      br: { emphasis: "BEARING", text: "gate" },
    },
    lines: { topPattern: "v-converge", bottomPattern: "v-diverge" },
  },
  orbital: {
    labels: {
      tl: { emphasis: "APOGEE", text: "orbit" },
      tr: { text: "" },
      bl: { text: "" },
      br: { emphasis: "PERIGEE", text: "passage" },
    },
    lines: { topPattern: "single", bottomPattern: "single" },
  },
  registerMarks: {
    labels: {
      tl: { emphasis: "FIG · 01", text: "register" },
      tr: { text: "" },
      bl: { text: "" },
      br: { emphasis: "MARK", text: "void" },
    },
    lines: { topPattern: "parallel-3", bottomPattern: "parallel-3" },
  },
  constellation: {
    labels: {
      tl: { emphasis: "ASC", text: "field" },
      tr: { text: "" },
      bl: { text: "" },
      br: { emphasis: "NODE", text: "passage" },
    },
    lines: { topPattern: "single", bottomPattern: "none" },
    diagram: {
      constellation: { seed: Math.floor(Math.random() * 99999), points: 7, density: "sparse" },
    },
  },
  ecliptic: {
    labels: {
      tl: { emphasis: "ECLIPTIC", text: "transit" },
      tr: { text: "" },
      bl: { text: "" },
      br: { emphasis: "VERNAL", text: "threshold" },
    },
    lines: { topPattern: "v-converge", bottomPattern: "v-diverge" },
    diagram: { ecliptic: { seed: Math.floor(Math.random() * 99999), tilt: 23, phaseCount: 2 } },
  },
  phase: {
    labels: {
      tl: { emphasis: "PHASE", text: "terminus" },
      tr: { text: "" },
      bl: { text: "" },
      br: { emphasis: "NODE", text: "descent" },
    },
    lines: { topPattern: "single", bottomPattern: "single" },
    diagram: { phase: { seed: Math.floor(Math.random() * 99999), coverage: 0.35 } },
  },
  sigil: {
    labels: {
      tl: { emphasis: "SIGIL", text: "seal" },
      tr: { text: "" },
      bl: { text: "" },
      br: { emphasis: "∂ · 001", text: "gate" },
    },
    lines: { topPattern: "none", bottomPattern: "none" },
    diagram: { glyphRing: { seed: Math.floor(Math.random() * 99999), radius: "md" } },
  },
  astrolabe: {
    labels: {
      tl: { emphasis: "ASTROLABE", text: "instrument" },
      tr: { emphasis: "θ · 058", text: "" },
      bl: { text: "" },
      br: { emphasis: "∂ · 001", text: "sector" },
    },
    lines: { topPattern: "v-converge", bottomPattern: "v-diverge" },
    size: "lg",
    diagram: {
      glyphRing: { seed: Math.floor(Math.random() * 99999), radius: "lg" },
      ecliptic: { seed: Math.floor(Math.random() * 99999), tilt: 18, phaseCount: 2 },
    },
  },
};

interface CelestialEditorModalProps {
  initialConfig?: CelestialConfig;
  designs: CelestialDesign[];
  activeSlotId: string | null;
  onSave: (
    name: string,
    config: CelestialConfig,
    id?: string
  ) => Promise<{ ok: boolean; designId?: string }>;
  onDelete: (id: string) => Promise<void>;
  onApplyToSlot: (slotId: string, designId: string) => Promise<void>;
  onClose: () => void;
  onLoadDesign: (design: CelestialDesign) => void;
}

export function CelestialEditorModal({
  initialConfig,
  designs,
  activeSlotId,
  onSave,
  onDelete,
  onApplyToSlot,
  onClose,
  onLoadDesign,
}: CelestialEditorModalProps) {
  const [config, setConfig] = useState<CelestialConfig>(initialConfig ?? { ...DEFAULT_CONFIG });
  const [designName, setDesignName] = useState("Untitled");
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const setDraft = useCelestialDrafts((s) => s.setDraft);
  const clearDraft = useCelestialDrafts((s) => s.clearDraft);

  // Drag state
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig]);

  // Push every config change into the draft store for live preview
  useEffect(() => {
    if (activeSlotId) {
      setDraft(activeSlotId, config);
    }
  }, [config, activeSlotId, setDraft]);

  const patch = useCallback((partial: Partial<CelestialConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const patchDiagram = useCallback((partial: Partial<CelestialConfig["diagram"]>) => {
    setConfig((prev) => ({ ...prev, diagram: { ...prev.diagram, ...partial } }));
  }, []);

  const patchLabel = useCallback(
    (pos: "tl" | "tr" | "bl" | "br", field: "text" | "emphasis", value: string) => {
      setConfig((prev) => ({
        ...prev,
        labels: {
          ...prev.labels,
          [pos]: { ...prev.labels[pos], [field]: value },
        },
      }));
    },
    []
  );

  const patchLines = useCallback((field: "topPattern" | "bottomPattern", value: LinePattern) => {
    setConfig((prev) => ({ ...prev, lines: { ...prev.lines, [field]: value } }));
  }, []);

  const applyPreset = useCallback((p: Preset) => {
    const defaults = PRESET_DEFAULTS[p];
    setConfig((prev) => ({
      ...prev,
      preset: p,
      ...(defaults?.labels ? { labels: defaults.labels as CelestialConfig["labels"] } : {}),
      ...(defaults?.lines ? { lines: defaults.lines as CelestialConfig["lines"] } : {}),
      ...(defaults?.size ? { size: defaults.size } : {}),
      diagram: {
        ...prev.diagram,
        ...(defaults?.diagram ?? {}),
      },
    }));
  }, []);

  // ── drag handling ──
  const onDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "BUTTON") return;
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      panel.style.left = `${e.clientX - dragOffset.current.x}px`;
      panel.style.top = `${e.clientY - dragOffset.current.y}px`;
      panel.style.right = "auto";
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  // ── Save to section (one-click: save design + bind to slot) ──
  const handleSaveToSection = async () => {
    if (!activeSlotId) return;
    setSaving(true);
    try {
      const name = designName?.trim() || `:slot:${activeSlotId}`;
      const result = await onSave(name, config, activeDesignId ?? undefined);
      if (!result.ok || !result.designId) return;
      setActiveDesignId(result.designId);
      await onApplyToSlot(activeSlotId, result.designId);
      // Keep the draft alive so the page doesn't snap back to the old
      // server-rendered config. The draft matches the saved config exactly.
    } finally {
      setSaving(false);
    }
  };

  // ── Library handlers ──
  const handleLibrarySave = async (asNew: boolean) => {
    setSaving(true);
    try {
      await onSave(designName, config, asNew ? undefined : (activeDesignId ?? undefined));
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDesign = (d: CelestialDesign) => {
    setConfig(d.config);
    setDesignName(d.name);
    setActiveDesignId(d.id);
    onLoadDesign(d);
  };

  const handleLibraryApply = async () => {
    if (!activeSlotId || !activeDesignId) return;
    setSaving(true);
    try {
      await onApplyToSlot(activeSlotId, activeDesignId);
      clearDraft(activeSlotId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={panelRef}
      className={`celestial-editor ${dragging ? "celestial-editor--dragging" : ""}`}
    >
      {/* Header */}
      <div className="celestial-editor__header" onMouseDown={onDragStart}>
        <span className="celestial-editor__title">
          Celestial Editor
          {activeSlotId && (
            <span style={{ color: "var(--dawn-30)", marginLeft: 8 }}>· {activeSlotId}</span>
          )}
        </span>
        <button className="celestial-editor__close" onClick={onClose}>
          &times;
        </button>
      </div>

      {/* Preset picker */}
      <div className="celestial-editor__section">
        <div className="celestial-editor__section-label">Preset</div>
        <div className="celestial-editor__presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              className={`celestial-editor__preset-tile ${config.preset === p ? "celestial-editor__preset-tile--active" : ""}`}
              onClick={() => applyPreset(p)}
              title={p}
            >
              <DiagramSvg config={{ ...config, preset: p }} />
            </button>
          ))}
        </div>
      </div>

      {/* Orientation + Size */}
      <div className="celestial-editor__section">
        <div className="celestial-editor__section-label">Layout</div>
        <div className="celestial-editor__row">
          <label>Orient.</label>
          <div className="celestial-editor__toggle-group">
            {(["horizontal", "vertical"] as Orientation[]).map((o) => (
              <button
                key={o}
                className={`celestial-editor__toggle-btn ${config.orientation === o ? "celestial-editor__toggle-btn--active" : ""}`}
                onClick={() => patch({ orientation: o })}
              >
                {o === "horizontal" ? "H" : "V"}
              </button>
            ))}
          </div>
        </div>
        <div className="celestial-editor__row">
          <label>Size</label>
          <div className="celestial-editor__toggle-group">
            {SIZES.map((s) => (
              <button
                key={s}
                className={`celestial-editor__toggle-btn ${config.size === s ? "celestial-editor__toggle-btn--active" : ""}`}
                onClick={() => patch({ size: s })}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="celestial-editor__row">
          <label>Rotation</label>
          <select
            value={config.diagram.rotation}
            onChange={(e) => patchDiagram({ rotation: Number(e.target.value) as Rotation })}
          >
            {ROTATIONS.map((r) => (
              <option key={r} value={r}>
                {r}°
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Diagram knobs */}
      <div className="celestial-editor__section">
        <div className="celestial-editor__section-label">Diagram</div>

        <div className="celestial-editor__row">
          <label>Rings</label>
          <select
            value={config.diagram.rings?.count ?? 3}
            onChange={(e) =>
              patchDiagram({
                rings: {
                  ...(config.diagram.rings ?? { count: 3, tickDensity: 8, showMeridian: true }),
                  count: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                },
              })
            }
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="celestial-editor__row">
          <label>Ticks</label>
          <select
            value={config.diagram.rings?.tickDensity ?? 8}
            onChange={(e) =>
              patchDiagram({
                rings: {
                  ...(config.diagram.rings ?? { count: 3, tickDensity: 8, showMeridian: true }),
                  tickDensity: Number(e.target.value) as TickDensity,
                },
              })
            }
          >
            {TICK_DENSITIES.map((d) => (
              <option key={d} value={d}>
                {d === 0 ? "None" : d}
              </option>
            ))}
          </select>
        </div>
        <div className="celestial-editor__checkbox">
          <input
            type="checkbox"
            checked={config.diagram.rings?.showMeridian ?? false}
            onChange={(e) =>
              patchDiagram({
                rings: {
                  ...(config.diagram.rings ?? { count: 3, tickDensity: 8, showMeridian: false }),
                  showMeridian: e.target.checked,
                },
              })
            }
          />
          <span>Show meridian axis</span>
        </div>
        <div className="celestial-editor__row">
          <label>Weight</label>
          <input
            type="range"
            min="0.3"
            max="2"
            step="0.1"
            value={config.diagram.rings?.strokeWeight ?? 0.6}
            onChange={(e) =>
              patchDiagram({
                rings: {
                  ...(config.diagram.rings ?? { count: 3, tickDensity: 8, showMeridian: true }),
                  strokeWeight: parseFloat(
                    e.target.value
                  ) as import("@/lib/celestial/schema").StrokeWeight,
                },
              })
            }
          />
          <span style={{ minWidth: 28, textAlign: "right", color: "var(--dawn-50)", fontSize: 10 }}>
            {(config.diagram.rings?.strokeWeight ?? 0.6).toFixed(1)}
          </span>
        </div>

        {(config.preset === "squareCascade" || config.preset === "registerMarks") && (
          <>
            <div className="celestial-editor__checkbox">
              <input
                type="checkbox"
                checked={config.diagram.square?.rotated ?? true}
                onChange={(e) =>
                  patchDiagram({
                    square: {
                      ...(config.diagram.square ?? {
                        rotated: true,
                        nested: true,
                        registerMarks: true,
                      }),
                      rotated: e.target.checked,
                    },
                  })
                }
              />
              <span>Rotated square</span>
            </div>
            <div className="celestial-editor__checkbox">
              <input
                type="checkbox"
                checked={config.diagram.square?.nested ?? true}
                onChange={(e) =>
                  patchDiagram({
                    square: {
                      ...(config.diagram.square ?? {
                        rotated: true,
                        nested: true,
                        registerMarks: true,
                      }),
                      nested: e.target.checked,
                    },
                  })
                }
              />
              <span>Nested ring</span>
            </div>
            <div className="celestial-editor__checkbox">
              <input
                type="checkbox"
                checked={config.diagram.square?.registerMarks ?? true}
                onChange={(e) =>
                  patchDiagram({
                    square: {
                      ...(config.diagram.square ?? {
                        rotated: true,
                        nested: true,
                        registerMarks: true,
                      }),
                      registerMarks: e.target.checked,
                    },
                  })
                }
              />
              <span>Register marks</span>
            </div>
          </>
        )}

        <div className="celestial-editor__row">
          <label>Center</label>
          <select
            value={config.diagram.reticle?.centerShape ?? "diamond"}
            onChange={(e) =>
              patchDiagram({
                reticle: {
                  ...(config.diagram.reticle ?? { crosshair: false, centerShape: "diamond" }),
                  centerShape: e.target.value as CenterShape,
                },
              })
            }
          >
            {CENTER_SHAPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="celestial-editor__row">
          <label>Orbital</label>
          <select
            value={config.diagram.orbital?.size ?? "md"}
            onChange={(e) =>
              patchDiagram({
                orbital: {
                  ...(config.diagram.orbital ?? { angle: 0, size: "md" }),
                  size: e.target.value as Size,
                },
              })
            }
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Line patterns */}
      <div className="celestial-editor__section">
        <div className="celestial-editor__section-label">Transit Lines</div>
        <div className="celestial-editor__row">
          <label>Top</label>
          <select
            value={config.lines.topPattern}
            onChange={(e) => patchLines("topPattern", e.target.value as LinePattern)}
          >
            {LINE_PATTERNS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="celestial-editor__row">
          <label>Bottom</label>
          <select
            value={config.lines.bottomPattern}
            onChange={(e) => patchLines("bottomPattern", e.target.value as LinePattern)}
          >
            {LINE_PATTERNS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Labels */}
      <div className="celestial-editor__section">
        <div className="celestial-editor__section-label">Labels</div>
        {(["tl", "tr", "bl", "br"] as const).map((pos) => (
          <div key={pos} style={{ marginBottom: 6 }}>
            <div className="celestial-editor__row">
              <label>{pos.toUpperCase()} emph</label>
              <input
                type="text"
                maxLength={32}
                value={config.labels[pos].emphasis ?? ""}
                onChange={(e) => patchLabel(pos, "emphasis", e.target.value)}
                placeholder="emphasis"
              />
            </div>
            <div className="celestial-editor__row">
              <label>{pos.toUpperCase()} text</label>
              <input
                type="text"
                maxLength={32}
                value={config.labels[pos].text}
                onChange={(e) => patchLabel(pos, "text", e.target.value)}
                placeholder="label text"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Primary action: Save to section */}
      {activeSlotId && (
        <div className="celestial-editor__actions">
          <button
            className="celestial-editor__btn celestial-editor__btn--primary"
            onClick={handleSaveToSection}
            disabled={saving}
            style={{ flex: 2 }}
          >
            {saving ? "Saving..." : "Save to Section"}
          </button>
          <button
            className="celestial-editor__btn"
            onClick={() => setConfig(randomizeConfig())}
            title="Re-roll a new celestial composition"
          >
            ↻ Randomize
          </button>
          <button className="celestial-editor__btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      )}

      {/* Design library (collapsible secondary section) */}
      <div className="celestial-editor__section">
        <button className="celestial-editor__disclosure" onClick={() => setShowLibrary((v) => !v)}>
          <span className="celestial-editor__section-label" style={{ marginBottom: 0 }}>
            Design Library
          </span>
          <span style={{ color: "var(--dawn-30)", fontSize: 10 }}>{showLibrary ? "▲" : "▼"}</span>
        </button>

        {showLibrary && (
          <>
            <div className="celestial-editor__row" style={{ marginTop: 8 }}>
              <label>Name</label>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
              />
            </div>
            <div className="celestial-editor__library">
              {designs.map((d) => (
                <div
                  key={d.id}
                  className={`celestial-editor__library-item ${activeDesignId === d.id ? "celestial-editor__library-item--active" : ""}`}
                  onClick={() => handleLoadDesign(d)}
                >
                  <span className="celestial-editor__library-name">{d.name}</span>
                  <div className="celestial-editor__library-actions">
                    <button
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(d.id);
                      }}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
              {designs.length === 0 && (
                <div style={{ padding: "8px 0", color: "var(--dawn-30)" }}>
                  No saved designs yet
                </div>
              )}
            </div>
            <div className="celestial-editor__actions" style={{ borderTop: "none", paddingTop: 6 }}>
              <button
                className="celestial-editor__btn"
                onClick={() => handleLibrarySave(true)}
                disabled={saving}
              >
                Save New
              </button>
              {activeDesignId && (
                <button
                  className="celestial-editor__btn"
                  onClick={() => handleLibrarySave(false)}
                  disabled={saving}
                >
                  Update
                </button>
              )}
              {activeSlotId && activeDesignId && (
                <button
                  className="celestial-editor__btn"
                  onClick={handleLibraryApply}
                  disabled={saving}
                >
                  Apply
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
