/* The one reader of the page. Everything else here is arithmetic.

   The swarm's canvas is sticky: it scrolls in with the opening, holds still
   on the screen through both hops and both pins, and scrolls away with the
   network's last screen. So in the canvas's own space every figure has ONE
   place, the place it stands while its section is at rest, and a frame reads
   nothing from the page but how far it has scrolled.

   Three boxes are read where they stand in the document (the opening, which
   is not pinned). The other two are read against their own pin, which is the
   screen while it holds. */

import { DARK, parseRgb, type Tones } from "./palette";
import type { Box, Metrics } from "./world";

/** The canvas never draws finer than two device px a CSS px (S4·E's cap). */
export const dprNow = () => Math.min(window.devicePixelRatio || 1, 2);

export function measure(track: HTMLElement): Metrics | null {
  const q = (sel: string) => document.querySelector<HTMLElement>(sel);
  const flowStage = q(".psw .shf-stage");
  const flowFig = q(".psw .shf .pl-fig");
  /* the opening's hold: its runway, and the screen that stays put in it */
  const hold = q(".psw-hold");
  const flowPin = hold?.querySelector<HTMLElement>(":scope > .xb-sec") ?? null;
  const es = q(".psw .es-runway");
  const esPin = q(".psw .es-pin");
  const esStage = q(".psw .es-stage");
  const xn = q(".psw .xn");
  const xnPin = q(".psw .xn-pin");
  const xnFig = q(".psw .xn-fig");
  if (!flowStage || !flowFig || !es || !esPin || !esStage || !xn || !xnPin || !xnFig) return null;

  const y = window.scrollY;
  const vh = window.innerHeight;
  const left = track.getBoundingClientRect().left;
  const esBox = es.getBoundingClientRect();
  const xnBox = xn.getBoundingClientRect();
  const esTop = esBox.top + y;
  const xnTop = xnBox.top + y;
  /* the canvas starts where the opening comes to rest: at the top of its
     hold, or, on a page without one, a screen above the steps' runway */
  const top = hold ? hold.getBoundingClientRect().top + y : esTop - vh;
  const atRest = (el: HTMLElement): Box => {
    const r = el.getBoundingClientRect();
    return { x: r.left - left, y: r.top + y - top, w: r.width, h: r.height };
  };
  const inPin = (el: HTMLElement, pin: HTMLElement): Box => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left - left,
      y: r.top - pin.getBoundingClientRect().top,
      w: r.width,
      h: r.height,
    };
  };
  return {
    vh,
    dpr: dprNow(),
    runways: { top, esTop, esH: esBox.height, xnTop, xnH: xnBox.height },
    flowStage: flowPin ? inPin(flowStage, flowPin) : atRest(flowStage),
    flowFig: flowPin ? inPin(flowFig, flowPin) : atRest(flowFig),
    esStage: inPin(esStage, esPin),
    xnFig: inPin(xnFig, xnPin),
  };
}

/** Where the track has to stand in its section for the canvas to hold from
    the opening's rest to the network's last screen: its top and height in
    px, against the section's own top. */
export function trackBox(track: HTMLElement, m: Metrics): { top: number; height: number } {
  const parent = track.offsetParent as HTMLElement | null;
  const parentTop = (parent?.getBoundingClientRect().top ?? 0) + window.scrollY;
  const top = m.runways.top ?? m.runways.esTop - m.vh;
  return { top: top - parentTop, height: m.runways.xnTop + m.runways.xnH - top };
}

/** The page's four colours, as the theme has them now. */
export function readTones(el: HTMLElement): Tones {
  const css = getComputedStyle(el);
  const v = (name: string) => css.getPropertyValue(name);
  return {
    ground: parseRgb(v("--void-rgb"), DARK.ground),
    bone: parseRgb(v("--dawn-rgb"), DARK.bone),
    gold: parseRgb(v("--gold-ink"), DARK.gold),
    green: parseRgb(v("--atreides-ink"), DARK.green),
  };
}
