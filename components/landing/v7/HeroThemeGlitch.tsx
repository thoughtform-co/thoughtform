"use client";

import { useEffect } from "react";

import {
  coverRect,
  createGlitchPlan,
  glitchFrame,
  GLITCH_DURATION_MS,
  type GlitchBand,
} from "@/lib/key-visual/themeGlitch";
import { readThemeMode, type ThemeMode } from "@/lib/theme/themeModeRef";
import {
  HERO_PLATE_DARK,
  HERO_PLATE_DARK_FALLBACK,
  HERO_PLATE_LIGHT,
} from "@/lib/theme/heroPreload";
import { useThemeStore } from "@/lib/stores/themeStore";

/**
 * The hero key visual's theme-swap glitch (ADR-060).
 *
 * The two plates are swapped by CSS (ADR-058 Update 2) — that flip is a
 * hard cut and stays one. This lays a canvas OVER the hero holding the
 * OUTGOING plate, then tears it away with `lib/key-visual/themeGlitch`, so
 * what the eye follows is a mask above an already-committed cut. Nothing
 * here can leave the hero in a wrong state: the worst failure is the canvas
 * never appearing, which is the hard cut the site had before.
 *
 * ⚠ THE SUBSCRIBER MUST PAINT SYNCHRONOUSLY, and this is the whole trick.
 * `themeStore.setMode` writes the module ref, the `<html>` attribute and
 * localStorage, THEN notifies — all in one task (ADR-058 §2). A zustand
 * listener runs inside that `set`, so the canvas is inserted and drawn
 * before the browser has painted a single frame of the flipped hero. Defer
 * any of it to an effect or a rAF and the new plate flashes for one frame
 * before the glitch starts, which reads as a bug in the swap.
 *
 * ⚠ SUBSCRIBE IMPERATIVELY, NEVER THROUGH RENDER. A `useThemeStore(...)`
 * selector re-renders this component, and React batches — by the time the
 * render lands the frame is gone. It also violates the leaf contract: this
 * is mounted by `LandingPage`, which owns a `dangerouslySetInnerHTML` body
 * with nested roots inside it, so all state stays in here.
 *
 * ⚠ IT DRAWS INTO THE `[data-parallax]` SUBTREE and adds no transform of
 * its own. `.hero__bg` carries the single translate channel (`--py`); the
 * canvas is a child, so it rides the same parallax as the plates it is
 * covering. A second transform here would desync it from them.
 */

/** Inserted before `.hero__video__overlay` so the scrim gradients stay on
 *  top of the effect exactly as they sit on top of the plates. */
const CANVAS_CLASS = "hero-glitch-canvas";

/** Backing-store cap. Two full-bleed plates at DPR 3 is ~50 MB of canvas
 *  for a 640 ms effect; 2 is the cap the retired seam field used too. */
const MAX_DPR = 2;

type Plates = Record<ThemeMode, HTMLImageElement | null>;

const plateSrc = (mode: ThemeMode): string =>
  mode === "light" ? HERO_PLATE_LIGHT : HERO_PLATE_DARK;

/**
 * Load a plate, falling back for the dark AVIF.
 *
 * The `<picture>` in the markup does this natively for the DOM image, but
 * an `Image()` created in script gets no `<source>` negotiation — so a
 * browser without AVIF would silently fail to load the dark plate and the
 * glitch would skip for exactly the users whose hero is the fallback WebP.
 */
function loadPlate(mode: ThemeMode): Promise<HTMLImageElement> {
  const attempt = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(src));
      img.src = src;
    });

  if (mode === "light") return attempt(HERO_PLATE_LIGHT);
  return attempt(HERO_PLATE_DARK).catch(() => attempt(HERO_PLATE_DARK_FALLBACK));
}

export function HeroThemeGlitch({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const bg = root.querySelector<HTMLElement>(".hero__bg");
    if (!bg) return;
    const overlay = bg.querySelector<HTMLElement>(".hero__video__overlay");

    // One-shot read, the LandingPage precedent. A visitor who turns
    // reduced-motion on mid-session gets it on the next load; a listener
    // here would be a subscription in a component that must stay a leaf.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const plates: Plates = { dark: null, light: null };
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    /** Reused mosaic scratch — one small canvas, not one per frame. */
    let scratch: HTMLCanvasElement | null = null;
    let raf = 0;
    let running = false;
    let lastMode = readThemeMode();
    let disposed = false;

    /* ── warm both plates, ON INTENT ───────────────────────────────────
       The outgoing plate must be drawable SYNCHRONOUSLY at flip time, and
       one of the two is never in the DOM: dark mode does not fetch the
       light plate (its CSS rule does not match) and light mode does not
       fetch the dark one (`loading="lazy"` on a `display: none` img never
       intersects). That is exactly the saving ADR-058 Update 2 bought, so
       this must not hand it back.

       ⚠ NOT AN IDLE PREFETCH. Warming both on mount costs EVERY visitor
       the 435 kB plate they are not looking at, to serve the minority who
       toggle. Hovering or focusing the theme switch is the intent signal,
       and it buys enough lead time on any desktop connection.

       Touch has no hover, so the first toggle there usually skips the
       glitch — and then both plates are in the HTTP cache (the flip itself
       fetches the incoming one), so every toggle after the first plays. A
       first-run hard cut is the behaviour the site had anyway. */
    const warm = () => {
      if (disposed) return;
      (["dark", "light"] as const).forEach((mode) => {
        if (plates[mode]) return;
        loadPlate(mode)
          .then((img) => {
            if (!disposed) plates[mode] = img;
          })
          .catch(() => {
            /* The glitch skips; the CSS swap already happened. */
          });
      });
    };

    // The switch lives in `SettingsCluster`, a sibling leaf — reached by
    // its stable class rather than by threading a ref through LandingPage,
    // which must not hold state for either of them.
    const armWarm = () => {
      const toggle = document.querySelector<HTMLElement>(".theme-toggle");
      if (!toggle) return () => {};
      const once = () => {
        warm();
        toggle.removeEventListener("pointerenter", once);
        toggle.removeEventListener("focusin", once);
        toggle.removeEventListener("pointerdown", once);
      };
      toggle.addEventListener("pointerenter", once, { passive: true });
      toggle.addEventListener("focusin", once);
      // Last resort on touch: a few ms of lead is better than none, and on
      // a warm cache it is enough.
      toggle.addEventListener("pointerdown", once, { passive: true });
      return once;
    };
    // The cluster mounts in the same commit; wait a frame for its DOM.
    let disarm: (() => void) | null = null;
    const armRaf = requestAnimationFrame(() => {
      disarm = armWarm();
    });

    const teardown = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      running = false;
      canvas?.remove();
      canvas = null;
      ctx = null;
    };

    const drawPlate = (img: HTMLImageElement, band: GlitchBand, boxW: number, boxH: number) => {
      if (!ctx) return;
      const fit = coverRect(img.naturalWidth, img.naturalHeight, boxW, boxH);
      const dy = band.y0 * boxH;
      const dh = (band.y1 - band.y0) * boxH;

      ctx.save();
      ctx.globalAlpha = band.alpha;
      ctx.beginPath();
      ctx.rect(0, dy, boxW, dh);
      ctx.clip();

      const dx = band.offsetX * boxW;
      if (band.cell <= 1.05) {
        ctx.drawImage(img, fit.x + dx, fit.y, fit.w, fit.h);
      } else {
        // Mosaic: downscale into the scratch canvas, then blow it back up
        // with smoothing off. Drawing the source at 1/cell and scaling up
        // is the cheap way to a hard-edged pixel grid.
        const sw = Math.max(1, Math.round(boxW / band.cell));
        const sh = Math.max(1, Math.round(boxH / band.cell));
        if (!scratch) scratch = document.createElement("canvas");
        scratch.width = sw;
        scratch.height = sh;
        const sctx = scratch.getContext("2d");
        if (sctx) {
          const k = sw / boxW;
          sctx.clearRect(0, 0, sw, sh);
          sctx.drawImage(img, (fit.x + dx) * k, fit.y * k, fit.w * k, fit.h * k);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(scratch, 0, 0, sw, sh, 0, 0, boxW, boxH);
          ctx.imageSmoothingEnabled = true;
        }
      }
      ctx.restore();
    };

    const paint = (elapsed: number, plan: ReturnType<typeof createGlitchPlan>, to: ThemeMode) => {
      if (!ctx || !canvas) return true;
      const from: ThemeMode = to === "light" ? "dark" : "light";
      const oldImg = plates[from];
      const newImg = plates[to];
      if (!oldImg || !newImg) return true;

      const boxW = canvas.clientWidth;
      const boxH = canvas.clientHeight;
      const frame = glitchFrame(plan, elapsed);

      ctx.clearRect(0, 0, boxW, boxH);
      for (const band of frame.bands) {
        drawPlate(band.source === "old" ? oldImg : newImg, band, boxW, boxH);
      }

      if (frame.scanline) {
        // Gold / dawn — the retired seam field's two inks.
        const ink = frame.scanline.mix > 0.5 ? "236, 227, 214" : "176, 139, 66";
        ctx.save();
        ctx.globalAlpha = frame.scanline.alpha;
        ctx.fillStyle = `rgb(${ink})`;
        ctx.fillRect(0, Math.round(frame.scanline.y * boxH), boxW, 1);
        ctx.restore();
      }

      return frame.done;
    };

    const run = (to: ThemeMode) => {
      const from: ThemeMode = to === "light" ? "dark" : "light";

      // The OUTGOING plate has to be ready right now — there is no way to
      // hold the old frame without it, and stalling would show the new
      // plate. The incoming one can still be decoding; it only has to
      // arrive before the first band flips.
      if (!plates[from] || !plates[to]) {
        warm();
        return;
      }

      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.className = CANVAS_CLASS;
        canvas.setAttribute("aria-hidden", "true");
        // Inserted BEFORE the scrim so the gradients stay above it, and
        // `pointer-events: none` because the hero CTAs sit over this box.
        bg.insertBefore(canvas, overlay ?? null);
      }

      const rect = bg.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx = canvas.getContext("2d");
      if (!ctx) {
        teardown();
        return;
      }
      // Work in CSS pixels; the kernel speaks fractions and source pixels.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      Object.assign(canvas.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      } satisfies Partial<CSSStyleDeclaration>);

      const plan = createGlitchPlan(
        // Seed from the direction so the two toggles are not identical.
        to === "light" ? 0x11 : 0x2f,
        { durationMs: GLITCH_DURATION_MS }
      );
      const start = performance.now();
      running = true;

      // Paint the outgoing plate in THIS task — before the browser paints
      // the flipped hero underneath.
      paint(0, plan, to);

      const tick = () => {
        raf = 0;
        if (!running) return;
        const done = paint(performance.now() - start, plan, to);
        if (done) {
          teardown();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const unsubscribe = useThemeStore.subscribe(() => {
      const mode = readThemeMode();
      if (mode === lastMode) return; // hydrateFromDom and no-op notifies
      lastMode = mode;

      if (reduceMotion || document.hidden) return;
      // Past the curtain the hero is `visibility: hidden` (useLandingScroll)
      // — glitching a hero nobody can see is pure cost.
      if (window.scrollY >= window.innerHeight) return;

      if (running) {
        // Mid-run re-toggle: the honest thing is to stop. Snapshotting the
        // canvas as the new "outgoing" plate would compound mosaic on
        // mosaic, and the CSS underneath is already correct.
        teardown();
        return;
      }
      run(mode);
    });

    // If the tab hides mid-run, rAF stops and the canvas would be frozen
    // over the hero until it comes back. Finish immediately instead.
    const onVisibility = () => {
      if (document.hidden && running) teardown();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(armRaf);
      disarm?.();
      teardown();
    };
  }, [containerRef]);

  return null;
}
