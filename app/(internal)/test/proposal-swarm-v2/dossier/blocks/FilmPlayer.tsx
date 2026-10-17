"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

/**
 * The piece itself: muted, playing only while it is on screen and never under
 * reduced motion (the house's one silent loop), with a square sound switch.
 * In a still the poster stands and nothing plays.
 */
export function FilmPlayer({
  src,
  poster,
  ratio,
  alt,
  sound,
  still,
}: {
  src: string;
  poster: string;
  ratio: string;
  alt: string;
  sound: boolean;
  still: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [heard, setHeard] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || still) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.35 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [still]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = heard;
    if (!heard) v.play().catch(() => {});
    setHeard(!heard);
  };

  return (
    <div className="csd-film__screen" style={{ "--r": ratio.replace("/", " / ") } as CSSProperties}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload={still ? "none" : "metadata"}
        aria-label={alt}
      />
      {sound ? (
        <button className="csd-film__sound" type="button" aria-pressed={heard} onClick={toggle}>
          {heard ? "Sound off" : "Sound on"}
        </button>
      ) : null}
    </div>
  );
}
