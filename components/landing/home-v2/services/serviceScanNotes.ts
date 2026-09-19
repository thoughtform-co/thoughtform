import { SERVICES, type ServiceId } from "./serviceData";

export interface ServiceScanNote {
  id: string;
  serviceId: ServiceId;
  label: string;
  coordinate: string;
  confidence: number;
  signals: readonly string[];
  summary: string;
}

/* Keyed by the fixed spatial-slot ids (see servicePlateData). Slot → service
 * mapping as of 2026-09-19 (ADR-112): keynote→Keynote, workshop→Workshop,
 * embedded→Embedded (Advisory folded in), guided-build→Home session.
 * Coordinates left on their tuned arc positions (they belong to the SLOT);
 * label/signals/summary travel with the service — the same rule the
 * 2026-07-09 remap wrote down. */
export const SERVICE_SCAN_NOTES: readonly ServiceScanNote[] = [
  {
    id: "scan-keynote-frame",
    serviceId: "keynote",
    label: "Frame install",
    coordinate: "CV:03.18 / N-ARC",
    confidence: 0.88,
    signals: ["shared language", "room alignment", "live demos"],
    summary: "A public read of the arc: enough structure for a room to start moving together.",
  },
  {
    id: "scan-workshop-substrate",
    serviceId: "workshop",
    label: "Substrate capture",
    coordinate: "CV:06.42 / E-SCAN",
    confidence: 0.86,
    signals: ["real workflows", "first skills", "build list"],
    summary: "A working pass over live workflows, resolving the first useful patterns into skills.",
  },
  {
    id: "scan-embedded-partner",
    serviceId: "embedded",
    label: "Embedded partner",
    coordinate: "CV:09.77 / S-LOCK",
    confidence: 0.94,
    signals: ["three workstreams", "your own keys", "the team that runs it"],
    // ⚠ THE "TWO OR THREE AT A TIME" RULING LANDS HERE, not in the spec
    // (ADR-111). It is a CV-note fact about how the practice runs, and
    // `participants` would read it as group size.
    summary:
      "Three stage-gated workstreams run inside two or three companies at a time, on their own keys, leaving a layer and the people who run it.",
  },
  {
    id: "scan-home-session",
    serviceId: "guided-build",
    label: "Home session",
    coordinate: "CV:11.30 / B-LINK",
    confidence: 0.91,
    signals: ["six to eight seats", "one morning", "the skill by hand"],
    summary:
      "Six to eight people at a table in Antwerp for one morning: the argument in full, then the skill built by hand.",
  },
];

export function getScanNoteForService(serviceId: ServiceId): ServiceScanNote {
  const note = SERVICE_SCAN_NOTES.find((item) => item.serviceId === serviceId);
  if (!note) {
    throw new Error(`Missing scan note for service: ${serviceId}`);
  }
  return note;
}

export function scanNotesCoverServices(): boolean {
  const serviceIds = new Set<ServiceId>(SERVICES.map((service) => service.id));
  const noteIds = new Set<ServiceId>(SERVICE_SCAN_NOTES.map((note) => note.serviceId));
  return serviceIds.size === noteIds.size && [...serviceIds].every((id) => noteIds.has(id));
}
