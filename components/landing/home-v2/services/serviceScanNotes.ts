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

export const SERVICE_SCAN_NOTES: readonly ServiceScanNote[] = [
  {
    id: "scan-keynote-frame",
    serviceId: "keynote",
    label: "Frame install",
    coordinate: "CV:03.18 / N-ARC",
    confidence: 0.91,
    signals: ["shared language", "room alignment", "first navigation"],
    summary: "A public read of the loop: enough structure for a room to start moving together.",
  },
  {
    id: "scan-workshop-substrate",
    serviceId: "workshop",
    label: "Substrate capture",
    coordinate: "CV:06.42 / E-SCAN",
    confidence: 0.94,
    signals: ["real briefs", "judgment points", "repeatable substrate"],
    summary: "A guided pass over live work, resolving useful judgment into reusable team material.",
  },
  {
    id: "scan-embedded-layer",
    serviceId: "embedded",
    label: "Layer continuity",
    coordinate: "CV:09.77 / S-LOCK",
    confidence: 0.88,
    signals: ["operating loop", "thin tools", "owned intelligence layer"],
    summary:
      "A longer embed where the encoded layer compounds until the team can extend it itself.",
  },
  {
    id: "scan-guided-build-transfer",
    serviceId: "guided-build",
    label: "Build capacity transfer",
    coordinate: "CV:11.30 / B-LINK",
    confidence: 0.86,
    signals: ["architecture reviews", "eval gates", "internal ownership"],
    summary:
      "A guided build where the client's engineers ship the surface and inherit the ability to extend it.",
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
