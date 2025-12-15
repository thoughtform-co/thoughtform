"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface ParallaxLayerProps {
  children: React.ReactNode;
  /** Speed multiplier. 0 = fixed, 1 = normal scroll, negative = reverse */
  speed?: number;
  /** Optional offset range [start, end] - defaults to [0, 1] */
  offset?: [number, number];
  /** Whether to use the element itself as scroll target */
  useElementAsTarget?: boolean;
  /** Additional className */
  className?: string;
}

export function ParallaxLayer({
  children,
  speed = 0.5,
  offset = [0, 1],
  useElementAsTarget = false,
  className,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: useElementAsTarget ? ref : undefined,
    offset: ["start end", "end start"],
  });

  // Transform scroll progress to Y movement
  // Speed of 1 = moves with scroll, 0 = fixed, negative = opposite direction
  const y = useTransform(
    scrollYProgress,
    offset,
    [0, speed * -200]
  );

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PARALLAX CONTAINER
// ═══════════════════════════════════════════════════════════════════

interface ParallaxContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ParallaxContainer({ children, className }: ParallaxContainerProps) {
  return (
    <div className={`relative overflow-hidden ${className || ""}`}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FADE IN ON SCROLL
// ═══════════════════════════════════════════════════════════════════

interface FadeInOnScrollProps {
  children: React.ReactNode;
  /** Delay in seconds */
  delay?: number;
  /** Duration in seconds */
  duration?: number;
  /** Direction to fade from */
  from?: "bottom" | "top" | "left" | "right" | "none";
  /** Distance to travel in pixels */
  distance?: number;
  className?: string;
}

export function FadeInOnScroll({
  children,
  delay = 0,
  duration = 0.6,
  from = "bottom",
  distance = 30,
  className,
}: FadeInOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.8"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Calculate initial position based on direction
  const getInitialPosition = () => {
    switch (from) {
      case "bottom":
        return { y: distance };
      case "top":
        return { y: -distance };
      case "left":
        return { x: -distance };
      case "right":
        return { x: distance };
      default:
        return {};
    }
  };

  const initialPosition = getInitialPosition();
  const hasX = "x" in initialPosition;
  const hasY = "y" in initialPosition;
  
  // Always call hooks unconditionally (React rules of hooks)
  const xTransform = useTransform(
    scrollYProgress, 
    [0, 1], 
    [hasX ? (initialPosition as { x: number }).x : 0, 0]
  );
  const yTransform = useTransform(
    scrollYProgress, 
    [0, 1], 
    [hasY ? (initialPosition as { y: number }).y : 0, 0]
  );

  return (
    <motion.div
      ref={ref}
      style={{ 
        opacity, 
        x: hasX ? xTransform : undefined, 
        y: hasY ? yTransform : undefined 
      }}
      className={className}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCALE ON SCROLL
// ═══════════════════════════════════════════════════════════════════

interface ScaleOnScrollProps {
  children: React.ReactNode;
  /** Scale range [from, to] */
  range?: [number, number];
  className?: string;
}

export function ScaleOnScroll({
  children,
  range = [0.8, 1],
  className,
}: ScaleOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [range[0], range[1], range[0]]);

  return (
    <motion.div ref={ref} style={{ scale }} className={className}>
      {children}
    </motion.div>
  );
}

