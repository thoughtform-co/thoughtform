"use client";

import { useEffect, useRef, useState } from "react";
import { BEAT_PARK_CENTRES, resolveBeat } from "@/lib/home-v2/corridorMap";
import { useDepthGatewayStore, INITIAL_TRANSFORM } from "@/lib/stores/depthGatewayStore";
import { useGyroLabStore } from "@/lib/stores/gyroLabStore";
import { DepthGatewayScene } from "../DepthGatewayScene";
import { ProjectedBrandmarkActor } from "../ProjectedBrandmarkActor";
import { NavigateCopyControlPanel } from "./NavigateCopyControlPanel";
import {
  NavigateCopyVariants,
  type VariantId,
  type CopyMode,
  type TitleSize,
} from "./NavigateCopyVariants";

interface NavigateCopyLabPageProps {
  hudHtml: string;
  bodyClass: string;
}

/** Navigate park centre — exact value derived from the corridor map so
 *  any rebalance of beat weights re-anchors the lab automatically. */
const NAVIGATE_PARK = BEAT_PARK_CENTRES.navigate ?? 0.4;

/**
 * NavigateCopyLabPage — pinned, scroll-free lab for the Navigate
 * station's title + paragraph layout.
 *
 * Mounts the production 3D corridor scene + brandmark exactly as the
 * homepage does, but with the depth-corridor store FROZEN at the
 * Navigate park (`paintProgress` = `BEAT_PARK_CENTRES.navigate`,
 * `active: true`). The store's identity check (`transformEquals`)
 * means a single write per change is sufficient — no rAF write loop
 * needed.
 *
 * The lab does NOT mount `CorridorStationHeaders` (the scroll-driven
 * typewriter), `CopyAnchors` (mobile world-anchored straddle), or
 * `CorridorProgressRail` (top breadcrumb) — the focus is text
 * layout, not animation, so each variant renders its own static
 * overlay. The HUD chrome (rails, brackets) is kept so the rail-dock
 * variant can tether visibly to the left rail.
 */
export function NavigateCopyLabPage({ hudHtml, bodyClass }: NavigateCopyLabPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // ── Lab state ────────────────────────────────────────────────────
  const [variant, setVariant] = useState<VariantId>("V0");
  const [mirror, setMirror] = useState(false);
  const [copyMode, setCopyMode] = useState<CopyMode>("full");
  const [titleSize, setTitleSize] = useState<TitleSize>("M");
  const [sphereOffsetVw, setSphereOffsetVw] = useState(0);
  const [parkProgress, setParkProgress] = useState(NAVIGATE_PARK);

  // ── Freeze the depth-corridor store at Navigate park ─────────────
  // Single write per parkProgress change — `transformEquals` keeps
  // the store quiet thereafter. Restore `INITIAL_TRANSFORM` on
  // unmount so navigating away leaves no stale state.
  useEffect(() => {
    const { gateProgress } = resolveBeat(parkProgress);
    useDepthGatewayStore.getState().setTransform({
      progress: parkProgress,
      beat: "navigate",
      gateProgress,
      active: true,
      armed: false,
      paintProgress: parkProgress,
      epilogueProgress: 0,
      velocity: 0,
      docked: false,
      dockProgress: 0,
    });
    return () => {
      useDepthGatewayStore.getState().setTransform(INITIAL_TRANSFORM);
    };
  }, [parkProgress]);

  // ── Enable the 3D gyroscope (matches production / navigate-gyro lab)
  // The store already defaults to `enabled: true`, but re-asserting on
  // mount keeps the lab robust against future default changes.
  useEffect(() => {
    useGyroLabStore.getState().set({ enabled: true });
    return () => useGyroLabStore.getState().reset();
  }, []);

  // ── HUD hamburger nav (same hookup as HomeV2Page) ────────────────
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const navEl = root.querySelector<HTMLElement>(".hud__nav");
    const navBtn = root.querySelector<HTMLButtonElement>(".hud__nav__btn");
    if (!navEl || !navBtn) return;
    const toggle = () => {
      navEl.classList.toggle("is-open");
    };
    navBtn.addEventListener("click", toggle);
    return () => {
      navBtn.removeEventListener("click", toggle);
    };
  }, []);

  // ── Mark the corridor engaged so co-mounted scroll listeners (if
  // any) don't fight us. There are none on this route in practice,
  // but the attribute is cheap insurance and is cleared on unmount.
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-corridor-engaged", "true");
    html.setAttribute("data-brandmark-mode", "off");
    return () => {
      html.removeAttribute("data-corridor-engaged");
      html.removeAttribute("data-brandmark-mode");
    };
  }, []);

  // Compose the inline CSS variable for the sphere-offset wrapper.
  const shiftStyle = { ["--lab-sphere-offset" as string]: `${sphereOffsetVw}vw` };

  return (
    <div
      ref={rootRef}
      className={`navigate-copy-lab home-v2-root ${bodyClass}`}
      data-theme="dark"
      data-variant={variant}
      data-mirror={mirror ? "true" : "false"}
    >
      {/* v7 HUD chrome (gateway + rails + brackets + hamburger). */}
      <div
        className="home-v2-hud-root navigate-copy-lab__hud"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />

      {/* Pinned 3D stage — no scroll, full viewport. Re-uses the
          production stage classes so the canvas + brandmark inherit
          the right z-stack, then overrides height + sticky behaviour
          in `navigate-copy-lab.css`. */}
      <div className="navigate-copy-lab__stage home-v2-stage" data-fallback="false">
        <div className="home-v2-stage__sticky">
          <div className="navigate-copy-lab__shift" style={shiftStyle}>
            <div className="home-v2-stage__canvas">
              <DepthGatewayScene />
            </div>
            <ProjectedBrandmarkActor />
          </div>

          {/* The layout variants — only the active one renders. */}
          <NavigateCopyVariants
            variant={variant}
            mirror={mirror}
            copyMode={copyMode}
            titleSize={titleSize}
          />
        </div>
      </div>

      {/* Lab control panel — fixed bottom-right overlay. */}
      <NavigateCopyControlPanel
        variant={variant}
        onVariantChange={setVariant}
        mirror={mirror}
        onMirrorChange={setMirror}
        copyMode={copyMode}
        onCopyModeChange={setCopyMode}
        titleSize={titleSize}
        onTitleSizeChange={setTitleSize}
        sphereOffsetVw={sphereOffsetVw}
        onSphereOffsetChange={setSphereOffsetVw}
        parkProgress={parkProgress}
        onParkProgressChange={setParkProgress}
      />
    </div>
  );
}
