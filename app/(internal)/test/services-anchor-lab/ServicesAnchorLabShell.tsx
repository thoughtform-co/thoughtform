"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { activeServiceForProgress } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

import { AnchorHorizonLayer } from "./AnchorHorizonLayer";
import { ServicesFrame } from "./ServicesFrame";
import { ANCHOR_VARIANTS } from "./variants";

// three/fiber is client-only; keep it out of the server render entirely so
// the frame + masthead still paint if WebGL is unavailable.
const RingBackdrop = dynamic(() => import("./RingBackdrop"), { ssr: false });

/** Beat-1 midpoint — service 01 front and settled (the orbit lab's default). */
const DEFAULT_PROGRESS = 0.3;
/** Park math: centre of service i's beat across the 5-beat runway. */
const parkFor = (i: number) => (i + 1.5) / 5;

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

/**
 * ServicesAnchorLabShell — owns lab state, the `<html>` attribute bus, the
 * ring progress bridge, and the lab console.
 *
 * Deep-link state (`?v=` route, `?p=` progress, `?reg=1` register) is read in
 * a MOUNT EFFECT and written through `history.replaceState` — never
 * `useSearchParams`, which forces a CSR bailout of the whole route (the
 * project-cards / section-menu lab convention).
 */
export function ServicesAnchorLabShell({ hudHtml, bodyClass }: ShellProps) {
  const [variantIdx, setVariantIdx] = useState(0);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [seatLine, setSeatLine] = useState<"l1" | "l2">("l2");
  const [nudgePx, setNudgePx] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
  const replayRef = useRef<(() => void) | null>(null);

  // Adopt deep-linked state AFTER mount (SSR renders the defaults; reading
  // location in the initialiser would mismatch hydration).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v");
    if (v) {
      const byId = ANCHOR_VARIANTS.findIndex((a) => a.id === v);
      if (byId >= 0) setVariantIdx(byId);
      else {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0 && n < ANCHOR_VARIANTS.length) setVariantIdx(n);
      }
    }
    const p = Number.parseFloat(q.get("p") ?? "");
    if (Number.isFinite(p)) setProgress(Math.min(1, Math.max(0, p)));
    if (q.get("reg") === "1") setShowRegister(true);
  }, []);

  const commit = useCallback(
    (next: { variantIdx?: number; progress?: number; reg?: boolean }) => {
      const v = next.variantIdx ?? variantIdx;
      const p = next.progress ?? progress;
      const reg = next.reg ?? showRegister;
      if (next.variantIdx !== undefined) setVariantIdx(next.variantIdx);
      if (next.progress !== undefined) setProgress(next.progress);
      if (next.reg !== undefined) setShowRegister(next.reg);
      const url = new URL(window.location.href);
      url.searchParams.set("v", ANCHOR_VARIANTS[v].id);
      url.searchParams.set("p", p.toFixed(3));
      if (reg) url.searchParams.set("reg", "1");
      else url.searchParams.delete("reg");
      window.history.replaceState(null, "", url.toString());
    },
    [variantIdx, progress, showRegister]
  );

  /**
   * The `<html>` bus. `CorridorSectionMenu` has no props — both reels resolve
   * their visibility and their active row from document-level state, so the
   * lab must stand in for the corridor scroll rig and declare that we are
   * parked at #services.
   *
   * `data-corridor-engaged` is deliberately NOT set: it would route
   * `resolveActiveIdx` down the corridor/thesis branch and light the wrong
   * station.
   */
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-active-station", "services");
    return () => {
      html.removeAttribute("data-active-station");
    };
  }, []);

  /**
   * Ring progress bridge — the same module-level ref `useServicesStageScroll`
   * writes in production. `ServicesCardRing` reads it per WebGL frame, but
   * the MENU and the REGISTER only re-read it on scroll/attribute events, so
   * a synthetic scroll event is what makes the active verb follow the slider
   * on a page that never scrolls.
   */
  useEffect(() => {
    servicesRingProgressRef.current.progress = progress;
    window.dispatchEvent(new Event("scroll"));
    return () => {
      servicesRingProgressRef.current.progress = 0;
    };
  }, [progress]);

  const onReplayReady = useCallback((fn: () => void) => {
    replayRef.current = fn;
  }, []);

  // Side-card hit → park that service (production scrolls the runway there;
  // the lab drives the same ring math through the progress bridge).
  const onSelectService = useCallback(
    (serviceId: string) => {
      const i = SERVICES.findIndex((s) => s.id === serviceId);
      if (i >= 0) commit({ progress: parkFor(i) });
    },
    [commit]
  );

  const variant = ANCHOR_VARIANTS[variantIdx];
  const activeIndex = activeServiceForProgress(progress);

  return (
    <main
      className={`sal home-v2-root ${bodyClass}`}
      data-theme="dark"
      data-anchor-variant={variant.id}
      data-seat={seatLine}
      style={{ "--sal-nudge": `${nudgePx}px` } as React.CSSProperties}
    >
      <RingBackdrop progress={progress} />

      <ServicesFrame
        hudHtml={hudHtml}
        showRegister={showRegister}
        onReplayReady={onReplayReady}
        onSelectService={onSelectService}
      />

      <AnchorHorizonLayer variant={variant.id} />

      {/* ── Lab console ─────────────────────────────────────────────── */}
      <div className="sal-console" aria-label="Services anchor lab controls">
        <div className="sal-chips" role="tablist" aria-label="Anchor routes">
          {ANCHOR_VARIANTS.map((a, i) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              className="sal-chip"
              data-on={i === variantIdx || undefined}
              aria-selected={i === variantIdx}
              onClick={() => commit({ variantIdx: i })}
            >
              {a.label}
            </button>
          ))}
        </div>

        <p className="sal-thesis">{variant.thesis}</p>
        <p className="sal-prov">
          <span className="sal-prov__diamond" aria-hidden="true" />
          {variant.provenance}
        </p>

        <div className="sal-field">
          <span className="sal-field__label">
            RING · SVC {String(activeIndex + 1).padStart(2, "0")}/04 · {SERVICES[activeIndex].verb}
          </span>
          <input
            type="range"
            className="sal-range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            aria-label="Ring progress"
            onChange={(e) => commit({ progress: Number.parseFloat(e.target.value) })}
          />
          <div className="sal-row">
            {SERVICES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className="sal-chip sal-chip--sm"
                data-on={(activeIndex === i && progress > 0.2) || undefined}
                onClick={() => commit({ progress: parkFor(i) })}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
            <button
              type="button"
              className="sal-chip sal-chip--sm"
              data-on={progress <= 0.2 || undefined}
              onClick={() => commit({ progress: 0.1 })}
            >
              LEAD
            </button>
          </div>
        </div>

        <div className="sal-field">
          <span className="sal-field__label">
            SEAT · NUDGE {nudgePx > 0 ? `+${nudgePx}` : nudgePx}px
          </span>
          <div className="sal-row">
            <button
              type="button"
              className="sal-chip sal-chip--sm"
              data-on={seatLine === "l1" || undefined}
              onClick={() => setSeatLine("l1")}
            >
              LINE 1
            </button>
            <button
              type="button"
              className="sal-chip sal-chip--sm"
              data-on={seatLine === "l2" || undefined}
              onClick={() => setSeatLine("l2")}
            >
              LINE 2
            </button>
          </div>
          <input
            type="range"
            className="sal-range"
            min={-12}
            max={12}
            step={1}
            value={nudgePx}
            aria-label="Baseline nudge"
            onChange={(e) => setNudgePx(Number.parseInt(e.target.value, 10))}
          />
        </div>

        <div className="sal-toggles">
          <button
            type="button"
            className="sal-toggle"
            data-on={showRegister || undefined}
            aria-pressed={showRegister}
            onClick={() => commit({ reg: !showRegister })}
          >
            <i className="sal-toggle__led" aria-hidden="true" />
            SOURCE BUS
          </button>
          <button type="button" className="sal-toggle" onClick={() => replayRef.current?.()}>
            <i className="sal-toggle__led" aria-hidden="true" />
            REPLAY
          </button>
        </div>
      </div>

      <p className="sal-gate-warn">
        Widen to ≥1101×760 — the journey menus are gated to the desktop tier.
      </p>
    </main>
  );
}
