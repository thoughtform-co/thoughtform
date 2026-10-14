"use client";

import { useEffect } from "react";

import {
  HERO_PHONE_MEDIA,
  HERO_PLATE_DARK_FALLBACK,
  HERO_PLATE_DARK_MOTION,
  HERO_PLATE_DARK_SIZE,
} from "@/lib/theme/heroPreload";
import { readThemeMode } from "@/lib/theme/themeModeRef";
import { useThemeStore } from "@/lib/stores/themeStore";

/**
 * The dark hero plate in motion (ADR-158).
 *
 * Every hero that paints the house still — the landing and every `LandingPage`
 * arc, each `plate: "gateway"` arc, the sessions page — gets the same plate as a
 * loop, laid over the still inside `.hero__bg`. The still stays what it was: the
 * preloaded LCP element, the light swap's dark side, the glitch's outgoing plate,
 * and the whole hero wherever the loop does not run. The loop only ever ADDS:
 * every failure path (no decoder, a network error, a blocked play) leaves the
 * still, which is the site as it was.
 *
 * It runs only where the landscape still is the picture: dark theme, off the
 * phone rung (≤640 paints the portrait plate, a different frame), no reduced
 * motion, no Save-Data. It starts after `load` and an idle slot so it never
 * competes with the LCP, fades in on its first `playing`, and pauses whenever the
 * hero is off screen, the tab is hidden or the theme flips to light.
 *
 * ⚠ IT FINDS THE STILL BY ITS `src`, NOT BY A PROP. The landing's hero is
 * parse-injected from the prototype HTML (pinned byte-exact by the v7-parse
 * guards), so there is no React node to hand a video to; the arc and sessions
 * heroes carry the same `<picture>`. One reader for all three means a hero that
 * owns its key visual (`data-plate="own"`) is left alone by construction.
 *
 * ⚠ THE VIDEO GOES BEFORE `.hero__video__overlay`, so the scrims stay on top of
 * it exactly as they sit on the still, and the glitch canvas (inserted before the
 * overlay later) covers it during a swap. It adds no transform: `.hero__bg`
 * carries the parallax channel, and a child rides it.
 *
 * ⚠ A LEAF, NO STATE: mounted beside `HeroThemeGlitch` in `LandingPage`, which
 * owns a `dangerouslySetInnerHTML` body; the theme is read imperatively.
 */

const VIDEO_CLASS = "hero__motion";
const LIVE_CLASS = "is-live";

type Idle = (cb: () => void, opts?: { timeout: number }) => number;
type Source = (typeof HERO_PLATE_DARK_MOTION)[number];

/**
 * The first source this device decodes WELL: a power-efficient (hardware) decode
 * if any source has one, else a smooth one, else the first it can play at all.
 * AV1 is the smaller file, but at 2912 wide a software AV1 decode is real CPU on
 * an older laptop whose H.264 decoder is hardware, so `canPlayType` alone would
 * pick the costlier stream there.
 */
async function choose(probe: HTMLVideoElement): Promise<Source | undefined> {
  const playable = HERO_PLATE_DARK_MOTION.filter((s) => probe.canPlayType(s.type) !== "");
  const mc = navigator.mediaCapabilities;
  if (!mc || playable.length < 2) return playable[0];
  const infos = await Promise.all(
    playable.map((s) =>
      mc
        .decodingInfo({
          type: "file",
          video: {
            contentType: s.type,
            width: HERO_PLATE_DARK_SIZE.width,
            height: HERO_PLATE_DARK_SIZE.height,
            bitrate: s.bitrate,
            framerate: 24,
          },
        })
        .catch(() => null)
    )
  );
  return (
    playable.find((_, i) => infos[i]?.powerEfficient) ??
    playable.find((_, i) => infos[i]?.smooth) ??
    playable[0]
  );
}

export function HeroPlateMotion({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const bg = root.querySelector<HTMLElement>(".hero__bg");
    const still = bg?.querySelector<HTMLImageElement>(
      `picture img[src="${HERO_PLATE_DARK_FALLBACK}"]`
    );
    const picture = still?.closest("picture");
    if (!bg || !still || !picture) return;
    // One-shot reads, the HeroThemeGlitch precedent: a visitor who turns either
    // on mid-session gets the still on the next load.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;

    const phone = window.matchMedia(HERO_PHONE_MEDIA);
    const hero = bg.closest<HTMLElement>(".hero") ?? bg;
    let video: HTMLVideoElement | null = null;
    let mounting = false;
    let started = false;
    let failed = false;
    let visible = true;
    let disposed = false;
    let cancelIdle = () => {};

    const wanted = () =>
      started && !failed && !document.hidden && visible && !phone.matches && readThemeMode() === "dark";

    const mount = async () => {
      mounting = true;
      const v = document.createElement("video");
      const pick = await choose(v);
      mounting = false;
      if (disposed) return;
      if (!pick) {
        failed = true;
        return;
      }
      v.className = VIDEO_CLASS;
      v.muted = true;
      v.defaultMuted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute("muted", "");
      v.setAttribute("playsinline", "");
      v.setAttribute("aria-hidden", "true");
      v.disablePictureInPicture = true;
      v.preload = "auto";
      v.addEventListener("playing", () => v.classList.add(LIVE_CLASS), { once: true });
      v.addEventListener("error", () => {
        failed = true;
        v.remove();
        video = null;
      });
      v.src = pick.src;
      picture.after(v);
      video = v;
      sync();
    };

    const sync = () => {
      if (disposed) return;
      if (!wanted()) {
        video?.pause();
        return;
      }
      if (!video) {
        if (!mounting) void mount();
        return;
      }
      // A refused play (an autoplay policy, a decoder that gave up) keeps the still.
      video.play().catch(() => undefined);
    };

    const start = () => {
      started = true;
      sync();
    };
    const afterLoad = () => {
      const w = window as Window & { requestIdleCallback?: Idle; cancelIdleCallback?: (id: number) => void };
      if (w.requestIdleCallback && w.cancelIdleCallback) {
        const id = w.requestIdleCallback(start, { timeout: 3000 });
        cancelIdle = () => w.cancelIdleCallback?.(id);
      } else {
        const id = window.setTimeout(start, 1200);
        cancelIdle = () => window.clearTimeout(id);
      }
    };
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      sync();
    });
    io.observe(hero);
    const unsubscribe = useThemeStore.subscribe(sync);
    phone.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      disposed = true;
      window.removeEventListener("load", afterLoad);
      cancelIdle();
      io.disconnect();
      unsubscribe();
      phone.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        video.remove();
      }
    };
  }, [containerRef]);

  return null;
}
