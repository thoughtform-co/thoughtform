import { describe, expect, it } from "vitest";

import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import {
  SERVICE_SCAN_NOTES,
  getScanNoteForService,
  scanNotesCoverServices,
} from "@/components/landing/home-v2/services/serviceScanNotes";

describe("service scan notes", () => {
  it("maps exactly one curated scan note to every service", () => {
    expect(scanNotesCoverServices()).toBe(true);
    expect(SERVICE_SCAN_NOTES).toHaveLength(SERVICES.length);

    const noteIds = SERVICE_SCAN_NOTES.map((note) => note.serviceId);
    expect(new Set(noteIds).size).toBe(SERVICES.length);
    expect(noteIds.sort()).toEqual(SERVICES.map((service) => service.id).sort());
  });

  it("exposes non-empty CV note content for every service", () => {
    for (const service of SERVICES) {
      const note = getScanNoteForService(service.id);
      expect(note.label.length).toBeGreaterThan(3);
      expect(note.coordinate).toMatch(/^CV:/);
      expect(note.confidence).toBeGreaterThan(0);
      expect(note.signals.length).toBeGreaterThanOrEqual(2);
      expect(note.summary.length).toBeGreaterThan(20);
    }
  });
});
