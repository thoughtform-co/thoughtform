"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { ServicesMasthead } from "@/components/landing/home-v2/services/ServicesMasthead";
import { ServicesRingHitAreas } from "@/components/landing/home-v2/services/ServicesRingHitAreas";
import type { CardFaceBaker } from "@/components/landing/home-v2/services/hologram/ServicesCardRing";
import type { ServicePlateId } from "@/components/landing/home-v2/services/servicePlateData";
import { activeServiceForProgress, ringParkProgress } from "@/lib/services-ring/ringMath";
import { openPlateRef } from "@/lib/services-ring/openPlateRef";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import {
  WORKSTREAM_BAKERS,
  WORKSTREAM_FACES,
  type WorkstreamFace,
} from "@/lib/services-workstreams/bake";
import {
  HIDDEN_SLOT,
  HIDDEN_SLOTS,
  WORKSTREAMS_MASTHEAD,
  WORKSTREAM_PLATES,
} from "@/lib/services-workstreams/plates";
import { WORKSTREAMS } from "@/lib/services-workstreams/record";

/* The canvas is client-only and wrapped in the boundary, or a lost GL context
   replaces the whole page (the card-face lab's own note). */
const RingBackdrop = dynamic(() => import("./RingBackdrop"), { ssr: false });

/** The ring's own parks: card i front and settled. The scroll runs the ring
 *  across the three workstreams and stops on the last; the fourth slot is
 *  hidden and never parks. */
const LAST_CARD = HIDDEN_SLOT - 1;
const P_FIRST = ringParkProgress(0);
const P_LAST = ringParkProgress(LAST_CARD);
const progressFor = (t: number) => P_FIRST + (P_LAST - P_FIRST) * Math.min(1, Math.max(0, t));
const tForPark = (i: number) => (ringParkProgress(i) - P_FIRST) / (P_LAST - P_FIRST);

const FACE_LABEL: Record<WorkstreamFace, string> = {
  ladder: "A · Ladder",
  run: "B · Run",
  specimen: "C · Specimen",
};
const FACE_NOTE: Record<WorkstreamFace, string> = {
  ladder:
    "The workstream's work, client by client, on the run-mode axis: an agent, a tool, a prompt, by hand. The PDA estate's reading, one card per workstream.",
  run: "One worked run per card: the ask, the skill, its steps, the gate (the person, green) and the eval held n of m. Suri's own runs.",
  specimen:
    "The real output, with its verdicts: kept in green, sent back in gold. Samako's product shots and film, Suri's iterations.",
};

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

export function WorkstreamsShell({ hudHtml, bodyClass }: ShellProps) {
  const [face, setFace] = useState<WorkstreamFace>("ladder");
  const [t, setT] = useState(0);
  /* The card the reader opened. It opens IN PLACE — the ring's own drawer
     slides out of the card (ADR-050: the card is one object, its open state
     is its own drawer), never a panel beside it. */
  const [openId, setOpenId] = useState<ServicePlateId | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const runwayRef = useRef<HTMLDivElement>(null);
  const [stamp, setStamp] = useState<string | null>(null);

  /* Deep links, adopted after mount (never `useSearchParams`, which bails
     the route to CSR): `?face=`, `?svc=N` (park N), `?open=1` (the parked card opened). */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const f = q.get("face");
    if (f && (WORKSTREAM_FACES as readonly string[]).includes(f)) setFace(f as WorkstreamFace);
    const wantOpen = q.get("open") === "1";
    if (q.get("console") === "0") setConsoleOpen(false);
    const svc = Number.parseInt(q.get("svc") ?? "", 10);
    if (Number.isFinite(svc)) {
      const i = Math.min(LAST_CARD, Math.max(0, svc));
      requestAnimationFrame(() => scrollToT(tForPark(i)));
      if (wantOpen) setOpenId(WORKSTREAM_PLATES[i].id);
    }
  }, []);

  /* THE SCROLL IS THE CLOCK — the runway's own travel, the same module ref
     `useServicesStageScroll` writes in production. */
  useEffect(() => {
    const onScroll = () => {
      const el = runwayRef.current;
      if (!el) return;
      const travel = el.offsetHeight - window.innerHeight;
      const next = travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0;
      setT(next);
      servicesRingProgressRef.current.progress = progressFor(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      servicesRingProgressRef.current.progress = 0;
    };
  }, []);

  /* The chrome reads document-level state: declare we are parked at #services. */
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-active-station", "services");
    return () => html.removeAttribute("data-active-station");
  }, []);

  const commitFace = useCallback((f: WorkstreamFace) => {
    setFace(f);
    setStamp(null);
    const url = new URL(window.location.href);
    url.searchParams.set("face", f);
    window.history.replaceState(null, "", url.toString());
  }, []);

  /* A STAMP THE PAGE CAN ONLY WRITE ONCE THE FACES ARE BAKED (the capture's
     wait — a value a script cannot satisfy by itself). The baker is wrapped
     per face; the wrapper is memoised on the face, so the ring re-bakes
     exactly when the face changes, as it would on the raw module constant. */
  const baker = useMemo(
    () =>
      countingBaker(WORKSTREAM_BAKERS[face], (theme) =>
        requestAnimationFrame(() => requestAnimationFrame(() => setStamp(`${face}|${theme}`)))
      ),
    [face]
  );

  const progress = progressFor(t);
  const activeIndex = activeServiceForProgress(progress);
  const activePlate = WORKSTREAM_PLATES[activeIndex];

  const onSelectService = useCallback((serviceId: string) => {
    const i = WORKSTREAM_PLATES.findIndex((p) => p.id === serviceId);
    if (i >= 0) scrollToT(tForPark(i), true);
  }, []);
  const onOpenFront = useCallback((id: string) => setOpenId(id as ServicePlateId), []);
  const onCloseDrawer = useCallback(() => setOpenId(null), []);

  const parked = Math.abs(progress - ringParkProgress(activeIndex)) < 0.02;
  /* Open only while that card is the parked front one: scrolling the ring on
     closes it, with no listener of its own (the ring dismisses on progress). */
  const drawerId = openId === activePlate.id && parked ? openId : null;

  /* THE ROUTE'S ONE `openPlateRef` WRITER (the services-ring single-writer
     contract, one per route: `ServicesStage` on the landing, the card-face
     lab's shell there, this shell here). */
  useEffect(() => {
    openPlateRef.current.serviceId = drawerId;
    return () => {
      openPlateRef.current.serviceId = null;
    };
  }, [drawerId]);

  useEffect(() => {
    if (!drawerId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerId]);
  const parkStamp = parked ? String(activeIndex) : "travel";

  return (
    <main
      className={`svw home-v2-root ${bodyClass}`}
      data-face={face}
      data-stamp={stamp ? `${stamp}|${parkStamp}` : undefined}
    >
      <div className="svw-runway" ref={runwayRef}>
        <div className="svw-stage">
          <div className="svw-scene" aria-hidden="true" />
          <CanvasErrorBoundary>
            <RingBackdrop
              activeId={activePlate.id}
              plates={WORKSTREAM_PLATES}
              faceBaker={baker}
              hiddenSlots={HIDDEN_SLOTS}
            />
          </CanvasErrorBoundary>

          <div
            className="svw__hud home-v2-hud-root"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: hudHtml }}
          />

          <div className="svw-stationbox">
            <div
              className="services-stage"
              data-card-ring="on"
              /* The landing's own hook: the masthead steps back while a card
                 is open (services.css). */
              data-plate-open={drawerId ? "1" : undefined}
              style={STAGE_STYLE}
            >
              <div className="services-stage__items">
                <ServicesMasthead copy={WORKSTREAMS_MASTHEAD} />
                <ServicesRingHitAreas
                  plates={WORKSTREAM_PLATES}
                  onSelectService={onSelectService}
                  onOpenFront={onOpenFront}
                  onCloseDrawer={onCloseDrawer}
                  openServiceId={drawerId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lab console ─────────────────────────────────────────────── */}
      {!consoleOpen && (
        <button
          type="button"
          className="svw-chip svw-console-pin"
          onClick={() => setConsoleOpen(true)}
        >
          Lab
        </button>
      )}
      <div className="svw-console" aria-label="Workstreams lab controls" hidden={!consoleOpen}>
        <div className="svw-chips" role="tablist" aria-label="Card face">
          {WORKSTREAM_FACES.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              className="svw-chip"
              data-on={f === face || undefined}
              aria-selected={f === face}
              onClick={() => commitFace(f)}
            >
              {FACE_LABEL[f]}
            </button>
          ))}
        </div>
        <p className="svw-note">{FACE_NOTE[face]}</p>
        <div className="svw-chips" aria-label="Park a card">
          {WORKSTREAMS.map((ws, i) => (
            <button
              key={ws.key}
              type="button"
              className="svw-chip svw-chip--sm"
              data-on={(activeIndex === i && parked) || undefined}
              onClick={() => scrollToT(tForPark(i), true)}
            >
              {ws.name}
            </button>
          ))}
          <button
            type="button"
            className="svw-chip svw-chip--sm"
            onClick={() => setConsoleOpen(false)}
          >
            Hide
          </button>
        </div>
      </div>
    </main>
  );
}

/** The masthead's end-state envelopes. A MODULE CONSTANT: a fresh literal
 *  would re-apply the style attribute and clobber the masthead's own writes. */
const STAGE_STYLE = {
  "--svc-content-in": "1",
  "--svc-exit": "0",
  "--svc-arrive": "1",
  "--svc-arrive-op": "1",
} as CSSProperties;

/** Wrap a baker so the page learns when a whole set of faces has baked. */
function countingBaker(inner: CardFaceBaker, onSet: (theme: string) => void): CardFaceBaker {
  const state = { baked: 0 };
  return async (plate, i, opts) => {
    const canvas = await inner(plate, i, opts);
    state.baked += 1;
    if (state.baked % WORKSTREAM_PLATES.length === 0) onSet(opts.theme);
    return canvas;
  };
}

/** Scroll the runway to a fraction of its travel. */
function scrollToT(t: number, smooth = false) {
  const el = document.querySelector<HTMLElement>(".svw-runway");
  if (!el) return;
  const travel = el.offsetHeight - window.innerHeight;
  window.scrollTo({ top: Math.round(t * travel), behavior: smooth ? "smooth" : "instant" });
}
