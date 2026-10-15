"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The finished loop in its 9:16 window, the one autoplaying picture on the
 * page: muted until the reader asks for sound, as the breakdown's own
 * opening film was (`PromptToLoop`'s toggle, as a component).
 */
export function PortfolioFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    /* `autoPlay` can stay paused until the element is muted imperatively. */
    video.muted = true;
    void video.play().catch(() => {});
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    video.muted = sound;
    if (!sound) void video.play().catch(() => {});
    setSound(!sound);
  };

  return (
    <div className="tfp-phone">
      <video
        ref={ref}
        src="/arcs/prompt-to-loop/loop.mp4"
        poster="/arcs/prompt-to-loop/ptl-02.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-label="The finished 10-second loop"
      />
      <button type="button" className="tfp-sound" aria-pressed={sound} onClick={toggle}>
        <i aria-hidden="true" />
        {sound ? "Sound off" : "Sound on"}
      </button>
    </div>
  );
}
