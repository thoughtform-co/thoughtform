"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { buildModel, defaultSel, MPL_READINGS, type MplReading, type MplRecord } from "./models";
import { PhoneDoc } from "./PhoneDoc";
import {
  isMplId,
  isMplPreset,
  MPL_DIRECTIONS,
  MPL_IDS,
  MPL_PRESETS,
  type MplId,
  type MplPreset,
} from "./variants";

type Theme = "dark" | "light";

const isReading = (v: string | null): v is MplReading => v === "work" || v === "configuration";

/**
 * /test/map-phone-lab — two modes on one route.
 *
 *   BOARD (default)  every column side by side, each an `<iframe>` of the
 *                    single mode at a real phone viewport — the split pile's
 *                    rules, `svh` and the theme live on each frame's own
 *                    `<html>`, which a box on a desktop page cannot give them.
 *   SINGLE (`?solo=1`)  one phone document, for the capture and for opening
 *                    a direction on its own.
 *
 * The query is adopted in a mount effect and written back with
 * `history.replaceState` (never `useSearchParams` — a CSR bailout); `?theme=`
 * is applied before paint by the site's own bootstrap and mirrored onto
 * `<html data-theme>` here, never through `colorScheme`.
 */
export interface MplQuery {
  solo?: string;
  v?: string;
  r?: string;
  preset?: string;
  theme?: string;
  sel?: string;
}

export function MapPhoneLabShell({ record, query }: { record: MplRecord; query: MplQuery }) {
  const model = useMemo(() => buildModel(record), [record]);
  /* The query arrives from the server's `searchParams` (the page is dynamic
     and dev-only), so the first render is already the asked-for state — no
     mount effect, no board-then-phone flash inside the iframes. */
  const solo = query.solo === "1";
  const [v] = useState<MplId>(isMplId(query.v ?? null) ? (query.v as MplId) : "pick");
  const [reading, setReading] = useState<MplReading>(
    isReading(query.r ?? null) ? (query.r as MplReading) : "work"
  );
  const [preset, setPreset] = useState<MplPreset>(
    isMplPreset(query.preset ?? null) ? (query.preset as MplPreset) : "p844"
  );
  const [theme, setTheme] = useState<Theme>(query.theme === "light" ? "light" : "dark");
  const [sel, setSel] = useState<string>(() =>
    query.sel && model.streams.some((s) => s.id === query.sel) ? query.sel : defaultSel(model)
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const q = new URLSearchParams();
    if (solo) q.set("solo", "1");
    q.set("v", v);
    q.set("r", reading);
    q.set("preset", preset);
    q.set("theme", theme);
    q.set("sel", sel);
    window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
  }, [solo, v, reading, preset, theme, sel]);

  /* The shipped console keeps its own reading; the readout follows it by
     watching the console's `data-view`, so the stamp is the reading on
     screen rather than the one asked for. */
  const [observed, setObserved] = useState<MplReading | null>(null);
  useEffect(() => {
    if (!solo || v !== "shipped") return;
    const read = () => {
      const view = document.querySelector(".mpl-pile .fl-pda")?.getAttribute("data-view");
      const r = MPL_READINGS[Number(view) - 1];
      if (r) setObserved(r);
    };
    const raf = requestAnimationFrame(read);
    const mo = new MutationObserver(read);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-view"] });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, [solo, v]);
  const shownReading = v === "shipped" ? (observed ?? "work") : reading;

  const onSel = useCallback((id: string) => setSel(id), []);

  if (solo) {
    return (
      <main className="mpl-solo">
        <PhoneDoc
          v={v}
          model={model}
          reading={reading}
          onReading={setReading}
          sel={sel}
          onSel={onSel}
          stamp={`${v}|${shownReading}|${preset}|${theme}|${sel}`}
        />
      </main>
    );
  }

  const size = MPL_PRESETS[preset];
  const src = (id: MplId) =>
    `/test/map-phone-lab?solo=1&v=${id}&r=${reading}&preset=${preset}&theme=${theme}&sel=${sel}`;

  return (
    <main className="mpl-board">
      <header className="mpl-board__head">
        <h1>Map phone lab</h1>
        <p>
          The last proof card&apos;s three readings on a phone, one column per direction. Each frame
          is a real phone document; tap inside it as on the device.
        </p>
        <div className="mpl-board__ctl">
          <span>Reading</span>
          {MPL_READINGS.map((r) => (
            <button
              key={r}
              type="button"
              data-on={r === reading || undefined}
              onClick={() => setReading(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="mpl-board__ctl">
          <span>Frame</span>
          {(Object.keys(MPL_PRESETS) as MplPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              data-on={p === preset || undefined}
              onClick={() => setPreset(p)}
            >
              {MPL_PRESETS[p].w}×{MPL_PRESETS[p].h}
            </button>
          ))}
        </div>
        <div className="mpl-board__ctl">
          <span>Theme</span>
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              type="button"
              data-on={t === theme || undefined}
              onClick={() => setTheme(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mpl-board__ctl">
          <span>Stream</span>
          <select value={sel} onChange={(e) => setSel(e.target.value)}>
            {model.streams.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </header>
      <div className="mpl-board__row">
        {MPL_IDS.map((id) => (
          <figure key={id} className="mpl-board__col">
            <figcaption>
              <b>{MPL_DIRECTIONS[id].label}</b>
              <span>{MPL_DIRECTIONS[id].thesis}</span>
            </figcaption>
            <iframe
              key={src(id)}
              title={MPL_DIRECTIONS[id].label}
              src={src(id)}
              width={size.w}
              height={size.h}
              className="mpl-board__frame"
            />
          </figure>
        ))}
      </div>
    </main>
  );
}
