"use client";

import { useEffect, useRef, useState } from "react";

import type { SheetStations } from "@/lib/sheet/types";

/**
 * SheetStationRow — a row of boxed stations that narrows the page (ADR-114).
 *
 * The `ArcKindFilter` mechanism, generalised: picking a station writes ONE
 * attribute, `data-sh-<attr>`, on the sheet's root, and every element that
 * declares `data-sh-filter="<attr>"` with a `data-<attr>s` token list takes
 * `hidden` when the picked value is not among its tokens.
 *
 * ⚠ NO ATTRIBUTE MEANS EVERYTHING IS SHOWN — the page is whole before this
 * mounts and the control opts INTO a narrowed view. ⚠ IT HIDES WHOLE
 * CONSOLES, ROWS AND CELLS, NEVER A SLOT INSIDE A LIVE STACK (the stack's
 * indices and `--sh-n` would go wrong).
 *
 * The stations are ADR-089 U3/U4: outlined boxes with a MARGIN between them,
 * the picked one filled in inverse video.
 */
export function SheetStationRow({ attr, label, stations }: SheetStations) {
  const [picked, setPicked] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = hostRef.current?.closest<HTMLElement>(".sh-root");
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>(`[data-sh-filter="${attr}"]`);
    if (picked) root.setAttribute(`data-sh-${attr}`, picked);
    else root.removeAttribute(`data-sh-${attr}`);
    for (const el of targets) {
      const tokens = (el.getAttribute(`data-${attr}s`) ?? "").split(/\s+/).filter(Boolean);
      el.hidden = picked !== null && !tokens.includes(picked);
    }
    return () => {
      root.removeAttribute(`data-sh-${attr}`);
      for (const el of targets) el.hidden = false;
    };
  }, [attr, picked]);

  return (
    <div ref={hostRef} className="sh-stns" role="group" aria-label={label}>
      <button
        type="button"
        className={`sh-stn${picked === null ? " is-on" : ""}`}
        aria-pressed={picked === null}
        onClick={() => setPicked(null)}
      >
        All
      </button>
      {stations.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`sh-stn${picked === s.id ? " is-on" : ""}`}
          aria-pressed={picked === s.id}
          onClick={() => setPicked(picked === s.id ? null : s.id)}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
