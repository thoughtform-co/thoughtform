"use client";

import { useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { ServicePlateCard, type PlateVariant } from "./ServicePlateCard";
import { SERVICE_PLATES, type ServicePlateId } from "./servicePlateData";

/**
 * ServicesPlateCluster — the service plates DOCKED into two console racks
 * flanking the parked brandmark (ADR-025 Update 9, 2026-07-09):
 *
 *   · Rack layout: `svc-rack--left` (Keynote top, Workshop bottom) and
 *     `svc-rack--right` (Embedded top, Guided Build bottom). Each rack is a
 *     vertically-centered flex column with a fixed gap; opening a card grows
 *     it in-flow, so it can never overlap its neighbor (fixes the pre-existing
 *     "open keynote overlaps workshop seed on short viewports" bug from
 *     Update 8). The racks receive a shallow inward `rotateY` tilt from
 *     `services.css` — the whole rack tilts, not each card, so text stays
 *     crisp and `backdrop-filter` composites cleanly.
 *   · Accordion: exactly one card open at a time. In production the OPEN
 *     card is scroll-owned (`expandedServiceId` = the runway step); clicking
 *     a seed calls `onSelectService`, which scrolls the page to that
 *     service's runway segment. Uncontrolled (lab): clicks own the accordion
 *     locally.
 *   · Connectors: the leader-line grammar is now dual-tier. The active
 *     (expanded) card renders the full dotted-gold leader from its
 *     mark-facing chamfer notch to the reticle on the brandmark wireframe;
 *     the seed plates render a short 40-px stub from the mark anchor toward
 *     their notch — visible enough that the connection to the mark reads,
 *     quiet enough that the four wires don't fight the designation layer
 *     for attention. The heavier CV richness lives in
 *     `ServicesDesignationLayer` (small mono callouts pinned to named
 *     wireframe features).
 *
 * Below 961px / reduced motion the rack wrappers dissolve via
 * `display: contents`, `services.css` restacks the cluster as a
 * single-column accordion, and the connectors + designation layer never
 * mount (`hologramConnectorStore` publishes no anchors on that path).
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

type RackSide = "left" | "right";

/** Which rack each service docks into. The order INSIDE the rack (top →
 *  bottom) follows the arc: NAV-01, ENC-02, BLD-03, BLD-04 — Keynote and
 *  Embedded park top, Workshop and Guided Build park bottom of each rack. */
const PLATE_RACK: Record<ServicePlateId, RackSide> = {
  keynote: "left",
  workshop: "left",
  embedded: "right",
  "guided-build": "right",
};

/** Chip-row centre offset from the card's mark-facing chamfer notch —
 *  seed and open C3 plate carry different paddings (per the Collapse States
 *  canvas), so the connector's card end matches whichever state is live. */
const NOTCH_CH_SEED = 16;
const NOTCH_CH_OPEN = 26;

/** How far a seed's short leader stub travels from the mark reticle toward
 *  the card's chamfer notch (in pixels), before it fades to nothing. Kept
 *  small so seeds read as "listening, not shouting". */
const STUB_LENGTH_PX = 42;

/** Uniform seed / open plate widths across both racks. Below 961px the
 *  layout function returns `undefined` and CSS restacks to 100%. */
function getPlateWidth(open: boolean, viewport: ViewportSize): number {
  const collapsedWidth = clampPx(240, viewport.width * 0.2, 300);
  const openWidth = clampPx(340, viewport.width * 0.29, 400);
  return open ? openWidth : collapsedWidth;
}

function getPlateStyle(open: boolean, viewport: ViewportSize): CSSProperties | undefined {
  if (viewport.width < 961) return undefined;
  return {
    "--plate-width": `${getPlateWidth(open, viewport).toFixed(1)}px`,
  } as CSSProperties;
}

interface PlateConnectorOverlayProps {
  activeServiceId: ServicePlateId;
  expandedServiceId: ServicePlateId | null;
  clusterRef: React.RefObject<HTMLDivElement | null>;
}

function PlateConnectorOverlay({
  activeServiceId,
  expandedServiceId,
  clusterRef,
}: PlateConnectorOverlayProps) {
  const anchors = useHologramConnectors((s) => s.anchors);
  const viewport = parseViewportSnapshot(
    useSyncExternalStore(viewportStore.subscribe, viewportStore.snapshot, viewportStore.snapshot)
  );

  const cluster = clusterRef.current;
  if (anchors.length === 0 || viewport.width < 961 || !cluster) return null;

  // Rebase everything into the SVG's LOCAL box. The connector SVG is inset:0
  // within `.services-plate-cluster`, which sits INSIDE the HUD content rails
  // (offset ~189px right on a full-width desktop). The mark anchors
  // (published in viewport pixels by the corridor armillary) and the card
  // getBoundingClientRect()s are both viewport-space, so without this
  // subtraction every point renders shifted by the rail inset: reticles float
  // off the mark and the leaders never reach the cards (the SVG worked
  // un-shifted only in the full-bleed /test lab).
  const originRect = cluster.getBoundingClientRect();
  const ox = originRect.left;
  const oy = originRect.top;

  return (
    <svg className="services-scan-connectors" aria-hidden="true">
      {anchors.map((anchor) => {
        if (!anchor.visible) return null;
        // Depart from the card's mark-facing chamfer notch (measured live
        // so the point is right regardless of open height, rack position,
        // or the rack's inward tilt — getBoundingClientRect returns
        // post-transform screen coords).
        const cardEl = cluster.querySelector<HTMLElement>(
          `.svc-plate[data-service="${anchor.serviceId}"]`
        );
        if (!cardEl) return null;
        const rect = cardEl.getBoundingClientRect();
        const expanded = expandedServiceId === anchor.serviceId;
        const active = activeServiceId === anchor.serviceId;
        const ch = expanded ? NOTCH_CH_OPEN : NOTCH_CH_SEED;

        // Mark end (the reticle sits here — the only circle). Rebased to
        // local. Left-half cards plug in at their top-right chamfer;
        // right-half cards at their bottom-left chamfer (both are real
        // notches — corner-consistent, always the corner pointing at the
        // instrument, so the wire never crosses its own card).
        const mx = anchor.x - ox;
        const my = anchor.y - oy;
        const cardInLeftHalf = (rect.left + rect.right) / 2 < viewport.width / 2;
        const nx = (cardInLeftHalf ? rect.right - ch / 2 : rect.left + ch / 2) - ox;
        const ny = (cardInLeftHalf ? rect.top + ch / 2 : rect.bottom - ch / 2) - oy;

        // Dual-tier: expanded card gets the full leader + reticle;
        // seeds get a short stub from the mark reticle toward their notch
        // (fades out at ~STUB_LENGTH_PX along the vector), so the four
        // wires don't compete with the designation layer for attention.
        let endX = nx;
        let endY = ny;
        if (!expanded) {
          const dx = nx - mx;
          const dy = ny - my;
          const dist = Math.hypot(dx, dy) || 1;
          const t = Math.min(STUB_LENGTH_PX / dist, 1);
          endX = mx + dx * t;
          endY = my + dy * t;
        }
        const points = `${mx.toFixed(1)},${my.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`;

        const className = [
          "services-scan-connector",
          active ? "services-scan-connector--active" : "",
          expanded ? "services-scan-connector--expanded" : "services-scan-connector--stub",
          `services-scan-connector--${anchor.serviceId}`,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <g key={anchor.serviceId} className={className}>
            <polyline className="services-scan-connector__glow" points={points} />
            <polyline className="services-scan-connector__line" points={points} />
            {/* Circle only where the wire meets the brandmark — not on the card. */}
            <circle className="services-scan-connector__reticle" cx={mx} cy={my} r={5.5} />
            <circle className="services-scan-connector__dot" cx={mx} cy={my} r={1.4} />
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
  const clusterRef = useRef<HTMLDivElement>(null);
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

  // Partition the ordered service list into rack columns. Iteration order
  // is preserved so mobile (racks dissolve via `display: contents`) still
  // reads 01 → 02 → 03 → 04 top-to-bottom.
  const leftPlates = SERVICE_PLATES.filter((service) => PLATE_RACK[service.id] === "left");
  const rightPlates = SERVICE_PLATES.filter((service) => PLATE_RACK[service.id] === "right");

  const renderPlate = (service: (typeof SERVICE_PLATES)[number]) => {
    const open = expandedServiceId === service.id;
    return (
      <ServicePlateCard
        key={service.id}
        service={service}
        state={open ? "open" : "collapsed"}
        onOpen={openService}
        style={getPlateStyle(open, viewport)}
        variant={plateVariant}
      />
    );
  };

  return (
    <div
      ref={clusterRef}
      className="services-plate-cluster"
      data-active-service={activeService.id}
      data-expanded-service={expandedServiceId}
    >
      {showConnectors && (
        <PlateConnectorOverlay
          activeServiceId={activeService.id}
          expandedServiceId={expandedServiceId}
          clusterRef={clusterRef}
        />
      )}

      <div className="svc-rack svc-rack--left" data-rack="left">
        <span className="svc-rack__spine" aria-hidden="true" />
        {leftPlates.map(renderPlate)}
      </div>
      <div className="svc-rack svc-rack--right" data-rack="right">
        <span className="svc-rack__spine" aria-hidden="true" />
        {rightPlates.map(renderPlate)}
      </div>
    </div>
  );
}
