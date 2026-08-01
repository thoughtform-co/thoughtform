"use client";

/**
 * LightModeToggle — the light/dark control (ADR-058).
 *
 * Mounted as a SIBLING of the parse-injected markup (the `HudNav`
 * precedent), in its own fixed `.theme-toggle-overlay` at z 60 OUTSIDE
 * `.hud`. Two reasons that placement is not cosmetic:
 *   - `.hud__rail` / `.hud__corner--*` carry the ADR-031 U16 hero-curtain
 *     `clip-path`, so a control mounted in the right rail would be
 *     invisible for the whole hero and then pop in;
 *   - the rail's terminal 100% tick is byte-pinned by
 *     `tests/lib/rail-manifest.test.ts`; nothing may be appended inside
 *     the rail box.
 *
 * ⚠ ALL theme state lives in THIS leaf. `LandingPage` owns a
 * `dangerouslySetInnerHTML` body with nested `createRoot`s inside it
 * (ServicesPortal, AboutStagePortal, …); a LandingPage re-render
 * re-applies that markup and silently orphans them — the services cards
 * just vanish. So this component subscribes to the store itself and
 * LandingPage only ever renders it behind a build-time const.
 * See `.claude/rules/landing-v7.md` and `CelestialEditorGate`.
 *
 * SSR parity: the store starts "dark" on both sides, and
 * `hydrateFromDom()` adopts whatever the pre-paint bootstrap already put
 * on `<html>`. Until that lands we render the dark-session face, so the
 * server and first client render agree even when the visitor is in light
 * mode — the page colors are already correct at that point; only the
 * 18px glyph settles a frame later.
 */

import { useEffect } from "react";

import { ThemeGlyph } from "./ThemeGlyph";
import { useThemeStore } from "@/lib/stores/themeStore";

export function LightModeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const hydrated = useThemeStore((s) => s.hydrated);
  const toggle = useThemeStore((s) => s.toggle);

  useEffect(() => {
    useThemeStore.getState().hydrateFromDom();
  }, []);

  const isLight = hydrated && mode === "light";
  const target = isLight ? "dark" : "light";
  const label = isLight ? "Switch to dark theme" : "Switch to light theme";

  return (
    <div className="theme-toggle-overlay">
      <button
        type="button"
        className="theme-toggle"
        onClick={toggle}
        role="switch"
        aria-checked={isLight}
        aria-label={label}
        title={label}
      >
        <ThemeGlyph target={target} />
      </button>
    </div>
  );
}
