"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { stationById, type StationTelemetry } from "@/lib/home-v2/corridorMap";
import {
  DOCKED_INSTRUMENT_EPILOGUE_POSE,
  dissipateBand,
  dissipateShellScatter,
  epilogueBand,
  getEpiloguePlanetScale,
} from "@/lib/home-v2/epilogueTimeline";
import {
  getSmoothedDissipate,
  getSmoothedEpilogueProgress,
} from "./DepthGatewayScene/motionFollower";
import {
  BRANDMARK_ANCHOR_INTELLIGENCE,
  getCameraFov,
  getEpilogueCameraPose,
} from "./DepthGatewayScene/sceneGeom";
import {
  GYRO_ASSEMBLY_SCALE,
  SUBSTRATE_GYRO_DOTTED_SHELL_RADIUS_MUL,
  SUBSTRATE_GYRO_GLOBE_RADIUS,
} from "./DepthGatewayScene/shell/shellGeom";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { gyroTilt } from "@/lib/stores/gyroLabStore";

/**
 * CorridorStationHeaders — flat 2D screen-space layer for the three
 * Linear-style corridor headers (Navigate / Encode / Build).
 *
 * Desktop-only. The headers live in the viewport (`position: fixed`)
 * NOT in the world projection, so they don't skew with the camera,
 * don't smear off-screen at close camera ranges, and read consistently
 * across aspect ratios. Mobile keeps the world-anchored straddle
 * inside `CopyAnchors` so the centred portrait composition still ties
 * to the reticle.
 *
 * Two animation systems compose:
 *
 *   1. CONTAINER OPACITY (scroll-scrubbed). Per-frame `bandOpacity`
 *      tied to `CORRIDOR_TIMELINE.accretion` — each header arrives
 *      WITH its visual layer and yields cleanly to the next.
 *
 *   2. TYPEWRITER (time-based, plays on arrival). When a header's
 *      opacity crosses the ARRIVE threshold, the title types out
 *      character-by-character, then the support paragraph types out
 *      after a short gap. When the header leaves (opacity below
 *      REARM), state resets so the next arrival re-plays cleanly.
 *      Per-char `opacity` is animated (layout stays stable, no
 *      reflow). A block cursor sits at the typing head and blinks
 *      while the line is alive. Reduced-motion / mobile render the
 *      full text immediately with no cursor.
 *
 *   Inline `<em>` accents in the corridor copy (gold highlight
 *   words) are preserved by splitting through the parsed tokens
 *   and tagging em chars with an extra class.
 */

// ── Scroll-scrubbed opacity bands (unchanged from prior pass) ─────
//
// Beat reference:
//   - pass-01a   [0.109, 0.355]
//   - navigate   [0.355, 0.445]
//   - pass-01b   [0.445, 0.573]
//   - diagnostic [0.573, 0.7]    (Encode park ~0.636)
//   - passthr-02 [0.7,   0.845]
//   - intellig.  [0.845, 1.0]    (Build park ~0.92)
//
// Tied to `CORRIDOR_TIMELINE.accretion`:
//   - substrate.start → Navigate text fades in WITH the gimbal
//   - orbits.start    → Encode text fades in WITH the orbits
//   - stack.start     → Build text fades in WITH the funnel
const NAVIGATE_FADE_IN: [number, number] = [0.3, 0.42];
const NAVIGATE_FADE_OUT: [number, number] = [0.47, 0.54];
const ENCODE_FADE_IN: [number, number] = [0.54, 0.62];
const ENCODE_FADE_OUT: [number, number] = [0.76, 0.83];
const BUILD_FADE_IN: [number, number] = [0.84, 0.91];

// ── Arc stage → left-rail station label (ADR-030 Update 3) ───────
// While the corridor owns the HUD (`data-corridor-engaged`), the
// site-wide RailStationLabel shows the current Arc stage instead of
// closing. This rAF is the corridor's single text writer, so it also
// publishes the stage as a delta-gated `data-arc-stage` attribute on
// <html>; the label component observes the attribute (staying fully
// event-driven). Stage boundaries are DERIVED from the fade bands
// above so the rail label can never drift from the headline beats:
// the armed pre-pin stretch and everything before Encode's arrival
// reads "navigate"; the epilogue holds paintProgress at 1 → "build"
// persists until disengagement hands over to `data-screen-label`s.
const ARC_ENCODE_AT = ENCODE_FADE_IN[0];
const ARC_BUILD_AT = BUILD_FADE_IN[0];
type ArcStage = "navigate" | "encode" | "build";

// ── Typewriter tuning ─────────────────────────────────────────────
/** Container opacity above which a header is considered "arrived"
 *  and the type-out is armed to start (one-shot). High enough to
 *  feel landed; low enough to fire well before opacity 1. */
const TYPER_ARRIVE_OPACITY = 0.5;
/** Container opacity below which the per-char state resets so the
 *  next arrival types out fresh. Lower than ARRIVE so transient
 *  jitters in the middle of a beat don't retype. */
const TYPER_REARM_OPACITY = 0.04;
/** Typing speed for the title (characters per second). Snappy enough
 *  that a ~25-char heading clears in ~0.15s — the type-on reads as a
 *  fast terminal flush, not a crawl. Bumped 55 -> 165 (2026-06-08
 *  speed pass) after the previous values took a couple of seconds and
 *  broke the corridor flow. */
const TYPER_TITLE_CPS = 165;
/** Typing speed for the support paragraph. Much faster than the title
 *  so a 130-150 char paragraph lands within ~0.35s — the whole header
 *  (title + body) resolves in roughly half a second, in step with the
 *  gimbal's arrival. Bumped 140 -> 420. */
const TYPER_SUPPORT_CPS = 420;
/** Gap (seconds) between title finishing and support starting. Tiny
 *  so the body flushes almost immediately after the headline. */
const TYPER_GAP_S = 0.03;
/** Time (seconds) a fully-typed char takes to fade up to opacity 1.
 *  Tiny — keeps each char snappy without a hard pop. */
const TYPER_CHAR_FADE_S = 0.04;

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function bandOpacity(p: number, fadeIn: [number, number], fadeOut?: [number, number]): number {
  const inOp = smoothstep(fadeIn[0], fadeIn[1], p);
  const outOp = fadeOut ? smoothstep(fadeOut[0], fadeOut[1], p) : 0;
  return Math.max(0, inOp - outOp);
}

// ── Per-char tokenization preserving inline <em> ──────────────────
//
// The corridor copy uses a single, simple HTML shape:
//   "Plain text <em>accent</em> more text."
// Parse it into a flat array of char tokens, each tagged whether it
// sits inside an `<em>` so the CSS gold em styling still applies.
// Anything more complex than a single <em> span (or any other tag)
// will throw the parse off — keep the corridor copy in the agreed
// shape. (Single `<em>` per string is enforced by the corridorMap
// content authoring rule already.)

interface CharToken {
  ch: string;
  em: boolean;
}

function tokenize(html: string): CharToken[] {
  const tokens: CharToken[] = [];
  let i = 0;
  let em = false;
  while (i < html.length) {
    if (html[i] === "<") {
      const close = html.indexOf(">", i);
      if (close === -1) break;
      const tag = html
        .slice(i + 1, close)
        .toLowerCase()
        .trim();
      if (tag === "em") em = true;
      else if (tag === "/em") em = false;
      // Other tags are dropped intentionally — corridor copy stays
      // to the single-<em> shape.
      i = close + 1;
      continue;
    }
    tokens.push({ ch: html[i] ?? "", em });
    i += 1;
  }
  return tokens;
}

// ── Per-station runtime state ─────────────────────────────────────

interface StationRefs {
  container: HTMLDivElement | null;
  titleChars: HTMLSpanElement[];
  supportChars: HTMLSpanElement[];
  titleCursor: HTMLSpanElement | null;
  supportCursor: HTMLSpanElement | null;
}

interface StationState {
  /** True once the header has crossed ARRIVE and the type-out has
   *  started this visit. Set back to false once container drops
   *  below REARM. */
  typing: boolean;
  /** True while the console frame chrome is unfolded (`is-armed`
   *  class on the container). Shares the typewriter's ARRIVE/REARM
   *  thresholds so frames and chars resolve together, but tracked
   *  separately because the reduced-motion path skips the typewriter
   *  while still needing the frames. */
  framed: boolean;
  /** `performance.now()` (seconds) when this visit's type-out
   *  started — only valid while `typing === true`. */
  startSec: number;
  /** Last per-char opacities we wrote, to suppress redundant DOM
   *  writes (most frames after the title finishes don't change). */
  titleHead: number;
  supportHead: number;
}

function makeInitialState(): StationState {
  return { typing: false, framed: false, startSec: 0, titleHead: -1, supportHead: -1 };
}

interface StationContent {
  /** Numbered eyebrow (e.g. "01 \u00b7 Navigate"). No longer rendered by
   *  this component — the persistent `CorridorProgressRail` HUD
   *  breadcrumb (Navigate \u25c6 Encode \u25c6 Build) replaced the
   *  per-station cartouche. Kept on the type because the corridor-map
   *  content carries it and the static fallback still reads it. */
  kicker?: string;
  titleHtml: string;
  supportHtml?: string;
  floorHtml?: string;
  /** Station telemetry readouts (sector / callsign / status / code /
   *  metric) rendered as chrome rows inside the support console. */
  telemetry?: StationTelemetry;
}

/** HUD console chrome for the split cartouche (2026-06-11 V8 pass,
 *  ported from `/test/navigate-copy-lab`). The title band gets a
 *  dotted top + faint bottom frame; the support band gets the inverse
 *  weighting plus telemetry meta/readout rows. (The sphere-facing
 *  corner brackets were removed 2026-06-11 — the open frame edges
 *  read cleaner against the instrument.) Frame segments UNFOLD via
 *  the container's `is-armed` state class — toggled by the RAF loop
 *  at the exact frame the typewriter arms, so chrome and chars
 *  resolve together with no delay. */
function TitleConsole({ children }: { children: ReactNode }) {
  return (
    <div className="home-v2-station-header__console home-v2-station-header__console--title">
      <span
        className="home-v2-station-header__frame home-v2-station-header__frame--top"
        aria-hidden="true"
      />
      <span
        className="home-v2-station-header__frame home-v2-station-header__frame--bottom"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

// ── Persistent caption card (one artifact, 2026-07-03) ────────────
//
// The bottom caption is ONE persistent instrument, not three cards
// blinking in and out per station. The D5-H chrome (faint-hairline
// shell over a solid void plate, terminal title bar, tick rail, 22px
// bottom-right notch via the two-layer clip-path sandwich in CSS)
// mounts once and holds through the whole Navigate → Encode → Build
// run; only its CONTENT changes:
//
//   - The three support paragraphs render stacked in the same grid
//     cell (`__caption-copy`), so the card keeps ONE constant width
//     (the widest caption) while each paragraph types in / fades out
//     on its own station band via the existing typewriter machinery.
//   - The title-bar callsign + status retitle to the active station
//     (NAV-01 TRACKING → ENC-02 ENCODING → BLD-03 LIVE) from the RAF
//     loop — chrome, not content, so it swaps rather than types.
//
// The card's own opacity band opens with Navigate's arrival and stays
// up through Build (ignoring the per-station fade-outs), yielding only
// to the epilogue on the same BUILD_OUT clock as the Build title.

type CaptionStationKey = "nav" | "enc" | "bld";

/** Decorative survey-fix tag floating above the reticle's top-left
 *  corner ("REF 122.4 / T+0042"). Set-dressing derived per station,
 *  NOT content — which is why it lives here and not in corridorMap. */
interface CaptionCoord {
  ref: string;
  t: string;
}

/** Everything the caption card's chrome shows for one station: the
 *  kicker + telemetry feed the meta row, the coord tag the top-left
 *  artifact. All of it swaps (not types) on station change. */
interface CaptionStationMeta {
  kicker?: string;
  telemetry?: StationTelemetry;
  coord: CaptionCoord;
}

/** Live text elements inside the card chrome the RAF loop retitles
 *  when the dominant station changes. */
interface CaptionMetaEls {
  kicker: HTMLSpanElement | null;
  callsign: HTMLSpanElement | null;
  status: HTMLSpanElement | null;
  coordRef: HTMLSpanElement | null;
  coordT: HTMLElement | null;
}

// Caption chrome scramble-decode: on station change the meta row +
// coord tag TRANSFORM into the next station's readout (chars shuffle
// through HUD glyphs, resolving left-to-right) instead of
// hard-swapping. The kernel is pure and unit-tested in
// `lib/home-v2/captionScramble.ts`; this component only queues jobs on
// station change and advances them from its RAF tick (single writer).

/** One station's support paragraph inside the persistent caption card.
 *  Mirrors StationBlock's support rendering (per-char spans + trailing
 *  cursor in typewriter mode, raw HTML otherwise) and registers its
 *  spans/cursor into the SAME per-station refs the RAF typewriter
 *  drives — the typing machinery is untouched, only the mount point
 *  moved. The paragraph element itself registers too: the RAF writes
 *  each paragraph's opacity from its station band, so captions hand
 *  off inside the card while the chrome persists. */
function CaptionSupport({
  stationKey,
  content,
  typewriter,
  register,
}: {
  stationKey: CaptionStationKey;
  content: StationContent;
  typewriter: boolean;
  register: (
    key: CaptionStationKey,
    spans: HTMLSpanElement[],
    cursor: HTMLSpanElement | null,
    para: HTMLParagraphElement | null
  ) => void;
}) {
  const supportHtml = !typewriter && content.floorHtml ? content.floorHtml : content.supportHtml;
  const lineTokens = useMemo(() => {
    if (!supportHtml) return [] as CharToken[][];
    return supportHtml.split(/<br\s*\/?>/i).map((line) => tokenize(line.trim()));
  }, [supportHtml]);

  const spanRefs = useRef<HTMLSpanElement[]>([]);
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  const paraRef = useRef<HTMLParagraphElement | null>(null);
  spanRefs.current = [];

  useEffect(() => {
    register(stationKey, spanRefs.current, cursorRef.current, paraRef.current);
  }, [register, stationKey, lineTokens]);

  if (!supportHtml) return null;

  if (!typewriter) {
    return (
      <p
        ref={paraRef}
        className="home-v2-station-header__support"
        style={{ opacity: 0 }}
        dangerouslySetInnerHTML={{ __html: supportHtml }}
      />
    );
  }

  const plain = lineTokens.map((line) => line.map((t) => t.ch).join("")).join(" ");
  let charCursor = 0;
  return (
    <p
      ref={paraRef}
      className="home-v2-station-header__support"
      style={{ opacity: 0 }}
      aria-label={plain}
    >
      <span aria-hidden="true">
        {lineTokens.map((tokens, li) => {
          const isLast = li === lineTokens.length - 1;
          return (
            <span key={`cl-${li}`} className="home-v2-station-header__line">
              {tokens.map((tok, idx) => {
                const globalIdx = charCursor++;
                return (
                  <span
                    key={`c-${li}-${idx}`}
                    ref={(el) => {
                      if (el) spanRefs.current[globalIdx] = el;
                    }}
                    className={
                      tok.em
                        ? "home-v2-station-header__char home-v2-station-header__char--em"
                        : "home-v2-station-header__char"
                    }
                    style={{ opacity: 0 }}
                  >
                    {tok.ch}
                  </span>
                );
              })}
              {isLast && (
                <span
                  ref={cursorRef}
                  className="home-v2-station-header__cursor"
                  style={{ opacity: 0 }}
                >
                  {"█"}
                </span>
              )}
            </span>
          );
        })}
      </span>
    </p>
  );
}

/** The persistent caption card itself — X1-B "dotted reticle" chrome
 *  mounted once. The reticle is set-dressing around the copy: a dashed
 *  hairline frame with gold corner crosses, a mono coord tag floating
 *  above the top-left, a tick rail hanging off the lower-right, a meta
 *  row (kicker · callsign · status) between dashed leaders, and a
 *  three-diamond pips row under the copy. The RAF loop retitles the
 *  meta row + coord tag through `metaEls` when the dominant station
 *  changes; the initial render seeds Navigate's meta so the first
 *  frame never shows an empty row. */
function CaptionCard({
  refSetter,
  metaEls,
  initialMeta,
  stations,
  typewriter,
  register,
}: {
  refSetter: (el: HTMLDivElement | null) => void;
  metaEls: React.MutableRefObject<CaptionMetaEls>;
  initialMeta?: CaptionStationMeta;
  stations: { key: CaptionStationKey; content?: StationContent }[];
  typewriter: boolean;
  register: (
    key: CaptionStationKey,
    spans: HTMLSpanElement[],
    cursor: HTMLSpanElement | null,
    para: HTMLParagraphElement | null
  ) => void;
}) {
  return (
    <div ref={refSetter} className="home-v2-caption-card" style={{ opacity: 0 }}>
      <div className="home-v2-reticle">
        <i className="home-v2-reticle__glass" aria-hidden="true" />
        <i className="home-v2-reticle__frame-x" aria-hidden="true" />
        <i className="home-v2-reticle__frame-y" aria-hidden="true" />
        <i className="home-v2-reticle__cross is-tl" aria-hidden="true" />
        <i className="home-v2-reticle__cross is-tr" aria-hidden="true" />
        <i className="home-v2-reticle__cross is-bl" aria-hidden="true" />
        <i className="home-v2-reticle__cross is-br" aria-hidden="true" />
        <span className="home-v2-reticle__coord" aria-hidden="true">
          <span
            ref={(el) => {
              metaEls.current.coordRef = el;
            }}
          >
            {initialMeta?.coord.ref ?? ""}
          </span>{" "}
          <b
            ref={(el) => {
              metaEls.current.coordT = el;
            }}
          >
            / {initialMeta?.coord.t ?? ""}
          </b>
        </span>
        <i className="home-v2-reticle__rail" aria-hidden="true" />
        <div className="home-v2-reticle__meta" aria-hidden="true">
          <span className="home-v2-reticle__lead" />
          <span className="home-v2-reticle__mi">
            <span className="home-v2-caption-diamond" />
            <span
              ref={(el) => {
                metaEls.current.kicker = el;
              }}
            >
              {initialMeta?.kicker ?? ""}
            </span>
            <span className="home-v2-caption-sep" />
            <span
              ref={(el) => {
                metaEls.current.callsign = el;
              }}
            >
              {initialMeta?.telemetry?.callsign ?? ""}
            </span>
            <span className="home-v2-caption-sep" />
            <span
              className="home-v2-reticle__status"
              ref={(el) => {
                metaEls.current.status = el;
              }}
            >
              {initialMeta?.telemetry?.status ?? ""}
            </span>
          </span>
          <span className="home-v2-reticle__lead" />
        </div>
        <div className="home-v2-reticle__body">
          <div className="home-v2-caption-copy">
            {stations.map((s) =>
              s.content ? (
                <CaptionSupport
                  key={s.key}
                  stationKey={s.key}
                  content={s.content}
                  typewriter={typewriter}
                  register={register}
                />
              ) : null
            )}
          </div>
        </div>
        <div className="home-v2-reticle__pips" aria-hidden="true">
          <span className="home-v2-caption-diamond is-dim" />
          <span className="home-v2-caption-diamond" />
          <span className="home-v2-caption-diamond is-dim" />
        </div>
      </div>
    </div>
  );
}

interface StationBlockProps {
  refSetter: (r: HTMLDivElement | null) => void;
  registerChars: (title: HTMLSpanElement[], support: HTMLSpanElement[]) => void;
  registerCursors: (title: HTMLSpanElement | null, support: HTMLSpanElement | null) => void;
  content: StationContent;
  typewriter: boolean;
  beforeContent?: ReactNode;
  afterContent?: ReactNode;
  /** Optional modifier class layered on top of `.home-v2-station-header`
   *  so the same typewriter machinery can drive blocks anchored at
   *  different viewport positions (e.g. the lower-left "signal" block
   *  for the epilogue beat). */
  variantClass?: string;
  /** Split cartouche layout (2026-06-10 polish round 4): the eyebrow +
   *  title render in a `__head` band ABOVE the sphere and the support
   *  paragraph renders in a `__support` band BELOW it. The corridor
   *  stations use this; the epilogue signal block keeps the single
   *  top-centre stack. */
  split?: boolean;
}

/** Render one header block. When `typewriter` is true the title +
 *  support are split into per-char spans (each starting at opacity 0)
 *  with a trailing block cursor. When false, render the raw HTML so
 *  the full text shows immediately (reduced-motion / mobile path,
 *  though mobile hides this layer entirely via CSS). */
function StationBlock({
  refSetter,
  registerChars,
  registerCursors,
  content,
  typewriter,
  beforeContent,
  afterContent,
  variantClass,
  split = false,
}: StationBlockProps) {
  const containerClass = [
    "home-v2-station-header",
    split ? "home-v2-station-header--split" : "",
    variantClass ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const supportHtml = !typewriter && content.floorHtml ? content.floorHtml : content.supportHtml;
  // Title and support copy may carry `<br>` separators — deliberate
  // line breaks for centred captions. The tokenizer drops unknown tags,
  // so split FIRST, tokenize each line, and render each line as a
  // block-level span. The flat char registration below concatenates
  // lines in order so the typewriter machinery is untouched.
  const titleLineTokens = useMemo(
    () => content.titleHtml.split(/<br\s*\/?>/i).map((line) => tokenize(line.trim())),
    [content.titleHtml]
  );
  const supportLineTokens = useMemo(() => {
    if (!supportHtml) return [] as CharToken[][];
    return supportHtml.split(/<br\s*\/?>/i).map((line) => tokenize(line.trim()));
  }, [supportHtml]);

  const titleSpanRefs = useRef<HTMLSpanElement[]>([]);
  const supportSpanRefs = useRef<HTMLSpanElement[]>([]);
  const titleCursorRef = useRef<HTMLSpanElement | null>(null);
  const supportCursorRef = useRef<HTMLSpanElement | null>(null);

  // Reset the per-render arrays before paint so we don't accumulate
  // stale entries across re-renders.
  titleSpanRefs.current = [];
  supportSpanRefs.current = [];

  useEffect(() => {
    registerChars(titleSpanRefs.current, supportSpanRefs.current);
    registerCursors(titleCursorRef.current, supportCursorRef.current);
  }, [registerChars, registerCursors, titleLineTokens, supportLineTokens]);

  // The numbered station eyebrow (e.g. "01 · Navigate") used to render
  // here as a cartouche above the title. It now lives once, persistently,
  // on the HUD top frame as `CorridorProgressRail` — a Navigate → Encode
  // → Build breadcrumb that appends each stage — so the per-station
  // cartouche is gone and the head band carries just the title.

  if (!typewriter) {
    const head = (
      <h2
        className="home-v2-station-header__title"
        dangerouslySetInnerHTML={{ __html: content.titleHtml }}
      />
    );
    const support = supportHtml ? (
      <p
        className="home-v2-station-header__support"
        dangerouslySetInnerHTML={{ __html: supportHtml }}
      />
    ) : null;
    return (
      <div ref={refSetter} className={containerClass} style={{ opacity: 0 }}>
        {split ? (
          /* Split blocks render the title band only — the support caption
             lives in the persistent CaptionCard (2026-07-03). */
          <div className="home-v2-station-header__head">
            <TitleConsole>{head}</TitleConsole>
          </div>
        ) : (
          <>
            {beforeContent}
            {head}
            {afterContent}
            {support}
          </>
        )}
      </div>
    );
  }

  // Accessibility: the per-char spans are presentation-only (each
  // glyph is an animated `opacity` target). Screen readers should
  // hear the FULL sentence in one go, not letter-by-letter. So the
  // heading + paragraph carry `aria-label` with the plain text and
  // their visible char spans are `aria-hidden`.
  const titlePlain = titleLineTokens.map((line) => line.map((t) => t.ch).join("")).join(" ");
  const supportPlain = supportLineTokens.map((line) => line.map((t) => t.ch).join("")).join(" ");

  // Flat char index across title/support lines — the typewriter
  // machinery reads each char array as one flat sequence, so each
  // rendered span registers at its global index regardless of which
  // visual line it sits on.
  let titleCharCursor = 0;
  let supportCharCursor = 0;

  const titleEl = (
    <h2 className="home-v2-station-header__title" aria-label={titlePlain}>
      <span aria-hidden="true">
        {titleLineTokens.map((lineTokens, li) => {
          const isLast = li === titleLineTokens.length - 1;
          return (
            <span key={`tl-${li}`} className="home-v2-station-header__line">
              {lineTokens.map((tok, idx) => {
                const globalIdx = titleCharCursor++;
                return (
                  <span
                    key={`t-${li}-${idx}`}
                    ref={(el) => {
                      if (el) titleSpanRefs.current[globalIdx] = el;
                    }}
                    className={
                      tok.em
                        ? "home-v2-station-header__char home-v2-station-header__char--em"
                        : "home-v2-station-header__char"
                    }
                    style={{ opacity: 0 }}
                  >
                    {/* Render the real character — including a real space —
                        so the browser can word-wrap at space boundaries. */}
                    {tok.ch}
                  </span>
                );
              })}
              {isLast && (
                <span
                  ref={titleCursorRef}
                  className="home-v2-station-header__cursor"
                  style={{ opacity: 0 }}
                >
                  {"\u2588"}
                </span>
              )}
            </span>
          );
        })}
      </span>
    </h2>
  );

  const supportEl =
    supportLineTokens.length > 0 ? (
      <p className="home-v2-station-header__support" aria-label={supportPlain}>
        <span aria-hidden="true">
          {supportLineTokens.map((lineTokens, li) => {
            const isLast = li === supportLineTokens.length - 1;
            return (
              <span key={`sl-${li}`} className="home-v2-station-header__line">
                {lineTokens.map((tok, idx) => {
                  const globalIdx = supportCharCursor++;
                  return (
                    <span
                      key={`s-${li}-${idx}`}
                      ref={(el) => {
                        if (el) supportSpanRefs.current[globalIdx] = el;
                      }}
                      className={
                        tok.em
                          ? "home-v2-station-header__char home-v2-station-header__char--em"
                          : "home-v2-station-header__char"
                      }
                      style={{ opacity: 0 }}
                    >
                      {tok.ch}
                    </span>
                  );
                })}
                {isLast && (
                  <span
                    ref={supportCursorRef}
                    className="home-v2-station-header__cursor"
                    style={{ opacity: 0 }}
                  >
                    {"\u2588"}
                  </span>
                )}
              </span>
            );
          })}
        </span>
      </p>
    ) : null;

  return (
    <div ref={refSetter} className={containerClass} style={{ opacity: 0 }}>
      {split ? (
        /* Split blocks render the title band only — the support caption
           lives in the persistent CaptionCard (2026-07-03). */
        <div className="home-v2-station-header__head">
          <TitleConsole>{titleEl}</TitleConsole>
        </div>
      ) : (
        <>
          {beforeContent}
          {titleEl}
          {afterContent}
          {supportEl}
        </>
      )}
    </div>
  );
}

// ── Signal (epilogue) block content ──────────────────────────────
//
// Title + paragraph for the "billions on the same layer" beat that
// appears as the user scrolls past Build (epilogue v3 planet
// landing, restored 2026-06-11 after the v4 flywheel pass was
// removed). Drawn through the SAME typewriter machinery as the
// other station blocks (per-char spans, gold `<em>` accent, block
// cursor) so the rhythm matches. Lives next to the station headers
// because the markup, type-out, and `position: fixed` viewport
// anchor pattern are identical — only the CSS variant (`--signal`)
// and the opacity driver differ.
const SIGNAL_CONTENT: StationContent = {
  titleHtml: "EVERYONE IS RACING TO<br>BUILD <em>THIS LAYER</em>.",
};

interface SignalTickerItem {
  source: string;
  headline: string;
}

const SIGNAL_TICKER_ITEMS: SignalTickerItem[] = [
  {
    source: "OpenAI",
    headline: "launches a $10B Deployment Company to put AI inside business workflows",
  },
  {
    source: "Anthropic",
    headline: "backs a $1.5B AI consultancy to drive Claude adoption across enterprises",
  },
  {
    source: "Palantir",
    headline: "Forward Deployed Engineers embed to capture how each company works",
  },
  {
    source: "Stripe",
    headline: "staffs AI-natives inside marketing until the team can run it alone",
  },
];

const TICKER_DIAMOND_SEP = "     \u25C6     ";

/** World radius of the planet's visible golden atmosphere (the dotted
 *  shell of the substrate gyro the epilogue camera flies to). Matches
 *  `ShellSubstrateGyro` so the projected ring lands on the real limb. */
const PLANET_LIMB_WORLD_RADIUS =
  SUBSTRATE_GYRO_GLOBE_RADIUS * SUBSTRATE_GYRO_DOTTED_SHELL_RADIUS_MUL * GYRO_ASSEMBLY_SCALE;
/** Ring radius as a fraction of the projected limb. >1 so the headline
 *  ring sits OUTSIDE the particle shell — in the dark band just above
 *  where the planet's particles end — reading as a true outer ring
 *  rather than cutting through the atmosphere. */
const TICKER_RING_RADIUS_MUL = 1.07;
/** MAX half-angle (rad, from the top) the headline arc may span. The
 *  ACTUAL span is solved per-frame (see the tick) so the arc endpoints
 *  always land `TICKER_EDGE_MARGIN_PX` BEYOND the viewport edges — the
 *  scrolling headlines bleed OFF screen on both sides instead of ending
 *  in view. This cap only bites if the planet ever projects small (so the
 *  arc can't reach the edges); it keeps the ring from wrapping absurdly
 *  far down the limb in that degenerate case. */
const TICKER_ARC_MAX_HALF_SPAN = (74 * Math.PI) / 180;
/** Pixels beyond each viewport edge the arc endpoints reach, so the
 *  scrolling headlines run fully off-screen on both sides rather than
 *  truncating / fading in view. */
const TICKER_EDGE_MARGIN_PX = 96;
/** Smoothed epilogue scrub below which the ticker is not painted
 *  (the planet hasn't landed and the title hasn't faded in yet). */
const TICKER_MIN_EP = 0.42;
/** Boost on the ticker's exit lift relative to the signal title/CTA
 *  (`--signal-exit-lift`). 1 means the ticker translates on EXACTLY the
 *  same raw dock clock as "EVERYONE IS RACING..." — not a frame before,
 *  not faster. Earlier variants either boosted this lift or replaced it
 *  with the smoothed camera fly-in; both made the ticker exit ahead of
 *  the headline. */
const TICKER_EXIT_LIFT_BOOST = 1;
/** How much of the sphere's radial dissipate scatter the ticker arc
 *  adopts so it FOLLOWS THE SPHERE'S ARC as the planet expands. The arc
 *  radius is multiplied by `1 + (dissipateShellScatter - 1) * SHARE`,
 *  keyed to the SAME smoothed-dissipate clock the substrate shell uses
 *  (`getSmoothedDissipate`) — so the ticker widens / flattens at the
 *  sphere's pace, hugging the dotted-shell limb as it scatters outward.
 *
 *  Was 0 (radius pinned to the parked limb) while the ticker still had
 *  no z-index and the rising `#services` covered it — any arc growth
 *  then read as "disappears too soon". Now that the ticker shares the
 *  title's `z-index: 15` (no occlusion), the arc can expand with the
 *  sphere safely. Kept a fraction (not 1.0) so the readable headline
 *  near the apex doesn't outrun the title's CSS lift off the top — the
 *  vertical exit stays group-synced while the curvature follows the
 *  sphere (2026-06-19 sphere-follow pass). */
const TICKER_SHELL_SCATTER_SHARE = 0.6;

/**
 * EpilogueNewsTicker — headline ring welded to the substrate planet.
 *
 * The planet is a WebGL object whose on-screen centre + radius change
 * with the epilogue camera flight, the planet-grow, the dock recede,
 * AND the viewport. A fixed CSS arc cannot track that (it read as
 * "completely off" at other viewports). Instead this runs its own rAF
 * that mirrors the epilogue camera (single source: `getEpilogueCameraPose`
 * + the same docked-pose ease as `FlyingCameraRig`), projects the planet
 * centre and a limb point to screen, and rewrites a circular-arc path on
 * that real circle every frame. The text rides the arc as an outer ring;
 * opacity mirrors the signal block so it cross-dissolves with the title.
 */
function EpilogueNewsTicker({ animate }: { animate: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const aspect = () => window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(getCameraFov(aspect()), aspect(), 0.1, 100);
    const center = new THREE.Vector3();
    const edge = new THREE.Vector3();
    const right = new THREE.Vector3();
    const proj = new THREE.Vector3();

    let raf = 0;
    let lastT = 0;
    let dockBlend = 0;
    let last = { cx: -1, cy: -1, r: -1, op: -1 };

    const onResize = () => {
      camera.aspect = aspect();
      camera.fov = getCameraFov(camera.aspect);
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const svg = svgRef.current;
      const path = pathRef.current;
      if (!svg || !path) return;

      // Ticker opacity is CSS-driven via `--signal-opacity` (single-writer
      // sync, 2026-06-19), so this rAF does NOT set opacity. `sigOp` is read
      // only as a cheap input to the skip-relayout cache below (so the arc
      // path isn't rewritten when nothing meaningful changed).
      const sigEl = document.querySelector<HTMLElement>(".home-v2-station-header--signal");
      const sigOp = sigEl ? parseFloat(sigEl.style.opacity || "0") : 0;

      const transform = useDepthGatewayStore.getState().transform;
      const smoothedEp = getSmoothedEpilogueProgress();
      // Match FlyingCameraRig: ease the effective scrub toward the held
      // docked pose so the ring keeps tracking the sphere into the dock.
      const dt = Math.min(0.1, Math.max(0, (now - lastT) / 1000));
      lastT = now;
      dockBlend += ((transform.docked ? 1 : 0) - dockBlend) * (1 - Math.exp(-dt / 0.28));
      const ep = smoothedEp + (DOCKED_INSTRUMENT_EPILOGUE_POSE - smoothedEp) * dockBlend;

      if (ep <= TICKER_MIN_EP) {
        // Skip geometry work only while the planet hasn't landed. Ticker
        // visibility is CSS-driven by `--signal-opacity` from the signal
        // rAF; do NOT gate path drawing on `sigEl.style.opacity` here.
        // That inline value can be stale for one frame at the dock boundary,
        // which previously left the ticker path empty while the title/CTA
        // were visibly on-screen.
        if (last.op !== 0) {
          last = { cx: -1, cy: -1, r: -1, op: 0 };
        }
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // EXIT SYNC (2026-06-19 ticker timing): keep the ticker on the
      // docked-pose limb and move it with the SAME raw dock clock as
      // the signal title/CTA (`--signal-exit-lift`). The previous
      // smoothed camera-fly-in weld made the arc react on the sphere's
      // camera clock, which could push/clip the ticker before the
      // "EVERYONE IS RACING..." group visibly started its exit. Here:
      //
      //   - CAMERA stays at the docked epilogue limb, so projection
      //     remains stable and cannot vanish at the fly-through guard
      //     (the fly-in dive sent the arc off the top before the title).
      //   - TRANSLATE is owned by `--ticker-exit-lift` below, exactly
      //     matched to the title/CTA lift clock (vertical exit stays
      //     group-synced).
      //   - RADIUS rides the sphere's OWN shell-scatter clock
      //     (`getSmoothedDissipate`, the same value `ShellSubstrateGyro`
      //     uses) so the arc curvature widens / flattens at the sphere's
      //     pace and hugs the expanding dotted-shell limb.
      const tickerExit = transform.docked ? getSmoothedDissipate() : 0;
      const basePose = getEpilogueCameraPose(ep);
      const camPos = basePose.position;
      const camLook = basePose.lookAt;
      camera.position.set(camPos[0], camPos[1], camPos[2]);
      camera.up.set(0, 1, 0);
      camera.lookAt(camLook[0], camLook[1], camLook[2]);
      camera.updateMatrixWorld();

      center.set(
        BRANDMARK_ANCHOR_INTELLIGENCE[0],
        BRANDMARK_ANCHOR_INTELLIGENCE[1],
        BRANDMARK_ANCHOR_INTELLIGENCE[2]
      );
      proj.copy(center).project(camera);
      // `proj.z` outside [-1, 1] means the planet centre is behind / past
      // the camera (it has flown through) — the projection is meaningless,
      // so hold the last good arc and let opacity finish the exit.
      const centreValid = proj.z > -1 && proj.z < 1;
      const cx = (proj.x * 0.5 + 0.5) * vw;
      const cy = (-proj.y * 0.5 + 0.5) * vh;

      // Screen radius: project a limb point (centre + worldRadius along
      // camera-right), same technique the brandmark uses for its width.
      // The ticker takes `TICKER_SHELL_SCATTER_SHARE` of the sphere's
      // shell scatter on the sphere's own smoothed-dissipate clock, so
      // the arc expands outward with the swelling planet at the sphere's
      // pace while the vertical exit stays locked to the title lift.
      const fullShellScatter = dissipateShellScatter(tickerExit);
      const tickerShellScatter = 1 + (fullShellScatter - 1) * TICKER_SHELL_SCATTER_SHARE;
      const worldRadius =
        PLANET_LIMB_WORLD_RADIUS * getEpiloguePlanetScale(ep) * tickerShellScatter;
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      edge.copy(center).addScaledVector(right, worldRadius);
      proj.copy(edge).project(camera);
      const edgeX = (proj.x * 0.5 + 0.5) * vw;
      const edgeY = (-proj.y * 0.5 + 0.5) * vh;
      const ringR = Math.hypot(edgeX - cx, edgeY - cy) * TICKER_RING_RADIUS_MUL;

      // Projection guard: if the centre is behind the camera or the radius
      // is non-finite / absurd (camera near the surface), keep the last
      // valid arc and just keep the opacity fade alive — never paint a
      // blown-up ring.
      if (!centreValid || !Number.isFinite(ringR) || ringR > vw * 3) {
        // Hold the last good arc; opacity stays CSS-driven (`--signal-opacity`).
        last = { ...last, op: sigOp };
        return;
      }

      // Skip the text-on-path relayout when nothing moved meaningfully.
      if (
        last.op === sigOp &&
        Math.abs(cx - last.cx) < 0.5 &&
        Math.abs(cy - last.cy) < 0.5 &&
        Math.abs(ringR - last.r) < 0.5
      ) {
        return;
      }

      // Circular cap centred on (cx, cy) at radius ringR, spanning
      // ±halfSpan around 12 o'clock so the headline reads left→right over
      // the limb. point(a) = (cx + r·sin a, cy − r·cos a).
      //
      // The half-span is SOLVED so the endpoints land `TICKER_EDGE_MARGIN_PX`
      // beyond the viewport edges (capped) — `cx + ringR·sin(halfSpan) =
      // edge + margin` ⇒ `sin(halfSpan) = (halfWidth + margin) / ringR`.
      // This makes the scrolling headlines bleed OFF screen on both sides
      // (the marquee runs in from off the left and out off the right)
      // rather than truncating in view, and it self-sizes across viewports
      // and as the planet's projected radius changes.
      const reach = (Math.max(cx, vw - cx) + TICKER_EDGE_MARGIN_PX) / ringR;
      const halfSpan = Math.min(
        TICKER_ARC_MAX_HALF_SPAN,
        Math.asin(Math.min(1, Math.max(0, reach)))
      );
      const x0 = cx + ringR * Math.sin(-halfSpan);
      const y0 = cy - ringR * Math.cos(-halfSpan);
      const x1 = cx + ringR * Math.sin(halfSpan);
      const y1 = cy - ringR * Math.cos(halfSpan);
      path.setAttribute(
        "d",
        `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${ringR.toFixed(1)} ${ringR.toFixed(1)} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`
      );

      // Opacity is owned by CSS `--signal-opacity` (single-writer sync,
      // 2026-06-19) — this rAF only rewrites the arc PATH.
      last = { cx, cy, r: ringR, op: sigOp };
    };

    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const segments = SIGNAL_TICKER_ITEMS.map((item, i) => (
    <tspan key={i}>
      <tspan className="home-v2-signal-ticker__source">{item.source}</tspan>
      {` ${item.headline}${TICKER_DIAMOND_SEP}`}
    </tspan>
  ));

  return (
    <svg ref={svgRef} className="home-v2-signal-ticker" aria-hidden="true" focusable="false">
      <defs>
        <path ref={pathRef} id="home-v2-signal-ticker-arc" d="" />
      </defs>
      <text className="home-v2-signal-ticker__text">
        <textPath href="#home-v2-signal-ticker-arc" startOffset={animate ? "0%" : "12%"}>
          {segments}
          {segments}
          {animate && (
            <animate
              attributeName="startOffset"
              from="0%"
              to="-50%"
              dur="20s"
              repeatCount="indefinite"
            />
          )}
        </textPath>
      </text>
    </svg>
  );
}

/** Three-chevron cluster, reused mirrored on both sides of the signal
 *  CTA — pointing INWARD (converging on the label) rather than the
 *  hero CTA's outward-pointing runway, so the button reads as a
 *  docking/focus target rather than a "go this way" arrow. */
function ChevronCluster({ flipped }: { flipped?: boolean }) {
  return (
    <span
      className={
        flipped
          ? "home-v2-signal-cta__chevrons home-v2-signal-cta__chevrons--right"
          : "home-v2-signal-cta__chevrons home-v2-signal-cta__chevrons--left"
      }
      aria-hidden="true"
    >
      <span className="home-v2-signal-cta__chev" />
      <span className="home-v2-signal-cta__chev" />
      <span className="home-v2-signal-cta__chev" />
    </span>
  );
}

function SignalActions() {
  return (
    <div className="home-v2-signal-actions">
      <a className="home-v2-signal-cta" href="#contact">
        <ChevronCluster />
        <span className="home-v2-signal-cta__label">WE HELP YOU BUILD YOURS</span>
        <ChevronCluster flipped />
      </a>
      <p className="home-v2-signal-note">Before the lab sells it back to you.</p>
    </div>
  );
}

export function CorridorStationHeaders() {
  const nav = stationById("navigate")?.content;
  const enc = stationById("diagnostic")?.content;
  const bld = stationById("intelligence")?.content;
  const sig = SIGNAL_CONTENT;

  // Reduced-motion / SSR-safe detection. Cached at mount (a one-time
  // read is plenty; if the user toggles `prefers-reduced-motion` mid-
  // session the page can be reloaded).
  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }, []);
  const typewriter = !reducedMotion;

  // Meta readouts per corridor station for the persistent caption
  // card: kicker + telemetry feed the reticle meta row (from
  // corridorMap content), the coord tag is decorative survey-fix
  // set-dressing per station. Captured by the RAF closure below.
  const captionMeta: Record<CaptionStationKey, CaptionStationMeta> = {
    nav: {
      kicker: nav?.kicker,
      telemetry: nav?.telemetry,
      coord: { ref: "REF 112.4", t: "T+0018" },
    },
    enc: {
      kicker: enc?.kicker,
      telemetry: enc?.telemetry,
      coord: { ref: "REF 122.4", t: "T+0042" },
    },
    bld: {
      kicker: bld?.kicker,
      telemetry: bld?.telemetry,
      coord: { ref: "REF 132.4", t: "T+0077" },
    },
  };

  // Container + per-char ref state per station.
  const stationRefs = useRef<Record<"nav" | "enc" | "bld" | "sig", StationRefs>>({
    nav: {
      container: null,
      titleChars: [],
      supportChars: [],
      titleCursor: null,
      supportCursor: null,
    },
    enc: {
      container: null,
      titleChars: [],
      supportChars: [],
      titleCursor: null,
      supportCursor: null,
    },
    bld: {
      container: null,
      titleChars: [],
      supportChars: [],
      titleCursor: null,
      supportCursor: null,
    },
    sig: {
      container: null,
      titleChars: [],
      supportChars: [],
      titleCursor: null,
      supportCursor: null,
    },
  });

  const stationStates = useRef<Record<"nav" | "enc" | "bld" | "sig", StationState>>({
    nav: makeInitialState(),
    enc: makeInitialState(),
    bld: makeInitialState(),
    sig: makeInitialState(),
  });

  // Last-written container opacities (suppress redundant DOM writes).
  const lastContainerOps = useRef<{
    nav: number;
    enc: number;
    bld: number;
    sig: number;
  } | null>(null);

  // Persistent caption card refs + runtime state (one artifact,
  // 2026-07-03). The card element, its meta-row / coord-tag text
  // spans, and the three stacked support paragraphs are all driven
  // from the RAF loop: card opacity on its own band, paragraph opacity
  // per station band, meta text following the dominant station.
  const captionCardRef = useRef<HTMLDivElement | null>(null);
  const captionMetaEls = useRef<CaptionMetaEls>({
    kicker: null,
    callsign: null,
    status: null,
    coordRef: null,
    coordT: null,
  });
  const captionParas = useRef<Record<CaptionStationKey, HTMLParagraphElement | null>>({
    nav: null,
    enc: null,
    bld: null,
  });
  const captionState = useRef<{
    lastOp: number;
    framed: boolean;
    activeKey: CaptionStationKey | null;
  }>({ lastOp: -1, framed: false, activeKey: null });
  // In-flight scramble-decode jobs for the meta row + coord tag,
  // advanced by the RAF tick below.
  const captionScrambles = useRef<ScrambleJob[]>([]);

  useEffect(() => {
    let raf = 0;
    let lastArcStage: ArcStage | null = null;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = useDepthGatewayStore.getState().transform;
      const painting = t.active || t.armed;
      const p = painting ? t.paintProgress : 0;
      const corridorEngaged = painting;
      const inEpilogue = t.epilogueProgress > 0.001;
      const docked = t.docked;
      const nowSec = performance.now() / 1000;

      // Publish the Arc stage for the left-rail station label (see the
      // ARC_* constants). Delta-gated: one attribute write per stage
      // change, none per frame. Reverse scroll reverses by construction.
      const arcStage: ArcStage | null = !painting
        ? null
        : p < ARC_ENCODE_AT
          ? "navigate"
          : p < ARC_BUILD_AT
            ? "encode"
            : "build";
      if (arcStage !== lastArcStage) {
        lastArcStage = arcStage;
        if (arcStage) document.documentElement.setAttribute("data-arc-stage", arcStage);
        else document.documentElement.removeAttribute("data-arc-stage");
      }

      // Epilogue v3 (planet landing, restored 2026-06-11) — Build
      // header fades out on BUILD_OUT and the billions title fades
      // in on TITLE_IN, landing as the camera completes the tilt-up
      // to the surface POV. The gap between the two bands is filled
      // by the fly-in and the landing tilt, so the user never has
      // both titles on screen at once. Reads the SMOOTHED epilogue
      // scrub (motion follower channel) so both text fades ride the
      // same clock as the gliding camera + planet.
      const ep = getSmoothedEpilogueProgress();
      const buildOut = 1 - epilogueBand(ep, "BUILD_OUT");
      const titleIn = epilogueBand(ep, "TITLE_IN");
      // Fade the labs signal out as the corridor stage scrolls away beneath
      // the production corridor-exit zoom-dissipate (ADR-021). The sphere +
      // title hold a full viewport at the epilogue climax; once #services
      // enters the dock window, `useCorridorExitScroll` ramps `dockProgress`
      // (the dissipate clock) from 0 → 1 across the first Services
      // viewport, and the sphere dissipates with it. The BILLIONS title
      // belongs to the sphere scene, so it now yields across a DELAYED
      // tail-band (SIGNAL_OUT 0.86 → 0.99): the title/CTA visibly lift
      // with the sphere first, the ticker starts moving on the exact
      // same lift clock while its arc borrows a restrained outward
      // shell expansion, THEN the whole signal group fades out at the
      // tail.
      // Earlier tuning faded on the front half (0.04 → 0.42), which
      // made the ticker vanish before its movement was legible. On
      // /test/home-v2 there is no exit hook so `docked` stays false
      // and the title simply stays up.
      // Persistent dissipate clock (ADR-021 amendment, 2026-06-19).
      // The dock now releases on a SHORT runway (`DISSIPATE_SCROLL_SPAN_VH
      // = 0.9`), so `docked` flips false while the corridor stage is still
      // momentarily engaged at the seam. Gating the fade behind `docked`
      // and reading `t.dockProgress` (which the exit hook RESETS to 0 on
      // release) made the BILLIONS title + CTA + ticker POP back to full
      // opacity for the scroll band right as `#services` reaches the top.
      // Read the eased dissipate the exit hook writes on `<html>` instead:
      // it ramps 0 -> 1 with the section and STAYS at 1 after the section
      // scrolls past, so the fade + lift complete and stay complete.
      // Reads the INLINE custom prop (cheap, no style recalc). During the
      // corridor climax (before `#services` enters) it is "0.0000" so the
      // signal holds full; on `/test/home-v2` there is no exit hook so it
      // is "" -> 0 and the title simply stays up (prior behavior).
      const dissipateStr = document.documentElement.style.getPropertyValue("--corridor-dissipate");
      const exitDissipate = dissipateStr ? parseFloat(dissipateStr) || 0 : 0;
      const titleOut = dissipateBand(exitDissipate, "SIGNAL_OUT");
      // ADR-021 follow-through: the signal group (BILLIONS title + CTA +
      // note) AND the news ticker should be PUSHED OUT of the top of the
      // viewport as the user scrolls into the dissipate — not fade in
      // place. The dissipate clock is exactly `(vh - servicesRect.top) /
      // vh`, so a lift of `-dissipate * vh` moves the fixed signal layer
      // up 1:1 with scroll: it reads as the epilogue scene scrolling away
      // under the rising services section (the sphere zooms via the
      // camera fly-in; the text + ticker ride straight up and off). The
      // lift is LINEAR (not eased) so the 1:1 scroll coupling is exact,
      // and it spans a FULL viewport so the whole group clears the top
      // well before the opacity fade (SIGNAL_OUT) even begins — the fade
      // is now only a safety for short viewports / the dock release, the
      // exit itself is pure translation. Exposed as a CSS var on <html>
      // so the independently fixed ticker SVG rides the same clock
      // without being nested under the signal block's transform (nesting
      // would break its viewport-space limb projection).
      const signalDriftRaw = exitDissipate;
      const vhNow = typeof window !== "undefined" ? window.innerHeight || 1 : 1;
      const signalLiftPx = reducedMotion ? 0 : -signalDriftRaw * vhNow;
      const signalScale = reducedMotion ? 1 : 1 - signalDriftRaw * 0.03;
      // Ticker exit (2026-06-19 sync pass): move the ticker on the same
      // raw lift as the title/CTA. The ring's rAF still expands the arc
      // outward with a restrained shell-scatter share, but the visible
      // upward exit starts with "EVERYONE IS RACING..." and not a moment
      // before.
      const tickerLiftPx = reducedMotion ? 0 : -signalDriftRaw * vhNow * TICKER_EXIT_LIFT_BOOST;
      const containerOps = {
        nav: bandOpacity(p, NAVIGATE_FADE_IN, NAVIGATE_FADE_OUT),
        enc: bandOpacity(p, ENCODE_FADE_IN, ENCODE_FADE_OUT),
        bld: bandOpacity(p, BUILD_FADE_IN) * buildOut,
        // Signal block — billions title + ticker + CTA. Visible through
        // the epilogue AND the docked handoff, cross-dissolving out via
        // `titleIn * (1 - titleOut)` so it never collides with the
        // services copy rising over the persistent sphere.
        sig: docked || (corridorEngaged && inEpilogue) ? titleIn * (1 - titleOut) : 0,
      };

      // Container opacity writes (suppress when no meaningful change).
      const last = lastContainerOps.current;
      const containerChanged =
        !last ||
        Math.abs(last.nav - containerOps.nav) > 0.002 ||
        Math.abs(last.enc - containerOps.enc) > 0.002 ||
        Math.abs(last.bld - containerOps.bld) > 0.002 ||
        Math.abs(last.sig - containerOps.sig) > 0.002;
      if (containerChanged) {
        lastContainerOps.current = { ...containerOps };
        for (const key of ["nav", "enc", "bld", "sig"] as const) {
          const el = stationRefs.current[key].container;
          if (el) el.style.opacity = containerOps[key].toFixed(3);
        }
        // Caption paragraphs ride the SAME per-station bands as the
        // titles — each types in / fades out on its own station clock
        // while the card chrome around them persists.
        for (const key of ["nav", "enc", "bld"] as const) {
          const para = captionParas.current[key];
          if (para) para.style.opacity = containerOps[key].toFixed(3);
        }
      }
      const signalEl = stationRefs.current.sig.container;
      if (signalEl) {
        if (containerOps.sig >= TYPER_ARRIVE_OPACITY) signalEl.removeAttribute("inert");
        else signalEl.setAttribute("inert", "");
      }

      // World-coupled parallax for the bottom-centre cartouche
      // (2026-06-10 polish round 3). Read the live gyro bank and
      // shift each corridor cartouche by a small pixel offset so the
      // caption visibly belongs to the rotating instrument while
      // staying screen-aligned for legibility. Capped at 8px so the
      // text never travels far enough to break the centred
      // composition. Reduced-motion / non-gyro setups read 0 (no
      // parallax) because `gyroTilt.{x,y}` are 0 when the lab is
      // disabled and the calmed pointer bank settles to 0 too.
      const PARALLAX_PX = reducedMotion ? 0 : 8;
      const px = (gyroTilt.y * PARALLAX_PX).toFixed(2);
      const py = (-gyroTilt.x * PARALLAX_PX).toFixed(2);
      const cartoucheTransform = `translate3d(-50%, 0, 0) translate(${px}px, ${py}px)`;
      for (const key of ["nav", "enc", "bld"] as const) {
        const el = stationRefs.current[key].container;
        if (el) el.style.transform = cartoucheTransform;
      }

      // ── Persistent caption card (one artifact, 2026-07-03) ────────
      // The UNFOLD is the reveal (2026-07-04): the container does NOT
      // fade in on the scroll band — un-armed chrome is collapsed
      // (scaleX/scaleY 0, opacities 0), so the card is invisible until
      // the arm threshold fires and the CSS centre-out unfold plays
      // time-based at full container opacity. Scrubbing the container
      // opacity on the band (the previous scheme) played the unfold
      // under a half-transparent card and read as a plain fade.
      // The band now only ARMS/DISARMS the chrome; the container
      // opacity carries just the epilogue yield (BUILD_OUT — same
      // clock as the Build title) and the corridor-engaged gate. It
      // banks with the same cartouche parallax as the titles.
      const cardEl = captionCardRef.current;
      if (cardEl) {
        const cs = captionState.current;
        const cardBand = bandOpacity(p, NAVIGATE_FADE_IN) * buildOut;
        const cardOp = corridorEngaged ? buildOut : 0;
        if (Math.abs(cardOp - cs.lastOp) > 0.002) {
          cs.lastOp = cardOp;
          cardEl.style.opacity = cardOp.toFixed(3);
        }
        cardEl.style.transform = cartoucheTransform;
        // Chrome arm/rearm — the unfold plays on arm, the collapse (its
        // exact reverse) on disarm, so scroll-back irises the card shut
        // instead of popping it off.
        if (!cs.framed && cardBand >= TYPER_ARRIVE_OPACITY) {
          cs.framed = true;
          cardEl.classList.add("is-armed");
        } else if (cs.framed && cardBand < TYPER_REARM_OPACITY) {
          cs.framed = false;
          cardEl.classList.remove("is-armed");
        }
        // Meta row + coord tag follow the DOMINANT station — the moment
        // a new station's band outweighs the rest, each readout
        // SCRAMBLE-DECODES into the next station's text (chars shuffle
        // through HUD glyphs and resolve left-to-right) instead of
        // hard-swapping. Holds the last station's readout through the
        // between-station travel so the chrome never blanks. Reduced
        // motion swaps instantly.
        let activeKey = cs.activeKey;
        let best = 0.15;
        for (const key of ["nav", "enc", "bld"] as const) {
          if (containerOps[key] > best) {
            best = containerOps[key];
            activeKey = key;
          }
        }
        if (activeKey && activeKey !== cs.activeKey) {
          cs.activeKey = activeKey;
          // Reflect the dominant station on the card so CSS can tune the
          // glass plate per station — Build reads slightly darker / less
          // transparent (subtle weight as the arc lands its last beat).
          cardEl.setAttribute("data-station", activeKey);
          const meta = captionMeta[activeKey];
          const els = captionMetaEls.current;
          const retitle = (el: HTMLElement | null, text: string | undefined) => {
            if (!el || text == null) return;
            if (typewriter) queueScramble(captionScrambles.current, el, text, nowSec);
            else el.textContent = text;
          };
          retitle(els.kicker, meta.kicker);
          retitle(els.callsign, meta.telemetry?.callsign);
          retitle(els.status, meta.telemetry?.status);
          retitle(els.coordRef, meta.coord.ref);
          retitle(els.coordT, `/ ${meta.coord.t}`);
        }
        // Advance any in-flight scrambles on the same tick that owns
        // every other caption write (single-writer rule).
        advanceScrambles(captionScrambles.current, nowSec);
      }
      // Signal block: centred (translateX -50%) + scroll-coupled upward
      // lift so it is pushed out of the top of the viewport with scroll.
      const sigEl = stationRefs.current.sig.container;
      if (sigEl) {
        sigEl.style.transform = `translate3d(-50%, ${signalLiftPx.toFixed(2)}px, 0) scale(${signalScale.toFixed(4)})`;
      }
      // Title/CTA read these inherited vars for the 1:1 push-out. The
      // ticker SVG reads BOTH `--signal-exit-lift` (same translate) AND
      // `--signal-opacity` (same opacity) from THIS single rAF, so the
      // whole signal group — title, CTA, and news ticker — is driven by
      // ONE writer on ONE frame and can never desync. (Previously the
      // ticker ran its own rAF that re-read the signal opacity + store a
      // frame apart, which made it blank/clip out of step with the title
      // at the dock boundary — 2026-06-19 single-writer sync.)
      document.documentElement.style.setProperty(
        "--signal-exit-lift",
        `${signalLiftPx.toFixed(2)}px`
      );
      document.documentElement.style.setProperty("--signal-exit-scale", signalScale.toFixed(4));
      document.documentElement.style.setProperty(
        "--ticker-exit-lift",
        `${tickerLiftPx.toFixed(2)}px`
      );
      document.documentElement.style.setProperty("--signal-opacity", containerOps.sig.toFixed(4));

      // Per-station typewriter pass.
      for (const key of ["nav", "enc", "bld", "sig"] as const) {
        const refs = stationRefs.current[key];
        const state = stationStates.current[key];
        const op = containerOps[key];

        // Re-arm when the header has cleanly left the viewport
        // (opacity below REARM). Reset per-char opacities so the
        // next arrival types out from scratch.
        if (op < TYPER_REARM_OPACITY) {
          // Fold the console frames back so the next arrival unfolds
          // fresh (class transition handles the collapse).
          if (state.framed) {
            state.framed = false;
            refs.container?.classList.remove("is-armed");
          }
          if (state.typing) {
            state.typing = false;
            state.titleHead = -1;
            state.supportHead = -1;
            if (typewriter) {
              for (const span of refs.titleChars) {
                if (span) span.style.opacity = "0";
              }
              for (const span of refs.supportChars) {
                if (span) span.style.opacity = "0";
              }
              // Cursor visibility is class-based — strip the alive
              // modifier so the blink animation stops and the inline
              // `opacity: 0` (set on first render) takes over.
              if (refs.titleCursor) {
                refs.titleCursor.classList.remove("home-v2-station-header__cursor--alive");
              }
              if (refs.supportCursor) {
                refs.supportCursor.classList.remove("home-v2-station-header__cursor--alive");
              }
            }
          }
          continue;
        }

        // Unfold the console frame chrome the instant the header
        // crosses ARRIVE — the same frame the typewriter arms below,
        // so frames and first chars start together with no delay.
        // Runs BEFORE the reduced-motion skip: that path still gets
        // the frames (CSS disables the unfold transition there).
        if (!state.framed && op >= TYPER_ARRIVE_OPACITY) {
          state.framed = true;
          refs.container?.classList.add("is-armed");
        }

        // Skip the typewriter machinery entirely when the user
        // prefers reduced motion — the raw-HTML branch in
        // StationBlock already renders the full text.
        if (!typewriter) continue;

        // Arm + stamp start time on first crossing of ARRIVE.
        if (!state.typing && op >= TYPER_ARRIVE_OPACITY) {
          state.typing = true;
          state.startSec = nowSec;
          state.titleHead = -1;
          state.supportHead = -1;
        }

        if (!state.typing) continue;

        const elapsed = nowSec - state.startSec;
        const titleCount = refs.titleChars.length;
        const supportCount = refs.supportChars.length;
        const titleDur = titleCount / TYPER_TITLE_CPS;

        // Title head — fractional count of chars currently revealed.
        // The fractional remainder fades the most-recent char in
        // over TYPER_CHAR_FADE_S, so each glyph eases on instead of
        // hard-popping. After the last char, head saturates at
        // titleCount and the cursor moves to the support line.
        const titleHeadRaw = Math.max(0, Math.min(titleCount, elapsed * TYPER_TITLE_CPS));
        const titleFinishedAt = titleDur;
        const supportStart = titleFinishedAt + TYPER_GAP_S;
        const supportElapsed = elapsed - supportStart;
        const supportHeadRaw =
          supportCount > 0 && supportElapsed > 0
            ? Math.max(0, Math.min(supportCount, supportElapsed * TYPER_SUPPORT_CPS))
            : 0;

        // Only walk the char arrays when the head moved enough to
        // change a visible state. Tracking the integer "next char to
        // touch" minimises DOM writes.
        const titleHeadInt = Math.floor(titleHeadRaw);
        const supportHeadInt = Math.floor(supportHeadRaw);

        if (titleHeadInt !== state.titleHead) {
          // Set fully-typed chars to 1; the head char gets the
          // fractional fade-in (computed below). Chars beyond the
          // head stay 0. We only touch what changed since last
          // frame's head — bounded by titleHeadInt + 1 spans.
          for (let i = Math.max(0, state.titleHead); i <= titleHeadInt && i < titleCount; i++) {
            const span = refs.titleChars[i];
            if (!span) continue;
            if (i < titleHeadInt) span.style.opacity = "1";
          }
          state.titleHead = titleHeadInt;
        }
        // Fractional fade-in for the current head char.
        if (titleHeadInt < titleCount) {
          const span = refs.titleChars[titleHeadInt];
          if (span) {
            const frac = titleHeadRaw - titleHeadInt;
            const fade = Math.min(1, frac / Math.max(0.001, TYPER_TITLE_CPS * TYPER_CHAR_FADE_S));
            span.style.opacity = fade.toFixed(3);
          }
        }

        if (supportHeadInt !== state.supportHead) {
          for (
            let i = Math.max(0, state.supportHead);
            i <= supportHeadInt && i < supportCount;
            i++
          ) {
            const span = refs.supportChars[i];
            if (!span) continue;
            if (i < supportHeadInt) span.style.opacity = "1";
          }
          state.supportHead = supportHeadInt;
        }
        if (supportCount > 0 && supportHeadInt < supportCount && supportElapsed > 0) {
          const span = refs.supportChars[supportHeadInt];
          if (span) {
            const frac = supportHeadRaw - supportHeadInt;
            const fade = Math.min(1, frac / Math.max(0.001, TYPER_SUPPORT_CPS * TYPER_CHAR_FADE_S));
            span.style.opacity = fade.toFixed(3);
          }
        }

        // Cursor visibility: title cursor while title is typing OR
        // during the gap; support cursor while support is typing.
        // Toggle a CSS class (`--alive`) rather than writing opacity
        // directly — the blink keyframe animates opacity, and inline
        // styles lose to keyframes, so we hide the cursor by NOT
        // running the animation in the first place.
        const titleDone = titleHeadInt >= titleCount;
        const supportDone = supportCount === 0 || supportHeadInt >= supportCount;
        const titleAlive = !titleDone || supportElapsed < 0;
        const supportAlive = titleDone && supportElapsed > 0 && !supportDone;
        if (refs.titleCursor) {
          refs.titleCursor.classList.toggle("home-v2-station-header__cursor--alive", titleAlive);
        }
        if (refs.supportCursor) {
          refs.supportCursor.classList.toggle(
            "home-v2-station-header__cursor--alive",
            supportAlive
          );
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // WebGL-fallback / unmount: no Arc writer → the rail label simply
      // stays closed during the corridor (pre-Update-3 behavior).
      document.documentElement.removeAttribute("data-arc-stage");
    };
  }, [typewriter]);

  const setNavRef = (el: HTMLDivElement | null) => {
    stationRefs.current.nav.container = el;
  };
  const setEncRef = (el: HTMLDivElement | null) => {
    stationRefs.current.enc.container = el;
  };
  const setBldRef = (el: HTMLDivElement | null) => {
    stationRefs.current.bld.container = el;
  };
  const setSigRef = (el: HTMLDivElement | null) => {
    if (el) el.setAttribute("inert", "");
    stationRefs.current.sig.container = el;
  };

  // Corridor stations register TITLE spans only — their support spans
  // live in the persistent CaptionCard, which registers them (plus the
  // paragraph element) through `registerCaptionSupport` below. The
  // signal block keeps the combined registration (its support renders
  // inline in the non-split branch).
  const navRegisterChars = (title: HTMLSpanElement[]) => {
    stationRefs.current.nav.titleChars = title;
  };
  const encRegisterChars = (title: HTMLSpanElement[]) => {
    stationRefs.current.enc.titleChars = title;
  };
  const bldRegisterChars = (title: HTMLSpanElement[]) => {
    stationRefs.current.bld.titleChars = title;
  };
  const sigRegisterChars = (title: HTMLSpanElement[], support: HTMLSpanElement[]) => {
    stationRefs.current.sig.titleChars = title;
    stationRefs.current.sig.supportChars = support;
  };

  const navRegisterCursors = (title: HTMLSpanElement | null) => {
    stationRefs.current.nav.titleCursor = title;
  };
  const encRegisterCursors = (title: HTMLSpanElement | null) => {
    stationRefs.current.enc.titleCursor = title;
  };
  const bldRegisterCursors = (title: HTMLSpanElement | null) => {
    stationRefs.current.bld.titleCursor = title;
  };
  const sigRegisterCursors = (title: HTMLSpanElement | null, support: HTMLSpanElement | null) => {
    stationRefs.current.sig.titleCursor = title;
    stationRefs.current.sig.supportCursor = support;
  };

  const setCaptionCardRef = (el: HTMLDivElement | null) => {
    captionCardRef.current = el;
  };
  const registerCaptionSupport = (
    key: CaptionStationKey,
    spans: HTMLSpanElement[],
    cursor: HTMLSpanElement | null,
    para: HTMLParagraphElement | null
  ) => {
    stationRefs.current[key].supportChars = spans;
    stationRefs.current[key].supportCursor = cursor;
    captionParas.current[key] = para;
  };

  return (
    <div className="home-v2-station-headers" aria-hidden="false">
      {nav && (
        <StationBlock
          refSetter={setNavRef}
          registerChars={navRegisterChars}
          registerCursors={navRegisterCursors}
          content={nav}
          typewriter={typewriter}
          split
        />
      )}
      {enc && (
        <StationBlock
          refSetter={setEncRef}
          registerChars={encRegisterChars}
          registerCursors={encRegisterCursors}
          content={enc}
          typewriter={typewriter}
          split
        />
      )}
      {bld && (
        <StationBlock
          refSetter={setBldRef}
          registerChars={bldRegisterChars}
          registerCursors={bldRegisterCursors}
          content={bld}
          typewriter={typewriter}
          split
        />
      )}
      {/* Persistent caption card — ONE bottom instrument for all three
          corridor stations; only its text + bar telemetry change. */}
      <CaptionCard
        refSetter={setCaptionCardRef}
        metaEls={captionMetaEls}
        initialMeta={captionMeta.nav}
        typewriter={typewriter}
        register={registerCaptionSupport}
        stations={[
          { key: "nav", content: nav },
          { key: "enc", content: enc },
          { key: "bld", content: bld },
        ]}
      />
      {/* Ticker is its OWN fixed full-viewport layer (NOT inside the
          signal block, whose per-frame `translate3d` transform would
          make the fixed SVG a containing block and break viewport-space
          projection). It welds itself to the planet via world projection. */}
      <EpilogueNewsTicker animate={!reducedMotion} />
      <StationBlock
        refSetter={setSigRef}
        registerChars={sigRegisterChars}
        registerCursors={sigRegisterCursors}
        content={sig}
        typewriter={typewriter}
        afterContent={<SignalActions />}
        variantClass="home-v2-station-header--signal"
      />
    </div>
  );
}
