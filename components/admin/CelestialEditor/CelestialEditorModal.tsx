"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  CelestialConfig,
  CelestialDesign,
  Preset,
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
import { CelestialConnector } from "@/components/landing/v7/CelestialConnector";
import { DiagramSvg } from "@/components/landing/v7/CelestialConnector/DiagramSvg";
import "./celestial-editor.css";

interface CelestialEditorModalProps {
  initialConfig?: CelestialConfig;
  designs: CelestialDesign[];
  activeSlotId: string | null;
  onSave: (name: string, config: CelestialConfig, id?: string) => Promise<void>;
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

  // Drag state
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig]);

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

  // ── handlers ──
  const handleSave = async (asNew: boolean) => {
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

  const handleApply = async () => {
    if (!activeSlotId || !activeDesignId) return;
    await onApplyToSlot(activeSlotId, activeDesignId);
  };

  return (
    <div
      ref={panelRef}
      className={`celestial-editor ${dragging ? "celestial-editor--dragging" : ""}`}
    >
      {/* Header */}
      <div className="celestial-editor__header" onMouseDown={onDragStart}>
        <span className="celestial-editor__title">Celestial Editor</span>
        <button className="celestial-editor__close" onClick={onClose}>
          &times;
        </button>
      </div>

      {/* Live preview */}
      <div className="celestial-editor__preview">
        <div className="celestial-editor__preview-inner">
          <CelestialConnector config={config} />
        </div>
      </div>

      {/* Preset picker */}
      <div className="celestial-editor__section">
        <div className="celestial-editor__section-label">Preset</div>
        <div className="celestial-editor__presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              className={`celestial-editor__preset-tile ${config.preset === p ? "celestial-editor__preset-tile--active" : ""}`}
              onClick={() => patch({ preset: p })}
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

        {/* Rings */}
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

        {/* Square options (conditional) */}
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

        {/* Center shape */}
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

        {/* Orbital size */}
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
        <div className="celestial-editor__checkbox">
          <input
            type="checkbox"
            checked={config.cornerBrackets}
            onChange={(e) => patch({ cornerBrackets: e.target.checked })}
          />
          <span>Corner brackets</span>
        </div>
      </div>

      {/* Design library */}
      <div className="celestial-editor__section">
        <div className="celestial-editor__section-label">Design Library</div>
        <div className="celestial-editor__row">
          <label>Name</label>
          <input type="text" value={designName} onChange={(e) => setDesignName(e.target.value)} />
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
            <div style={{ padding: "8px 0", color: "var(--dawn-30)" }}>No saved designs yet</div>
          )}
        </div>
      </div>

      {/* Slot assignment info */}
      {activeSlotId && (
        <div className="celestial-editor__slot-bar">
          Editing slot: <span>{activeSlotId}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="celestial-editor__actions">
        <button
          className="celestial-editor__btn"
          onClick={() => handleSave(true)}
          disabled={saving}
        >
          Save New
        </button>
        {activeDesignId && (
          <button
            className="celestial-editor__btn"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            Update
          </button>
        )}
        {activeSlotId && activeDesignId && (
          <button
            className="celestial-editor__btn celestial-editor__btn--primary"
            onClick={handleApply}
            disabled={saving}
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
}
