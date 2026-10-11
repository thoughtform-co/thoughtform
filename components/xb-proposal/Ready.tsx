"use client";

import { useEffect } from "react";

/** Marks the page ready once the faces have loaded, for the capture. */
export function Ready() {
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (live) document.documentElement.dataset.xbReady = "1";
        })
      )
    );
    return () => {
      live = false;
    };
  }, []);
  return null;
}
