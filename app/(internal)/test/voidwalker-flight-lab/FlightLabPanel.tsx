"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  VW_FLIGHT_DEFAULT,
  getVwFlightConfig,
  resetVwFlightConfig,
  setVwFlightOverrides,
  type VwFlightConfig,
  type VwPathVariant,
} from "@/lib/voidwalker/voidwalkerFlightConfig";

/**
 * FlightLabPanel — the ADR-081 flight-grammar lever surface.
 *
 * Floats top-left over `LandingPage`, writes to
 * `voidwalkerFlightConfig`, and mirrors state to the URL query so a
 * variant can be linked / captured / shared. Also auto-scrolls into the
 * `#voidwalker` runway on mount so the reader lands where the levers
 * do something visible.
 *
 * ⚠ THIS MOUNTS ONLY ON `/test/voidwalker-flight-lab`. The production
 * marketing page never renders it, and the config module never mutates,
 * so `getVwFlightConfig()` returns the defaults on production.
 *
 * Panel design is deliberately dense — this is a lab, not a UI. Sliders
 * are numeric inputs (no drag-to-tweak) so a keyboard step lands the
 * right value and a URL can be pasted straight in.
 */

type LabState = Pick<
  VwFlightConfig,
  | "span"
  | "tauSeconds"
  | "runwaySvh"
  | "xFar"
  | "xNear"
  | "xPark"
  | "yFar"
  | "yNear"
  | "rotMax"
  | "rollMax"
  | "curveBend"
  | "blurMax"
  | "fogIn"
  | "fogOut"
  | "detailIn"
  | "detailOut"
  | "wallDensityMul"
  | "streakStrength"
  | "entryReactionStrength"
  | "velocityStrength"
  | "railDensity"
  | "markFlyThrough"
  | "pathVariant"
>;

const KEYS: Array<keyof LabState> = [
  "pathVariant",
  "span",
  "tauSeconds",
  "runwaySvh",
  "xPark",
  "xFar",
  "xNear",
  "yFar",
  "yNear",
  "rotMax",
  "rollMax",
  "curveBend",
  "blurMax",
  "fogIn",
  "fogOut",
  "detailIn",
  "detailOut",
  "wallDensityMul",
  "streakStrength",
  "entryReactionStrength",
  "velocityStrength",
  "railDensity",
  "markFlyThrough",
];

const NUMERIC_STEP: Record<Exclude<keyof LabState, "pathVariant">, number> = {
  span: 0.1,
  tauSeconds: 0.02,
  runwaySvh: 1,
  xPark: 0.005,
  xFar: 0.02,
  xNear: 0.02,
  yFar: 0.01,
  yNear: 0.01,
  rotMax: 1,
  rollMax: 1,
  curveBend: 0.02,
  blurMax: 0.5,
  fogIn: 0.05,
  fogOut: 0.05,
  detailIn: 0.02,
  detailOut: 0.02,
  wallDensityMul: 0.1,
  streakStrength: 0.1,
  entryReactionStrength: 0.1,
  velocityStrength: 0.1,
  railDensity: 0.1,
  markFlyThrough: 0.1,
};

const VARIANTS: VwPathVariant[] = ["linear", "curved", "housed"];

/** Named presets — one-click shortcuts to variants we want on the contact
 *  sheet. `default` = production. */
const PRESETS: Record<string, Partial<VwFlightConfig>> = {
  "V1-default": {},
  "V2-noomo-swing": {
    pathVariant: "curved",
    curveBend: 0.18,
    rollMax: 8,
    xFar: 0.32,
    xNear: 0.78,
    rotMax: 12,
  },
  "V3-housed": {
    pathVariant: "housed",
    curveBend: 0.14,
    rollMax: 6,
    xFar: 0.28,
    xNear: 0.7,
    rotMax: 10,
  },
  "populated-field": {
    span: 5,
    fogIn: 0.88,
    fogOut: 0.36,
    wallDensityMul: 1.35,
  },
  "slow-cinema": {
    tauSeconds: 0.32,
    runwaySvh: 18,
  },
  // The pre-U5 read, for comparison: dots-only walls and a brandmark
  // welded to the lens. This is what "the corridor is just dots" and
  // "we never fly through the mark" look like.
  "u5-before": {
    railDensity: 0,
    markFlyThrough: 0,
  },
  // U5 pushed further than production ships: a denser rail cage.
  "u5-rails-heavy": {
    railDensity: 1.6,
    wallDensityMul: 1.2,
  },
};

function readUrl(): Partial<LabState> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const out: Record<string, unknown> = {};
  for (const k of KEYS) {
    const v = p.get(k);
    if (v == null) continue;
    if (k === "pathVariant") {
      if ((VARIANTS as string[]).includes(v)) out[k] = v;
    } else {
      const n = Number.parseFloat(v);
      if (Number.isFinite(n)) out[k] = n;
    }
  }
  return out as Partial<LabState>;
}

function writeUrl(state: Partial<LabState>): void {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  for (const k of KEYS) {
    const v = state[k];
    if (v == null) continue;
    // Only serialize values that DIFFER from default — a URL is a diff.
    const d = VW_FLIGHT_DEFAULT[k];
    if (v !== d) p.set(k, String(v));
  }
  const q = p.toString();
  const next = q ? `${window.location.pathname}?${q}` : window.location.pathname;
  window.history.replaceState(null, "", next);
}

export function FlightLabPanel() {
  const [state, setState] = useState<LabState>(() => ({
    ...(VW_FLIGHT_DEFAULT as LabState),
    ...readUrl(),
  }));
  const [collapsed, setCollapsed] = useState(false);

  // ⚠ SIDE EFFECTS (config write + URL replace) LIVE IN AN EFFECT,
  // NOT INSIDE THE SETTER. Writing `history.replaceState` from inside a
  // React state updater re-enters Next's router mid-render and trips
  // "cannot update a component while rendering a different component".
  // State is the source of truth; the effect syncs it out.
  //
  // ⚠ AND THE FIRST WRITE IS DEFERRED PAST THE CORRIDOR MOUNT. The panel
  // sits alongside `LandingPage`, which mounts the corridor into a
  // nested React root via `createRoot`. If the panel writes the
  // config during THAT commit, our tunnel component's
  // `vw-flight-config` listener bumps its epoch, tears down and
  // rebuilds its point-cloud geometry, and React warns
  // "synchronously unmount a root while rendering". Deferring the
  // first application to the next macrotask lets the nested root
  // finish its own commit first.
  const firstWriteRef = useRef(true);
  useEffect(() => {
    const apply = () => {
      setVwFlightOverrides(state);
      writeUrl(state);
    };
    if (firstWriteRef.current) {
      firstWriteRef.current = false;
      const id = window.setTimeout(apply, 0);
      return () => window.clearTimeout(id);
    }
    apply();
  }, [state]);

  // On mount, auto-scroll into the voidwalker runway so the reader can
  // see what the levers do. One-shot; delayed so the corridor has time
  // to hydrate and #voidwalker's travel runway inflates to 14 svh.
  const scrolledRef = useRef(false);
  useEffect(() => {
    if (scrolledRef.current) return;
    const t = window.setTimeout(() => {
      const vw = document.getElementById("voidwalker");
      if (!vw) return;
      const y = window.scrollY + vw.getBoundingClientRect().top + window.innerHeight * 0.2;
      window.scrollTo({ top: Math.round(y), behavior: "instant" });
      scrolledRef.current = true;
    }, 1500);
    return () => window.clearTimeout(t);
  }, []);

  const update = useCallback((partial: Partial<LabState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const applyPreset = useCallback((name: string) => {
    const preset = PRESETS[name];
    if (!preset) return;
    setState({ ...(VW_FLIGHT_DEFAULT as LabState), ...preset });
  }, []);

  const reset = useCallback(() => {
    setState({ ...(VW_FLIGHT_DEFAULT as LabState) });
  }, []);

  // Unmount safety: hand production back its defaults.
  useEffect(() => () => resetVwFlightConfig(), []);

  const activeMemo = useMemo(() => getVwFlightConfig(), [state]);
  void activeMemo;

  const numericKeys = KEYS.filter((k) => k !== "pathVariant") as Array<
    Exclude<keyof LabState, "pathVariant">
  >;

  return (
    <div className={`vwfl${collapsed ? " vwfl--collapsed" : ""}`}>
      <button className="vwfl__toggle" onClick={() => setCollapsed((c) => !c)} type="button">
        {collapsed ? "▸ flight lab" : "▾ flight lab"}
      </button>
      {!collapsed && (
        <div className="vwfl__body">
          <div className="vwfl__row vwfl__row--presets">
            <span className="vwfl__label">presets</span>
            <div className="vwfl__presets">
              {Object.keys(PRESETS).map((name) => (
                <button key={name} onClick={() => applyPreset(name)} type="button">
                  {name}
                </button>
              ))}
              <button onClick={reset} type="button" className="vwfl__reset">
                ↺ reset
              </button>
            </div>
          </div>

          <div className="vwfl__row">
            <label className="vwfl__label" htmlFor="vwfl-path">
              pathVariant
            </label>
            <select
              id="vwfl-path"
              value={state.pathVariant}
              onChange={(e) => update({ pathVariant: e.target.value as VwPathVariant })}
            >
              {VARIANTS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {numericKeys.map((k) => {
            const dflt = VW_FLIGHT_DEFAULT[k];
            const changed = state[k] !== dflt;
            return (
              <div key={k} className={`vwfl__row${changed ? " vwfl__row--dirty" : ""}`}>
                <label className="vwfl__label" htmlFor={`vwfl-${k}`}>
                  {k}
                </label>
                <input
                  id={`vwfl-${k}`}
                  type="number"
                  step={NUMERIC_STEP[k]}
                  value={state[k]}
                  onChange={(e) => {
                    const n = Number.parseFloat(e.target.value);
                    if (Number.isFinite(n)) update({ [k]: n } as Partial<LabState>);
                  }}
                />
                <span className="vwfl__default">{dflt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
