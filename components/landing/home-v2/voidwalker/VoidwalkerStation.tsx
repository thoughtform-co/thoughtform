"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { VoidwalkerHologram } from "./hologram/VoidwalkerHologram";
import { useVoidwalkerScroll } from "../hooks/useVoidwalkerScroll";
import { useVoidwalkerTravelScroll } from "../hooks/useVoidwalkerTravelScroll";
import { VOIDWALKER_TIME_TUNNEL } from "../unifiedServicesInstrument";
import { MediaLightbox, useWalkthrough } from "../services/casefile/MediaLightbox";
import { FilmPlate } from "./wireframes/FilmPlate";
import { VOIDWALKER_WIREFRAMES } from "./wireframes/voidwalkerWireframes";
import { wholeYears, yearFrac } from "@/lib/voidwalker/voidwalkerTravelClock";
import {
  VOIDWALKER_BEATS,
  VOIDWALKER_HEAD,
  type VoidwalkerBeat,
  type VwSegment,
} from "@/lib/voidwalker/voidwalkerData";

/**
 * VoidwalkerStation — the through-line (ADR-074): nine beats on one gold
 * spine, the masthead above, the pattern line below.
 *
 * Composition (voidwalker.css): a three-track grid on the editorial band —
 * the spine lane, the TITLE column and the BODY column (paragraph, then the
 * wireframe plate on story beats). Each beat is a subgrid row so the parent
 * owns the columns; its children carry inline `--ci-off` rungs and power on
 * through the terminal ladder off the beat's own `--vw-b` (written by
 * `useVoidwalkerScroll`). The title's words brighten one by one on the same
 * clock; the marker diamond fills as the spine's gold tip reaches it.
 *
 * Everything here is plain DOM: no images, no three, no media gate — the
 * rest state (no `data-vw-ready`) is the finished page, which is what the
 * reduced-motion and no-JS paths get.
 */

const ord = (i: number) => `//${String(i + 1).padStart(2, "0")}`;

function Segments({ segments }: { segments: readonly VwSegment[] }) {
  return (
    <>
      {segments.map((seg, i) => {
        if (typeof seg === "string") return <span key={i}>{seg}</span>;
        if ("em" in seg) return <em key={i}>{seg.em}</em>;
        // Not an <a>: the mark names an entity, it does not navigate.
        return (
          <span key={i} className="vw-mark">
            {seg.mark}
          </span>
        );
      })}
    </>
  );
}

/** The title, split into words so each can brighten on its own rung. An
 *  `em` segment's words take the gold ramp. */
function Words({ segments }: { segments: readonly VwSegment[] }) {
  let n = 0;
  return (
    <>
      {segments.map((seg, s) => {
        const em = typeof seg !== "string" && "em" in seg;
        const text = typeof seg === "string" ? seg : "em" in seg ? seg.em : seg.mark;
        const words = text.split(" ").filter(Boolean);
        return words.map((w, i) => {
          const idx = n++;
          const cls = em ? "w w--em" : "w";
          return (
            <span key={`${s}-${i}`}>
              <span className={cls} style={{ ["--w-i" as string]: idx } as CSSProperties}>
                {w}
              </span>
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        });
      })}
    </>
  );
}

/** The masthead's decode runs: an in-flow GHOST holds the line box AND the
 *  accessible text (transparent ink, never `visibility: hidden`, so it
 *  stays in the accessibility tree); the LIVE layer sits over it,
 *  `aria-hidden`, and is the kernel's target — one span per run so the
 *  lede's gold emphasis survives `textContent` writes. */
function DecodeRuns({
  segments,
  className,
}: {
  segments: readonly VwSegment[];
  className: string;
}) {
  return (
    <span className={`${className} vw-decode`}>
      <span className="vw-decode__ghost">
        <Segments segments={segments} />
      </span>
      <span className="vw-decode__live" aria-hidden="true">
        {segments.map((seg, i) => {
          const text = typeof seg === "string" ? seg : "em" in seg ? seg.em : seg.mark;
          const em = typeof seg !== "string" && "em" in seg;
          return em ? (
            <em key={i} data-vw-decode="">
              {text}
            </em>
          ) : (
            <span key={i} data-vw-decode="">
              {text}
            </span>
          );
        })}
      </span>
    </span>
  );
}

function Plate({ beat }: { beat: VoidwalkerBeat }) {
  const Wire = beat.wire ? VOIDWALKER_WIREFRAMES[beat.wire] : null;
  const press = beat.press;
  const bar = press ? (
    <>
      <span className="vw-plate__outlet">
        Press · <em>{press.outlet}</em>
      </span>
      <b>{press.headline}</b>
    </>
  ) : null;
  return (
    <figure
      className="vw-plate"
      data-vw-panel=""
      style={{ ["--ci-off" as string]: 0.42 } as CSSProperties}
    >
      <div className="vw-plate__top">
        <span>
          Artefact · <em>{beat.artefact}</em>
        </span>
        <span>{beat.year}</span>
      </div>
      <div className="vw-plate__frame">{Wire ? <Wire /> : null}</div>
      {press?.href ? (
        <a
          className="vw-plate__bar vw-plate__bar--link"
          href={press.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Read the ${press.outlet} piece: ${press.headline} (opens in a new tab)`}
        >
          {bar}
          <span className="vw-plate__arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      ) : (
        <figcaption className="vw-plate__bar">{bar}</figcaption>
      )}
    </figure>
  );
}

function Beat({
  beat,
  index,
  ordinal,
  side,
}: {
  beat: VoidwalkerBeat;
  index: number;
  ordinal: number;
  side: "left" | "right";
}) {
  const story = beat.kind === "story";
  return (
    <li
      className={`vw-beat vw-beat--${beat.kind}`}
      id={`vw-${beat.id}`}
      data-vw-idx={index}
      /* The travel clock reads its stops' years off the DOM so the
         schedule, the axis and the tunnel's ring cadence all come from
         ONE record (ADR-081). Unused by the vertical mode. */
      data-vw-year={beat.sortYear}
      /* ⚠ THE SIDE IS DATA, NOT `:nth-child` (U2). The film interlude sits
         in this same list, so a parity selector would flip every beat under
         it the moment the film moved or a second one arrived. */
      data-side={side}
    >
      {/* The marker CHIP — one framed object on the rail carrying the node,
          the ordinal and the year on one line. It has an opaque ground, so
          it BREAKS the spine rather than letting the line run through its
          type, which is what the stacked labels used to do. */}
      <div className="vw-beat__mark">
        <i className="vw-beat__diamond" aria-hidden="true" />
        <span className="vw-beat__ord" aria-hidden="true">
          {ord(ordinal)}
        </span>
        <span className="vw-beat__year">{beat.year}</span>
      </div>
      <h3 className="vw-beat__title">
        <Words segments={beat.title} />
      </h3>
      <div className="vw-beat__body">
        <p
          className="vw-beat__p"
          data-vw-panel=""
          style={{ ["--ci-off" as string]: 0.3 } as CSSProperties}
        >
          <Segments segments={beat.body} />
        </p>
        {story ? <Plate beat={beat} /> : null}
        {!story && beat.press ? (
          <p
            className="vw-beat__press"
            data-vw-panel=""
            style={{ ["--ci-off" as string]: 0.44 } as CSSProperties}
          >
            <span className="vw-beat__press-outlet">
              Press · <em>{beat.press.outlet}</em>
            </span>
            <span className="vw-beat__press-headline">{beat.press.headline}</span>
          </p>
        ) : null}
      </div>
    </li>
  );
}

/**
 * The film interlude — centred, wider than a beat, and the one thing on the
 * rail that stops it. Its ground masks the spine (`voidwalker.css`), so the
 * line runs down, halts at the film and picks up under it: the "break the
 * flow" the owner asked for, made structural rather than decorative.
 *
 * The plate is our drawing; the player is built only when the reader clicks,
 * inside `MediaLightbox`'s dialog. Nothing third-party is fetched before
 * that — see `FilmPlate` and `lib/security/headers.mjs`.
 */
function Interlude({ beat }: { beat: VoidwalkerBeat }) {
  const film = beat.film;
  const { watching, open, close } = useWalkthrough();
  if (!film) return null;
  return (
    <li className="vw-beat vw-beat--interlude" id={`vw-${beat.id}`} data-vw-year={beat.sortYear}>
      <figure
        className="vw-film"
        data-vw-panel=""
        style={{ ["--ci-off" as string]: 0.24 } as CSSProperties}
      >
        <div className="vw-film__top">
          <span>
            Film · <em>Save The Expanse</em>
          </span>
          <span>{film.duration}</span>
        </div>
        {/* The frame IS the button — the casefile's own affordance law: a
            drawing that took a pointer would be a second control inside one. */}
        <button
          type="button"
          className="vw-film__frame"
          aria-haspopup="dialog"
          onClick={(e) => open(e.currentTarget)}
        >
          <FilmPlate />
          <span className="vw-film__bar">
            <span className="vw-film__cue" aria-hidden="true" />
            <span className="vw-film__title">{film.title}</span>
            <b>{film.channel}</b>
          </span>
        </button>
      </figure>
      {watching ? (
        <MediaLightbox
          embed={{
            /* `-nocookie` and no `rel`: the CSP names exactly this origin,
               and nothing is set until the reader presses play. */
            src: `https://www.youtube-nocookie.com/embed/${film.youtubeId}?autoplay=1&rel=0`,
            title: film.title,
          }}
          label={film.title}
          meta={`${film.channel} · ${film.duration}`}
          onClose={close}
        />
      ) : null}
    </li>
  );
}

/**
 * THE LEFT RAIL IS THE TIME AXIS (owner, 2026-08-25 — superseding
 * ADR-081's own `.vw-axis`).
 *
 * ADR-081 drew a second, bespoke graduated axis in the left gutter,
 * beside a HUD rail that has carried a 13-tick ladder since ADR-031. The
 * owner's ruling: _"we have a lift rail, so this is a nice opportunity
 * to use it to map the actual dates"_ — one instrument, not two.
 *
 * ⚠ AND THE LADDER ALREADY IS THIS RECORD'S AXIS, EXACTLY. The rail's
 * thirteen ticks are twelve intervals; the record runs 2026 → 2014,
 * which is twelve years. Every year the record lands on seats on an
 * INTEGER RUNG — 2025 on tick 1, 2022 on tick 4, 2020 on 6, 2018 on 8,
 * 2016 on 10, 2014 on the terminus. So nothing is added to the ladder
 * and nothing is taken from it (ADR-031's guardrail: all thirteen ticks
 * stay). The rail is lettered with years instead of bearings while the
 * reader is flying, and a marker travels it like the lift indicator it
 * already resembles.
 *
 * ⚠ The seating is a COINCIDENCE OF THE RECORD, not a law, and
 * `voidwalker-data.test.ts` pins the twelve-year span so that adding a
 * beat outside it fails loudly rather than sliding every label off the
 * ladder. The placement itself stays proportional (`yearFrac`), so an
 * out-of-span record still reads correctly — just not on the rungs.
 *
 * ⚠ THE YEAR IS `Math.floor`, NOT `Math.round`. Two beats carry
 * fractional `sortYear`s purely to order them inside a shared year
 * (2018.9, 2016.8); rounding lettered **2019** and **2017** on the axis
 * — years no chip on the surface prints.
 *
 * It portals into `.hud__rail--l` and is mounted only on the travel
 * path. ⚠ The host must be `position: absolute`: the rail is a flex
 * column, and a static child leaves the ticks' percentage box entirely
 * (ADR-059's recorded trap, and the reason `.rin-host` looks the way it
 * does).
 */
function RailDates({ years }: { years: readonly number[] }) {
  /* The host is BUILT in a lazy initialiser and only ATTACHED by the
     effect, so nothing calls `setState` inside one. (`RailInstruments`
     does the same job with a state write; this shape keeps the identity
     stable across renders and stays out of the cascading-render rule.)
     Rendering into a not-yet-attached node is fine — React moves the
     children with it the moment the effect appends it. */
  const [host] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.createElement("div")
  );

  useEffect(() => {
    const rail = document.querySelector<HTMLElement>(".hud__rail--l");
    if (!rail || !host) return;
    host.className = "vw-rail";
    host.setAttribute("aria-hidden", "true");
    rail.appendChild(host);
    return () => host.remove();
  }, [host]);

  if (!host || years.length < 2) return null;
  const whole = wholeYears(years);
  const marks = [...new Set(whole)];
  return createPortal(
    <>
      {marks.map((y) => (
        <span
          key={y}
          className="vw-rail__yr"
          data-y={y}
          style={{ ["--vw-yf" as string]: yearFrac(y, whole) } as CSSProperties}
        >
          {y}
        </span>
      ))}
      <i className="vw-rail__mark" />
    </>,
    host
  );
}

/**
 * True when the TIME TUNNEL owns this surface: the flag, a desktop width
 * and no reduced-motion preference — the same pair every other 3D beat on
 * the site gates on.
 *
 * ⚠ This decides WHICH SINGLE HOOK writes `--vw-b`. The two are mutually
 * exclusive by construction rather than by coordination, because two
 * writers on one channel is the defect this surface has already paid for
 * once. The corridor-fallback case is deliberately NOT in this gate: the
 * travel hook re-reads it per frame and disengages, which lands on the
 * ADR-074 rest state (a fully-lit finished page), and hoisting a canvas
 * attribute into React state would need an observer for an edge case that
 * already fails safe.
 */
function useTravelCapable(): boolean {
  const [capable, setCapable] = useState(false);
  useEffect(() => {
    if (!VOIDWALKER_TIME_TUNNEL) return;
    const mq = window.matchMedia("(min-width: 961px) and (prefers-reduced-motion: no-preference)");
    const sync = () => setCapable(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return capable;
}

/**
 * The ADR-074 / ADR-081 timeline surface, factored out of
 * `VoidwalkerStation` so the ADR-082 character stage can be an early
 * return without conditional hooks. Renders identically to the pre-flag
 * `VoidwalkerStation` when this branch is taken.
 */
function VoidwalkerTimelineStation() {
  const rootRef = useRef<HTMLDivElement>(null);
  const travel = useTravelCapable();
  // ⚠ Exactly one of these writes per path. `enabled` is the same boolean
  // and its negation — never two conditions that could both be true.
  useVoidwalkerScroll(rootRef, !travel);
  useVoidwalkerTravelScroll(rootRef, travel);

  const years = VOIDWALKER_BEATS.map((b) => b.sortYear);

  return (
    <div className="vw" ref={rootRef}>
      {/* The dates live on the HUD's own left rail while the reader is
          flying — one instrument, not two (see `RailDates`). Mounted
          only on the travel path; the vertical mode reads its years off
          each beat's marker chip, as it always has. */}
      {travel ? <RailDates years={years} /> : null}
      {/* The runway and the stage are rendered on EVERY path and are
          `display: contents` until the hook writes `data-vw-mode="travel"`
          — so the vertical timeline is the same DOM in a different
          presentation, not a second tree. One content tree is what keeps
          the fallback honest and the record's guards walking real text. */}
      <div className="vw-travel-root">
        <div className="vw-travel-stage">
          <header className="vw-head">
            <h2 className="vw-head__title">
              <DecodeRuns segments={[VOIDWALKER_HEAD.title]} className="vw-head__title-run" />
            </h2>
            <p className="vw-head__lede">
              <DecodeRuns segments={VOIDWALKER_HEAD.lede} className="vw-head__lede-run" />
            </p>
          </header>

          <div className="vw__spine" aria-hidden="true" />

          <ol className="vw-beats" aria-label="The through-line, 2026 back to 2014">
            {(() => {
              /* The ordinal and the side both count BEATS, not rows — an
             interlude takes neither, and must not shift the beat under it. */
              let n = 0;
              return VOIDWALKER_BEATS.map((beat, i) => {
                if (beat.kind === "interlude") return <Interlude key={beat.id} beat={beat} />;
                const ordinal = n++;
                return (
                  <Beat
                    key={beat.id}
                    beat={beat}
                    index={i}
                    ordinal={ordinal}
                    side={ordinal % 2 === 0 ? "left" : "right"}
                  />
                );
              });
            })()}
          </ol>

          <footer className="vw-foot">
            <div className="vw-foot__mark" aria-hidden="true">
              <i className="vw-foot__diamond" />
            </div>
            <p className="vw-foot__line">
              <Segments segments={VOIDWALKER_HEAD.foot} />
            </p>
            <a className="vw-foot__next" href={VOIDWALKER_HEAD.next.href}>
              {VOIDWALKER_HEAD.next.label}
              <span aria-hidden="true"> ↓</span>
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}

/**
 * VoidwalkerStation — the station's interior is the HOLOGRAM composition
 * (ADR-082 U2, graduated from `/test/voidwalker-holo-lab` on
 * 2026-08-26 after owner review).
 *
 * ⚠ WHAT MAY NOT CHANGE. The station SHELL is load-bearing outside this
 * file — `#voidwalker` is the corridor's opaque cover
 * (`useCorridorExitScroll`'s `nextStation` query and home-v2.css's
 * `html[data-corridor-exit="true"] #…` rule name the same station;
 * ADR-030 §6, recorded five times). It keeps its id, its `data-station`,
 * a rail manifest row, the section readout and the nav drawer entry.
 * The hologram interior writes no `data-vw-mode`, so the non-travel
 * opaque path applies by construction. `services-ring-smoke` asserts
 * the ambient-hold pair.
 *
 * `VoidwalkerTimelineStation` above is UNMOUNTED but retained: the
 * ADR-074 record still renders through it, and its travel machinery is
 * entangled with the corridor (the structural shed, the travel clock,
 * the flight config). Excising that is its own pass — never a mass
 * deletion taken mid-integration.
 */
export function VoidwalkerStation() {
  return (
    <div className="vw vw--hologram">
      <VoidwalkerHologram />
    </div>
  );
}
