"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PersistentFieldMorphOptions {
  /** Changes only after `captureLayout` has measured the current geometry. */
  layoutKey: string;
  /** Maximum CSS transition time, including the caller-authored stagger. */
  durationMs?: number;
  settleSlackMs?: number;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/**
 * Click-driven, intra-container FLIP for one flat persistent-node field.
 *
 * Callers keep layout and rendering declarative. Immediately before changing
 * the layout key they call `captureLayout`; this module measures the current
 * transformed positions, inverts the next layout before paint, and releases
 * the nodes on the following frame. At rest it leaves no transform behind.
 *
 * Every persistent child must carry `data-persistent-id`. The same explicit
 * ID is therefore the React identity, the measurement identity and the
 * relationship identity across every projection.
 */
export function usePersistentFieldMorph<T extends HTMLElement>({
  layoutKey,
  durationMs = 570,
  settleSlackMs = 60,
}: PersistentFieldMorphOptions) {
  const fieldRef = useRef<T>(null);
  const previousRectsRef = useRef<Map<string, Rect>>(new Map());
  const settleTimerRef = useRef<number | null>(null);

  const captureLayout = useCallback(() => {
    if (prefersReducedMotion()) {
      previousRectsRef.current.clear();
      return;
    }

    const field = fieldRef.current;
    if (!field) return;

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    const fieldRect = field.getBoundingClientRect();
    if (fieldRect.width <= 0 || fieldRect.height <= 0 || field.getClientRects().length === 0) {
      previousRectsRef.current.clear();
      delete field.dataset.morph;
      field.querySelectorAll<HTMLElement>("[data-persistent-id]").forEach((node) => {
        node.style.transform = "";
      });
      return;
    }

    const previous = new Map<string, Rect>();
    field.querySelectorAll<HTMLElement>("[data-persistent-id]").forEach((node) => {
      const id = node.dataset.persistentId;
      if (!id) return;
      const rect = node.getBoundingClientRect();
      previous.set(id, {
        left: rect.left - fieldRect.left,
        top: rect.top - fieldRect.top,
        width: rect.width,
        height: rect.height,
      });
    });
    previousRectsRef.current = previous;
  }, []);

  useLayoutEffect(() => {
    const field = fieldRef.current;
    const previous = previousRectsRef.current;
    if (!field || previous.size === 0) return;

    const fieldRect = field.getBoundingClientRect();
    const nodes = Array.from(field.querySelectorAll<HTMLElement>("[data-persistent-id]"));
    if (fieldRect.width <= 0 || fieldRect.height <= 0 || field.getClientRects().length === 0) {
      previousRectsRef.current.clear();
      delete field.dataset.morph;
      for (const node of nodes) node.style.transform = "";
      return;
    }

    for (const node of nodes) {
      const id = node.dataset.persistentId;
      const before = id ? previous.get(id) : undefined;
      if (!before) continue;

      const rect = node.getBoundingClientRect();
      const left = rect.left - fieldRect.left;
      const top = rect.top - fieldRect.top;
      const dx = before.left - left;
      const dy = before.top - top;
      const sx = rect.width > 0 ? before.width / rect.width : 1;
      const sy = rect.height > 0 ? before.height / rect.height : 1;
      node.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    }

    field.dataset.morph = "1";
    previousRectsRef.current = new Map();

    let releaseFrame = 0;
    const invertFrame = window.requestAnimationFrame(() => {
      releaseFrame = window.requestAnimationFrame(() => {
        for (const node of nodes) node.style.transform = "";
      });
    });

    settleTimerRef.current = window.setTimeout(() => {
      delete field.dataset.morph;
      for (const node of nodes) node.style.transform = "";
      settleTimerRef.current = null;
    }, durationMs + settleSlackMs);

    return () => {
      window.cancelAnimationFrame(invertFrame);
      window.cancelAnimationFrame(releaseFrame);
    };
  }, [durationMs, layoutKey, settleSlackMs]);

  useEffect(
    () => () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
      const field = fieldRef.current;
      if (!field) return;
      delete field.dataset.morph;
      field.querySelectorAll<HTMLElement>("[data-persistent-id]").forEach((node) => {
        node.style.transform = "";
      });
    },
    []
  );

  const isMorphing = useCallback(() => fieldRef.current?.dataset.morph === "1", []);

  return { fieldRef, captureLayout, isMorphing };
}
