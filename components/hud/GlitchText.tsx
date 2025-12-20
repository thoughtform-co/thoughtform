"use client";

import { useEffect, useState, useMemo, useRef } from "react";

interface GlitchTextProps {
  initialText: string;
  finalText: string;
  progress: number; // 0 to 1
  className?: string;
}

// Characters for the glitch effect - tech/navigation themed
const GLITCH_CHARS = "█▓▒░◢◣◤◥▲▼◆◇○●□■∆∇≡≋⊡⊟⋮⋯θφψωΣΔΩ";
const CIPHER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function GlitchText({ initialText, finalText, progress, className = "" }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(initialText);
  const [glitchFrame, setGlitchFrame] = useState(0);
  const frameRef = useRef(0);
  
  // Phases - adjusted for smoother scroll-based transition:
  // 0.00 - 0.02: Show initial text (static)
  // 0.02 - 0.045: Glitch out initial text
  // 0.045 - 0.065: Transition/scramble  
  // 0.065 - 0.10: Type in final text
  // 0.10+: Show final text stable
  
  const phase = useMemo(() => {
    if (progress < 0.02) return "initial";
    if (progress < 0.045) return "glitch-out";
    if (progress < 0.065) return "scramble";
    if (progress < 0.10) return "type-in";
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
    
    if (phase === "glitch-out") {
      // Progressively corrupt the initial text with wave pattern
      const corruptionLevel = (progress - 0.02) / 0.025; // 0 to 1
      const corrupted = initialText.split("").map((char, i) => {
        if (char === " " || char === "\n") return char;
        // Wave-based corruption - spreads from center
        const centerDist = Math.abs(i - initialText.length / 2) / (initialText.length / 2);
        const threshold = corruptionLevel * (1 - centerDist * 0.5);
        
        if (Math.random() < threshold * 0.7) {
          // Mix of glitch chars and cipher chars
          const charSet = Math.random() > 0.3 ? GLITCH_CHARS : CIPHER_CHARS;
          return charSet[Math.floor(Math.random() * charSet.length)];
        }
        return char;
      }).join("");
      setDisplayText(corrupted);
      return;
    }
    
    if (phase === "scramble") {
      // Transition scramble - mix of both texts with heavy glitching
      const scrambleProgress = (progress - 0.045) / 0.02; // 0 to 1
      const blendLength = Math.floor(
        initialText.replace(/\n/g, "").length * (1 - scrambleProgress) + 
        finalText.length * scrambleProgress
      );
      
      const scrambled = Array.from({ length: blendLength }, (_, i) => {
        const rand = Math.random();
        if (rand < 0.2) return " ";
        if (rand < 0.6) return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        if (rand < 0.8) return CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
        // Start revealing final text characters
        if (scrambleProgress > 0.5 && i < finalText.length && Math.random() < scrambleProgress - 0.5) {
          return finalText[i];
        }
        return "░";
      }).join("");
      setDisplayText(scrambled);
      return;
    }
    
    if (phase === "type-in") {
      // Typewriter effect for final text with occasional glitch
      const typeProgress = (progress - 0.065) / 0.035; // 0 to 1
      const charsToShow = Math.floor(finalText.length * typeProgress);
      const revealed = finalText.substring(0, charsToShow);
      
      // Cursor character that blinks
      const cursorChar = glitchFrame % 6 < 3 ? "▌" : "│";
      const cursor = typeProgress < 1 ? cursorChar : "";
      
      // Occasional glitch on the last few revealed characters
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
      return;
    }
  }, [phase, progress, initialText, finalText, glitchFrame]);
  
  // Determine if we should show glitch effects
  const isGlitching = phase === "glitch-out" || phase === "scramble";
  
  // Render text with line breaks
  const renderTextWithBreaks = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => (
      <span key={i}>
        {line}
        {i < lines.length - 1 && <br />}
      </span>
    ));
  };
  
  return (
    <span 
      className={`glitch-text-wrapper ${phase} ${className}`}
      data-phase={phase}
    >
      <span className="glitch-text-main">{renderTextWithBreaks(displayText)}</span>
      {isGlitching && (
        <>
          <span className="glitch-text-ghost ghost-1" aria-hidden="true">{renderTextWithBreaks(displayText)}</span>
          <span className="glitch-text-ghost ghost-2" aria-hidden="true">{renderTextWithBreaks(displayText)}</span>
        </>
      )}
      <style jsx>{`
        .glitch-text-wrapper {
          position: relative;
          display: inline;
        }
        
        .glitch-text-main {
          position: relative;
          z-index: 1;
        }
        
        .glitch-text-ghost {
          position: absolute;
          top: 0;
          left: 0;
          opacity: 0;
          pointer-events: none;
        }
        
        /* Glitch out phase */
        .glitch-text-wrapper.glitch-out .glitch-text-main,
        .glitch-text-wrapper.scramble .glitch-text-main {
          animation: glitch-main 0.15s infinite;
        }
        
        .glitch-text-wrapper.glitch-out .ghost-1,
        .glitch-text-wrapper.scramble .ghost-1 {
          opacity: 0.8;
          color: var(--gold);
          animation: glitch-ghost-1 0.2s infinite;
        }
        
        .glitch-text-wrapper.glitch-out .ghost-2,
        .glitch-text-wrapper.scramble .ghost-2 {
          opacity: 0.6;
          color: var(--dawn-50);
          animation: glitch-ghost-2 0.25s infinite;
        }
        
        /* Type-in phase */
        .glitch-text-wrapper.type-in .glitch-text-main {
          animation: subtle-flicker 0.1s infinite;
        }
        
        /* Final state - stable */
        .glitch-text-wrapper.final .glitch-text-main {
          color: var(--gold);
          text-shadow: 0 0 20px rgba(202, 165, 84, 0.3);
        }
        
        @keyframes glitch-main {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(2px, -1px); }
          60% { transform: translate(-1px, -1px); }
          80% { transform: translate(1px, 2px); }
        }
        
        @keyframes glitch-ghost-1 {
          0%, 100% { 
            transform: translate(0);
            clip-path: inset(0 0 100% 0);
          }
          25% { 
            transform: translate(3px, -2px);
            clip-path: inset(20% 0 60% 0);
          }
          50% { 
            transform: translate(-3px, 2px);
            clip-path: inset(40% 0 40% 0);
          }
          75% { 
            transform: translate(2px, 1px);
            clip-path: inset(60% 0 20% 0);
          }
        }
        
        @keyframes glitch-ghost-2 {
          0%, 100% { 
            transform: translate(0);
            clip-path: inset(100% 0 0 0);
          }
          33% { 
            transform: translate(-4px, 1px);
            clip-path: inset(30% 0 50% 0);
          }
          66% { 
            transform: translate(4px, -1px);
            clip-path: inset(50% 0 30% 0);
          }
        }
        
        @keyframes subtle-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
      `}</style>
    </span>
  );
}
