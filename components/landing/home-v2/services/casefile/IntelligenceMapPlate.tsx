"use client";

import { lazy, Suspense, useCallback, useRef, useState } from "react";

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
import { restoreFocusAfterUnmount, useCloseOnCasefileFold } from "./MediaLightbox";

const LazyIntelligenceMapOverlay = lazy(() =>
  import("./IntelligenceMapOverlay").then((module) => ({
    default: module.IntelligenceMapOverlay,
  }))
);

interface IntelligenceMapPlateProps {
  configurations: readonly CaseWorkConfiguration[];
  skills: readonly CaseSkillEntry[];
  groups: readonly CaseRegistryGroup[];
  intelligence: CaseIntelligence;
}

/** Compact casefile instrument plus the click-gated expanded-map seam. */
export function IntelligenceMapPlate({
  configurations,
  skills,
  groups,
  intelligence,
}: IntelligenceMapPlateProps) {
  const [projection, setProjection] = useState<MapProjection>("configuration");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedTier, setFocusedTier] = useState<AllocationTierName | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const expandTriggerRef = useRef<HTMLButtonElement | null>(null);

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false);
    restoreFocusAfterUnmount(expandTriggerRef.current);
  }, []);

  useCloseOnCasefileFold(rootRef, overlayOpen, closeOverlay);

  return (
    <div className="fl-intel-map-shell" ref={rootRef}>
      <IntelligenceMapField
        configurations={configurations}
        skills={skills}
        groups={groups}
        intelligence={intelligence}
        mode="preview"
        projection={projection}
        selectedId={selectedId}
        focusedTier={focusedTier}
        onProjectionChange={setProjection}
        onSelectedIdChange={setSelectedId}
        onFocusedTierChange={setFocusedTier}
        onExpand={(trigger) => {
          // Mobile Safari does not focus a tapped button by default, so
          // `document.activeElement` can still be <body>. Keep the actual
          // control that opened the portal and return to it after teardown.
          expandTriggerRef.current = trigger;
          setOverlayOpen(true);
        }}
      />

      {overlayOpen ? (
        <Suspense
          fallback={
            <span className="fl-intel-map__loading" role="status">
              Preparing expanded map…
            </span>
          }
        >
          <LazyIntelligenceMapOverlay
            configurations={configurations}
            skills={skills}
            groups={groups}
            intelligence={intelligence}
            projection={projection}
            selectedId={selectedId}
            focusedTier={focusedTier}
            onProjectionChange={setProjection}
            onSelectedIdChange={setSelectedId}
            onFocusedTierChange={setFocusedTier}
            onClose={closeOverlay}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
