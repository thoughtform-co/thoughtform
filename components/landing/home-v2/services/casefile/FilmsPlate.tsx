import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import type { CaseFilm, CaseFilmProduction } from "@/lib/cases/types";

import { MediaLightbox, restoreFocusAfterUnmount, useCloseOnCasefileFold } from "./MediaLightbox";
import { ConsoleFrame } from "./console/ConsoleFrame";
import { ConsoleRail } from "./console/ConsoleRail";

/**
 * FilmsPlate — ONE above-the-line film at panel scale, the other one rail
 * click away, playing in a lightbox.
 *
 * WHY IT IS ONE FILM NOW (owner, 2026-08-04). The plate used to render both
 * posters side by side. The right panel is viewport-derived and TALL (~500px
 * at 1280x720, ~1000px at 2017x1269), so two 16:9 tiles resolved to ~390x220
 * each and floated as undersized stamps in a mostly empty box — the owner read
 * that frame/content mismatch as "cropped". One film large (measured 565x318
 * at 1280x720, 640x360 at 1440x800, 814x458 at 2017x1269) plus a two-entry
 * selector rail spends the same box on the evidence instead.
 *
 * THE POSTER IS STILL NEVER CROPPED. `.fl-film` keeps the 16:9 box, the
 * `flex: 0 0 auto` and the `object-fit: contain` from the U8 regression fix —
 * only the number of frames changed. See the `.fl-film` comment in
 * casefile.css.
 *
 * THE RAIL IS THE HOUSE GRAMMAR — `ConsoleRail`, shared with every other
 * evidence plate (2026-08-06). It lost its `01 / 02` ordinal with every other
 * ordinal on this surface: two entries do not need to be counted, and the
 * travelling spine says which one is open.
 *
 * NO `<video>` UNTIL A CLICK. The frame is a `next/image` poster, so a row
 * nobody opens costs zero video bytes and zero compositor layers (the beat's
 * layer budget was counted at ~14 in ADR-056 Update 4). The element is created
 * by the lightbox, already playing, and destroyed with it.
 *
 * The overlay itself lives in `MediaLightbox` — shared with the tool gallery,
 * because its portal / scroll-lock / focus-restore behaviours each took a
 * measurement to get right and a second copy would drift from them.
 */
export function FilmsPlate({
  films,
  production,
}: {
  films: readonly CaseFilm[];
  production?: CaseFilmProduction;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [openSrc, setOpenSrc] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = films.find((f) => f.src === openSrc) ?? null;
  const active = films[activeIdx] ?? films[0];

  const close = useCallback(() => {
    setOpenSrc(null);
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    restoreFocusAfterUnmount(target);
  }, []);

  useCloseOnCasefileFold(rootRef, open !== null, close);

  if (!active) return null;

  return (
    <ConsoleFrame
      className="fl-plate fl-plate--films"
      rootRef={rootRef}
      rail={
        <ConsoleRail
          stations={films.map((f) => ({ id: f.src, name: f.label }))}
          activeIdx={activeIdx}
          onActive={setActiveIdx}
          label="Above-the-line films"
        />
      }
    >
      <div className="fl-filmstage">
        <div className="fl-filmframe">
          <button
            type="button"
            className="fl-film"
            aria-haspopup="dialog"
            aria-label={`Play ${active.label}`}
            onClick={(e) => {
              returnFocusRef.current = e.currentTarget;
              setOpenSrc(active.src);
            }}
          >
            {/* Keyed on the poster so a rail switch decodes the new plate
                rather than repainting the old one under a new src. */}
            <Image
              key={active.poster}
              className="fl-film__poster"
              src={active.poster}
              alt=""
              width={1920}
              height={1080}
              sizes="(min-width: 1800px) 900px, 660px"
            />
            <i className="fl-film__cue" aria-hidden="true" />
          </button>
          {/* Fused under the frame's bottom edge, the shot bar's grammar:
              what is on screen, then its format and duration. The plate is
              never nameless (rules/proof.md). */}
          <span className="fl-filmmeta">
            <span className="fl-filmmeta__label">{active.label}</span>
            <span className="fl-filmmeta__spec">{active.meta}</span>
          </span>
        </div>
      </div>

      {/* HOW IT WAS MADE, seated at the field's floor — a SIBLING of the
          stage, so the stage keeps `flex: 1 1 auto` and this takes its
          height off the top of the residual rather than out of the frame.

          ⚠ It does NOT change with the rail. Both films came off one
          pipeline with one crew, so this is the ROW's standard; switching
          it per station would be a rail pretending it changed something.
          See `CaseFilmProduction` for why the crew is departments only. */}
      {production ? (
        <div className="fl-filmprod">
          <section className="fl-filmprod__grp">
            <span className="fl-filmprod__k">{production.chainLabel}</span>
            <ol className="fl-filmprod__chain">
              {production.chain.map((stage) => (
                <li className="fl-filmprod__stage" key={stage.name}>
                  <b className="fl-filmprod__stage-n">{stage.name}</b>
                  <span className="fl-filmprod__stage-t">{stage.tool}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}

      {open ? (
        <MediaLightbox src={open.src} label={open.label} meta={open.meta} onClose={close} />
      ) : null}
    </ConsoleFrame>
  );
}
