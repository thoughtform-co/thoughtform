"use client";

import { useEffect, useRef } from "react";
import type { ParticlePosition } from "../ThoughtformSigil";

interface ConnectorLinesProps {
  scrollProgress: number;
  cardRefs: React.RefObject<HTMLDivElement>[];
  sigilParticlesRef: React.MutableRefObject<ParticlePosition[]>;
}

// Generate angular segmented path from start to end with growth animation
// growthProgress: 0 = line at start point, 1 = line fully extended to end
function generateAngularPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  growthProgress: number = 1
): string {
  if (growthProgress <= 0) {
    // No line yet - return empty path at start point
    return `M ${startX} ${startY} L ${startX} ${startY}`;
  }

  // Create a path that goes: horizontal first, then diagonal to target
  const midX = startX + (endX - startX) * 0.4;
  const midY = startY;

  if (growthProgress >= 1) {
    // Full line
    return `M ${startX} ${startY} L ${midX} ${midY} L ${endX} ${endY}`;
  }

  // Partial line - grow along the path
  // First half of growth: horizontal segment
  // Second half: diagonal segment
  if (growthProgress < 0.4) {
    // Growing horizontal segment
    const horizProgress = growthProgress / 0.4;
    const currentX = startX + (midX - startX) * horizProgress;
    return `M ${startX} ${startY} L ${currentX} ${midY}`;
  } else {
    // Horizontal complete, growing diagonal
    const diagProgress = (growthProgress - 0.4) / 0.6;
    const currentX = midX + (endX - midX) * diagProgress;
    const currentY = midY + (endY - midY) * diagProgress;
    return `M ${startX} ${startY} L ${midX} ${midY} L ${currentX} ${currentY}`;
  }
}

// Zone offsets for each line to prefer different areas of the sigil
const ZONE_OFFSETS = [
  { yBias: -40 }, // Line 1 prefers upper particles
  { yBias: 0 }, // Line 2 prefers center particles
  { yBias: 40 }, // Line 3 prefers lower particles
];

// Staggered start times for visual variety
const INIT_OFFSETS = [0, 0.33, 0.66];

// Check if a particle position is valid (not at origin or suspiciously centered)
function isValidParticlePosition(p: ParticlePosition): boolean {
  // Invalid if at origin
  if (p.screenX === 0 && p.screenY === 0) return false;
  // Invalid if very close to origin (likely uninitialized)
  if (p.screenX < 50 && p.screenY < 50) return false;
  return true;
}

export function ConnectorLines({
  scrollProgress,
  cardRefs,
  sigilParticlesRef,
}: ConnectorLinesProps) {
  const linePathRefs = [
    useRef<SVGPathElement>(null),
    useRef<SVGPathElement>(null),
    useRef<SVGPathElement>(null),
  ];
  const lineEndCircleRefs = [
    useRef<SVGCircleElement>(null),
    useRef<SVGCircleElement>(null),
    useRef<SVGCircleElement>(null),
  ];
  const lineAnimationRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cachedCardPositions: Array<{ x: number; y: number } | null> = [null, null, null];
    let lastPositionUpdate = 0;

    // Track current and next targets for each line (for smooth transitions)
    // Initialize targetPos to null - will be set from card position on first valid update
    const lineState = [
      {
        currentTarget: 0,
        nextTarget: 0,
        lastSwitch: 0,
        targetPos: null as { x: number; y: number } | null,
        growthProgress: 0, // 0 = not started, 1 = fully grown
      },
      {
        currentTarget: 0,
        nextTarget: 0,
        lastSwitch: 0,
        targetPos: null as { x: number; y: number } | null,
        growthProgress: 0,
      },
      {
        currentTarget: 0,
        nextTarget: 0,
        lastSwitch: 0,
        targetPos: null as { x: number; y: number } | null,
        growthProgress: 0,
      },
    ];

    const updateCardPositions = () => {
      cardRefs.forEach((cardRef, index) => {
        if (!cardRef.current) {
          cachedCardPositions[index] = null;
          return;
        }
        const cardRect = cardRef.current.getBoundingClientRect();
        // Position at the module-connect dot (left edge, vertically centered)
        cachedCardPositions[index] = {
          x: cardRect.left - 4,
          y: cardRect.top + cardRect.height / 2,
        };
      });
    };

    updateCardPositions();
    const startTime = performance.now();

    // Pick a random particle that's different from other lines' current targets
    // Each line is assigned a "zone" of the sigil to prefer (top, middle, bottom)
    const pickNewTarget = (
      lineIndex: number,
      particles: ParticlePosition[],
      otherTargets: number[]
    ): number => {
      // Filter to only valid particles
      const validParticles = particles
        .map((p, idx) => ({ p, idx }))
        .filter(({ p }) => isValidParticlePosition(p));

      if (validParticles.length === 0) return -1; // Return -1 to indicate no valid target

      const centerY = window.innerHeight / 2;
      const preferredY = centerY + ZONE_OFFSETS[lineIndex].yBias;

      // Sort particles by distance from this line's preferred zone
      const scoredParticles = validParticles.map(({ p, idx }) => {
        const yDist = Math.abs(p.screenY - preferredY);
        // Also check distance from other targets
        let minOtherDist = Infinity;
        for (const otherIdx of otherTargets) {
          if (otherIdx >= 0 && otherIdx < particles.length) {
            const other = particles[otherIdx];
            if (other && isValidParticlePosition(other)) {
              const dx = p.screenX - other.screenX;
              const dy = p.screenY - other.screenY;
              minOtherDist = Math.min(minOtherDist, Math.sqrt(dx * dx + dy * dy));
            }
          }
        }
        // Score: prefer particles in our zone AND far from other lines
        const score = yDist - minOtherDist * 0.5 + Math.random() * 30; // Add randomness
        return { idx, score, particle: p };
      });

      // Sort by score (lower is better) and pick from top candidates
      scoredParticles.sort((a, b) => a.score - b.score);
      const topCandidates = scoredParticles.slice(0, Math.min(15, scoredParticles.length));
      const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];

      return chosen.idx;
    };

    const updateLines = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000; // Total elapsed time in seconds

      // Update card positions periodically
      if (now - lastPositionUpdate > 200) {
        updateCardPositions();
        lastPositionUpdate = now;
      }

      // Get actual particle positions from sigil
      const particles = sigilParticlesRef.current;

      // Check if we have valid particles (sigil is fully formed)
      const validParticles = particles.filter(isValidParticlePosition);
      const hasValidParticles = validParticles.length > 10; // Need enough particles

      // Get all current targets to avoid overlap
      const allCurrentTargets = lineState.map((s) => s.currentTarget);

      // Update each line
      linePathRefs.forEach((pathRef, index) => {
        if (!pathRef.current) return;

        const cardPos = cachedCardPositions[index];
        if (!cardPos) return;

        const state = lineState[index];

        // If no valid particles yet, hide the line (growth = 0)
        if (!hasValidParticles) {
          state.growthProgress = 0;
          // Initialize target position from card position so lines start there
          if (!state.targetPos) {
            state.targetPos = { x: cardPos.x, y: cardPos.y };
          }
          // Clear the path
          pathRef.current.setAttribute("d", "");
          const circleRef = lineEndCircleRefs[index];
          if (circleRef.current) {
            circleRef.current.setAttribute("opacity", "0");
          }
          return;
        }

        // We have valid particles - grow the line
        // Growth takes about 0.25 seconds per line, staggered
        const growthDuration = 0.25;
        const growthDelay = index * 0.08; // Stagger each line
        const timeSinceParticlesValid = elapsed; // Will reset when component mounts

        // Only start growing after the sigil is visible (controlled by parent opacity)
        if (state.growthProgress < 1) {
          const growthElapsed = Math.max(0, timeSinceParticlesValid - growthDelay);
          state.growthProgress = Math.min(1, growthElapsed / growthDuration);
        }

        // Initialize target position from card if not set
        if (!state.targetPos) {
          state.targetPos = { x: cardPos.x, y: cardPos.y };
        }

        // Different switch intervals for each line (0.2 to 0.4 seconds - VERY FAST)
        const switchInterval = 0.2 + index * 0.08;
        const staggeredTime = elapsed + INIT_OFFSETS[index] * 2;
        const timeSinceSwitch = staggeredTime - state.lastSwitch;

        // Time to switch to a new target
        if (timeSinceSwitch > switchInterval && hasValidParticles) {
          state.currentTarget = state.nextTarget;
          // Pick new target that's different from other lines
          const othersTargets = allCurrentTargets.filter((_, i) => i !== index);
          const newTarget = pickNewTarget(index, particles, othersTargets);
          if (newTarget >= 0) {
            state.nextTarget = newTarget;
          }
          state.lastSwitch = staggeredTime;
          // Update allCurrentTargets for next line's calculation
          allCurrentTargets[index] = state.currentTarget;
        }

        // Calculate target position from particle
        let targetX = state.targetPos.x;
        let targetY = state.targetPos.y;

        if (state.currentTarget >= 0 && state.currentTarget < particles.length) {
          const particle = particles[state.currentTarget];
          if (particle && isValidParticlePosition(particle)) {
            targetX = particle.screenX;
            targetY = particle.screenY;
          }
        }

        // Very fast interpolation toward target for snappy analysis feel
        const lerpSpeed = 0.35; // Very snappy movement
        state.targetPos.x += (targetX - state.targetPos.x) * lerpSpeed;
        state.targetPos.y += (targetY - state.targetPos.y) * lerpSpeed;

        // Set path with growth animation
        pathRef.current.setAttribute(
          "d",
          generateAngularPath(
            cardPos.x,
            cardPos.y,
            state.targetPos.x,
            state.targetPos.y,
            state.growthProgress
          )
        );

        // Update end circle - only visible when growth is complete
        const circleRef = lineEndCircleRefs[index];
        if (circleRef.current) {
          const circleOpacity = state.growthProgress >= 0.95 ? 1 : 0;
          circleRef.current.setAttribute("opacity", circleOpacity.toString());
          circleRef.current.setAttribute("cx", state.targetPos.x.toString());
          circleRef.current.setAttribute("cy", state.targetPos.y.toString());
        }
      });

      lineAnimationRef.current = requestAnimationFrame(updateLines);
    };

    lineAnimationRef.current = requestAnimationFrame(updateLines);

    const handleResize = () => {
      updateCardPositions();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (lineAnimationRef.current) {
        cancelAnimationFrame(lineAnimationRef.current);
      }
    };
  }, [cardRefs, sigilParticlesRef]);

  const opacity =
    scrollProgress < 0.08
      ? 0
      : scrollProgress < 0.18
        ? 1
        : Math.max(0, 1 - (scrollProgress - 0.18) * 8);
  const isVisible = scrollProgress >= 0.08;

  return (
    <svg
      className="module-connection-lines"
      style={{
        opacity,
        visibility: isVisible ? "visible" : "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Line 1 */}
      <path
        ref={linePathRefs[0]}
        fill="none"
        stroke="rgba(202, 165, 84, 0.4)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="module-line module-line-1"
      />
      <circle
        ref={lineEndCircleRefs[0]}
        r="3"
        fill="none"
        stroke="rgba(202, 165, 84, 0.6)"
        strokeWidth="1"
        className="module-line-end"
      />

      {/* Line 2 */}
      <path
        ref={linePathRefs[1]}
        fill="none"
        stroke="rgba(202, 165, 84, 0.4)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="module-line module-line-2"
      />
      <circle
        ref={lineEndCircleRefs[1]}
        r="3"
        fill="none"
        stroke="rgba(202, 165, 84, 0.6)"
        strokeWidth="1"
        className="module-line-end"
      />

      {/* Line 3 */}
      <path
        ref={linePathRefs[2]}
        fill="none"
        stroke="rgba(202, 165, 84, 0.4)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="module-line module-line-3"
      />
      <circle
        ref={lineEndCircleRefs[2]}
        r="3"
        fill="none"
        stroke="rgba(202, 165, 84, 0.6)"
        strokeWidth="1"
        className="module-line-end"
      />
    </svg>
  );
}
