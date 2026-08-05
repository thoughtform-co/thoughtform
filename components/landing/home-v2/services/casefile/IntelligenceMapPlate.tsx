"use client";

import { useCallback, useRef, useState } from "react";

import type { CaseMapDistrict, CaseMapShape, CaseMapShapeKey, CaseMapWork } from "@/lib/cases/types";

import { MapHoverCard, type MapHover } from "./map/MapHoverCard";
import { MapSheetBoard } from "./map/MapSheetBoard";
import { MapSheetGrade } from "./map/MapSheetGrade";
import { MapSheetUnit } from "./map/MapSheetUnit";
import { SHEET_VIEWBOX, mapTotals, pad2, viewBoxOf } from "./map/mapProjection";
import { MAP_SHEETS, type MapSheet } from "./map/sheetTypes";

/**
 * THE WORK-TO-INTELLIGENCE MAP (ADR-062).
 *
 * A city in three sheets, all in one isometric: the board, one unit's
 * cutaway, and the services under the street. Buildings, a building's
 * cutaway, and the mains.
 *
 * THREE SHEETS, DIRECT ACCESS, ANY ORDER. Not a zoom ladder — a ladder
 * implies a lesson, and this is a record, not a walkthrough. The tabs are
 * the whole navigation; `1` `2` `3` select and `Escape` returns to the
 * board.
 *
 * KEYS ARE SCOPED TO THE PLATE, not `document`. This surface lives inside a
 * scroll-pinned corridor beat that has its own key handling, and a global
 * listener here would fight it. React's synthetic events bubble from the
 * focused descendant, so the binding works without a global hook and
 * without stealing digits from the rest of the page.
 *
 * POINTER OPT-IN. `.fl-imap` is the FIFTH `pointer-events: auto` opt-in on
 * the casefile host (`.claude/rules/proof.md`). It is safe on the same
 * argument as `.fl-skills`: the host is `visibility: hidden` until
 * `data-proof-live`, so nothing here can swallow a ring card's click before
 * the casefile is on screen. The opt-in stays scoped to the map — lifting
 * it to the host puts a full-bleed catcher over `.svc-ring-hits__hit`.
 */

interface Props {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
  envelope: "WITHIN" | "AT" | "OVER";
}

/** Hover-card box, used to flip it back inside the canvas at the edges. */
const CARD_W = 264;
const CARD_H = 190;

export function IntelligenceMapPlate({ shapes, districts, works, envelope }: Props) {
  const [sheet, setSheet] = useState<MapSheet>("board");
  const [selectedId, setSelectedId] = useState(works[0]?.id ?? "");
  const [litId, setLitId] = useState<string | null>(null);
  const [litMain, setLitMain] = useState<CaseMapShapeKey | null>(null);
  const [litDistrict, setLitDistrict] = useState<string | null>(null);
  const [hover, setHover] = useState<MapHover | null>(null);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const totals = mapTotals(shapes, districts, works);
  const selected = works.find((w) => w.id === selectedId) ?? works[0];

  /** Sheet changes reset every transient highlight — a lit riser surviving
   *  into the board would light a module that is not hovered. */
  const go = useCallback((next: MapSheet) => {
    setSheet(next);
    setLitId(null);
    setLitMain(null);
    setLitDistrict(null);
    setHover(null);
    setAt(null);
  }, []);

  const open = useCallback(
    (id: string) => {
      setSelectedId(id);
      go("unit");
    },
    [go]
  );

  const place = useCallback((e: React.MouseEvent) => {
    const box = canvasRef.current?.getBoundingClientRect();
    if (!box) return;
    let x = e.clientX - box.left + 15;
    let y = e.clientY - box.top + 13;
    if (x + CARD_W > box.width) x = e.clientX - box.left - CARD_W - 4;
    if (y + CARD_H > box.height) y = box.height - CARD_H - 6;
    setAt({ x: Math.max(6, x), y: Math.max(6, y) });
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    const next = key === "1" ? "board" : key === "2" ? "unit" : key === "3" ? "grade" : null;
    if (next) {
      e.preventDefault();
      go(next);
      return;
    }
    if (key === "Escape" && sheet !== "board") {
      e.preventDefault();
      go("board");
    }
  };

  const footLeft =
    sheet === "board"
      ? `${totals.modules} modules / ${pad2(totals.districts)} districts / one bus`
      : sheet === "unit"
        ? `${selected?.id} ${selected?.title} / ${selected?.lane ? `${selected.lane} lane` : "person-led"}`
        : `${pad2(totals.mains)} mains / ${totals.skills} skills / ${pad2(totals.districts)} districts / ${totals.reused} of ${totals.configured} reused`;

  const note = MAP_SHEETS.find((s) => s.id === sheet)?.note ?? "";

  return (
    <div
      className="fl-plate fl-plate--imap fl-imap"
      data-sheet={sheet}
      data-envelope={envelope.toLowerCase()}
      onKeyDown={onKeyDown}
    >
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
      </div>

      <div className="fl-imap__canvas" ref={canvasRef} onMouseMove={place}>
        {/* EACH SHEET CROPS TO WHAT IT DRAWS. The authoring space is 1160x700
            for all three, but the casefile console is 611px wide — fitting
            the whole space in put every label at 6.8px. See SHEET_VIEWBOX. */}
        <svg
          className="fl-imap__svg"
          viewBox={viewBoxOf(SHEET_VIEWBOX[sheet])}
          style={{ "--imap-type": SHEET_VIEWBOX[sheet].type } as React.CSSProperties}
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
              selectedId={selectedId}
              litId={litId}
              onLight={setLitId}
              onOpen={open}
              onHover={setHover}
            />
          ) : null}
          {sheet === "unit" && selected ? (
            <MapSheetUnit shapes={shapes} districts={districts} works={works} work={selected} />
          ) : null}
          {sheet === "grade" ? (
            <MapSheetGrade
              shapes={shapes}
              districts={districts}
              works={works}
              totals={totals}
              litMain={litMain}
              litDistrict={litDistrict}
              onLitMain={setLitMain}
              onLitDistrict={setLitDistrict}
              onHover={setHover}
            />
          ) : null}
        </svg>

        <MapHoverCard
          hover={hover}
          at={at}
          shapes={shapes}
          works={works}
          districts={districts}
        />

        {/* Every figure here is a dated public abstraction, and the surface
            says so rather than implying live telemetry. */}
        <p className="fl-imap__stamp">Normalised signal / illustrative record</p>
      </div>

      {/* MOBILE IS A DELIBERATE FALLBACK, not a squeezed drawing (ADR-062).
          Below ~980px the isometric is too dense to read, so the reading
          that never needed the projection carries the case on its own: the
          parts index as in-flow rows. It is a separate DOM tree because the
          index inside the SVG disappears with the canvas. */}
      <div className="fl-imap__list">
        <div className="fl-imap__list-head">
          <span>Index / modules by district</span>
          <span>{`${totals.modules} / ${pad2(totals.districts)}`}</span>
        </div>
        {districts.map((d) => {
          const rows = works.filter((w) => w.dist === d.id);
          return (
            <section className="fl-imap__list-group" key={d.id}>
              <h4>{d.name}</h4>
              {rows.map((w) => (
                <div
                  className="fl-imap__list-row"
                  key={w.id}
                  data-person={w.lane === null ? "" : undefined}
                >
                  <i aria-hidden="true">{w.lane === null ? "○" : "◆"}</i>
                  <span>{w.title}</span>
                  <em>{w.lane ?? "Person"}</em>
                </div>
              ))}
            </section>
          );
        })}
        <p className="fl-imap__list-foot">
          {`${totals.reused} of ${totals.configured} configured streams tapped a main that already existed. ${totals.skills} Skills across ${pad2(totals.mains)} shapes.`}
        </p>
      </div>

      <div className="fl-imap__foot">
        <span>{footLeft}</span>
        <b>Work is the unit / the configuration is the asset / the map is what transfers</b>
      </div>
    </div>
  );
}
