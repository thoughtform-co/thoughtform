"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

import { BarcodeStrip } from "@/components/landing/v7/tools-cards/chrome";
import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";

import type { DossierContent, DossierExcerpt } from "./dossierTypes";

/**
 * ProofDossier — the Loop case as a terminal case file.
 *
 * A navigational-screen window that sits over the parked brandmark at the
 * TOP of `#services`, before the card ring arrives: segmented title bar,
 * meta register, brief + gauge stats, three cascading phase sub-windows
 * (the Arc applied), and a soft-key row. It is the corridor's evidence
 * beat — the claim the epilogue just made ("everyone is racing to build
 * this capability"), answered with one engagement before the offer.
 *
 * PROMOTABLE CORE. This file renders on the landing; only its `content`
 * prop is assembled elsewhere (the lab from `PROOF_CASE` + extras today).
 * It imports no registry and no lab code, so seating it in `ServicesStage`
 * is a mount, not a port.
 *
 * REVEAL — the ADR-044 / ADR-054 protocol, verbatim in behaviour:
 *   · The clock is `--svc-proof-in` on the enclosing `.services-stage`,
 *     read through a MutationObserver on that element's inline style. The
 *     stage's scroll hook stays the single writer; this adds no listener.
 *     Missing var FAILS OPEN to 1 (house convention — a missing stage var
 *     can never blank a live surface, and it is what makes a standalone
 *     mount render statically).
 *   · A PARK GATE (`PIN_BAND`, an IntersectionObserver on a thin band at
 *     the viewport top) is the second required condition. The clock alone
 *     crosses its threshold while the sticky stage is still travelling —
 *     measured on the masthead, twice. Copy must never decode on a moving
 *     stage, and must blank INSTANTLY when it unparks.
 *   · Nothing moves and nothing crossfades: mono readouts scramble-decode,
 *     the summary types on, and the rows fade IN PLACE (CSS, off
 *     `data-reveal`). No rise, no entrance opacity ramp on the window.
 *   · Enhanced tier only (≥961px + no reduced motion); everywhere else the
 *     static markup stands, which is exactly what the server rendered.
 *   · Strict-Mode safe: all loop state is effect-local; cleanup restores
 *     every string.
 */

/** Clock crossing that (with the park gate) starts the reveal. */
const REVEAL_AT = 0.45;
/** Clock floor that re-arms for a replay. */
const REARM_BELOW = 0.05;
/** Fraction of the viewport, from its top, that counts as PARKED. A thin
 *  band rather than a hard `top === 0` so a sub-pixel sticky offset can
 *  never withhold the reveal. */
const PIN_BAND = 0.02;
/** Per-target decode stagger, seconds — readouts resolve in DOM order. */
const TARGET_STAGGER_S = 0.055;
/** Summary print rate, sized to finish just after the readouts resolve. */
const PARA_CHARS_PER_S = 230;
/** Head start the decode gets before the first summary character prints. */
const PARA_START_DELAY_S = 0.14;

/** Deterministic survey coordinate — the plate stamp. FNV-1a over the seed
 *  so the value is stable across renders (a random stamp would
 *  hydrate-mismatch). Duplicated per surface by house convention; see
 *  `lib/v7-parse/proofStation.ts`. */
function coordStamp(seed: string, salt: number): string {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const a = (h >>> 12) % 4096;
  const b = h % 4096;
  return `${String(a).padStart(4, "0")} / ${String(b).padStart(4, "0")}`;
}

/** How the two inactive phase panels sit behind the active one. */
export type DossierCascade = "stack" | "peek" | "flat";

export interface ProofDossierProps {
  content: DossierContent;
  /** Lab knob; production ships the default. */
  cascade?: DossierCascade;
  /** Lab knob; `dense` trims the type ramp for short viewports. */
  density?: "regular" | "dense";
}

function Excerpt({ excerpt }: { excerpt: DossierExcerpt }) {
  if (excerpt.kind === "log") {
    return (
      <div className="svc-dossier__rows">
        {excerpt.rows.map((row) => (
          <div className="svc-dossier__row svc-dossier__row--log" key={row.t + row.event}>
            <span className="svc-dossier__row-t">{row.t}</span>
            <span className="svc-dossier__row-rule" aria-hidden="true" />
            <span className="svc-dossier__row-v">{row.event}</span>
          </div>
        ))}
      </div>
    );
  }
  if (excerpt.kind === "registry") {
    return (
      <div className="svc-dossier__rows">
        {excerpt.rows.map((row) => (
          <div className="svc-dossier__row svc-dossier__row--reg" key={row.team + row.name}>
            <span className="svc-dossier__row-t">{row.team}</span>
            <span className="svc-dossier__row-v">{row.name}</span>
            {row.tag ? <span className="svc-dossier__row-tag">{row.tag}</span> : null}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="svc-dossier__rows">
      {excerpt.rows.map((row) => (
        <div className="svc-dossier__row svc-dossier__row--tool" key={row.codename}>
          <span className="svc-dossier__row-t">{row.codename}</span>
          <span className="svc-dossier__row-v">{row.tagline}</span>
        </div>
      ))}
    </div>
  );
}

/** Reveal index for the intra-zone fade stagger (meta cells, stat tiles). */
function rowVar(i: number) {
  return { ["--r-i" as string]: i } as CSSProperties;
}

export function ProofDossier({
  content,
  cascade = "stack",
  density = "regular",
}: ProofDossierProps) {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLElement | null>(null);
  const barRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const metaRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const statRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const summaryRef = useRef<HTMLSpanElement | null>(null);
  const keyRefs = useRef<Array<HTMLButtonElement | null>>([]);
  /** Set by the controller so an interaction can force the reveal to its
   *  resolved state before swapping panels — a tab swap and a typewriter
   *  must never run against each other. */
  const settleRef = useRef<(() => void) | null>(null);

  const { bar, meta, stats, phases, summary, slug, caseLabel } = content;

  useEffect(() => {
    // Enhanced tier only — the services stage's own gate.
    const enhanced = window.matchMedia(
      "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
    ).matches;
    if (!enhanced) return;

    const root = rootRef.current;
    const summaryEl = summaryRef.current;
    if (!root || !summaryEl) return;

    // The stage is optional: mounted standalone (or in a harness that never
    // writes the var) the clock fails open and the window renders resolved.
    const stage = root.closest<HTMLElement>(".services-stage");

    /** Mono readouts, in DOM order — the decode stagger follows this list. */
    const targets: Array<{ el: HTMLSpanElement; text: string }> = [];
    const push = (el: HTMLSpanElement | null, text: string) => {
      if (el) targets.push({ el, text });
    };
    push(barRefs.current[0], bar.mark);
    push(barRefs.current[1], bar.case);
    push(barRefs.current[2], bar.state);
    meta.forEach((cell, i) => push(metaRefs.current[i], cell.value));
    stats.forEach((stat, i) => push(statRefs.current[i], stat.value));
    if (targets.length === 0) return;

    const jobs: ScrambleJob[] = [];
    let raf = 0;
    let state: "armed" | "typing" | "done" = "armed";
    let paraStartSec = 0;
    let paraRunning = false;
    // A mutable Text node + a persistent cursor, so per-frame updates touch
    // only text data — never innerHTML, never React reconciliation.
    const paraNode = document.createTextNode("");
    const paraCursor = document.createElement("span");
    paraCursor.className = "svc-dossier__cursor";
    paraCursor.setAttribute("aria-hidden", "true");
    paraCursor.textContent = "█";

    const readClock = () => {
      if (!stage) return 1;
      const raw = Number.parseFloat(stage.style.getPropertyValue("--svc-proof-in"));
      return Number.isFinite(raw) ? raw : 1;
    };

    /** Parked = the window's own box has reached the top band. The root is
     *  `inset: 0` inside the stage, so its rect IS the stage rect. */
    const isParked = () => {
      const r = root.getBoundingClientRect();
      return r.top <= window.innerHeight * PIN_BAND && r.bottom > 0;
    };

    const settle = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      jobs.length = 0;
      paraRunning = false;
      state = "done";
      for (const t of targets) t.el.textContent = t.text;
      summaryEl.textContent = summary;
      root.setAttribute("data-reveal", "done");
    };
    settleRef.current = settle;

    const tick = () => {
      raf = 0;
      const nowSec = performance.now() / 1000;
      advanceScrambles(jobs, nowSec);

      let paraDone = true;
      if (paraRunning) {
        const t = nowSec - paraStartSec;
        const n = t <= 0 ? 0 : Math.min(summary.length, Math.floor(t * PARA_CHARS_PER_S));
        if (paraNode.data.length !== n) paraNode.data = summary.slice(0, n);
        paraDone = n >= summary.length;
        if (paraDone && paraCursor.isConnected) {
          summaryEl.textContent = summary; // drops the cursor with the last char
        }
      }

      if (jobs.length === 0 && paraDone) {
        state = "done";
        root.setAttribute("data-reveal", "done");
        return; // rAF loop ends — reveal complete
      }
      raf = requestAnimationFrame(tick);
    };

    const begin = () => {
      state = "typing";
      root.setAttribute("data-reveal", "typing");
      const now = performance.now() / 1000;
      targets.forEach((t, i) => queueScramble(jobs, t.el, t.text, now + i * TARGET_STAGGER_S));
      paraRunning = true;
      paraStartSec = now + PARA_START_DELAY_S;
      paraNode.data = "";
      summaryEl.replaceChildren(paraNode, paraCursor);
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const arm = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      jobs.length = 0;
      state = "armed";
      paraRunning = false;
      for (const t of targets) t.el.textContent = "";
      summaryEl.textContent = "";
      root.setAttribute("data-reveal", "armed");
    };

    const onClock = () => {
      const v = readClock();
      if (state === "armed" && v >= REVEAL_AT && isParked()) begin();
      else if (state !== "armed" && v < REARM_BELOW) arm();
    };

    // First sync: already parked and arrived ⇒ resolved, silently. This is
    // also the path a headless capture takes (no rAF ticks needed).
    if (readClock() >= REVEAL_AT && isParked()) settle();
    else arm();

    // Observing the single writer's own style mutations IS the clock — no
    // scroll listener, zero idle cost (the rAF above runs only in flight).
    const clockObserver = stage ? new MutationObserver(onClock) : null;
    if (stage && clockObserver) {
      clockObserver.observe(stage, { attributes: true, attributeFilter: ["style"] });
    }

    // Park observer: the clock writer dedupes its writes, so no mutation is
    // guaranteed at the pin moment — the crossing must be watched directly.
    // Leaving the band DOWNWARD means the stage unpinned back toward the
    // corridor: re-arm now, while nothing has visibly travelled.
    const parkObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (state === "armed" && readClock() >= REVEAL_AT) begin();
          } else if (state !== "armed" && entry.boundingClientRect.top > 0) {
            arm();
          }
        }
      },
      { rootMargin: `0px 0px -${(100 - PIN_BAND * 100).toFixed(2)}% 0px`, threshold: 0 }
    );
    parkObserver.observe(root);

    // Tab-return safety: a hide mid-reveal leaves copy blank with no further
    // callback to fix it.
    const onVisibility = () => {
      if (document.hidden) return;
      if (readClock() >= REVEAL_AT && isParked()) settle();
      else if (state !== "armed" && !isParked()) arm();
      else onClock();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clockObserver?.disconnect();
      parkObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) cancelAnimationFrame(raf);
      jobs.length = 0;
      settleRef.current = null;
      for (const t of targets) t.el.textContent = t.text;
      summaryEl.textContent = summary;
      root.removeAttribute("data-reveal");
    };
  }, [bar.mark, bar.case, bar.state, meta, stats, summary]);

  /** Any interaction resolves a reveal in flight first, then swaps. */
  const select = useCallback((i: number) => {
    settleRef.current?.();
    setActive(i);
  }, []);

  /** Roving tablist: arrows move selection (automatic activation — the swap
   *  is local and cheap), Home/End jump to the ends. */
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const last = phases.length - 1;
      let next: number | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = active === last ? 0 : active + 1;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        next = active === 0 ? last : active - 1;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = last;
      if (next === null) return;
      e.preventDefault();
      select(next);
      keyRefs.current[next]?.focus();
    },
    [active, phases.length, select]
  );

  return (
    <section
      className="svc-dossier"
      ref={rootRef}
      data-cascade={cascade}
      data-density={density}
      aria-labelledby="svc-dossier-case"
    >
      <div className="svc-dossier__win">
        <i className="svc-dossier__grid" aria-hidden="true" />

        {/* ── Title bar — three segments, hairline-separated ───────────── */}
        <header className="svc-dossier__bar">
          <span className="svc-dossier__seg svc-dossier__seg--mark">
            <span
              ref={(el) => {
                barRefs.current[0] = el;
              }}
            >
              {bar.mark}
            </span>
          </span>
          <h2
            className="svc-dossier__seg svc-dossier__seg--case"
            id="svc-dossier-case"
            aria-label={caseLabel}
          >
            <span
              aria-hidden="true"
              ref={(el) => {
                barRefs.current[1] = el;
              }}
            >
              {bar.case}
            </span>
          </h2>
          <span className="svc-dossier__seg svc-dossier__seg--state">
            <span
              ref={(el) => {
                barRefs.current[2] = el;
              }}
            >
              {bar.state}
            </span>
          </span>
        </header>

        {/* ── Meta register ───────────────────────────────────────────── */}
        <dl className="svc-dossier__meta">
          {meta.map((cell, i) => (
            <div className="svc-dossier__meta-cell" key={cell.label} style={rowVar(i)}>
              <dt className="svc-dossier__meta-k">{cell.label}</dt>
              <dd className="svc-dossier__meta-v">
                <span
                  ref={(el) => {
                    metaRefs.current[i] = el;
                  }}
                >
                  {cell.value}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        {/* ── Brief: summary beside the gauge strip ────────────────────── */}
        <div className="svc-dossier__brief">
          <p className="svc-dossier__summary">
            {/* The ghost reserves the resolved copy's box so nothing reflows
                while the line prints; the typed span overlays it. */}
            <span className="svc-dossier__summary-ghost" aria-hidden="true">
              {summary}
            </span>
            <span className="svc-dossier__summary-typed" ref={summaryRef}>
              {summary}
            </span>
          </p>
          <ul className="svc-dossier__stats">
            {stats.map((stat, i) => (
              <li className="svc-dossier__stat" key={stat.label} style={rowVar(i)}>
                <span className="svc-dossier__stat-v">
                  <span
                    ref={(el) => {
                      statRefs.current[i] = el;
                    }}
                  >
                    {stat.value}
                  </span>
                </span>
                <span className="svc-dossier__stat-l">{stat.label}</span>
                {stat.detail ? <span className="svc-dossier__stat-d">{stat.detail}</span> : null}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Phase zone: the Arc applied, one sub-window at a time ────── */}
        <div className="svc-dossier__phases">
          {phases.map((phase, i) => {
            // Cascade depth: 0 = front, 1/2 = peeking behind. Relative to the
            // active index so the stack rotates instead of re-ordering.
            const d = (i - active + phases.length) % phases.length;
            const isActive = d === 0;
            return (
              <article
                className="svc-dossier__phase"
                key={phase.id}
                id={`${phase.id}-panel`}
                role="tabpanel"
                aria-labelledby={`${phase.id}-key`}
                data-d={d}
                style={{ ["--d" as string]: d } as CSSProperties}
                inert={!isActive}
                aria-hidden={!isActive || undefined}
              >
                <div className="svc-dossier__phase-bar">
                  <span className="svc-dossier__phase-desig">{phase.desig}</span>
                  {isActive ? null : (
                    <button
                      type="button"
                      className="svc-dossier__peek"
                      tabIndex={-1}
                      aria-hidden="true"
                      onClick={() => select(i)}
                    >
                      <span className="svc-dossier__peek-mark" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="svc-dossier__phase-bd">
                  <p className="svc-dossier__pattern">{phase.pattern}</p>
                  <p className="svc-dossier__receipt">{phase.receipt}</p>
                  <div className="svc-dossier__excerpt">
                    <span className="svc-dossier__excerpt-t">{phase.excerpt.title}</span>
                    <Excerpt excerpt={phase.excerpt} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Soft-key row ────────────────────────────────────────────── */}
        <footer className="svc-dossier__keys">
          <div
            className="svc-dossier__keyrow"
            role="tablist"
            aria-label="Case phases"
            onKeyDown={onKeyDown}
          >
            {phases.map((phase, i) => (
              <button
                type="button"
                key={phase.id}
                id={`${phase.id}-key`}
                className="svc-dossier__key"
                role="tab"
                aria-selected={i === active}
                aria-controls={`${phase.id}-panel`}
                tabIndex={i === active ? 0 : -1}
                data-on={i === active || undefined}
                ref={(el) => {
                  keyRefs.current[i] = el;
                }}
                onClick={() => select(i)}
              >
                <span className="svc-dossier__key-n">{phase.num}</span>
                {phase.name}
              </button>
            ))}
          </div>
          <span className="svc-dossier__stamp" aria-hidden="true">
            {coordStamp(slug, 1)}
          </span>
          <span className="svc-dossier__barcode" aria-hidden="true">
            <BarcodeStrip seed={slug} bars={22} />
          </span>
        </footer>
      </div>
    </section>
  );
}
