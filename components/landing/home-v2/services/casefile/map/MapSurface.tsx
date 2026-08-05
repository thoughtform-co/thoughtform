"use client";

import { useCallback, useRef, useState } from "react";

import type { CaseMapShapeKey, CaseMapWork } from "@/lib/cases/types";

import { MapHoverCard, type MapHover } from "./MapHoverCard";
import { MapSheetBoard } from "./MapSheetBoard";
import { MapSheetGrade } from "./MapSheetGrade";
import { MapSheetUnit } from "./MapSheetUnit";
import { type MapDetail, type MapTotals, pad2, sheetView, viewBoxOf } from "./mapProjection";
import { MAP_SHEETS, type MapSheet, type SheetData } from "./sheetTypes";

/**
 * ONE DRAWING, TWO READINGS (ADR-062 Outstanding 1).
 *
 * The casefile panel and the EXPAND overlay render THIS component at
 * different `detail` levels. They are deliberately not two components: the
 * expanded view exists because the panel had to suppress annotation, and
 * the moment the two surfaces have separate markup the suppression stops
 * being a decision and becomes a drift.
 *
 * Hover state is LOCAL. The card is placed against the canvas box it lives
 * in, so a shared `at` would put the overlay's card at the panel's
 * coordinates. Sheet and selection stay upstairs, because expanding must
 * land on the sheet you were reading.
 */

interface Props extends SheetData {
  detail: MapDetail;
  totals: MapTotals;
  sheet: MapSheet;
  selectedId: string;
  selected: CaseMapWork | undefined;
  litId: string | null;
  litMain: CaseMapShapeKey | null;
  litDistrict: string | null;
  onSheet: (sheet: MapSheet) => void;
  onOpen: (id: string) => void;
  onLitId: (id: string | null) => void;
  onLitMain: (key: CaseMapShapeKey | null) => void;
  onLitDistrict: (id: string | null) => void;
  /** The tab strip's tail control: EXPAND on the panel, CLOSE on the overlay. */
  action: { label: string; title: string; onClick: () => void };
  actionRef?: React.Ref<HTMLButtonElement>;
}

/** Hover-card box, used to flip it back inside the canvas at the edges. */
const CARD_W = 264;
const CARD_H = 190;

export function MapSurface({
  shapes,
  districts,
  works,
  detail,
  totals,
  sheet,
  selectedId,
  selected,
  litId,
  litMain,
  litDistrict,
  onSheet,
  onOpen,
  onLitId,
  onLitMain,
  onLitDistrict,
  action,
  actionRef,
}: Props) {
  const [hover, setHover] = useState<MapHover | null>(null);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const place = useCallback((e: React.MouseEvent) => {
    const box = canvasRef.current?.getBoundingClientRect();
    if (!box) return;
    let x = e.clientX - box.left + 15;
    let y = e.clientY - box.top + 13;
    if (x + CARD_W > box.width) x = e.clientX - box.left - CARD_W - 4;
    if (y + CARD_H > box.height) y = box.height - CARD_H - 6;
    setAt({ x: Math.max(6, x), y: Math.max(6, y) });
  }, []);

  const go = useCallback(
    (next: MapSheet) => {
      setHover(null);
      setAt(null);
      onSheet(next);
    },
    [onSheet]
  );

  const view = sheetView(sheet, detail);
  const note = MAP_SHEETS.find((s) => s.id === sheet)?.note ?? "";

  const footLeft =
    sheet === "board"
      ? `${totals.modules} modules / ${pad2(totals.districts)} districts / one bus`
      : sheet === "unit"
        ? `${selected?.id} ${selected?.title} / ${selected?.lane ? `${selected.lane} lane` : "person-led"}`
        : `${pad2(totals.mains)} mains / ${totals.skills} skills / ${pad2(totals.districts)} districts / ${totals.reused} of ${totals.configured} reused`;

  return (
    <>
      <div className="fl-imap__tabs" role="tablist" aria-label="Map sheets">
        {MAP_SHEETS.map((s) => (
          <button
            className="fl-imap__tab"
            key={s.id}
            type="button"
            role="tab"
            aria-selected={sheet === s.id}
            data-on={sheet === s.id ? "" : undefined}
            onClick={() => go(s.id)}
          >
            <u>{`${s.ord} ${s.name}`}</u>
            <s>{s.sub}</s>
          </button>
        ))}
        <span className="fl-imap__tabs-note">{note}</span>
        <button
          className="fl-imap__action"
          type="button"
          ref={actionRef}
          title={action.title}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      </div>

      <div className="fl-imap__canvas" ref={canvasRef} onMouseMove={place}>
        {/* EACH SHEET CROPS TO WHAT IT DRAWS. The authoring space is 1160x700
            for all three, but the casefile console is 611px wide — fitting
            the whole space in put every label at 6.8px. See SHEET_VIEWBOX. */}
        <svg
          className="fl-imap__svg"
          viewBox={viewBoxOf(view)}
          style={{ "--imap-type": view.type } as React.CSSProperties}
          preserveAspectRatio="xMidYMid meet"
          role="group"
          aria-label={`Work-to-intelligence map, sheet ${sheet}`}
        >
          {sheet === "board" ? (
            <MapSheetBoard
              shapes={shapes}
              districts={districts}
              works={works}
              totals={totals}
              detail={detail}
              selectedId={selectedId}
              litId={litId}
              onLight={onLitId}
              onOpen={onOpen}
              onHover={setHover}
            />
          ) : null}
          {sheet === "unit" && selected ? (
            <MapSheetUnit
              shapes={shapes}
              districts={districts}
              works={works}
              work={selected}
              detail={detail}
            />
          ) : null}
          {sheet === "grade" ? (
            <MapSheetGrade
              shapes={shapes}
              districts={districts}
              works={works}
              totals={totals}
              detail={detail}
              litMain={litMain}
              litDistrict={litDistrict}
              onLitMain={onLitMain}
              onLitDistrict={onLitDistrict}
              onHover={setHover}
            />
          ) : null}
        </svg>

        <MapHoverCard hover={hover} at={at} shapes={shapes} works={works} districts={districts} />

        {/* Every figure here is a dated public abstraction, and the surface
            says so rather than implying live telemetry. */}
        <p className="fl-imap__stamp">Normalised signal / illustrative record</p>
      </div>

      <div className="fl-imap__foot">
        <span>{footLeft}</span>
        <b>Work is the unit / the configuration is the asset / the map is what transfers</b>
      </div>
    </>
  );
}
