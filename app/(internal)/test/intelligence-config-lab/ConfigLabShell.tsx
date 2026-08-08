"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  ConsoleRail,
  type ConsoleStation,
} from "@/components/landing/home-v2/services/casefile/console/ConsoleRail";
import { ConsoleFrame } from "@/components/landing/home-v2/services/casefile/console/ConsoleFrame";
import {
  VIEW_BOX,
  ViewConfiguration,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaViews";
import { toPdaWork } from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import type {
  CaseMapChain,
  CaseMapDistrict,
  CaseMapShape,
  CaseMapWork,
  CaseSkillEntry,
} from "@/lib/cases/types";

import { useConfigFitReadout } from "./useFitReadout";
import { DIE_VIEWBOX, VariantDie } from "./VariantDie";
import { CHAIN_VIEWBOX, VariantChain } from "./VariantChain";
import { SECTION_VIEWBOX, VariantSection } from "./VariantSection";
import { SCHEMATIC_VIEWBOX, VariantSchematic } from "./VariantSchematic";
import { ICL_VARIANTS, type IclRecord, type IclVariantId, iclVariant } from "./variants";

/**
 * The lab shell — controls, the REAL console chrome, and the fit readout.
 *
 * ⚠ THE FRAME IS THE REAL ANCESTOR CHAIN, not a copy of the rules. Every
 * variant renders inside `ConsoleFrame` + `ConsoleRail` with the production
 * plate classes (`fl-plate fl-plate--pda fl-pda`), so the chamfered panel,
 * the rail type, the scanline and every `--pda-*` token — including the
 * light-theme steps — arrive from `console.css` / `pda.css` / `theme.css`
 * untouched. The lab supplies only a DEFINITE-HEIGHT housing (console.css's
 * one requirement) and the `data-proof-settled` arrival gate, forced on.
 *
 * The rail is mounted for CHROME HONESTY — the field box the drawings are
 * judged in must include the rail's cut — but it is static here: the lab's
 * variant switcher is the control, not the rail.
 */

const STATIONS: readonly ConsoleStation[] = [
  { id: "work", name: "WORK" },
  { id: "configuration", name: "CONFIGURATION" },
  { id: "substrate", name: "SUBSTRATE" },
];

interface Preset {
  id: string;
  label: string;
  /** The housing (the `.fl-con` box), in CSS pixels. */
  hw: number;
  hh: number;
  note: string;
}

/**
 * ⚠ MEASURED boxes, not round numbers — pinned from the production landing
 * with `node scripts/capture-config-lab.mjs --measure` (2026-08-08: the
 * `.fl-con` housing measured 613×541 / 690×601 / 864×818, fields 603×493 /
 * 679×548 / 850×760). Re-pin whenever the console's chrome changes.
 */
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

/** The archetypal subjects — one per corner of the record. */
const QUICK: readonly { id: string; note: string }[] = [
  { id: "W-017", note: "Everyday · high volume · in the campaign chain" },
  { id: "W-004", note: "Deep · narrow · draw 5" },
  { id: "W-026", note: "Frontier — the one" },
  { id: "W-040", note: "Person-led — the negative space" },
  { id: "W-063", note: "Person-led AND mid-chain" },
];

interface Props {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
  chains: readonly CaseMapChain[];
  skills: readonly CaseSkillEntry[];
  envelope: "WITHIN" | "AT" | "OVER";
}

export function ConfigLabShell({ shapes, districts, works, chains, skills, envelope }: Props) {
  const [variantId, setVariantId] = useState<IclVariantId>("die");
  const [workId, setWorkId] = useState("W-017");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  /** The shipped variant's hover state (its readout swaps on lit). */
  const [lit, setLit] = useState<string | null>(null);

  const frameRef = useRef<HTMLDivElement>(null);

  const record: IclRecord = useMemo(
    () => ({ shapes, districts, works, chains, skills }),
    [shapes, districts, works, chains, skills]
  );
  const work = works.find((w) => w.id === workId) ?? works[0];
  const pda = useMemo(
    () =>
      toPdaWork(
        work,
        districts.find((d) => d.id === work.dist)
      ),
    [work, districts]
  );
  const def = iclVariant(variantId);

  // Adopt deep-linked state AFTER mount (SSR renders the defaults; reading
  // location in the initialiser would mismatch hydration). The URL is the
  // external system, read exactly once per mount — the field-log-lab pattern.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v");
    if (v && ICL_VARIANTS.some((x) => x.id === v)) setVariantId(v as IclVariantId);
    const w = q.get("work");
    if (w && works.some((x) => x.id === w)) setWorkId(w);
    if (q.get("theme") === "light") setTheme("light");
    const p = PRESETS.find((x) => x.id === q.get("preset"));
    if (p) setPreset(p);
  }, [works]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const commit = (next: {
    variantId?: IclVariantId;
    workId?: string;
    theme?: "dark" | "light";
    preset?: Preset;
  }) => {
    if (next.variantId !== undefined) setVariantId(next.variantId);
    if (next.workId !== undefined) setWorkId(next.workId);
    if (next.theme !== undefined) setTheme(next.theme);
    if (next.preset !== undefined) setPreset(next.preset);
    const url = new URL(window.location.href);
    url.searchParams.set("v", next.variantId ?? variantId);
    url.searchParams.set("work", next.workId ?? workId);
    url.searchParams.set("theme", next.theme ?? theme);
    url.searchParams.set("preset", (next.preset ?? preset).id);
    window.history.replaceState(null, "", url.toString());
  };

  /* The theme flip is a REAL attribute write on `<html>` — what theme.css
     selects on and what the production toggle does. */
  useEffect(() => {
    const root = document.documentElement;
    const before = root.getAttribute("data-theme");
    root.setAttribute("data-theme", theme);
    return () => {
      if (before) root.setAttribute("data-theme", before);
      else root.removeAttribute("data-theme");
    };
  }, [theme]);

  const { report, remeasure } = useConfigFitReadout(frameRef, [
    variantId,
    workId,
    theme,
    preset.id,
  ]);

  const vb =
    variantId === "shipped"
      ? VIEW_BOX[2]
      : variantId === "die"
        ? DIE_VIEWBOX
        : variantId === "chain"
          ? CHAIN_VIEWBOX
          : variantId === "section"
            ? SECTION_VIEWBOX
            : SCHEMATIC_VIEWBOX;

  const bad = report.clipped.length + report.collisions.length + report.smallControls.length;

  return (
    <div className="icl" data-variant={variantId}>
      <header className="icl__bar">
        <h1>Intelligence configuration · drawing lab</h1>

        <Group label="Archetype">
          {ICL_VARIANTS.map((v) => (
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

        <Group label="Subject">
          {QUICK.map((q) => (
            <button
              key={q.id}
              type="button"
              title={q.note}
              data-on={workId === q.id ? "" : undefined}
              onClick={() => commit({ workId: q.id })}
            >
              {q.id}
            </button>
          ))}
          <select value={workId} onChange={(e) => commit({ workId: e.target.value })}>
            {works.map((w) => (
              <option key={w.id} value={w.id}>
                {`${w.id} ${w.title}${w.lane ? "" : " · person-led"}`}
              </option>
            ))}
          </select>
        </Group>

        <button className="icl__remeasure" type="button" onClick={remeasure}>
          Re-measure
        </button>
      </header>

      <div className="icl__body">
        <div className="icl-stage">
          {/* The real ancestor chain: both proof gates forced on, then a
              definite-height housing — console.css's one requirement. */}
          <div
            className="icl-arrival"
            data-proof-live=""
            data-proof-settled=""
            ref={frameRef}
            style={
              {
                "--icl-w": `${preset.hw}px`,
                "--icl-h": `${preset.hh}px`,
              } as React.CSSProperties
            }
          >
            <div className="icl-housing">
              <ConsoleFrame
                className="fl-plate fl-plate--pda fl-pda"
                data-view="2"
                data-envelope={envelope.toLowerCase()}
                rail={
                  <ConsoleRail
                    stations={STATIONS}
                    activeIdx={1}
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
                  aria-label={`${def.label} — ${pda.title} configuration study`}
                >
                  {variantId === "shipped" ? (
                    <ViewConfiguration
                      work={pda}
                      lit={lit}
                      onLit={setLit}
                      still
                      entry={{ kind: "raster" }}
                    />
                  ) : variantId === "die" ? (
                    <VariantDie pda={pda} work={work} record={record} />
                  ) : variantId === "chain" ? (
                    <VariantChain pda={pda} work={work} record={record} />
                  ) : variantId === "section" ? (
                    <VariantSection pda={pda} work={work} record={record} />
                  ) : (
                    <VariantSchematic pda={pda} work={work} record={record} />
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

        {/* The readout — not decoration. A drawing whose fit can only be
            checked by looking at it is a drawing nobody checks. The data-*
            mirror is the capture script's machine interface. */}
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

          {report.smallControls.length ? (
            <>
              <h2 data-bad="">Controls under 10px</h2>
              <ul>
                {report.smallControls.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </>
          ) : null}

          <p className="icl__note">
            Glyph boxes are compared in SVG user units via getBBox; the scale is the minimum of the
            two box ratios (xMidYMid meet). The fit test walks the same strings arithmetically for
            all 27 works.
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
