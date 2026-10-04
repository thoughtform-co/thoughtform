"use client";

import { useEffect, useRef } from "react";

import type { ArcClip } from "@/lib/arcs/types";

/**
 * ArcClipLoop — an interstitial's silent loop (ADR-143 U7): the GIF of a
 * deck, as a video, because a GIF of a film clip is several megabytes and
 * cannot be paused.
 *
 * ⚠ THE ONE AUTOPLAYING PICTURE ON THE ARCS, AND ITS TERMS. `.claude/rules/
 * arcs.md` says videos are `preload="none"` with a poster and never
 * autoplay; this is the owner's GIF, so it loops — but only while it is in
 * view, muted, and never under reduced motion, where the poster stands.
 * Nothing loads until it is near the frame (`preload` lifts on arrival).
 *
 * ⚠ `muted` IS SET ON THE ELEMENT, NOT ONLY AS A PROP. React does not write
 * the `muted` attribute into server markup, and a browser's autoplay policy
 * reads the property at `play()`.
 */
export function ArcClipLoop({ clip }: { clip: ArcClip }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.muted = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.preload = "auto";
          void video.play().catch(() => {
            /* A refused play leaves the poster, which is the fallback anyway. */
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="arc-inter__video"
      src={clip.src}
      poster={clip.poster}
      aria-label={clip.alt}
      muted
      loop
      playsInline
      preload="none"
    />
  );
}
