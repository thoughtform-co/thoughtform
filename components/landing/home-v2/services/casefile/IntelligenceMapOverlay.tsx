"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type {
  CaseIntelligence,
  CaseRegistryGroup,
  CaseSkillEntry,
  CaseWorkConfiguration,
} from "@/lib/cases/types";

import {
  IntelligenceMapField,
  type AllocationTierName,
  type MapProjection,
} from "./IntelligenceMapField";

const FOCUSABLE = [
  "button:not([disabled]):not([tabindex='-1'])",
  "[href]:not([tabindex='-1'])",
  "input:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "summary:not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface IntelligenceMapOverlayProps {
  configurations: readonly CaseWorkConfiguration[];
  skills: readonly CaseSkillEntry[];
  groups: readonly CaseRegistryGroup[];
  intelligence: CaseIntelligence;
  projection: MapProjection;
  selectedId: string | null;
  focusedTier: AllocationTierName | null;
  onProjectionChange: (projection: MapProjection) => void;
  onSelectedIdChange: (id: string | null) => void;
  onFocusedTierChange: (tier: AllocationTierName | null) => void;
  onClose: () => void;
}

/** Body-portalled, click-loaded detail instrument for the compact map. */
export function IntelligenceMapOverlay({
  configurations,
  skills,
  groups,
  intelligence,
  projection,
  selectedId,
  focusedTier,
  onProjectionChange,
  onSelectedIdChange,
  onFocusedTierChange,
  onClose,
}: IntelligenceMapOverlayProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const selectedIdRef = useRef(selectedId);
  const focusedTierRef = useRef(focusedTier);
  const onSelectedIdChangeRef = useRef(onSelectedIdChange);
  const onFocusedTierChangeRef = useRef(onFocusedTierChange);

  const close = useCallback(() => onCloseRef.current(), []);

  useEffect(() => {
    onCloseRef.current = onClose;
    selectedIdRef.current = selectedId;
    focusedTierRef.current = focusedTier;
    onSelectedIdChangeRef.current = onSelectedIdChange;
    onFocusedTierChangeRef.current = onFocusedTierChange;
  }, [focusedTier, onClose, onFocusedTierChange, onSelectedIdChange, selectedId]);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (selectedIdRef.current) {
          const returnId = selectedIdRef.current;
          onSelectedIdChangeRef.current(null);
          requestAnimationFrame(() => {
            const candidates = Array.from(
              frameRef.current?.querySelectorAll<HTMLElement>("[data-config-id]") ?? []
            ).filter((candidate) => candidate.dataset.configId === returnId);
            const node =
              candidates.find((candidate) => candidate.getClientRects().length > 0) ??
              candidates[0];
            node?.focus();
          });
          return;
        }
        if (focusedTierRef.current) {
          onFocusedTierChangeRef.current(null);
          return;
        }
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        frameRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
      ).filter(
        (element) =>
          !element.hidden &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0
      );
      if (!focusable.length) {
        event.preventDefault();
        frameRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);

    const documentElement = document.documentElement;
    const scrollbarGap = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = documentElement.style.overflow;
    const previousPadding = documentElement.style.paddingRight;
    const previousBodyOverflow = document.body.style.overflow;
    documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) documentElement.style.paddingRight = `${scrollbarGap}px`;

    const blockOutsideFrame = (event: Event) => {
      const target = event.target as Node | null;
      if (target && frameRef.current?.contains(target)) return;
      event.preventDefault();
    };
    window.addEventListener("wheel", blockOutsideFrame, { passive: false });
    window.addEventListener("touchmove", blockOutsideFrame, { passive: false });

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      documentElement.style.overflow = previousOverflow;
      documentElement.style.paddingRight = previousPadding;
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("wheel", blockOutsideFrame);
      window.removeEventListener("touchmove", blockOutsideFrame);
    };
  }, [close]);

  return createPortal(
    <div
      className="fl-map-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        className="fl-map-overlay__frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fl-map-overlay-title"
        tabIndex={-1}
        ref={frameRef}
        data-lenis-prevent
      >
        <header className="fl-map-overlay__head">
          <p>
            <span>Proof / Loop Earplugs</span>
            <b id="fl-map-overlay-title">Intelligence Map</b>
          </p>
          <span className="fl-map-overlay__provenance">
            Normalized · anonymized · aggregate evidence
          </span>
          <button
            type="button"
            className="fl-map-overlay__close"
            onClick={close}
            ref={closeButtonRef}
          >
            Close map
          </button>
        </header>

        <IntelligenceMapField
          configurations={configurations}
          skills={skills}
          groups={groups}
          intelligence={intelligence}
          mode="expanded"
          projection={projection}
          selectedId={selectedId}
          focusedTier={focusedTier}
          onProjectionChange={onProjectionChange}
          onSelectedIdChange={onSelectedIdChange}
          onFocusedTierChange={onFocusedTierChange}
        />
      </div>
    </div>,
    document.body
  );
}
