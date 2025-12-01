"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  BackgroundConfig,
  BackgroundType,
  CanvasPreset,
  ThreeJSPreset,
} from "@/lib/types";

interface BackgroundPickerProps {
  background: BackgroundConfig | null;
  onChange: (background: BackgroundConfig | null) => void;
}

const CANVAS_PRESETS: { value: CanvasPreset; label: string; description: string }[] = [
  { value: "torus", label: "Torus", description: "Rotating geometric ring" },
  { value: "attractor", label: "Attractor", description: "Chaotic motion lines" },
  { value: "wave", label: "Wave Field", description: "Flowing wave patterns" },
  { value: "gateway", label: "Gateway", description: "Torus with terrain & stars" },
];

const THREEJS_PRESETS: { value: ThreeJSPreset; label: string; description: string }[] = [
  { value: "starfield", label: "Starfield", description: "Rotating star sphere" },
  { value: "particles", label: "Particles", description: "Wave-motion particles" },
  { value: "geometric", label: "Geometric", description: "Wireframe torus points" },
  { value: "nebula", label: "Nebula", description: "Colorful particle cloud" },
  { value: "grid", label: "Grid", description: "Rolling wave grid plane" },
  { value: "spiral", label: "Spiral", description: "DNA double helix" },
  { value: "vortex", label: "Vortex", description: "Swirling tunnel effect" },
  { value: "custom", label: "Custom Code", description: "Paste your own Three.js" },
];

export function BackgroundPicker({ background, onChange }: BackgroundPickerProps) {
  const [imageUrl, setImageUrl] = useState(background?.imageUrl || "");
  const [customCode, setCustomCode] = useState(background?.customCode || "");

  const currentType = background?.type || "none";

  const handleTypeChange = (type: BackgroundType) => {
    if (type === "none") {
      onChange(null);
      return;
    }

    onChange({
      type,
      imageUrl: type === "image" ? imageUrl : undefined,
      imageOpacity: 0.5,
      canvasPreset: type === "canvas" ? "torus" : undefined,
      canvasOpacity: 0.5,
      threejsPreset: type === "threejs" ? "starfield" : undefined,
      threejsOpacity: 0.5,
    });
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    if (background?.type === "image") {
      onChange({ ...background, imageUrl: url });
    }
  };

  const handleCanvasPresetChange = (preset: CanvasPreset) => {
    if (background?.type === "canvas") {
      onChange({ ...background, canvasPreset: preset });
    }
  };

  const handleThreeJSPresetChange = (preset: ThreeJSPreset) => {
    if (background?.type === "threejs") {
      onChange({ ...background, threejsPreset: preset });
    }
  };

  const handleCustomCodeChange = (code: string) => {
    setCustomCode(code);
    if (background?.type === "threejs" && background.threejsPreset === "custom") {
      onChange({ ...background, customCode: code });
    }
  };

  const handleOpacityChange = (opacity: number) => {
    if (!background) return;

    const key =
      background.type === "image"
        ? "imageOpacity"
        : background.type === "canvas"
        ? "canvasOpacity"
        : "threejsOpacity";

    onChange({ ...background, [key]: opacity });
  };

  const getCurrentOpacity = () => {
    if (!background) return 0.5;
    if (background.type === "image") return background.imageOpacity ?? 0.5;
    if (background.type === "canvas") return background.canvasOpacity ?? 0.5;
    if (background.type === "threejs") return background.threejsOpacity ?? 0.5;
    return 0.5;
  };

  return (
    <div>
      <label className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2 block">
        Background
      </label>

      {/* Type selector */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(["none", "image", "canvas", "threejs"] as BackgroundType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={cn(
              "px-2 py-1 border font-mono text-2xs transition-colors",
              currentType === type
                ? "bg-gold text-void border-gold"
                : "bg-surface-1 text-dawn-50 border-dawn-08 hover:border-dawn-15"
            )}
          >
            {type === "threejs" ? "3D" : type}
          </button>
        ))}
      </div>

      {/* Image options */}
      {currentType === "image" && (
        <div className="space-y-3">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => handleImageUrlChange(e.target.value)}
            placeholder="Image URL..."
            className={cn(
              "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
              "font-mono text-xs text-dawn",
              "placeholder:text-dawn-30",
              "focus:outline-none focus:border-gold"
            )}
          />
        </div>
      )}

      {/* Canvas options */}
      {currentType === "canvas" && (
        <div className="space-y-1">
          <div className="font-mono text-2xs text-dawn-30 mb-2">2D Canvas</div>
          {CANVAS_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleCanvasPresetChange(preset.value)}
              className={cn(
                "w-full px-3 py-2 border text-left transition-colors",
                background?.canvasPreset === preset.value
                  ? "bg-gold/20 border-gold/30"
                  : "bg-surface-1 border-dawn-08 hover:border-dawn-15"
              )}
            >
              <div className={cn(
                "font-mono text-xs",
                background?.canvasPreset === preset.value ? "text-gold" : "text-dawn"
              )}>
                {preset.label}
              </div>
              <div className="font-mono text-2xs text-dawn-30 mt-0.5">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Three.js options */}
      {currentType === "threejs" && (
        <div className="space-y-1">
          <div className="font-mono text-2xs text-dawn-30 mb-2">3D Animation</div>
          <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1">
            {THREEJS_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleThreeJSPresetChange(preset.value)}
                className={cn(
                  "w-full px-3 py-2 border text-left transition-colors",
                  background?.threejsPreset === preset.value
                    ? "bg-gold/20 border-gold/30"
                    : "bg-surface-1 border-dawn-08 hover:border-dawn-15"
                )}
              >
                <div className={cn(
                  "font-mono text-xs",
                  background?.threejsPreset === preset.value ? "text-gold" : "text-dawn"
                )}>
                  {preset.label}
                </div>
                <div className="font-mono text-2xs text-dawn-30 mt-0.5">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>

          {/* Custom code textarea */}
          {background?.threejsPreset === "custom" && (
            <div className="mt-3 space-y-2">
              <div className="font-mono text-2xs text-dawn-30">
                Paste your scene code below:
              </div>
              <textarea
                value={customCode}
                onChange={(e) => handleCustomCodeChange(e.target.value)}
                placeholder={`// Your Three.js scene function
// Available: useRef, useMemo, useFrame, THREE, Points, PointMaterial

function CustomScene() {
  const ref = useRef();
  
  const positions = useMemo(() => {
    const arr = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <Points ref={ref} positions={positions}>
      <PointMaterial color="#CAA554" size={0.05} />
    </Points>
  );
}`}
                className={cn(
                  "w-full h-64 px-3 py-2 bg-surface-1 border border-dawn-08",
                  "font-mono text-2xs text-dawn leading-relaxed",
                  "placeholder:text-dawn-20",
                  "focus:outline-none focus:border-gold",
                  "resize-none"
                )}
                spellCheck={false}
              />
              <div className="font-mono text-2xs text-dawn-20">
                Code runs in a sandboxed Three.js Canvas
              </div>
            </div>
          )}
        </div>
      )}

      {/* Opacity slider */}
      {currentType !== "none" && (
        <div className="mt-3">
          <div className="flex justify-between mb-1">
            <span className="font-mono text-2xs text-dawn-50">Opacity</span>
            <span className="font-mono text-2xs text-dawn-30">
              {Math.round(getCurrentOpacity() * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={getCurrentOpacity()}
            onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
            className="w-full accent-gold"
          />
        </div>
      )}
    </div>
  );
}
