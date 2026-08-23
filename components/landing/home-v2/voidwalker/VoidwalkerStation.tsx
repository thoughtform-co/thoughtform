"use client";

import { useRef, type CSSProperties } from "react";

import { useVoidwalkerScroll } from "../hooks/useVoidwalkerScroll";
import { VOIDWALKER_WIREFRAMES } from "./wireframes/voidwalkerWireframes";
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

function Beat({ beat, index }: { beat: VoidwalkerBeat; index: number }) {
  const story = beat.kind === "story";
  return (
    <li className={`vw-beat vw-beat--${beat.kind}`} id={`vw-${beat.id}`} data-vw-idx={index}>
      <div className="vw-beat__mark">
        <i className="vw-beat__diamond" aria-hidden="true" />
        <span className="vw-beat__ord" aria-hidden="true">
          {ord(index)}
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

export function VoidwalkerStation() {
  const rootRef = useRef<HTMLDivElement>(null);
  useVoidwalkerScroll(rootRef);

  return (
    <div className="vw" ref={rootRef}>
      <header className="vw-head">
        <h2 className="vw-head__title">
          <DecodeRuns segments={[VOIDWALKER_HEAD.title]} className="vw-head__title-run" />
        </h2>
        <p className="vw-head__lede">
          <DecodeRuns segments={VOIDWALKER_HEAD.lede} className="vw-head__lede-run" />
        </p>
      </header>

      <div className="vw__spine" aria-hidden="true" />

      <ol className="vw-beats" aria-label="The through-line, 2014 to 2025">
        {VOIDWALKER_BEATS.map((beat, i) => (
          <Beat key={beat.id} beat={beat} index={i} />
        ))}
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
  );
}
