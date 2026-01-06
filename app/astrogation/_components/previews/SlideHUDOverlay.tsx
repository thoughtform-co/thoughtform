"use client";

/**
 * SlideHUDOverlay - Navigation Grid HUD Rendering for Slide Previews
 *
 * Renders the NavigationGrid HUD overlay on slides in the Foundry preview.
 * Based on Thoughtform NavigationGrid design system from Astrolabe Arc Editor.
 *
 * NAVIGATION anchor translation: Rail System
 * Elements: vertical rails, corner brackets, horizontal lines, tick marks
 */

import type { HUDConfig } from "../types";

interface SlideHUDOverlayProps {
  config: HUDConfig;
  width: number;
  height: number;
  scale: number;
}

export function SlideHUDOverlay({ config, width, height, scale }: SlideHUDOverlayProps) {
  if (!config.cornerBrackets && !config.leftRail && !config.rightRail) {
    return null;
  }

  const bracketColor = config.bracketColor;
  const railColor = `rgba(202, 165, 84, ${config.railOpacity})`;
  const padding = config.hudPadding * scale;
  const cornerSize = config.cornerSize * scale;
  const railWidth = config.railWidth * scale;
  const tickCount = config.tickCount;
  const strokeWidth = Math.max(1, 2 * scale);

  // Generate tick labels
  const tickLabels: Record<number, string> = {};
  const step = Math.ceil(tickCount / 4);
  for (let i = 0; i <= 4; i++) {
    const tickIdx = i * step;
    if (tickIdx <= tickCount) {
      tickLabels[tickIdx] = String(i * 2.5);
    }
  }

  // Breathing animation styles
  const breathingStyle = config.breathing
    ? {
        animation: `hudBreathe ${2 / config.animationSpeed}s ease-in-out infinite`,
      }
    : {};

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ ...breathingStyle, zIndex: 100 }}
    >
      {/* CSS Keyframes for breathing */}
      {config.breathing && (
        <style>{`
          @keyframes hudBreathe {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
      )}

      {/* ═══ CORNER BRACKETS ═══ */}
      {config.cornerBrackets && (
        <>
          {/* Top Left */}
          <div style={{ position: "absolute", top: padding, left: padding }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: cornerSize,
                height: strokeWidth,
                background: bracketColor,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: strokeWidth,
                height: cornerSize,
                background: bracketColor,
              }}
            />
          </div>

          {/* Top Right */}
          <div style={{ position: "absolute", top: padding, right: padding }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: cornerSize,
                height: strokeWidth,
                background: bracketColor,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: strokeWidth,
                height: cornerSize,
                background: bracketColor,
              }}
            />
          </div>

          {/* Bottom Left */}
          <div style={{ position: "absolute", bottom: padding, left: padding }}>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: cornerSize,
                height: strokeWidth,
                background: bracketColor,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: strokeWidth,
                height: cornerSize,
                background: bracketColor,
              }}
            />
          </div>

          {/* Bottom Right */}
          <div style={{ position: "absolute", bottom: padding, right: padding }}>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: cornerSize,
                height: strokeWidth,
                background: bracketColor,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: strokeWidth,
                height: cornerSize,
                background: bracketColor,
              }}
            />
          </div>
        </>
      )}

      {/* ═══ TITLE (near left rail) ═══ */}
      {config.title && config.leftRail && (
        <div
          style={{
            position: "absolute",
            top: padding + cornerSize + 20 * scale,
            left: padding + railWidth + 12 * scale,
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: Math.max(8, 20 * scale),
              letterSpacing: "0.15em",
              lineHeight: 1,
              color: bracketColor,
              margin: 0,
            }}
          >
            {config.title}
          </h1>
          {config.subtitle && (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: Math.max(6, 9 * scale),
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginTop: 2 * scale,
                color: "rgba(236, 227, 214, 0.4)",
              }}
            >
              {config.subtitle}
            </p>
          )}
        </div>
      )}

      {/* ═══ LEFT RAIL ═══ */}
      {config.leftRail && (
        <aside
          style={{
            position: "absolute",
            top: padding + cornerSize + 20 * scale,
            bottom: padding + cornerSize + 20 * scale,
            left: padding,
            width: railWidth,
          }}
        >
          {/* Vertical line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: Math.max(1, scale),
              background: `linear-gradient(to bottom, transparent 0%, ${railColor} 10%, ${railColor} 90%, transparent 100%)`,
            }}
          />

          {/* Tick marks */}
          {config.tickMarks && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {Array.from({ length: tickCount + 1 }).map((_, i) => (
                <div key={i} style={{ position: "relative" }}>
                  {i > 0 && (
                    <div
                      style={{
                        width: i % 5 === 0 ? 20 * scale : 10 * scale,
                        height: Math.max(1, scale),
                        background: i % 5 === 0 ? bracketColor : `${bracketColor}80`,
                      }}
                    />
                  )}
                  {tickLabels[i] && i > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -4 * scale,
                        left: 28 * scale,
                        fontFamily: "var(--font-mono)",
                        fontSize: Math.max(6, 9 * scale),
                        color: "rgba(236, 227, 214, 0.3)",
                      }}
                    >
                      {tickLabels[i]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Diamond position indicator */}
          {config.positionIndicator && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: railWidth,
              }}
            >
              <div
                style={{
                  height: strokeWidth,
                  width: railWidth,
                  background: bracketColor,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: -5 * scale,
                  top: -4 * scale,
                  width: 10 * scale,
                  height: 10 * scale,
                  background: bracketColor,
                  transform: "rotate(45deg)",
                }}
              />
            </div>
          )}
        </aside>
      )}

      {/* ═══ RIGHT RAIL ═══ */}
      {config.rightRail && (
        <aside
          style={{
            position: "absolute",
            top: padding + cornerSize + 20 * scale,
            bottom: padding + cornerSize + 20 * scale,
            right: padding,
            width: railWidth,
          }}
        >
          {/* Vertical line */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: Math.max(1, scale),
              background: `linear-gradient(to bottom, transparent 0%, ${railColor} 10%, ${railColor} 90%, transparent 100%)`,
            }}
          />

          {/* Tick marks */}
          {config.tickMarks && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              {Array.from({ length: tickCount + 1 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i % 5 === 0 ? 20 * scale : 10 * scale,
                    height: Math.max(1, scale),
                    background: i % 5 === 0 ? bracketColor : `${bracketColor}80`,
                  }}
                />
              ))}
            </div>
          )}
        </aside>
      )}

      {/* ═══ COORDINATE READOUT ═══ */}
      {config.coordinateReadout && (
        <div
          style={{
            position: "absolute",
            bottom: padding + cornerSize + 40 * scale,
            left: padding + railWidth + 12 * scale,
            display: "flex",
            alignItems: "center",
            gap: 3 * scale,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: Math.max(6, 9 * scale),
              color: "rgba(236, 227, 214, 0.4)",
            }}
          >
            <span style={{ color: bracketColor }}>◆</span> X:{Math.round(width / 2)}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: Math.max(6, 9 * scale),
              color: "rgba(236, 227, 214, 0.4)",
            }}
          >
            ○ Y:{Math.round(height / 2)}
          </span>
        </div>
      )}

      {/* ═══ LOCATION LABEL ═══ */}
      {config.location && (
        <div
          style={{
            position: "absolute",
            bottom: padding,
            left: padding + cornerSize + 16 * scale,
            fontFamily: "var(--font-mono)",
            fontSize: Math.max(6, 10 * scale),
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(236, 227, 214, 0.4)",
          }}
        >
          {config.location}
        </div>
      )}

      {/* ═══ STATUS LABEL ═══ */}
      {config.status && (
        <div
          style={{
            position: "absolute",
            top: padding,
            right: padding + cornerSize + 16 * scale,
            fontFamily: "var(--font-mono)",
            fontSize: Math.max(6, 10 * scale),
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: `${bracketColor}B3`,
          }}
        >
          {config.status}
        </div>
      )}
    </div>
  );
}
