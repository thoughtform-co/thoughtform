"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import {
  CHARACTER_ERAS,
  type CharacterEra,
  type CharacterEraId,
} from "@/lib/voidwalker/characterEras";
import { VOIDWALKER_BEATS, VOIDWALKER_HEAD, vwPlain } from "@/lib/voidwalker/voidwalkerData";

import { useCharacterStageScroll } from "../../hooks/useCharacterStageScroll";
import { useCharacterStagePortalReceiver } from "../../hooks/useCharacterStagePortalReceiver";
import { CharacterEraRail } from "./CharacterEraRail";
import { CharacterModel } from "./CharacterModel";

/**
 * CharacterStage — the ADR-082 character-selection surface.
 *
 * Layout (voidwalker-character.css):
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  masthead: VOIDWALKER · lede (from VOIDWALKER_HEAD)             │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  copy column     │        stage viewport                        │
 *   │  wardrobe title  │  ┌──────────────────────────┐   era motto   │
 *   │  loadout list    │  │   3D model turntable     │   year        │
 *   │  beat prose      │  │   (or still fallback)    │   short name  │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  era rail: six pips, current highlighted                        │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  foot: pattern line, "Next · Plot your course" → #contact       │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * The scroll writer (`useCharacterStageScroll`) writes:
 *   - `data-ch-ready` on the root, gating the motion block
 *   - `--ch-p` the runway progress 0..1
 *   - `--ch-era-i` the currently centred era index (0..5)
 *   - `data-ch-era` the currently centred era id
 *
 * Everything else is plain DOM — the 3D model mounts through the
 * corridor R3F canvas via `CharacterModel` (a thin bridge component
 * that reads the era from a ref, not from props, so a swap does not
 * remount the R3F tree). PRM / mobile / no-WebGL fall back to the era
 * still automatically because `CharacterModel` writes null on the
 * unsupported paths.
 *
 * ⚠ THE STAGE OWNS ITS OWN RUNWAY (~600svh), gated on `data-ch-ready`
 * only — flag-off, mobile and PRM all render this at `display: contents`
 * with no dead scroll (same shape as ADR-081's runway).
 */
export function CharacterStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [eraIdx, setEraIdx] = useState<number>(0);

  // ⚠ The single writer of the era index is the scroll hook. Clicks on
  // the rail nudge the scroll (via `scrollToEra`), which then writes
  // the index. If click wrote state directly and scroll wrote it too,
  // both would race the CSS var.
  const scrollToEra = useCharacterStageScroll(rootRef, setEraIdx);
  // The About-exit → character-stage portal receiver — reads the
  // portal state the About hook publishes and writes `--ch-portal-in`
  // + `data-ch-portal="arriving"`. Inert while the flag is off / the
  // About runway isn't engaged.
  useCharacterStagePortalReceiver(rootRef);

  const era = CHARACTER_ERAS[eraIdx] ?? CHARACTER_ERAS[0]!;
  const beat = useMemo(() => VOIDWALKER_BEATS.find((b) => b.id === era.beatId), [era.beatId]);

  const onSelect = useCallback(
    (id: CharacterEraId) => {
      const i = CHARACTER_ERAS.findIndex((e) => e.id === id);
      if (i < 0) return;
      scrollToEra(i);
    },
    [scrollToEra]
  );

  return (
    <div className="ch-runway" ref={rootRef}>
      <div className="ch-runway__stage">
        <CharacterStageInner era={era} eraIdx={eraIdx} beat={beat} onSelect={onSelect} />
      </div>
    </div>
  );
}

/** The stage's inner render — separated so the outer can own the
 *  runway height and the sticky pin, and the inner can be swapped for
 *  a static rail on mobile/PRM without duplicating the runway. */
function CharacterStageInner({
  era,
  eraIdx,
  beat,
  onSelect,
}: {
  era: CharacterEra;
  eraIdx: number;
  beat: ReturnType<typeof VOIDWALKER_BEATS.find>;
  onSelect: (id: CharacterEraId) => void;
}) {
  return (
    <div className="ch" data-ch-era={era.id}>
      {/* Masthead reused from the record — one voice across both
          presentations. The character stage doesn't decode the lede;
          the surface is already an interactive instrument. */}
      <header className="ch-head">
        <h2 className="ch-head__title">{VOIDWALKER_HEAD.title}</h2>
        <p className="ch-head__lede">{vwPlain(VOIDWALKER_HEAD.lede)}</p>
      </header>

      <div className="ch-stage">
        {/* Left column: the era's copy and loadout. */}
        <aside className="ch-copy">
          <div className="ch-copy__meta" data-ch-panel="">
            <span className="ch-copy__ord" aria-hidden="true">
              {String(eraIdx + 1).padStart(2, "0")} · 06
            </span>
            <span className="ch-copy__year">{era.year}</span>
          </div>
          <h3 className="ch-copy__wardrobe">{era.wardrobe}</h3>
          <p className="ch-copy__motto">{era.motto}</p>
          <dl className="ch-copy__loadout" aria-label="Loadout">
            <dt>Loadout</dt>
            <dd>{era.loadout}</dd>
            {beat ? (
              <>
                <dt>Beat</dt>
                <dd>
                  <em>{plainTitle(beat.title)}</em>
                </dd>
              </>
            ) : null}
          </dl>
          {beat ? (
            <p className="ch-copy__prose" data-ch-panel="">
              {vwPlain(beat.body)}
            </p>
          ) : null}
        </aside>

        {/* The stage viewport — a pinned frame that the 3D model
            projects into. The mesh itself lives inside the corridor
            canvas; `CharacterModel` publishes its rect for the R3F
            side to read. */}
        <div className="ch-viewport" data-ch-viewport="">
          <div className="ch-viewport__frame" aria-hidden="true">
            {/* Corner brackets — chrome (ADR-065 corner law: chamfer=0,
                brackets frame without machining). */}
            <span className="ch-viewport__bracket ch-viewport__bracket--tl" />
            <span className="ch-viewport__bracket ch-viewport__bracket--tr" />
            <span className="ch-viewport__bracket ch-viewport__bracket--bl" />
            <span className="ch-viewport__bracket ch-viewport__bracket--br" />
          </div>
          {/* The still, always in the DOM. On the WebGL path the
              3D actor cross-fades over it; on the fallback path
              it IS the surface. Object-fit cover so faces stay
              in-frame across widths.

              ⚠ `<img>` is deliberate over `next/image` — the still is
              swapped from the DOM at every era change, and `<Image>`'s
              wrapper mutation triggers a full-tree flicker under the
              corridor's fixed positioning (the ADR-047 deck-flip
              recorded this trap; the about portrait is `<img>` for the
              same reason).

              ⚠ `key={era.id}` on the img — the CSS animation
              (`.ch-viewport__still` fadeIn) plays on every era swap.
              Combined with the neighbour preloader below, the reader
              sees a cross-fade rather than a hard cut. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={era.id}
            className="ch-viewport__still"
            src={era.stillPath}
            alt={`${era.wardrobe} · ${era.year}`}
            decoding="async"
            draggable={false}
          />
          {/* Neighbour preload — the next and previous eras' stills
              are hinted, so scrolling / clicking the rail lands on a
              cached image. `<link rel="preload" as="image">` in JSX
              is cleaner than manipulating <head> at effect time. */}
          <NeighbourPreloads eras={CHARACTER_ERAS} eraIdx={eraIdx} />
          {/* HUD overlays inside the viewport (chrome, not chart). */}
          <div className="ch-viewport__hud" aria-hidden="true">
            <span className="ch-viewport__hud-tag">CHARACTER · {era.short.toUpperCase()}</span>
            <span className="ch-viewport__hud-year">{era.year}</span>
          </div>
          {/* The R3F bridge — mounts a group into the corridor canvas
              scaled to the frame rect. `null` on fallback paths. */}
          <CharacterModel era={era} />
        </div>
      </div>

      <CharacterEraRail eras={CHARACTER_ERAS} activeId={era.id} onSelect={onSelect} />

      <footer className="ch-foot">
        <p className="ch-foot__line">{vwPlain(VOIDWALKER_HEAD.foot)}</p>
        <a className="ch-foot__next" href={VOIDWALKER_HEAD.next.href}>
          {VOIDWALKER_HEAD.next.label}
          <span aria-hidden="true"> ↓</span>
        </a>
      </footer>
    </div>
  );
}

/** Plain string of a beat title (the record uses `VwSegment[]` for
 *  gold-em runs — the stage displays them as plain text). */
function plainTitle(segments: readonly (string | { em: string } | { mark: string })[]): string {
  return segments.map((s) => (typeof s === "string" ? s : "em" in s ? s.em : s.mark)).join("");
}

/** Neighbour still preloader — the era before and the era after the
 *  currently-centred one, so scroll-nudging the rail lands on a
 *  cached image. Rendered as `display: none` `<img>` elements (the
 *  browser starts the fetch on decode) so no `<head>` mutation is
 *  needed. */
function NeighbourPreloads({ eras, eraIdx }: { eras: readonly CharacterEra[]; eraIdx: number }) {
  const neighbours = useMemo(() => {
    const set = new Set<string>();
    const prev = eras[eraIdx - 1];
    const next = eras[eraIdx + 1];
    if (prev) set.add(prev.stillPath);
    if (next) set.add(next.stillPath);
    return Array.from(set);
  }, [eras, eraIdx]);
  return (
    <>
      {neighbours.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          style={{ display: "none" }}
          decoding="async"
          loading="eager"
        />
      ))}
    </>
  );
}

/** Referenced by types-only consumers (the era registry unit guard,
 *  no runtime cost). */
export type { CharacterEra };
