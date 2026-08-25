"use client";

import { useEffect, useState } from "react";
import { FlightLabPanel } from "./FlightLabPanel";

/** Renders the FlightLabPanel one macrotask after hydration. See the
 *  page for why. */
export function DeferredFlightLabPanel() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Two rAFs + a settimeout: rAF chases past the initial commit, and
    // setTimeout past the corridor's own `setTimeout(0)` remounts.
    let raf = 0;
    let raf2 = 0;
    let timer = 0;
    raf = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        timer = window.setTimeout(() => setReady(true), 0);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
    };
  }, []);
  return ready ? <FlightLabPanel /> : null;
}
