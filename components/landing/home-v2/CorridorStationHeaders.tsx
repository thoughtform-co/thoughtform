"use client";

import { useEffect, useMemo, useRef } from "react";
import { stationById } from "@/lib/home-v2/corridorMap";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

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
  /** `performance.now()` (seconds) when this visit's type-out
   *  started — only valid while `typing === true`. */
  startSec: number;
  /** Last per-char opacities we wrote, to suppress redundant DOM
   *  writes (most frames after the title finishes don't change). */
  titleHead: number;
  supportHead: number;
}

function makeInitialState(): StationState {
  return { typing: false, startSec: 0, titleHead: -1, supportHead: -1 };
}

interface StationContent {
  titleHtml: string;
  supportHtml?: string;
}

interface StationBlockProps {
  refSetter: (r: HTMLDivElement | null) => void;
  registerChars: (title: HTMLSpanElement[], support: HTMLSpanElement[]) => void;
  registerCursors: (title: HTMLSpanElement | null, support: HTMLSpanElement | null) => void;
  content: StationContent;
  typewriter: boolean;
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
}: StationBlockProps) {
  const titleTokens = useMemo(() => tokenize(content.titleHtml), [content.titleHtml]);
  const supportTokens = useMemo(
    () => (content.supportHtml ? tokenize(content.supportHtml) : []),
    [content.supportHtml]
  );

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
  }, [registerChars, registerCursors, titleTokens, supportTokens]);

  if (!typewriter) {
    return (
      <div ref={refSetter} className="home-v2-station-header" style={{ opacity: 0 }}>
        <h2
          className="home-v2-station-header__title"
          dangerouslySetInnerHTML={{ __html: content.titleHtml }}
        />
        {content.supportHtml && (
          <p
            className="home-v2-station-header__support"
            dangerouslySetInnerHTML={{ __html: content.supportHtml }}
          />
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
  const supportPlain = supportTokens.map((t) => t.ch).join("");

  return (
    <div ref={refSetter} className="home-v2-station-header" style={{ opacity: 0 }}>
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
                  so the browser can word-wrap at space boundaries.
                  Using a non-breaking space here would force the whole
                  line onto one row. */}
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
      {content.supportHtml && (
        <p className="home-v2-station-header__support" aria-label={supportPlain}>
          <span aria-hidden="true">
            {supportTokens.map((tok, idx) => (
              <span
                key={`s-${idx}`}
                ref={(el) => {
                  if (el) supportSpanRefs.current[idx] = el;
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
            ))}
            <span
              ref={supportCursorRef}
              className="home-v2-station-header__cursor"
              style={{ opacity: 0 }}
            >
              {"\u2588"}
            </span>
          </span>
        </p>
      )}
    </div>
  );
}

export function CorridorStationHeaders() {
  const nav = stationById("navigate")?.content;
  const enc = stationById("diagnostic")?.content;
  const bld = stationById("intelligence")?.content;

  // Reduced-motion / SSR-safe detection. Cached at mount (a one-time
  // read is plenty; if the user toggles `prefers-reduced-motion` mid-
  // session the page can be reloaded).
  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }, []);
  const typewriter = !reducedMotion;

  // Container + per-char ref state per station.
  const stationRefs = useRef<Record<"nav" | "enc" | "bld", StationRefs>>({
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
  });

  const stationStates = useRef<Record<"nav" | "enc" | "bld", StationState>>({
    nav: makeInitialState(),
    enc: makeInitialState(),
    bld: makeInitialState(),
  });

  // Last-written container opacities (suppress redundant DOM writes).
  const lastContainerOps = useRef<{ nav: number; enc: number; bld: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = useDepthGatewayStore.getState().transform;
      const painting = t.active || t.armed;
      const p = painting ? t.paintProgress : 0;
      const nowSec = performance.now() / 1000;

      const containerOps = {
        nav: bandOpacity(p, NAVIGATE_FADE_IN, NAVIGATE_FADE_OUT),
        enc: bandOpacity(p, ENCODE_FADE_IN, ENCODE_FADE_OUT),
        bld: bandOpacity(p, BUILD_FADE_IN),
      };

      // Container opacity writes (suppress when no meaningful change).
      const last = lastContainerOps.current;
      const containerChanged =
        !last ||
        Math.abs(last.nav - containerOps.nav) > 0.002 ||
        Math.abs(last.enc - containerOps.enc) > 0.002 ||
        Math.abs(last.bld - containerOps.bld) > 0.002;
      if (containerChanged) {
        lastContainerOps.current = { ...containerOps };
        for (const key of ["nav", "enc", "bld"] as const) {
          const el = stationRefs.current[key].container;
          if (el) el.style.opacity = containerOps[key].toFixed(3);
        }
      }

      // Per-station typewriter pass.
      for (const key of ["nav", "enc", "bld"] as const) {
        const refs = stationRefs.current[key];
        const state = stationStates.current[key];
        const op = containerOps[key];

        // Re-arm when the header has cleanly left the viewport
        // (opacity below REARM). Reset per-char opacities so the
        // next arrival types out from scratch.
        if (op < TYPER_REARM_OPACITY) {
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

  return (
    <div className="home-v2-station-headers" aria-hidden="false">
      {nav && (
        <StationBlock
          refSetter={setNavRef}
          registerChars={navRegisterChars}
          registerCursors={navRegisterCursors}
          content={nav}
          typewriter={typewriter}
        />
      )}
      {enc && (
        <StationBlock
          refSetter={setEncRef}
          registerChars={encRegisterChars}
          registerCursors={encRegisterCursors}
          content={enc}
          typewriter={typewriter}
        />
      )}
      {bld && (
        <StationBlock
          refSetter={setBldRef}
          registerChars={bldRegisterChars}
          registerCursors={bldRegisterCursors}
          content={bld}
          typewriter={typewriter}
        />
      )}
    </div>
  );
}
