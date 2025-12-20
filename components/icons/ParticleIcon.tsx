'use client';

/**
 * ParticleIcon - Geometric Particle Icon Renderer
 * All coordinates snap to GRID=3 for crisp pixel rendering.
 */

import { useMemo } from 'react';
import {
  ShapePoint,
  DomainShapeType,
  RoleModifierType,
  OrbitalType,
  generateDomainShape,
  generateRoleModifier,
  generateOrbital,
} from './shapes';

const GRID = 3;

export interface ParticleIconProps {
  domain: DomainShapeType;
  role?: RoleModifierType;
  orbital?: OrbitalType;
  color: string;
  size?: number;
  className?: string;
  opacity?: number;
}

interface PixelData {
  gx: number;
  gy: number;
  alpha: number;
}

function snapToGrid(value: number, center: number): number {
  return Math.floor((value + center) / GRID) * GRID;
}

function deduplicatePixels(pixels: PixelData[]): PixelData[] {
  const map = new Map<string, PixelData>();
  
  for (const pixel of pixels) {
    const key = `${pixel.gx},${pixel.gy}`;
    const existing = map.get(key);
    if (!existing || pixel.alpha > existing.alpha) {
      map.set(key, pixel);
    }
  }
  
  return Array.from(map.values());
}

export function ParticleIcon({
  domain,
  role = 'none',
  orbital = 'none',
  color,
  size = 24,
  className = '',
  opacity = 1,
}: ParticleIconProps) {
  const pixels = useMemo(() => {
    const center = size / 2;
    const radius = size / 2 - 3;
    
    const domainPoints = generateDomainShape(domain, radius);
    const rolePoints = generateRoleModifier(role, radius);
    const orbitalPoints = generateOrbital(orbital, radius * 1.1);
    
    const allPoints: ShapePoint[] = [...domainPoints, ...rolePoints, ...orbitalPoints];
    
    const rawPixels: PixelData[] = allPoints.map((point) => ({
      gx: snapToGrid(point.x, center),
      gy: snapToGrid(point.y, center),
      alpha: (point.alpha ?? 0.9) * opacity,
    }));
    
    return deduplicatePixels(rawPixels);
  }, [domain, role, orbital, size, opacity]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{
        imageRendering: 'pixelated',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      aria-hidden="true"
    >
      {pixels.map((pixel, i) => (
        <rect
          key={`${pixel.gx}-${pixel.gy}-${i}`}
          x={pixel.gx}
          y={pixel.gy}
          width={GRID - 1}
          height={GRID - 1}
          fill={`rgba(${color}, ${pixel.alpha})`}
        />
      ))}
    </svg>
  );
}

export type { DomainShapeType, RoleModifierType, OrbitalType };

