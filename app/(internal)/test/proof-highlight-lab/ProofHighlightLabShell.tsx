"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CapturePanel } from "./CapturePanel";
import { ProofHead } from "./ProofHead";
import { PHL_VARIANTS } from "./variants";
import { DirectionFieldLog } from "./directions/DirectionFieldLog";
import { DirectionInstrument } from "./directions/DirectionInstrument";
import { DirectionOrbit } from "./directions/DirectionOrbit";
import { DirectionSchematic } from "./directions/DirectionSchematic";

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

/**
 * ProofHighlightLabShell — owns lab state, the injected HUD frame, and the
 * console.
 *
 * Deep-link state (`?v=` direction, `?live=` capture mode) is read in a MOUNT
 * EFFECT and written through `history.replaceState` — never `useSearchParams`,
 * which forces a CSR bailout of the whole route (the section-menu / anchor /
 * card-face lab convention).
 *
 * No `<html>` attribute bus here: unlike the services labs, nothing in this
 * study reads `data-active-station` (no CorridorSectionMenu, no ring). The
 * frame is chrome only.
 */
export function ProofHighlightLabShell({ hudHtml, bodyClass }: ShellProps) {
  const [variantIdx, setVariantIdx] = useState(0);
  const [live, setLive] = useState(false);
  /** The head fills the viewport, so an expanded console always covers some of
   *  the thing being judged. Collapsing leaves just the chip strip, which sits
   *  inside the slot's reserved HUD clearance and hides nothing. */
  const [open, setOpen] = useState(true);
  const [slot, setSlot] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const slotRef = useRef<HTMLDivElement | null>(null);

  // Adopt deep-linked state AFTER mount (SSR renders the defaults; reading
  // location in the initialiser would mismatch hydration).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v");
    if (v) {
      const byId = PHL_VARIANTS.findIndex((a) => a.id === v);
      if (byId >= 0) setVariantIdx(byId);
      else {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0 && n < PHL_VARIANTS.length) setVariantIdx(n);
      }
    }
    if (q.get("live") === "1") setLive(true);
    if (q.get("console") === "0") setOpen(false);
  }, []);

  const commit = useCallback(
    (next: { variantIdx?: number; live?: boolean }) => {
      const v = next.variantIdx ?? variantIdx;
      const l = next.live ?? live;
      if (next.variantIdx !== undefined) setVariantIdx(next.variantIdx);
      if (next.live !== undefined) setLive(next.live);
      const url = new URL(window.location.href);
      url.searchParams.set("v", PHL_VARIANTS[v].id);
      if (l) url.searchParams.set("live", "1");
      else url.searchParams.delete("live");
      window.history.replaceState(null, "", url.toString());
    },
    [variantIdx, live]
  );

  /**
   * Slot meter — the direct instrument for the ~500px budget. Each direction
   * must fit the head's highlight zone with no internal scroll, so the console
   * reports the box and whether the content overflows it.
   */
  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSlot({ w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const variant = PHL_VARIANTS[variantIdx];
  const capture = <CapturePanel live={live} />;
  const overflow =
    slotRef.current && slot.h > 0 ? slotRef.current.scrollHeight > slot.h + 1 : false;

  return (
    <main className={`phl home-v2-root ${bodyClass}`} data-theme="dark" data-variant={variant.id}>
      {/* The real HUD chrome — rails, 13-tick ladders, corner brackets,
          wordmark — so each direction is judged inside the actual frame. */}
      <div
        className="phl__hud home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />

      {/* Reproduces `.stations`' content box: `--rail-inset` is defined as
          `--band-margin − --hud-content-inset`, i.e. it assumes the content box
          has already eaten one inset. Without this every band edge lands one
          inset outboard of the real station. */}
      <div className="phl-stationbox">
        <ProofHead>
          <div className="phl-slot__inner" ref={slotRef}>
            {variant.id === "a" ? <DirectionFieldLog capture={capture} /> : null}
            {variant.id === "b" ? <DirectionInstrument capture={capture} /> : null}
            {variant.id === "c" ? <DirectionSchematic capture={capture} /> : null}
            {variant.id === "d" ? <DirectionOrbit capture={capture} /> : null}
          </div>
        </ProofHead>
      </div>

      {/* ── Lab console ─────────────────────────────────────────────── */}
      <div
        className="phl-console"
        data-open={open || undefined}
        aria-label="Proof highlight lab controls"
      >
        <div className="phl-chips" role="tablist" aria-label="Highlight directions">
          {PHL_VARIANTS.map((a, i) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              className="phl-chip"
              data-on={i === variantIdx || undefined}
              aria-selected={i === variantIdx}
              onClick={() => commit({ variantIdx: i })}
            >
              {a.label}
            </button>
          ))}
          <button
            type="button"
            className="phl-chip phl-chip--caret"
            aria-expanded={open}
            aria-label={open ? "Collapse console" : "Expand console"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "▾" : "▴"}
          </button>
        </div>

        {open ? (
          <>
            <p className="phl-thesis">{variant.thesis}</p>
            <p className="phl-prov">
              <span className="phl-prov__diamond" aria-hidden="true" />
              {variant.provenance}
            </p>

            <div className="phl-toggles">
              <button
                type="button"
                className="phl-toggle"
                data-on={live || undefined}
                aria-pressed={live}
                onClick={() => commit({ live: !live })}
              >
                <i className="phl-toggle__led" aria-hidden="true" />
                {live ? "LIVE" : "STILL"} CAPTURE
              </button>
              <span className="phl-meter" data-warn={overflow || undefined}>
                SLOT · {slot.w} × {slot.h}
                {overflow ? " · OVERFLOW" : ""}
              </span>
            </div>
          </>
        ) : null}
      </div>

      <p className="phl-gate-warn">
        Widen to ≥1101×760 — the head is judged against the desktop band.
      </p>
    </main>
  );
}
