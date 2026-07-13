"use client";

import { useEffect, useState } from "react";

import { BEAT_PARK_CENTRES, resolveBeat, type Beat } from "@/lib/home-v2/corridorMap";
import { INITIAL_TRANSFORM, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { useGyroLabStore } from "@/lib/stores/gyroLabStore";

import { DepthGatewayScene } from "../DepthGatewayScene";
import { ProjectedBrandmarkActor } from "../ProjectedBrandmarkActor";
import { CorridorRevealLayer } from "../reveals/CorridorRevealLayer";

/**
 * /test/corridor-reveals — pinned, scroll-free lab for the Arc reveal
 * consoles (ADR-032).
 *
 * Freezes the depth-corridor store at a chosen stage park (Navigate /
 * Encode / Build) and mounts the production scene + brandmark +
 * `CorridorRevealLayer` so the chip + drawer can be judged against the
 * live sphere without scrolling the 820svh stage. A park switcher rewrites
 * `paintProgress`; the reveal layer's rAF picks it up like production.
 *
 * Internal-only: production blocks `/test/*` via `middleware.ts`.
 */

const PARKS: Array<{
  key: "navigate" | "encode" | "build";
  beat: Beat;
  park: number;
  label: string;
}> = [
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
];

export function CorridorRevealsLabPage() {
  const [parkIdx, setParkIdx] = useState(0);
  const active = PARKS[parkIdx];

  // Freeze the depth store at the chosen park — single write per change
  // (transformEquals keeps it quiet). Restore on unmount.
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
          <ProjectedBrandmarkActor />
          <CorridorRevealLayer />
        </div>
      </div>

      <div className="corridor-reveals-lab__panel" role="group" aria-label="Park switcher">
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
      </div>
    </div>
  );
}
