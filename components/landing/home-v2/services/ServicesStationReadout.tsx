"use client";

import { useEffect, useRef } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { SERVICES, type ServiceId } from "./serviceData";
import { getScanNoteForService } from "./serviceScanNotes";

/**
 * ServicesStationReadout — the bottom mono readout strip that frames the
 * services stage as one instrument (ADR-025 Update 9, 2026-07-09).
 *
 * A single hairline row centred between the two racks, carrying the
 * telemetry the racks + designation layer imply: active service index /
 * name, scan coordinate + confidence from `serviceScanNotes`, feed status.
 * Ties the section into the HUD frame Vince already likes: it belongs to
 * the same PT Mono grammar as the rails, and its readouts scramble-decode
 * on service change (same kernel as the corridor caption chrome).
 *
 * Purely presentational — reads `activeServiceId` from props (fed by the
 * runway scroll via `ServicesStage`), no store subscriptions of its own so
 * the readout can be dropped in and out cheaply.
 */

export interface ServicesStationReadoutProps {
  activeServiceId: ServiceId;
}

export function ServicesStationReadout({ activeServiceId }: ServicesStationReadoutProps) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const confidenceRef = useRef<HTMLSpanElement>(null);

  const index = Math.max(
    0,
    SERVICES.findIndex((s) => s.id === activeServiceId)
  );
  const service = SERVICES[index] ?? SERVICES[0];
  const note = getScanNoteForService(service.id);
  const total = SERVICES.length;
  const paddedIndex = String(index + 1).padStart(2, "0");
  const paddedTotal = String(total).padStart(2, "0");
  const confidenceLabel = `CONF ${Math.round(note.confidence * 100)}%`;

  // Scramble-decode on service change (same kernel + shape as the
  // designation layer / wireframe title). One rAF loop per component,
  // self-terminates. Under reduced motion the text snaps instantly.
  const jobsRef = useRef<ScrambleJob[]>([]);
  const rafRef = useRef(0);
  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    const stopLoop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      jobsRef.current.length = 0;
    };

    const targets: Array<[HTMLSpanElement | null, string, number]> = [
      [nameRef.current, service.verb, 0.05],
      [coordRef.current, note.coordinate, 0.11],
      [confidenceRef.current, confidenceLabel, 0.17],
    ];
    if (reducedMotion) {
      stopLoop();
      for (const [el, text] of targets) {
        if (el) el.textContent = text;
      }
      return;
    }

    const nowSec = performance.now() / 1000;
    for (const [el, text, delay] of targets) {
      if (el) queueScramble(jobsRef.current, el, text, nowSec + delay);
    }
    const tick = () => {
      advanceScrambles(jobsRef.current, performance.now() / 1000);
      rafRef.current = jobsRef.current.length ? requestAnimationFrame(tick) : 0;
    };
    if (jobsRef.current.length) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServiceId]);

  return (
    <div className="services-readout" aria-hidden="true" data-service={service.id}>
      <span className="services-readout__leader" />
      <span className="services-readout__cell services-readout__cell--index">
        <span className="services-readout__key">SVC</span>
        <span className="services-readout__val">
          {paddedIndex}/{paddedTotal}
        </span>
      </span>
      <span className="services-readout__sep" />
      <span className="services-readout__cell services-readout__cell--name">
        <span className="services-readout__diamond" aria-hidden="true" />
        <span className="services-readout__val services-readout__val--name" ref={nameRef}>
          {service.verb}
        </span>
      </span>
      <span className="services-readout__sep" />
      <span className="services-readout__cell services-readout__cell--coord">
        <span className="services-readout__key">CV</span>
        <span className="services-readout__val" ref={coordRef}>
          {note.coordinate}
        </span>
      </span>
      <span className="services-readout__sep" />
      <span className="services-readout__cell services-readout__cell--conf">
        <span className="services-readout__val" ref={confidenceRef}>
          {confidenceLabel}
        </span>
      </span>
      <span className="services-readout__sep" />
      <span className="services-readout__cell services-readout__cell--feed">
        <span className="services-readout__pip" aria-hidden="true" />
        <span className="services-readout__val services-readout__val--live">FEED LIVE</span>
      </span>
      <span className="services-readout__leader" />
    </div>
  );
}
