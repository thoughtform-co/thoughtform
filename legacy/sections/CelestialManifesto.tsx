"use client";

import { ReactNode, useEffect, useState } from "react";

/**
 * CelestialManifesto - Navigation-Inspired Manifesto Display
 *
 * Transforms manifesto content into a celestial navigation interface.
 * Combines NavigationGrid frame with astrolabe-style instruments,
 * star chart waypoints, and coordinate readouts.
 *
 * SEMANTIC ANCHOR: NAVIGATION
 * The manifesto becomes a navigational reading—a course plotted
 * through conceptual space.
 */

interface CelestialManifestoProps {
  /** Manifesto title */
  title?: string;
  /** Manifesto content paragraphs */
  content?: string[];
  /** Current "position" coordinates (for dynamic updates) */
  coordinates?: {
    delta: number;
    theta: number;
    rho: number;
    zeta: number;
  };
  /** Waypoint markers for key concepts */
  waypoints?: Array<{
    label: string;
    position: { x: number; y: number };
    active?: boolean;
  }>;
}

// ═══════════════════════════════════════════════════════════════════
// CORNER BRACKET
// ═══════════════════════════════════════════════════════════════════

function CornerBracket({
  position,
  size = 40,
  padding = 32,
}: {
  position: "tl" | "tr" | "bl" | "br";
  size?: number;
  padding?: number;
}) {
  const positionStyles: Record<string, React.CSSProperties> = {
    tl: { top: padding, left: padding },
    tr: { top: padding, right: padding },
    bl: { bottom: padding, left: padding },
    br: { bottom: padding, right: padding },
  };

  const lineStyles: Record<
    string,
    { horizontal: React.CSSProperties; vertical: React.CSSProperties }
  > = {
    tl: {
      horizontal: { top: 0, left: 0, width: size, height: 2 },
      vertical: { top: 0, left: 0, width: 2, height: size },
    },
    tr: {
      horizontal: { top: 0, right: 0, width: size, height: 2 },
      vertical: { top: 0, right: 0, width: 2, height: size },
    },
    bl: {
      horizontal: { bottom: 0, left: 0, width: size, height: 2 },
      vertical: { bottom: 0, left: 0, width: 2, height: size },
    },
    br: {
      horizontal: { bottom: 0, right: 0, width: size, height: 2 },
      vertical: { bottom: 0, right: 0, width: 2, height: size },
    },
  };

  const gold = "var(--gold, #CAA554)";

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        ...positionStyles[position],
        width: size,
        height: size,
      }}
    >
      <div
        className="absolute"
        style={{
          ...lineStyles[position].horizontal,
          background: gold,
        }}
      />
      <div
        className="absolute"
        style={{
          ...lineStyles[position].vertical,
          background: gold,
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VERTICAL RAIL WITH SCALE
// ═══════════════════════════════════════════════════════════════════

function VerticalRail({
  side,
  padding = 32,
  cornerSize = 40,
  children,
}: {
  side: "left" | "right";
  padding?: number;
  cornerSize?: number;
  children?: ReactNode;
}) {
  const goldHalf = "rgba(202, 165, 84, 0.5)";
  const dawnDim = "rgba(236, 227, 214, 0.3)";
  const ticks = [0, 2, 5, 7, 10];

  const sideStyles: React.CSSProperties = side === "left" ? { left: padding } : { right: padding };

  return (
    <div
      className="absolute flex flex-col"
      style={{
        ...sideStyles,
        top: padding + cornerSize + 20,
        bottom: padding + cornerSize + 20,
        width: 60,
      }}
    >
      {/* Vertical line */}
      <div
        className="absolute"
        style={{
          [side]: 0,
          top: 0,
          bottom: 0,
          width: 1,
          background: `linear-gradient(
            to bottom,
            transparent 0%,
            ${goldHalf} 10%,
            ${goldHalf} 90%,
            transparent 100%
          )`,
        }}
      />

      {/* Scale ticks */}
      <div className="flex-1 relative">
        {ticks.map((tick, i) => (
          <div
            key={tick}
            className="absolute flex items-center"
            style={{
              top: `${(i / (ticks.length - 1)) * 100}%`,
              [side]: 0,
              transform: "translateY(-50%)",
            }}
          >
            {/* Tick mark */}
            <div
              style={{
                width: i === 0 || i === ticks.length - 1 ? 20 : 10,
                height: 1,
                background: i === 0 || i === ticks.length - 1 ? goldHalf : dawnDim,
                [side === "left" ? "marginRight" : "marginLeft"]: 4,
              }}
            />
            {/* Label */}
            <span
              style={{
                fontFamily: 'var(--font-mono, "PT Mono", monospace)',
                fontSize: 9,
                color: dawnDim,
                [side === "left" ? "marginLeft" : "marginRight"]: 4,
              }}
            >
              {tick}
            </span>
          </div>
        ))}
      </div>

      {/* Custom content */}
      {children && (
        <div
          className="mt-4"
          style={{
            [side === "left" ? "paddingLeft" : "paddingRight"]: 28,
            textAlign: side === "left" ? "left" : "right",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COORDINATE DISPLAY
// ═══════════════════════════════════════════════════════════════════

function CoordinateDisplay({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  const dawn30 = "rgba(236, 227, 214, 0.3)";
  const dawn70 = "rgba(236, 227, 214, 0.7)";
  const gold = "var(--gold, #CAA554)";

  return (
    <div className="mb-2">
      <div
        style={{
          fontFamily: 'var(--font-mono, "PT Mono", monospace)',
          fontSize: 9,
          letterSpacing: "0.1em",
          color: dawn30,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono, "PT Mono", monospace)',
          fontSize: 11,
          color: accent ? gold : dawn70,
          textTransform: "uppercase",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WAYPOINT MARKER (for star chart)
// ═══════════════════════════════════════════════════════════════════

function WaypointMarker({
  label,
  position,
  active = false,
}: {
  label: string;
  position: { x: number; y: number };
  active?: boolean;
}) {
  const gold = "var(--gold, #CAA554)";
  const dawn30 = "rgba(236, 227, 214, 0.3)";

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Marker dot */}
      <div
        className="absolute"
        style={{
          width: active ? 6 : 4,
          height: active ? 6 : 4,
          borderRadius: "50%",
          background: active ? gold : dawn30,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          boxShadow: active ? `0 0 8px ${gold}, 0 0 12px ${gold}` : "none",
        }}
      />
      {/* Label */}
      <div
        className="absolute whitespace-nowrap"
        style={{
          fontFamily: 'var(--font-mono, "PT Mono", monospace)',
          fontSize: 8,
          color: active ? gold : dawn30,
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginTop: 6,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function CelestialManifesto({
  title = "AI ISN'T SOFTWARE",
  content = [
    "Most companies struggle with their AI adoption because they treat AI like normal software.",
    "But AI isn't a tool to command. It's a strange, new intelligence we have to learn how to navigate. It leaps across dimensions we can't fathom. It hallucinates. It surprises.",
    "In technical work, that strangeness must be constrained. But in creative and strategic work? It's the source of truly novel ideas.",
    "Thoughtform teaches teams to think with that intelligence—navigating its strangeness for creative breakthroughs.",
  ],
  coordinates = {
    delta: 0.52,
    theta: 73.1,
    rho: 0.78,
    zeta: 5.9,
  },
  waypoints = [
    { label: "NAVIGATE", position: { x: 25, y: 30 }, active: true },
    { label: "STRANGENESS", position: { x: 60, y: 50 }, active: false },
    { label: "BREAKTHROUGH", position: { x: 75, y: 70 }, active: false },
  ],
}: CelestialManifestoProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const voidBg = "var(--void, #050403)";
  const dawn = "var(--dawn, #ECE3D6)";
  const dawn50 = "rgba(236, 227, 214, 0.5)";
  const dawn30 = "rgba(236, 227, 214, 0.3)";
  const gold = "var(--gold, #CAA554)";

  return (
    <div
      className="relative min-h-screen"
      style={{
        background: voidBg,
        color: dawn,
      }}
    >
      {/* Navigation Grid Frame */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Corner brackets */}
        <CornerBracket position="tl" />
        <CornerBracket position="tr" />
        <CornerBracket position="bl" />
        <CornerBracket position="br" />

        {/* Left rail */}
        <VerticalRail side="left">
          <CoordinateDisplay label="δ" value={coordinates.delta.toFixed(2)} />
          <CoordinateDisplay label="θ" value={`${coordinates.theta.toFixed(1)}°`} accent />
          <CoordinateDisplay label="ρ" value={coordinates.rho.toFixed(2)} />
          <CoordinateDisplay label="ζ" value={coordinates.zeta.toFixed(1)} />
        </VerticalRail>

        {/* Right rail */}
        <VerticalRail side="right">
          <CoordinateDisplay
            label="SIGNAL"
            value={`${Math.round(50 + scrollProgress * 30)}%`}
            accent
          />
          <CoordinateDisplay label="MODE" value="NAVIGATE" />
          <CoordinateDisplay label="COURSE" value="PLOTTED" />
        </VerticalRail>
      </div>

      {/* Star chart background (subtle) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: dawn30,
            }}
          />
        ))}
      </div>

      {/* Waypoint markers */}
      <div className="absolute inset-0 pointer-events-none">
        {waypoints.map((waypoint, i) => (
          <WaypointMarker
            key={i}
            label={waypoint.label}
            position={waypoint.position}
            active={waypoint.active}
          />
        ))}
      </div>

      {/* Manifesto Content */}
      <div className="relative z-10 pointer-events-auto">
        <div className="container mx-auto px-8 py-32 max-w-4xl">
          {/* Terminal-style prompt */}
          <div
            className="mb-8"
            style={{
              fontFamily: 'var(--font-mono, "PT Mono", monospace)',
              fontSize: 12,
              color: dawn50,
            }}
          >
            THOUGHTFORM@MANIFESTO:~
          </div>

          {/* Title */}
          <h1
            className="mb-6"
            style={{
              fontFamily: 'var(--font-mono, "PT Mono", monospace)',
              fontSize: "clamp(2rem, 5vw, 4rem)",
              fontWeight: "bold",
              letterSpacing: "0.1em",
              color: gold,
              textTransform: "uppercase",
            }}
          >
            {title}
          </h1>

          {/* Command prompt */}
          <div
            className="mb-8"
            style={{
              fontFamily: 'var(--font-mono, "PT Mono", monospace)',
              fontSize: 12,
              color: dawn50,
            }}
          >
            $ cat manifesto.txt
          </div>

          {/* Content paragraphs */}
          <div className="space-y-6">
            {content.map((paragraph, i) => (
              <p
                key={i}
                style={{
                  fontFamily: 'var(--font-sans, "IBM Plex Sans", sans-serif)',
                  fontSize: "1.0625rem",
                  lineHeight: 1.8,
                  color: dawn,
                }}
              >
                {paragraph.split(/\*\*(.*?)\*\*/g).map((part, j) => {
                  if (j % 2 === 1) {
                    return (
                      <strong key={j} style={{ color: gold }}>
                        {part}
                      </strong>
                    );
                  }
                  return part;
                })}
              </p>
            ))}
          </div>

          {/* Blinking cursor */}
          <div
            className="mt-8 inline-block"
            style={{
              fontFamily: 'var(--font-mono, "PT Mono", monospace)',
              fontSize: 16,
              color: gold,
              animation: "blink 1s infinite",
            }}
          >
            _
          </div>
        </div>
      </div>

      {/* Blink animation */}
      <style jsx>{`
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
