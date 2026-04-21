"use client";
import { useState, useCallback } from "react";

const PHASE_COUNT = 3;
const SCRUBBER_POSITIONS = ["16%", "50%", "84%"];

export function usePracticePhases() {
  const [activePhase, setActivePhase] = useState(0);

  const onKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setActivePhase((index + 1) % PHASE_COUNT);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setActivePhase((index - 1 + PHASE_COUNT) % PHASE_COUNT);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActivePhase(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActivePhase(PHASE_COUNT - 1);
    }
  }, []);

  return {
    activePhase,
    setActivePhase,
    onKeyDown,
    scrubberPosition: SCRUBBER_POSITIONS[activePhase] || "50%",
    phaseCount: PHASE_COUNT,
  };
}
