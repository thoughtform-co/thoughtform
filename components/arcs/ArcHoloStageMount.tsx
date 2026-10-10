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
 * (JS ran and the gate said no — reduced motion, ≤900px, no WebGL, or the
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
 *
 * THREE SCENES SINCE ADR-140. The stages (U4's, unchanged in kind), the curve
 * — whose second dial is a reveal group this mount drives off the figure's
 * own `data-step`, the attribute `ArcCurveSteps` already writes — and the
 * spectrum, whose field is built from the band boxes this mount MEASURES in
 * the track, so the CSS that lays the rail out stays the one source.
 */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { CURVE_GROUP_EFFORT, curveSpec, type CurveData } from "@/components/holo-stage/curveGeom";
import { spectrumSpec, type SpectrumData } from "@/components/holo-stage/spectrumGeom";
import {
  STACK_GROUP_RUN,
  STACK_GROUP_WRITE,
  stackSpec,
  type StackData,
} from "@/components/holo-stage/stackGeom";
import { createAnchorChannel } from "@/components/holo-stage/stageAnchors";
import { stagesSpec, type HoloStageSpec, type StagesData } from "@/components/holo-stage/stageGeom";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useThemeStore } from "@/lib/stores/themeStore";
import { probeWebGL } from "@/lib/webgl/probe";

import { ArcHoloLabels, type HoloLabelSpec } from "./ArcHoloLabels";

/* ⚠ THE GATE IS THE FIGURE'S OWN STATIC TIER, COMPLEMENTED. arcs.css releases
   the framing drawings to a stacked list at `(max-width: 900px)`, so the
   instrument may only run above it — and the reveal system's 900 is NOT the
   terminal grammar's 960. Both numbers exist on this surface. */
const STAGE_MEDIA = "(min-width: 901px) and (prefers-reduced-motion: no-preference)";

export type StageScene =
  | { kind: "stages"; data: StagesData }
  | { kind: "curve"; data: CurveData }
  | { kind: "spectrum" }
  /** The layer stack (the proposal system): its two groups ride the
   *  figure's `data-step`, as the curve's one does. */
  | { kind: "stack"; data: StackData };

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

/**
 * The page's own ground under a host: the first ancestor whose background
 * is opaque, as `#rrggbb`. ⚠ A canvas that paints anything else draws a
 * rectangle across the beat (ADR-080 U2): the holo palette's constant is the
 * site's `--void` / parchment, and the arcs' light ground is a step off it.
 */
function resolveGround(host: HTMLElement): string | null {
  let el: HTMLElement | null = host;
  while (el) {
    const bg = getComputedStyle(el).backgroundColor;
    const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/.exec(bg);
    if (m && (m[4] === undefined || Number(m[4]) >= 0.999)) {
      const hex = (n: string) => Number(n).toString(16).padStart(2, "0");
      return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * Look-dev dials (ADR-140), read off the nearest `[data-holo-dials]` wrapper
 * as JSON: `/test/workshop-holo-lab` sets them; the page sets none, so every
 * default below IS production. Three-free and no module singleton — the
 * attribute travels with the DOM it describes.
 */
interface HoloDials {
  scan?: number;
  sweep?: boolean;
  agent?: "cloud" | "solid";
}

function readDials(host: HTMLElement): HoloDials {
  const raw = host.closest<HTMLElement>("[data-holo-dials]")?.getAttribute("data-holo-dials");
  if (!raw) return {};
  try {
    const d = JSON.parse(raw) as HoloDials;
    return typeof d === "object" && d ? d : {};
  } catch {
    return {};
  }
}

/** The spectrum's track, measured: the rail's line and the two band boxes. */
function measureSpectrum(host: HTMLElement): SpectrumData | null {
  const track = host.parentElement;
  if (!track) return null;
  const rail = track.querySelector<HTMLElement>(".arc-spectrum__rail");
  const bands = track.querySelectorAll<HTMLElement>("[data-spectrum-band]");
  if (!rail || bands.length < 2) return null;
  const t = track.getBoundingClientRect();
  if (t.width < 1 || t.height < 1) return null;
  const box = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x0: r.left - t.left, y0: r.top - t.top, x1: r.right - t.left, y1: r.bottom - t.top };
  };
  const r = rail.getBoundingClientRect();
  return {
    w: t.width,
    h: t.height,
    rail: { y: (r.top + r.bottom) / 2 - t.top },
    bands: [box(bands[0]), box(bands[1])],
  };
}

export function ArcHoloStageMount({ scene, labels = [], arm = "io" }: ArcHoloStageMountProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const capable = useMediaQuery(STAGE_MEDIA);
  const [gl, setGl] = useState<boolean | null>(null);
  const [loadable, setLoadable] = useState(false);
  const [armed, setArmed] = useState(false);
  const [live, setLive] = useState(false);
  /* The curve's step, read off the figure (ADR-140). */
  const [step, setStep] = useState(2);
  /* The spectrum's measured track (ADR-140). */
  const [spectrum, setSpectrum] = useState<SpectrumData | null>(null);
  /* The page's ground under the beat, re-read when the theme flips. */
  const mode = useThemeStore((s) => s.mode);
  const [ground, setGround] = useState<string | null>(null);
  /* The lab's dials; `{}` on the page. */
  const [dials, setDials] = useState<HoloDials>({});

  const channel = useMemo(() => createAnchorChannel(), []);
  const spec = useMemo<HoloStageSpec | null>(() => {
    let built: HoloStageSpec | null;
    if (scene.kind === "stages") built = stagesSpec({ ...scene.data, agent: dials.agent });
    else if (scene.kind === "curve") built = curveSpec(scene.data);
    else if (scene.kind === "stack") built = stackSpec(scene.data);
    else built = spectrum ? spectrumSpec(spectrum) : null;
    if (built && dials.sweep === false) built = { ...built, sweep: undefined };
    return built;
  }, [scene, spectrum, dials]);
  const groups = useMemo((): Readonly<Record<string, boolean>> | undefined => {
    const g: Record<string, boolean> = {};
    if (scene.kind === "curve") g[CURVE_GROUP_EFFORT] = step >= 2;
    else if (scene.kind === "stack") {
      g[STACK_GROUP_WRITE] = step >= 1;
      g[STACK_GROUP_RUN] = step >= 2;
    } else return undefined;
    return g;
  }, [scene.kind, step]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect --
       ADR-080's own probe shape, byte for byte (`ArcHoloProgramMount`): the
       WebGL capability test may not run during render and may not run on the
       server, so the one place left is a mount effect. It fires once, and
       `data-holo` is deliberately left alone until it answers. */
    setGl(probeWebGL());
  }, []);

  const allowed = capable && gl === true;

  /* The dials live on an ancestor's attribute, which exists only once the
     tree is in the DOM; a mount effect is the first place it can be read. */
  useEffect(() => {
    const host = hostRef.current;
    if (host) setDials(readDials(host));
  }, []);

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

  /* The curve's second dial follows the figure's own `data-step` — the one
     attribute `ArcCurveSteps` writes — so the two buttons drive the hologram
     without a second piece of state. */
  useEffect(() => {
    if ((scene.kind !== "curve" && scene.kind !== "stack") || !allowed) return;
    const figure = hostRef.current?.closest<HTMLElement>("[data-step]");
    if (!figure) return;
    const read = () => setStep(Number(figure.getAttribute("data-step") ?? 2));
    read();
    const mo = new MutationObserver(read);
    mo.observe(figure, { attributes: true, attributeFilter: ["data-step"] });
    return () => mo.disconnect();
  }, [scene.kind, allowed]);

  /* The spectrum's field is the track's own boxes, re-measured on resize. */
  useEffect(() => {
    if (scene.kind !== "spectrum" || !allowed) return;
    const host = hostRef.current;
    const track = host?.parentElement;
    if (!host || !track) return;
    const measure = () => setSpectrum(measureSpectrum(host));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [scene.kind, allowed]);

  /* The ground is the page's, read off the cascade once the theme's sheet
     has applied — a frame after the store flips, since the `data-theme`
     attribute and the store move in the same tick. */
  useEffect(() => {
    if (!allowed) return;
    const host = hostRef.current;
    if (!host) return;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setGround(resolveGround(host)));
    });
    return () => cancelAnimationFrame(raf);
  }, [allowed, mode]);

  /* The mode signal, on the SECTION so the whole beat's CSS keys off it. */
  useEffect(() => {
    const section = hostRef.current?.closest("section");
    if (!section) return;
    if (gl === null) return; // still probing — leave the server state alone
    section.setAttribute("data-holo", live ? "live" : "static");
  }, [gl, live]);

  if (!allowed || !loadable || !spec)
    return <div className="arc-holo" ref={hostRef} aria-hidden="true" />;

  return (
    <div className="arc-holo" ref={hostRef} data-live={live ? "" : undefined}>
      {/* A canvas failure must fall back to the drawing, not to a hole. */}
      <CanvasErrorBoundary fallback={<HoloReset onReset={() => setLive(false)} />}>
        <HoloStageCanvas
          spec={spec}
          channel={channel}
          armed={armed}
          groups={groups}
          ground={ground ?? undefined}
          scan={dials.scan}
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
