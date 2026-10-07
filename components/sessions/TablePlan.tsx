import type { CSSProperties } from "react";

import {
  PLAN_SEAT,
  PLAN_TABLE,
  PLAN_VB,
  planDimension,
  planFraction,
  planSeats,
} from "@/lib/sessions/plan";

/**
 * The table from above (ADR-150) — an architect's plan in hairline: the
 * table, eight seats, the host at the head and one seat that is the
 * reader's, in gold. Lettered by three DOM labels, never SVG text.
 */
export function TablePlan({ caption }: { caption: string }) {
  const seats = planSeats();
  const dim = planDimension();
  const host = seats.find((s) => s.role === "host");
  const you = seats.find((s) => s.role === "you");
  const t = PLAN_TABLE;
  const labels = [
    host && { id: "host", text: "Host", ...planFraction(host.x + PLAN_SEAT / 2, host.y - 10) },
    you && { id: "you", text: "Your seat", ...planFraction(you.x + PLAN_SEAT / 2, you.y - 10) },
    { id: "table", text: "The table", ...planFraction(t.x + t.w / 2, t.y + t.h / 2) },
  ].filter(Boolean) as { id: string; text: string; ax: number; at: number }[];

  return (
    <figure className="hs-plan" aria-label={caption}>
      <figcaption className="hs-fig__cap">
        <span>{caption}</span>
      </figcaption>
      {/* the well takes whatever height the column leaves; the stage keeps the
          drawing's aspect inside it, so the labels' fractions stay true */}
      <div className="hs-plan__well">
        <div className="hs-plan__stage">
          <svg
            className="hs-plan__svg"
            viewBox={`0 0 ${PLAN_VB.w} ${PLAN_VB.h}`}
            aria-hidden="true"
            focusable="false"
          >
            <rect className="hs-plan__table" x={t.x} y={t.y} width={t.w} height={t.h} />
            <rect
              className="hs-plan__inset"
              x={t.x + 6}
              y={t.y + 6}
              width={t.w - 12}
              height={t.h - 12}
            />
            {seats.map((s) => (
              <rect
                key={s.id}
                className="hs-plan__seat"
                data-role={s.role}
                x={s.x}
                y={s.y}
                width={PLAN_SEAT}
                height={PLAN_SEAT}
              />
            ))}
            <line className="hs-plan__dim" x1={dim.x1} y1={dim.y} x2={dim.x2} y2={dim.y} />
            <line
              className="hs-plan__dim"
              x1={dim.x1}
              y1={dim.y - dim.tick}
              x2={dim.x1}
              y2={dim.y + dim.tick}
            />
            <line
              className="hs-plan__dim"
              x1={dim.x2}
              y1={dim.y - dim.tick}
              x2={dim.x2}
              y2={dim.y + dim.tick}
            />
          </svg>
          {labels.map((l) => (
            <span
              key={l.id}
              className="hs-plan__label"
              data-id={l.id}
              style={{ "--ax": l.ax, "--at": l.at } as CSSProperties}
            >
              {l.text}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
