"use client";

import { useEffect } from "react";

import { caseSlot } from "@/lib/arc-cases/orbitMath";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/**
 * ArcCasesCta — the Build-park call-to-action chip that arms the cases
 * orbit (ADR-033). Docked directly under the persistent caption card in
 * the `CorridorStationHeaders` fixed layer — the exact position the
 * ADR-032 v1 chip occupied (the drawer it opened was the objection, not
 * the chip). Rest: "VIEW THE CASES"; armed: "CLOSE · NN / 04" with the
 * live front case.
 *
 * Visibility/opacity/inert are DRIVEN BY the headers' rAF (the single
 * caption writer) through the row ref — this component only owns the
 * label + click. The auto-disarm watcher lives here too: walking out of
 * the Build band (or the corridor releasing) disarms the store, and the
 * ring's envelope plays itself out — no scroll lock, no backdrop
 * (ADR-032 guardrails).
 */
export function ArcCasesCta({
  rowRefSetter,
}: {
  rowRefSetter: (el: HTMLDivElement | null) => void;
}) {
  const armed = useArcCasesStore((s) => s.armed);
  const caseIndex = useArcCasesStore((s) => s.caseIndex);
  const toggle = useArcCasesStore((s) => s.toggle);

  // Auto-disarm: subscribe to the depth store WITHOUT re-rendering (the
  // transform changes every scrolled frame) — the callback only pokes
  // the arc store when the orbit must close.
  useEffect(() => {
    return useDepthGatewayStore.subscribe((state) => {
      const arc = useArcCasesStore.getState();
      if (!arc.armed) return;
      const t = state.transform;
      if (t.beat !== "intelligence" || t.epilogueProgress > 0.02 || t.docked || !t.active) {
        arc.disarm();
      }
    });
  }, []);

  const slotLabel = String(caseSlot(caseIndex) + 1).padStart(2, "0");

  return (
    <div ref={rowRefSetter} className="home-v2-cases-cta-row" style={{ opacity: 0 }}>
      <button
        type="button"
        className="home-v2-copy-cta home-v2-cases-cta"
        data-armed={armed ? "true" : undefined}
        onClick={toggle}
        aria-expanded={armed}
      >
        {armed ? `CLOSE · ${slotLabel} / 04` : "VIEW THE CASES"}
        <span className="home-v2-copy-cta__chevrons" aria-hidden="true">
          <span className="home-v2-copy-cta__chev" />
          <span className="home-v2-copy-cta__chev" />
          <span className="home-v2-copy-cta__chev" />
        </span>
      </button>
    </div>
  );
}
