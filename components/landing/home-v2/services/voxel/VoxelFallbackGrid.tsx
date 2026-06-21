"use client";

import type { VoxelMediaItem } from "./voxelTypes";

interface VoxelFallbackGridProps {
  items: readonly VoxelMediaItem[];
}

/**
 * Static, no-WebGL paint for the voxel grid. Shown when `probeWebGL()`
 * fails or the user prefers reduced motion — so the Services section is
 * never blank. A plain responsive grid of media cards (poster image, with
 * the video as a muted autoplay loop where the browser allows it).
 *
 * Mirrors the density-tier / fallback discipline of ADR-011.
 */
export function VoxelFallbackGrid({ items }: VoxelFallbackGridProps) {
  return (
    <div className="voxel-fallback">
      {items.map((item) => (
        <figure key={item.id} className="voxel-fallback__card">
          {item.video ? (
            <video
              className="voxel-fallback__media"
              src={item.video}
              poster={item.image}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              aria-label={item.alt}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="voxel-fallback__media" src={item.image} alt={item.alt} />
          )}
          <figcaption className="voxel-fallback__label">{item.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
