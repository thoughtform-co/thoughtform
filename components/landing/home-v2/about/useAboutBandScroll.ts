"use client";

import { useEffect } from "react";

import {
  measureDecodeLayer,
  mountDecodeLayer,
  setDecodeLayerLive,
  unmountDecodeLayer,
  writeDecodeRun,
  type DecodeRunSpec,
} from "../decodeLayer";
import { BAKE_SCALE_MOBILE_BACK } from "../services/hologram/ringCtaBox";
import {
  ABOUT_BAND_COPY_WINDOW,
  ABOUT_BAND_DONE,
  ABOUT_BAND_NAME_WINDOW,
  ABOUT_BAND_OPEN_IN,
  ABOUT_BAND_OPEN_OUT,
  ABOUT_BAND_SLOT_MIN_PX,
  aboutBandCopyT,
  aboutBandNameT,
  aboutBandProgress,
} from "@/lib/services-ring/aboutBandMath";
import { PORTRAIT_BACK_SRC, portraitBakeFor } from "@/lib/services-ring/portraitBake";
import { aboutStageProgressRef } from "@/lib/services-ring/aboutStageProgressRef";
import { invalidateAboutSlot, writeAboutSlotRect } from "@/lib/services-ring/aboutSlotRef";
import { useThemeStore } from "@/lib/stores/themeStore";
import { readThemeMode, type ThemeMode } from "@/lib/theme/themeModeRef";
import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";

/**
 * useAboutBandScroll — the phone's about BAND, written (ADR-115).
 *
 * On the ring rung `#about` is a sticky band inside a runway (about-band.css,
 * keyed on the `data-about-band="on"` this writer stamps): the deck FLIPS to
 * the portrait on the about clock, the name and the role SCRAMBLE in, the
 * first paragraph TYPES in, the band holds for reading, and at the runway's
 * end the WebGL portrait hands over to a DOM image of the SAME bake so the
 * band can scroll away as a document. One writer for the station: it owns
 *
 *   · `aboutStageProgressRef` — the ring's flip clock, the desktop stage's
 *     own ref (that stage never engages on this rung, so the ref is free);
 *   · `aboutSlotRef` — the seat the deck lands on, measured per frame while
 *     the runway intersects the viewport (ADR-047 U2's gate);
 *   · the band's stamps: `data-vw-name` / `data-vw-copy` (`pending` →
 *     `decode` → `1`, ADR-103's `headState`: the real text is hidden until
 *     its window and shown after it; the leaves paint only in between),
 *     `data-about-deck` (`live` while the WebGL deck owns the seat, `done`
 *     from `ABOUT_BAND_DONE` — and at once when no ring is live), and
 *     `data-about-slot="hidden"` when the seat is under the portrait floor;
 *   · the decode layer (per-line leaves over the centred runs);
 *   · `data-bio-open` — the rest of the bio, unfolded ON THE CLOCK past
 *     `ABOUT_BAND_OPEN_IN` and folded under `ABOUT_BAND_OPEN_OUT` (ADR-115
 *     U2; the chevron that toggled it is gone — one owner);
 *   · the portrait's blob.
 *
 * ⚠ THE PORTRAIT IS THE BAKE, NOT THE PHOTO. `portraitBakeFor` is the memo
 * the ring's phone profile reads too; this side turns the canvas into a
 * blob URL on the `<picture>`'s phone source. Asked for two viewports out so
 * it is ready before the flip; re-baked on a theme flip.
 *
 * ⚠ `layoutViewportHeight()`, never `innerHeight` (ADR-113 §2).
 */

type RunState = "pending" | "decode" | "1";

function runState(p: number, window: readonly [number, number]): RunState {
  if (p < window[0]) return "pending";
  if (p >= window[1]) return "1";
  return "decode";
}

/** Write an attribute only when it changes (a read costs no layout). */
function setAttr(el: Element, name: string, value: string | null): void {
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== value) {
    el.setAttribute(name, value);
  }
}

/** How long the rest's grid transition runs (about-band.css: 420ms) plus a
 *  frame either side — the writer re-measures the seat every frame of it,
 *  because no scroll fires while the row grows and the deck must follow;
 *  and re-measures the decode's lines, because a fold under `OPEN_OUT`
 *  moves the paragraph the leaves are posed on while it may still be
 *  un-typing. */
const REST_PULSE_MS = 520;

export function useAboutBandScroll(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const about = document.getElementById("about");
    const band = about?.querySelector<HTMLElement>(":scope > .voidwalker") ?? null;
    if (!about || !band) return;
    /* ADR-123: the drawer and the hash anchor land on SEATS, not stations —
       `#about`'s is the reading state. Stamped where the band is resolved;
       off the band rung the target is `display: none` and the resolver falls
       back to the station. */
    about.querySelector<HTMLElement>(".voidwalker__snap")?.setAttribute("data-station-seat", "");

    const name = band.querySelector<HTMLElement>(".voidwalker__name");
    const role = band.querySelector<HTMLElement>(".voidwalker__role");
    const copy = band.querySelector<HTMLElement>(".voidwalker__copy > .voidwalker__bio");
    const slot = band.querySelector<HTMLElement>(".voidwalker__orbit__portrait");
    const source = slot?.querySelector<HTMLSourceElement>("source") ?? null;
    const img = slot?.querySelector<HTMLImageElement>("img") ?? null;
    const sourceSrcset = source?.getAttribute("srcset") ?? null;
    const imgSrc = img?.getAttribute("src") ?? null;

    const specs: DecodeRunSpec[] = [];
    if (name) specs.push({ el: name, mode: "scramble" });
    if (role) specs.push({ el: role, mode: "scramble" });
    if (copy) specs.push({ el: copy, mode: "type" });
    const layer = mountDecodeLayer(band, "voidwalker__decode");

    let disposed = false;
    let frame = 0;
    let pulseUntil = 0;
    let measured = false;
    /** The rest of the bio: open past `ABOUT_BAND_OPEN_IN`, folded again
     *  under `ABOUT_BAND_OPEN_OUT`. Module state, one owner. */
    let open = false;
    let lastP = -1;
    let bakeUrl: string | null = null;
    let bakedFor: ThemeMode | null = null;

    setAttr(about, "data-about-band", "on");
    aboutStageProgressRef.current.engaged = true;

    const measure = () => {
      measureDecodeLayer(layer, band, specs, "voidwalker__decode__line");
      measured = true;
    };

    /* The portrait: ONE bake with the ring (the memo), shown as a blob on
       the picture's phone source. A theme flip re-bakes; the old URL goes. */
    const bake = (mode: ThemeMode) => {
      if (!source || !img || disposed) return;
      if (bakedFor === mode) return;
      bakedFor = mode;
      portraitBakeFor(mode, BAKE_SCALE_MOBILE_BACK, true).then((canvas) => {
        if (disposed || bakedFor !== mode) return;
        canvas.toBlob((blob) => {
          if (!blob || disposed || bakedFor !== mode) return;
          if (bakeUrl) URL.revokeObjectURL(bakeUrl);
          bakeUrl = URL.createObjectURL(blob);
          source.srcset = bakeUrl;
          img.src = bakeUrl;
          setAttr(about, "data-about-portrait", "baked");
        }, "image/png");
      });
    };
    const unsubscribeTheme = useThemeStore.subscribe((state, prev) => {
      if (state.mode !== prev.mode && bakedFor) bake(state.mode);
    });

    const write = () => {
      frame = 0;
      if (disposed) return;
      const vh = layoutViewportHeight();
      const r = about.getBoundingClientRect();
      /* ADR-115 U1: the band is 100dvh and the station 240svh, so the pinned
         travel is `station − band`, measured — the band's box is what pins. */
      const p = aboutBandProgress(r.top, r.height, band.getBoundingClientRect().height);
      aboutStageProgressRef.current.progress = p;
      aboutStageProgressRef.current.engaged = true;

      // The ask, two viewports out — before the flip can need it.
      if (!bakedFor && r.top < vh * 2) bake(readThemeMode());

      const ringLive = document.documentElement.getAttribute("data-card-ring-live") === "on";
      setAttr(about, "data-about-deck", ringLive && p < ABOUT_BAND_DONE ? "live" : "done");

      const nameState = runState(p, ABOUT_BAND_NAME_WINDOW);
      const copyState = runState(p, ABOUT_BAND_COPY_WINDOW);
      setAttr(about, "data-vw-name", nameState);
      setAttr(about, "data-vw-copy", copyState);
      const nameLive = nameState === "decode";
      const copyLive = copyState === "decode";
      /* The rest unfolds ON THE CLOCK (ADR-115 U2): a hysteresis, so a rest
         on the threshold never flickers it. The grid transition runs after
         the scroll stops, so the writer keeps posing the deck for the pulse
         and re-measures the lines through it (the seat gives up height,
         the copy rises). The first synchronous `write()` lands the attribute
         with `data-about-band`, so a deep reload paints open, untransitioned. */
      const want = open ? p > ABOUT_BAND_OPEN_OUT : p >= ABOUT_BAND_OPEN_IN;
      if (want !== open) {
        open = want;
        setAttr(band, "data-bio-open", open ? "1" : null);
        measured = false;
        pulseUntil = performance.now() + REST_PULSE_MS;
      }
      if ((nameLive || copyLive) && (!measured || performance.now() < pulseUntil)) measure();
      const nameT = aboutBandNameT(p);
      const copyT = aboutBandCopyT(p);
      for (const run of layer.runs) {
        const isCopy = run.spec.el === copy;
        writeDecodeRun(run, isCopy ? copyT : nameT, "in", isCopy ? copyLive : nameLive);
      }
      setDecodeLayerLive(layer, nameLive || copyLive);

      if (Math.abs(p - lastP) >= 0.0005) {
        about.style.setProperty("--about-band-p", p.toFixed(4));
        lastP = p;
      }

      /* The seat — only while the runway intersects the viewport (`write`
         runs on every page scroll, and this gBCR after the writes above
         forces a layout the deck only needs inside its own band). Under the
         floor the slot is invalid and the DOM portrait hides with it. */
      if (slot && r.bottom > 0 && r.top < vh) {
        const s = slot.getBoundingClientRect();
        if (s.height >= ABOUT_BAND_SLOT_MIN_PX && s.width > 1) {
          writeAboutSlotRect(
            s.left + s.width / 2,
            s.top + s.height / 2,
            s.width,
            s.height,
            performance.now()
          );
          setAttr(about, "data-about-slot", null);
        } else {
          invalidateAboutSlot();
          setAttr(about, "data-about-slot", "hidden");
        }
      }

      if (performance.now() < pulseUntil) requestWrite();
    };
    const requestWrite = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    const onResize = () => {
      measured = false;
      requestWrite();
    };
    const onVisibility = () => {
      if (!document.hidden) write();
    };
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    write();

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribeTheme();
      unmountDecodeLayer(layer);
      for (const attr of [
        "data-about-band",
        "data-about-deck",
        "data-vw-name",
        "data-vw-copy",
        "data-about-slot",
        "data-about-portrait",
      ]) {
        about.removeAttribute(attr);
      }
      about.style.removeProperty("--about-band-p");
      band.removeAttribute("data-bio-open");
      if (source) {
        if (sourceSrcset) source.setAttribute("srcset", sourceSrcset);
        else source.removeAttribute("srcset");
      }
      if (img && imgSrc) img.setAttribute("src", imgSrc);
      if (bakeUrl) URL.revokeObjectURL(bakeUrl);
      aboutStageProgressRef.current.progress = 0;
      aboutStageProgressRef.current.engaged = false;
      invalidateAboutSlot();
    };
  }, [active]);
}

/** Exported for the smoke: the source the phone picture carries before the
 *  bake lands (the same photo the bake cover-fits). */
export const ABOUT_BAND_PORTRAIT_SRC = PORTRAIT_BACK_SRC;
