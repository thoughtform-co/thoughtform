"use client";

import { useState } from "react";
import { useGyroLabStore } from "@/lib/stores/gyroLabStore";

/**
 * GyroLabPanel — fixed dev overlay for `/test/navigate-gyroscope`.
 *
 * Writes the live tuning knobs to `gyroLabStore`, which `ShellSubstrateGyro`
 * reads (structural params re-build geometry; motion params are read per
 * frame). Mono / gold-dawn HUD styling matching the intelligence-artifact
 * lab. Collapsible so it never blocks the corridor read.
 */

export function GyroLabPanel() {
  const [open, setOpen] = useState(true);

  const enabled = useGyroLabStore((s) => s.enabled);
  const ringCount = useGyroLabStore((s) => s.ringCount);
  const showParticles = useGyroLabStore((s) => s.showParticles);
  const globeRadius = useGyroLabStore((s) => s.globeRadius);
  const globeDensity = useGyroLabStore((s) => s.globeDensity);
  const particleDensity = useGyroLabStore((s) => s.particleDensity);
  const mouseAmpDeg = useGyroLabStore((s) => s.mouseAmpDeg);
  const idleSpeed = useGyroLabStore((s) => s.idleSpeed);
  const set = useGyroLabStore((s) => s.set);

  return (
    <div className={`gyro-panel${open ? " is-open" : ""}`}>
      <div className="gyro-panel__head">
        <span className="gyro-panel__title">NAV · GYROSCOPE LAB</span>
        <button type="button" className="gyro-panel__collapse" onClick={() => setOpen((v) => !v)}>
          {open ? "–" : "+"}
        </button>
      </div>

      {open && (
        <div className="gyro-panel__body">
          <button
            type="button"
            className={`gyro-panel__ab${enabled ? " is-gyro" : ""}`}
            onClick={() => set({ enabled: !enabled })}
          >
            {enabled ? "◆ GYRO" : "◇ FLAT"}
          </button>

          <div className="gyro-panel__row">
            <span className="gyro-panel__label">Rings</span>
            <div className="gyro-panel__seg gyro-panel__seg--mini">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`gyro-panel__seg-btn${ringCount === n ? " is-on" : ""}`}
                  onClick={() => set({ ringCount: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={`gyro-panel__toggle${showParticles ? " is-on" : ""}`}
            onClick={() => set({ showParticles: !showParticles })}
          >
            Particles: {showParticles ? "on" : "off"}
          </button>

          <Slider
            label="Globe dens"
            value={globeDensity}
            min={0.4}
            max={1.5}
            step={0.05}
            onChange={(v) => set({ globeDensity: v })}
          />
          <Slider
            label="Pt density"
            value={particleDensity}
            min={0.2}
            max={1.5}
            step={0.05}
            onChange={(v) => set({ particleDensity: v })}
          />
          <Slider
            label="Radius"
            value={globeRadius}
            min={0.4}
            max={0.85}
            step={0.01}
            onChange={(v) => set({ globeRadius: v })}
          />
          <Slider
            label="Mouse °"
            value={mouseAmpDeg}
            min={0}
            max={45}
            step={1}
            onChange={(v) => set({ mouseAmpDeg: v })}
          />
          <Slider
            label="Idle spd"
            value={idleSpeed}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => set({ idleSpeed: v })}
          />
        </div>
      )}

      <style jsx>{`
        .gyro-panel {
          position: fixed;
          left: 18px;
          bottom: 18px;
          z-index: 9000;
          width: 214px;
          font-family: var(--font-mono, "PT Mono", ui-monospace, monospace);
          color: var(--dawn, #ebe3d6);
          background: rgba(10, 9, 8, 0.74);
          border: 1px solid var(--gold-40, rgba(202, 165, 84, 0.4));
          backdrop-filter: blur(8px);
          user-select: none;
        }
        .gyro-panel__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-bottom: 1px solid var(--dawn-15, rgba(235, 227, 214, 0.15));
        }
        .gyro-panel:not(.is-open) .gyro-panel__head {
          border-bottom: none;
        }
        .gyro-panel__title {
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--gold, #caa554);
        }
        .gyro-panel__collapse {
          width: 18px;
          height: 18px;
          line-height: 1;
          background: transparent;
          border: 1px solid var(--dawn-15, rgba(235, 227, 214, 0.15));
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
          cursor: pointer;
        }
        .gyro-panel__body {
          display: flex;
          flex-direction: column;
          gap: 9px;
          padding: 10px;
        }
        .gyro-panel__ab {
          font-family: inherit;
          font-size: 11px;
          letter-spacing: 0.16em;
          padding: 7px;
          cursor: pointer;
          background: transparent;
          border: 1px solid var(--dawn-30, rgba(235, 227, 214, 0.3));
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
        }
        .gyro-panel__ab.is-gyro {
          color: var(--void, #0a0908);
          background: var(--gold, #caa554);
          border-color: var(--gold, #caa554);
        }
        .gyro-panel__seg {
          display: flex;
          gap: 4px;
        }
        .gyro-panel__seg-btn {
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
        .gyro-panel__seg-btn:hover {
          color: var(--gold, #caa554);
          border-color: var(--gold-40, rgba(202, 165, 84, 0.4));
        }
        .gyro-panel__seg-btn.is-on {
          color: var(--void, #0a0908);
          background: var(--gold, #caa554);
          border-color: var(--gold, #caa554);
        }
        .gyro-panel__seg--mini {
          flex: 0 0 auto;
          width: 120px;
        }
        .gyro-panel__row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .gyro-panel__label {
          font-size: 9px;
          letter-spacing: 0.12em;
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
          text-transform: uppercase;
        }
        .gyro-panel__toggle {
          font-family: inherit;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 6px;
          cursor: pointer;
          background: transparent;
          border: 1px solid var(--dawn-15, rgba(235, 227, 214, 0.15));
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
        }
        .gyro-panel__toggle.is-on {
          color: var(--gold, #caa554);
          border-color: var(--gold-40, rgba(202, 165, 84, 0.4));
        }
      `}</style>
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <label className="gyro-slider">
      <span className="gyro-slider__label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="gyro-slider__val">{value.toFixed(2)}</span>
      <style jsx>{`
        .gyro-slider {
          display: grid;
          grid-template-columns: 52px 1fr 30px;
          align-items: center;
          gap: 6px;
        }
        .gyro-slider__label {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--dawn-50, rgba(235, 227, 214, 0.5));
        }
        .gyro-slider__val {
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
