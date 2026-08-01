/**
 * Feature flag for the LIGHT-MODE THEME TOGGLE (ADR-058, 2026-08-01).
 *
 * When ON:
 *   - `app/layout.tsx` injects the pre-paint theme bootstrap — it reads
 *     `?theme=light|dark` then `localStorage["tf-theme"]`, defaults to
 *     dark, and sets `data-theme="light"` on `<html>` before first paint;
 *   - `LandingPage` and `ArcShell` mount `LightModeToggle` (the
 *     bottom-right chrome band, inboard of the `--br` corner bracket);
 *   - `theme.css`'s `html[data-theme="light"]` cascade + the
 *     `themeStore` / `themeModeRef` channel arm the DOM and (from Phase 2)
 *     the WebGL flip.
 *
 * The attribute is only ever `"light"` or ABSENT — dark is the
 * unqualified `:root` default and is never written as an attribute
 * value. Two consequences worth keeping: no rule may be authored against
 * `[data-theme="dark"]` (it would double-match the inert dark markers
 * that `LandingPage` / `ArcShell` / the test shells already carry), and
 * a dark session's DOM is byte-identical to the pre-ADR-058 site.
 *
 * OFF restores the dark landing byte-identically: the bootstrap never
 * injects, the toggle never mounts, `<html>` never carries `data-theme`,
 * and every `theme.css` light selector is unmatched (the sheet still
 * ships, inert). Flipping this to `false` is the rollback.
 */
export const THEME_TOGGLE = true;

/** localStorage key holding the visitor's explicit choice ("light" | "dark"). */
export const THEME_STORAGE_KEY = "tf-theme";
