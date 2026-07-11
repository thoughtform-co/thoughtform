"use client";

import { useEffect } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";

/** Reversible terminal decode for the fixed Tools mode datum. */
export function ToolsHeaderDecode() {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>("#tools [data-tools-decode] > span");
    if (!el) return;

    const finalText = el.textContent ?? "";
    if (!finalText.trim()) return;

    const html = document.documentElement;
    const enhanced = window.matchMedia(
      "(min-width: 1101px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)"
    );
    const jobs: ScrambleJob[] = [];
    let raf = 0;
    let armed = true;

    const tick = () => {
      advanceScrambles(jobs, performance.now() / 1000);
      raf = jobs.length ? requestAnimationFrame(tick) : 0;
    };

    const stop = () => {
      jobs.length = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const update = () => {
      if (!enhanced.matches) {
        stop();
        armed = true;
        el.textContent = finalText;
        return;
      }

      const active = html.getAttribute("data-active-station") === "tools";
      if (!active) {
        stop();
        armed = true;
        // CSS owns the reversible clip/opacity exit. Keep the authored
        // text in place while it closes so reverse scroll never produces
        // a one-frame empty datum; the next entry re-arms the decode.
        el.textContent = finalText;
        return;
      }
      if (!armed) return;
      armed = false;
      el.textContent = "";
      queueScramble(jobs, el, finalText, performance.now() / 1000 + 0.08);
      raf = requestAnimationFrame(tick);
    };

    const observer = new MutationObserver(update);
    observer.observe(html, { attributes: true, attributeFilter: ["data-active-station"] });
    enhanced.addEventListener("change", update);
    update();

    return () => {
      observer.disconnect();
      enhanced.removeEventListener("change", update);
      stop();
      el.textContent = finalText;
    };
  }, []);

  return null;
}
