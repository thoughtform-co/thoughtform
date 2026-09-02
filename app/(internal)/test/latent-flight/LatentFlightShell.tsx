"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { LatentFlightMount } from "@/components/latent-flight/LatentFlightMount";
import { STATE_WORD } from "@/lib/latent-flight/engine/gameState";
import {
  getLfServerState,
  getLfState,
  subscribeLfState,
  type LfMode,
} from "@/lib/latent-flight/engine/store";
import { parseFlags } from "@/lib/latent-flight/flags";
import { probeWebGL } from "@/lib/webgl/probe";
import { classifyRenderer } from "@/lib/webgl/rendererClass";

import { HudFrame } from "./HudFrame";

/**
 * LatentFlightShell — the frame, the document bus, the stage and the HUD.
 *
 * ── THE BUS ───────────────────────────────────────────────────────────────
 * `--hero-lift` / `--hero-cover` = 1 on `<html>`, restored on unmount.
 * ADR-031 U16 reveals the landing's frame by CLIPPING the rails and both
 * corner clusters to the hero's bottom edge; with no hero the property is
 * absent, every clip resolves to the full viewport, and the rails are
 * invisible. The boot sequence (M2) drives `--hero-lift` 0 → 1 itself as the
 * rails' uncover, then leaves it at 1.
 *
 * ── MODE ──────────────────────────────────────────────────────────────────
 * `flight` needs a real GPU: no WebGL, or a software rasteriser, means
 * `chart` — the instruments over a static void. The probe runs on the
 * client only, so the server renders `pending` and hydration never sees a
 * canvas it cannot mount.
 *
 * ── NO PER-FRAME REACT ────────────────────────────────────────────────────
 * The shell subscribes to the engine's low-frequency store (FSM, readiness,
 * the capture stamp). Everything a frame changes is written to the DOM by
 * the engine's own systems.
 */

const subscribeNever = () => () => {};
const getSearch = () => window.location.search;
const getSearchServer = () => "";

function readMode(): LfMode {
  return probeWebGL() && classifyRenderer() !== "software" ? "flight" : "chart";
}
const getModeServer = (): LfMode => "pending";

const PRM = "(prefers-reduced-motion: reduce)";
function subscribePrm(cb: () => void): () => void {
  const mq = window.matchMedia(PRM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getPrm = () => window.matchMedia(PRM).matches;
const getPrmServer = () => false;

export function LatentFlightShell({ hudHtml, bodyClass }: { hudHtml: string; bodyClass: string }) {
  const search = useSyncExternalStore(subscribeNever, getSearch, getSearchServer);
  const flags = useMemo(() => parseFlags(search), [search]);
  const prm = useSyncExternalStore(subscribePrm, getPrm, getPrmServer);
  const reducedMotion = prm || flags.reducedMotion;
  const mode = useSyncExternalStore(subscribeNever, readMode, getModeServer);
  const pub = useSyncExternalStore(subscribeLfState, getLfState, getLfServerState);

  /* ── The frame's document bus ────────────────────────────────────────── */
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("--hero-lift", "1");
    html.style.setProperty("--hero-cover", "1");
    // The parse-injected manifest diamond is a focusable button with no
    // controller behind it here; keep it out of the tab order.
    const manifest = document.getElementById("railManifest");
    manifest?.setAttribute("inert", "");
    // The wordmark links to `#hero`, which does not exist on this page.
    const brand = document.querySelector<HTMLAnchorElement>(".hud__brand");
    if (brand) brand.href = "/";
    return () => {
      html.style.removeProperty("--hero-lift");
      html.style.removeProperty("--hero-cover");
    };
  }, []);

  const word = mode === "chart" ? "CHART" : STATE_WORD[pub.fsm];

  return (
    <div
      className={`lf ${bodyClass}`}
      data-lf-mode={mode}
      data-lf-state={pub.fsm}
      data-ready={pub.ready ? "1" : "0"}
      data-stamp={pub.stamp}
    >
      <HudFrame hudHtml={hudHtml} />

      <div className="lf-stage">
        {mode === "flight" ? (
          <CanvasErrorBoundary fallback={<div className="lf-chart" />}>
            <LatentFlightMount flags={flags} reducedMotion={reducedMotion} />
          </CanvasErrorBoundary>
        ) : null}
        {mode === "chart" ? <div className="lf-chart" /> : null}
      </div>

      <div className="lf-hud" role="region" aria-label="Flight instruments">
        <output className="lf-sr" aria-live="polite">
          {pub.status || word}
        </output>
      </div>
    </div>
  );
}
