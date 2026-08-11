"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ConsoleFrame } from "@/components/landing/home-v2/services/casefile/console/ConsoleFrame";
import {
  ConsoleRail,
  type ConsoleStation,
} from "@/components/landing/home-v2/services/casefile/console/ConsoleRail";
import {
  VIEW_BOX,
  ViewSubstrate,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaViews";
import {
  crossing,
  selectWorks,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import type { CaseMapDistrict, CaseMapShape, CaseMapWork } from "@/lib/cases/types";

import { useConfigFitReadout } from "../intelligence-config-lab/useFitReadout";
import { STRATA_VIEWBOX, VariantStrata } from "./VariantStrata";
import { TABLE_VIEWBOX, VariantTable } from "./VariantTable";
import { TREE_VIEWBOX, VariantTree } from "./VariantTree";
import {
  ISL_VARIANTS,
  type IslRecord,
  type IslVariantId,
  type IslVariantProps,
  islVariant,
} from "./variants";

/**
 * The substrate lab's shell — controls, the REAL console chrome, the readout.
 *
 * ⚠ THE HARNESS IS THE CONFIGURATION LAB'S, imported rather than copied: the
 * fit readout and the `.icl*` chrome are one measuring instrument shared by
 * both routes, and two copies of a measurement is how one lab starts passing
 * what the other would fail. Only the DRAWINGS and the record slice are new.
 *
 * Every variant renders inside the production `ConsoleFrame` + `ConsoleRail`
 * with the production plate classes, so the chamfered panel, the rail type,
 * the scanline and every `--pda-*` token — including the light-theme steps —
 * arrive untouched. The lab supplies only a definite-height housing and the
 * `data-proof-settled` arrival gate, forced on.
 */

const STATIONS: readonly ConsoleStation[] = [
  { id: "work", name: "WORK" },
  { id: "configuration", name: "CONFIGURATION" },
  { id: "substrate", name: "SUBSTRATE" },
];

/**
 * ⚠ ONE MAP, NOT TWO TERNARY CHAINS — the config lab's own lesson. A `Record`
 * keyed on the union makes the compiler the guard: add an id to
 * `IslVariantId` and this will not build until the drawing exists.
 *
 * `shipped` is absent on purpose: it is production's `ViewSubstrate` with its
 * own props, not an `IslVariantProps` drawing.
 */
const DRAWINGS: Record<
  Exclude<IslVariantId, "shipped">,
  { vb: string; Component: React.ComponentType<IslVariantProps> }
> = {
  strata: { vb: STRATA_VIEWBOX, Component: VariantStrata },
  table: { vb: TABLE_VIEWBOX, Component: VariantTable },
  tree: { vb: TREE_VIEWBOX, Component: VariantTree },
};

interface Preset {
  id: string;
  label: string;
  hw: number;
  hh: number;
  note: string;
}

/** ⚠ MEASURED housings, pinned from the production landing — the same three
 *  the configuration lab uses, so a drawing can be judged against reading 02
 *  in the same box. */
const PRESETS: readonly Preset[] = [
  { id: "p1280", label: "Console · 1280×720", hw: 613, hh: 541, note: "The binding case" },
  { id: "p1440", label: "Console · 1440×800", hw: 690, hh: 601, note: "Laptop" },
  {
    id: "p1920",
    label: "Console · 1920×1080",
    hw: 864,
    hh: 818,
    note: "Hides every defect this surface has ever had",
  },
];

interface Props {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
  envelope: "WITHIN" | "AT" | "OVER";
}

export function SubstrateLabShell({ shapes, districts, works, envelope }: Props) {
  const [variantId, setVariantId] = useState<IslVariantId>("shipped");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [lit, setLit] = useState<string | null>(null);

  const frameRef = useRef<HTMLDivElement>(null);

  /* ⚠ THE STREAM COUNTS COME FROM THE SELECTION, not from an empty array.
     `crossing(..., [])` reports every department as running ZERO streams —
     the configuration lab can pass `[]` because its drawing never asks, and
     this one letters the number on every department head. */
  const shown = useMemo(() => selectWorks(districts, works), [districts, works]);
  const cross = useMemo(
    () => crossing(shapes, districts, works, shown),
    [shapes, districts, works, shown]
  );
  const record: IslRecord = useMemo(() => ({ teams: cross.teams, shapes: cross.shapes }), [cross]);
  const def = islVariant(variantId);

  /* Deep-linked state adopted AFTER mount — SSR renders the defaults, and
     reading `location` in the initialiser would mismatch hydration. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v");
    if (v && ISL_VARIANTS.some((x) => x.id === v)) setVariantId(v as IslVariantId);
    if (q.get("theme") === "light") setTheme("light");
    const p = PRESETS.find((x) => x.id === q.get("preset"));
    if (p) setPreset(p);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const commit = (next: {
    variantId?: IslVariantId;
    theme?: "dark" | "light";
    preset?: Preset;
  }) => {
    if (next.variantId !== undefined) setVariantId(next.variantId);
    if (next.theme !== undefined) setTheme(next.theme);
    if (next.preset !== undefined) setPreset(next.preset);
    const url = new URL(window.location.href);
    url.searchParams.set("v", next.variantId ?? variantId);
    url.searchParams.set("theme", next.theme ?? theme);
    url.searchParams.set("preset", (next.preset ?? preset).id);
    window.history.replaceState(null, "", url.toString());
  };

  /* A REAL attribute write on `<html>` — what theme.css selects on. */
  useEffect(() => {
    const root = document.documentElement;
    const before = root.getAttribute("data-theme");
    root.setAttribute("data-theme", theme);
    return () => {
      if (before) root.setAttribute("data-theme", before);
      else root.removeAttribute("data-theme");
    };
  }, [theme]);

  const { report, remeasure } = useConfigFitReadout(frameRef, [variantId, theme, preset.id]);

  const drawing = variantId === "shipped" ? null : DRAWINGS[variantId];
  const vb = drawing ? drawing.vb : VIEW_BOX[3];
  const bad = report.clipped.length + report.collisions.length + report.smallControls.length;

  return (
    <div className="icl" data-variant={variantId}>
      <header className="icl__bar">
        <h1>Intelligence substrate · drawing lab</h1>

        <Group label="Direction">
          {ISL_VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              title={v.thesis}
              data-on={variantId === v.id ? "" : undefined}
              onClick={() => commit({ variantId: v.id })}
            >
              {v.label}
            </button>
          ))}
        </Group>

        <Group label="Console">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={`${p.note} — housing ${p.hw}×${p.hh}`}
              data-on={preset.id === p.id ? "" : undefined}
              onClick={() => commit({ preset: p })}
            >
              {p.label}
            </button>
          ))}
        </Group>

        <Group label="Theme">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              type="button"
              data-on={theme === t ? "" : undefined}
              onClick={() => commit({ theme: t })}
            >
              {t}
            </button>
          ))}
        </Group>

        <button className="icl__remeasure" type="button" onClick={remeasure}>
          Re-measure
        </button>
      </header>

      <div className="icl__body">
        <div
          className="icl-stage"
          style={
            {
              "--icl-w": `${preset.hw}px`,
              "--icl-h": `${preset.hh}px`,
            } as React.CSSProperties
          }
        >
          <div className="icl-arrival" data-proof-live="" data-proof-settled="" ref={frameRef}>
            <div className="icl-housing">
              <ConsoleFrame
                className="fl-plate fl-plate--pda fl-pda"
                data-view="3"
                data-envelope={envelope.toLowerCase()}
                rail={
                  <ConsoleRail
                    stations={STATIONS}
                    activeIdx={2}
                    onActive={() => {}}
                    label="Map readings (static in the lab)"
                  />
                }
              >
                <svg
                  className="fl-pda__svg"
                  viewBox={vb}
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label={`${def.label} — the substrate`}
                >
                  {drawing ? (
                    <drawing.Component record={record} />
                  ) : (
                    <ViewSubstrate
                      teams={cross.teams}
                      shapes={cross.shapes}
                      lit={lit}
                      onLit={setLit}
                      still
                    />
                  )}
                </svg>
              </ConsoleFrame>
            </div>
          </div>

          <div className="icl-thesis">
            <b>{def.label}</b>
            <p>{def.thesis}</p>
            <p className="icl-thesis__prov">{def.provenance}</p>
          </div>
        </div>

        <aside
          className="icl-read"
          data-bad={bad ? "" : undefined}
          data-collisions={report.collisions.length}
          data-clipped={report.clipped.length}
          data-minpx={report.minPx.toFixed(2)}
          data-texts={report.texts}
          data-overflow={Math.max(report.overflowX, report.overflowY)}
        >
          <h2>Fit</h2>
          <Row k="Field" v={`${report.canvas.w} × ${report.canvas.h} px`} />
          <Row
            k="Crop"
            v={`${report.view.w} × ${report.view.h} u @ ${report.scale.toFixed(3)} px/u`}
          />
          <Row k="Labels" v={`${report.texts}`} />
          <Row k="Rendered" v={`${report.minPx.toFixed(1)} – ${report.maxPx.toFixed(1)} px`} />
          <Row k="Scroll" v={`${report.overflowX} / ${report.overflowY}`} />

          <h2 data-bad={report.clipped.length ? "" : undefined}>
            {`Clipped · ${report.clipped.length}`}
          </h2>
          {report.clipped.length ? (
            <ul>
              {report.clipped.slice(0, 12).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : (
            <p>Nothing outside its crop.</p>
          )}

          <h2 data-bad={report.collisions.length ? "" : undefined}>
            {`Label on label · ${report.collisions.length}`}
          </h2>
          {report.collisions.length ? (
            <ul>
              {report.collisions.slice(0, 12).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : (
            <p>No two labels overlap.</p>
          )}

          <p className="icl__note">
            The baseline is production&rsquo;s reading 03 at its own crop; the three directions
            share one 932 × 762 crop, which is reading 02&rsquo;s width at the binding
            preset&rsquo;s aspect. Glyph boxes are compared in SVG user units via getBBox. The fit
            test walks the same declarations arithmetically.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="icl__group">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="icl__row">
      <span>{k}</span>
      <b>{v}</b>
    </div>
  );
}
