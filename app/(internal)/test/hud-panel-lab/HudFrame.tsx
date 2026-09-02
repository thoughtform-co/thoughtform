"use client";

import { memo, useRef } from "react";

import { HudNav } from "@/components/landing/v7/HudNav";
import { RailManifestController } from "@/components/landing/v7/RailManifest";

/**
 * The REAL HUD frame: the parse-injected markup, the production nav overlay
 * and the production rail-manifest controller. Nothing here is a
 * reimplementation, and that is the whole value — the panels inside are being
 * judged for whether they belong to THIS, so a lab-drawn approximation of the
 * rails would be judging them against a different frame.
 *
 * ⚠ RENDER-STABLE BY CONTRACT (the hud-instruments-lab rule). This sits at a
 * fixed, unkeyed, unconditional position in the shell's JSX and is memoized on
 * props that never change. Direction and surface selection are `data-*`
 * attributes on the lab root; nothing here ever re-keys. A remount would
 * re-apply the innerHTML and silently orphan `RailManifestController`'s
 * in-place mutations and every instrument portal — the failure mode
 * `.claude/rules/landing-v7.md` records for `LandingPage` itself.
 *
 * ⚠ NO PORTAL HOSTS OF OUR OWN. `RailInstruments` appends its own `.rin-host`
 * divs into `.hud__corner--tl` and `.hud__rail--r` and writes
 * `html[data-rail-instruments="on"]`; `SettingsCluster` is its own fixed
 * overlay. Both are mounted as SIBLINGS by the shell, exactly as
 * `LandingPage` mounts them, so the corner scheme, the right-rail telemetry
 * and the bottom-right control row are the shipped ones.
 */
function HudFrameImpl({ hudHtml }: { hudHtml: string }) {
  const hudRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={hudRef}
        className="hpl__hud home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />
      <RailManifestController containerRef={hudRef} />
      {/* Sibling of the innerHTML div, exactly as `LandingPage` mounts it — it
          needs scroll + open state, so it never ships as static markup. */}
      <HudNav />
    </>
  );
}

export const HudFrame = memo(HudFrameImpl);
