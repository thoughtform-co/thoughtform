"use client";

import { useSyncExternalStore } from "react";

import { SH_DRAWABLE, SH_KNOB_LIST, parseSheetQuery } from "@/lib/sheet/directions";

/**
 * The kit's console (ADR-114): prints the direction and the knobs the page
 * is drawn at, and links to every drawable direction in both themes. Reads
 * the URL and the theme attribute once through an external-store read (so
 * the server renders a blank readout and the client fills it without a
 * setState-in-effect); the attributes themselves are written by
 * `SheetQueryKnobs`.
 */
const subscribe = () => () => {};
const readClient = () =>
  typeof window === "undefined"
    ? ""
    : `${window.location.search}|${document.documentElement.getAttribute("data-theme") ?? "dark"}`;
const readServer = () => "";

export function KitConsole() {
  const key = useSyncExternalStore(subscribe, readClient, readServer);
  const hydrated = key !== "";
  const [search = "", themeRaw = "dark"] = key.split("|");
  const { knobs, k } = parseSheetQuery(new URLSearchParams(search));
  const theme = themeRaw === "light" ? "light" : "dark";
  const other = theme === "light" ? "dark" : "light";
  return (
    <aside className="sk-console" aria-label="Kit console">
      <p className="sk-console__row">
        <span className="sk-console__k">Direction</span>
        <span className="sk-console__v">{hydrated ? k || "mixed" : "…"}</span>
      </p>
      {SH_KNOB_LIST.map(({ key: knob, def }) => (
        <p className="sk-console__row" key={knob}>
          <span className="sk-console__k">{def.label}</span>
          <span className="sk-console__v">{hydrated ? knobs[knob] : def.values[0]}</span>
        </p>
      ))}
      <p className="sk-console__row sk-console__links">
        {SH_DRAWABLE.map((d) => (
          <a key={d.id} href={`?k=${d.id}&theme=${theme}`} className="sk-console__link">
            {d.id}
          </a>
        ))}
        <a href={`?k=${k || "SB"}&theme=${other}`} className="sk-console__link">
          {other}
        </a>
      </p>
    </aside>
  );
}
