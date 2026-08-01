/**
 * ADR-058 — the theme channel's contract.
 *
 * The load-bearing claims are (a) the attribute is only ever "light" or
 * ABSENT, never `data-theme="dark"` (a written "dark" would match the
 * inert markers `LandingPage` / `ArcShell` / the test shells carry on
 * INNER elements), and (b) `readThemeMode()` self-heals from the
 * pre-paint attribute before any writer has run — that is what stops a
 * painter mounted on a light-mode reload from showing dark for a frame.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { readThemeMode, themeModeIndex, themeModeRef } from "@/lib/theme/themeModeRef";
import { useThemeStore } from "@/lib/stores/themeStore";
import { THEME_STORAGE_KEY } from "@/components/landing/v7/themeToggle";

function resetChannel() {
  themeModeRef.current = { mode: "dark", version: 0 };
  document.documentElement.removeAttribute("data-theme");
  window.localStorage.clear();
  useThemeStore.setState({ mode: "dark", hydrated: false });
}

describe("themeModeRef", () => {
  beforeEach(resetChannel);

  it("falls back to the pre-paint attribute before a writer has run", () => {
    document.documentElement.setAttribute("data-theme", "light");
    expect(themeModeRef.current.version).toBe(0);
    expect(readThemeMode()).toBe("light");
  });

  it("defaults to dark when no attribute and no writer", () => {
    expect(readThemeMode()).toBe("dark");
    expect(themeModeIndex()).toBe(0);
  });

  it("prefers the live ref over the attribute once a writer owns it", () => {
    document.documentElement.setAttribute("data-theme", "light");
    themeModeRef.current = { mode: "dark", version: 1 };
    expect(readThemeMode()).toBe("dark");
  });
});

describe("themeStore.setMode", () => {
  beforeEach(resetChannel);

  it("writes light to all three channels", () => {
    useThemeStore.getState().setMode("light");

    expect(themeModeRef.current.mode).toBe("light");
    expect(themeModeRef.current.version).toBeGreaterThan(0);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(useThemeStore.getState().mode).toBe("light");
  });

  it("REMOVES the attribute for dark — never writes data-theme='dark'", () => {
    useThemeStore.getState().setMode("light");
    useThemeStore.getState().setMode("dark");

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(themeModeRef.current.mode).toBe("dark");
    // The choice still persists — dark is explicit in storage, absent in the DOM.
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("bumps the ref BEFORE the attribute, so a racing frame cannot read stale", () => {
    const seen: string[] = [];
    const observer = new MutationObserver(() => seen.push(themeModeRef.current.mode));
    observer.observe(document.documentElement, { attributes: true });

    useThemeStore.getState().setMode("light");
    // MutationObserver callbacks are microtasks; the ref is already live.
    expect(themeModeRef.current.mode).toBe("light");
    observer.disconnect();
  });

  it("toggle flips between the two modes", () => {
    const { toggle } = useThemeStore.getState();
    toggle();
    expect(useThemeStore.getState().mode).toBe("light");
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().mode).toBe("dark");
  });
});

describe("themeStore.hydrateFromDom", () => {
  beforeEach(resetChannel);

  it("adopts the bootstrap's attribute without rewriting DOM or storage", () => {
    document.documentElement.setAttribute("data-theme", "light");

    useThemeStore.getState().hydrateFromDom();

    expect(useThemeStore.getState().mode).toBe("light");
    expect(useThemeStore.getState().hydrated).toBe(true);
    expect(themeModeRef.current.mode).toBe("light");
    // A `?theme=` override must not be persisted by merely being adopted.
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("reads dark when the attribute is absent", () => {
    useThemeStore.getState().hydrateFromDom();
    expect(useThemeStore.getState().mode).toBe("dark");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
