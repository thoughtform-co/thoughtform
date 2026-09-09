import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ThemeLock } from "@/components/landing/v7/ThemeLock";
import { THEME_STORAGE_KEY } from "@/components/landing/v7/themeToggle";
import { useThemeStore } from "@/lib/stores/themeStore";
import { themeBootstrapScript } from "@/lib/theme/themeBootstrap";
import { isLightLockedPath, LIGHT_LOCKED_ROUTES, THEME_LOCK_ATTR } from "@/lib/theme/themeLock";
import { themeModeRef } from "@/lib/theme/themeModeRef";

/**
 * ADR-093 — a route locked to one theme.
 *
 * Two halves, and the first is a STRING. `themeBootstrapScript()` is inline
 * source that runs before any module exists, so nothing type-checks it and
 * every failure is silent: a missed route opens dark, a stray storage write
 * follows the reader home. It is evaluated here against a real jsdom
 * document, the way `hero-preload.test.ts` pins its sibling.
 *
 * The second half is the leaf that covers client-side entry, where no
 * document script runs at all.
 */

const ROOT = join(__dirname, "..", "..");

function resetChannel() {
  themeModeRef.current = { mode: "dark", version: 0 };
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute(THEME_LOCK_ATTR);
  window.localStorage.clear();
  useThemeStore.setState({ mode: "dark", hydrated: false });
}

/** Run the bootstrap as the browser would, at a given URL. */
function runBootstrapAt(url: string) {
  window.history.pushState({}, "", url);
  // The script under test IS a string; running it is the only honest check.
  new Function(themeBootstrapScript())();
}

describe("the light-locked routes", () => {
  it("normalises a trailing slash and rejects a near miss", () => {
    expect(isLightLockedPath("/trinny-london")).toBe(true);
    expect(isLightLockedPath("/trinny-london/")).toBe(true);
    expect(isLightLockedPath("/trinny-londonx")).toBe(false);
    expect(isLightLockedPath("/")).toBe(false);
  });

  it("locks exactly the routes composed in light, and no others", () => {
    // Hand-written, like HERO_ROUTES: a route joins or leaves BY HAND, so
    // the list is pinned rather than derived. `/` and `/claude-workshop`
    // must never appear here — they are the site's own themed surfaces.
    expect([...LIGHT_LOCKED_ROUTES]).toEqual(["/trinny-london"]);
  });
});

describe("themeBootstrapScript — the pre-paint decision", () => {
  beforeEach(resetChannel);

  it("stamps BOTH attributes on a locked route", () => {
    runBootstrapAt("/trinny-london");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.getAttribute(THEME_LOCK_ATTR)).toBe("light");
  });

  it("beats a stored dark preference AND an explicit ?theme=dark", () => {
    // The two ways a reader could arrive in the wrong theme. Neither wins:
    // a pitch page is composed in light and there is no legitimate reason
    // to force it out of the theme it was designed in.
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    runBootstrapAt("/trinny-london?theme=dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.getAttribute(THEME_LOCK_ATTR)).toBe("light");
  });

  it("NEVER writes storage — the visitor's own choice survives the visit", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    runBootstrapAt("/trinny-london");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("locks the trailing-slash form too", () => {
    runBootstrapAt("/trinny-london/");
    expect(document.documentElement.getAttribute(THEME_LOCK_ATTR)).toBe("light");
  });

  it("leaves every other route on the ADR-058 chain, unchanged", () => {
    // Stored dark on `/` → no attribute at all (dark is the ABSENCE of it).
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    runBootstrapAt("/");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(document.documentElement.hasAttribute(THEME_LOCK_ATTR)).toBe(false);

    // Stored light on `/claude-workshop` → light, and still no lock mark.
    resetChannel();
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    runBootstrapAt("/claude-workshop");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.hasAttribute(THEME_LOCK_ATTR)).toBe(false);

    // `?theme=light` on `/` still overrides stored dark, and is not persisted.
    resetChannel();
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    runBootstrapAt("/?theme=light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("never writes data-theme='dark' anywhere in its source", () => {
    // ADR-058's standing ban: eleven inner elements carry an inert dark
    // marker, so a written "dark" would double-match every dark-keyed rule.
    expect(themeBootstrapScript()).not.toContain('"data-theme","dark"');
  });

  it("is mounted in the layout INSIDE the THEME_TOGGLE gate", () => {
    // Flipping THEME_TOGGLE off is ADR-058's rollback — the whole site
    // returns to the pre-ADR-058 dark page, this route included. The lock
    // has to go with it, or the rollback leaves one route stamping an
    // attribute whose cascade is no longer wired.
    const layout = readFileSync(join(ROOT, "app", "layout.tsx"), "utf8");
    const gate = layout.indexOf("{THEME_TOGGLE && (");
    const call = layout.indexOf("themeBootstrapScript()");
    expect(gate).toBeGreaterThan(-1);
    expect(call).toBeGreaterThan(gate);
    expect(call).toBeLessThan(layout.indexOf(")}", gate));
  });
});

describe("ThemeLock — the client-side entry leaf", () => {
  beforeEach(resetChannel);

  it("stamps both attributes and carries the theme into the STORE", () => {
    // The attribute alone is only the CSS channel; the WebGL painters read
    // `themeModeRef` and the store (ADR-058).
    render(<ThemeLock />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.getAttribute(THEME_LOCK_ATTR)).toBe("light");
    expect(useThemeStore.getState().mode).toBe("light");
    expect(themeModeRef.current.mode).toBe("light");
    expect(themeModeRef.current.version).toBeGreaterThan(0);
  });

  it("does not persist the lock", () => {
    render(<ThemeLock />);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("hands a dark visitor their theme back on the way out", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const view = render(<ThemeLock />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    view.unmount();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(document.documentElement.hasAttribute(THEME_LOCK_ATTR)).toBe(false);
    expect(useThemeStore.getState().mode).toBe("dark");
    expect(themeModeRef.current.mode).toBe("dark");
  });

  it("leaves a light visitor in light on the way out", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    const view = render(<ThemeLock />);
    view.unmount();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.hasAttribute(THEME_LOCK_ATTR)).toBe(false);
    expect(useThemeStore.getState().mode).toBe("light");
  });

  it("uses a LAYOUT effect, so it lands before the glitch subscribes", () => {
    /* ⚠ Source-pinned because the failure is invisible: with a passive
       effect, `HeroThemeGlitch` subscribes first (capturing dark), the
       lock's notify then reads as a real flip, and the glitch warms BOTH
       hero plates — ~780 kB fetched on a page that can never toggle.
       Nothing on screen would say so. */
    const src = readFileSync(join(ROOT, "components/landing/v7/ThemeLock.tsx"), "utf8");
    expect(src).toContain("useLayoutEffect");
    expect(src).not.toMatch(/\buseEffect\(/);
  });
});
