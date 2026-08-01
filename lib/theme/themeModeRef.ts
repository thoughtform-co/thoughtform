/**
 * themeModeRef — the light/dark mode's transport across the DOM→GL seam
 * (ADR-058).
 *
 * The theme's CSS side travels as a `data-theme` attribute on `<html>`;
 * its WebGL side cannot read that without `getComputedStyle`, which the
 * `corridorDissipateRef` perf pass banned from per-frame paths (a style
 * read there invalidates computed style for the whole document). So the
 * mode ALSO travels through this module ref, written synchronously by
 * `useThemeStore.setMode` in the same task as the attribute — that is
 * what makes the CSS recalc and the GL uniform writes land in the SAME
 * rendered frame instead of tearing across two.
 *
 * `version` is the provenance counter: 0 until a writer has run. Readers
 * go through `readThemeMode()`, which falls back to the attribute the
 * pre-paint bootstrap script (`app/layout.tsx`) set before hydration —
 * that is what keeps a painter mounted before the store hydrates from
 * showing dark for a frame on a light-mode reload. Bumping `version` on
 * every write also gives subscribers a cheap "theme changed" signal that
 * does not depend on the string having changed.
 *
 * THREE-FREE on purpose (landing-performance doctrine): DOM components
 * import this, so a `three` import here would drag the WebGL stack into
 * the landing's First Load JS.
 */

export type ThemeMode = "dark" | "light";

export const themeModeRef: { current: { mode: ThemeMode; version: number } } = {
  current: { mode: "dark", version: 0 },
};

/** Read the theme: the live ref once a writer owns it, else the
 *  pre-paint `<html data-theme>` attribute, else "dark" (SSR). */
export function readThemeMode(): ThemeMode {
  if (themeModeRef.current.version > 0) return themeModeRef.current.mode;
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/** 0 = dark, 1 = light — the numeric form shaders and gain tables index by. */
export function themeModeIndex(mode: ThemeMode = readThemeMode()): 0 | 1 {
  return mode === "light" ? 1 : 0;
}
