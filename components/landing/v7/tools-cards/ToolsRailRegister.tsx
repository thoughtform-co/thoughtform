"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { createRoot, type Root } from "react-dom/client";

import { SERVICES } from "@/components/landing/home-v2/services";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { exitProgressForRunway, lerp, smootherstep } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";

import { PROJECT_CASES } from "./toolCardData";

/** The rail register is an enhanced desktop handoff; the base layout is
 * ordinary document flow at narrower/shorter viewports and under PRM. */
const ENHANCED_MEDIA =
  "(min-width: 1101px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)";

/** Stable right-rail slots shared by the retiring services and incoming
 * tool-unit index. They align to the canonical 12-position HUD gauge. */
const ROW_TOPS = ["33.333%", "41.667%", "50%", "58.333%"] as const;

/** Each verb starts flying just after its corresponding orbit card begins
 * decommissioning and is seated before the services runway releases. */
const SERVICE_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [0.1, 0.72],
  [0.2, 0.8],
  [0.3, 0.88],
  [0.4, 0.96],
];

const SRC_X_FRAC = 0.08;
const SRC_Y_FRAC = 0.055;
const SRC_SCALE = 1.5;

/** Reset the source bus as the first card reaches its CSS-owned sticky
 * dock. With the existing `--tools-bg-in` clock, 0.20 resolves when the
 * station top is ~0.01vh above the viewport top: the tool register is
 * therefore seated by the first-card dock without adding a scroll owner. */
const TOOL_MODE_START = 0.08;
const TOOL_MODE_END = 0.2;

type RegisterMode = "services" | "handover" | "tools";

interface LatchedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function clampIndex(value: number, count: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(count - 1, Math.trunc(value)));
}

/**
 * Right-rail state register for the services -> tools viewscreen handoff.
 *
 * Service verbs FLIP from their orbit-card screen rects into four stable
 * rail slots. As `--tools-bg-in` rises while `data-active-station="tools"`,
 * those same slots crossfade to the tool-unit index. All values are derived
 * from existing scroll-owned clocks, so reversing scroll reverses the mode
 * switch without a release flag or a second scroll owner.
 */
function ToolsRailRegister() {
  const enhanced = useMediaQuery(ENHANCED_MEDIA);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const serviceLabelRef = useRef<HTMLSpanElement | null>(null);
  const toolLabelRef = useRef<HTMLSpanElement | null>(null);
  const serviceRowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const toolRowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const latchedRef = useRef<Map<string, LatchedRect> | null>(null);

  const serviceLabels = useMemo(
    () => SERVICES.map((service) => ({ id: service.id, index: service.index, verb: service.verb })),
    []
  );

  useEffect(() => {
    if (!enhanced) return;

    const root = rootRef.current;
    const toolsStation = document.querySelector<HTMLElement>("#tools");
    if (!root || !toolsStation) return;

    let frame = 0;
    let disposed = false;

    const syncActiveTool = () => {
      const stack = toolsStation.querySelector<HTMLElement>(".pcl-stack[data-pc-active]");
      const active = clampIndex(
        Number(stack?.getAttribute("data-pc-active") ?? 0),
        PROJECT_CASES.length
      );

      root.style.setProperty("--tr-active-index", String(active));
      for (let i = 0; i < toolRowRefs.current.length; i++) {
        toolRowRefs.current[i]?.toggleAttribute("data-active", i === active);
      }
    };

    const write = () => {
      frame = 0;
      if (disposed) return;

      const html = document.documentElement;
      const activeStation = html.getAttribute("data-active-station");
      const toolsActive = activeStation === "tools";
      const ambientAlive = html.hasAttribute("data-services-ambient");
      const exitProgress = exitProgressForRunway(servicesRingProgressRef.current.progress);

      const rawBackgroundIn = Number.parseFloat(html.style.getPropertyValue("--tools-bg-in"));
      // The writer removes --tools-bg-in after the seam. In the Tools
      // station, absence therefore means the opaque end state, not zero.
      const backgroundIn = Number.isFinite(rawBackgroundIn)
        ? Math.max(0, Math.min(1, rawBackgroundIn))
        : toolsActive
          ? 1
          : 0;
      const toolMix = toolsActive ? smootherstep(TOOL_MODE_START, TOOL_MODE_END, backgroundIn) : 0;
      const serviceMix = 1 - toolMix;
      const serviceAlive = ambientAlive && exitProgress > 0;

      const mode: RegisterMode = !toolsActive
        ? "services"
        : toolMix >= 0.999
          ? "tools"
          : "handover";
      root.setAttribute("data-register-mode", mode);
      root.style.setProperty("--tr-service-mix", serviceMix.toFixed(4));
      root.style.setProperty("--tr-tool-mix", toolMix.toFixed(4));
      root.style.visibility = serviceAlive || toolsActive ? "visible" : "hidden";

      const sourceLabelOpacity = serviceAlive ? serviceMix : 0;
      if (serviceLabelRef.current) {
        serviceLabelRef.current.style.opacity = sourceLabelOpacity.toFixed(3);
        serviceLabelRef.current.style.visibility =
          sourceLabelOpacity > 0.003 ? "visible" : "hidden";
      }
      if (toolLabelRef.current) {
        toolLabelRef.current.style.opacity = toolMix.toFixed(3);
        toolLabelRef.current.style.visibility = toolMix > 0.003 ? "visible" : "hidden";
      }

      // Capture while every orbit-card rect is still available. Keep the
      // latch through the Tools station so reverse scroll retraces the same
      // vectors; reset only after returning before the exit beat.
      if (serviceAlive && !latchedRef.current) {
        const anchors = useHologramConnectors.getState().ringAnchors;
        const latched = new Map<string, LatchedRect>();
        for (const anchor of anchors) {
          if (anchor.visible && anchor.w > 8) {
            latched.set(anchor.serviceId, {
              x: anchor.x,
              y: anchor.y,
              w: anchor.w,
              h: anchor.h,
            });
          }
        }
        latchedRef.current = latched;
      } else if (exitProgress <= 0 && latchedRef.current) {
        latchedRef.current = null;
      }

      for (let i = 0; i < serviceLabels.length; i++) {
        const row = serviceRowRefs.current[i];
        if (!row) continue;

        const window = SERVICE_WINDOWS[Math.min(i, SERVICE_WINDOWS.length - 1)];
        const flight = smootherstep(window[0], window[1], exitProgress);
        const appear = smootherstep(0, 0.15, flight);
        const opacity = serviceAlive ? appear * serviceMix : 0;

        row.style.opacity = opacity.toFixed(3);
        row.style.visibility = opacity > 0.003 ? "visible" : "hidden";

        const source = latchedRef.current?.get(serviceLabels[i].id);
        const offsetParent = row.offsetParent as HTMLElement | null;
        if (source && offsetParent && flight < 1) {
          // offsetLeft/Top are transform-independent, unlike the row's
          // bounding rect while the inverse FLIP transform is applied.
          const parentRect = offsetParent.getBoundingClientRect();
          const dockCx = parentRect.left + row.offsetLeft + row.offsetWidth / 2;
          const dockCy = parentRect.top + row.offsetTop + row.offsetHeight / 2;
          const sourceCx = source.x + source.w * SRC_X_FRAC;
          const sourceCy = source.y + source.h * SRC_Y_FRAC;
          const inverse = 1 - flight;
          const dx = (sourceCx - dockCx) * inverse;
          const dy = (sourceCy - dockCy) * inverse;
          const scale = lerp(SRC_SCALE, 1, flight);
          row.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(3)})`;
        } else if (row.style.transform !== "") {
          row.style.transform = "";
        }
      }

      for (const row of toolRowRefs.current) {
        if (!row) continue;
        row.style.opacity = toolMix.toFixed(3);
        row.style.visibility = toolMix > 0.003 ? "visible" : "hidden";
      }

      syncActiveTool();
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

    // ToolsPortal mounts a separate React root asynchronously. Observe the
    // station shell so both its late insertion and active-index writes wake
    // this register without coupling the two roots.
    const toolsObserver = new MutationObserver(requestWrite);
    toolsObserver.observe(toolsStation, {
      attributes: true,
      attributeFilter: ["data-pc-active"],
      childList: true,
      subtree: true,
    });

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);
    document.addEventListener("visibilitychange", requestWrite);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      htmlObserver.disconnect();
      toolsObserver.disconnect();
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      document.removeEventListener("visibilitychange", requestWrite);
      latchedRef.current = null;
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
        ref={serviceLabelRef}
        className="tools-rail-register__heading tools-rail-register__heading--services"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        SOURCE BUS · 04
      </span>
      <span
        ref={toolLabelRef}
        className="tools-rail-register__heading tools-rail-register__heading--tools"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        TOOL UNITS · 04
      </span>

      {serviceLabels.map((service, i) => (
        <div
          key={service.id}
          ref={(element) => {
            serviceRowRefs.current[i] = element;
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

      {PROJECT_CASES.map((tool, i) => (
        <div
          key={tool.id}
          ref={(element) => {
            toolRowRefs.current[i] = element;
          }}
          className="tools-rail-register__row tools-rail-register__row--tool"
          data-tool-id={tool.id}
          style={
            {
              top: ROW_TOPS[i],
              opacity: 0,
              visibility: "hidden",
            } as CSSProperties
          }
        >
          <i className="tools-rail-register__marker" />
          <span className="tools-rail-register__index">{tool.index}</span>
          <span className="tools-rail-register__name">{tool.codename}</span>
        </div>
      ))}
    </div>
  );
}

interface ToolsRailRegisterPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/** Mount the rail register into the authored right-HUD-rail shell. The
 * nested root uses the same deferred teardown/reuse contract as ToolsPortal
 * and RailStationPortal, preserving Strict Mode and Fast Refresh stability. */
export function ToolsRailRegisterPortal({ containerRef }: ToolsRailRegisterPortalProps) {
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
    root.render(<ToolsRailRegister />);

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
