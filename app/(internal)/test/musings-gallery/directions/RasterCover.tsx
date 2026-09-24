"use client";

import { useEffect, useRef, type RefObject } from "react";

import { REVEAL_DAMP_RATE } from "@/lib/services-ring/reveal";
import { slugSeed } from "@/lib/musings/cover";

import {
  GLYPH_ADVANCE,
  GLYPH_CELL_CSS,
  GLYPH_STROKE_BOOST,
  POP_CELL_CSS,
  cellStats,
  drawGlyphs,
  meanInk,
  revealFrame,
} from "./glyphRaster";
import type { GalleryPost } from "./kit";
import { DRAWN_KINDS, NoteCover, type CoverKind } from "./NoteCover";

/**
 * A note's cover under ADR-112's treatment: GLYPHS AT REST, resolving into
 * the clean drawing through a pixel mosaic while the reader is on its card
 * (the services portrait's own verb, "hover resolves the photograph").
 *
 * The drawing is the live `NoteCover` SVG — rastered, never re-drawn: its
 * computed paint is copied onto a clone, the clone is drawn to a CLEAN
 * canvas, the clean canvas is lettered into a GLYPH canvas, and one visible
 * canvas composes the two at the reveal level (`glyphRaster.revealFrame`).
 * The cover's DOM labels are never rastered: they stay crisp over it, the
 * way the services card keeps its two type bands crisp.
 *
 * ⚠ THE LEVEL IS A BOUNDED BURST, NEVER A LOOP (ADR-021's pointer-damped
 * class): it damps at the ring's `REVEAL_DAMP_RATE` toward 1 while the
 * pointer or the focus is inside the card (`[data-mg-raster-host]`) and toward
 * 0 when it leaves, and stops within 0.002.
 * ⚠ NO FLASH (ADR-097 U12): the transition is monotonic, about a second, one
 * way per gesture; `data-mg-ink-rest` / `-clean` let the capture compare the
 * two states' mean ink.
 * ⚠ NO SCRIPT, REDUCED MOTION, OR A COVER WITH NO SINGLE DRAWING (`raster`,
 * `field`): the clean SVG shows and there is no canvas — `data-mg-raster`
 * reads `off`, the server-rendered state.
 *
 * Stamps, on the wrapper: `data-mg-raster` = `off|rest|resolving|clean`,
 * `data-mg-level`, `data-mg-ink-rest`, `data-mg-ink-clean`.
 */
export function RasterCover({
  post,
  posts,
  kind,
}: {
  post: GalleryPost;
  posts: readonly GalleryPost[];
  kind: CoverKind;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawn = DRAWN_KINDS.includes(kind);
  useGlyphRaster(ref, canvasRef, drawn ? post.slug : null);
  return (
    <div className="mg-rc" ref={ref} data-mg-raster="off">
      <NoteCover post={post} posts={posts} kind={kind} />
      {drawn ? <canvas className="mg-rc__canvas" ref={canvasRef} aria-hidden="true" /> : null}
    </div>
  );
}

/** The paint an SVG element carries, as a clone must carry it inline — a
 *  serialised SVG has no stylesheet, so every `var()` and class is lost. */
const PAINT = [
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "fill",
  "fill-opacity",
  "opacity",
  "display",
] as const;

/** The live SVG, cloned with its computed paint inlined, sized `w × h` px.
 *  ⚠ A NON-SCALING STROKE IS IN THE IMAGE'S PIXELS, so it is multiplied by
 *  the device ratio or a retina canvas draws every hairline half as thick. */
function inlineSvg(svg: SVGSVGElement, w: number, h: number, dpr: number, boost = 1): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const src = [svg, ...svg.querySelectorAll("*")];
  const dst = [clone, ...clone.querySelectorAll("*")];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const out = dst[i] as SVGElement;
    const decl: string[] = [];
    for (const k of PAINT) {
      let v = cs.getPropertyValue(k);
      if (k === "stroke-width") {
        const fixed = cs.getPropertyValue("vector-effect") === "non-scaling-stroke";
        v = `${parseFloat(v) * (fixed ? dpr : 1) * boost}px`;
      }
      if (
        k === "stroke-dasharray" &&
        v !== "none" &&
        cs.getPropertyValue("vector-effect") === "non-scaling-stroke"
      ) {
        v = v
          .split(/[\s,]+/)
          .map((n) => `${parseFloat(n) * dpr}px`)
          .join(" ");
      }
      decl.push(`${k}:${v}`);
    }
    decl.push(`vector-effect:${cs.getPropertyValue("vector-effect")}`);
    decl.push("visibility:visible");
    out.setAttribute("style", decl.join(";"));
    out.removeAttribute("class");
  });
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  return new XMLSerializer().serializeToString(clone);
}

async function svgToCanvas(xml: string, canvas: HTMLCanvasElement): Promise<void> {
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The mono family as the page resolved it — next/font names it, so it is
 *  read off a probe rather than spelled. */
function monoFamily(host: HTMLElement): string {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;font-family:var(--font-pt-mono)";
  host.appendChild(probe);
  const f = getComputedStyle(probe).fontFamily;
  probe.remove();
  return f || "monospace";
}

function useGlyphRaster(
  rootRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  slug: string | null
) {
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || !slug) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const clean = document.createElement("canvas");
    const glyphs = document.createElement("canvas");
    const scratch = document.createElement("canvas");
    /* What the glyphs READ: the same drawing with every stroke fattened, so a
       hairline ring letters as a band of glyphs rather than a scatter. */
    const signal = document.createElement("canvas");
    const seed = slugSeed(slug);
    let level = 0;
    let target = 0;
    let raf = 0;
    let last = 0;
    let baked = false;
    let popSide = POP_CELL_CSS;
    let bakeId = 0;
    let disposed = false;

    const stamp = () => {
      const state = !baked ? "off" : level <= 0 ? "rest" : level >= 1 ? "clean" : "resolving";
      if (root.dataset.mgRaster !== state) root.dataset.mgRaster = state;
      root.dataset.mgLevel = level <= 0 ? "0" : level >= 1 ? "1" : level.toFixed(3);
    };
    const paint = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx || !baked) return;
      if (level <= 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(glyphs, 0, 0);
      } else if (level < 1) {
        revealFrame(ctx, glyphs, clean, scratch, level, seed, popSide);
      }
      stamp();
    };

    const bake = async () => {
      const id = ++bakeId;
      const svg = root.querySelector<SVGSVGElement>(".mg-cover__dial > svg");
      if (!svg) return;
      const box = svg.getBoundingClientRect();
      const rootBox = root.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(box.width * dpr);
      const h = Math.round(box.height * dpr);
      canvas.style.left = `${box.left - rootBox.left}px`;
      canvas.style.top = `${box.top - rootBox.top}px`;
      canvas.style.width = `${box.width}px`;
      canvas.style.height = `${box.height}px`;
      for (const c of [canvas, clean, glyphs, signal]) {
        c.width = w;
        c.height = h;
      }
      await document.fonts.ready;
      const family = monoFamily(root);
      const cellH = GLYPH_CELL_CSS * dpr;
      await document.fonts.load(`${cellH}px ${family}`).catch(() => []);
      await svgToCanvas(inlineSvg(svg, w, h, dpr), clean);
      await svgToCanvas(inlineSvg(svg, w, h, dpr, GLYPH_STROKE_BOOST), signal);
      if (disposed || id !== bakeId) return;
      const cctx = clean.getContext("2d", { willReadFrequently: true });
      const sctx = signal.getContext("2d", { willReadFrequently: true });
      const gctx = glyphs.getContext("2d");
      if (!cctx || !sctx || !gctx) return;
      const data = cctx.getImageData(0, 0, w, h).data;
      const rows = Math.max(8, Math.round(h / cellH));
      const cols = Math.max(8, Math.round(w / (cellH * GLYPH_ADVANCE)));
      const sig = sctx.getImageData(0, 0, w, h).data;
      drawGlyphs(gctx, cellStats(sig, w, h, cols, rows), w, h, `${cellH}px ${family}`);
      root.dataset.mgInkClean = meanInk(data).toFixed(4);
      root.dataset.mgInkRest = meanInk(gctx.getImageData(0, 0, w, h).data).toFixed(4);
      popSide = POP_CELL_CSS * dpr;
      baked = true;
      paint();
    };

    const step = (t: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
      last = t;
      level += (target - level) * (1 - Math.exp(-REVEAL_DAMP_RATE * dt));
      if (Math.abs(target - level) < 0.002) level = target;
      paint();
      if (level !== target) raf = requestAnimationFrame(step);
      else last = 0;
    };
    const aim = (to: number) => {
      target = to;
      if (!baked) {
        level = to;
        return;
      }
      if (!raf && level !== target) raf = requestAnimationFrame(step);
    };

    const host = root.closest<HTMLElement>("[data-mg-raster-host]") ?? root;
    const onEnter = () => aim(1);
    const onLeave = () => aim(0);
    const onFocusOut = (e: FocusEvent) => {
      if (!host.contains(e.relatedTarget as Node | null)) aim(0);
    };
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("focusin", onEnter);
    host.addEventListener("focusout", onFocusOut);

    let resizeRaf = 0;
    const rebake = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        void bake();
      });
    };
    const svg = root.querySelector(".mg-cover__dial > svg");
    const ro = new ResizeObserver(rebake);
    if (svg) ro.observe(svg);
    /* The theme swaps every resolved colour, so the raster is baked again. */
    const mo = new MutationObserver(rebake);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    void bake();

    return () => {
      disposed = true;
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("focusin", onEnter);
      host.removeEventListener("focusout", onFocusOut);
      ro.disconnect();
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      root.dataset.mgRaster = "off";
    };
  }, [rootRef, canvasRef, slug]);
}
