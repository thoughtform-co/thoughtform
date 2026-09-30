"use client";

import { useEffect } from "react";

import { compassGateScreenRef } from "@/components/landing/home-v2/compassGateScreenRef";
import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";

import {
  A_BOX_OUT,
  A_OUT,
  CTA_OPEN,
  FLIP_BACK,
  ORBIT_OUT_AT,
  PARTICLES_IN,
  apertureInset,
  backFaceStart,
  easedWindow,
  flipBackDeg,
  flipFrontDeg,
  gateHalf,
  gateHalfMax,
  lerpRect,
  turnState,
  turnU,
  type Rect,
  type TurnState,
} from "./aboutTurnClock";
import { measureCarrier, parkCarrier, writeCarrier, type CarrierMeasure } from "./aboutTurnCarrier";
import { measureGate, restoreGateText, writeGate, type GateMeasure } from "./aboutTurnGate";

/**
 * useAboutTurn — the one writer for the About → Arc turn on
 * /arcs/thoughtform-workshop (ADR-137 U2 + U3; the Trinny turn's shape,
 * `useTurnScroll.ts`, one route over).
 *
 * WHAT IT READS. `#about`'s rect (the clock), the stage's rect, and — once
 * the corridor has mounted and armed — the LIVE thesis copy's lines, the LIVE
 * brandmark's rect, the LIVE phase labels and the compass gate's own screen
 * geometry (`compassGateScreenRef`), which are where the turn lands.
 *
 * WHAT IT WRITES, AND ONLY THAT. `data-tw-turn` on `.tw-root` (`hold` →
 * `run` → `done`), `data-tw-gate` on the stage while the morph layer draws,
 * `--tw-*` custom properties on the elements that consume them, the fact
 * row's `clip-path`, the carrier's leaves, the morph layer and the stand-in
 * mark's pose, and `compassGateScreenRef.wanted`. ⚠ NEVER the shared bus —
 * `data-active-station`, `data-corridor-*` and `--hero-lift` stay with
 * `useLandingScroll` and `useDepthScroll` — and ⚠ NEVER `transform`,
 * `opacity` or `clip-path` on a `[data-m]` node: the reveal owns those, so the
 * portrait turns on the CSS `rotate` property through `--tw-flip`, the halo
 * gathers on `translate` / `scale` / `rotate`, and the copy hides by
 * `visibility`.
 *
 * ⚠ IT RUNS EVERY FRAME WHILE THE TURN RUNS, not only on scroll: the live
 * gate keeps breathing and its dots keep turning when the reader stops, and
 * the morph layer lands on its pixels, so a scroll-only writer would leave
 * the drawing standing while the gate under it moved on.
 *
 * ⚠ ABSENT MEANS SHOWN. Off the capable rung, without scroll timelines, with
 * the stage not computing `sticky`, or before the corridor exists, nothing
 * is stamped and `park()` has cleared every write: the page is the static
 * About the route shipped before this pass.
 */

export const ABOUT_TURN_CAPABLE_QUERY =
  "(min-width: 961px) and (min-height: 681px) and (prefers-reduced-motion: no-preference)";
const TIMELINE_SUPPORT = "animation-timeline: scroll(root block)";
const TURN_ATTR = "data-tw-turn";
const GATE_ATTR = "data-tw-gate";
/** A gate frame older than this is not this page's gate any more. */
const GATE_STALE_MS = 250;

interface Dom {
  root: HTMLElement;
  about: HTMLElement;
  stage: HTMLElement;
  layer: HTMLElement;
  mark: HTMLElement;
  gate: SVGSVGElement;
  orbitSvg: SVGSVGElement;
  name: HTMLElement;
  role: HTMLElement;
  bios: HTMLElement[];
  boxes: HTMLElement[];
  orbit: HTMLElement;
  portrait: HTMLElement;
  labels: { glide: HTMLElement[]; out: HTMLElement | null };
}

function resolveDom(): Dom | null {
  const root = document.querySelector<HTMLElement>(".tw-root");
  const about = root?.querySelector<HTMLElement>("#about");
  const stage = about?.querySelector<HTMLElement>("[data-tw-about-stage]");
  const layer = stage?.querySelector<HTMLElement>("[data-tw-turn-layer]");
  const mark = stage?.querySelector<HTMLElement>("[data-tw-turn-mark]");
  const gate = stage?.querySelector<SVGSVGElement>("[data-tw-turn-gate]");
  const name = about?.querySelector<HTMLElement>(".voidwalker__name");
  const role = about?.querySelector<HTMLElement>(".voidwalker__role");
  const bios = about ? Array.from(about.querySelectorAll<HTMLElement>(".voidwalker__bio")) : [];
  const boxes = about
    ? Array.from(about.querySelectorAll<HTMLElement>(".voidwalker__meta, .voidwalker__links"))
    : [];
  const orbit = about?.querySelector<HTMLElement>(".voidwalker__orbit");
  const orbitSvg = orbit?.querySelector<SVGSVGElement>(".voidwalker__orbit__svg");
  const portrait = orbit?.querySelector<HTMLElement>(".voidwalker__orbit__portrait");
  const label = (corner: string) =>
    orbit?.querySelector<HTMLElement>(`.voidwalker__orbit__label--${corner}`) ?? null;
  const glide = ["tl", "bl", "tr"].map(label).filter((l): l is HTMLElement => !!l);
  if (
    !root ||
    !about ||
    !stage ||
    !layer ||
    !mark ||
    !gate ||
    !name ||
    !role ||
    !orbit ||
    !orbitSvg ||
    !portrait
  ) {
    return null;
  }
  return {
    root,
    about,
    stage,
    layer,
    mark,
    gate,
    orbitSvg,
    name,
    role,
    bios,
    boxes,
    orbit,
    portrait,
    labels: { glide, out: label("br") },
  };
}

/** The live corridor frame this turn lands on. Present only once the lazy
 *  corridor chunk has mounted; desktop copy block only. */
interface Live {
  block: HTMLElement;
  title: HTMLElement;
  bodies: HTMLElement[];
  cta: HTMLElement | null;
  shell: HTMLElement;
  /** navigate · encode · build — paired with the About's tl · bl · tr. */
  phases: HTMLElement[];
  canvas: HTMLElement | null;
}

function resolveLive(root: HTMLElement): Live | null {
  const block = root.querySelector<HTMLElement>(".home-v2-copy-block--thoughtform-left");
  const title = block?.querySelector<HTMLElement>(".home-v2-copy-title");
  const shell = root.querySelector<HTMLElement>(".home-v2-projected-brandmark");
  if (!block || !title || !shell) return null;
  return {
    block,
    title,
    bodies: Array.from(block.querySelectorAll<HTMLElement>(".home-v2-copy-body")),
    cta: block.querySelector<HTMLElement>(".home-v2-copy-cta"),
    shell,
    phases: ["navigate", "encode", "build"]
      .map((p) => root.querySelector<HTMLElement>(`.home-v2-copy-phase--${p}`))
      .filter((el): el is HTMLElement => !!el),
    canvas: root.querySelector<HTMLElement>(".home-v2-stage__canvas-inner"),
  };
}

/** The live mark's own Y tilt (`rotateY(-3deg)` at paintProgress 0), so the
 *  stand-in lands on its pose rather than on zero. */
function liveTilt(shell: HTMLElement): number {
  const inner = shell.firstElementChild as HTMLElement | null;
  const m = /rotateY\((-?[\d.]+)deg\)/.exec(inner?.style.transform ?? "");
  const deg = m ? parseFloat(m[1]!) : NaN;
  return Number.isFinite(deg) ? deg : -3;
}

export function useAboutTurn(): void {
  useEffect(() => {
    let dom = resolveDom();
    if (!dom) return;
    const mq = window.matchMedia(ABOUT_TURN_CAPABLE_QUERY);
    const timelines = typeof CSS !== "undefined" && CSS.supports(TIMELINE_SUPPORT);

    let live = false;
    let state: TurnState | null = null;
    let lastU = Number.NaN;
    let dirty = true;
    let raf = 0;
    let liveDom: Live | null = null;
    let carrier: CarrierMeasure | null = null;
    let gateM: GateMeasure | null = null;
    let carriesThesis = false;
    /** Stage-local, transform-free: the portrait's layout box and the
     *  orbit's centre (the halo gathers from it). */
    let portraitBox: Rect | null = null;
    let orbitCentre: [number, number] = [0, 0];

    const d = () => dom!;

    /** Reset every write to identity — the static About. */
    const resetWrites = () => {
      const { orbit, boxes, role, stage, layer, mark, gate } = d();
      for (const p of ["--tw-flip", "--tw-pdx", "--tw-pdy", "--tw-ps", "--tw-pr", "visibility"]) {
        orbit.style.removeProperty(p);
      }
      for (const b of boxes) b.style.removeProperty("clip-path");
      role.style.removeProperty("--tw-rule");
      for (const p of ["--tw-hs", "--tw-hx", "--tw-hy"]) stage.style.removeProperty(p);
      stage.removeAttribute(GATE_ATTR);
      liveDom?.cta?.style.removeProperty("--tw-cta");
      parkCarrier(layer);
      restoreGateText(gateM);
      gate.setAttribute("hidden", "");
      mark.hidden = true;
    };

    const park = () => {
      if (!dom) return;
      resetWrites();
      d().root.removeAttribute(TURN_ATTR);
      compassGateScreenRef.wanted = false;
      state = null;
      lastU = Number.NaN;
    };

    /** Everything that changes only with layout. */
    const remeasure = () => {
      const { stage, layer, gate, orbitSvg, name, role, bios, orbit, portrait, labels } = d();
      /* The lettering is read as it stands at rest: a remeasure mid-turn must
         not take a scrambled string for the original. */
      restoreGateText(gateM);
      const stageBox = stage.getBoundingClientRect();
      const orbitBox = orbit.getBoundingClientRect();
      /* `offset*` is transform-free, so a portrait already turning (a
         reload mid-turn) still reports its resting box. */
      portraitBox = {
        x: orbitBox.left - stageBox.left + portrait.offsetLeft,
        y: orbitBox.top - stageBox.top + portrait.offsetTop,
        w: portrait.offsetWidth,
        h: portrait.offsetHeight,
      };
      orbitCentre = [
        orbitBox.left - stageBox.left + orbit.offsetWidth / 2,
        orbitBox.top - stageBox.top + orbit.offsetHeight / 2,
      ];
      /* The thesis half is measurable only once the corridor is armed: the
         tracker writes the block's opacity and position on the frame it
         starts painting. */
      const thesisReady =
        !!liveDom && liveDom.block.style.opacity === "1" && liveDom.block.offsetWidth > 0;
      carrier = measureCarrier(
        layer,
        stage,
        { name, role, bios, labels },
        thesisReady && liveDom
          ? { title: liveDom.title, bodies: liveDom.bodies, phases: liveDom.phases }
          : null
      );
      carriesThesis = thesisReady;
      gateM = measureGate(gate, orbitSvg, stageBox);
      dirty = true;
    };

    const write = (u: number, full: boolean) => {
      const { orbit, boxes, role, stage, layer, mark, gate } = d();
      const lv = liveDom!;
      const stageBox = stage.getBoundingClientRect();
      const sb = lv.shell.getBoundingClientRect();
      const liveBox: Rect = {
        x: sb.left - stageBox.left,
        y: sb.top - stageBox.top,
        w: sb.width,
        h: sb.height,
      };
      const markCentre: [number, number] = [liveBox.x + liveBox.w / 2, liveBox.y + liveBox.h / 2];

      /* The compass gate: the orbit's drawing morphs onto the live gate's
         pixels. Every frame, because the gate moves on its own. */
      const f = compassGateScreenRef.current;
      const gateLive = !!gateM && f.valid && performance.now() - f.stamp < GATE_STALE_MS;
      if (gateLive && gateM && lv.canvas) {
        const cb = lv.canvas.getBoundingClientRect();
        writeGate(gateM, u, f, [cb.left - stageBox.left, cb.top - stageBox.top], markCentre);
        if (!stage.hasAttribute(GATE_ATTR)) stage.setAttribute(GATE_ATTR, "on");
        if (gate.hasAttribute("hidden")) gate.removeAttribute("hidden");
      } else if (stage.hasAttribute(GATE_ATTR)) {
        stage.removeAttribute(GATE_ATTR);
        gate.setAttribute("hidden", "");
      }

      /* The brandmark on the card's back, landing on the live mark. */
      if (u > FLIP_BACK[0] && liveBox.w > 0 && portraitBox) {
        const pose = lerpRect(backFaceStart(portraitBox), liveBox, easedWindow(u, FLIP_BACK));
        mark.style.left = `${pose.x.toFixed(2)}px`;
        mark.style.top = `${pose.y.toFixed(2)}px`;
        mark.style.width = `${pose.w.toFixed(2)}px`;
        mark.style.height = `${pose.h.toFixed(2)}px`;
        mark.style.setProperty(
          "--tw-mark-ry",
          `${flipBackDeg(u, liveTilt(lv.shell)).toFixed(2)}deg`
        );
        if (mark.hidden) mark.hidden = false;
      } else if (!mark.hidden) {
        mark.hidden = true;
      }

      /* The ground opens out of the mark's centre — and the gate hands over
         with it (the morph layer shares the ground's mask). */
      if (liveBox.w > 0) {
        const max = gateHalfMax(markCentre[0], markCentre[1], stageBox.width, stageBox.height);
        stage.style.setProperty("--tw-hx", `${markCentre[0].toFixed(1)}px`);
        stage.style.setProperty("--tw-hy", `${markCentre[1].toFixed(1)}px`);
        stage.style.setProperty("--tw-hs", `${gateHalf(u, max).toFixed(1)}px`);
      }

      if (!full) return;

      /* The About leaves: the card turns, the halo gathers into the mark,
         the fact row closes, the role's hairline retracts. */
      orbit.style.setProperty("--tw-flip", `${flipFrontDeg(u).toFixed(2)}deg`);
      const eHalo = easedWindow(u, PARTICLES_IN);
      orbit.style.setProperty(
        "--tw-pdx",
        `${((markCentre[0] - orbitCentre[0]) * eHalo).toFixed(2)}px`
      );
      orbit.style.setProperty(
        "--tw-pdy",
        `${((markCentre[1] - orbitCentre[1]) * eHalo).toFixed(2)}px`
      );
      orbit.style.setProperty("--tw-ps", (1 - eHalo).toFixed(4));
      orbit.style.setProperty("--tw-pr", `${(160 * eHalo).toFixed(2)}deg`);
      if (u >= ORBIT_OUT_AT) orbit.style.visibility = "hidden";
      else orbit.style.removeProperty("visibility");
      const shut = apertureInset(1 - easedWindow(u, A_BOX_OUT));
      for (const b of boxes) {
        b.style.clipPath = `inset(0 ${shut.toFixed(2)}% 0 ${shut.toFixed(2)}%)`;
      }
      role.style.setProperty("--tw-rule", (1 - easedWindow(u, A_OUT)).toFixed(4));

      /* The live button, on the centre-out aperture. */
      lv.cta?.style.setProperty("--tw-cta", easedWindow(u, CTA_OPEN).toFixed(4));

      if (carrier) writeCarrier(layer, carrier, u);
    };

    const frame = () => {
      raf = 0;
      if (!live || !dom) return;
      if (!dom.about.isConnected) {
        park();
        dom = resolveDom();
        if (!dom) return;
        dirty = true;
      }
      if (!liveDom || !liveDom.shell.isConnected) liveDom = resolveLive(dom.root);
      /* No corridor yet (the chunk is lazy, or the WebGL fallback mounted
         instead): nothing is stamped, and the About stays static. */
      if (!liveDom) {
        if (state) park();
        return;
      }
      compassGateScreenRef.wanted = true;

      const u = turnU(dom.about.getBoundingClientRect().top, layoutViewportHeight());
      const next = turnState(u);
      if (next !== state) {
        dom.root.setAttribute(TURN_ATTR, next);
        if (next === "hold") resetWrites();
        else if (state === "hold" || state === null) remeasure();
        state = next;
      }
      if (next === "hold") {
        lastU = u;
        return;
      }
      if (!carriesThesis && liveDom.block.style.opacity === "1") remeasure();
      const moved = dirty || !(Math.abs(u - lastU) < 0.0005);
      lastU = u;
      dirty = false;
      write(u, moved);
      /* The gate under the drawing keeps moving; so does the drawing. */
      if (next === "run") schedule();
    };

    function schedule() {
      if (!raf) raf = window.requestAnimationFrame(frame);
    }

    const evaluate = () => {
      if (!dom) return;
      const next = mq.matches && timelines && getComputedStyle(dom.stage).position === "sticky";
      if (!next && live) park();
      live = next;
      if (live && state && state !== "hold") remeasure();
      dirty = true;
      schedule();
    };

    let disposed = false;
    evaluate();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", evaluate, { passive: true });
    mq.addEventListener("change", evaluate);
    document.fonts?.ready
      .then(() => {
        if (!disposed) evaluate();
      })
      .catch(() => {});

    return () => {
      disposed = true;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", evaluate);
      mq.removeEventListener("change", evaluate);
      if (raf) window.cancelAnimationFrame(raf);
      park();
    };
  }, []);
}
