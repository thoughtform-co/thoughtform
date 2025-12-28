"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BackgroundConfig, BackgroundType, AnimationPreset } from "@/lib/types";

interface BackgroundPickerProps {
  background: BackgroundConfig | null;
  onChange: (background: BackgroundConfig | null) => void;
}

const ANIMATION_PRESETS: { value: AnimationPreset; label: string; description: string }[] = [
  // Featured
  {
    value: "gateway-cardinal",
    label: "Gateway Cardinal",
    description: "Torus with Halvorsen flow",
  },
  { value: "gateway", label: "Gateway", description: "Torus with terrain & stars" },
  // 2D Canvas
  { value: "torus", label: "Torus", description: "Rotating geometric ring" },
  { value: "attractor", label: "Attractor", description: "Chaotic motion lines" },
  { value: "wave", label: "Wave Field", description: "Flowing wave patterns" },
  // 3D Three.js
  { value: "starfield", label: "Starfield", description: "Rotating star sphere" },
  { value: "particles", label: "Particles", description: "Wave-motion particles" },
  { value: "geometric", label: "Geometric", description: "Wireframe torus points" },
  { value: "nebula", label: "Nebula", description: "Colorful particle cloud" },
  { value: "grid", label: "Grid", description: "Rolling wave grid" },
  { value: "spiral", label: "Spiral", description: "DNA double helix" },
  { value: "vortex", label: "Vortex", description: "Swirling tunnel" },
  { value: "custom", label: "Custom Code", description: "Paste your own code" },
];

export function BackgroundPicker({ background, onChange }: BackgroundPickerProps) {
  const [imageUrl, setImageUrl] = useState(background?.imageUrl || "");
  const [videoUrl, setVideoUrl] = useState(background?.videoUrl || "");
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
      videoUrl: type === "video" ? videoUrl : undefined,
      videoOpacity: 1,
      videoMuted: true,
      videoLoop: true,
      animationPreset: type === "animation" ? "gateway-cardinal" : undefined,
      animationOpacity: 0.5,
    });
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    if (background?.type === "image") {
      onChange({ ...background, imageUrl: url });
    }
  };

  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url);
    if (background?.type === "video") {
      onChange({ ...background, videoUrl: url });
    }
  };

  const handleAnimationPresetChange = (preset: AnimationPreset) => {
    if (background?.type === "animation") {
      onChange({ ...background, animationPreset: preset });
    }
  };

  const handleCustomCodeChange = (code: string) => {
    setCustomCode(code);
    if (background?.type === "animation" && background.animationPreset === "custom") {
      onChange({ ...background, customCode: code });
    }
  };

  const handleOpacityChange = (opacity: number) => {
    if (!background) return;

    const key =
      background.type === "image"
        ? "imageOpacity"
        : background.type === "video"
          ? "videoOpacity"
          : "animationOpacity";

    onChange({ ...background, [key]: opacity });
  };

  const getCurrentOpacity = () => {
    if (!background) return 0.5;
    if (background.type === "image") return background.imageOpacity ?? 0.5;
    if (background.type === "video") return background.videoOpacity ?? 1;
    if (background.type === "animation") return background.animationOpacity ?? 0.5;
    return 0.5;
  };

  return (
    <div>
      <label className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2 block">
        Background
      </label>

      {/* Type selector */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(["none", "image", "video", "animation"] as BackgroundType[]).map((type) => (
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
            {type === "animation" ? "3D" : type}
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
              "font-mono text-2xs text-dawn",
              "placeholder:text-dawn-30",
              "focus:outline-none focus:border-gold"
            )}
          />
        </div>
      )}

      {/* Video options */}
      {currentType === "video" && (
        <div className="space-y-3">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => handleVideoUrlChange(e.target.value)}
            placeholder="Video URL (MP4, WebM)..."
            className={cn(
              "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
              "font-mono text-2xs text-dawn",
              "placeholder:text-dawn-30",
              "focus:outline-none focus:border-gold"
            )}
          />
          <div className="flex gap-2">
            <label className="flex items-center gap-1 font-mono text-2xs text-dawn-50">
              <input
                type="checkbox"
                checked={background?.videoMuted ?? true}
                onChange={(e) => onChange({ ...background!, videoMuted: e.target.checked })}
                className="accent-gold"
              />
              Muted
            </label>
            <label className="flex items-center gap-1 font-mono text-2xs text-dawn-50">
              <input
                type="checkbox"
                checked={background?.videoLoop ?? true}
                onChange={(e) => onChange({ ...background!, videoLoop: e.target.checked })}
                className="accent-gold"
              />
              Loop
            </label>
          </div>
        </div>
      )}

      {/* Animation options */}
      {currentType === "animation" && (
        <div className="space-y-1">
          <div className="font-mono text-2xs text-dawn-30 mb-2">3D Animation</div>
          <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1">
            {ANIMATION_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleAnimationPresetChange(preset.value)}
                className={cn(
                  "w-full px-3 py-2 border text-left transition-colors",
                  background?.animationPreset === preset.value
                    ? "bg-gold/20 border-gold/30"
                    : "bg-surface-1 border-dawn-08 hover:border-dawn-15"
                )}
              >
                <div
                  className={cn(
                    "font-mono text-xs",
                    background?.animationPreset === preset.value ? "text-gold" : "text-dawn"
                  )}
                >
                  {preset.label}
                </div>
                <div className="font-mono text-2xs text-dawn-30 mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>

          {/* Custom code textarea */}
          {background?.animationPreset === "custom" && (
            <div className="mt-3 space-y-2">
              <div className="font-mono text-2xs text-dawn-30">Paste your code:</div>
              <textarea
                value={customCode}
                onChange={(e) => handleCustomCodeChange(e.target.value)}
                placeholder={`// Generate positions Float32Array
const count = 1000;
const positions = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

const config = { color: "#CAA554", size: 0.03 };`}
                className={cn(
                  "w-full h-48 px-3 py-2 bg-surface-1 border border-dawn-08",
                  "font-mono text-2xs text-dawn leading-relaxed",
                  "placeholder:text-dawn-20",
                  "focus:outline-none focus:border-gold",
                  "resize-none"
                )}
                spellCheck={false}
              />
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
