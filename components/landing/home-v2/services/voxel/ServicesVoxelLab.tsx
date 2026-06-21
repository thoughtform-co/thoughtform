"use client";

import { useEffect, useState } from "react";
import { probeWebGL } from "@/lib/webgl/probe";
import { VoxelBlockGrid } from "./VoxelBlockGrid";
import { VoxelFallbackGrid } from "./VoxelFallbackGrid";
import { DEFAULT_VOXEL_CONFIG, type VoxelConfig, type VoxelMediaItem } from "./voxelTypes";
import "./voxel.css";

/** Placeholder media — proves both the image and the video paths. */
const LAB_ITEMS: readonly VoxelMediaItem[] = [
  {
    id: "keynote",
    label: "01 · Keynote",
    image: "/showcase/creative-tech/assets/vesper.png",
    video: "/videos/thoughtform-key-visual-2-web.mp4",
    alt: "Keynote — the loop as argument",
  },
  {
    id: "workshop",
    label: "02 · Workshop",
    image: "/showcase/creative-tech/assets/mimir.png",
    video: "/videos/thoughtform-key-visual-3.mp4",
    alt: "Workshop — the loop on your work",
  },
  {
    id: "embedded",
    label: "03 · Embedded",
    image: "/showcase/creative-tech/assets/babylon.png",
    video: "/videos/thoughtform-key-visual.mp4",
    alt: "Embedded — the loop until it runs itself",
  },
];

interface SliderSpec {
  key: keyof VoxelConfig;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: readonly SliderSpec[] = [
  { key: "resolution", label: "Resolution", min: 12, max: 72, step: 2 },
  { key: "displaceHeight", label: "Displace", min: 0, max: 2, step: 0.05 },
  { key: "noiseSpeed", label: "Noise speed", min: 0, max: 0.2, step: 0.005 },
  { key: "noiseScale", label: "Noise scale", min: 0.2, max: 2, step: 0.05 },
  { key: "glitch", label: "Glitch", min: 0, max: 1.5, step: 0.05 },
  { key: "fogDensity", label: "Fog", min: 0, max: 0.4, step: 0.01 },
  { key: "lightAngle", label: "Light angle", min: 0, max: 6.28, step: 0.05 },
  { key: "gap", label: "Gap", min: 0, max: 0.6, step: 0.02 },
];

interface ServicesVoxelLabProps {
  hudHtml: string;
  bodyClass: string;
}

export function ServicesVoxelLab({ hudHtml, bodyClass }: ServicesVoxelLabProps) {
  // Config lives in state: resolution/gap changes rebuild the mesh; other
  // fields are read live by the frame loop (R3F re-binds useFrame each render).
  const [config, setConfig] = useState<VoxelConfig>({ ...DEFAULT_VOXEL_CONFIG });

  const [webglOK, setWebglOK] = useState<boolean | null>(null);
  const [forceFallback, setForceFallback] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-brandmark-mode", "off");
    html.setAttribute("data-theme", "dark");
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setWebglOK(probeWebGL() && !reduced);
    return () => html.removeAttribute("data-brandmark-mode");
  }, []);

  const showFallback = forceFallback || webglOK === false;

  return (
    <div className={`voxel-lab ${bodyClass}`} data-theme="dark">
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: hudHtml }} />

      <div className="voxel-lab__stage">
        {webglOK === null ? null : showFallback ? (
          <VoxelFallbackGrid items={LAB_ITEMS} />
        ) : (
          <VoxelBlockGrid items={LAB_ITEMS} config={config} className="voxel-lab__canvas" />
        )}
      </div>

      {!showFallback && (
        <div className="voxel-lab__labels">
          {LAB_ITEMS.map((it) => (
            <span key={it.id}>{it.label}</span>
          ))}
        </div>
      )}

      <div className="voxel-lab__controls">
        <h2>Voxel controls</h2>
        {SLIDERS.map((s) => (
          <label key={s.key} className="voxel-lab__row">
            <span>{s.label}</span>
            <span>{config[s.key].toFixed(s.step < 0.01 ? 3 : 2)}</span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={config[s.key]}
              onChange={(e) =>
                setConfig((c) => ({ ...c, [s.key]: Number(e.target.value) }))
              }
            />
          </label>
        ))}
        <label className="voxel-lab__row" style={{ marginTop: 10 }}>
          <span>Force fallback</span>
          <input
            type="checkbox"
            checked={forceFallback}
            onChange={(e) => setForceFallback(e.target.checked)}
          />
        </label>
        <p className="voxel-lab__hint">
          Hover a block to play its video (one at a time). Drag-free pointer tilts the slab.
        </p>
      </div>
    </div>
  );
}
