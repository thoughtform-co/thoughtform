"use client";

import { useState } from "react";
import type { VariantId, CopyMode, TitleSize } from "./NavigateCopyVariants";

interface NavigateCopyControlPanelProps {
  variant: VariantId;
  onVariantChange: (v: VariantId) => void;
  mirror: boolean;
  onMirrorChange: (m: boolean) => void;
  copyMode: CopyMode;
  onCopyModeChange: (m: CopyMode) => void;
  titleSize: TitleSize;
  onTitleSizeChange: (s: TitleSize) => void;
  sphereOffsetVw: number;
  onSphereOffsetChange: (v: number) => void;
  parkProgress: number;
  onParkProgressChange: (v: number) => void;
}

const VARIANTS: { id: VariantId; label: string; sub: string }[] = [
  { id: "V0", label: "V0", sub: "Baseline" },
  { id: "V1", label: "V1", sub: "Rail card" },
  { id: "V2", label: "V2", sub: "Corner" },
  { id: "V3", label: "V3", sub: "Cartouche" },
  { id: "V4", label: "V4", sub: "Limb call" },
  { id: "V5", label: "V5", sub: "Btm stack" },
  { id: "V6", label: "V6", sub: "Top stack" },
  { id: "V7", label: "V7", sub: "Limb wrap" },
  { id: "V8", label: "V8", sub: "HUD foot" },
];

const TITLE_SIZES: TitleSize[] = ["S", "M", "L"];

/**
 * NavigateCopyControlPanel — fixed dev overlay for `/test/navigate-copy-lab`.
 *
 * Mirrors the visual style of `GyroLabPanel` (PT Mono, gold-dawn HUD,
 * collapsible) so the two labs read as siblings, but in a separate
 * namespace (`copy-panel`) so the styles never collide if both are
 * mounted on the same page.
 */
export function NavigateCopyControlPanel(props: NavigateCopyControlPanelProps) {
  const {
    variant,
    onVariantChange,
    mirror,
    onMirrorChange,
    copyMode,
    onCopyModeChange,
    titleSize,
    onTitleSizeChange,
    sphereOffsetVw,
    onSphereOffsetChange,
    parkProgress,
    onParkProgressChange,
  } = props;
  const [open, setOpen] = useState(true);

  return (
    <div className={`copy-panel${open ? " is-open" : ""}`}>
      <div className="copy-panel__head">
        <span className="copy-panel__title">NAV · COPY LAB</span>
        <button type="button" className="copy-panel__collapse" onClick={() => setOpen((v) => !v)}>
          {open ? "–" : "+"}
        </button>
      </div>

      {open && (
        <div className="copy-panel__body">
          <div className="copy-panel__section-label">VARIANT</div>
          <div className="copy-panel__variant-grid">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`copy-panel__variant${variant === v.id ? " is-on" : ""}`}
                onClick={() => onVariantChange(v.id)}
                title={v.sub}
              >
                <span className="copy-panel__variant-id">{v.label}</span>
                <span className="copy-panel__variant-sub">{v.sub}</span>
              </button>
            ))}
          </div>

          <div className="copy-panel__row">
            <button
              type="button"
              className={`copy-panel__toggle${mirror ? " is-on" : ""}`}
              onClick={() => onMirrorChange(!mirror)}
            >
              Mirror: {mirror ? "RIGHT" : "LEFT"}
            </button>
            <button
              type="button"
              className={`copy-panel__toggle${copyMode === "condensed" ? " is-on" : ""}`}
              onClick={() => onCopyModeChange(copyMode === "full" ? "condensed" : "full")}
            >
              Copy: {copyMode}
            </button>
          </div>

          <div className="copy-panel__size-row">
            <span className="copy-panel__size-label">TITLE</span>
            <div className="copy-panel__size-seg">
              {TITLE_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`copy-panel__size-btn${titleSize === s ? " is-on" : ""}`}
                  onClick={() => onTitleSizeChange(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Slider
            label="Offset"
            unit="vw"
            value={sphereOffsetVw}
            min={-12}
            max={12}
            step={0.5}
            onChange={onSphereOffsetChange}
            format={(v) => v.toFixed(1)}
          />
          <Slider
            label="Park"
            unit=""
            value={parkProgress}
            min={0.36}
            max={0.445}
            step={0.001}
            onChange={onParkProgressChange}
            format={(v) => v.toFixed(3)}
          />
        </div>
      )}

      <style jsx>{`
        .copy-panel {
          position: fixed;
          /* Docked bottom-right so the left half of the viewport stays
             clear for V1/V2/V4 evaluation; the corner-console (V2)
             especially needs the bottom-left zone unobstructed. */
          right: 18px;
          bottom: 18px;
          z-index: 9000;
          width: 252px;
          font-family: var(--font-mono, "PT Mono", ui-monospace, monospace);
          color: var(--dawn, #ebe3d6);
          background: rgba(10, 9, 8, 0.78);
          border: 1px solid var(--gold-40, rgba(202, 165, 84, 0.4));
          backdrop-filter: blur(8px);
          user-select: none;
        }
        .copy-panel__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-bottom: 1px solid var(--dawn-15, rgba(235, 227, 214, 0.15));
        }
        .copy-panel:not(.is-open) .copy-panel__head {
          border-bottom: none;
        }
        .copy-panel__title {
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--gold, #caa554);
        }
        .copy-panel__collapse {
          width: 18px;
          height: 18px;
          line-height: 1;
          background: transparent;
          border: 1px solid var(--dawn-15, rgba(235, 227, 214, 0.15));
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
          cursor: pointer;
        }
        .copy-panel__body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 10px;
        }
        .copy-panel__section-label {
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
        }
        .copy-panel__variant-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }
        .copy-panel__variant {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          font-family: inherit;
          padding: 7px 2px;
          cursor: pointer;
          background: transparent;
          border: 1px solid var(--dawn-15, rgba(235, 227, 214, 0.15));
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
          transition:
            color 140ms,
            border-color 140ms,
            background 140ms;
        }
        .copy-panel__variant:hover {
          color: var(--gold, #caa554);
          border-color: var(--gold-40, rgba(202, 165, 84, 0.4));
        }
        .copy-panel__variant.is-on {
          color: var(--void, #0a0908);
          background: var(--gold, #caa554);
          border-color: var(--gold, #caa554);
        }
        .copy-panel__variant-id {
          font-size: 11px;
          letter-spacing: 0.08em;
        }
        .copy-panel__variant-sub {
          font-size: 7px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          opacity: 0.85;
        }
        .copy-panel__row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .copy-panel__size-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .copy-panel__size-label {
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
        }
        .copy-panel__size-seg {
          display: flex;
          gap: 4px;
          width: 120px;
        }
        .copy-panel__size-btn {
          flex: 1;
          font-family: inherit;
          font-size: 9px;
          letter-spacing: 0.08em;
          padding: 5px 4px;
          cursor: pointer;
          background: transparent;
          border: 1px solid var(--dawn-15, rgba(235, 227, 214, 0.15));
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
          transition:
            color 140ms,
            border-color 140ms,
            background 140ms;
        }
        .copy-panel__size-btn:hover {
          color: var(--gold, #caa554);
          border-color: var(--gold-40, rgba(202, 165, 84, 0.4));
        }
        .copy-panel__size-btn.is-on {
          color: var(--void, #0a0908);
          background: var(--gold, #caa554);
          border-color: var(--gold, #caa554);
        }
        .copy-panel__toggle {
          font-family: inherit;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 7px 6px;
          cursor: pointer;
          background: transparent;
          border: 1px solid var(--dawn-15, rgba(235, 227, 214, 0.15));
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
          transition:
            color 140ms,
            border-color 140ms;
        }
        .copy-panel__toggle:hover {
          color: var(--gold, #caa554);
          border-color: var(--gold-40, rgba(202, 165, 84, 0.4));
        }
        .copy-panel__toggle.is-on {
          color: var(--gold, #caa554);
          border-color: var(--gold-40, rgba(202, 165, 84, 0.4));
        }
      `}</style>
    </div>
  );
}

interface SliderProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}

function Slider({ label, unit, value, min, max, step, onChange, format }: SliderProps) {
  return (
    <label className="copy-slider">
      <span className="copy-slider__label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="copy-slider__val">
        {format(value)}
        {unit}
      </span>
      <style jsx>{`
        .copy-slider {
          display: grid;
          grid-template-columns: 44px 1fr 50px;
          align-items: center;
          gap: 6px;
        }
        .copy-slider__label {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
        }
        .copy-slider__val {
          font-size: 9px;
          text-align: right;
          color: var(--gold, #caa554);
          font-variant-numeric: tabular-nums;
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 2px;
          background: var(--dawn-15, rgba(235, 227, 214, 0.15));
          outline: none;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 9px;
          height: 9px;
          background: var(--gold, #caa554);
          border: 0;
          transform: rotate(45deg);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 9px;
          height: 9px;
          background: var(--gold, #caa554);
          border: 0;
          cursor: pointer;
        }
      `}</style>
    </label>
  );
}
