"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { createRoot, type Root } from "react-dom/client";

import { SERVICES } from "./serviceData";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { activeServiceForProgress, smootherstep } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

/** The rail register is an enhanced desktop layer; the base layout is
 * ordinary document flow at narrower/shorter viewports and under PRM. */
const ENHANCED_MEDIA =
  "(min-width: 1101px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)";

/** Right-rail slots for the services verb index. The register hangs off
 * mid-rail (50%) at the shared `--rail-register-pitch` step so both
 * pillar registers (Arc / Services) read at one tight, centred rhythm —
 * the same band the left rolodex centres on (ADR-031, terminal pass
 * 2026-07-13). Four rows straddle the centre line (±0.5 / ±1.5 pitch). */
const ROW_TOPS = [
  "calc(50% - 1.5 * var(--rail-register-pitch, 30px))",
  "calc(50% - 0.5 * var(--rail-register-pitch, 30px))",
  "calc(50% + 0.5 * var(--rail-register-pitch, 30px))",
  "calc(50% + 1.5 * var(--rail-register-pitch, 30px))",
] as const;

/** Per-row stagger over the services arrival clock (`--svc-content-in`):
 * row i wipes in across [i·STAGGER_STEP, i·STAGGER_STEP + STAGGER_SPAN],
 * so the register resolves top-to-bottom with the services copy. */
const STAGGER_STEP = 0.16;
const STAGGER_SPAN = 0.45;

/**
 * Right-rail state register for the services section — "SOURCE BUS · 04".
 *
 * The services HALF of the retired `ToolsRailRegister` (ADR-033: the
 * `#tools` station is gone, and with it the services→tools label
 * handover, the tool-unit rows, and the `data-pc-active` observer). The
 * service verbs sit in their four stable rail slots for the WHOLE
 * services section: each row wipes in (right-guide inward) on a
 * staggered window over the `--svc-content-in` arrival clock, and the
 * row whose service is open carries the underline signature. Reversing
 * scroll reverses the reveal — the wipe is scroll-owned.
 */
function ServicesRailRegister() {
  const enhanced = useMediaQuery(ENHANCED_MEDIA);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const serviceLabels = useMemo(
    () => SERVICES.map((service) => ({ id: service.id, index: service.index, verb: service.verb })),
    []
  );

  useEffect(() => {
    if (!enhanced) return;

    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    let disposed = false;
    // `.services-stage` lives in the ServicesPortal's own nested root and
    // mounts asynchronously — resolve it lazily and re-resolve if replaced.
    let stage: HTMLElement | null = null;

    const write = () => {
      frame = 0;
      if (disposed) return;

      const html = document.documentElement;
      const activeStation = html.getAttribute("data-active-station");
      const ambientAlive = html.hasAttribute("data-services-ambient");

      // Arrival clock: the same `--svc-content-in` envelope the services
      // copy rides (useServicesStageScroll), so the register resolves WITH
      // the section — never during the corridor dissipate. Ambient presence
      // fails open to 1 so a missing stage var can't blank a live section.
      if (!stage || !stage.isConnected) {
        stage = document.querySelector<HTMLElement>(".services-stage");
      }
      const rawContentIn = stage
        ? Number.parseFloat(stage.style.getPropertyValue("--svc-content-in"))
        : Number.NaN;
      const contentIn = Number.isFinite(rawContentIn) ? Math.max(0, Math.min(1, rawContentIn)) : 0;
      const arriveClock = Math.max(contentIn, ambientAlive ? 1 : 0);

      // Alive for the WHOLE services section (station active or the ambient
      // hold), from the moment the arrival clock opens.
      const serviceAlive = (activeStation === "services" || ambientAlive) && arriveClock > 0.001;

      root.style.visibility = serviceAlive ? "visible" : "hidden";

      const labelOpacity = serviceAlive ? smootherstep(0, 0.25, arriveClock) : 0;
      if (labelRef.current) {
        labelRef.current.style.opacity = labelOpacity.toFixed(3);
        labelRef.current.style.visibility = labelOpacity > 0.003 ? "visible" : "hidden";
      }

      // Which service is open right now — array-index-based, matching the
      // ring staircase (`setActiveByStep`), NOT id/verb-based: the verb
      // remap (keynote→ADVISORY etc.) makes id lookups a trap. The ringMath
      // clamp keeps the last row active through the exit beat.
      const activeService = activeServiceForProgress(servicesRingProgressRef.current.progress);

      for (let i = 0; i < serviceLabels.length; i++) {
        const row = rowRefs.current[i];
        if (!row) continue;

        // Staggered right-guide-inward wipe over the arrival clock —
        // scroll-scrubbed and reversible (no CSS transition to fight the
        // per-frame writes).
        const appear = smootherstep(i * STAGGER_STEP, i * STAGGER_STEP + STAGGER_SPAN, arriveClock);
        const opacity = serviceAlive ? appear : 0;

        row.style.opacity = opacity.toFixed(3);
        row.style.visibility = opacity > 0.003 ? "visible" : "hidden";
        const wipe = (1 - appear) * 100;
        row.style.clipPath = wipe > 0.05 ? `inset(0 0 0 ${wipe.toFixed(1)}%)` : "";
        row.toggleAttribute("data-active", serviceAlive && i === activeService);
      }
    };

    const requestWrite = () => {
      if (document.hidden) {
        write();
        return;
      }
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    const htmlObserver = new MutationObserver(requestWrite);
    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-active-station", "data-services-ambient", "style"],
    });

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);
    document.addEventListener("visibilitychange", requestWrite);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      htmlObserver.disconnect();
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      document.removeEventListener("visibilitychange", requestWrite);
    };
  }, [enhanced, serviceLabels]);

  if (!enhanced) return null;

  return (
    <div
      ref={rootRef}
      className="tools-rail-register"
      data-register-mode="services"
      aria-hidden="true"
      style={{ visibility: "hidden" }}
    >
      <span
        ref={labelRef}
        className="tools-rail-register__heading tools-rail-register__heading--services"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        SOURCE BUS · 04
      </span>

      {serviceLabels.map((service, i) => (
        <div
          key={service.id}
          ref={(element) => {
            rowRefs.current[i] = element;
          }}
          className="tools-rail-register__row tools-rail-register__row--service"
          data-service-id={service.id}
          style={
            {
              top: ROW_TOPS[i],
              opacity: 0,
              visibility: "hidden",
            } as CSSProperties
          }
        >
          <i className="tools-rail-register__marker" />
          <span className="tools-rail-register__index">{service.index}</span>
          <span className="tools-rail-register__name">{service.verb}</span>
        </div>
      ))}
    </div>
  );
}

interface ServicesRailRegisterPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/** Mount the rail register into the authored right-HUD-rail shell. The
 * slot keeps its legacy `data-tools-rail-root` name (renaming it would
 * require a prototype-HTML edit — ADR-033 keeps the restructure inside
 * the parse arrays). Same deferred teardown/reuse contract as the other
 * nested-root portals (Strict Mode / Fast Refresh stability). */
export function ServicesRailRegisterPortal({ containerRef }: ServicesRailRegisterPortalProps) {
  const rootRef = useRef<Root | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    const slot = container.querySelector<HTMLElement>("[data-tools-rail-root]");
    if (!slot) return;

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(<ServicesRailRegister />);

    return () => {
      const renderedRoot = rootRef.current;
      timerRef.current = window.setTimeout(() => {
        if (rootRef.current === renderedRoot) {
          renderedRoot?.unmount();
          rootRef.current = null;
        }
        timerRef.current = null;
      }, 0);
    };
  }, [containerRef]);

  return null;
}
