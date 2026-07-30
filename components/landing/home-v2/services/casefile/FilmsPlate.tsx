import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { CaseFilm } from "@/lib/cases/types";

/**
 * FilmsPlate — the above-the-line films, poster-first.
 *
 * NO `<video>` EXISTS UNTIL A CLICK. This is stricter than `ArcMediaSection`
 * (which mounts the element with `preload="none"`) and deliberately so: this
 * plate lives inside a scroll-driven surface whose compositor-layer budget
 * was counted at ~14 during the 2026-07-29 perf pass (ADR-056 Update 4). A
 * mounted media element costs a layer and a decoder for a row most visitors
 * open zero times. The poster is a `next/image` still; the click is the play
 * intent, so the element arrives already playing.
 *
 * IT MUST STOP WHEN THE CASEFILE LEAVES. The plane folds and irises shut on
 * scroll (ADR-056 Update 1) — without this the film keeps decoding audio and
 * video behind a closed iris. We watch `data-proof-live` on `.services-stage`
 * (the same attribute the sheet gates its `will-change` on) with a
 * MutationObserver and tear the element down when it drops. Do NOT poll
 * `--svc-proof-out` in rAF: this surface has exactly one per-frame writer and
 * the perf pass removed the per-frame reads on purpose.
 *
 * POINTER-EVENTS. `.fl-case` is `pointer-events: none`; `.fl-film` opts back
 * in, the same way `.fl-row` and `.fl-tabs__tab` do. That is safe because the
 * host is `visibility: hidden` until `data-proof-live` and `visibility:
 * hidden` subtrees are not hit-testable — which is what keeps the departed
 * casefile from swallowing ring-card clicks.
 */
export function FilmsPlate({ films }: { films: readonly CaseFilm[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!playing) return;
    const stage = rootRef.current?.closest<HTMLElement>(".services-stage");
    if (!stage) return;

    // The fold: `data-proof-live` drops as the plane irises shut.
    const observer = new MutationObserver(() => {
      if (!stage.hasAttribute("data-proof-live")) setPlaying(null);
    });
    observer.observe(stage, { attributes: true, attributeFilter: ["data-proof-live"] });

    // A backgrounded tab should not keep decoding.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") videoRef.current?.pause();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [playing]);

  return (
    <div className="fl-plate fl-plate--films" ref={rootRef}>
      <ul className="fl-films">
        {films.map((film) => {
          const live = playing === film.src;
          return (
            <li className="fl-filmcell" key={film.src}>
              <div className="fl-filmcell__frame">
                {live ? (
                  <video
                    ref={videoRef}
                    className="fl-film__video"
                    src={film.src}
                    /* No `poster` on purpose: this element only ever exists
                       AFTER a click, already playing, so the attribute would
                       never be seen — but it would re-fetch the raw JPEG the
                       optimizer already served as the tile (measured: 93 kB
                       per play). The black frame under it covers the gap. */
                    controls
                    autoPlay
                    playsInline
                    disablePictureInPicture
                    aria-label={film.label}
                    onEnded={() => setPlaying(null)}
                  />
                ) : (
                  <button
                    type="button"
                    className="fl-film"
                    onClick={() => setPlaying(film.src)}
                    aria-label={`Play ${film.label}`}
                  >
                    <Image
                      className="fl-film__poster"
                      src={film.poster}
                      alt=""
                      width={1920}
                      height={1080}
                      sizes="420px"
                    />
                    <i className="fl-film__cue" aria-hidden="true" />
                  </button>
                )}
              </div>
              <span className="fl-filmcell__label">{film.label}</span>
              <span className="fl-filmcell__meta">{film.meta}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
