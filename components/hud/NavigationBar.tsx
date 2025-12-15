"use client";

import { useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// NAVIGATION BAR - Brandworld Specification
// Fixed top navigation with canvas-based particle icons
// ═══════════════════════════════════════════════════════════════

const GRID = 2;
const GOLD = "202, 165, 84";
const DAWN = "236, 227, 214";

function drawPixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  alpha: number,
  size: number = GRID
) {
  const px = Math.floor(x / GRID) * GRID;
  const py = Math.floor(y / GRID) * GRID;
  ctx.fillStyle = `rgba(${color}, ${alpha})`;
  ctx.fillRect(px, py, size - 1, size - 1);
}

function setupIcon(
  canvas: HTMLCanvasElement | null,
  size: number
): { ctx: CanvasRenderingContext2D; size: number } | null {
  if (!canvas) return null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  return { ctx, size };
}

interface NavItem {
  label: string;
  sectionId: string;
  icon: "manifesto" | "services" | "about" | "contact";
}

const navItems: NavItem[] = [
  { label: "Manifesto", sectionId: "manifesto", icon: "manifesto" },
  { label: "Services", sectionId: "services", icon: "services" },
  { label: "About", sectionId: "about", icon: "about" },
  { label: "Contact", sectionId: "contact", icon: "contact" },
];

interface NavigationBarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export function NavigationBar({ activeSection, onNavigate }: NavigationBarProps) {
  const iconRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const drawManifestoIcon = useCallback((ctx: CanvasRenderingContext2D, size: number) => {
    // Diamond pattern
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.35;
    
    // Diamond points
    drawPixel(ctx, cx, cy - r, GOLD, 0.6);
    drawPixel(ctx, cx + r, cy, GOLD, 0.6);
    drawPixel(ctx, cx, cy + r, GOLD, 0.6);
    drawPixel(ctx, cx - r, cy, GOLD, 0.6);
    
    // Center dot
    drawPixel(ctx, cx, cy, GOLD, 0.8);
    
    // Connecting lines
    for (let i = 1; i < 3; i++) {
      const t = i / 3;
      drawPixel(ctx, cx + t * r, cy - (1 - t) * r, GOLD, 0.4);
      drawPixel(ctx, cx + (1 - t) * r, cy + t * r, GOLD, 0.4);
      drawPixel(ctx, cx - t * r, cy + (1 - t) * r, GOLD, 0.4);
      drawPixel(ctx, cx - (1 - t) * r, cy - t * r, GOLD, 0.4);
    }
  }, []);

  const drawServicesIcon = useCallback((ctx: CanvasRenderingContext2D, size: number) => {
    // 3x3 grid pattern
    const spacing = size / 4;
    const positions = [
      [1, 1], [2, 1], [3, 1],
      [1, 2], [2, 2], [3, 2],
      [1, 3], [2, 3], [3, 3],
    ];
    
    positions.forEach(([x, y], i) => {
      const alpha = 0.3 + (i / positions.length) * 0.45;
      drawPixel(ctx, x * spacing, y * spacing, DAWN, alpha);
    });
  }, []);

  const drawAboutIcon = useCallback((ctx: CanvasRenderingContext2D, size: number) => {
    // Person silhouette
    const cx = size / 2;
    
    // Head
    drawPixel(ctx, cx, size * 0.2, DAWN, 0.7);
    
    // Body (vertical line)
    for (let i = 0; i < 3; i++) {
      drawPixel(ctx, cx, size * 0.35 + i * GRID, DAWN, 0.5 - i * 0.1);
    }
    
    // Arms
    drawPixel(ctx, cx - GRID * 2, size * 0.4, DAWN, 0.4);
    drawPixel(ctx, cx + GRID * 2, size * 0.4, DAWN, 0.4);
    
    // Legs
    drawPixel(ctx, cx - GRID, size * 0.7, DAWN, 0.35);
    drawPixel(ctx, cx + GRID, size * 0.7, DAWN, 0.35);
  }, []);

  const drawContactIcon = useCallback((ctx: CanvasRenderingContext2D, size: number) => {
    // Arrow pointing right (destination)
    const cx = size / 2;
    const cy = size / 2;
    
    // Vertical line
    for (let i = -2; i <= 2; i++) {
      drawPixel(ctx, cx - GRID * 2, cy + i * GRID, DAWN, 0.4);
    }
    
    // Arrow head
    drawPixel(ctx, cx + GRID * 2, cy, GOLD, 0.7);
    drawPixel(ctx, cx + GRID, cy - GRID, GOLD, 0.5);
    drawPixel(ctx, cx + GRID, cy + GRID, GOLD, 0.5);
    
    // Arrow shaft
    drawPixel(ctx, cx, cy, DAWN, 0.5);
    drawPixel(ctx, cx - GRID, cy, DAWN, 0.4);
  }, []);

  useEffect(() => {
    navItems.forEach((item, index) => {
      const canvas = iconRefs.current[index];
      const setup = setupIcon(canvas, 17);
      if (!setup) return;

      const { ctx, size } = setup;
      ctx.clearRect(0, 0, size, size);

      switch (item.icon) {
        case "manifesto":
          drawManifestoIcon(ctx, size);
          break;
        case "services":
          drawServicesIcon(ctx, size);
          break;
        case "about":
          drawAboutIcon(ctx, size);
          break;
        case "contact":
          drawContactIcon(ctx, size);
          break;
      }
    });
  }, [drawManifestoIcon, drawServicesIcon, drawAboutIcon, drawContactIcon]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    onNavigate(sectionId);
  };

  return (
    <div className="navbar-container">
      <nav className="navbar">
        {navItems.map((item, index) => {
          const isActive = activeSection === item.sectionId;
          return (
            <a
              key={item.sectionId}
              href={`#${item.sectionId}`}
              className={`navbar-link ${isActive ? "active" : ""}`}
              onClick={(e) => handleClick(e, item.sectionId)}
            >
              <canvas
                ref={(el) => { iconRefs.current[index] = el; }}
                width={17}
                height={17}
                className="navbar-icon"
              />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <style jsx>{`
        .navbar-container {
          position: fixed;
          top: 20px;
          left: 0;
          right: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .navbar {
          display: flex;
          align-items: center;
          background: var(--surface-0, #0A0908);
          border: 1px solid rgba(236, 227, 214, 0.1);
          height: 44px;
          pointer-events: auto;
        }

        .navbar-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 18px;
          height: 100%;
          font-family: var(--font-data, 'PT Mono', monospace);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(202, 165, 84, 0.5);
          text-decoration: none;
          background: transparent;
          border-right: 1px solid rgba(236, 227, 214, 0.08);
          transition: all 150ms ease;
        }

        .navbar-link:last-child {
          border-right: none;
        }

        .navbar-link:hover {
          color: rgba(202, 165, 84, 0.8);
        }

        .navbar-link.active {
          color: var(--dawn, #ECE3D6);
          background: rgba(236, 227, 214, 0.1);
        }

        .navbar-icon {
          width: 17px;
          height: 17px;
        }
      `}</style>
    </div>
  );
}

