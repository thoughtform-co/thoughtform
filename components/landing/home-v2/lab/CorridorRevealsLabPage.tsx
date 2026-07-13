"use client";

import { useEffect, useState } from "react";

import { BEAT_PARK_CENTRES, resolveBeat, type Beat } from "@/lib/home-v2/corridorMap";
import { useCorridorOverlayStore } from "@/lib/stores/corridorOverlayStore";
import { INITIAL_TRANSFORM, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { useGyroLabStore } from "@/lib/stores/gyroLabStore";
import type { V7CorridorText } from "@/lib/v7-parse";

import { CopyAnchors } from "../CopyAnchors";
import { CorridorProgressRail } from "../CorridorProgressRail";
import { DepthGatewayScene } from "../DepthGatewayScene";
import { ProjectedBrandmarkActor } from "../ProjectedBrandmarkActor";

/**
 * /test/corridor-reveals — pinned, scroll-free lab for the Arc's diegetic
 * detail overlays (ADR-032 Update 1).
 *
 * Freezes the depth store at a chosen stage park and mounts the production
 * scene + brandmark + `CopyAnchors` (the world-anchored cardinals + skill
 * chips + tool chips) + `CorridorProgressRail` (which hosts the DETAIL
 * toggle + auto-collapse watcher), so the bloom/cascade can be judged
 * against the live sphere without scrolling the 820svh stage.
 *
 * The park switcher rewrites `paintProgress`. An extra ARM button writes
 * the overlay store directly — a fallback for the known turbopack-dev
 * store-split (if the rail toggle's write lands in a different store
 * instance than the sceneGeom reads, this lab-page button — evaluated in
 * the page chunk — still exercises the same path). Production is one graph.
 *
 * Internal-only: production blocks `/test/*` via `middleware.ts`.
 */

interface CorridorRevealsLabPageProps {
  text: V7CorridorText;
}

const PARKS = [
  { key: "navigate", beat: "navigate", park: BEAT_PARK_CENTRES.navigate ?? 0.4, label: "Navigate" },
  {
    key: "encode",
    beat: "diagnostic",
    park: BEAT_PARK_CENTRES.diagnostic ?? 0.636,
    label: "Encode",
  },
  {
    key: "build",
    beat: "intelligence",
    park: BEAT_PARK_CENTRES.intelligence ?? 0.923,
    label: "Build",
  },
] satisfies Array<{ key: string; beat: Beat; park: number; label: string }>;

export function CorridorRevealsLabPage({ text }: CorridorRevealsLabPageProps) {
  const [parkIdx, setParkIdx] = useState(0);
  const active = PARKS[parkIdx];

  // Freeze the depth store at the chosen park (single write per change —
  // transformEquals keeps it quiet). Restore on unmount.
  useEffect(() => {
    const { gateProgress } = resolveBeat(active.park);
    useDepthGatewayStore.getState().setTransform({
      ...INITIAL_TRANSFORM,
      progress: active.park,
      beat: active.beat,
      gateProgress,
      active: true,
      armed: false,
      paintProgress: active.park,
    });
    return () => {
      useDepthGatewayStore.getState().setTransform(INITIAL_TRANSFORM);
    };
  }, [active.park, active.beat]);

  useEffect(() => {
    useGyroLabStore.getState().set({ enabled: true });
    const html = document.documentElement;
    html.setAttribute("data-corridor-engaged", "true");
    return () => {
      useGyroLabStore.getState().reset();
      useCorridorOverlayStore.getState().reset();
      html.removeAttribute("data-corridor-engaged");
    };
  }, []);

  return (
    <div className="corridor-reveals-lab home-v2-root" data-theme="dark">
      <div className="corridor-reveals-lab__stage home-v2-stage" data-fallback="false">
        <div className="home-v2-stage__sticky">
          <div className="home-v2-stage__canvas">
            <DepthGatewayScene />
          </div>
          <CopyAnchors text={text} />
          <ProjectedBrandmarkActor />
          <CorridorProgressRail />
        </div>
      </div>

      <div className="corridor-reveals-lab__panel" role="group" aria-label="Overlay lab controls">
        <span className="corridor-reveals-lab__label">PARK</span>
        {PARKS.map((p, i) => (
          <button
            key={p.key}
            type="button"
            className="corridor-reveals-lab__btn"
            data-active={i === parkIdx ? "true" : undefined}
            onClick={() => setParkIdx(i)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className="corridor-reveals-lab__btn"
          onClick={() => useCorridorOverlayStore.getState().toggleArmed()}
        >
          Arm
        </button>
      </div>
    </div>
  );
}
