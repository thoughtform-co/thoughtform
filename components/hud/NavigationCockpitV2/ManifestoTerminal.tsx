"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { ManifestoSources } from "./ManifestoSources";

// ═══════════════════════════════════════════════════════════════════
// MANIFESTO CONTENT
// Progressive reveal with typewriter effect - cool-retro-term style
// ═══════════════════════════════════════════════════════════════════

// ASCII Art title - "AI ISN'T SOFTWARE." - elegant underline style
const ASCII_TITLE = `▄▀█ █   █ █▀ █▄░█ ▀ ▀█▀   █▀ █▀█ █▀▀ ▀█▀ █░█░█ ▄▀█ █▀█ █▀▀
█▀█ █   █ ▄█ █░▀█   ░█░   ▄█ █▄█ █▀░ ░█░ ▀▄▀▄▀ █▀█ █▀▄ ██▄.
`;

// Manifesto content - full text for character-by-character reveal
const MANIFESTO_TEXT = `
Most companies struggle with their AI adoption because
they treat AI like normal software.

But AI isn't a tool to command.

It's a strange, new intelligence we have to learn how
to navigate. It leaps across dimensions we can't fathom.
It hallucinates. It surprises.

In technical work, that strangeness must be constrained.
But in creative and strategic work?
It's the source of truly novel ideas.

Thoughtform teaches teams to think WITH that intelligence—
navigating its strangeness for creative breakthroughs.`;

// Combined content for total character count
const FULL_CONTENT = ASCII_TITLE + MANIFESTO_TEXT;

interface ManifestoTerminalProps {
  /** Progress through the manifesto (0-1) */
  revealProgress: number;
  /** Whether the terminal is active/visible */
  isActive: boolean;
  /** Callback when manifesto is fully revealed */
  onComplete?: () => void;
}

export function ManifestoTerminal({
  revealProgress,
  isActive,
  onComplete,
}: ManifestoTerminalProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [showSources, setShowSources] = useState(false);
  const hasCompletedRef = useRef(false);

  // Calculate total characters
  const totalChars = useMemo(() => FULL_CONTENT.length, []);

  // Calculate how much to reveal based on progress (character by character)
  useEffect(() => {
    if (!isActive) {
      setDisplayedText("");
      setShowSources(false);
      hasCompletedRef.current = false;
      return;
    }

    const charsToShow = Math.floor(revealProgress * totalChars);
    setDisplayedText(FULL_CONTENT.slice(0, charsToShow));

    // Check if complete
    if (charsToShow >= totalChars && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      // Show sources after a brief delay
      setTimeout(() => setShowSources(true), 300);
      onComplete?.();
    }
  }, [revealProgress, isActive, onComplete, totalChars]);

  if (!isActive) return null;

  // Split displayed text into ASCII art and manifesto parts
  const asciiLength = ASCII_TITLE.length;
  const displayedAscii = displayedText.slice(0, asciiLength);
  const displayedManifesto = displayedText.slice(asciiLength);

  return (
    <div className="manifesto-terminal">
      {/* CRT glow overlay */}
      <div className="crt-glow"></div>

      {/* ASCII Art Title */}
      <pre className="ascii-title">{displayedAscii}</pre>

      {/* Manifesto content - typewriter character reveal */}
      <div className="manifesto-content">
        <span className="typed-text">{displayedManifesto}</span>
        {/* Blinking block cursor - hide when complete */}
        {revealProgress < 1 && <span className="cursor-blink">█</span>}
      </div>

      {/* Sources section - appears after manifesto complete */}
      <ManifestoSources isVisible={showSources} />

      <style jsx>{`
        .manifesto-terminal {
          /* Flows naturally below question text */
          width: 100%;
          text-align: left;
          position: relative;
          margin-top: -8px; /* Bring closer to question text */
        }

        /* CRT phosphor glow effect */
        .crt-glow {
          position: absolute;
          inset: -10px;
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(202, 165, 84, 0.03) 0%,
            transparent 70%
          );
          filter: blur(20px);
          z-index: -1;
        }

        /* ASCII Art Title - elegant 2-line style */
        .ascii-title {
          font-family: "Iosevka Web", "Iosevka", "IBM Plex Mono", "Fira Code", monospace;
          font-size: clamp(11px, 1.3vw, 15px);
          line-height: 1.2;
          color: var(--gold, #caa554);
          margin: 0 0 12px 0; /* Reduced gap to manifesto */
          white-space: pre;
          overflow: hidden;
          text-shadow:
            0 0 2px rgba(202, 165, 84, 0.8),
            0 0 4px rgba(202, 165, 84, 0.4),
            0 0 8px rgba(202, 165, 84, 0.2);
          animation: crt-flicker 0.15s infinite;
        }

        .manifesto-content {
          /* Iosevka - beautiful monospace terminal font */
          font-family:
            "Iosevka Web", "Iosevka", "Iosevka Term", "IBM Plex Mono", "Fira Code", monospace;
          font-size: clamp(14px, 1.5vw, 16px);
          line-height: 1.7;
          font-weight: 400;
          /* Tensor Gold color */
          color: var(--gold, #caa554);
          text-align: left;
          letter-spacing: 0.02em;
          white-space: pre-wrap;
          /* CRT text glow */
          text-shadow:
            0 0 2px rgba(202, 165, 84, 0.8),
            0 0 4px rgba(202, 165, 84, 0.4),
            0 0 8px rgba(202, 165, 84, 0.2);
          /* Subtle CRT flicker */
          animation: crt-flicker 0.15s infinite;
        }

        .typed-text {
          /* Slight phosphor persistence effect */
          opacity: 0.95;
        }

        .cursor-blink {
          display: inline-block;
          margin-left: 2px;
          animation: blink 0.8s step-end infinite;
          color: var(--gold, #caa554);
          text-shadow:
            0 0 4px rgba(202, 165, 84, 1),
            0 0 8px rgba(202, 165, 84, 0.6);
        }

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

        /* Subtle CRT flicker - very subtle to not be distracting */
        @keyframes crt-flicker {
          0% {
            opacity: 0.97;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.98;
          }
        }
      `}</style>
    </div>
  );
}

export default ManifestoTerminal;
