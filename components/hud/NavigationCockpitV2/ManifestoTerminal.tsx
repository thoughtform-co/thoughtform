"use client";

import { useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════
// MANIFESTO CONTENT
// Progressive reveal with typewriter effect - cool-retro-term style
// ═══════════════════════════════════════════════════════════════════

// Manifesto content - full text for character-by-character reveal
// Title "AI ISN'T SOFTWARE" appears via GlitchText transition above
const MANIFESTO_TEXT = `> Most companies struggle because they treat AI like normal software.

> But AI is a strange intelligence that blurs the line between tool and collaborator.
  It leaps across dimensions we can't fathom. It hallucinates. It surprises.

> Fight that strangeness, and you drown in mediocrity.
  Navigate it, learn to move through its terrain, and your thought becomes form.

> Build what you couldn't build before.

> Not through frameworks, but through building an interface
  between your intuition and its alien geometry.

> We teach you how.`;

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
  const totalChars = useMemo(() => MANIFESTO_TEXT.length, []);

  // Memoize displayed text to avoid string operations on every render
  const { displayedManifesto, isComplete } = useMemo(() => {
    if (!isActive) {
      return {
        displayedManifesto: "",
        isComplete: false,
      };
    }

    const charsToShow = Math.floor(revealProgress * totalChars);
    const displayedManifesto = MANIFESTO_TEXT.slice(0, charsToShow);
    const isComplete = charsToShow >= totalChars;

    // Check if complete
    if (isComplete && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete?.();
    }

    return {
      displayedManifesto,
      isComplete,
    };
  }, [revealProgress, isActive, totalChars, onComplete]);

  if (!isActive) return null;

  return (
    <div className="manifesto-terminal">
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
