"use client";

import type { CaseMapDistrict, CaseMapShape, CaseMapShapeKey, CaseMapWork } from "@/lib/cases/types";

import { MASS_BAND, SEAT, isPersonLed, orderShapes, trenchedBy } from "./mapProjection";

/**
 * The map's hover card (ADR-062).
 *
 * Per-stream detail lives HERE rather than on the drawing. Sheet 01 carries
 * 27 modules and sheet 03 one riser per district; printing each one's lane,
 * bar and taps in place is what made every earlier prototype unreadable.
 * The card is the release valve that lets the drawing stay a drawing.
 *
 * `pointer-events: none` in CSS — it follows the cursor and must never
 * intercept the hover that spawned it.
 */

export type MapHover =
  | { kind: "work"; work: CaseMapWork }
  | { kind: "main"; shape: CaseMapShape; districts: readonly CaseMapDistrict[] }
  | {
      kind: "district";
      district: CaseMapDistrict;
      keys: readonly CaseMapShapeKey[];
      trenched: readonly CaseMapShapeKey[];
    };

interface Props {
  hover: MapHover | null;
  /** Canvas-relative position, already flipped at the edges by the plate. */
  at: { x: number; y: number } | null;
  shapes: readonly CaseMapShape[];
  works: readonly CaseMapWork[];
  districts: readonly CaseMapDistrict[];
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="fl-imap__card-row">
      <span>{k}</span>
      <b>{v}</b>
    </div>
  );
}

export function MapHoverCard({ hover, at, shapes, works, districts }: Props) {
  const label = (key: CaseMapShapeKey) => shapes.find((s) => s.key === key)?.label ?? key;

  let body: React.ReactNode = null;
  let head = "";
  let sub = "";

  if (hover?.kind === "work") {
    const w = hover.work;
    const district = districts.find((d) => d.id === w.dist);
    const taps = orderShapes(shapes, w.shapes).map(label).join(" / ");
    const trenched = trenchedBy(shapes, w.id);
    head = `${w.id} ${w.title}`;
    sub = district?.name ?? "";
    body = (
      <>
        <Row k="Bar" v={w.bar} />
        <Row
          k="Runs on"
          v={isPersonLed(w) ? "Person-led / not bound" : `${w.cfg?.s[0]} · ${w.lane} lane`}
        />
        <Row k="Taps" v={taps} />
        <Row k="Decides" v={`${SEAT[w.seat].label} · ${SEAT[w.seat].note}`} />
        <Row
          k="Draw"
          v={isPersonLed(w) ? "Nil / no draw on record" : `${MASS_BAND[w.mass]} / ${w.vol} volume`}
        />
        {trenched.length ? (
          <Row k="Trenched" v={trenched.map((s) => s.label).join(" / ")} />
        ) : null}
      </>
    );
  } else if (hover?.kind === "main") {
    const s = hover.shape;
    const first = works.find((w) => w.id === s.first);
    const firstDistrict = districts.find((d) => d.id === first?.dist);
    head = `${s.label} main`;
    sub = "Shape of judgment / on record";
    body = (
      <>
        <Row k="Means" v={s.gloss} />
        <Row k="Skills" v={`${s.skills} on record`} />
        <Row k="Tapped by" v={hover.districts.map((d) => d.ab).join(" / ")} />
        <Row k="Trenched by" v={`${first?.title ?? "—"} · ${firstDistrict?.name ?? "—"}`} />
        <Row
          k="Since"
          v={`${Math.max(0, hover.districts.length - 1)} districts tapped it without rebuilding it`}
        />
      </>
    );
  } else if (hover?.kind === "district") {
    const d = hover.district;
    head = d.name;
    sub = "District / on the board";
    body = (
      <>
        <Row k="Modules" v={`${works.filter((w) => w.dist === d.id).length} work streams`} />
        <Row k="Taps" v={hover.keys.map(label).join(" / ")} />
        <Row
          k="Trenched"
          v={
            hover.trenched.length
              ? hover.trenched.map(label).join(" / ")
              : "None — inherited every main"
          }
        />
      </>
    );
  }

  return (
    <div
      className="fl-imap__card"
      data-on={hover && at ? "" : undefined}
      style={at ? { left: `${at.x}px`, top: `${at.y}px` } : undefined}
      aria-hidden="true"
    >
      {hover ? (
        <>
          <h6>{head}</h6>
          <div className="fl-imap__card-sub">{sub}</div>
          {body}
        </>
      ) : null}
    </div>
  );
}
