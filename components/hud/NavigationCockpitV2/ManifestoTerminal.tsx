"use client";

import { useEffect, useState, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// ASCII ART TITLE - "AI ISN'T SOFTWARE."
// Monospace font, grid-snapped aesthetic matching Thoughtform brand
// ═══════════════════════════════════════════════════════════════════

const ASCII_TITLE = `
 █████╗ ██╗    ██╗███████╗███╗   ██╗████████╗
██╔══██╗██║    ██║██╔════╝████╗  ██║╚══██╔══╝
███████║██║    ██║███████╗██╔██╗ ██║   ██║   
██╔══██║██║    ██║╚════██║██║╚██╗██║   ██║   
██║  ██║██║    ██║███████║██║ ╚████║   ██║   
╚═╝  ╚═╝╚═╝    ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   
                                             
███████╗ ██████╗ ███████╗████████╗██╗    ██╗ █████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔════╝╚══██╔══╝██║    ██║██╔══██╗██╔══██╗██╔════╝
███████╗██║   ██║█████╗     ██║   ██║ █╗ ██║███████║██████╔╝█████╗  
╚════██║██║   ██║██╔══╝     ██║   ██║███╗██║██╔══██║██╔══██╗██╔══╝  
███████║╚██████╔╝██║        ██║   ╚███╔███╔╝██║  ██║██║  ██║███████║
╚══════╝ ╚═════╝ ╚═╝        ╚═╝    ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
`.trim();

// Simpler, more compact ASCII art that fits better
const ASCII_TITLE_COMPACT = `
    _    ___   ___ ____  _   _ _ _____   ____   ___  _____ _______        ___    ____  _____ 
   / \\  |_ _| |_ _/ ___|| \\ | ( )_   _| / ___| / _ \\|  ___|_   _\\ \\      / / \\  |  _ \\| ____|
  / _ \\  | |   | |\\___ \\|  \\| |/  | |   \\___ \\| | | | |_    | |  \\ \\ /\\ / / _ \\ | |_) |  _|  
 / ___ \\ | |   | | ___) | |\\  |   | |    ___) | |_| |  _|   | |   \\ V  V / ___ \\|  _ <| |___ 
/_/   \\_\\___|  |___|____/|_| \\_|   |_|   |____/ \\___/|_|     |_|    \\_/\\_/_/   \\_\\_| \\_\\_____|
`.trim();

// Even more minimal - block letters
const ASCII_TITLE_MINIMAL = `
╔═╗╦  ╦╔═╗╔╗╔╔╦╗  ╔═╗╔═╗╔═╗╔╦╗╦ ╦╔═╗╦═╗╔═╗
╠═╣║  ║╚═╗║║║ ║   ╚═╗║ ║╠╣  ║ ║║║╠═╣╠╦╝║╣ 
╩ ╩╩  ╩╚═╝╝╚╝ ╩   ╚═╝╚═╝╚   ╩ ╚╩╝╩ ╩╩╚═╚═╝
`.trim();

// Block-style that matches the CRT aesthetic
const ASCII_TITLE_BLOCKS = `
█▀▀█ ▀█▀   ▀█▀ █▀▀ █▀▀▄ ▀ ▀▀█▀▀   █▀▀ █▀▀█ █▀▀ ▀▀█▀▀ █   █ █▀▀█ █▀▀█ █▀▀
█▄▄█  █     █  ▀▀█ █  █   █   ▀▀█ █  █ █▀▀  █   █ █ █ █▄▄█ █▄▄▀ █▀▀
█  █ ▄█▄   ▄█▄ ▀▀▀ ▀  ▀   ▀   ▀▀▀ ▀▀▀▀ ▀     ▀    ▀ ▀ █  █ ▀ ▀▀ ▀▀▀
`.trim();

// Manifesto content - each line/paragraph as separate items for progressive reveal
const MANIFESTO_LINES = [
  "", // Spacer after title
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
  "",
  "█", // Cursor block at end
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
  const [titleRevealed, setTitleRevealed] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);

  // Calculate how much to reveal based on progress
  useEffect(() => {
    if (!isActive) {
      setDisplayedLines([]);
      setTitleRevealed(0);
      hasCompletedRef.current = false;
      return;
    }

    // First 20% of progress: reveal ASCII title character by character
    // Remaining 80%: reveal manifesto lines
    const titleChars = ASCII_TITLE_MINIMAL.length;
    const totalLines = MANIFESTO_LINES.length;

    if (revealProgress < 0.2) {
      // Revealing title
      const titleProgress = revealProgress / 0.2;
      const charsToShow = Math.floor(titleProgress * titleChars);
      setTitleRevealed(charsToShow);
      setDisplayedLines([]);
    } else {
      // Title complete, reveal lines
      setTitleRevealed(titleChars);
      const lineProgress = (revealProgress - 0.2) / 0.8;
      const linesToShow = Math.floor(lineProgress * totalLines);
      setDisplayedLines(MANIFESTO_LINES.slice(0, linesToShow));

      // Check if complete
      if (linesToShow >= totalLines && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete?.();
      }
    }
  }, [revealProgress, isActive, onComplete]);

  // Auto-scroll terminal as content is revealed
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayedLines, titleRevealed]);

  if (!isActive) return null;

  // Get revealed portion of ASCII title
  const revealedTitle = ASCII_TITLE_MINIMAL.slice(0, titleRevealed);

  return (
    <div className="manifesto-terminal" ref={terminalRef}>
      {/* Terminal prompt header */}
      <div className="terminal-prompt">
        <span className="prompt-user">thoughtform</span>
        <span className="prompt-at">@</span>
        <span className="prompt-host">manifesto</span>
        <span className="prompt-separator">:</span>
        <span className="prompt-path">~</span>
        <span className="prompt-dollar">$</span>
        <span className="prompt-command"> cat manifesto.txt</span>
      </div>

      {/* ASCII Art Title - revealed character by character */}
      <pre className="ascii-title">{revealedTitle}</pre>

      {/* Manifesto content - revealed line by line */}
      <div className="manifesto-content">
        {displayedLines.map((line, index) => (
          <div key={index} className={`manifesto-line ${line === "█" ? "cursor-blink" : ""}`}>
            {line || "\u00A0"} {/* Non-breaking space for empty lines */}
          </div>
        ))}
      </div>

      <style jsx>{`
        .manifesto-terminal {
          font-family: "IBM Plex Mono", "Fira Code", monospace;
          font-size: 14px;
          line-height: 1.5;
          color: var(--gold, #caa554);
          max-height: 100%;
          overflow-y: auto;
          padding: 16px;
          scrollbar-width: thin;
          scrollbar-color: var(--gold) transparent;
        }

        .manifesto-terminal::-webkit-scrollbar {
          width: 4px;
        }

        .manifesto-terminal::-webkit-scrollbar-track {
          background: transparent;
        }

        .manifesto-terminal::-webkit-scrollbar-thumb {
          background: var(--gold, #caa554);
          border-radius: 2px;
        }

        .terminal-prompt {
          margin-bottom: 16px;
          opacity: 0.8;
        }

        .prompt-user {
          color: var(--gold, #caa554);
        }

        .prompt-at {
          color: var(--dawn, #ebe3d6);
          opacity: 0.5;
        }

        .prompt-host {
          color: var(--dawn, #ebe3d6);
        }

        .prompt-separator,
        .prompt-path,
        .prompt-dollar {
          color: var(--dawn, #ebe3d6);
          opacity: 0.7;
        }

        .prompt-command {
          color: var(--dawn, #ebe3d6);
        }

        .ascii-title {
          font-size: 10px;
          line-height: 1.1;
          color: var(--gold, #caa554);
          margin: 0 0 24px 0;
          white-space: pre;
          overflow: hidden;
        }

        .manifesto-content {
          color: var(--dawn, #ebe3d6);
          font-size: 15px;
          line-height: 1.7;
        }

        .manifesto-line {
          min-height: 1.7em;
        }

        .cursor-blink {
          animation: blink 1s step-end infinite;
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
