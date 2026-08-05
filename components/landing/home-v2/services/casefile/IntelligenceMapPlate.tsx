"use client";

import { useCallback, useRef, useState } from "react";

import type {
  CaseMapDistrict,
  CaseMapShape,
  CaseMapShapeKey,
  CaseMapWork,
} from "@/lib/cases/types";

import { restoreFocusAfterUnmount, useCloseOnCasefileFold } from "./MediaLightbox";
import { MapExpanded } from "./map/MapExpanded";
import { MapSurface } from "./map/MapSurface";
import { mapTotals, pad2 } from "./map/mapProjection";
import type { MapSheet } from "./map/sheetTypes";

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
 * TWO DETAIL LEVELS, ONE STATE. The casefile console is 611x390 and the
 * sheets carry more annotation than that holds at legible type, so the
 * panel draws a reduced reading and EXPAND opens the authored one — same
 * sheet, same selection, same component (`MapSurface`). What the panel
 * suppresses is recorded at each site rather than being quietly absent.
 *
 * KEYS ARE SCOPED TO THE PLATE, not `document`. This surface lives inside a
 * scroll-pinned corridor beat that has its own key handling, and a global
 * listener here would fight it. React's synthetic events bubble from the
 * focused descendant, so the binding works without a global hook and
 * without stealing digits from the rest of the page. In the overlay,
 * `Escape` belongs to the dialog — `useDialogShell` takes it in the capture
 * phase, so the sheet handler below never sees it there.
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

export function IntelligenceMapPlate({ shapes, districts, works, envelope }: Props) {
  const [sheet, setSheet] = useState<MapSheet>("board");
  const [selectedId, setSelectedId] = useState(works[0]?.id ?? "");
  const [litId, setLitId] = useState<string | null>(null);
  const [litMain, setLitMain] = useState<CaseMapShapeKey | null>(null);
  const [litDistrict, setLitDistrict] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);

  const totals = mapTotals(shapes, districts, works);
  const selected = works.find((w) => w.id === selectedId) ?? works[0];

  /** Sheet changes reset every transient highlight — a lit riser surviving
   *  into the board would light a module that is not hovered. */
  const go = useCallback((next: MapSheet) => {
    setSheet(next);
    setLitId(null);
    setLitMain(null);
    setLitDistrict(null);
  }, []);

  const open = useCallback(
    (id: string) => {
      setSelectedId(id);
      go("unit");
    },
    [go]
  );

  /* Focus returns to the EXPAND control, a frame late: focusing it
     synchronously loses to React's portal unmount, which hands focus to
     `<body>` (MediaLightbox documents the measurement). */
  const collapse = useCallback(() => {
    setExpanded(false);
    restoreFocusAfterUnmount(expandRef.current);
  }, []);

  /* The overlay goes with the casefile if the plane folds out from under
     it — the same gate the film lightbox watches, for the same reason. */
  useCloseOnCasefileFold(rootRef, expanded, collapse);

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

  const surface = {
    shapes,
    districts,
    works,
    totals,
    sheet,
    selectedId,
    selected,
    litId,
    litMain,
    litDistrict,
    onSheet: go,
    onOpen: open,
    onLitId: setLitId,
    onLitMain: setLitMain,
    onLitDistrict: setLitDistrict,
  };

  return (
    <div
      className="fl-plate fl-plate--imap fl-imap"
      ref={rootRef}
      data-sheet={sheet}
      data-envelope={envelope.toLowerCase()}
      onKeyDown={onKeyDown}
    >
      <MapSurface
        {...surface}
        detail="panel"
        actionRef={expandRef}
        action={{
          label: "Expand ⤢",
          title: "Open the full drawing, with its index and annotation",
          onClick: () => setExpanded(true),
        }}
      />

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

      {expanded ? (
        <MapExpanded onClose={collapse} sheet={sheet} onKeyDown={onKeyDown}>
          <MapSurface
            {...surface}
            detail="full"
            action={{ label: "Close ✕", title: "Return to the casefile", onClick: collapse }}
          />
        </MapExpanded>
      ) : null}
    </div>
  );
}
