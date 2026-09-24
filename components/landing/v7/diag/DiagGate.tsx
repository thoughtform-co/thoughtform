"use client";

import { useEffect, useState, type ComponentType } from "react";

/**
 * The phone diagnostic's GATE (ADR-123 §Part 1, commit A).
 *
 * Off the anonymous path by construction: the panel's module is a dynamic
 * edge (`landing-import-doctrine` skips `import()` on purpose) fetched only
 * when the URL carries `?diag=phone` — or when a previous page on this tab
 * did, because the whole point is to read the strip AFTER a reload the reader
 * did not ask for, and a reload drops the query string. `sessionStorage`
 * carries the flag across it and dies with the tab.
 *
 * Two counters are registered HERE rather than in the panel, because they
 * must be listening from the first frame: a WebGL context lost/restored
 * (capture phase, so a canvas that stops the event still counts) and
 * `pageshow` (whether the page was restored from the bfcache).
 */

const FLAG_KEY = "tf-diag";
const QUERY_VALUE = "phone";

export interface DiagBoot {
  lost: number;
  restored: number;
  persisted: boolean | null;
  pageshows: number;
}

const boot: DiagBoot = { lost: 0, restored: 0, persisted: null, pageshows: 0 };
export function readDiagBoot(): DiagBoot {
  return boot;
}

function wanted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("diag");
    if (q === QUERY_VALUE) {
      window.sessionStorage.setItem(FLAG_KEY, "1");
      return true;
    }
    if (q === "off") {
      window.sessionStorage.removeItem(FLAG_KEY);
      return false;
    }
    return window.sessionStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function DiagGate() {
  const [Panel, setPanel] = useState<ComponentType | null>(null);

  useEffect(() => {
    const onLost = () => {
      boot.lost += 1;
    };
    const onRestored = () => {
      boot.restored += 1;
    };
    const onPageShow = (e: PageTransitionEvent) => {
      boot.pageshows += 1;
      boot.persisted = e.persisted;
    };
    window.addEventListener("webglcontextlost", onLost, true);
    window.addEventListener("webglcontextrestored", onRestored, true);
    window.addEventListener("pageshow", onPageShow);

    let cancelled = false;
    if (wanted()) {
      import("./DiagPanel").then((m) => {
        if (!cancelled) setPanel(() => m.DiagPanel);
      });
    }
    return () => {
      cancelled = true;
      window.removeEventListener("webglcontextlost", onLost, true);
      window.removeEventListener("webglcontextrestored", onRestored, true);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return Panel ? <Panel /> : null;
}
