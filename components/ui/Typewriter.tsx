"use client";

import React, { useState, useEffect, useCallback } from "react";

// Glitch characters for the effect
const GLITCH_CHARS = "!<>-_\\/[]{}—=+*^?#_░▒▓";

interface TypewriterProps {
  /** Text to type out (supports newlines) */
  text: string;
  /** Whether typing is active/should start (default: true) */
  active?: boolean;
  /** Delay before starting in ms (default: 0) */
  startDelay?: number;
  /** Typing speed in ms per character (default: 30) */
  speed?: number;
  /** Variation in typing speed for natural feel (default: 15) */
  speedVariation?: number;
  /** Enable glitch effect (default: true) */
  glitch?: boolean;
  /** Number of glitch iterations per character (default: 2) */
  glitchIterations?: number;
  /** Show blinking cursor (default: true) */
  showCursor?: boolean;
  /** Cursor character (default: "█") */
  cursor?: string;
  /** Callback when typing is complete */
  onComplete?: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Typewriter component - Terminal-style typing effect with optional glitch.
 */
export function Typewriter({
  text,
  active = true,
  startDelay = 0,
  speed = 30,
  speedVariation = 15,
  glitch = true,
  glitchIterations = 2,
  showCursor = true,
  cursor = "█",
  onComplete,
  className,
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [glitchChar, setGlitchChar] = useState<string | null>(null);
  const hasStartedRef = React.useRef(false);

  const getRandomSpeed = useCallback(() => {
    return speed + (Math.random() * speedVariation * 2 - speedVariation);
  }, [speed, speedVariation]);

  const getRandomGlitchChar = useCallback(() => {
    return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  }, []);

  useEffect(() => {
    // Don't start if not active or already started
    if (!active || hasStartedRef.current) return;

    let timeoutId: NodeJS.Timeout;
    let charIndex = 0;
    let glitchCount = 0;

    const startTyping = () => {
      hasStartedRef.current = true;
      setIsTyping(true);
      typeNextChar();
    };

    const typeNextChar = () => {
      if (charIndex < text.length) {
        const currentChar = text[charIndex];
        
        // Skip glitch for spaces and newlines
        if (glitch && currentChar !== ' ' && currentChar !== '\n' && glitchCount < glitchIterations) {
          // Show glitch character
          setGlitchChar(getRandomGlitchChar());
          setDisplayedText(text.slice(0, charIndex));
          glitchCount++;
          timeoutId = setTimeout(typeNextChar, speed / 3);
        } else {
          // Show real character
          setGlitchChar(null);
          setDisplayedText(text.slice(0, charIndex + 1));
          charIndex++;
          glitchCount = 0;
          timeoutId = setTimeout(typeNextChar, getRandomSpeed());
        }
      } else {
        setGlitchChar(null);
        setIsTyping(false);
        setIsComplete(true);
        onComplete?.();
      }
    };

    // Start after delay
    timeoutId = setTimeout(startTyping, startDelay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [active, text, startDelay, getRandomSpeed, getRandomGlitchChar, glitch, glitchIterations, speed, onComplete]);

  return (
    <span className={`typewriter ${className || ''}`} style={{ whiteSpace: 'pre-line' }}>
      {displayedText}
      {glitchChar && (
        <span className="typewriter-glitch">{glitchChar}</span>
      )}
      {showCursor && !isComplete && (
        <span className="typewriter-cursor">
          {cursor}
        </span>
      )}
      <style jsx>{`
        @keyframes cursor-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .typewriter-cursor {
          color: var(--gold, #caa554);
          margin-left: 1px;
          animation: cursor-blink 530ms step-end infinite;
          text-shadow: 0 0 8px var(--gold, #caa554);
        }
        .typewriter-glitch {
          color: var(--gold, #caa554);
          opacity: 0.7;
        }
      `}</style>
    </span>
  );
}
