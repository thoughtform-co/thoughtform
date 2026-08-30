"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import type { CardTitleStyle } from "@/components/landing/home-v2/services/hologram/ServicesCardRing";
import type { ServicePlateId } from "@/components/landing/home-v2/services/servicePlateData";
import { openPlateRef } from "@/lib/services-ring/openPlateRef";
import { activeServiceForProgress } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

import { CardFaceFrame } from "./CardFaceFrame";
import {
  CANDIDATE_VARIANTS,
  FACE_VARIANTS as BASE_VARIANTS,
  HOUSE_VARIANTS,
  TITLE_NOTE,
  TITLE_STYLES,
} from "./variants";

/**
 * The board-derived routes, the house instruments, then the proposal — one list
 * for the lab, in that order, because the proposal is the destination and a
 * destination does not sit in the middle of the survey it came out of.
 */
const FACE_VARIANTS = [...BASE_VARIANTS, ...HOUSE_VARIANTS, ...CANDIDATE_VARIANTS];

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

/** Beat-1 midpoint — service 01 front and settled (the orbit lab's default). */
const DEFAULT_PROGRESS = 0.3;
/** Park math: centre of service i's beat across the 5-beat runway. */
const parkFor = (i: number) => (i + 1.5) / 5;

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

/**
 * CardFaceLabShell — owns lab state, the `<html>` attribute bus, the ring
 * progress bridge, and the console.
 *
 * Deep-link state (`?v=` route, `?p=` progress) is read in a MOUNT EFFECT and
 * written through `history.replaceState` — never `useSearchParams`, which
 * forces a CSR bailout of the whole route (the project-cards / section-menu /
 * anchor lab convention).
 */
export function CardFaceLabShell({ hudHtml, bodyClass }: ShellProps) {
  const [variantIdx, setVariantIdx] = useState(0);
  const [titleStyle, setTitleStyle] = useState<CardTitleStyle>("framed");
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
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
  }, []);

  const commit = useCallback(
    (next: { variantIdx?: number; progress?: number; titleStyle?: CardTitleStyle }) => {
      const v = next.variantIdx ?? variantIdx;
      const p = next.progress ?? progress;
      const t = next.titleStyle ?? titleStyle;
      if (next.variantIdx !== undefined) setVariantIdx(next.variantIdx);
      if (next.progress !== undefined) setProgress(next.progress);
      if (next.titleStyle !== undefined) setTitleStyle(next.titleStyle);
      // Moving the ring or switching routes must not leave a plate seated on
      // a rect the card has left.
      setOpenServiceId(null);
      const url = new URL(window.location.href);
      url.searchParams.set("v", FACE_VARIANTS[v].id);
      url.searchParams.set("p", p.toFixed(3));
      url.searchParams.set("t", t);
      window.history.replaceState(null, "", url.toString());
    },
    [variantIdx, progress, titleStyle]
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

  // Side-card hit → park that service (production scrolls the runway there;
  // the lab drives the same ring math through the progress bridge).
  const onSelectService = useCallback(
    (serviceId: string) => {
      const i = SERVICES.findIndex((s) => s.id === serviceId);
      if (i >= 0) commit({ progress: parkFor(i) });
    },
    [commit]
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

  const variant = FACE_VARIANTS[variantIdx];
  const activeIndex = activeServiceForProgress(progress);

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
            RING · SVC {String(activeIndex + 1).padStart(2, "0")}/04 · {SERVICES[activeIndex].verb}
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
            {SERVICES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className="scfl-chip scfl-chip--sm"
                data-on={(activeIndex === i && progress > 0.2) || undefined}
                onClick={() => commit({ progress: parkFor(i) })}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
            <button
              type="button"
              className="scfl-chip scfl-chip--sm"
              data-on={progress <= 0.2 || undefined}
              onClick={() => commit({ progress: 0.1 })}
            >
              LEAD
            </button>
          </div>
        </div>

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
                : onOpenService(SERVICES[activeIndex].id as ServicePlateId)
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
