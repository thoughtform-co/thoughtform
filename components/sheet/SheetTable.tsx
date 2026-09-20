import Link from "next/link";

import type { SheetSection } from "@/lib/sheet/types";

import { SheetStationRow } from "./SheetStationRow";

type Table = Extract<SheetSection, { kind: "table" }>;

/**
 * The ruled table (ADR-114): hairline rows and NO vertical rules, a
 * tree-glyph prefix on every title (two 1px borders — never a box-drawing
 * character, whose fallback glyph is a third face), a station row of
 * filters above it. Astrolabe's own canon index, brought to the site.
 */
export function SheetTable({ section }: { section: Table }) {
  return (
    <div className="sh-table">
      {section.stations ? (
        <div className="sh-table__stations">
          <SheetStationRow {...section.stations} />
        </div>
      ) : null}
      <table className="sh-table__t">
        <thead>
          <tr>
            {section.columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows.map((r) => (
            <tr
              key={r.id}
              data-id={r.id}
              data-sh-filter={section.stations ? section.stations.attr : undefined}
              {...(section.stations && r.tags
                ? { [`data-${section.stations.attr}s`]: r.tags.join(" ") }
                : {})}
            >
              <td className="sh-table__date">{r.cells[0]}</td>
              <td className="sh-table__title">
                <span className="sh-table__glyph" aria-hidden="true" />
                {r.href ? (
                  <Link className="sh-table__link" href={r.href}>
                    {r.cells[1]}
                  </Link>
                ) : (
                  r.cells[1]
                )}
                {r.draft ? <span className="sh-table__draft">draft</span> : null}
              </td>
              <td>{r.cells[2]}</td>
              <td>{r.cells[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
