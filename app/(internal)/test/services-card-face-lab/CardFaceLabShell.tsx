"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import type {
  CardFigureInk,
  CardTitleStyle,
} from "@/components/landing/home-v2/services/hologram/ServicesCardRing";
import {
  SERVICE_PLATES,
  type ServicePlateId,
} from "@/components/landing/home-v2/services/servicePlateData";
import { openPlateRef } from "@/lib/services-ring/openPlateRef";
import { activeServiceForProgress, ringParkProgress } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import { FIGURE_SLOTS } from "@/lib/services-ring/serviceFigures";
import { wireFor, wireInk } from "@/lib/services-ring/serviceWire";

import { CardFaceFrame } from "./CardFaceFrame";
import { RECUT_PLATES, RECUT_SERVICES } from "./serviceRecut";
import {
  CANDIDATE_VARIANTS,
  FACE_VARIANTS as BASE_VARIANTS,
  FIGURE_INKS,
  HOUSE_VARIANTS,
  LATTICE_VARIANTS,
  MATERIAL_VARIANTS,
  RASTER_VARIANTS,
  TITLE_NOTE,
  TITLE_STYLES,
} from "./variants";

/**
 * The board-derived routes, the house instruments, the proposal, then the
 * three MATERIALS on the re-cut four (2026-09-19), the raster's shape
 * families and the lattice families — one list for the lab, in that order,
 * because the proposal is the destination of the survey and the rounds after
 * it are the next questions asked of it.
 */
const FACE_VARIANTS = [
  ...BASE_VARIANTS,
  ...HOUSE_VARIANTS,
  ...CANDIDATE_VARIANTS,
  ...MATERIAL_VARIANTS,
  ...RASTER_VARIANTS,
  ...LATTICE_VARIANTS,
];

// three/fiber is client-only; keep it out of the server render entirely so the
// frame + masthead still paint if WebGL is unavailable.
//
// `ssr: false` alone does NOT deliver that promise: a RUNTIME throw inside
// <Canvas> (a lost GL context, or `postprocessing`'s EffectComposer reading
// `getContextAttributes().alpha` off a null context) bubbles straight to the
// route error boundary and replaces the whole page with "System Fault". The
// production canvases are all wrapped in `CanvasErrorBoundary` for exactly
// this reason — see HomeCorridor / DepthGatewayScene / BrandmarkSystem. The
// lab must be too, or one dropped context costs the entire study.
const RingBackdrop = dynamic(() => import("./RingBackdrop"), { ssr: false });

/**
 * Park math — the ring's OWN (`ringParkProgress`): the centre of service i's
 * dwell, where the turn has finished. ⚠ The lab's earlier `(i + 1.5) / 5`
 * never settled (2026-09-19): with the travel at 0.85 of a segment those
 * values sat 0.68–0.95 of the way through a quarter-turn, and every still
 * this lab shot was a card still turning — the readout rounds, so it agreed.
 */
const parkFor = (i: number) => ringParkProgress(i);
/** Service 01 front and settled. */
const DEFAULT_PROGRESS = parkFor(0);
/** Below the first park: the lead-in, before the ring has arrived. */
const LEAD_PROGRESS = 0.05;

/** The lab's two inks for the wire strip — the ramp's own values, inline
 *  because this strip is lab chrome and the bake reads the same roles through
 *  `wireInk`. */
const STRIP_INK = { ink: "235, 227, 214", gold: "202, 165, 84" } as const;

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

/**
 * CardFaceLabShell — owns lab state, the `<html>` attribute bus, the ring
 * progress bridge, and the console.
 *
 * Deep-link state (`?v=` route, `?p=` progress, `?svc=` park, `?ink=` figure
 * ink) is read in a MOUNT EFFECT and written through `history.replaceState`
 * — never `useSearchParams`, which forces a CSR bailout of the whole route
 * (the project-cards / section-menu / anchor lab convention).
 */
export function CardFaceLabShell({ hudHtml, bodyClass }: ShellProps) {
  const [variantIdx, setVariantIdx] = useState(0);
  const [titleStyle, setTitleStyle] = useState<CardTitleStyle>("framed");
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [inkOverride, setInkOverride] = useState<CardFigureInk | null>(null);
  const [openServiceId, setOpenServiceId] = useState<ServicePlateId | null>(null);
  const replayRef = useRef<(() => void) | null>(null);

  // Adopt deep-linked state AFTER mount (SSR renders the defaults; reading
  // location in the initialiser would mismatch hydration).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v");
    if (v) {
      const byId = FACE_VARIANTS.findIndex((a) => a.id === v);
      if (byId >= 0) setVariantIdx(byId);
      else {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0 && n < FACE_VARIANTS.length) setVariantIdx(n);
      }
    }
    const t = q.get("t");
    if (t && (TITLE_STYLES as readonly string[]).includes(t)) setTitleStyle(t as CardTitleStyle);
    const p = Number.parseFloat(q.get("p") ?? "");
    if (Number.isFinite(p)) setProgress(Math.min(1, Math.max(0, p)));
    // `?svc=N` parks card N front and settled — what a capture asks for.
    const svc = Number.parseInt(q.get("svc") ?? "", 10);
    if (Number.isFinite(svc)) setProgress(parkFor(svc));
    const ink = q.get("ink");
    if (ink && (FIGURE_INKS as readonly string[]).includes(ink))
      setInkOverride(ink as CardFigureInk);
  }, []);

  const commit = useCallback(
    (next: {
      variantIdx?: number;
      progress?: number;
      titleStyle?: CardTitleStyle;
      ink?: CardFigureInk;
    }) => {
      const v = next.variantIdx ?? variantIdx;
      const p = next.progress ?? progress;
      const t = next.titleStyle ?? titleStyle;
      const ink = next.ink ?? inkOverride;
      if (next.variantIdx !== undefined) setVariantIdx(next.variantIdx);
      if (next.progress !== undefined) setProgress(next.progress);
      if (next.titleStyle !== undefined) setTitleStyle(next.titleStyle);
      if (next.ink !== undefined) setInkOverride(next.ink);
      // Moving the ring or switching routes must not leave a plate seated on
      // a rect the card has left.
      setOpenServiceId(null);
      const url = new URL(window.location.href);
      url.searchParams.set("v", FACE_VARIANTS[v].id);
      url.searchParams.set("p", p.toFixed(3));
      url.searchParams.set("t", t);
      if (ink) url.searchParams.set("ink", ink);
      window.history.replaceState(null, "", url.toString());
    },
    [variantIdx, progress, titleStyle, inkOverride]
  );

  /**
   * The `<html>` bus. The chrome that reads it takes no props — it resolves its
   * visibility and its active row from document-level state, so the lab must
   * stand in for the corridor scroll rig and declare that we are parked at
   * #services.
   *
   * `data-corridor-engaged` is deliberately NOT set: it would route
   * `resolveActiveIdx` down the corridor/thesis branch and light the wrong
   * station.
   */
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-active-station", "services");
    return () => {
      html.removeAttribute("data-active-station");
    };
  }, []);

  /**
   * Ring progress bridge — the same module-level ref `useServicesStageScroll`
   * writes in production. `ServicesCardRing` reads it per WebGL frame, but the
   * MENU only re-reads on scroll/attribute events, so a synthetic scroll event
   * is what makes the active verb follow the slider on a page that never
   * scrolls.
   *
   * ⚠ This dispatch is why the lab must NOT add a scroll-dismissal listener
   * for the drawer: it could not distinguish this synthetic event from a real
   * user scroll. `commit()` closes the drawer directly instead.
   */
  useEffect(() => {
    servicesRingProgressRef.current.progress = progress;
    window.dispatchEvent(new Event("scroll"));
    return () => {
      servicesRingProgressRef.current.progress = 0;
    };
  }, [progress]);

  const onReplayReady = useCallback((fn: () => void) => {
    replayRef.current = fn;
  }, []);

  const variant = FACE_VARIANTS[variantIdx];
  /* The record this row bakes: the re-cut four on the material rows, the
     shipped four everywhere else. Ids are the same four slots either way, so
     the park math and the ring's clock never change. */
  const services = variant.recut ? RECUT_SERVICES : SERVICES;
  const plates = variant.recut ? RECUT_PLATES : SERVICE_PLATES;
  const figure = variant.figure ?? "off";
  const figureInk: CardFigureInk = inkOverride ?? variant.figureInk ?? "ink";

  // Side-card hit → park that service (production scrolls the runway there;
  // the lab drives the same ring math through the progress bridge).
  const onSelectService = useCallback(
    (serviceId: string) => {
      const i = services.findIndex((s) => s.id === serviceId);
      if (i >= 0) commit({ progress: parkFor(i) });
    },
    [commit, services]
  );

  const onOpenService = useCallback((serviceId: ServicePlateId) => {
    setOpenServiceId(serviceId);
  }, []);
  const onCloseService = useCallback(() => setOpenServiceId(null), []);

  /**
   * The shell is the SINGLE WRITER of `openPlateRef` (ADR-050 rev 3 — the DOM
   * plate that used to own it is deleted). `ServicesCardRing` reads this per
   * WebGL frame to drive the drawer's open level.
   */
  useEffect(() => {
    openPlateRef.current.serviceId = openServiceId;
    return () => {
      openPlateRef.current.serviceId = null;
    };
  }, [openServiceId]);

  /**
   * Escape closes. Deliberately NO scroll/wheel listeners in the lab: the
   * progress bridge below dispatches a SYNTHETIC scroll event on every slider
   * move, which such a listener could not tell from a real user scroll. The
   * runway-driven dismissal belongs in `ServicesStage` at promotion time,
   * where a real scroll owner exists; here `commit()` already closes on any
   * progress change.
   */
  useEffect(() => {
    if (!openServiceId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenServiceId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openServiceId]);

  const activeIndex = activeServiceForProgress(progress);
  const activePlate = plates[activeIndex];

  return (
    <main
      className={`scfl home-v2-root ${bodyClass}`}
      data-theme="dark"
      data-face-variant={variant.id}
      data-plate-open={openServiceId ? "1" : undefined}
    >
      <CanvasErrorBoundary>
        <RingBackdrop
          progress={progress}
          faceVariant={variant.face}
          titleStyle={titleStyle}
          openDrawer={variant.openPlate}
          plates={variant.recut ? plates : undefined}
          services={services}
          figure={figure}
          figureInk={figureInk}
        />
      </CanvasErrorBoundary>

      <CardFaceFrame
        hudHtml={hudHtml}
        openPlateEnabled={variant.openPlate}
        openServiceId={openServiceId}
        onOpenService={onOpenService}
        onCloseService={onCloseService}
        onSelectService={onSelectService}
        onReplayReady={onReplayReady}
        plates={variant.recut ? plates : undefined}
      />

      {/* ── Lab console ─────────────────────────────────────────────── */}
      <div className="scfl-console" aria-label="Services card face lab controls">
        <div className="scfl-chips" role="tablist" aria-label="Face routes">
          {FACE_VARIANTS.map((a, i) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              className="scfl-chip"
              data-on={i === variantIdx || undefined}
              aria-selected={i === variantIdx}
              onClick={() => commit({ variantIdx: i })}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* The TITLE treatment is a second, independent axis — cross any
            setting of the name against any composition. Kept as its own row
            rather than folded into the variant list because six treatments ×
            nine compositions is fifty-four cards, and a flat list of those is
            not a comparison. */}
        <div className="scfl-chips" role="tablist" aria-label="Title treatment">
          {TITLE_STYLES.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              className="scfl-chip"
              data-on={t === titleStyle || undefined}
              aria-selected={t === titleStyle}
              onClick={() => commit({ titleStyle: t })}
              title={TITLE_NOTE[t]}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* THE FIGURE'S INK (round three): the face's reading ink, or Tensor
            Gold. Only a row with an in-canvas figure has an ink to flip. */}
        {figure !== "off" && (
          <div className="scfl-chips" role="tablist" aria-label="Figure ink">
            {FIGURE_INKS.map((ink) => (
              <button
                key={ink}
                type="button"
                role="tab"
                className="scfl-chip"
                data-on={ink === figureInk || undefined}
                aria-selected={ink === figureInk}
                onClick={() => commit({ ink })}
              >
                INK · {ink === "gold" ? "TENSOR GOLD" : "DAWN"}
              </button>
            ))}
          </div>
        )}

        <p className="scfl-thesis">{variant.thesis}</p>
        {/* A pinned row ignores the chips, so the console reports the treatment
            the card is ACTUALLY carrying — not the one the chip row is set to. */}
        <p className="scfl-thesis">
          <strong>Title · {(variant.pinnedTitle ?? titleStyle).toUpperCase()}</strong>
          {variant.pinnedTitle ? " (pinned — chips do not reach this row)" : ""} —{" "}
          {TITLE_NOTE[variant.pinnedTitle ?? titleStyle]}
        </p>
        <p className="scfl-prov">
          <span className="scfl-prov__diamond" aria-hidden="true" />
          {variant.provenance}
        </p>

        <div className="scfl-field">
          <span className="scfl-field__label">
            RING · SVC {String(activeIndex + 1).padStart(2, "0")}/04 · {services[activeIndex].verb}
          </span>
          <input
            type="range"
            className="scfl-range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            aria-label="Ring progress"
            onChange={(e) => commit({ progress: Number.parseFloat(e.target.value) })}
          />
          <div className="scfl-row">
            {services.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className="scfl-chip scfl-chip--sm"
                data-on={(activeIndex === i && progress >= parkFor(0)) || undefined}
                onClick={() => commit({ progress: parkFor(i) })}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
            <button
              type="button"
              className="scfl-chip scfl-chip--sm"
              data-on={progress < parkFor(0) || undefined}
              onClick={() => commit({ progress: LEAD_PROGRESS })}
            >
              LEAD
            </button>
          </div>
        </div>

        {/* THE RECORD (2026-09-19): the front card's copy, readable off the
            page. On a material row this is the re-cut four — the strings the
            owner is being asked to read before any of them moves into
            production data. */}
        {variant.recut && (
          <dl className="scfl-record" aria-label="The front card's record">
            <div className="scfl-record__row">
              <dt>Chip</dt>
              <dd>{activePlate.chip}</dd>
            </div>
            <div className="scfl-record__row">
              <dt>Title</dt>
              <dd>{activePlate.title}</dd>
            </div>
            <div className="scfl-record__row">
              <dt>Lede</dt>
              <dd>{activePlate.lede.map((s) => (typeof s === "string" ? s : s.em)).join("")}</dd>
            </div>
            <div className="scfl-record__row">
              <dt>What</dt>
              <dd>{activePlate.breakdown.join(" · ")}</dd>
            </div>
            <div className="scfl-record__row">
              <dt>How</dt>
              <dd>
                {activePlate.spec.duration} · {activePlate.spec.participants} ·{" "}
                {activePlate.spec.format} · {activePlate.spec.language} · leaves with:{" "}
                {activePlate.spec.leavesWith}
              </dd>
            </div>
            <div className="scfl-record__row">
              <dt>CTA</dt>
              <dd>{activePlate.ctaLabel}</dd>
            </div>
          </dl>
        )}

        {/* THE WIRE STRIP: the same path strings the bake rasterises, as
            inline SVG — one source, two surfaces. */}
        {variant.face === "wire" && (
          <div className="scfl-wire" aria-label="The four wire figures, as SVG">
            {FIGURE_SLOTS.map((slot) => {
              const w = wireFor(slot);
              return (
                <svg
                  key={slot}
                  viewBox={`${w.vb.x} ${w.vb.y} ${w.vb.w} ${w.vb.h}`}
                  role="img"
                  aria-label={slot}
                >
                  {[...w.housing, ...w.figure].map((p) => {
                    const { role, alpha } = wireInk(p.ink);
                    const a = Math.min(1, alpha * p.alpha);
                    const colour = `rgba(${STRIP_INK[role]}, ${a.toFixed(3)})`;
                    return p.fill ? (
                      <path key={p.id} d={p.d} fill={colour} />
                    ) : (
                      <path
                        key={p.id}
                        d={p.d}
                        fill="none"
                        stroke={colour}
                        strokeWidth={p.width}
                        strokeDasharray={p.dash}
                      />
                    );
                  })}
                </svg>
              );
            })}
          </div>
        )}

        <div className="scfl-toggles">
          <button
            type="button"
            className="scfl-toggle"
            data-on={openServiceId ? true : undefined}
            aria-pressed={Boolean(openServiceId)}
            disabled={!variant.openPlate}
            onClick={() =>
              openServiceId
                ? onCloseService()
                : onOpenService(services[activeIndex].id as ServicePlateId)
            }
          >
            <i className="scfl-toggle__led" aria-hidden="true" />
            {openServiceId ? "CLOSE" : "OPEN"} PLATE
          </button>
          <button type="button" className="scfl-toggle" onClick={() => replayRef.current?.()}>
            <i className="scfl-toggle__led" aria-hidden="true" />
            REPLAY
          </button>
        </div>
      </div>

      <p className="scfl-gate-warn">
        Widen to ≥1101×760 — the journey menus are gated to the desktop tier.
      </p>
    </main>
  );
}
