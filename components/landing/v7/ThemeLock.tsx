"use client";

/**
 * ThemeLock — holds a locked route in its theme across a CLIENT-SIDE entry
 * (ADR-093).
 *
 * On a full document load this component has nothing to do: the pre-paint
 * bootstrap in `app/layout.tsx` already stamped both attributes before
 * anything painted. It exists for the two cases the bootstrap cannot reach
 * — a `next/link` navigation INTO the route, which runs no document
 * script, and the navigation back OUT of it, which has to give the visitor
 * their own theme back.
 *
 * ⚠ IT IS A SIBLING OF `LandingPage`, NEVER A CHILD. That component owns a
 * `dangerouslySetInnerHTML` body with nested `createRoot`s inside it; a
 * re-render there re-applies the markup and silently orphans them
 * (`.claude/rules/landing-v7.md`). This leaf holds its own effect and
 * renders nothing, exactly as `HeroThemeGlitch` and `CelestialEditorGate`
 * do.
 *
 * ⚠ STAMPING THE ATTRIBUTE IS NOT ENOUGH — `hydrateFromDom()` HAS TO
 * FOLLOW IT. `data-theme` is only the CSS channel; the WebGL side reads
 * `themeModeRef` and the store (ADR-058: `ShellSubstrateGyro` and
 * `ServicesCardRing` subscribe, and `.claude/rules/services-ring.md`
 * records that a raw attribute write does not re-bake the drawer's
 * textures). `hydrateFromDom` is precisely ref + state + notify with no
 * DOM and no storage write — the ADR-058 contract minus persistence, which
 * is what a lock wants.
 *
 * ⚠ `useLayoutEffect`, NOT `useEffect`, and this is the subtle one. Passive
 * effects run child-first: on a client-side entry `HeroThemeGlitch` would
 * subscribe to the store (capturing `lastMode = "dark"`) BEFORE a passive
 * lock ran, and the notify that followed would read as a real theme flip —
 * so the glitch would fetch BOTH hero plates (~780 kB) on a page that can
 * never toggle. A layout effect lands first and the glitch captures light,
 * so its own `mode === lastMode` guard swallows every later notify.
 *
 * ⚠ IT NEVER WRITES `localStorage`. The visitor's stored choice is theirs;
 * a lock that persisted itself would follow them back to `/` and change a
 * site they never asked to change. The restore on unmount reads that
 * untouched value back.
 */

import { useLayoutEffect } from "react";

import { useThemeStore } from "@/lib/stores/themeStore";
import { THEME_LOCK_ATTR } from "@/lib/theme/themeLock";

import { THEME_STORAGE_KEY } from "./themeToggle";

export function ThemeLock(): null {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", "light");
    root.setAttribute(THEME_LOCK_ATTR, "light");
    // One synchronous task: attribute, then ref + store, so the CSS recalc
    // and any GL uniform write land in the same rendered frame.
    useThemeStore.getState().hydrateFromDom();

    return () => {
      root.removeAttribute(THEME_LOCK_ATTR);
      // Hand the visitor their own theme back. Storage was never written
      // by the lock, so this is the choice they made before they arrived —
      // and "dark" is the ABSENCE of the attribute, never a written value.
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        /* private mode / blocked embeds — fall through to dark */
      }
      if (stored === "light") root.setAttribute("data-theme", "light");
      else root.removeAttribute("data-theme");
      useThemeStore.getState().hydrateFromDom();
    };
  }, []);

  return null;
}
