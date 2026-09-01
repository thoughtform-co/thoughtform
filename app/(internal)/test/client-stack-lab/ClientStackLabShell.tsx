"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  browseSeamClocks,
  browseSegments,
  browseTargetFor,
  SEAM_SWAP_HYSTERESIS,
  type BrowseSegment,
} from "@/components/landing/home-v2/services/casefile/browseMap";
import { ServicesCasefile } from "@/components/landing/home-v2/services/casefile/ServicesCasefile";
import {
  SERVICES_PROOF_CLIENT_SEAM_VH,
  SERVICES_PROOF_ROW_VH,
} from "@/components/landing/home-v2/unifiedServicesInstrument";
import { LOOP_EARPLUGS_CASE } from "@/lib/cases/content/loop-earplugs";

import { CLIENT_STACK_FIXTURE } from "./fixtureCase";

/**
 * ClientStackLabShell — the client seam, driven by hand.
 *
 * ⚠ **THE CHANNELS ARE THE HARNESS, NOT A 570svh RUNWAY** (the field-log-lab
 * pattern). Production reaches the seam through the pinned dwell:
 * `useServicesStageScroll` converts scroll into `--svc-proof-browse` and, once
 * `CASES` holds two clients, into `--svc-client-in/-out` beside it. Rebuilding
 * that runway here would mean rebuilding the stage, the corridor dissipate and
 * the split — so instead this lab writes THE SAME FIVE CUSTOM PROPERTIES the
 * hook writes, on the same host, and the shipped component does the rest.
 *
 * ── THE WIRING, AND WHY IT IS THIS ONE ───────────────────────────────────
 * `ServicesCasefile`'s `driveBrowse` reads `root.style.getPropertyValue(...)`
 * inside a `MutationObserver` on `.fl-case`'s own `style` attribute — INLINE
 * style, on that element, not the computed cascade. So:
 *
 *   · writing the channels on the STAGE (the casefile-type-lab pattern) makes
 *     the CSS resolve correctly, because custom properties inherit — and
 *     drives NOTHING, because the component never reads a computed value;
 *   · writing them on `.fl-case` does both: the panels compose the clocks
 *     through the cascade AND the observer fires, so the component derives its
 *     own client and row from the browse value exactly as it does under
 *     scroll.
 *
 * The second is what this lab does, and it is the whole reason the lab is
 * worth anything: the spy, the hysteresis, the identity swap, the click-pins
 * contract and the panel composition are all the SHIPPED code paths. The lab
 * owns one number.
 *
 * ⚠ **`--svc-proof-out` STAYS AT 0.** Above `BROWSE_FREEZE_OUT` (0.02) the spy
 * freezes by contract — the panels are leaving and a row swap mid-departure is
 * noise. A lab that wrote a fold clock would silently stop driving.
 *
 * ── WHAT IS UNDER JUDGEMENT ──────────────────────────────────────────────
 *   · SEAM LENGTH — 0.3 / 0.5 / 0.8 viewports. It re-derives the segment
 *     table through `browseSegments`' own argument and is handed to the
 *     component as `seamVh`, so there is exactly ONE table. (A lab-local
 *     table with a different seam length would put the identity swap outside
 *     the stretch where both clocks read under 0.05 and report a defect the
 *     mechanism does not have.)
 *   · ±18px TRAVEL BIAS — a lab-only override in `client-stack-lab.css`,
 *     composed onto the marked panels through the `translate` property so the
 *     shipped `transform` ladder is never restated. Zero at rest both sides.
 *   · DECODE REPLAY — the `decodeReplay` prop, default on.
 *
 * Deep-link state (`?seam=`, `?bias=`, `?replay=`, `?t=`) is read in a MOUNT
 * EFFECT and written back through `history.replaceState` — never
 * `useSearchParams`, which forces a CSR bailout of the whole route (the
 * field-log / anchor / card-face / dossier lab convention).
 */

/** The two clients. Loop carries four tracks, the fixture three — see the
 *  fixture's header for why the counts must differ. */
const CASE_LIST = [LOOP_EARPLUGS_CASE, CLIENT_STACK_FIXTURE] as const;
const ROW_COUNTS = CASE_LIST.map((c) => c.casefile.tracks.length);

/** Seam lengths under judgement, in viewport heights. 0.5 is what shipped. */
const SEAMS = [0.3, SERVICES_PROOF_CLIENT_SEAM_VH, 0.8] as const;

/** The seam-local positions the capture script frames. Mirrored as buttons so
 *  a human reads the same five crossings the stills do. */
const SEAM_STOPS = [0.15, 0.35, 0.5, 0.65, 0.85] as const;

/**
 * ⚠ THE CASEFILE'S ARRIVAL IS PARKED, NOT DISABLED (the casefile-type-lab
 * note). `.fl-case` is `visibility: hidden` until
 * `.services-stage[data-proof-live]`. The STAGE therefore declares the end
 * state of everything the stage owns; the five proof/client channels go on
 * `.fl-case` itself — see THE WIRING above.
 *
 * MODULE CONSTANT on purpose: a fresh literal each render re-applies the style
 * attribute, and the casefile's own style observer watches exactly these.
 */
const STAGE_STYLE = { "--svc-content-in": "1" } as CSSProperties;

/** What the capture script drives. A lab handle rather than a re-navigation
 *  per frame, because a remount cannot show a decode REPLAY: the reveal's
 *  first sync settles silently by contract, so the slug has to change while
 *  the component stays mounted. */
export interface ClientStackLabHandle {
  setT(next: number): void;
  setSeam(next: number): void;
  setBias(next: boolean): void;
  setReplay(next: boolean): void;
  /** The single seam's band in browse-fraction space, for the frame table. */
  seamBand(): { start: number; end: number };
  /** A client's row-0 rest position — the two "rest state" frames. */
  restAt(clientIdx: number): number;
}

declare global {
  interface Window {
    __clientStackLab?: ClientStackLabHandle;
  }
}

function seamOf(segments: readonly BrowseSegment[]): { start: number; end: number } {
  for (const s of segments) if (s.kind === "seam") return { start: s.start, end: s.end };
  return { start: 0, end: 0 };
}

export function ClientStackLabShell({ hudHtml }: { hudHtml: string }) {
  const [seamVh, setSeamVh] = useState<number>(SERVICES_PROOF_CLIENT_SEAM_VH);
  const [bias, setBias] = useState(false);
  const [replay, setReplay] = useState(true);
  const [t, setT] = useState(0);
  /** What the COMPONENT decided, read back off the DOM — never re-derived. */
  const [read, setRead] = useState({ tab: "—", row: "—", stamp: "" });
  const boxRef = useRef<HTMLDivElement | null>(null);

  const segments = useMemo(
    () => browseSegments(ROW_COUNTS, SERVICES_PROOF_ROW_VH, seamVh),
    [seamVh]
  );
  const seam = useMemo(() => seamOf(segments), [segments]);
  const clocks = useMemo(() => browseSeamClocks(t, segments), [t, segments]);
  /** Seam-local position, or `null` outside the seam — the readout's own line. */
  const seamT =
    t >= seam.start && t <= seam.end && seam.end > seam.start
      ? (t - seam.start) / (seam.end - seam.start)
      : null;

  /* ── The URL ────────────────────────────────────────────────────────── */
  // Adopt deep-linked state AFTER mount (SSR renders the defaults; reading
  // location in the initialiser would mismatch hydration).
  //
  // `react-hooks/set-state-in-effect` flags the writes below: the sanctioned
  // lab exception — the URL IS the external system being subscribed to, read
  // exactly once per mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = Number(q.get("seam"));
    if (Number.isFinite(s) && SEAMS.includes(s as (typeof SEAMS)[number])) setSeamVh(s);
    if (q.get("bias") === "1") setBias(true);
    if (q.get("replay") === "0") setReplay(false);
    const tq = Number(q.get("t"));
    if (Number.isFinite(tq) && tq >= 0 && tq <= 1) setT(tq);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /**
   * ⚠ **THE URL IS WRITTEN BY THE SETTERS, NEVER BY AN EFFECT** — the
   * field-log lab's `commit` idiom, and it is load-bearing rather than
   * stylistic. A write effect and the adoption effect above are BOTH mount
   * effects, and React Strict Mode's development double-invoke runs the pair,
   * cleans up, and runs it again: on the second pass the adoption reads a
   * search string the write effect has already rewritten from the SSR
   * defaults, so `?seam=0.3` came back as 0.5 with nothing failing. Cost an
   * hour of the capture run's first attempt.
   *
   * Each setter writes only ITS OWN parameter, which is what lets all four
   * stay dependency-free: the live URL is always current, so no setter has to
   * know the others' values.
   */
  const setBrowse = useCallback((next: number) => {
    const v = Math.min(1, Math.max(0, next));
    setT(v);
    const url = new URL(window.location.href);
    url.searchParams.set("t", v.toFixed(4));
    window.history.replaceState(null, "", url.toString());
  }, []);

  const applySeam = useCallback((next: number) => {
    setSeamVh(next);
    const url = new URL(window.location.href);
    url.searchParams.set("seam", String(next));
    window.history.replaceState(null, "", url.toString());
  }, []);

  const applyBias = useCallback((next: boolean) => {
    setBias(next);
    const url = new URL(window.location.href);
    url.searchParams.set("bias", next ? "1" : "0");
    window.history.replaceState(null, "", url.toString());
  }, []);

  const applyReplay = useCallback((next: boolean) => {
    setReplay(next);
    const url = new URL(window.location.href);
    url.searchParams.set("replay", next ? "1" : "0");
    window.history.replaceState(null, "", url.toString());
  }, []);

  /* ── The channels ───────────────────────────────────────────────────── */
  /**
   * ONE WRITE PER STATE CHANGE, onto `.fl-case`'s inline style — the hook's
   * own host and the only place the component's observer can see it.
   *
   * The readout is taken TWO rAFs later, off the live DOM: the observer fires
   * on a microtask, React commits the client/row change on the next frame, and
   * the stamp must report what the component decided rather than what the lab
   * asked for. That is what makes it a wait the capture script cannot satisfy
   * by itself (the substrate-lab lesson).
   */
  useEffect(() => {
    const host = boxRef.current?.querySelector<HTMLElement>(".fl-case");
    if (!host) return;
    host.style.setProperty("--svc-proof-in", "1");
    host.style.setProperty("--svc-proof-out", "0");
    host.style.setProperty("--svc-proof-browse", t.toFixed(4));
    host.style.setProperty("--svc-client-in", clocks.clientIn.toFixed(4));
    host.style.setProperty("--svc-client-out", clocks.clientOut.toFixed(4));

    let raf = 0;
    const sample = () => {
      const tab = host.querySelector<HTMLElement>(".fl-tabs__tab[data-on]");
      const row = host.querySelector<HTMLElement>(".fl-row[data-on]");
      const next = {
        tab: tab?.querySelector<HTMLElement>(".fl-tabs__name")?.textContent?.trim() || "—",
        row: row?.querySelector<HTMLElement>(".fl-row__file")?.textContent?.trim() || "—",
        stamp: `${seamVh}|${bias ? 1 : 0}|${replay ? 1 : 0}|${t.toFixed(4)}`,
      };
      setRead((prev) =>
        prev.tab === next.tab && prev.row === next.row && prev.stamp === next.stamp ? prev : next
      );
    };
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(sample);
    });
    return () => cancelAnimationFrame(raf);
  }, [t, clocks, seamVh, bias, replay]);

  /* ── The HUD's document-level bus (the casefile-type-lab notes) ──────── */
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-active-station", "services");
    /* ⚠ `--hero-lift: 1` OR THE RAILS CLIP AWAY. ADR-031 U16 reveals the
       frame by CLIPPING each element to the hero's bottom edge; with no hero
       the property is absent, the clip resolves to the full viewport, and the
       rail — with it every `--fl-t*` the casefile measures — is invisible. */
    html.style.setProperty("--hero-lift", "1");
    html.style.setProperty("--hero-cover", "1");
    return () => {
      html.removeAttribute("data-active-station");
      html.style.removeProperty("--hero-lift");
      html.style.removeProperty("--hero-cover");
    };
  }, []);

  /* ── The tab strip and the rows as JUMP CONTROLS ─────────────────────── */
  /**
   * Production's `pinBrowse` moves the scroll to the clicked target's band
   * centre, because while the stage is pinned SCROLL is the selector and a
   * click that only set state would be overridden by the next spy reading. It
   * needs a `.services-stage-root` with real height, which a parked lab has
   * not got — so the lab supplies the other half itself, through the same
   * `browseTargetFor`. Without this the tab lights and then snaps back on the
   * next channel write, which would read as a defect in the tabs.
   */
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tab = target.closest(".fl-tabs__tab");
      if (tab) {
        const tabs = Array.from(box.querySelectorAll(".fl-tabs__tab"));
        const i = tabs.indexOf(tab);
        if (i >= 0) setBrowse(browseTargetFor(segments, i, 0));
        return;
      }
      const row = target.closest(".fl-row");
      if (row) {
        const rows = Array.from(box.querySelectorAll(".fl-row"));
        const tabs = Array.from(box.querySelectorAll(".fl-tabs__tab"));
        const c = tabs.findIndex((x) => x.hasAttribute("data-on"));
        const i = rows.indexOf(row);
        if (i >= 0) setBrowse(browseTargetFor(segments, Math.max(0, c), i));
      }
    };
    box.addEventListener("click", onClick);
    return () => box.removeEventListener("click", onClick);
  }, [segments, setBrowse]);

  /* ── The capture script's handle ─────────────────────────────────────── */
  const jumpSeam = useCallback(
    (local: number) => setBrowse(seam.start + local * (seam.end - seam.start)),
    [seam, setBrowse]
  );

  useEffect(() => {
    window.__clientStackLab = {
      setT: (next) => setBrowse(next),
      setSeam: (next) => applySeam(next),
      setBias: (next) => applyBias(next),
      setReplay: (next) => applyReplay(next),
      seamBand: () => seam,
      restAt: (clientIdx) => browseTargetFor(segments, clientIdx, 0),
    };
    return () => {
      delete window.__clientStackLab;
    };
  }, [seam, segments, setBrowse, applySeam, applyBias, applyReplay]);

  return (
    <div className="csl-root" data-lab-bias={bias ? "on" : "off"}>
      {/* The real parse-injected HUD. It is here for the RAIL: the casefile's
          `--fl-t*` ladder is measured off `.hud__rail`'s live box, so without
          it every box in the left column resolves against nothing. */}
      <div className="csl-hud" dangerouslySetInnerHTML={{ __html: hudHtml }} />

      {/* `.stations`' own content box — the casefile is inset by
          `--hud-content-inset` in production and would sit a full inset too
          far outboard without it. */}
      <div className="csl-stationbox" ref={boxRef}>
        <div
          className="services-stage csl-stage"
          data-proof-live
          data-proof-settled
          style={STAGE_STYLE}
        >
          <ServicesCasefile cases={CASE_LIST} seamVh={seamVh} decodeReplay={replay} />
        </div>
      </div>

      {/* ── Lab console ──────────────────────────────────────────────── */}
      <div className="csl-console" role="group" aria-label="Client stack lab controls">
        <div className="csl-console__row">
          <span className="csl-console__title">Seam</span>
          {SEAMS.map((s) => (
            <button
              key={s}
              type="button"
              className="csl-btn"
              data-on={seamVh === s || undefined}
              aria-pressed={seamVh === s}
              title={`${s} viewports of scroll between two clients${
                s === SERVICES_PROOF_CLIENT_SEAM_VH ? " — what ships" : ""
              }`}
              onClick={() => applySeam(s)}
            >
              {s.toFixed(1)}
            </button>
          ))}

          <span className="csl-console__rule" aria-hidden="true" />
          <button
            type="button"
            className="csl-btn"
            data-on={bias || undefined}
            aria-pressed={bias}
            title="±18px: incoming panels rise into place, outgoing panels exit upward"
            onClick={() => applyBias(!bias)}
          >
            ±18px bias
          </button>
          <button
            type="button"
            className="csl-btn"
            data-on={replay || undefined}
            aria-pressed={replay}
            title="The incoming client's tab name decodes as its card arrives"
            onClick={() => applyReplay(!replay)}
          >
            Decode replay
          </button>
        </div>

        <div className="csl-console__row">
          <span className="csl-console__title">Browse</span>
          <input
            className="csl-scrub"
            type="range"
            min={0}
            max={1}
            step={0.0005}
            value={t}
            aria-label="Browse fraction"
            onChange={(e) => setBrowse(Number(e.target.value))}
          />
          <button
            type="button"
            className="csl-btn"
            title="Loop Earplugs, row one — rest"
            onClick={() => setBrowse(browseTargetFor(segments, 0, 0))}
          >
            Rest 01
          </button>
          {SEAM_STOPS.map((s) => (
            <button
              key={s}
              type="button"
              className="csl-btn csl-btn--seam"
              data-on={seamT !== null && Math.abs(seamT - s) < 0.005 ? true : undefined}
              title={`Seam t = ${s}`}
              onClick={() => jumpSeam(s)}
            >
              {s.toFixed(2)}
            </button>
          ))}
          <button
            type="button"
            className="csl-btn"
            title="Specimen Industries, row one — rest"
            onClick={() => setBrowse(browseTargetFor(segments, 1, 0))}
          >
            Rest 02
          </button>
        </div>

        {/* THE READOUT IS THE OBSERVABLE. Every number here is either the
            lab's own input or read back off the live DOM; nothing is a second
            derivation of what the component decided. The capture script waits
            on `data-stamp`, which is only written after the DOM sample. */}
        <p
          className="csl-read"
          data-stamp={read.stamp}
          data-t={t.toFixed(4)}
          data-seam={seamVh}
          data-seam-start={seam.start.toFixed(6)}
          data-seam-end={seam.end.toFixed(6)}
          data-seam-t={seamT === null ? "" : seamT.toFixed(4)}
          data-client-in={clocks.clientIn.toFixed(4)}
          data-client-out={clocks.clientOut.toFixed(4)}
          data-bias={bias ? "1" : "0"}
          data-replay={replay ? "1" : "0"}
          data-tab={read.tab}
          data-row={read.row}
        >
          <span>
            t {t.toFixed(4)}
            {seamT === null ? "" : ` · seam ${seamT.toFixed(3)}`}
          </span>
          <span>
            in {clocks.clientIn.toFixed(3)} · out {clocks.clientOut.toFixed(3)}
          </span>
          <span data-blank={clocks.clientIn < 0.05 && clocks.clientOut < 0.05 ? true : undefined}>
            {clocks.clientIn < 0.05 && clocks.clientOut < 0.05 ? "BOTH < 0.05" : "painting"}
          </span>
          <span>
            {read.tab} · {read.row}
          </span>
          <span>
            swap window ±{SEAM_SWAP_HYSTERESIS} · seam {seam.start.toFixed(3)}–{seam.end.toFixed(3)}
          </span>
        </p>
      </div>

      <p className="csl-gate-warn">
        Widen to ≥961px with reduced motion OFF — below that the casefile is a static document and
        the browse channel is not read.
      </p>
    </div>
  );
}
