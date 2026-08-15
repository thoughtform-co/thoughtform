"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ConsoleFrame } from "@/components/landing/home-v2/services/casefile/console/ConsoleFrame";
import {
  ConsoleRail,
  type ConsoleStation,
} from "@/components/landing/home-v2/services/casefile/console/ConsoleRail";
import {
  SUBSTRATE_LAYOUT_0,
  ViewSubstrate,
  substrateExt,
  substrateLayout,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaSubstrate";
import {
  crossing,
  selectWorks,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import type { CaseMapDistrict, CaseMapShape, CaseMapWork, CaseSkillEntry } from "@/lib/cases/types";

import { useConfigFitReadout } from "../intelligence-config-lab/useFitReadout";
import { BACKPLANE_VIEWBOX, VariantBackplane } from "./VariantBackplane";
import { BUS_VIEWBOX, VariantBus } from "./VariantBus";
import { CARDS_VIEWBOX, VariantCards } from "./VariantCards";
import { CELLS_VIEWBOX, VariantCells } from "./VariantCells";
import { CONSTELLATION_VIEWBOX, VariantConstellation } from "./VariantConstellation";
import { CUTAWAY_VIEWBOX, VariantCutaway } from "./VariantCutaway";
import { DENSITY_VIEWBOX, VariantDensity } from "./VariantDensity";
import { FIELD_VIEWBOX, VariantField } from "./VariantField";
import { FACET_VIEWBOX, VariantFacet } from "./VariantFacet";
import { FLASKS_VIEWBOX, VariantFlasks } from "./VariantFlasks";
import { GALLERY_VIEWBOX, VariantGallery } from "./VariantGallery";
import { GATE_VIEWBOX, VariantGate } from "./VariantGate";
import { GRADE_VIEWBOX, VariantGrade } from "./VariantGrade";
import { HAND_VIEWBOX, VariantHand } from "./VariantHand";
import { LEAVES_VIEWBOX, VariantLeaves } from "./VariantLeaves";
import { LOOM_VIEWBOX, VariantLoom } from "./VariantLoom";
import { MOSAIC_VIEWBOX, VariantMosaic } from "./VariantMosaic";
import { PILES_VIEWBOX, VariantPiles } from "./VariantPiles";
import { PINBANK_VIEWBOX, VariantPinbank } from "./VariantPinbank";
import { RACK_VIEWBOX, VariantRack } from "./VariantRack";
import { REGISTRY_VIEWBOX, VariantRegistry } from "./VariantRegistry";
import { ROOTS_VIEWBOX, VariantRoots } from "./VariantRoots";
import { RUNS_VIEWBOX, VariantRuns } from "./VariantRuns";
import { SEALS_VIEWBOX, VariantSeals } from "./VariantSeals";
import { STACK_VIEWBOX, VariantStack } from "./VariantStack";
import { STRATA_VIEWBOX, VariantStrata } from "./VariantStrata";
import { TABLE_VIEWBOX, VariantTable } from "./VariantTable";
import { TANKS_VIEWBOX, VariantTanks } from "./VariantTanks";
import { TERMINAL_VIEWBOX, VariantTerminal } from "./VariantTerminal";
import { TREE_VIEWBOX, VariantTree } from "./VariantTree";
import { VATS_VIEWBOX, VariantVats } from "./VariantVats";
import { WHEEL_VIEWBOX, VariantWheel } from "./VariantWheel";
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
  seals: { vb: SEALS_VIEWBOX, Component: VariantSeals },
  density: { vb: DENSITY_VIEWBOX, Component: VariantDensity },
  field: { vb: FIELD_VIEWBOX, Component: VariantField },
  rack: { vb: RACK_VIEWBOX, Component: VariantRack },
  gallery: { vb: GALLERY_VIEWBOX, Component: VariantGallery },
  registry: { vb: REGISTRY_VIEWBOX, Component: VariantRegistry },
  terminal: { vb: TERMINAL_VIEWBOX, Component: VariantTerminal },
  cards: { vb: CARDS_VIEWBOX, Component: VariantCards },
  backplane: { vb: BACKPLANE_VIEWBOX, Component: VariantBackplane },
  bus: { vb: BUS_VIEWBOX, Component: VariantBus },
  cutaway: { vb: CUTAWAY_VIEWBOX, Component: VariantCutaway },
  hand: { vb: HAND_VIEWBOX, Component: VariantHand },
  piles: { vb: PILES_VIEWBOX, Component: VariantPiles },
  constellation: { vb: CONSTELLATION_VIEWBOX, Component: VariantConstellation },
  loom: { vb: LOOM_VIEWBOX, Component: VariantLoom },
  leaves: { vb: LEAVES_VIEWBOX, Component: VariantLeaves },
  roots: { vb: ROOTS_VIEWBOX, Component: VariantRoots },
  wheel: { vb: WHEEL_VIEWBOX, Component: VariantWheel },
  mosaic: { vb: MOSAIC_VIEWBOX, Component: VariantMosaic },
  gate: { vb: GATE_VIEWBOX, Component: VariantGate },
  runs: { vb: RUNS_VIEWBOX, Component: VariantRuns },
  grade: { vb: GRADE_VIEWBOX, Component: VariantGrade },
  facet: { vb: FACET_VIEWBOX, Component: VariantFacet },
  tanks: { vb: TANKS_VIEWBOX, Component: VariantTanks },
  pinbank: { vb: PINBANK_VIEWBOX, Component: VariantPinbank },
  stack: { vb: STACK_VIEWBOX, Component: VariantStack },
  flasks: { vb: FLASKS_VIEWBOX, Component: VariantFlasks },
  cells: { vb: CELLS_VIEWBOX, Component: VariantCells },
  vats: { vb: VATS_VIEWBOX, Component: VariantVats },
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
  /** The shipped baseline letters one plate per named Skill now. */
  skills: readonly CaseSkillEntry[];
  envelope: "WITHIN" | "AT" | "OVER";
}

export function SubstrateLabShell({ shapes, districts, works, skills, envelope }: Props) {
  const [variantId, setVariantId] = useState<IslVariantId>("shipped");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [lit, setLit] = useState<string | null>(null);
  /**
   * The round-four directions (backplane/bus/cutaway) letter the SELECTED
   * work as the drawing's centre of gravity. The other directions ignore
   * this field; the shell always populates it from the reader's pick so a
   * drawing does not have to guard for its absence.
   *
   * ⚠ The default is `shown[0]`, which is the first configured stream
   * (`selectWorks` puts person-led work first within each district and then
   * interleaves districts). That gives the drawings a lit, tapped example
   * on first paint, which is what the site would open the reading on.
   */
  const [workId, setWorkId] = useState<string | null>(null);

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
  const selectedWork = useMemo(() => {
    if (!workId) return shown[0];
    return shown.find((w) => w.id === workId) ?? shown[0];
  }, [shown, workId]);
  const record: IslRecord = useMemo(
    () => ({ teams: cross.teams, shapes: cross.shapes, skills, selectedWork }),
    [cross, skills, selectedWork]
  );
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
    const w = q.get("work");
    if (w && shown.some((x) => x.id === w)) setWorkId(w);
  }, [shown]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const commit = (next: {
    variantId?: IslVariantId;
    theme?: "dark" | "light";
    preset?: Preset;
    workId?: string | null;
  }) => {
    if (next.variantId !== undefined) setVariantId(next.variantId);
    if (next.theme !== undefined) setTheme(next.theme);
    if (next.preset !== undefined) setPreset(next.preset);
    if (next.workId !== undefined) setWorkId(next.workId);
    const url = new URL(window.location.href);
    url.searchParams.set("v", next.variantId ?? variantId);
    url.searchParams.set("theme", next.theme ?? theme);
    url.searchParams.set("preset", (next.preset ?? preset).id);
    const nextWork = next.workId !== undefined ? next.workId : workId;
    if (nextWork) url.searchParams.set("work", nextWork);
    else url.searchParams.delete("work");
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

  /* ⚠ WHAT THE READOUT MEASURED, PUBLISHED BESIDE THE NUMBERS. The capture
     script waits on this rather than on `data-minpx > 0`, which the DEFAULT
     variant's measurement satisfies just as well — see `useFitReadout`. */
  const stamp = `${variantId}|${theme}|${preset.id}`;
  const { report, measuredStamp, remeasure } = useConfigFitReadout(
    frameRef,
    [variantId, theme, preset.id],
    stamp
  );

  /**
   * ⚠ THE BASELINE MOUNTS ELASTIC, EXACTLY AS PRODUCTION DOES.
   *
   * It used to mount at `SUBSTRATE_LAYOUT_0` on the argument that the lab's
   * housing is a fixed preset and the elastic treatment answers a field that
   * moves. That argument is wrong: a fixed preset is a field of a KNOWN
   * shape, not an absent one, and production computes its layout from
   * whatever shape the field happens to be. At p1280 the rest crop is
   * 932 × 482 against a 602 × 493 field, so the cards rendered 311px tall in
   * a 493px panel — 182px of dead bottom, and a preview of a drawing the
   * site never serves.
   */
  const liveLayout = useMemo(
    () =>
      report.canvas.w > 0 && report.canvas.h > 0
        ? substrateLayout(substrateExt(report.canvas.h / report.canvas.w))
        : SUBSTRATE_LAYOUT_0,
    [report.canvas.w, report.canvas.h]
  );

  /* Measure → layout → measure. It converges in two passes and cannot loop:
     `canvas` is the console field, which CSS sizes from the preset, so a
     `viewBox` change can no more move it here than it can in production. */
  useEffect(() => {
    remeasure();
  }, [liveLayout.crop, remeasure]);

  const drawing = variantId === "shipped" ? null : DRAWINGS[variantId];
  const vb = drawing ? drawing.vb : liveLayout.crop;
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

        {/* WORK PICKER — the round-four directions letter the SELECTED work
            as their drawing's subject. Other directions ignore it, so the
            control appears in every state; changing it under `shipped` is a
            no-op by design (the shipped drawing draws the estate). */}
        <div className="icl__group">
          <span>Selected work</span>
          <div>
            <select
              value={selectedWork?.id ?? ""}
              onChange={(e) => commit({ workId: e.currentTarget.value || null })}
            >
              {shown.map((w) => (
                <option key={w.id} value={w.id}>
                  {`${w.id} · ${w.title}`}
                </option>
              ))}
            </select>
          </div>
        </div>

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
                      shapes={cross.shapes}
                      skills={skills}
                      lit={lit}
                      onLit={setLit}
                      still
                      layout={liveLayout}
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
          data-stamp={measuredStamp}
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
