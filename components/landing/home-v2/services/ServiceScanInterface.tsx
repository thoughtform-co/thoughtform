"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

import { CornerBracket } from "@/components/ui/CornerBracket";
import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { SERVICES, type Service, type ServiceId } from "./serviceData";
import { SERVICE_SCAN_NOTES, type ServiceScanNote } from "./serviceScanNotes";

const PHASE_LABELS: Record<Service["phase"], string> = {
  navigate: "Navigate",
  "navigate-encode": "Navigate / Encode",
  all: "Navigate / Encode / Build",
};

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

type LabelSide = "left" | "right";

interface OrbitLabelLayout {
  left: number;
  top: number;
  width: number;
  side: LabelSide;
  targetX: number;
  targetY: number;
}

function getOrbitLabelLayout(
  serviceId: ServiceId,
  viewport: ViewportSize,
  expanded: boolean
): OrbitLabelLayout | null {
  if (viewport.width < 961) return null;

  const collapsedWidth = clampPx(190, viewport.width * 0.14, 236);
  const expandedWidth = clampPx(292, viewport.width * 0.22, 360);
  const width = expanded ? expandedWidth : collapsedWidth;
  let left = 0;
  let top = 0;
  let side: LabelSide = "right";

  switch (serviceId) {
    case "keynote": {
      left = clampPx(160, viewport.width * 0.2, 380);
      top = clampPx(112, viewport.height * 0.17, 184);
      side = "right";
      break;
    }
    case "workshop": {
      const rightInset = clampPx(260, viewport.width * 0.16, 360);
      left = viewport.width - rightInset - width;
      top = clampPx(176, viewport.height * 0.25, 300);
      side = "left";
      break;
    }
    case "embedded": {
      const maxTop = Math.max(500, viewport.height - (expanded ? 340 : 210));
      left = clampPx(150, viewport.width * 0.15, 300);
      top = clampPx(500, viewport.height * 0.66, maxTop);
      side = "right";
      break;
    }
  }

  const targetX = side === "right" ? left + width : left;
  const targetY = top + 31;
  return {
    left,
    top,
    width,
    side,
    targetX,
    targetY,
  };
}

function getLabelStyle(layout: OrbitLabelLayout | null): CSSProperties | undefined {
  if (!layout) return undefined;
  return {
    "--orbit-label-left": `${layout.left.toFixed(1)}px`,
    "--orbit-label-top": `${layout.top.toFixed(1)}px`,
    "--orbit-label-width": `${layout.width.toFixed(1)}px`,
  } as CSSProperties;
}

function ServiceConnectorOverlay({
  activeServiceId,
  expandedServiceId,
}: {
  activeServiceId: ServiceId;
  expandedServiceId: ServiceId | null;
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
        const target = getOrbitLabelLayout(anchor.serviceId, viewport, expanded);
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

function ServiceOrbitLabel({
  expanded,
  focused,
  layout,
  note,
  onToggle,
  service,
}: {
  expanded: boolean;
  focused: boolean;
  layout: OrbitLabelLayout | null;
  note: ServiceScanNote;
  onToggle: (serviceId: ServiceId) => void;
  service: Service;
}) {
  const detailId = `services-orbit-label-${service.id}-detail`;
  const confidence = `${Math.round(note.confidence * 100)}%`;
  const className = [
    "services-orbit-label",
    `services-orbit-label--${service.id}`,
    layout ? `services-orbit-label--target-${layout.side}` : "",
    focused ? "services-orbit-label--focused" : "",
    expanded ? "services-orbit-label--expanded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={className} data-service={service.id} style={getLabelStyle(layout)}>
      {expanded ? (
        <CornerBracket
          mode="diagonal-primary"
          armLength={12}
          thickness={1}
          color="rgba(202, 165, 84, 0.58)"
        />
      ) : null}

      <button
        className="services-orbit-label__button"
        type="button"
        aria-expanded={expanded}
        aria-controls={expanded ? detailId : undefined}
        onClick={() => onToggle(service.id)}
      >
        <span className="services-orbit-label__reticle" aria-hidden="true">
          <span />
        </span>
        <span className="services-orbit-label__readout">
          <span className="services-orbit-label__eyebrow">
            <span>
              {service.index} / {service.verb}
            </span>
            <span>{confidence}</span>
          </span>
          <span className="services-orbit-label__signal">{note.signals[0]}</span>
        </span>
      </button>

      {expanded ? (
        <div className="services-orbit-label__detail" id={detailId}>
          <div className="services-orbit-label__scan">
            <span>{note.coordinate}</span>
            <span>{note.label}</span>
          </div>

          <h3>{service.tagline}</h3>
          <p>{service.body}</p>

          <dl className="services-orbit-label__meta">
            {service.meta.map((row) => (
              <div className="services-orbit-label__meta-row" key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>

          <footer className="services-orbit-label__foot">
            <span>{PHASE_LABELS[service.phase]}</span>
            <a href={service.ctaHref}>
              {service.ctaLabel}
              <span aria-hidden="true"> -&gt;</span>
            </a>
          </footer>
        </div>
      ) : null}
    </article>
  );
}

export interface ServiceScanInterfaceProps {
  activeServiceId: ServiceId;
  onSelectService: (serviceId: ServiceId) => void;
  expandedServiceId?: ServiceId | null;
  onExpandedServiceChange?: (serviceId: ServiceId | null) => void;
  className?: string;
  showConnectors?: boolean;
}

export function ServiceScanInterface({
  activeServiceId,
  className,
  expandedServiceId: controlledExpandedServiceId,
  onExpandedServiceChange,
  onSelectService,
  showConnectors = true,
}: ServiceScanInterfaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [internalExpandedServiceId, setInternalExpandedServiceId] = useState<ServiceId | null>(
    null
  );
  const expandedServiceId =
    controlledExpandedServiceId === undefined
      ? internalExpandedServiceId
      : controlledExpandedServiceId;
  const setExpandedServiceId = onExpandedServiceChange ?? setInternalExpandedServiceId;
  const viewport = parseViewportSnapshot(
    useSyncExternalStore(viewportStore.subscribe, viewportStore.snapshot, viewportStore.snapshot)
  );
  const activeService = useMemo(
    () => SERVICES.find((service) => service.id === activeServiceId) ?? SERVICES[0],
    [activeServiceId]
  );

  useEffect(() => {
    if (!expandedServiceId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setExpandedServiceId(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedServiceId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedServiceId, setExpandedServiceId]);

  const toggleService = (serviceId: ServiceId) => {
    onSelectService(serviceId);
    setExpandedServiceId(expandedServiceId === serviceId ? null : serviceId);
  };

  return (
    <div
      ref={rootRef}
      className={`services-scan-interface${className ? ` ${className}` : ""}`}
      data-active-service={activeService.id}
      data-expanded-service={expandedServiceId ?? "none"}
    >
      {showConnectors && (
        <ServiceConnectorOverlay
          activeServiceId={activeService.id}
          expandedServiceId={expandedServiceId}
        />
      )}

      <div className="services-orbit-labels" aria-label="Service orbit labels">
        {SERVICE_SCAN_NOTES.map((note) => {
          const service = SERVICES.find((item) => item.id === note.serviceId) ?? SERVICES[0];
          const expanded = expandedServiceId === service.id;
          return (
            <ServiceOrbitLabel
              key={note.id}
              expanded={expanded}
              focused={service.id === activeService.id}
              layout={getOrbitLabelLayout(service.id, viewport, expanded)}
              note={note}
              onToggle={toggleService}
              service={service}
            />
          );
        })}
      </div>
    </div>
  );
}
