"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export interface GlitchTextProps {
  initialText: string;
  finalText: string;
  progress: number; // 0 to 1
  className?: string;
}

// Characters for the glitch effect - tech/navigation themed
const GLITCH_CHARS = "█▓▒░◢◣◤◥▲▼◆◇○●□■∆∇≡≋⊡⊟⋮⋯θφψωΣΔΩ";
const CIPHER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

type GlitchPhase = "initial" | "glitch-out" | "scramble" | "type-in" | "final";

export function GlitchText({ initialText, finalText, progress, className }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(initialText);
  const [glitchFrame, setGlitchFrame] = useState(0);
  const frameRef = useRef(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const phase: GlitchPhase = useMemo(() => {
    if (progress < 0.15) return "initial";
    if (progress < 0.4) return "glitch-out";
    if (progress < 0.6) return "scramble";
    if (progress < 0.85) return "type-in";
    return "final";
  }, [progress]);

  // Animate glitch frames
  useEffect(() => {
    if (phase === "glitch-out" || phase === "scramble" || phase === "type-in") {
      const interval = setInterval(() => {
        frameRef.current += 1;
        setGlitchFrame(frameRef.current);
      }, 40);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Calculate displayed text based on phase
  useEffect(() => {
    if (phase === "initial") {
      setDisplayText(initialText);
      return;
    }

    if (phase === "final") {
      setDisplayText(finalText);
      return;
    }

    if (!isMounted) {
      setDisplayText(progress < 0.5 ? initialText : finalText);
      return;
    }

    if (phase === "glitch-out") {
      const corruptionLevel = (progress - 0.15) / 0.25;
      const corrupted = initialText
        .split("")
        .map((char, i) => {
          if (char === " " || char === "\n") return char;
          const centerDist = Math.abs(i - initialText.length / 2) / (initialText.length / 2);
          const threshold = corruptionLevel * (1 - centerDist * 0.5);

          if (Math.random() < threshold * 0.7) {
            const charSet = Math.random() > 0.3 ? GLITCH_CHARS : CIPHER_CHARS;
            return charSet[Math.floor(Math.random() * charSet.length)];
          }
          return char;
        })
        .join("");
      setDisplayText(corrupted);
      return;
    }

    if (phase === "scramble") {
      const scrambleProgress = (progress - 0.4) / 0.2;
      const finalChars = finalText.split("");
      const scrambled = finalChars.map((char) => {
        if (char === "\n") return "\n";
        const rand = Math.random();
        if (scrambleProgress > 0.5 && rand < scrambleProgress - 0.3) {
          return char;
        } else {
          if (rand < 0.2) return " ";
          if (rand < 0.6) return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          if (rand < 0.8) return CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
          return "░";
        }
      });
      setDisplayText(scrambled.join(""));
      return;
    }

    if (phase === "type-in") {
      const typeProgress = (progress - 0.6) / 0.25;
      const charsToShow = Math.floor(finalText.length * typeProgress);
      const revealed = finalText.substring(0, charsToShow);
      const cursorChar = glitchFrame % 6 < 3 ? "▌" : "│";
      const cursor = typeProgress < 1 ? cursorChar : "";

      let displayRevealed = revealed;
      if (charsToShow > 2 && Math.random() > 0.7) {
        const glitchPos = charsToShow - 1 - Math.floor(Math.random() * 2);
        if (glitchPos >= 0 && glitchPos < revealed.length) {
          const chars = revealed.split("");
          chars[glitchPos] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          displayRevealed = chars.join("");
        }
      }

      setDisplayText(displayRevealed + cursor);
    }
  }, [phase, progress, initialText, finalText, glitchFrame, isMounted]);

  const isGlitching = phase === "glitch-out" || phase === "scramble";

  const renderTextWithBreaks = (text: string) => {
    return text.split("\n").map((line, i, arr) => (
      <span key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <span
      className={cn("glitch-text-wrapper relative inline", phase, className)}
      data-phase={phase}
    >
      <span className="glitch-text-main relative z-[1]">{renderTextWithBreaks(displayText)}</span>
      {isGlitching && (
        <>
          <span
            className="glitch-text-ghost ghost-1 absolute top-0 left-0 opacity-80 text-gold pointer-events-none animate-glitch-1"
            aria-hidden="true"
          >
            {renderTextWithBreaks(displayText)}
          </span>
          <span
            className="glitch-text-ghost ghost-2 absolute top-0 left-0 opacity-60 text-dawn-50 pointer-events-none animate-glitch-2"
            aria-hidden="true"
          >
            {renderTextWithBreaks(displayText)}
          </span>
        </>
      )}
    </span>
  );
}
