"use client";

import { useEffect, useRef } from "react";

import { type ScrambleJob, advanceScrambles, queueScramble } from "@/lib/home-v2/captionScramble";

import { ClientTabs } from "./ClientTabs";
import { Directory } from "./Directory";
import { TrackPanel } from "./TrackPanel";
import { FIELD_LOG_CHROME, type FlClient, type FlSegment } from "./fieldLogData";

/**
 * Casefile — the station itself.
 *
 * GEOMETRY. The zones are absolutely positioned off the `--fl-t*` tick vars
 * in the sheet, never off the handoff's 1440×1000 pixel offsets: the two
 * section rules land on the HUD rail's own ladder positions, which is what
 * makes the composition read as bolted into the frame rather than floating
 * in front of it. Content inside each zone is ordinary flow.
 *
 * CONNECTION GRAMMAR. The rules, the column split, the crosshairs and the
 * junction diamonds are all rendered here unconditionally; `[data-variant]`
 * in the sheet decides which of them paint. That keeps the four cuts a pure
 * CSS delta — no branch in this file reads the variant.
 *
 * REVEAL. Two effects, both keyed off `replayKey` so the console can re-run
 * them: a scramble-decode over every `[data-fl-text]` node (driven by the
 * canonical `captionScramble` kernel — never a second implementation), and a
 * `--fl-draw` wipe that the signal chart's clip rect scales on X. The static
 * resolved state is the source of truth; both effects are no-ops under
 * reduced motion.
 */

/** Seconds between successive decode targets. */
const DECODE_STAGGER_S = 0.07;

interface CasefileProps {
  clients: readonly FlClient[];
  client: FlClient;
  trackId: string;
  onSelectClient: (slug: string) => void;
  onSelectTrack: (id: string) => void;
  /** Bumped by the console's REPLAY; also changes on client switch. */
  replayKey: number;
  /** Only the reticle arm reads this — see the arm effect for why. */
  variantId: string;
  /** `mono` = the handoff's terminal head; `montreal` = the
   *  `.services-masthead` recipe. See the sheet's TYPE note. */
  typeface: "mono" | "montreal";
}

export function Casefile({
  clients,
  client,
  trackId,
  onSelectClient,
  onSelectTrack,
  replayKey,
  variantId,
  typeface,
}: CasefileProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const track = client.tracks.find((t) => t.id === trackId) ?? client.tracks[0];
  const panelId = "fll-panel";
  const rowId = `${client.slug}-row-${track.id}`;

  /* ── Decode ───────────────────────────────────────────────────────────
     The decode BLANKS each line before queueing it (React has already
     committed the incoming text, so `from === to` and `queueScramble` would
     no-op). That makes the effect destructive, which means it must never
     start unless it can also finish: rAF is throttled to a standstill in a
     hidden document, so arming while hidden would strand every line blank —
     the exact failure this lab hit on its first run. Hence the visibility
     gate on entry AND the `visibilitychange` settle. Same shape as
     `ProofRevealController`, which force-settles on tab return. ────────── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.visibilityState === "hidden") return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-fl-text]"));
    const jobs: ScrambleJob[] = [];
    const t0 = performance.now() / 1000;

    const settle = () => {
      jobs.length = 0;
      for (const el of targets) el.textContent = el.dataset.flText ?? "";
    };

    targets.forEach((el, i) => {
      el.textContent = "";
      queueScramble(jobs, el, el.dataset.flText ?? "", t0 + i * DECODE_STAGGER_S);
    });

    let raf = 0;
    const tick = () => {
      advanceScrambles(jobs, performance.now() / 1000);
      if (jobs.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onHide = () => {
      if (document.visibilityState !== "hidden") return;
      cancelAnimationFrame(raf);
      settle();
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      document.removeEventListener("visibilitychange", onHide);
      cancelAnimationFrame(raf);
      // Restore, so an unmount or a fast re-run can never strand a half-
      // decoded line on screen.
      settle();
    };
  }, [client.slug, replayKey]);

  /* ── Reticle arm (variant E) ──────────────────────────────────────────
     `data-fl-armed` toggles 0 → 1 so the corner crosses TRAVEL from the
     column split out to the band edges, echoing the corridor caption card's
     crosses riding its aperture open. Fail-open: with the attribute ABSENT
     the sheet parks them at the corners, so reduced motion, a hidden pane and
     no-JS all get the resolved composition. Keyed off the client, not the
     track — a row click must not re-register the frame.

     `variantId` IS a dependency, and not for cosmetics: the crosses are
     `display: none` outside variant E, and a display-none element has no
     computed `left` to transition FROM. The shell adopts `?v=` in its own
     mount effect, and child effects run before parent ones, so on a
     deep-linked `?v=e` load this effect would otherwise arm while the
     crosses were still hidden and the travel would be skipped. Re-arming on
     the variant is also the honest behaviour: switching grammar in the
     console re-registers the frame. ────────────────────────────────────── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.visibilityState === "hidden") return;

    root.dataset.flArmed = "0";
    // Force the gathered position to resolve before the release. Without it
    // the two writes can coalesce into one style recalculation and the
    // transition has no start value (the proof-dossier-lab replay lesson,
    // in its CSS form).
    void root.offsetWidth;
    const id = window.setTimeout(() => {
      root.dataset.flArmed = "1";
    }, 60);
    return () => {
      window.clearTimeout(id);
      delete root.dataset.flArmed;
    };
  }, [client.slug, replayKey, variantId]);

  /* ── Signal wipe ────────────────────────────────────────────────────── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Same reasoning as the decode: `--fl-draw: 0` hides the whole plate, so
    // do not write it unless the transition that undoes it can run.
    if (document.visibilityState === "hidden") return;

    root.style.setProperty("--fl-draw", "0");
    // Spaced by a TIMEOUT, not rAF — rAF is throttled to a standstill in a
    // hidden document (the proof-dossier-lab replay lesson).
    const id = window.setTimeout(() => root.style.setProperty("--fl-draw", "1"), 60);
    const onHide = () => {
      if (document.visibilityState === "hidden") root.style.setProperty("--fl-draw", "1");
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.clearTimeout(id);
      root.style.removeProperty("--fl-draw");
    };
  }, [client.slug, track.id, replayKey]);

  return (
    <section className="fll-case" ref={rootRef} data-type={typeface}>
      {/* ── Station chrome ──────────────────────────────────────────── */}
      <span className="fll-case__label" data-fl-text={FIELD_LOG_CHROME.stationLabel}>
        {FIELD_LOG_CHROME.stationLabel}
      </span>
      <span className="fll-case__sys">
        <i className="fll-diamond" aria-hidden="true" />
        <span data-fl-text={FIELD_LOG_CHROME.system}>{FIELD_LOG_CHROME.system}</span>
      </span>
      <span className="fll-case__code" data-fl-text={`Log ${client.logCode} · ${client.state}`}>
        {`Log ${client.logCode} · ${client.state}`}
      </span>

      <ClientTabs
        clients={clients}
        activeSlug={client.slug}
        onSelect={onSelectClient}
        controls={panelId}
      />

      {/* ── Connection grammar. Which of these paint is the variant's
             whole job — see `[data-variant]` in the sheet. ───────────── */}
      <i className="fll-rule fll-rule--section" aria-hidden="true" />
      <i className="fll-split" aria-hidden="true" />
      <i className="fll-rule fll-rule--brief" aria-hidden="true" />
      <i className="fll-rule fll-rule--viz" aria-hidden="true" />
      {/* One diagonal only — top-right and bottom-left. Four corners closes
          the composition into a box, which is the enclosure variant D exists
          to argue against; a diagonal pair registers it without framing it.
          Same reasoning as the production survey chrome, which also marks one
          diagonal (`.proof__mark--origin` / `--close`, landing.css). */}
      <i className="fll-x fll-x--tr" aria-hidden="true" />
      <i className="fll-x fll-x--bl" aria-hidden="true" />
      <i className="fll-jd fll-jd--tl" aria-hidden="true" />
      <i className="fll-jd fll-jd--tr" aria-hidden="true" />
      <i className="fll-jd fll-jd--bl" aria-hidden="true" />
      <i className="fll-jd fll-jd--br" aria-hidden="true" />
      <i className="fll-ret fll-ret--tr" aria-hidden="true" />
      <i className="fll-ret fll-ret--bl" aria-hidden="true" />

      {/* ── Left column · brief ─────────────────────────────────────── */}
      <div className="fll-brief" data-fl-zone="brief">
        <span className="fll-desig">Brief — expedition {client.ix}</span>
        <h3 className="fll-brief__title">
          <span data-fl-text={client.title.pre}>{client.title.pre}</span>
          {client.title.em ? <b className="fll-brief__dot">{client.title.em}</b> : null}
          {client.placeholder ? <span className="fll-chip">Slot</span> : null}
        </h3>
        <p className="fll-brief__class" data-fl-text={client.classLine}>
          {client.classLine}
        </p>
        <p className="fll-brief__body">{client.brief.map((seg, i) => renderSegment(seg, i))}</p>
        <p className="fll-brief__log">
          <span className="fll-brief__lx">Log.001 &gt;</span> {`“${client.logEntry}”`}
        </p>
      </div>

      {/* ── Left column · directory ─────────────────────────────────── */}
      <Directory
        tracks={client.tracks}
        activeId={track.id}
        onSelect={onSelectTrack}
        controls={panelId}
        idPrefix={client.slug}
      />

      {/* ── Right column ────────────────────────────────────────────── */}
      <TrackPanel
        key={`${client.slug}-${track.id}`}
        track={track}
        id={panelId}
        labelledBy={rowId}
      />

      {/* ── Foot ────────────────────────────────────────────────────── */}
      <div className="fll-foot">
        <span className="fll-tele">
          <i className="fll-diamond" aria-hidden="true" />
          {`${FIELD_LOG_CHROME.telemetry} · ${client.logCode} · `}
          <b>{client.state}</b>
        </span>
        <a className="fll-prompt" href={FIELD_LOG_CHROME.promptHref}>
          <span className="fll-prompt__pfx" aria-hidden="true">
            &gt;
          </span>
          {FIELD_LOG_CHROME.prompt}
          <span className="fll-cursor" aria-hidden="true">
            █
          </span>
        </a>
      </div>
    </section>
  );
}

function renderSegment(seg: FlSegment, i: number) {
  if (typeof seg === "string") return <span key={i}>{seg}</span>;
  // `<em>` is restyled to UPRIGHT gold on a wash — the site never sets
  // italics (brand rule).
  return <em key={i}>{seg.em}</em>;
}
