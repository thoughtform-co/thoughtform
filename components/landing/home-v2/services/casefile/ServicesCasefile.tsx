"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { type ScrambleJob, advanceScrambles, queueScramble } from "@/lib/home-v2/captionScramble";
import { CASES, PROOF_CASE } from "@/lib/cases/registry";
import type { CaseSegment } from "@/lib/cases/types";
import {
  SERVICES_PROOF_BROWSE_FRAC,
  SERVICES_PROOF_RUNWAY_VH,
} from "@/components/landing/home-v2/unifiedServicesInstrument";

import { ClientTabs } from "./ClientTabs";
import { Directory } from "./Directory";
import { TrackProofRegister } from "./TrackProofRegister";
import { TrackPanel } from "./TrackPanel";

/**
 * ServicesCasefile — the client casefile at the TOP of `#services` (ADR-056).
 *
 * The corridor's epilogue claims everyone is racing to build this capability;
 * this is the evidence, answered with one engagement before the offer. It
 * sits over the parked brandmark and holds the stage for
 * `SERVICES_PROOF_RUNWAY_VH` viewports; the card ring waits behind it.
 *
 * ONE VIEWPORT, INTERACTIVE. A client tab strip, a brief over a terminal
 * DIRECTORY whose rows are the real navigation, and a panel that swaps per
 * row. Content is `lib/cases/` only — a second case in that registry lights
 * up a second tab with no change here.
 *
 * GEOMETRY. Every zone is positioned off the `--fl-t*` tick vars, derived
 * from the LIVE HUD rail box, so the two section rules land on the rail's own
 * 13-tick ladder. That is what makes the composition read as bolted into the
 * frame rather than floating in front of it — see the sheet's ALIGNMENT LAW.
 *
 * REVEAL — the ADR-044 / ADR-054 protocol, the same one `ServicesMasthead`
 * uses:
 *   · the clock is `--svc-proof-in`, written since the 2026-07-29 perf pass
 *     on THIS component's own root (`.fl-case`) rather than the enclosing
 *     stage — the proof channels' only consumers live in this subtree, and
 *     hosting them here keeps every per-frame write from invalidating the
 *     stage's ~350-node computed-style tree. Read through a MutationObserver
 *     on the root's inline style; the stage's scroll hook stays the single
 *     writer and this observer no longer wakes for the stage's OTHER
 *     channels (`--svc-content-in`, `--svc-arrive`). A missing var FAILS
 *     OPEN to 1, so a standalone mount renders resolved.
 *   · a PARK GATE is the second required condition. The clock alone crosses
 *     its threshold while the sticky stage is still travelling — measured on
 *     the masthead, twice. Copy must never decode on a moving stage. The
 *     park state is CACHED from the IntersectionObserver (2026-07-29): the
 *     old rect-read-per-call ran inside the style MutationObserver, forcing
 *     a layout against dirty styles on every scroll frame of the armed
 *     window. The rect read survives only as the pre-first-delivery
 *     fallback.
 *   · the decode is DESTRUCTIVE (it blanks each line before queueing it), so
 *     it must never start unless it can finish: rAF is throttled to a
 *     standstill in a hidden document. Hence the visibility gate and the
 *     `visibilitychange` settle.
 *   · enhanced tier only (≥961px + no reduced motion). Everywhere else the
 *     static markup stands, which is exactly what the server rendered.
 */

/** Seconds between successive decode targets. */
const DECODE_STAGGER_S = 0.07;
/** Clock value at which the casefile counts as arrived. */
const REVEAL_AT = 0.45;
/** Below this the reveal re-arms, so scrolling back replays it. */
const REARM_BELOW = 0.05;
/** Park band at the top of the viewport, in viewport heights. */
const PIN_BAND = 0.02;
/** The only tier in which scroll owns directory selection. Re-read inside
 * the long-lived observer so a desktop→mobile resize cannot apply a stale
 * browse value after the surface has become static. */
const ENHANCED_MEDIA_QUERY = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";

/* ── The row scrollspy (ADR-056 U13) ───────────────────────────────────
   The browse band gives each directory row an equal quarter of
   `--svc-proof-browse`; the spy converts the value back to a row with
   HYSTERESIS so a reader parked exactly on a band edge never flickers
   between two panels. Driven from the SAME style MutationObserver the
   reveal already owns — the scroll hook stays the single writer, and this
   component gains no listener it did not have. */

/** How far past a shared band edge the browse value must travel before the
 *  spy crosses it, as a fraction of the whole browse band. ~26px of scroll
 *  at a 2-viewport band on a 900px viewport — enough that rest jitter and
 *  rubber-banding never flip a row, small enough to be imperceptible. */
const BROWSE_HYSTERESIS = 0.04;
/** Above this much fold the spy freezes: the panels are LEAVING, and a row
 *  swap mid-departure is noise on top of choreography. */
const BROWSE_FREEZE_OUT = 0.02;

/** Next active row for a browse reading, honouring hysteresis. */
function rowFromBrowse(browse: number, current: number, rowCount: number): number {
  const raw = Math.min(rowCount - 1, Math.max(0, Math.floor(browse * rowCount)));
  if (raw === current) return current;
  if (raw > current) return browse >= raw / rowCount + BROWSE_HYSTERESIS ? raw : current;
  return browse <= (raw + 1) / rowCount - BROWSE_HYSTERESIS ? raw : current;
}

/** Tab rows — every case in the registry, in registry order. One case today;
 *  adding a second to `lib/cases/` lights up a second tab with no edit here. */
const CASEFILE_TABS = CASES.map((c) => ({
  slug: c.slug,
  ix: c.casefile.ix,
  tab: c.casefile.tab,
}));

export function ServicesCasefile() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [slug, setSlug] = useState(PROOF_CASE.slug);
  const [trackId, setTrackId] = useState(PROOF_CASE.casefile.tracks[0].id);

  const def = CASES.find((c) => c.slug === slug) ?? PROOF_CASE;
  const file = def.casefile;
  const track = file.tracks.find((t) => t.id === trackId) ?? file.tracks[0];
  const panelId = "svc-casefile-panel";
  const rowId = `${def.slug}-row-${track.id}`;

  /* The scrollspy reads the CURRENT row through a ref — its observer closure
     outlives any single render, and hysteresis needs the live index. */
  const trackIdxRef = useRef(0);
  trackIdxRef.current = Math.max(
    0,
    file.tracks.findIndex((t) => t.id === track.id)
  );

  const selectClient = useCallback((next: string) => {
    const c = CASES.find((x) => x.slug === next);
    if (!c) return;
    setSlug(c.slug);
    // A track id is only meaningful inside its own casefile.
    setTrackId(c.casefile.tracks[0].id);
  }, []);

  /* Row selection with the CLICK-PINS-SCROLL contract (ADR-056 U13). While
     the stage is pinned, scroll position IS the row selector — so a click
     that only set state would be overridden by the very next spy reading.
     The click therefore also moves the scroll to the middle of the row's
     browse band; the spy then derives the same row and the two selectors
     agree by construction. Instant (`behavior: "auto"`): a smooth glide
     would drag the spy through every intermediate row on the way.

     Static contexts keep the plain state write: mobile/reduced motion (no
     browse channel), a not-yet-pinned stage (teleporting the page under a
     reader who clicked early would be worse than a transient spy override),
     and the flag-off rollback (no runway at all). */
  const selectTrack = useCallback(
    (id: string) => {
      setTrackId(id);
      const root = rootRef.current;
      if (!root || SERVICES_PROOF_RUNWAY_VH === 0) return;
      const enhanced = window.matchMedia(ENHANCED_MEDIA_QUERY).matches;
      if (!enhanced) return;
      const runway = root.closest<HTMLElement>(".services-stage-root");
      if (!runway) return;
      const r = runway.getBoundingClientRect();
      if (r.top > 2) return; // not pinned yet
      const idx = file.tracks.findIndex((t) => t.id === id);
      if (idx < 0) return;
      const vh = window.innerHeight || 1;
      const proofPx = Math.min(SERVICES_PROOF_RUNWAY_VH * vh, Math.max(0, r.height - vh));
      const target = ((idx + 0.5) / file.tracks.length) * SERVICES_PROOF_BROWSE_FRAC * proofPx;
      window.scrollTo({ top: r.top + window.scrollY + target, behavior: "auto" });
    },
    [file]
  );

  /* ── Reveal ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const enhanced = window.matchMedia(ENHANCED_MEDIA_QUERY).matches;
    if (!enhanced) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-fl-text]"));
    const jobs: ScrambleJob[] = [];
    let raf = 0;
    let state: "armed" | "live" | "done" = "done";

    /** Missing var ⇒ 1. A clock var can never blank a live surface — the
     *  house convention, and what makes a bare mount work. The scroll hook
     *  writes the proof channels on THIS root (2026-07-29). */
    const readClock = () => {
      const raw = Number.parseFloat(root.style.getPropertyValue("--svc-proof-in"));
      return Number.isFinite(raw) ? raw : 1;
    };

    /** Parked = the casefile's own box has reached the top band. Its root is
     *  `inset: 0` inside the stage, so its rect IS the stage rect. The park
     *  IntersectionObserver below maintains the cached boolean; the rect
     *  read fires only before its first delivery, so `isParked()` inside
     *  the per-frame clock observer never forces a layout. */
    let parkedCached: boolean | null = null;
    const isParked = () => {
      if (parkedCached !== null) return parkedCached;
      const r = root.getBoundingClientRect();
      return r.top <= window.innerHeight * PIN_BAND && r.bottom > 0;
    };

    const settle = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      jobs.length = 0;
      for (const el of targets) el.textContent = el.dataset.flText ?? "";
      root.style.setProperty("--fl-draw", "1");
      state = "done";
    };

    const arm = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      jobs.length = 0;
      for (const el of targets) el.textContent = "";
      root.style.setProperty("--fl-draw", "0");
      state = "armed";
    };

    const begin = () => {
      state = "live";
      const t0 = performance.now() / 1000;
      targets.forEach((el, i) => {
        el.textContent = "";
        queueScramble(jobs, el, el.dataset.flText ?? "", t0 + i * DECODE_STAGGER_S);
      });
      // The signal plate's wipe is a CSS transition; releasing it in a
      // separate task from the arm write keeps the two as distinct style
      // recalculations, or the transition has no start value.
      window.setTimeout(() => root.style.setProperty("--fl-draw", "1"), 60);
      const tick = () => {
        advanceScrambles(jobs, performance.now() / 1000);
        if (jobs.length) raf = requestAnimationFrame(tick);
        else state = "done";
      };
      raf = requestAnimationFrame(tick);
    };

    /* The row scrollspy (ADR-056 U13) — one more reader of the style
       mutations this observer already receives. Missing var ⇒ NO DRIVE
       (unlike the clock's fail-open): a bare mount has no browse channel
       and must keep its clicked/default row, not snap to the last band. */
    const driveRow = () => {
      // The observer can outlive the media tier in which it was installed.
      // Static/mobile/reduced-motion mode is state-owned, even during the
      // resize mutation that removes the inline browse channel.
      if (!window.matchMedia(ENHANCED_MEDIA_QUERY).matches) return;
      const browseValue = root.style.getPropertyValue("--svc-proof-browse").trim();
      if (!browseValue) return;
      const rawBrowse = Number.parseFloat(browseValue);
      if (!Number.isFinite(rawBrowse)) return;
      const rawOut = Number.parseFloat(root.style.getPropertyValue("--svc-proof-out"));
      if (Number.isFinite(rawOut) && rawOut > BROWSE_FREEZE_OUT) return;
      // `def` is the effect closure's — deps are [def.slug], so it is
      // current for this observer's whole lifetime.
      const tracks = def.casefile.tracks;
      const idx = rowFromBrowse(rawBrowse, trackIdxRef.current, tracks.length);
      if (idx !== trackIdxRef.current) setTrackId(tracks[idx].id);
    };

    const onClock = () => {
      if (document.visibilityState === "hidden") return;
      driveRow();
      const v = readClock();
      if (state === "armed" && v >= REVEAL_AT && isParked()) begin();
      else if (state !== "armed" && v < REARM_BELOW) arm();
    };

    // First sync: already parked and arrived ⇒ resolved, silently, so a
    // reload inside `#services` paints full copy with no replay.
    if (readClock() >= REVEAL_AT && isParked()) settle();
    else arm();

    // The proof channels land on this root's own inline style (scroll hook,
    // 2026-07-29) — observing the root IS the clock, and the observer no
    // longer fires for unrelated stage writes.
    const clockObserver = new MutationObserver(onClock);
    clockObserver.observe(root, { attributes: true, attributeFilter: ["style"] });

    const parkObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          parkedCached = entry.isIntersecting;
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

    // A hide mid-decode would strand blank copy — rAF stops in a hidden
    // document. Force-settle on the way out; re-sync on the way back.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") settle();
      else onClock();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clockObserver?.disconnect();
      parkObserver.disconnect();
      cancelAnimationFrame(raf);
      for (const el of targets) el.textContent = el.dataset.flText ?? "";
      root.style.removeProperty("--fl-draw");
    };
    // Re-runs when the rendered copy changes: the decode caches the node list
    // and each node's target string at setup.
  }, [def.slug]);

  return (
    <section className="fl-case" ref={rootRef} aria-label={`Case file — ${def.client}`}>
      {/* The label/sys/code chrome trio that used to sit above the tabs was
          REMOVED (owner, 2026-07-29) — the band above the tab strip stays
          clean, and the tab row is the instrument's first line. The tabs
          wrapper is therefore now the arrival ladder's first rung (--ci-off
          0.07, which also makes it the LAST to leave on the departure LIFO —
          the 0.56 mirror constant in casefile.css comes from the foot and is
          unaffected). The foot's telemetry line still prints logCode/state,
          so no data went orphan with the chrome. */}
      <div data-fl-panel style={{ "--ci-off": 0.07, "--fl-dy": "-26px" } as CSSProperties}>
        <ClientTabs
          tabs={CASEFILE_TABS}
          activeSlug={def.slug}
          onSelect={selectClient}
          controls={panelId}
        />
      </div>

      {/* ── Connection grammar — the corridor caption card's own reticle
             marks and dashed runs (ADR-056; variant E of the lab). ────── */}
      <i
        className="fl-rule fl-rule--section"
        data-fl-panel
        style={{ "--ci-off": 0.1 } as CSSProperties}
        aria-hidden="true"
      />
      <i
        className="fl-split"
        data-fl-panel
        style={{ "--ci-off": 0.14 } as CSSProperties}
        aria-hidden="true"
      />
      <i
        className="fl-rule fl-rule--brief"
        data-fl-panel
        style={{ "--ci-off": 0.14 } as CSSProperties}
        aria-hidden="true"
      />
      <i
        className="fl-rule fl-rule--viz"
        data-fl-panel
        style={{ "--ci-off": 0.14 } as CSSProperties}
        aria-hidden="true"
      />
      <i
        className="fl-ret fl-ret--tr"
        data-fl-panel
        style={{ "--ci-off": 0.18, "--fl-dx": "30px" } as CSSProperties}
        aria-hidden="true"
      />
      <i
        className="fl-ret fl-ret--bl"
        data-fl-panel
        style={{ "--ci-off": 0.18, "--fl-dx": "-30px" } as CSSProperties}
        aria-hidden="true"
      />

      {/* ── Left column · brief ─────────────────────────────────────── */}
      <div
        className="fl-brief"
        data-fl-panel
        style={{ "--ci-off": 0.24, "--fl-dx": "-48px" } as CSSProperties}
      >
        {/* THE HEADING IS THE PROJECT, not the client (owner, 2026-07-30).
            The client is named once, by the tab strip above, which carries it
            at display size — repeating it here spent the brief's biggest slot
            on something already on screen. The `Brief — expedition NN`
            designation that used to sit above went the same way: it named the
            format, not the work.

            Deliberately NOT a `data-fl-text` decode target. The reveal effect
            caches those nodes once per client (dep `[def.slug]`), so a
            track-reactive target would go stale on the first row switch — the
            decode lives on the tab name, which IS per-client. This swaps
            instantly, matching the keyed right column. */}
        <h3 className="fl-brief__title">
          <span>{track.project}</span>
          <b className="fl-brief__dot">.</b>
        </h3>
        {/* Per-track metadata swaps immediately with the heading and body.
            It must not join the destructive decode target list, which is
            cached once per client while directory rows change in place. */}
        <p className="fl-brief__class">{track.classification ?? file.classLine}</p>
        {/* The `Log.001 >` operator-quote line that followed the body was
            removed with the chrome (owner, 2026-07-29) — the brief ends on
            its own paragraph.

            PER-TRACK WHEN THE TRACK HAS ONE (2026-08-01). The casefile brief
            has to serve all eight rows, so it can only ever describe the
            engagement; a row that owns the largest piece of the work needs to
            make its own claim. Same optional-with-fallback idiom as `stamp`.
            The brief and classification both switch immediately and stay
            outside the per-client decode target list. */}
        <p className="fl-brief__body">{(track.brief ?? file.brief).map(renderSegment)}</p>
      </div>

      {/* Evidence stays in the reading column, leaving the right panel as
          one uninterrupted visual instrument. */}
      <TrackProofRegister track={track} />

      {/* ── Left column · directory ─────────────────────────────────── */}
      <Directory
        tracks={file.tracks}
        activeId={track.id}
        onSelect={selectTrack}
        controls={panelId}
        idPrefix={def.slug}
      />

      {/* ── Right column ────────────────────────────────────────────── */}
      <TrackPanel key={`${def.slug}-${track.id}`} track={track} id={panelId} labelledBy={rowId} />

      {/* ── Foot ────────────────────────────────────────────────────── */}
      <div
        className="fl-foot"
        data-fl-panel
        style={{ "--ci-off": 0.56, "--fl-dy": "28px" } as CSSProperties}
      >
        <span className="fl-tele">
          <i className="fl-diamond" aria-hidden="true" />
          {track.stamp
            ? `${track.stamp.ord} · ${track.stamp.phase} · ${track.stamp.ref} · `
            : `00 · Field log · ${file.logCode} · `}
          <b>{file.state}</b>
        </span>
      </div>
    </section>
  );
}

function renderSegment(seg: CaseSegment, i: number) {
  if (typeof seg === "string") return <span key={i}>{seg}</span>;
  // `<em>` is restyled to UPRIGHT gold on a wash — the site never sets
  // italics (brand rule).
  return <em key={i}>{seg.em}</em>;
}
