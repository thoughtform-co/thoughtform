/**
 * themeStore — light/dark mode state (ADR-058).
 *
 * LOW-FREQUENCY state only (one click, rarely twice a session), so
 * zustand is the right shape here — the `arcCasesStore` precedent. The
 * per-frame consumers (WebGL painters) do NOT subscribe for a value they
 * read every frame; they either subscribe once to re-apply uniforms on a
 * flip, or read `themeModeRef` directly.
 *
 * `setMode` is the SINGLE WRITER and its internal order is the ADR-058
 * contract:
 *
 *   1. `themeModeRef` — so a painter's rAF racing this task reads the new
 *      mode, never the old one;
 *   2. the `<html data-theme>` attribute — the CSS channel;
 *   3. localStorage — persistence (must never throw out: private-mode
 *      Safari and storage-blocked embeds still have to toggle);
 *   4. the zustand notify — re-renders the toggle leaf and any React-side
 *      consumer that keys bakes/memos on `mode`.
 *
 * All four run in ONE synchronous task, which is what makes the style
 * recalc from (2) and the uniform writes driven by (1) land in the same
 * rendered frame. Never defer any step into an effect: a one-frame
 * CSS/GL tear is exactly the failure this ordering exists to prevent.
 *
 * Initial state is ALWAYS "dark" so SSR and the first client render
 * agree; `hydrateFromDom()` (called from the toggle leaf's mount effect)
 * adopts whatever the pre-paint bootstrap already put on `<html>`. It
 * writes state and the ref only — never the DOM, never storage — because
 * the attribute is already correct at that point, and re-writing it would
 * clobber a `?theme=` override with the stored value.
 */

import { create } from "zustand";
import { themeModeRef, type ThemeMode } from "@/lib/theme/themeModeRef";
import { THEME_STORAGE_KEY } from "@/components/landing/v7/themeToggle";

interface ThemeState {
  /** The active theme. "dark" until the DOM says otherwise. */
  mode: ThemeMode;
  /** True once `hydrateFromDom` has run — lets the toggle render an
   *  SSR-safe face on first paint and the real one after mount. */
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  /** Adopt the pre-paint attribute. State + ref only; no DOM, no storage. */
  hydrateFromDom: () => void;
}

/** Steps 1–3 of the contract. The zustand notify is step 4, in `setMode`. */
function applyMode(mode: ThemeMode): void {
  // 1 — the GL channel first: a painter frame racing this task must not
  //     read a stale mode while the attribute already says otherwise.
  themeModeRef.current = { mode, version: themeModeRef.current.version + 1 };

  if (typeof document !== "undefined") {
    // 2 — the CSS channel. Dark is the ABSENCE of the attribute, never
    //     `data-theme="dark"` (see the flag module's docblock).
    const root = document.documentElement;
    if (mode === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
  }

  // 3 — persistence. Storage can throw (private mode, blocked embeds);
  //     a failed write must never block the flip.
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "dark",
  hydrated: false,

  setMode: (mode) => {
    applyMode(mode);
    set({ mode, hydrated: true }); // 4 — notify
  },

  toggle: () => {
    const { mode, setMode } = get();
    setMode(mode === "light" ? "dark" : "light");
  },

  hydrateFromDom: () => {
    const mode: ThemeMode =
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    themeModeRef.current = { mode, version: themeModeRef.current.version + 1 };
    set({ mode, hydrated: true });
  },
}));
