"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BRAIN_VIEW_FRONT, BRAIN_VIEW_ISO, brainIsoBox, brainIsoPoint, type BrainIsoBox } from "@/components/arcs/figures/foundation/brainIso";
import { directionOf, type MindLive, type MindOptions } from "./directions";
import { sidesFarFirst, TONES } from "./hull";

/** How far each half moves out along L when the brain parts, brain units
    (the act's `LAYER_PART`). */
const PART = 175;

interface Part {
  opts: MindOptions;
  dx: number;
  dy: number;
}

/**
 * One direction drawn the way the act draws the brain: the picture (a pure
 * SVG string) rasterised once through a Blob into an image and painted into
 * a canvas, its live layer painted round it on the clock, never the frame.
 * Parted, the two halves move out along L, the far one painted first.
 */
export function MindStage({ id, front = false, light = false, parted = false, still = false, t: frozen, label }: { id: string; front?: boolean; light?: boolean; parted?: boolean; still?: boolean; t?: number; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const d = directionOf(id);

  const { box, parts } = useMemo(() => {
    const view = front ? BRAIN_VIEW_FRONT : BRAIN_VIEW_ISO;
    const base: MindOptions = { view, light, tones: TONES[light ? "light" : "dark"] };
    const B: BrainIsoBox = d?.box?.(base) ?? brainIsoBox(view);
    if (!parted) return { box: B, parts: [{ opts: base, dx: 0, dy: 0 }] as Part[] };
    const o = brainIsoPoint(0, 0, 0, view);
    const l1 = brainIsoPoint(1, 0, 0, view);
    const ux = (l1[0] - o[0]) * PART;
    const uy = (l1[1] - o[1]) * PART;
    const pad = 24;
    const wide: BrainIsoBox = { x0: B.x0 - Math.abs(ux) - pad, x1: B.x1 + Math.abs(ux) + pad, y0: B.y0 - Math.abs(uy) - pad, y1: B.y1 + Math.abs(uy) + pad };
    return { box: wide, parts: sidesFarFirst(view).map((s) => ({ opts: { ...base, only: s }, dx: s * ux, dy: s * uy })) };
  }, [d, front, light, parted]);

  useEffect(() => {
    const el = canvas.current;
    if (!el || !d) return;
    let alive = true;
    let raf = 0;
    const urls: string[] = [];
    const pictureBox = d.box?.(parts[0].opts) ?? brainIsoBox(parts[0].opts.view);
    const lives: (MindLive | null)[] = parts.map((p) => d.live?.(p.opts) ?? null);
    const animated = lives.some(Boolean) && !still && frozen === undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const images: HTMLImageElement[] = [];

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(el.clientWidth * dpr));
      const h = Math.max(1, Math.round(el.clientHeight * dpr));
      if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
      }
    };
    const paint = (t: number) => {
      const ctx = el.getContext("2d");
      if (!ctx) return;
      size();
      const px = el.width / (box.x1 - box.x0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, el.width, el.height);
      const seat = (p: Part) => ctx.setTransform(px, 0, 0, px, (p.dx - box.x0) * px, (p.dy - box.y0) * px);
      parts.forEach((p, i) => {
        const live = lives[i];
        if (!live?.under) return;
        ctx.save();
        seat(p);
        live.under(ctx, t, px);
        ctx.restore();
      });
      parts.forEach((p, i) => {
        ctx.save();
        seat(p);
        ctx.drawImage(images[i], pictureBox.x0, pictureBox.y0, pictureBox.x1 - pictureBox.x0, pictureBox.y1 - pictureBox.y0);
        lives[i]?.over?.(ctx, t, px);
        ctx.restore();
      });
    };
    const clock = () => (frozen !== undefined ? frozen : reduced ? 0 : (performance.now() - start) / 1000);

    let inView = true;
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView && animated && !reduced && !raf) raf = requestAnimationFrame(loop);
    });
    function loop() {
      raf = 0;
      if (!alive) return;
      paint(clock());
      if (animated && !reduced && inView && !document.hidden) raf = requestAnimationFrame(loop);
    }
    const ro = new ResizeObserver(() => {
      if (images.length === parts.length) paint(clock());
    });

    (async () => {
      for (const p of parts) {
        const url = URL.createObjectURL(new Blob([d.svg(p.opts)], { type: "image/svg+xml" }));
        urls.push(url);
        const img = new Image();
        img.src = url;
        await img.decode().catch(() => undefined);
        images.push(img);
      }
      if (!alive) return;
      paint(clock());
      setReady(true);
      ro.observe(el);
      io.observe(el);
      if (animated && !reduced) raf = requestAnimationFrame(loop);
    })();
    const onVisible = () => {
      if (!document.hidden && animated && !reduced && !raf) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      urls.forEach((u) => URL.revokeObjectURL(u));
      setReady(false);
    };
  }, [d, box, parts, still, frozen]);

  const w = box.x1 - box.x0;
  const h = box.y1 - box.y0;
  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={label}
      data-mm-stage={id}
      data-mm-ready={ready ? "" : undefined}
      style={{ display: "block", width: `min(100%, calc(84svh * ${(w / h).toFixed(4)}))`, aspectRatio: `${w} / ${h}`, margin: "0 auto" }}
    />
  );
}
