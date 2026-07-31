"use client";

import { memo, useEffect, useRef } from "react";

import { HudNav } from "@/components/landing/v7/HudNav";
import { RailManifestController } from "@/components/landing/v7/RailManifest";

/** The four frame zones the instruments portal into. */
export interface InstrumentHosts {
  left: HTMLElement;
  right: HTMLElement;
  cornerTl: HTMLElement;
  cornerBr: HTMLElement;
}

interface HudFrameProps {
  hudHtml: string;
  /** Called once the hosts exist, and with `null` on teardown. */
  onHosts: (hosts: InstrumentHosts | null) => void;
}

/**
 * The REAL HUD frame — parse-injected markup, the production nav overlay,
 * and the production rail-manifest controller. Nothing here is a
 * reimplementation.
 *
 * ⚠ RENDER-STABLE BY CONTRACT. This component sits at a fixed, unkeyed,
 * unconditional position in the shell's JSX and is memoized on props that
 * never change. Variant selection is a `data-*` attribute on the lab root;
 * only the INSTRUMENTS are ever component-swapped. A remount here would
 * re-run the innerHTML and silently orphan both portals — the failure mode
 * `.claude/rules/landing-v7.md` records for `LandingPage`.
 *
 * Portal hosts, and why they are hosts rather than fixed siblings:
 *
 *   right  `[data-tools-rail-root]` — already in the markup, empty since
 *          `ServicesRailRegister` was retired (ADR-044). The established
 *          mount for exactly this.
 *   left   no slot exists, so we append our own div as a SIBLING of
 *          `#railManifest`.
 *
 * ⚠ The ADR ban is on `createRoot` into `[data-rail-manifest-root]` — it
 * would clobber the parse-injected skeleton `RailManifestController`
 * mutates in place. Appending a sibling to `.hud__rail--l` touches none of
 * that, and we use `createPortal` (one React root) rather than
 * `createRoot` regardless.
 *
 * Living INSIDE `.hud__rail` is the whole point: the instruments inherit
 * the hero-curtain `clip-path`, the ticks' percentage box, the rail's
 * wordmark-clearing bottom terminus, and every responsive gate — none of
 * which we then have to re-declare and keep in step.
 */
function HudFrameImpl({ hudHtml, onHosts }: HudFrameProps) {
  const hudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = hudRef.current;
    if (!root) return;

    const railL = root.querySelector<HTMLElement>(".hud__rail--l");
    const right = root.querySelector<HTMLElement>("[data-tools-rail-root]");
    const brkTl = root.querySelector<HTMLElement>(".hud__corner--tl");
    const brkBr = root.querySelector<HTMLElement>(".hud__corner--br");
    if (!railL || !right || !brkTl || !brkBr) return;

    const left = document.createElement("div");
    left.dataset.hilRailHost = "l";
    left.className = "hil-rail-host";
    // After `#railManifest` so any future focusable mark tabs in rail order.
    railL.appendChild(left);

    right.classList.add("hil-rail-host");
    right.dataset.hilRailHost = "r";

    const cornerTl = document.createElement("div");
    cornerTl.className = "hil-corner-host";
    brkTl.appendChild(cornerTl);
    const cornerBr = document.createElement("div");
    cornerBr.className = "hil-corner-host";
    brkBr.appendChild(cornerBr);

    onHosts({ left, right, cornerTl, cornerBr });
    return () => {
      onHosts(null);
      left.remove();
      cornerTl.remove();
      cornerBr.remove();
      right.classList.remove("hil-rail-host");
      delete right.dataset.hilRailHost;
    };
  }, [onHosts]);

  return (
    <>
      <div
        ref={hudRef}
        className="hil__hud home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />
      <RailManifestController containerRef={hudRef} />
      {/* Sibling of the innerHTML div, exactly as `LandingPage` mounts it —
          it needs scroll + open state, so it never ships as static markup. */}
      <HudNav />
    </>
  );
}

export const HudFrame = memo(HudFrameImpl);
