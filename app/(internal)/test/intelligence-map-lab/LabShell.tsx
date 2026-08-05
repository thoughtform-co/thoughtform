"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BoardSurface } from "@/components/landing/home-v2/services/casefile/map/board/BoardSurface";
import { type BoardSheet } from "@/components/landing/home-v2/services/casefile/map/board/boardProjection";
import { MapSurface } from "@/components/landing/home-v2/services/casefile/map/MapSurface";
import {
  type MapDetail,
  mapTotals,
} from "@/components/landing/home-v2/services/casefile/map/mapProjection";
import type { MapSheet } from "@/components/landing/home-v2/services/casefile/map/sheetTypes";
import type {
  CaseMapChain,
  CaseMapDistrict,
  CaseMapShape,
  CaseMapShapeKey,
  CaseMapWork,
} from "@/lib/cases/types";

import { useFitReadout } from "./useFitReadout";

/**
 * The lab shell — controls, the real casefile frame, and the fit readout.
 *
 * ⚠ THE FRAME IS THE REAL ANCESTOR CHAIN, not a copy of the rules. The map's
 * CSS is scoped under `.fl-case[data-proof-settled] … .fl-panel__viz …
 * .fl-plate--imap.fl-imap`, and the whole point of a lab is that the surface
 * under study is the one that ships. So the chain is replicated and only its
 * POSITIONING is overridden (production seats it against scroll-driven vars
 * that do not exist here); every colour, type size, gate and transition
 * arrives from `casefile.css` untouched.
 *
 * The presets are MEASURED boxes, not round numbers: the casefile's viz box
 * is 611×390 at 1280×720 and 688×444 at 1440×800, and the EXPAND overlay's
 * frame is 1218×658 at 1280×720. Authoring at anything else is how every
 * defect on this surface has shipped.
 */

type Variant = "board" | "city";

/**
 * ⚠ THE PRESET PINS THE CANVAS, NOT THE VIZ BOX.
 *
 * `MAP_REFERENCE_BOX` names the CANVAS — the box left after the tab strip and
 * the foot — and that is also the box `stampBox()` converts the provenance
 * stamp against. Pinning the viz box instead leaves the canvas at whatever
 * the chrome happens to take (measured here: 78px), so the drawing would be
 * measured against a console it never had. The viz box grows to fit.
 */
interface Preset {
  id: string;
  label: string;
  /** The canvas, in CSS pixels. */
  cw: number;
  ch: number;
  detail: MapDetail;
  note: string;
}

const PRESETS: readonly Preset[] = [
  {
    id: "p1280",
    label: "Panel · 1280×720",
    cw: 611,
    ch: 376,
    detail: "panel",
    note: "The binding case — MAP_REFERENCE_BOX.panel",
  },
  { id: "p1440", label: "Panel · 1440×800", cw: 688, ch: 423, detail: "panel", note: "Laptop" },
  {
    id: "p1920",
    label: "Panel · 1920×1080",
    cw: 917,
    ch: 564,
    detail: "panel",
    note: "Hides every defect this surface has ever had",
  },
  {
    id: "full",
    label: "Expanded · 1280×720",
    cw: 1216,
    ch: 584,
    detail: "full",
    note: "The EXPAND overlay — MAP_REFERENCE_BOX.full",
  },
];

const BOARD_IDS: readonly BoardSheet[] = ["place", "unit", "plane"];
const CITY_IDS: readonly MapSheet[] = ["board", "unit", "grade"];

interface Props {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
  chains: readonly CaseMapChain[];
  envelope: "WITHIN" | "AT" | "OVER";
}

export function LabShell({ shapes, districts, works, chains, envelope }: Props) {
  const [variant, setVariant] = useState<Variant>("board");
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sheetIdx, setSheetIdx] = useState(0);
  const [selectedId, setSelectedId] = useState(works[0]?.id ?? "");
  const [litId, setLitId] = useState<string | null>(null);
  const [litMain, setLitMain] = useState<CaseMapShapeKey | null>(null);
  const [litDistrict, setLitDistrict] = useState<string | null>(null);

  const frameRef = useRef<HTMLDivElement>(null);
  const totals = useMemo(() => mapTotals(shapes, districts, works), [shapes, districts, works]);
  const selected = works.find((w) => w.id === selectedId) ?? works[0];

  const { report, remeasure } = useFitReadout(frameRef, [
    variant,
    preset.id,
    theme,
    sheetIdx,
    selectedId,
  ]);

  /* The theme flip is a REAL attribute write on `<html>`, because that is what
     `theme.css` selects on and what the production toggle does. */
  useEffect(() => {
    const root = document.documentElement;
    const before = root.getAttribute("data-theme");
    root.setAttribute("data-theme", theme);
    return () => {
      if (before) root.setAttribute("data-theme", before);
      else root.removeAttribute("data-theme");
    };
  }, [theme]);

  const go = useCallback((idx: number) => {
    setSheetIdx(idx);
    setLitId(null);
    setLitMain(null);
    setLitDistrict(null);
  }, []);

  const open = useCallback(
    (id: string) => {
      setSelectedId(id);
      go(1);
    },
    [go]
  );

  const shared = {
    shapes,
    districts,
    works,
    totals,
    selectedId,
    selected,
    litId,
    litMain,
    litDistrict,
    onOpen: open,
    onLitId: setLitId,
    onLitMain: setLitMain,
    onLitDistrict: setLitDistrict,
    detail: preset.detail,
    action: {
      label: preset.detail === "full" ? "Close ✕" : "Expand ⤢",
      title: "Switch preset to change the detail level",
      onClick: () => setPreset(preset.detail === "full" ? PRESETS[0] : PRESETS[3]),
    },
  };

  const bad =
    report.clipped.length +
    report.underStamp.length +
    report.collisions.length +
    report.smallControls.length;

  return (
    <div className="imlab" data-variant={variant}>
      <header className="imlab__bar">
        <h1>Intelligence map · drawing lab</h1>

        <Group label="Archetype">
          {(["board", "city"] as const).map((v) => (
            <button
              key={v}
              type="button"
              data-on={variant === v ? "" : undefined}
              onClick={() => setVariant(v)}
            >
              {v === "board" ? "Board (orthographic)" : "City (ADR-062)"}
            </button>
          ))}
        </Group>

        <Group label="Console">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={`${p.note} — canvas ${p.cw}×${p.ch}`}
              data-on={preset.id === p.id ? "" : undefined}
              onClick={() => setPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </Group>

        <Group label="Sheet">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              data-on={sheetIdx === i ? "" : undefined}
              onClick={() => go(i)}
            >
              {`0${i + 1}`}
            </button>
          ))}
        </Group>

        <Group label="Theme">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              type="button"
              data-on={theme === t ? "" : undefined}
              onClick={() => setTheme(t)}
            >
              {t}
            </button>
          ))}
        </Group>

        <Group label="Subject">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {works.map((w) => (
              <option key={w.id} value={w.id}>
                {`${w.id} ${w.title}${w.lane ? "" : " · person-led"}`}
              </option>
            ))}
          </select>
        </Group>

        <button className="imlab__remeasure" type="button" onClick={remeasure}>
          Re-measure
        </button>
      </header>

      <div className="imlab__body">
        {/* ── The real ancestor chain ──────────────────────────────────
            `data-proof-live` and `data-proof-settled` are DIFFERENT gates and
            both are forced on here: `live` owns visibility and `will-change`,
            `settled` owns the arrival opacity and anything expensive enough
            that it must not run on a moving element. */}
        <div
          className="imlab__stage fl-case"
          data-proof-live=""
          data-proof-settled=""
          style={{
            ["--imlab-w" as string]: `${preset.cw}px`,
            ["--imlab-h" as string]: `${preset.ch}px`,
          }}
        >
          <div className="imlab__panel fl-panel">
            <div className="imlab__viz fl-panel__viz" ref={frameRef}>
              <div
                className={`fl-plate fl-plate--imap fl-imap${preset.detail === "full" ? " fl-imap--full" : ""}`}
                data-sheet={variant === "board" ? BOARD_IDS[sheetIdx] : CITY_IDS[sheetIdx]}
                data-envelope={envelope.toLowerCase()}
              >
                {variant === "board" ? (
                  <BoardSurface
                    {...shared}
                    chains={chains}
                    sheet={BOARD_IDS[sheetIdx]}
                    onSheet={(s) => go(BOARD_IDS.indexOf(s))}
                  />
                ) : (
                  <MapSurface
                    {...shared}
                    sheet={CITY_IDS[sheetIdx]}
                    onSheet={(s) => go(CITY_IDS.indexOf(s))}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── The readout ─────────────────────────────────────────────
            Not decoration. A drawing whose fit can only be checked by
            looking at it is a drawing nobody checks. */}
        <aside className="imlab__read" data-bad={bad ? "" : undefined}>
          <h2>Fit</h2>
          <Row k="Canvas" v={`${report.canvas.w} × ${report.canvas.h} px`} />
          <Row
            k="Crop"
            v={`${report.view.w} × ${report.view.h} u @ ${report.scale.toFixed(3)} px/u`}
          />
          <Row
            k="Type"
            v={`${report.typeUnits} u → ${(report.typeUnits * report.scale).toFixed(1)} px`}
          />
          <Row k="Chars across" v={`${report.charsAcross}`} />
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

          <h2 data-bad={report.underStamp.length ? "" : undefined}>
            {`Under the stamp · ${report.underStamp.length}`}
          </h2>
          {report.underStamp.length ? (
            <ul>
              {report.underStamp.slice(0, 12).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : (
            <p>Nothing printed through the provenance line.</p>
          )}

          {/* ⚠ THE CHECK NOTHING ELSE MAKES. The city's smoke asserts crop
              containment and stamp clearance — both of which it passes —
              while its plaques letter through each other, which is the
              complaint that started this. */}
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

          <p className="imlab__note">
            Glyph boxes are compared in SVG user units via getBBox. box.width / viewBox.width
            over-reports whenever the crop and the console disagree on aspect.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="imlab__group">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="imlab__row">
      <span>{k}</span>
      <b>{v}</b>
    </div>
  );
}
