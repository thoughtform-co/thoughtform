"use client";

import { useEffect, useState, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// MANIFESTO CONTENT
// Progressive reveal - each line appears as user scrolls
// ═══════════════════════════════════════════════════════════════════

// Manifesto content - each line as separate item for progressive reveal
const MANIFESTO_LINES = [
  "Most companies struggle with their AI adoption because",
  "they treat AI like normal software.",
  "",
  "But AI isn't a tool to command.",
  "",
  "It's a strange, new intelligence we have to learn how",
  "to navigate. It leaps across dimensions we can't fathom.",
  "It hallucinates. It surprises.",
  "",
  "In technical work, that strangeness must be constrained.",
  "But in creative and strategic work?",
  "It's the source of truly novel ideas.",
  "",
  "Thoughtform teaches teams to think WITH that intelligence—",
  "navigating its strangeness for creative breakthroughs.",
];

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
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const hasCompletedRef = useRef(false);

  // Calculate how much to reveal based on progress
  useEffect(() => {
    if (!isActive) {
      setDisplayedLines([]);
      hasCompletedRef.current = false;
      return;
    }

    const totalLines = MANIFESTO_LINES.length;
    const linesToShow = Math.floor(revealProgress * totalLines);
    setDisplayedLines(MANIFESTO_LINES.slice(0, linesToShow));

    // Check if complete
    if (linesToShow >= totalLines && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete?.();
    }
  }, [revealProgress, isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="manifesto-terminal">
      {/* Manifesto content - revealed line by line */}
      <div className="manifesto-content">
        {displayedLines.map((line, index) => (
          <div key={index} className="manifesto-line">
            {line || "\u00A0"} {/* Non-breaking space for empty lines */}
          </div>
        ))}
        {/* Blinking cursor at end */}
        {displayedLines.length > 0 && <span className="cursor-blink">█</span>}
      </div>

      <style jsx>{`
        .manifesto-terminal {
          /* Flows naturally below question text */
          width: 100%;
          text-align: left;
        }

        .manifesto-content {
          /* IBM Plex Sans for manifesto body */
          font-family: "IBM Plex Sans", "Inter", sans-serif;
          font-size: clamp(14px, 1.6vw, 18px);
          line-height: 1.6;
          font-weight: 400;
          color: var(--dawn, #ebe3d6);
          text-align: left;
        }

        .manifesto-line {
          min-height: 1.6em;
        }

        .cursor-blink {
          display: inline-block;
          margin-left: 4px;
          animation: blink 1s step-end infinite;
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
