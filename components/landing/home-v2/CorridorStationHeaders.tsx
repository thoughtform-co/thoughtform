"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { stationById, type StationTelemetry } from "@/lib/home-v2/corridorMap";
import { epilogueBand } from "@/lib/home-v2/epilogueTimeline";
import { getSmoothedEpilogueProgress } from "./DepthGatewayScene/motionFollower";
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

function SupportConsole({
  telemetry,
  kicker,
  children,
}: {
  telemetry?: StationTelemetry;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <div className="home-v2-station-header__console home-v2-station-header__console--support">
      <span
        className="home-v2-station-header__frame home-v2-station-header__frame--top"
        aria-hidden="true"
      />
      <span
        className="home-v2-station-header__frame home-v2-station-header__frame--bottom"
        aria-hidden="true"
      />
      {telemetry && (
        <div className="home-v2-station-header__meta" aria-hidden="true">
          <span className="home-v2-station-header__meta-diamond" />
          {kicker && <span>{kicker}</span>}
          {kicker && <span className="home-v2-station-header__meta-sep" />}
          <span>{telemetry.callsign}</span>
          <span className="home-v2-station-header__meta-sep" />
          <span className="home-v2-station-header__meta-status">{telemetry.status}</span>
        </div>
      )}
      {children}
      {telemetry && (
        <div className="home-v2-station-header__readouts" aria-hidden="true">
          <span>{telemetry.sector}</span>
          <span>{telemetry.code}</span>
          <span>{telemetry.metric}</span>
        </div>
      )}
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
  const titleTokens = useMemo(() => tokenize(content.titleHtml), [content.titleHtml]);
  const supportHtml = !typewriter && content.floorHtml ? content.floorHtml : content.supportHtml;
  // Support copy may carry `<br>` separators — deliberate sentence-
  // per-line breaks for the centred caption (2026-06-10 polish round
  // 4). The tokenizer drops unknown tags, so split FIRST, tokenize
  // each line, and render each line as a block-level span. The flat
  // char registration below concatenates lines in order so the
  // typewriter machinery is untouched.
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
  }, [registerChars, registerCursors, titleTokens, supportLineTokens]);

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
          <>
            <div className="home-v2-station-header__head">
              <TitleConsole>{head}</TitleConsole>
            </div>
            {support && (
              <div className="home-v2-station-header__foot">
                <SupportConsole telemetry={content.telemetry} kicker={content.kicker}>
                  {support}
                </SupportConsole>
              </div>
            )}
          </>
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
  const titlePlain = titleTokens.map((t) => t.ch).join("");
  const supportPlain = supportLineTokens.map((line) => line.map((t) => t.ch).join("")).join(" ");

  // Flat char index across support lines — the typewriter machinery
  // reads `supportChars` as one flat sequence, so each rendered span
  // registers at its global index regardless of which visual line it
  // sits on.
  let supportCharCursor = 0;

  const titleEl = (
    <h2 className="home-v2-station-header__title" aria-label={titlePlain}>
      <span aria-hidden="true">
        {titleTokens.map((tok, idx) => (
          <span
            key={`t-${idx}`}
            ref={(el) => {
              if (el) titleSpanRefs.current[idx] = el;
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
        ))}
        <span
          ref={titleCursorRef}
          className="home-v2-station-header__cursor"
          style={{ opacity: 0 }}
        >
          {"\u2588"}
        </span>
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
        <>
          <div className="home-v2-station-header__head">
            <TitleConsole>{titleEl}</TitleConsole>
          </div>
          {supportEl && (
            <div className="home-v2-station-header__foot">
              <SupportConsole telemetry={content.telemetry} kicker={content.kicker}>
                {supportEl}
              </SupportConsole>
            </div>
          )}
        </>
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
  titleHtml: "AND THE LABS ARE SPENDING <em>BILLIONS</em> ON THE SAME LAYER.",
};

const SIGNAL_TICKER_ITEMS = [
  "OpenAI launches a $10B Deployment Company to put AI inside business workflows",
  "Anthropic backs a $1.5B AI consultancy to drive Claude adoption across enterprises",
  "Palantir's Forward Deployed Engineers embed to capture how each company works",
  "Stripe staffs AI-natives inside marketing until the team can run it alone",
];

function EpilogueNewsTicker({ animate }: { animate: boolean }) {
  const tickerText = `${SIGNAL_TICKER_ITEMS.join("     ◆     ")}     ◆     `;
  const repeatedTickerText = `${tickerText}${tickerText}`;

  return (
    <svg
      className="home-v2-signal-ticker"
      viewBox="0 0 1200 240"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path id="home-v2-signal-ticker-arc" d="M -320 292 Q 600 -108 1520 292" />
      </defs>
      <text className="home-v2-signal-ticker__text">
        <textPath href="#home-v2-signal-ticker-arc" startOffset={animate ? "0%" : "7%"}>
          {repeatedTickerText}
          {animate && (
            <animate
              attributeName="startOffset"
              from="0%"
              to="-50%"
              dur="18s"
              repeatCount="indefinite"
            />
          )}
        </textPath>
      </text>
    </svg>
  );
}

function SignalActions() {
  return (
    <div className="home-v2-signal-actions">
      <a className="home-v2-signal-cta" href="#contact">
        BUILD YOUR OWN LAYER <span aria-hidden="true">→</span>
      </a>
      <p className="home-v2-signal-note">Before they sell it back to you.</p>
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

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = useDepthGatewayStore.getState().transform;
      const painting = t.active || t.armed;
      const p = painting ? t.paintProgress : 0;
      const stage = document.querySelector<HTMLElement>(".home-v2-stage");
      const stageRect = stage?.getBoundingClientRect();
      const stageInViewport =
        !!stageRect && stageRect.top < window.innerHeight && stageRect.bottom > 0;
      const nowSec = performance.now() / 1000;

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
      const containerOps = {
        nav: bandOpacity(p, NAVIGATE_FADE_IN, NAVIGATE_FADE_OUT),
        enc: bandOpacity(p, ENCODE_FADE_IN, ENCODE_FADE_OUT),
        bld: bandOpacity(p, BUILD_FADE_IN) * buildOut,
        // Signal block — "The labs just bet billions on the same
        // layer." Top-centre title that marks the end of the 3D
        // space. Driven by the TITLE_IN band so it arrives after
        // the planet landing has settled. It must still be scoped to
        // the corridor stage because this layer is `position: fixed`;
        // otherwise a stale epilogue scrub from another section can
        // paint the labs ticker/CTA over the hero. We use the stage
        // rect rather than `active/armed` because the late epilogue can
        // remain visibly pinned after the store has dropped engagement.
        sig: stageInViewport ? titleIn : 0,
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
      // Signal block keeps its base centred transform (no parallax)
      // — it lives in the sky above the planet, not attached to the
      // gimbal.
      const sigEl = stationRefs.current.sig.container;
      if (sigEl) sigEl.style.transform = "translate3d(-50%, 0, 0)";

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
    return () => cancelAnimationFrame(raf);
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

  const navRegisterChars = (title: HTMLSpanElement[], support: HTMLSpanElement[]) => {
    stationRefs.current.nav.titleChars = title;
    stationRefs.current.nav.supportChars = support;
  };
  const encRegisterChars = (title: HTMLSpanElement[], support: HTMLSpanElement[]) => {
    stationRefs.current.enc.titleChars = title;
    stationRefs.current.enc.supportChars = support;
  };
  const bldRegisterChars = (title: HTMLSpanElement[], support: HTMLSpanElement[]) => {
    stationRefs.current.bld.titleChars = title;
    stationRefs.current.bld.supportChars = support;
  };
  const sigRegisterChars = (title: HTMLSpanElement[], support: HTMLSpanElement[]) => {
    stationRefs.current.sig.titleChars = title;
    stationRefs.current.sig.supportChars = support;
  };

  const navRegisterCursors = (title: HTMLSpanElement | null, support: HTMLSpanElement | null) => {
    stationRefs.current.nav.titleCursor = title;
    stationRefs.current.nav.supportCursor = support;
  };
  const encRegisterCursors = (title: HTMLSpanElement | null, support: HTMLSpanElement | null) => {
    stationRefs.current.enc.titleCursor = title;
    stationRefs.current.enc.supportCursor = support;
  };
  const bldRegisterCursors = (title: HTMLSpanElement | null, support: HTMLSpanElement | null) => {
    stationRefs.current.bld.titleCursor = title;
    stationRefs.current.bld.supportCursor = support;
  };
  const sigRegisterCursors = (title: HTMLSpanElement | null, support: HTMLSpanElement | null) => {
    stationRefs.current.sig.titleCursor = title;
    stationRefs.current.sig.supportCursor = support;
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
      <StationBlock
        refSetter={setSigRef}
        registerChars={sigRegisterChars}
        registerCursors={sigRegisterCursors}
        content={sig}
        typewriter={typewriter}
        beforeContent={<EpilogueNewsTicker animate={!reducedMotion} />}
        afterContent={<SignalActions />}
        variantClass="home-v2-station-header--signal"
      />
    </div>
  );
}
