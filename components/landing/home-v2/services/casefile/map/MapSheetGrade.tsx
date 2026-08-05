"use client";

import type { CaseMapShapeKey } from "@/lib/cases/types";

import type { MapHover } from "./MapHoverCard";
import {
  UG,
  type MapDetail,
  type MapTotals,
  charsIn,
  districtShapes,
  districtTrenched,
  districtsTapping,
  iso,
  pad2,
  placeRisers,
  poly,
  sheetView,
  wrapLines,
} from "./mapProjection";
import type { SheetData } from "./sheetTypes";

/**
 * SHEET 03 — BELOW GRADE (ADR-062).
 *
 * The same board, one level down, in the SAME isometric — which is what
 * makes the set read as one hand. The board floats above as a ghost because
 * here it is context, not subject; beneath its spine run the five mains,
 * and each district traces to the spine exactly as it traced to the bus on
 * sheet 01, then drops a riser through the strata to tap what it uses.
 *
 * This sheet resolves the "level 01 and level 03 compete visually" problem
 * STRUCTURALLY rather than stylistically: it is not another arrangement of
 * the same blocks, it is what runs underneath them.
 *
 * TRENCHED VERSUS TAPPED IS LOAD-BEARING. A square marker means the
 * district paid to encode that shape; a round tap means it inherited one
 * that already existed. The reuse figure derived from that distinction is
 * the budget argument made visible, and the only number in the whole case
 * that improves over time rather than accumulating.
 *
 * ⚠ A MAIN IS LABELLED AT BOTH ENDS, one line each (ADR-062 Outstanding 1).
 * The first cut stacked the name and its counts at the LEFT end, 20 units
 * apart on a 30-unit stride, so every pair of mains collided. The strata
 * cannot be spread far enough to stack two lines — the deepest riser would
 * then run through the annotation band — so the counts moved to the far
 * end of their own main instead, where there is nothing but margin.
 */

/** The sheet's argument, restored by EXPAND. Hoisted so the projection
 *  test wraps and places the EXACT string the sheet draws. */
export const RATCHET =
  "Not a loop that closes — a ratchet. Each new stream starts closer to done, which is why the fifth workflow in a team costs less to configure than the first.";

interface Props extends SheetData {
  totals: MapTotals;
  litMain: CaseMapShapeKey | null;
  litDistrict: string | null;
  detail: MapDetail;
  onLitMain: (key: CaseMapShapeKey | null) => void;
  onLitDistrict: (id: string | null) => void;
  onHover: (hover: MapHover | null) => void;
}

export function MapSheetGrade({
  shapes,
  districts,
  works,
  totals,
  litMain,
  litDistrict,
  detail,
  onLitMain,
  onLitDistrict,
  onHover,
}: Props) {
  const placed = placeRisers(districts);
  const CROP = sheetView("grade", detail);
  const full = detail === "full";
  const noteChars = charsIn(UG.right - UG.left, CROP.type);

  /** A district is lit when it taps the hovered main, or is itself hovered. */
  const districtLit = (id: string) => {
    if (litDistrict) return litDistrict === id;
    if (litMain) return districtShapes(shapes, works, id).includes(litMain);
    return false;
  };
  const districtDimmed = (id: string) => Boolean((litMain || litDistrict) && !districtLit(id));

  const mainLit = (key: CaseMapShapeKey) => {
    if (litMain) return litMain === key;
    if (litDistrict) return districtShapes(shapes, works, litDistrict).includes(key);
    return false;
  };

  return (
    <g>
      <text className="fl-imap__t fl-imap__t--gold" x={UG.left} y={66}>
        Sheet 03 / below grade — the substrate
      </text>
      <text className="fl-imap__t" x={UG.left} y={84}>
        {full
          ? "The same board, one level down. What every district drops into."
          : "What every district drops into."}
      </text>
      <text className="fl-imap__t fl-imap__t--faint" x={UG.right} y={66} textAnchor="end">
        {`${pad2(totals.mains)} mains / ${totals.skills} skills / ${totals.taps} taps`}
      </text>
      <text className="fl-imap__t fl-imap__t--faint" x={UG.right} y={84} textAnchor="end">
        Encoded once, tapped by many
      </text>

      {/* The board, ghosted — context here, not subject. */}
      <polygon
        className="fl-imap__ghost"
        points={poly([
          iso(UG.cx, UG.cy, UG.A, UG.B),
          iso(UG.cx, UG.cy, UG.A, -UG.B),
          iso(UG.cx, UG.cy, -UG.A, -UG.B),
          iso(UG.cx, UG.cy, -UG.A, UG.B),
        ])}
      />

      {/* The mains, parallel to the spine. Stroke weight carries the number
          of districts on each — a main everyone taps is visibly heavier. */}
      {shapes.map((s) => {
        const depth = UG.depth[s.key];
        const m1 = iso(UG.cx, UG.cy + depth, -UG.A, 0);
        const m2 = iso(UG.cx, UG.cy + depth, UG.A, 0);
        const tapping = districtsTapping(shapes, works, districts, s.key);

        return (
          <g
            key={s.key}
            className="fl-imap__main-g"
            onMouseEnter={() => {
              onLitMain(s.key);
              onHover({ kind: "main", shape: s, districts: tapping });
            }}
            onMouseLeave={() => {
              onLitMain(null);
              onHover(null);
            }}
          >
            <line
              className="fl-imap__main"
              data-lit={mainLit(s.key) ? "" : undefined}
              data-dim={litMain && litMain !== s.key ? "" : undefined}
              x1={m1[0]}
              y1={m1[1]}
              x2={m2[0]}
              y2={m2[1]}
              strokeWidth={1 + tapping.length * 0.34}
            />
            <line
              className="fl-imap__main fl-imap__main--shadow"
              x1={m1[0] + 2}
              y1={m1[1] + 2.2}
              x2={m2[0] + 2}
              y2={m2[1] + 2.2}
            />
            {/* ONE LINE PER END. The name reads into the main from the
                left; the counts read out of it to the right. */}
            <text
              className="fl-imap__t fl-imap__t--gold"
              x={m1[0] - 14}
              y={m1[1] - 4}
              textAnchor="end"
            >
              {s.label}
            </text>
            <text className="fl-imap__t fl-imap__t--faint" x={m2[0] + 14} y={m2[1] - 4}>
              {`${s.skills} skills / ${tapping.length} districts`}
            </text>
            {/* A hover band, because a 1px line is not a pointer target. */}
            <polygon
              className="fl-imap__main-hit"
              points={poly([
                [m1[0] - 8, m1[1] - 9],
                [m2[0] + 8, m2[1] - 9],
                [m2[0] + 8, m2[1] + 11],
                [m1[0] - 8, m1[1] + 11],
              ])}
            />
          </g>
        );
      })}

      {/* Districts: footprint on the ghosted board, lateral to the spine,
          then the drop through the strata. */}
      {placed.map((p) => {
        const keys = districtShapes(shapes, works, p.district.id);
        const trenched = districtTrenched(shapes, works, p.district.id);
        const f1 = iso(UG.cx, UG.cy, p.a + UG.da, p.b + UG.db);
        const f2 = iso(UG.cx, UG.cy, p.a + UG.da, p.b - UG.db);
        const f3 = iso(UG.cx, UG.cy, p.a - UG.da, p.b - UG.db);
        const f4 = iso(UG.cx, UG.cy, p.a - UG.da, p.b + UG.db);
        const head = iso(UG.cx, UG.cy, p.drop, 0);
        const centre = iso(UG.cx, UG.cy, p.a, p.b);
        const deepest = Math.max(...keys.map((k) => UG.depth[k]));
        const lit = districtLit(p.district.id);
        const dim = districtDimmed(p.district.id);

        return (
          <g
            key={p.district.id}
            className="fl-imap__riser-g"
            data-dim={dim ? "" : undefined}
            onMouseEnter={() => {
              onLitDistrict(p.district.id);
              onHover({ kind: "district", district: p.district, keys, trenched });
            }}
            onMouseLeave={() => {
              onLitDistrict(null);
              onHover(null);
            }}
          >
            <polygon className="fl-imap__footprint" points={poly([f1, f2, f3, f4])} />
            <line
              className="fl-imap__riser"
              data-lit={lit ? "" : undefined}
              x1={centre[0]}
              y1={centre[1]}
              x2={head[0]}
              y2={head[1]}
            />
            <path
              className="fl-imap__riser"
              data-lit={lit ? "" : undefined}
              d={`M ${head[0]} ${head[1]} L ${head[0]} ${head[1] + deepest}`}
            />
            <circle className="fl-imap__junction" cx={head[0]} cy={head[1]} r={3} />
            {keys.map((k) => {
              const ty = head[1] + UG.depth[k];
              return trenched.includes(k) ? (
                <rect
                  className="fl-imap__tap fl-imap__tap--first"
                  key={k}
                  x={head[0] - 4}
                  y={ty - 4}
                  width={8}
                  height={8}
                />
              ) : (
                <circle className="fl-imap__tap" key={k} cx={head[0]} cy={ty} r={2.8} />
              );
            })}
            <text
              className="fl-imap__t fl-imap__t--gold"
              x={centre[0]}
              y={centre[1] + 3}
              textAnchor="middle"
            >
              {p.district.ab}
            </text>
            <rect
              className="fl-imap__riser-hit"
              x={head[0] - 9}
              y={head[1] - 6}
              width={18}
              height={deepest + 12}
            />
          </g>
        );
      })}

      {/* The annotation, BELOW the deepest riser. The two marks are shown
          beside the sentences that state the claim — not a notation key,
          which the drawing does not have and must never grow. The figure is
          DERIVED, and it is the one number in the case that improves rather
          than accumulates, so it stays on the panel. The ratchet prose is
          what EXPAND restores. */}
      <g className="fl-imap__note">
        <rect
          className="fl-imap__tap fl-imap__tap--first"
          x={UG.left}
          y={UG.noteY - 8}
          width={8}
          height={8}
        />
        <text className="fl-imap__t fl-imap__t--ink" x={UG.left + 16} y={UG.noteY}>
          Trenched the main — this district paid to encode the shape
        </text>
        <circle className="fl-imap__tap" cx={UG.left + 4} cy={UG.noteY + 18} r={2.8} />
        <text className="fl-imap__t" x={UG.left + 16} y={UG.noteY + 22}>
          Tapped an existing main — inherited it, added nothing to the bill
        </text>
        <text className="fl-imap__t fl-imap__t--gold" x={UG.left} y={UG.noteY + 46}>
          {`${totals.reused} of ${totals.configured} configured streams tapped a main that already existed.`}
        </text>
        {full
          ? wrapLines(RATCHET, noteChars).map((l, i) => (
              <text
                className="fl-imap__t fl-imap__t--faint"
                key={i}
                x={UG.left}
                y={UG.noteY + 66 + i * 16}
              >
                {l}
              </text>
            ))
          : null}
      </g>
    </g>
  );
}
