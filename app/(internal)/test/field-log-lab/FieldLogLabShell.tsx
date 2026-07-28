"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Casefile } from "./Casefile";
import { FIELD_LOG_CLIENTS } from "./fieldLogData";
import { FLL_VARIANTS } from "./variants";

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

type Typeface = "mono" | "montreal";

/**
 * FieldLogLabShell — lab state, the injected HUD frame, the console and the
 * fit meter.
 *
 * Deep-link state (`?v=` variant, `?c=` client, `?f=` track, `?type=`,
 * `?console=`) is read in a MOUNT EFFECT and written back through
 * `history.replaceState` — never `useSearchParams`, which forces a CSR
 * bailout of the whole route (the section-menu / anchor / card-face /
 * dossier lab convention).
 *
 * THE FIT METER IS THE POINT. The claim this design makes is "one viewport",
 * against a station that currently costs ~500svh. The meter measures every
 * `[data-fl-zone]` block's scrollHeight against its allotted box and names
 * the first one that overflows, so a screenshot can never flatter a layout
 * that does not actually fit.
 */
export function FieldLogLabShell({ hudHtml, bodyClass }: ShellProps) {
  const [variantIdx, setVariantIdx] = useState(0);
  const [clientSlug, setClientSlug] = useState(FIELD_LOG_CLIENTS[0].slug);
  const [trackId, setTrackId] = useState(FIELD_LOG_CLIENTS[0].tracks[0].id);
  const [typeface, setTypeface] = useState<Typeface>("mono");
  const [open, setOpen] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const [fit, setFit] = useState<{
    over: string | null;
    name: string;
    h: number;
    budget: number;
  }>({ over: null, name: "—", h: 0, budget: 0 });
  const boxRef = useRef<HTMLDivElement | null>(null);

  const client = FIELD_LOG_CLIENTS.find((c) => c.slug === clientSlug) ?? FIELD_LOG_CLIENTS[0];
  const track = client.tracks.find((t) => t.id === trackId) ?? client.tracks[0];
  const variant = FLL_VARIANTS[variantIdx];

  // Adopt deep-linked state AFTER mount (SSR renders the defaults; reading
  // location in the initialiser would mismatch hydration).
  //
  // `react-hooks/set-state-in-effect` flags the writes below: this is the
  // sanctioned exception — the URL IS the external system being subscribed
  // to, it is read exactly once per mount, and the alternative
  // (`useSearchParams`) forces a CSR bailout of the whole route.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v");
    if (v) {
      const byId = FLL_VARIANTS.findIndex((a) => a.id === v);
      if (byId >= 0) setVariantIdx(byId);
      else {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0 && n < FLL_VARIANTS.length) setVariantIdx(n);
      }
    }
    const c = FIELD_LOG_CLIENTS.find((x) => x.slug === q.get("c"));
    if (c) {
      setClientSlug(c.slug);
      const f = c.tracks.find((t) => t.id === q.get("f"));
      setTrackId((f ?? c.tracks[0]).id);
    }
    if (q.get("type") === "montreal") setTypeface("montreal");
    if (q.get("console") === "0") setOpen(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const commit = useCallback(
    (next: { variantIdx?: number; clientSlug?: string; trackId?: string; typeface?: Typeface }) => {
      const vi = next.variantIdx ?? variantIdx;
      const cs = next.clientSlug ?? clientSlug;
      // Switching client resets to that client's first row — a track id is
      // only meaningful inside its own casefile.
      const nextClient = FIELD_LOG_CLIENTS.find((c) => c.slug === cs) ?? FIELD_LOG_CLIENTS[0];
      const ti =
        next.trackId ??
        (next.clientSlug && next.clientSlug !== clientSlug ? nextClient.tracks[0].id : trackId);
      const tf = next.typeface ?? typeface;

      if (next.variantIdx !== undefined) setVariantIdx(next.variantIdx);
      if (next.typeface !== undefined) setTypeface(next.typeface);
      setClientSlug(cs);
      setTrackId(ti);
      // A client switch re-decodes the head; a row switch must not.
      if (cs !== clientSlug) setReplayKey((k) => k + 1);

      const url = new URL(window.location.href);
      url.searchParams.set("v", FLL_VARIANTS[vi].id);
      url.searchParams.set("c", cs);
      url.searchParams.set("f", ti);
      if (tf === "montreal") url.searchParams.set("type", "montreal");
      else url.searchParams.delete("type");
      window.history.replaceState(null, "", url.toString());
    },
    [variantIdx, clientSlug, trackId, typeface]
  );

  /**
   * Fit meter — every zone measured against its own box, reporting the
   * TIGHTEST one so the number always names the constraint that will break
   * first. 1px of tolerance: sub-pixel layout rounding reports a fraction of
   * a pixel of overflow on boxes that visually fit.
   */
  useEffect(() => {
    const read = () => {
      const box = boxRef.current;
      if (!box) return;
      const zones = Array.from(box.querySelectorAll<HTMLElement>("[data-fl-zone]"));
      let tightest: { name: string; h: number; budget: number } | null = null;
      let over: string | null = null;
      for (const z of zones) {
        const name = z.dataset.flZone ?? "zone";
        const slack = z.clientHeight - z.scrollHeight;
        if (slack < -1 && !over) over = name;
        if (!tightest || slack < tightest.budget - tightest.h) {
          tightest = { name, h: z.scrollHeight, budget: z.clientHeight };
        }
      }
      if (tightest) {
        setFit({
          over,
          name: over ?? tightest.name,
          h: Math.round(tightest.h),
          budget: Math.round(tightest.budget),
        });
      }
    };
    read();
    // Fonts land after first layout and change every zone's height, so the
    // mount read is provisional. One deferred read settles it; a TIMEOUT
    // rather than rAF, which is throttled to a standstill in a hidden pane.
    const settle = window.setTimeout(read, 250);
    const ro = new ResizeObserver(read);
    const box = boxRef.current;
    if (box) {
      ro.observe(box);
      for (const z of box.querySelectorAll("[data-fl-zone]")) ro.observe(z);
    }
    window.addEventListener("resize", read);
    return () => {
      window.clearTimeout(settle);
      ro.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [clientSlug, trackId, variantIdx, typeface]);

  return (
    <main
      className={`fll home-v2-root ${bodyClass}`}
      data-theme="dark"
      data-variant={variant.id}
      data-type={typeface}
    >
      {/* The real HUD chrome — rails, 13-tick ladders, corner brackets,
          wordmark. Not decoration here: the casefile's whole geometry snaps
          to those ladders, so it can only be judged inside them. */}
      <div
        className="fll__hud home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />

      {/* Reproduces `.stations`' content box: `--rail-inset` is defined as
          `--band-margin − --hud-content-inset`, i.e. it assumes the content
          box has already eaten one inset. */}
      <div className="fll-stationbox" ref={boxRef}>
        <Casefile
          clients={FIELD_LOG_CLIENTS}
          client={client}
          trackId={track.id}
          onSelectClient={(slug) => commit({ clientSlug: slug })}
          onSelectTrack={(id) => commit({ trackId: id })}
          replayKey={replayKey}
          variantId={variant.id}
          typeface={typeface}
        />
      </div>

      {/* ── Lab console ─────────────────────────────────────────────── */}
      <div
        className="fll-console"
        data-open={open || undefined}
        aria-label="Field log lab controls"
      >
        <div className="fll-chips" role="tablist" aria-label="Connection grammars">
          {FLL_VARIANTS.map((a, i) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              className="fll-chip"
              data-on={i === variantIdx || undefined}
              aria-selected={i === variantIdx}
              onClick={() => commit({ variantIdx: i })}
            >
              {a.label}
            </button>
          ))}
          <button
            type="button"
            className="fll-chip fll-chip--caret"
            aria-expanded={open}
            aria-label={open ? "Collapse console" : "Expand console"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "▾" : "▴"}
          </button>
        </div>

        {open ? (
          <>
            <p className="fll-thesis">{variant.thesis}</p>
            <p className="fll-prov">
              <span className="fll-prov__diamond" aria-hidden="true" />
              {variant.provenance}
            </p>

            <div className="fll-toggles">
              <button
                type="button"
                className="fll-toggle"
                onClick={() => setReplayKey((k) => k + 1)}
              >
                <i className="fll-toggle__led" aria-hidden="true" />
                Replay
              </button>
              <button
                type="button"
                className="fll-toggle"
                data-on={typeface === "mono" || undefined}
                aria-pressed={typeface === "mono"}
                onClick={() => commit({ typeface: typeface === "mono" ? "montreal" : "mono" })}
              >
                <i className="fll-toggle__led" aria-hidden="true" />
                {typeface === "mono" ? "Mono head" : "Montreal head"}
              </button>
            </div>

            {client.placeholder ? (
              <p className="fll-warn">
                {client.tab} has no case written — this tab holds template slots so the switch is
                judged at full weight. Nothing on it is a claim.
              </p>
            ) : null}

            <span className="fll-meter" data-warn={fit.over || undefined}>
              {fit.over ? "Over" : "Fits"} · tightest {fit.name} · {fit.h}/{fit.budget}
            </span>
          </>
        ) : null}
      </div>

      <p className="fll-gate-warn">
        Widen to ≥1101×760 — the casefile is judged against the desktop band.
      </p>
    </main>
  );
}
