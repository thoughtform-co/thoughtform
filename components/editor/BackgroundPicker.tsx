"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BackgroundConfig, BackgroundType, CanvasPreset, ThreeJSPreset } from "@/lib/types";

interface BackgroundPickerProps {
  background: BackgroundConfig | null;
  onChange: (background: BackgroundConfig | null) => void;
}

const CANVAS_PRESETS: { value: CanvasPreset; label: string }[] = [
  { value: "torus", label: "Torus (Geometry)" },
  { value: "attractor", label: "Attractor (Alterity)" },
  { value: "wave", label: "Wave Field (Dynamics)" },
];

const THREEJS_PRESETS: { value: ThreeJSPreset; label: string }[] = [
  { value: "starfield", label: "Starfield" },
  { value: "particles", label: "Particles" },
  { value: "geometric", label: "Geometric" },
];

export function BackgroundPicker({ background, onChange }: BackgroundPickerProps) {
  const [imageUrl, setImageUrl] = useState(background?.imageUrl || "");

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
              "px-2 py-1 border font-mono text-2xs capitalize transition-colors",
              currentType === type
                ? "bg-gold text-void border-gold"
                : "bg-surface-1 text-dawn-50 border-dawn-08 hover:border-dawn-15"
            )}
          >
            {type}
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
        <div className="space-y-2">
          {CANVAS_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleCanvasPresetChange(preset.value)}
              className={cn(
                "w-full px-3 py-2 border font-mono text-xs text-left transition-colors",
                background?.canvasPreset === preset.value
                  ? "bg-gold/20 text-gold border-gold/30"
                  : "bg-surface-1 text-dawn-50 border-dawn-08 hover:border-dawn-15"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Three.js options */}
      {currentType === "threejs" && (
        <div className="space-y-2">
          {THREEJS_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleThreeJSPresetChange(preset.value)}
              className={cn(
                "w-full px-3 py-2 border font-mono text-xs text-left transition-colors",
                background?.threejsPreset === preset.value
                  ? "bg-gold/20 text-gold border-gold/30"
                  : "bg-surface-1 text-dawn-50 border-dawn-08 hover:border-dawn-15"
              )}
            >
              {preset.label}
            </button>
          ))}
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

