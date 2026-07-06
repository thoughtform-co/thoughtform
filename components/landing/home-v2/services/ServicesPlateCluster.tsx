"use client";

import { useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";

import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { ServicePlateCard, type PlateVariant } from "./ServicePlateCard";
import { SERVICE_PLATES, type ServicePlateId } from "./servicePlateData";

/**
 * ServicesPlateCluster — the three signal plates SPREAD around the parked
 * brandmark (collapse handoff §6 + the proven ServiceScanInterface behavior):
 *
 *   · Corner layout: Keynote top-left, Workshop bottom-left (bottom-anchored
 *     so it grows UPWARD on open), Embedded top-right (right-anchored so it
 *     grows LEFTWARD). Seed anchors are fixed — opening morphs a card in
 *     place, nothing reflows.
 *   · Accordion: exactly one card open at a time. In production the OPEN card
 *     is scroll-owned (`expandedServiceId` = the runway step); clicking a seed
 *     calls `onSelectService`, which scrolls the page to that service's
 *     segment. Uncontrolled (lab): clicks own the accordion locally.
 *   · Connectors: dotted leader lines from the live brandmark's scan anchors
 *     (published to `hologramConnectorStore` by the corridor armillary once
 *     parked) to each card's chip line — the previous CV-scan language,
 *     reusing the existing `.services-scan-connector*` styles.
 *
 * Below 961px / reduced motion the JS layout returns null and CSS restacks
 * the cluster as a single-column accordion (no connectors — the store never
 * publishes anchors there).
 */

interface ViewportSize {
  width: number;
  height: number;
}

const viewportStore = {
  subscribe(callback: () => void) {
    if (typeof window === "undefined") return () => {};
    window.addEventListener("resize", callback);
    return () => window.removeEventListener("resize", callback);
  },
  snapshot() {
    if (typeof window === "undefined") return "0x0";
    return `${window.innerWidth}x${window.innerHeight}`;
  },
};

function parseViewportSnapshot(snapshot: string): ViewportSize {
  const [width, height] = snapshot.split("x").map((value) => Number(value) || 0);
  return { width, height };
}

function clampPx(min: number, value: number, max: number): number {
  if (max <= min) return min;
  return Math.min(max, Math.max(min, value));
}

type PlateSide = "left" | "right";

interface PlateLayout {
  /** Pixel offset from the stage left, or null when right-anchored. */
  left: number | null;
  /** Pixel offset from the stage right, or null when left-anchored. */
  right: number | null;
  /** Pixel offset from the stage top, or null when bottom-anchored. */
  top: number | null;
  /** Pixel offset from the stage bottom, or null when top-anchored. */
  bottom: number | null;
  width: number;
  /** Which card edge the connector lands on. */
  side: PlateSide;
  targetX: number;
  targetY: number;
}

/** Chip-row centre offset from the card's anchored edge — a stable landing
 * point for the connector (body padding-top + chip 22 / 2; the seed and the
 * open C3 plate carry different paddings, per the Collapse States canvas). */
const anchorEdgeOffset = (open: boolean) => (open ? 33 : 23);

/**
 * Corner layout for the three plates around the parked brandmark. Mirrors the
 * retired ServiceScanInterface geometry (railInset / topBand) with the
 * collapse handoff's plate widths: seed 300 → open 420 (clamped down on
 * narrower desktops so the cluster clears the centered mark).
 */
function getPlateLayout(
  serviceId: ServicePlateId,
  viewport: ViewportSize,
  open: boolean
): PlateLayout | null {
  if (viewport.width < 961) return null;

  const collapsedWidth = clampPx(240, viewport.width * 0.209, 300);
  const openWidth = clampPx(340, viewport.width * 0.292, 420);
  const width = open ? openWidth : collapsedWidth;
  // Mirrors `--hud-content-inset` (margin + rail + pad) so the plates sit just
  // inside the HUD rails.
  const railInset = clampPx(88, viewport.width * 0.1, 192);
  const topBand = clampPx(112, viewport.height * 0.16, 190);

  switch (serviceId) {
    case "keynote": {
      const left = railInset;
      const top = topBand;
      return {
        left,
        right: null,
        top,
        bottom: null,
        width,
        side: "right",
        targetX: left + width,
        targetY: top + anchorEdgeOffset(open),
      };
    }
    case "workshop": {
      // Bottom-anchored: the open card grows upward and the connector's exit
      // point (near the bottom edge) stays fixed through the morph.
      const left = railInset;
      const bottom = clampPx(96, viewport.height * 0.15, 180);
      return {
        left,
        right: null,
        top: null,
        bottom,
        width,
        side: "right",
        targetX: left + width,
        targetY: viewport.height - bottom - anchorEdgeOffset(open),
      };
    }
    case "embedded": {
      // Right-anchored: width growth extends leftward; the right edge (and
      // the chip row beside it) holds still.
      const right = railInset;
      const top = topBand;
      return {
        left: null,
        right,
        top,
        bottom: null,
        width,
        side: "left",
        targetX: viewport.width - railInset - width,
        targetY: top + anchorEdgeOffset(open),
      };
    }
  }
}

function getPlateStyle(layout: PlateLayout | null): CSSProperties | undefined {
  if (!layout) return undefined;
  return {
    "--plate-left": layout.left !== null ? `${layout.left.toFixed(1)}px` : "auto",
    "--plate-right": layout.right !== null ? `${layout.right.toFixed(1)}px` : "auto",
    "--plate-top": layout.top !== null ? `${layout.top.toFixed(1)}px` : "auto",
    "--plate-bottom": layout.bottom !== null ? `${layout.bottom.toFixed(1)}px` : "auto",
    "--plate-width": `${layout.width.toFixed(1)}px`,
  } as CSSProperties;
}

function PlateConnectorOverlay({
  activeServiceId,
  expandedServiceId,
}: {
  activeServiceId: ServicePlateId;
  expandedServiceId: ServicePlateId | null;
}) {
  const anchors = useHologramConnectors((s) => s.anchors);
  const viewport = parseViewportSnapshot(
    useSyncExternalStore(viewportStore.subscribe, viewportStore.snapshot, viewportStore.snapshot)
  );

  if (anchors.length === 0 || viewport.width < 961) return null;

  return (
    <svg className="services-scan-connectors" aria-hidden="true">
      {anchors.map((anchor) => {
        const expanded = expandedServiceId === anchor.serviceId;
        const active = activeServiceId === anchor.serviceId;
        const target = getPlateLayout(anchor.serviceId, viewport, expanded);
        if (!target || !anchor.visible) return null;

        const x1 = anchor.x;
        const y1 = anchor.y;
        const x3 = target.targetX;
        const y3 = target.targetY;
        const bend = target.side === "right" ? 36 : -36;
        const x2 = x3 + bend;
        const points = `${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y3.toFixed(
          1
        )} ${x3.toFixed(1)},${y3.toFixed(1)}`;
        const className = [
          "services-scan-connector",
          active ? "services-scan-connector--active" : "",
          expanded ? "services-scan-connector--expanded" : "",
          `services-scan-connector--${anchor.serviceId}`,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <g key={anchor.serviceId} className={className}>
            <polyline className="services-scan-connector__glow" points={points} />
            <polyline className="services-scan-connector__line" points={points} />
            <circle className="services-scan-connector__reticle" cx={x1} cy={y1} r={5.5} />
            <circle className="services-scan-connector__dot" cx={x1} cy={y1} r={1.4} />
            <circle className="services-scan-connector__target" cx={x3} cy={y3} r={2.8} />
          </g>
        );
      })}
    </svg>
  );
}

export interface ServicesPlateClusterProps {
  /** The service the runway scroll is currently on (highlights its connector). */
  activeServiceId: ServicePlateId;
  /** Controlled open card (production: scroll owns it). Omit for the lab —
   * clicks then own a local accordion (always exactly one open). */
  expandedServiceId?: ServicePlateId;
  /** Seed click / Enter. Production scrolls the page to that segment. */
  onSelectService: (serviceId: ServicePlateId) => void;
  /** Hide the brandmark leader lines (lab scenes without a live mark). */
  showConnectors?: boolean;
  /** Plate render treatment (ADR-025 Update 8); defaults to glass. */
  plateVariant?: PlateVariant;
}

export function ServicesPlateCluster({
  activeServiceId,
  expandedServiceId: controlledExpandedServiceId,
  onSelectService,
  showConnectors = true,
  plateVariant = "glass",
}: ServicesPlateClusterProps) {
  const [internalExpandedServiceId, setInternalExpandedServiceId] = useState<ServicePlateId>(
    SERVICE_PLATES[0].id
  );
  const expandedServiceId = controlledExpandedServiceId ?? internalExpandedServiceId;
  const viewport = parseViewportSnapshot(
    useSyncExternalStore(viewportStore.subscribe, viewportStore.snapshot, viewportStore.snapshot)
  );
  const activeService = useMemo(
    () => SERVICE_PLATES.find((service) => service.id === activeServiceId) ?? SERVICE_PLATES[0],
    [activeServiceId]
  );

  const openService = (serviceId: ServicePlateId) => {
    onSelectService(serviceId);
    // Uncontrolled (lab) accordion; controlled mode leaves the open card to
    // the owner (scroll step → expandedServiceId).
    if (controlledExpandedServiceId === undefined) {
      setInternalExpandedServiceId(serviceId);
    }
  };

  return (
    <div
      className="services-plate-cluster"
      data-active-service={activeService.id}
      data-expanded-service={expandedServiceId}
    >
      {showConnectors && (
        <PlateConnectorOverlay
          activeServiceId={activeService.id}
          expandedServiceId={expandedServiceId}
        />
      )}

      {SERVICE_PLATES.map((service) => {
        const open = expandedServiceId === service.id;
        return (
          <ServicePlateCard
            key={service.id}
            service={service}
            state={open ? "open" : "collapsed"}
            onOpen={openService}
            style={getPlateStyle(getPlateLayout(service.id, viewport, open))}
            variant={plateVariant}
          />
        );
      })}
    </div>
  );
}
