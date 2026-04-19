"use client";

import { useState, useEffect, useRef, useMemo } from "react";

const CIPHER_CHARS = "█▓▒░◢◣◤◥▲▼◆◇○●□■∆∇≡≋⊡⊟θφψωΣΔΩ";

interface TerminalRevealProps {
  text: string;
  triggered: boolean;
  /** ms per character decode cycle (default 35) */
  speed?: number;
  /** Number of cipher frames per character before it settles (default 2) */
  iterations?: number;
  className?: string;
}

export function TerminalReveal({
  text,
  triggered,
  speed = 35,
  iterations = 2,
  className,
}: TerminalRevealProps) {
  const [displayText, setDisplayText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  const [complete, setComplete] = useState(false);
  const hasRunRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!triggered || hasRunRef.current) return;
    hasRunRef.current = true;

    if (prefersReducedMotion) {
      setDisplayText(text);
      setComplete(true);
      return;
    }

    setCursorVisible(true);
    let charIndex = 0;
    let iterCount = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (charIndex >= text.length) {
        setDisplayText(text);
        setCursorVisible(false);
        setComplete(true);
        return;
      }

      if (iterCount < iterations) {
        const settled = text.slice(0, charIndex);
        const cipher = CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
        setDisplayText(settled + cipher);
        iterCount++;
        timeoutId = setTimeout(tick, speed);
      } else {
        charIndex++;
        setDisplayText(text.slice(0, charIndex));
        iterCount = 0;
        timeoutId = setTimeout(tick, speed);
      }
    };

    timeoutId = setTimeout(tick, speed);
    return () => clearTimeout(timeoutId);
  }, [triggered, text, speed, iterations, prefersReducedMotion]);

  // Reset when trigger turns off or text changes
  useEffect(() => {
    if (!triggered) {
      hasRunRef.current = false;
      setDisplayText("");
      setComplete(false);
      setCursorVisible(false);
    }
  }, [triggered, text]);

  const content = useMemo(() => {
    if (!triggered && !complete) return text;
    return displayText;
  }, [triggered, complete, displayText, text]);

  return (
    <span className={className}>
      {content}
      {cursorVisible && <span className="terminal-reveal-cursor">▌</span>}
      <style jsx>{`
        @keyframes terminal-cursor-blink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
        .terminal-reveal-cursor {
          color: var(--gold, #caa554);
          margin-left: 1px;
          animation: terminal-cursor-blink 530ms step-end infinite;
          text-shadow: 0 0 6px var(--gold, #caa554);
        }
      `}</style>
    </span>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export { usePrefersReducedMotion };
