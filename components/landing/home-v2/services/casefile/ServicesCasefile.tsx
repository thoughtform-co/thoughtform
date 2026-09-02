"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { type ScrambleJob, advanceScrambles, queueScramble } from "@/lib/home-v2/captionScramble";
import { CASES, PROOF_CASE } from "@/lib/cases/registry";
import type { CaseDef, CaseSegment } from "@/lib/cases/types";
import {
  SERVICES_PROOF_BROWSE_FRAC,
  SERVICES_PROOF_CLIENT_SEAM_VH,
  SERVICES_PROOF_ROW_VH,
  SERVICES_PROOF_RUNWAY_VH,
  SERVICES_SCROLL_OWNED_MEDIA,
} from "@/components/landing/home-v2/unifiedServicesInstrument";

import { browseSegments, browseState, browseTargetFor, type BrowseSegment } from "./browseMap";
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
/** The only tier in which scroll owns directory selection. Shared with the
 * map console's wheel reader (ADR-063) — same question, one string. Re-read
 * inside the long-lived observer so a desktop→mobile resize cannot apply a
 * stale browse value after the surface has become static. */
const ENHANCED_MEDIA_QUERY = SERVICES_SCROLL_OWNED_MEDIA;

/* ── The browse spy (ADR-056 U13, generalised ADR-087 Phase B) ──────────
   The browse band gives each directory row a `SERVICES_PROOF_ROW_VH` share
   of `--svc-proof-browse`, and each client-to-client crossing a
   `SERVICES_PROOF_CLIENT_SEAM_VH` one; the spy converts the value back to a
   CLIENT and a ROW with HYSTERESIS at both levels, so a reader parked
   exactly on an edge never flickers between two panels. The arithmetic
   lives in `browseMap.ts` — pure, three-reader, unit-tested — and
   `BROWSE_HYSTERESIS` came with it, so this component and that module cannot
   hold two values. Driven from the SAME style MutationObserver the reveal
   already owns: the scroll hook stays the single writer, and this component
   gains no listener it did not have. */

/** Above this much fold the spy freezes: the panels are LEAVING, and a row
 *  swap mid-departure is noise on top of choreography. */
const BROWSE_FREEZE_OUT = 0.02;

const MOBILE_CASEFILE_VIEWS = [
  { id: "brief", label: "Brief" },
  { id: "proof", label: "Proof" },
  { id: "artifact", label: "Artifact" },
] as const;

type MobileCasefileView = (typeof MOBILE_CASEFILE_VIEWS)[number]["id"];

/**
 * `cases` is a DEFAULT ARGUMENT, not a flag (ADR-070 U35): production mounts
 * the registry and a lab can mount a fixture without a boolean existing
 * anywhere. Nothing branches on it — the segment table is derived from
 * whatever list arrives, so a two-client fixture exercises the seam with the
 * production code path.
 *
 * `seamVh` and `decodeReplay` are the same idiom, one for each half of what
 * Phase C put under judgement (ADR-087):
 *
 *   · `seamVh` is the SEAM'S OWN LENGTH, and it is a parameter rather than a
 *     lab-local copy of `browseSegments` because there may only ever be ONE
 *     segment table. The scroll hook's table and this component's must agree
 *     to the bit or the identity swap lands outside the stretch where both
 *     clocks read under 0.05 — i.e. the swap becomes visible. A lab that
 *     re-derived the table with its own seam length would show that as a
 *     defect in the mechanism when it was a defect in the lab.
 *   · `decodeReplay` is TRUE in production and exists so the owner can read
 *     the swap with and without the incoming client's copy decoding. It gates
 *     nothing else; with it off, a later client change settles silently, which
 *     is exactly what shipped before this pass.
 */
export function ServicesCasefile({
  cases = CASES,
  seamVh = SERVICES_PROOF_CLIENT_SEAM_VH,
  decodeReplay = true,
}: {
  cases?: readonly CaseDef[];
  seamVh?: number;
  decodeReplay?: boolean;
} = {}) {
  const rootRef = useRef<HTMLElement | null>(null);
  /* THE SLUG THE REVEAL LAST SYNCED FOR — `null` until the first sync
     (ADR-087 Phase C). Written only inside the reveal effect, so it survives
     that effect's re-runs and resets with the component.
     ⚠ NOT A BOOLEAN. A plain `hasMounted` flag is flipped by React Strict
     Mode's development double-invoke — mount, cleanup, mount — so the second
     pass would read as "a later client change" and play a decode on page
     load in dev only, i.e. the one environment the lab is judged in. Keying
     on the slug asks the question that is actually being asked: is the copy
     on screen a DIFFERENT client's? */
  const mountedSlugRef = useRef<string | null>(null);
  const [slug, setSlug] = useState(PROOF_CASE.slug);
  const [trackId, setTrackId] = useState(PROOF_CASE.casefile.tracks[0].id);
  const [mobileView, setMobileView] = useState<MobileCasefileView>("artifact");

  const def = cases.find((c) => c.slug === slug) ?? cases[0] ?? PROOF_CASE;
  const file = def.casefile;
  const track = file.tracks.find((t) => t.id === trackId) ?? file.tracks[0];
  const trackIndex = Math.max(
    0,
    file.tracks.findIndex((t) => t.id === track.id)
  );
  const clientIndex = Math.max(
    0,
    cases.findIndex((c) => c.slug === def.slug)
  );
  const panelId = "svc-casefile-panel";
  const rowId = `${def.slug}-row-${track.id}`;

  /* Tab rows — every case in the list, in registry order. One case today;
     adding a second to `lib/cases/` lights up a second tab with no edit
     here. */
  const tabs = useMemo(
    () => cases.map((c) => ({ slug: c.slug, ix: c.casefile.ix, tab: c.casefile.tab })),
    [cases]
  );

  /* THE SAME TABLE THE SCROLL HOOK WRITES AGAINST. At the default it is
     `SERVICES_PROOF_SEGMENTS` value-for-value — one arithmetic, two callers —
     and with an injected list it is that list's own map, which is the whole
     point of the seam. */
  const segments = useMemo(
    () =>
      browseSegments(
        cases.map((c) => c.casefile.tracks.length),
        SERVICES_PROOF_ROW_VH,
        seamVh
      ),
    [cases, seamVh]
  );

  /* The spy reads its CURRENT position through refs — its observer closure
     outlives any single render, and hysteresis needs the live indices. The
     case list and its table go the same way, so a client swap inside the
     observer resolves against the list this render used.

     ⚠ **THESE FOUR WARNINGS ARE THE COMPILER SEEING OLD CODE, NOT NEW CODE.**
     `react-hooks/refs` is one of the rules eslint.config.mjs softens to `warn`
     for exactly this class of surface, and the render-time write is the
     ADR-056 U13 mechanism itself: the style MutationObserver is installed once
     per client and must read the index the CURRENT render computed, so a
     `useLayoutEffect` write would be a behavioural change to a documented
     contract rather than a tidy-up. It reported NOTHING here until this pass —
     the React Compiler bails out of a component that takes no props, so adding
     the `cases` seam is what made it analyse `trackIdxRef`, which has been
     written this way since U13. Disabled with the reason rather than absorbed
     into the warning budget, which `npm run lint` pins at its exact count. */
  /* eslint-disable react-hooks/refs -- ADR-056 U13: the scrollspy's observer
     outlives the render and must read the live index; see the note above. */
  const trackIdxRef = useRef(0);
  trackIdxRef.current = trackIndex;
  const clientIdxRef = useRef(0);
  clientIdxRef.current = clientIndex;
  const casesRef = useRef(cases);
  casesRef.current = cases;
  const segmentsRef = useRef<readonly BrowseSegment[]>(segments);
  segmentsRef.current = segments;
  /* Read INSIDE the reveal effect, and deliberately not in its dep list: the
     toggle decides what the NEXT client change does, so re-running the effect
     on it would itself replay a decode. Production never changes it. */
  const replayRef = useRef(decodeReplay);
  replayRef.current = decodeReplay;
  /* eslint-enable react-hooks/refs */

  /* CLICK-PINS-SCROLL, the shared half (ADR-056 U13). While the stage is
     pinned, scroll position IS the selector — so a click that only set state
     would be overridden by the very next spy reading. The click therefore
     also moves the scroll to the middle of the target's browse band; the spy
     then derives the same target and the two selectors agree by
     construction. Instant (`behavior: "auto"`): a smooth glide would drag
     the spy through every intermediate band on the way.

     Static contexts keep the plain state write: mobile/reduced motion (no
     browse channel), a not-yet-pinned stage (teleporting the page under a
     reader who clicked early would be worse than a transient spy override),
     and the flag-off rollback (no runway at all).

     ⚠ The arithmetic is byte-what it was: `browseTargetFor` returns
     `(idx + 0.5) / rows` at N = 1, and the two multiplications that follow
     are in the order they always were. */
  const pinBrowse = useCallback((fraction: number) => {
    const root = rootRef.current;
    if (!root || SERVICES_PROOF_RUNWAY_VH === 0) return;
    const enhanced = window.matchMedia(ENHANCED_MEDIA_QUERY).matches;
    if (!enhanced) return;
    const runway = root.closest<HTMLElement>(".services-stage-root");
    if (!runway) return;
    const r = runway.getBoundingClientRect();
    if (r.top > 2) return; // not pinned yet
    const vh = window.innerHeight || 1;
    const proofPx = Math.min(SERVICES_PROOF_RUNWAY_VH * vh, Math.max(0, r.height - vh));
    const target = fraction * SERVICES_PROOF_BROWSE_FRAC * proofPx;
    window.scrollTo({ top: r.top + window.scrollY + target, behavior: "auto" });
  }, []);

  /* A CLIENT click pins the scroll too (ADR-087 Phase B) — same guards, same
     reason. Without it a tab click on the enhanced tier would be overridden
     by the next spy reading exactly as a row click was before U13, and the
     symptom would be identical: the tab lights, then snaps back one frame
     later. It lands on the incoming client's FIRST row, which is where its
     band's own first sub-band centre sits. */
  const selectClient = useCallback(
    (next: string) => {
      const idx = casesRef.current.findIndex((x) => x.slug === next);
      if (idx < 0) return;
      const c = casesRef.current[idx];
      setSlug(c.slug);
      // A track id is only meaningful inside its own casefile.
      setTrackId(c.casefile.tracks[0].id);
      pinBrowse(browseTargetFor(segmentsRef.current, idx, 0));
    },
    [pinBrowse]
  );

  const selectTrack = useCallback(
    (id: string) => {
      setTrackId(id);
      const idx = file.tracks.findIndex((t) => t.id === id);
      if (idx < 0) return;
      pinBrowse(browseTargetFor(segmentsRef.current, clientIdxRef.current, idx));
    },
    [file, pinBrowse]
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

    /* The browse spy (ADR-056 U13; client-aware since ADR-087 Phase B) — one
       more reader of the style mutations this observer already receives.
       Missing var ⇒ NO DRIVE (unlike the clock's fail-open): a bare mount has
       no browse channel and must keep its clicked/default row, not snap to
       the last band.

       ⚠ AT N = 1 THIS IS THE U13 SPY EXACTLY. One client band spans [0, 1],
       so `browseState` normalises the reading by `(b − 0) / (1 − 0)` — the
       identity — and runs the same `rowFromBrowse` on the same value with the
       same hysteresis. The client branch below can only fire once a second
       `CaseDef` exists. */
    const driveBrowse = () => {
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
      const next = browseState(rawBrowse, segmentsRef.current, {
        clientIdx: clientIdxRef.current,
        rowIdx: trackIdxRef.current,
      });
      const nextCase = casesRef.current[next.clientIdx];
      if (!nextCase) return;
      const tracks = nextCase.casefile.tracks;
      const nextTrack = tracks[Math.min(tracks.length - 1, Math.max(0, next.rowIdx))];
      if (!nextTrack) return;
      // Change-guarded on both axes: a row step inside one client must not
      // touch the slug, and a client swap always carries a track id, because
      // a track id is only meaningful inside its own casefile.
      if (next.clientIdx !== clientIdxRef.current) {
        setSlug(nextCase.slug);
        setTrackId(nextTrack.id);
      } else if (next.rowIdx !== trackIdxRef.current) {
        setTrackId(nextTrack.id);
      }
    };

    const onClock = () => {
      if (document.visibilityState === "hidden") return;
      driveBrowse();
      const v = readClock();
      if (state === "armed" && v >= REVEAL_AT && isParked()) begin();
      else if (state !== "armed" && v < REARM_BELOW) arm();
    };

    /* First sync: already parked and arrived ⇒ resolved, silently, so a
       reload inside `#services` paints full copy with no replay.

       ⚠ **A LATER CLIENT CHANGE IS NOT A FIRST SYNC** (ADR-087 Phase C). This
       effect re-runs per CLIENT (dep `def.slug`), and it was settling on
       every re-run — so a swap arriving on a parked, revealed casefile
       replaced the copy with a hard cut while the panels were crossfading. The
       decode is the surface's own arrival language and the incoming client's
       card is arriving, so it plays: `arm()` blanks and drops `--fl-draw`,
       `begin()` queues the scramble and releases the wipe 60ms later, which is
       the same two-task pair the arrival uses.

       ⚠ **INERT AT ONE CLIENT, AND THAT IS WHY IT IS PRODUCTION CODE** — with
       a single `CaseDef` the slug can never change, so `mountedSlugRef` can
       only ever hold `def.slug` and this branch is unreachable. It is
       mechanism waiting for its second client, not a lab affordance. */
    const clientChanged = mountedSlugRef.current !== null && mountedSlugRef.current !== def.slug;
    mountedSlugRef.current = def.slug;
    if (readClock() >= REVEAL_AT && isParked()) {
      if (clientChanged && replayRef.current) {
        arm();
        begin();
      } else settle();
    } else arm();

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
  }, [def.casefile.tracks, def.slug]);

  return (
    <section
      className="fl-case"
      ref={rootRef}
      aria-label={`Case file — ${def.client}`}
      data-mobile-view={mobileView}
    >
      {/* The label/sys/code chrome trio that used to sit above the tabs was
          REMOVED (owner, 2026-07-29) — the band above the tab strip stays
          clean, and the tab row is the instrument's first line. The tabs
          wrapper is therefore now the arrival ladder's first rung (--ci-off
          0.07, which also makes it the LAST to leave on the departure LIFO).
          The foot's telemetry line (stamp/logCode/state) was removed
          2026-08-07 (owner) — the data stays in the content model,
          unrendered. */}
      <div data-fl-panel style={{ "--ci-off": 0.07, "--fl-dy": "-26px" } as CSSProperties}>
        <ClientTabs tabs={tabs} activeSlug={def.slug} onSelect={selectClient} controls={panelId} />
      </div>

      {/* MOBILE IS ONE RETUNABLE INSTRUMENT, NOT THE DESKTOP COLUMNS IN A
          LONGER ORDER. The identity stays fixed while the reader switches
          the single content seat between the brief, proof register and
          authored artifact. These controls are CSS-hidden above the mobile
          gate; desktop keeps the existing directory + panel contract. */}
      <header className="fl-mobile-head" aria-live="polite">
        <p className="fl-mobile-head__meta">
          <span>{`Case / ${String(trackIndex + 1).padStart(2, "0")} of ${String(
            file.tracks.length
          ).padStart(2, "0")}`}</span>
          <span>{track.meta}</span>
        </p>
        <h3 className="fl-mobile-head__title">
          {track.project}
          <b aria-hidden="true">.</b>
        </h3>
        <p className="fl-mobile-head__class">{track.classification ?? file.classLine}</p>
      </header>

      <div className="fl-mobile-views" role="group" aria-label={`${track.project} view`}>
        {MOBILE_CASEFILE_VIEWS.map((view) => {
          const active = mobileView === view.id;
          return (
            <button
              key={view.id}
              id={`svc-casefile-view-${view.id}`}
              type="button"
              className="fl-mobile-view"
              data-on={active || undefined}
              aria-pressed={active}
              aria-controls={view.id === "artifact" ? panelId : `svc-casefile-${view.id}`}
              onClick={() => setMobileView(view.id)}
            >
              {view.label}
            </button>
          );
        })}
      </div>

      {/* ── Connection grammar — the corridor caption card's own reticle
             marks and dashed runs (ADR-056; variant E of the lab). ────── */}
      <i
        className="fl-split"
        data-fl-panel
        style={{ "--ci-off": 0.14 } as CSSProperties}
        aria-hidden="true"
      />
      <i
        className="fl-ret fl-ret--bl"
        data-fl-panel
        style={{ "--ci-off": 0.18, "--fl-dx": "-30px" } as CSSProperties}
        aria-hidden="true"
      />

      {/* ── Left column ─────────────────────────────────────────────────
          ⚠ `.fl-left` IS HOUSING, NOT A PANEL (ADR-088). It carries neither
          `data-fl-panel` nor `data-fl-client-panel`: it is the box the three
          zones are seated in, and ADR-087's frame law is that a frame which
          crossfades with its own contents is a page turn. It is also why the
          wrapper must stay unmarked mechanically — `[data-fl-panel]` takes
          `will-change: transform` under `[data-proof-live]`, which makes an
          element a CONTAINING BLOCK for absolutely positioned descendants,
          and the reticles inside this column are seated against `.fl-case`.

          Its whole job is the vertical rhythm: it spans `--fl-body-top` to
          tick 11 and splits the leftover height 1:2 between the two seams, so
          the directory's last row SITS ON tick 11 instead of the surplus
          pooling under it (137px at the owner's viewport before this pass).
          The three zones keep their own boxes, their own arrival transforms
          and their own client clocks. */}
      <div className="fl-left">
        {/* ⚠ `data-fl-client-panel` MARKS THE FOUR PANELS WHOSE CONTENT IS THE
            CLIENT'S RECORD (ADR-087 Phase B) — the brief, the proof register,
            the directory and the right panel's visual. Only these compose the
            client-seam clocks on top of the proof clocks; the HOUSING (the
            tabs wrapper, `.fl-left`, `.fl-split`, the reticles) is
            deliberately unmarked. Inert without the channels: with
            `--svc-client-in/-out` absent the CSS resolves to today's
            expressions exactly. */}
        <div
          className="fl-brief"
          id="svc-casefile-brief"
          role="region"
          aria-labelledby="svc-casefile-view-brief svc-casefile-brief-title"
          tabIndex={mobileView === "brief" ? 0 : -1}
          data-fl-panel
          data-fl-client-panel
          style={{ "--ci-off": 0.24, "--fl-dx": "-48px" } as CSSProperties}
        >
          {/* THE HEADING IS THE PROJECT, not the client (owner, 2026-07-30).
              The client is named once, by the tab strip above, which carries
              it at display size — repeating it here spent the brief's biggest
              slot on something already on screen. The `Brief — expedition NN`
              designation that used to sit above went the same way: it named
              the format, not the work.

              Deliberately NOT a `data-fl-text` decode target. The reveal
              effect caches those nodes once per client (dep `[def.slug]`), so
              a track-reactive target would go stale on the first row switch —
              the decode lives on the tab name, which IS per-client. This
              swaps instantly, matching the keyed right column. */}
          <h3 className="fl-brief__title" id="svc-casefile-brief-title">
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

              PER-TRACK WHEN THE TRACK HAS ONE (2026-08-01). The casefile
              brief has to serve all eight rows, so it can only ever describe
              the engagement; a row that owns the largest piece of the work
              needs to make its own claim. Same optional-with-fallback idiom
              as `stamp`. The brief and classification both switch immediately
              and stay outside the per-client decode target list. */}
          <p className="fl-brief__body">{(track.brief ?? file.brief).map(renderSegment)}</p>
        </div>

        {/* Evidence stays in the reading column, leaving the right panel as
            one uninterrupted visual instrument. */}
        <TrackProofRegister
          track={track}
          id="svc-casefile-proof"
          tabIndex={mobileView === "proof" ? 0 : -1}
        />

        {/* ── Left column · directory ───────────────────────────────── */}
        <Directory
          tracks={file.tracks}
          activeId={track.id}
          onSelect={selectTrack}
          controls={panelId}
          idPrefix={def.slug}
        />
      </div>

      {/* ── Right column ────────────────────────────────────────────── */}
      <TrackPanel
        key={`${def.slug}-${track.id}`}
        track={track}
        id={panelId}
        labelledBy={`${rowId} svc-casefile-view-artifact`}
      />

      <nav className="fl-mobile-rail" aria-label="Case navigation">
        <button
          type="button"
          className="fl-mobile-rail__step"
          aria-label={`Previous case: ${
            file.tracks[(trackIndex - 1 + file.tracks.length) % file.tracks.length].project
          }`}
          onClick={() =>
            selectTrack(file.tracks[(trackIndex - 1 + file.tracks.length) % file.tracks.length].id)
          }
        >
          <span aria-hidden="true">←</span>
        </button>

        <div
          className="fl-mobile-rail__stops"
          style={{ gridTemplateColumns: `repeat(${file.tracks.length}, minmax(0, 1fr))` }}
        >
          {file.tracks.map((item, index) => {
            const active = index === trackIndex;
            return (
              <button
                key={item.id}
                type="button"
                className="fl-mobile-rail__stop"
                data-on={active || undefined}
                aria-label={`${String(index + 1).padStart(2, "0")} — ${item.project}`}
                aria-current={active ? "step" : undefined}
                onClick={() => selectTrack(item.id)}
              >
                {String(index + 1).padStart(2, "0")}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="fl-mobile-rail__step"
          aria-label={`Next case: ${file.tracks[(trackIndex + 1) % file.tracks.length].project}`}
          onClick={() => selectTrack(file.tracks[(trackIndex + 1) % file.tracks.length].id)}
        >
          <span aria-hidden="true">→</span>
        </button>
      </nav>
    </section>
  );
}

function renderSegment(seg: CaseSegment, i: number) {
  if (typeof seg === "string") return <span key={i}>{seg}</span>;
  // `<em>` is restyled to UPRIGHT gold on a wash — the site never sets
  // italics (brand rule).
  return <em key={i}>{seg.em}</em>;
}
