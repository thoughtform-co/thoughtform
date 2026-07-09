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
 * mapping as of 2026-07-09: keynote→Advisory, workshop→Embedded AI Partner,
 * embedded→Keynote, guided-build→Workshop. Coordinates left on their tuned
 * arc positions; label/signals/summary re-authored per new service. */
export const SERVICE_SCAN_NOTES: readonly ServiceScanNote[] = [
  {
    id: "scan-advisory-read",
    serviceId: "keynote",
    label: "Standing read",
    coordinate: "CV:03.18 / N-ARC",
    confidence: 0.91,
    signals: ["where to invest", "what to ignore", "tested against real work"],
    summary: "A standing read for the people making the AI calls, kept honest against live work.",
  },
  {
    id: "scan-embedded-partner",
    serviceId: "workshop",
    label: "Embedded partner",
    coordinate: "CV:06.42 / E-SCAN",
    confidence: 0.94,
    signals: ["fixed term", "owned layer", "people who can run it"],
    summary:
      "Strategy and build run inside your teams on a fixed term, leaving an owned layer behind.",
  },
  {
    id: "scan-keynote-frame",
    serviceId: "embedded",
    label: "Frame install",
    coordinate: "CV:09.77 / S-LOCK",
    confidence: 0.88,
    signals: ["shared language", "room alignment", "live demos"],
    summary: "A public read of the arc: enough structure for a room to start moving together.",
  },
  {
    id: "scan-workshop-substrate",
    serviceId: "guided-build",
    label: "Substrate capture",
    coordinate: "CV:11.30 / B-LINK",
    confidence: 0.86,
    signals: ["real workflows", "first skills", "build list"],
    summary: "A working pass over live workflows, resolving the first useful patterns into skills.",
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
