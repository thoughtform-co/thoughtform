"use client";

import { useMemo, useSyncExternalStore } from "react";

import { CornerBracket } from "@/components/ui/CornerBracket";
import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { SERVICES, type Service, type ServiceId } from "./serviceData";
import {
  getScanNoteForService,
  SERVICE_SCAN_NOTES,
  type ServiceScanNote,
} from "./serviceScanNotes";

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
  return Math.min(max, Math.max(min, value));
}

function getScanNoteTarget(serviceId: ServiceId, viewport: ViewportSize) {
  const index = SERVICE_SCAN_NOTES.findIndex((note) => note.serviceId === serviceId);
  if (index < 0 || viewport.width < 961) return null;

  const top = clampPx(86, viewport.height * 0.15, 144);
  const left = clampPx(24, viewport.width * 0.06, 56);
  const width = clampPx(236, viewport.width * 0.21, 310);
  const noteHeight = clampPx(126, viewport.height * 0.175, 158);

  return {
    x: left + width,
    y: top + index * (noteHeight + 10) + noteHeight * 0.5,
  };
}

function ServiceConnectorOverlay() {
  const anchors = useHologramConnectors((s) => s.anchors);
  const viewport = parseViewportSnapshot(
    useSyncExternalStore(viewportStore.subscribe, viewportStore.snapshot, viewportStore.snapshot)
  );

  if (anchors.length === 0 || viewport.width < 961) return null;

  return (
    <svg className="services-scan-connectors" aria-hidden="true">
      {anchors.map((anchor) => {
        const target = getScanNoteTarget(anchor.serviceId, viewport);
        if (!target || !anchor.visible) return null;

        const x1 = anchor.x;
        const y1 = anchor.y;
        const x3 = target.x;
        const y3 = target.y;
        const x2 = x3 + 34;
        const points = `${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y3.toFixed(
          1
        )} ${x3.toFixed(1)},${y3.toFixed(1)}`;

        return (
          <g key={anchor.serviceId} className="services-scan-connector">
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

function ScanNoteButton({
  active,
  note,
  onSelect,
}: {
  active: boolean;
  note: ServiceScanNote;
  onSelect: (serviceId: ServiceId) => void;
}) {
  return (
    <button
      className={`services-scan-note${active ? " services-scan-note--active" : ""}`}
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(note.serviceId)}
    >
      <span className="services-scan-note__top">
        <span>{note.label}</span>
        <span>{Math.round(note.confidence * 100)}%</span>
      </span>
      <span className="services-scan-note__coord">{note.coordinate}</span>
      <span className="services-scan-note__summary">{note.summary}</span>
      <span className="services-scan-note__signals">
        {note.signals.map((signal) => (
          <span key={signal}>{signal}</span>
        ))}
      </span>
    </button>
  );
}

function ServiceExpandedCard({ note, service }: { note: ServiceScanNote; service: Service }) {
  return (
    <article
      className={`services-expanded-card${service.lead ? " services-expanded-card--lead" : ""}`}
    >
      <CornerBracket mode="four" armLength={14} thickness={1.5} color="var(--gold)" />

      <header className="services-expanded-card__head">
        <span className="services-expanded-card__index">{service.index}</span>
        <span className="services-expanded-card__dot" aria-hidden="true" />
        <span className="services-expanded-card__kicker">{service.kicker}</span>
      </header>

      <h3 className="services-expanded-card__verb">{service.verb}</h3>
      <p className="services-expanded-card__tagline">{service.tagline}</p>
      <p className="services-expanded-card__body">{service.body}</p>

      <div className="services-expanded-card__scan">
        <span>{note.coordinate}</span>
        <span>{note.label}</span>
      </div>

      <dl className="services-expanded-card__meta">
        {service.meta.map((row) => (
          <div className="services-expanded-card__meta-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      <footer className="services-expanded-card__foot">
        <span>{PHASE_LABELS[service.phase]}</span>
        <a href={service.ctaHref}>
          {service.ctaLabel}
          <span aria-hidden="true"> -&gt;</span>
        </a>
      </footer>
    </article>
  );
}

export interface ServiceScanInterfaceProps {
  activeServiceId: ServiceId;
  onSelectService: (serviceId: ServiceId) => void;
  className?: string;
  showConnectors?: boolean;
}

export function ServiceScanInterface({
  activeServiceId,
  className,
  onSelectService,
  showConnectors = true,
}: ServiceScanInterfaceProps) {
  const activeService = useMemo(
    () => SERVICES.find((service) => service.id === activeServiceId) ?? SERVICES[0],
    [activeServiceId]
  );
  const activeNote = getScanNoteForService(activeService.id);

  return (
    <div
      className={`services-scan-interface${className ? ` ${className}` : ""}`}
      data-active-service={activeService.id}
    >
      {showConnectors && <ServiceConnectorOverlay />}

      <div className="services-scan-notes" aria-label="Service scan notes">
        {SERVICE_SCAN_NOTES.map((note) => (
          <ScanNoteButton
            key={note.id}
            active={note.serviceId === activeService.id}
            note={note}
            onSelect={onSelectService}
          />
        ))}
      </div>

      <div className="services-expanded-card-slot">
        <ServiceExpandedCard note={activeNote} service={activeService} />
      </div>
    </div>
  );
}
