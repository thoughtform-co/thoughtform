"use client";

import { useCallback, useRef, useState } from "react";

import type { CaseMapChain, CaseMapShapeKey, CaseMapWork } from "@/lib/cases/types";

import { MapHoverCard, type MapHover } from "../MapHoverCard";
import { type MapDetail, type MapTotals, pad2, viewBoxOf } from "../mapProjection";
import type { SheetData } from "../sheetTypes";
import { BoardElevation } from "./BoardElevation";
import { BoardPlacement } from "./BoardPlacement";
import { BoardPlane } from "./BoardPlane";
import { BOARD_SHEETS, type BoardSheet, boardView } from "./boardProjection";

/**
 * THE BOARD ARCHETYPE'S SHELL — the constant chrome the three sheets sit in.
 *
 * ONE DRAWING, TWO READINGS, exactly as `MapSurface` documents: the panel and
 * the EXPAND overlay render THIS component at different `detail` levels, and
 * they are deliberately not two components, because the moment they have
 * separate markup the panel's suppression stops being a decision and becomes
 * a drift.
 *
 * ── Why the chrome is what unifies, not the projection ────────────────────
 * ADR-062 collapsed three sheets into ONE isometric because a plan/section/
 * services set "broke projection consistency". That objection assumes the
 * projection is the only thing that can make three drawings read as one hand.
 * It is not. A constant bezel, one type ladder, one mark vocabulary and one
 * colour law do the same job — and they cost nothing in drawing space, which
 * matters when the console is 611px wide and the isometric was spending its
 * width on depth.
 *
 * So the tab strip, the stamp, the foot, the crop and the type size are the
 * SAME on all three sheets here, and the sheets are free to be genuinely
 * different diagram types. The prop contract mirrors `MapSurface`'s exactly,
 * so the two archetypes are swappable in the lab.
 */

interface Props extends SheetData {
  chains: readonly CaseMapChain[];
  detail: MapDetail;
  totals: MapTotals;
  sheet: BoardSheet;
  selectedId: string;
  selected: CaseMapWork | undefined;
  litId: string | null;
  litMain: CaseMapShapeKey | null;
  litDistrict: string | null;
  onSheet: (sheet: BoardSheet) => void;
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

export function BoardSurface({
  shapes,
  districts,
  works,
  chains,
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
    (next: BoardSheet) => {
      setHover(null);
      setAt(null);
      onSheet(next);
    },
    [onSheet]
  );

  const view = boardView(detail);
  const note = BOARD_SHEETS.find((s) => s.id === sheet)?.note ?? "";

  const footLeft =
    sheet === "place"
      ? `${totals.modules} modules / ${pad2(totals.districts)} departments / ${pad2(chains.length)} chains`
      : sheet === "unit"
        ? `${selected?.id} ${selected?.title} / ${selected?.lane ? `${selected.lane} lane` : "person-led"}`
        : `${pad2(totals.mains)} shapes / ${totals.skills} skills / ${totals.reused} of ${totals.configured} reused`;

  return (
    <>
      <div className="fl-imap__tabs" role="tablist" aria-label="Map sheets">
        {BOARD_SHEETS.map((s) => (
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
        {/* ONE CROP AND ONE TYPE SIZE ACROSS ALL THREE SHEETS. The city gave
            each sheet its own crop and its own type in authoring units, tuned
            so the three landed at the same rendered size; here there is only
            one number, so the sheets cannot drift apart. */}
        <svg
          className="fl-imap__svg"
          viewBox={viewBoxOf(view)}
          style={{ "--imap-type": view.type } as React.CSSProperties}
          preserveAspectRatio="xMidYMid meet"
          role="group"
          aria-label={`Work-to-intelligence map, sheet ${sheet}`}
        >
          {sheet === "place" ? (
            <BoardPlacement
              shapes={shapes}
              districts={districts}
              works={works}
              chains={chains}
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
            <BoardElevation districts={districts} work={selected} detail={detail} />
          ) : null}
          {sheet === "plane" ? (
            <BoardPlane
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
