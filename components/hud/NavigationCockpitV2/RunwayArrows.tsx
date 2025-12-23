"use client";

interface RunwayArrowsProps {
  /** Hero→Definition transition progress (0-1) */
  transitionProgress: number;
  /** Overall scroll progress for fade-out timing */
  scrollProgress: number;
  /** Click handler to navigate to services section */
  onNavigate: () => void;
}

/**
 * Runway arrows that transform from "› › › › › ›" in hero
 * to a framed "SERVICES" button in the interface section bottom-left
 */
export function RunwayArrows({
  transitionProgress,
  scrollProgress,
  onNavigate,
}: RunwayArrowsProps) {
  const t = transitionProgress;

  // Visibility timing
  // Fade out when scrolling past interface section
  const closeStart = 0.18;
  const closeEnd = 0.35;

  let exitOpacity = 1;
  if (scrollProgress >= closeStart && scrollProgress < closeEnd) {
    exitOpacity = 1 - (scrollProgress - closeStart) / (closeEnd - closeStart);
  } else if (scrollProgress >= closeEnd) {
    exitOpacity = 0;
  }

  const isVisible = exitOpacity > 0;
  const isInteractive = t >= 0.85 && scrollProgress < closeStart;

  // Transform progress: frame and SERVICES text appear
  // Frame starts appearing at t=0.5, fully visible by t=0.85
  const frameOpacity = t < 0.5 ? 0 : t < 0.85 ? (t - 0.5) / 0.35 : 1;

  // Extra arrows (first 3) fade out during transition
  const extraArrowsOpacity = t < 0.3 ? 1 - t / 0.3 : 0;

  // Main arrows fade out as frame appears
  const mainArrowsOpacity = t < 0.5 ? 1 : t < 0.7 ? 1 - (t - 0.5) / 0.2 : 0;

  return (
    <>
      <div
        className="runway-arrows-wrapper"
        style={{
          opacity: exitOpacity,
          visibility: isVisible ? "visible" : "hidden",
        }}
      >
        {/* Hero state: Individual arrows */}
        <div
          className="hero-arrows"
          style={{
            opacity: 1 - frameOpacity,
            visibility: frameOpacity < 1 ? "visible" : "hidden",
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const isExtra = i < 3;
            const arrowOpacity = isExtra ? extraArrowsOpacity : mainArrowsOpacity;

            return (
              <span
                key={`arrow-${i}`}
                className="arrow"
                style={{
                  opacity: arrowOpacity * 0.6,
                  visibility: arrowOpacity > 0 ? "visible" : "hidden",
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                ›
              </span>
            );
          })}
        </div>

        {/* Interface state: Framed button with arrows */}
        <button
          className="services-frame"
          onClick={onNavigate}
          style={{
            opacity: frameOpacity,
            visibility: frameOpacity > 0 ? "visible" : "hidden",
            pointerEvents: isInteractive ? "auto" : "none",
            cursor: isInteractive ? "pointer" : "default",
            transform: `scale(${0.9 + frameOpacity * 0.1})`,
          }}
        >
          {/* Corner brackets */}
          <div className="frame-corner frame-corner-tl" />
          <div className="frame-corner frame-corner-tr" />
          <div className="frame-corner frame-corner-bl" />
          <div className="frame-corner frame-corner-br" />

          {/* Left arrows >>> */}
          <span className="frame-arrows frame-arrows-left">›››</span>

          {/* Text content */}
          <span className="frame-text">SERVICES</span>

          {/* Right arrows <<< */}
          <span className="frame-arrows frame-arrows-right">‹‹‹</span>

          {/* Subtle glow */}
          <div className="frame-glow" />
        </button>
      </div>

      <style jsx>{`
        .runway-arrows-wrapper {
          position: fixed;
          z-index: 5;

          /* Position: starts at vertical center, moves to bottom-left */
          /* In interface state, aligns with bridge-frame/definition text left edge */
          top: calc(50% + ${t * 35}vh);
          left: calc(var(--rail-width, 64px) + 120px);
          transform: translateY(-50%);
        }

        /* Hero arrows container */
        .hero-arrows {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 230px;
          transition: opacity 0.3s ease;
        }

        .arrow {
          font-size: 32px;
          color: var(--gold, #caa554);
          animation: arrow-pulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes arrow-pulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.9;
          }
        }

        /* Framed button - aligned with definition frame above */
        .services-frame {
          position: absolute;
          top: 50%;
          left: 4px; /* Align with bridge-frame left edge */
          transform: translateY(-50%);

          display: flex;
          align-items: center;
          gap: 10px;

          background: rgba(10, 9, 8, 0.9);
          border: 1px solid rgba(202, 165, 84, 0.25);
          padding: 10px 16px;

          transition: all 0.2s ease;
        }

        .services-frame:hover {
          background: rgba(15, 14, 12, 0.95);
          border-color: rgba(202, 165, 84, 0.5);
        }

        .services-frame:hover .frame-glow {
          opacity: 1;
        }

        .services-frame:hover .frame-arrows {
          opacity: 1;
        }

        /* Corner brackets */
        .frame-corner {
          position: absolute;
          width: 10px;
          height: 10px;
          pointer-events: none;
        }

        .frame-corner-tl {
          top: -1px;
          left: -1px;
          border-top: 2px solid var(--gold, #caa554);
          border-left: 2px solid var(--gold, #caa554);
        }

        .frame-corner-tr {
          top: -1px;
          right: -1px;
          border-top: 2px solid var(--gold, #caa554);
          border-right: 2px solid var(--gold, #caa554);
        }

        .frame-corner-bl {
          bottom: -1px;
          left: -1px;
          border-bottom: 2px solid var(--gold, #caa554);
          border-left: 2px solid var(--gold, #caa554);
        }

        .frame-corner-br {
          bottom: -1px;
          right: -1px;
          border-bottom: 2px solid var(--gold, #caa554);
          border-right: 2px solid var(--gold, #caa554);
        }

        /* Arrows in frame */
        .frame-arrows {
          font-family: var(--font-data, "PT Mono", monospace);
          font-size: 16px;
          color: var(--gold, #caa554);
          opacity: 0.7;
          letter-spacing: -2px;
          transition: opacity 0.2s ease;
        }

        /* Text */
        .frame-text {
          font-family: var(--font-data, "PT Mono", monospace);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--dawn, #ece3d6);
          white-space: nowrap;
        }

        /* Glow effect */
        .frame-glow {
          position: absolute;
          inset: -8px;
          background: radial-gradient(
            ellipse at center,
            rgba(202, 165, 84, 0.12) 0%,
            transparent 70%
          );
          pointer-events: none;
          z-index: -1;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        /* Mobile: hide entirely */
        @media (max-width: 768px) {
          .runway-arrows-wrapper {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
