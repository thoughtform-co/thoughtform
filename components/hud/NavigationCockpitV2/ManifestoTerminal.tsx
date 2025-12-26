"use client";

import { useEffect, useState, useRef, useMemo } from "react";

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
> Most companies struggle because they treat AI like normal software.

> But AI isn't a tool to command.

> It's a strange intelligence we have to learn how
  to navigate. It leaps across dimensions we can't fathom.
  It hallucinates. It surprises.

> Fight that strangeness, and you drown in mediocrity.

> Navigate it — learn when to steer, when to think together — and thought becomes form.

> We teach you how.`;

// Combined content for total character count
const FULL_CONTENT = ASCII_TITLE + MANIFESTO_TEXT;

interface ManifestoTerminalProps {
  /** Progress through the manifesto (0-1) - used for triggering start */
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
  const hasCompletedRef = useRef(false);

  // Calculate total characters
  const totalChars = useMemo(() => FULL_CONTENT.length, []);
  const asciiLength = useMemo(() => ASCII_TITLE.length, []);

  // Memoize displayed text to avoid string operations on every render
  const { displayedAscii, displayedManifesto, isComplete } = useMemo(() => {
    if (!isActive) {
      return {
        displayedAscii: "",
        displayedManifesto: "",
        isComplete: false,
      };
    }

    const charsToShow = Math.floor(revealProgress * totalChars);
    const displayedText = FULL_CONTENT.slice(0, charsToShow);
    const displayedAscii = displayedText.slice(0, asciiLength);
    const displayedManifesto = displayedText.slice(asciiLength);
    const isComplete = charsToShow >= totalChars;

    // Check if complete
    if (isComplete && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete?.();
    }

    return {
      displayedAscii,
      displayedManifesto,
      isComplete,
    };
  }, [revealProgress, isActive, totalChars, asciiLength, onComplete]);

  if (!isActive) return null;

  return (
    <div className="manifesto-terminal">
      {/* ASCII Art Title */}
      <pre className="ascii-title">{displayedAscii}</pre>

      {/* Manifesto content - typewriter character reveal */}
      <div className="manifesto-content">
        <span className="typed-text">{displayedManifesto}</span>
        {/* Blinking block cursor - hide when complete */}
        {!isComplete && <span className="cursor-blink">█</span>}
      </div>

      <style jsx>{`
        .manifesto-terminal {
          /* Flows naturally below question text */
          width: 100%;
          text-align: left;
          position: relative;
          margin-top: -8px; /* Bring closer to question text */
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
        }

        .typed-text {
          /* Slight phosphor persistence effect */
          opacity: 0.95;
        }

        .cursor-blink {
          display: inline-block;
          margin-left: 2px;
          animation: blink 0.5s step-end infinite;
          color: var(--gold, #caa554);
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
      `}</style>
    </div>
  );
}

export default ManifestoTerminal;
