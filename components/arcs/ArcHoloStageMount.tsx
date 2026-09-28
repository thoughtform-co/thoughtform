"use client";

/**
 * ArcHoloStageMount — the workshop's framing beats, as live holograms.
 *
 * ⚠ THE SECOND SANCTIONED three.js SEAM ON THIS SURFACE (ADR-130 U2), on
 * ADR-080's exact terms: `.claude/rules/arcs.md` bans STATIC imports of three
 * under `components/arcs/**`, and everything here is either three-free or
 * reached through `next/dynamic({ ssr: false })`, so the WebGL graph stays out
 * of the arc route's First Load JS. `tests/lib/arcs-import-doctrine.test.ts`
 * names both leaves and fails on a third.
 *
 * ⚠ THE FALLBACK IS THE SVG DRAWING, AND IT IS THE DEFAULT. `data-holo` is a
 * tri-state on the section host: absent (server-rendered, no JS), "static"
 * (JS ran and the gate said no — reduced motion, ≤960px, no WebGL, or the
 * canvas threw) and "live". Only "live" hides the flat figure, and it is
 * written from the scene's FIRST COMMITTED FRAME rather than from the gate
 * passing — a class set before there are pixels is what makes a swap pop.
 * The printed handout goes out on the same fallback, by design.
 *
 * ⚠ THE SPEC IS BUILT HERE, NOT PASSED IN. A spec carries a few hundred motes;
 * handed across the server boundary as a prop it would be serialised into the
 * page's payload. What crosses is the RECORD's own handful of fields.
 *
 * ⚠ IT ADDS NO SCROLL WRITER (ADR-002). `useArcScroll` is the page's one
 * writer; the arming check reads `scrollY`, writes nothing, and disconnects.
 */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { createAnchorChannel } from "@/components/holo-stage/stageAnchors";
import { stagesSpec, type StagesData } from "@/components/holo-stage/stageGeom";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { probeWebGL } from "@/lib/webgl/probe";

import { ArcHoloLabels, type HoloLabelSpec } from "./ArcHoloLabels";

/* ⚠ THE GATE IS THE FIGURE'S OWN STATIC TIER, COMPLEMENTED. arcs.css releases
   the framing drawings to a stacked list at `(max-width: 900px)`, so the
   instrument may only run above it — and the reveal system's 900 is NOT the
   terminal grammar's 960. Both numbers exist on this surface. */
const STAGE_MEDIA = "(min-width: 901px) and (prefers-reduced-motion: no-preference)";

/* ⚠ ONE SCENE SINCE ADR-130 U5: the curve and the horizon are the Moira
   workshop's own flat figures now (owner, 2026-09-28), so only the three
   stages go live. */
export type StageScene = { kind: "stages"; data: StagesData };

const HoloStageCanvas = dynamic(
  () => import("@/components/holo-stage/HoloStageCanvas").then((m) => m.HoloStageCanvas),
  { ssr: false }
);

export interface ArcHoloStageMountProps {
  scene: StageScene;
  /**
   * Tracked DOM words, for a scene whose words move with it. ⚠ The framing
   * beats pass NONE since ADR-130 U4: their camera frames the SVG's own crop,
   * so the fallback's fixed spans are already on the hologram, and a second
   * layer would print every word twice.
   */
  labels?: readonly HoloLabelSpec[];
  /**
   * `curtain` arms on scroll depth — the first beat is held under the hero by
   * the ADR-076 curtain, so an IntersectionObserver is useless there: it
   * intersects from frame one. Everything below the fold arms on arrival.
   */
  arm?: "curtain" | "io";
}

const ARM_AT = 0.55;

export function ArcHoloStageMount({ scene, labels = [], arm = "io" }: ArcHoloStageMountProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const capable = useMediaQuery(STAGE_MEDIA);
  const [gl, setGl] = useState<boolean | null>(null);
  const [loadable, setLoadable] = useState(false);
  const [armed, setArmed] = useState(false);
  const [live, setLive] = useState(false);

  const channel = useMemo(() => createAnchorChannel(), []);
  const spec = useMemo(() => stagesSpec(scene.data), [scene]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect --
       ADR-080's own probe shape, byte for byte (`ArcHoloProgramMount`): the
       WebGL capability test may not run during render and may not run on the
       server, so the one place left is a mount effect. It fires once, and
       `data-holo` is deliberately left alone until it answers. */
    setGl(probeWebGL());
  }, []);

  const allowed = capable && gl === true;

  /* Load at idle. Four canvases on one page is four chunks of nothing —
     they share the one lazily-imported module. */
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    const go = () => {
      if (!cancelled) setLoadable(true);
    };
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(go, { timeout: 2000 });
      return () => {
        cancelled = true;
      };
    }
    const t = window.setTimeout(go, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [allowed]);

  useEffect(() => {
    if (!allowed || armed) return;
    const host = hostRef.current;
    if (!host) return;
    if (arm === "curtain") {
      const check = () => {
        if (window.scrollY >= window.innerHeight * ARM_AT) {
          setArmed(true);
          window.removeEventListener("scroll", check);
        }
      };
      check();
      window.addEventListener("scroll", check, { passive: true });
      return () => window.removeEventListener("scroll", check);
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -20% 0px" }
    );
    io.observe(host);
    return () => io.disconnect();
  }, [allowed, armed, arm]);

  /* The mode signal, on the SECTION so the whole beat's CSS keys off it. */
  useEffect(() => {
    const section = hostRef.current?.closest("section");
    if (!section) return;
    if (gl === null) return; // still probing — leave the server state alone
    section.setAttribute("data-holo", live ? "live" : "static");
  }, [gl, live]);

  if (!allowed || !loadable) return <div className="arc-holo" ref={hostRef} aria-hidden="true" />;

  return (
    <div className="arc-holo" ref={hostRef} data-live={live ? "" : undefined}>
      {/* A canvas failure must fall back to the drawing, not to a hole. */}
      <CanvasErrorBoundary fallback={<HoloReset onReset={() => setLive(false)} />}>
        <HoloStageCanvas
          spec={spec}
          channel={channel}
          armed={armed}
          onReady={() => setLive(true)}
        />
      </CanvasErrorBoundary>
      {labels.length > 0 ? <ArcHoloLabels channel={channel} labels={labels} /> : null}
    </div>
  );
}

/** Hands the beat back to the SVG drawing when the canvas has died. */
function HoloReset({ onReset }: { onReset: () => void }) {
  useEffect(() => {
    onReset();
  }, [onReset]);
  return null;
}
