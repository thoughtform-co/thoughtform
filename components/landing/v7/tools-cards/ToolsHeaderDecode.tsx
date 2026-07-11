"use client";

import { useEffect } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";

/**
 * ToolsHeaderDecode — scramble-decodes the #tools eyebrow
 * (`[data-tools-decode]`, authored in the station shell) the first time
 * the header scrolls into view: the mono microcopy "types on" over the
 * dimmed receded brandmark — the data readout materializing on the
 * viewscreen (ADR-030 Update 1 terminal-text canon: eyebrow/meta =
 * captionScramble decode; display titles keep the data-m clip-wipe).
 *
 * Null leaf mounted by ToolsCardStack (the portal tree); the eyebrow
 * itself lives in the parsed station shell, so it's queried at document
 * level. Driver is the house pattern (ServicePlateCard's
 * decode-from-blank + one self-terminating rAF). Reduced motion: the
 * authored text is never touched.
 */
export function ToolsHeaderDecode() {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>("#tools [data-tools-decode]");
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false) return;

    const finalText = el.textContent ?? "";
    if (!finalText.trim()) return;

    const jobs: ScrambleJob[] = [];
    let raf = 0;
    let played = false;
    el.textContent = ""; // decode-from-blank; min-height reserves the line box

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || played) continue;
          played = true;
          queueScramble(jobs, el, finalText, performance.now() / 1000 + 0.12);
          const tick = () => {
            advanceScrambles(jobs, performance.now() / 1000);
            raf = jobs.length ? requestAnimationFrame(tick) : 0;
          };
          raf = requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
      // Strict Mode / unmount: restore the authored text so a remount
      // (or the no-JS read) never strands a half-decoded eyebrow.
      el.textContent = finalText;
    };
  }, []);

  return null;
}
