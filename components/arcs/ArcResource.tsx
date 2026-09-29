import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcResourceProps {
  section: ArcSectionOf<"resource">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcResource — a strange resource (ADR-136): the Moira workshop's ledger,
 * ported by hand. Four resources and what each is counted in, on one plate.
 * Three rows are ordinary on purpose, so the fourth reads as the odd one out:
 * it has a unit like the others, tokens, and that is the point — the unit
 * measures the machine, the way seats measure software. What the count
 * leaves out is set under it in the gold ink, and that line is the beat's one
 * bright object. Nothing sits under the table: the head says what the row
 * means.
 *
 * ⚠ THE PLATE IS THE HOUSE'S (`.arc-plate`), so the table takes its cut
 * corner and its ring; the rows are square inside it (ADR-065 rule 4).
 *
 * ⚠ SERVER, NO STATE. `data-resource-*` only.
 */
export function ArcResource({ section, index, motion = "reveal" }: ArcResourceProps) {
  const { columns, rows } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="resource"
      className="arc-section arc-sec arc-sec--resource"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="resource"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <figure className="arc-resource arc-reveal" data-resource-figure="" {...rung(motion, 0.14)}>
          <div className="arc-plate arc-resource__plate">
            <table className="arc-resource__table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    data-resource-row={r.id}
                    data-resource-open={r.open ? "" : undefined}
                  >
                    <th scope="row" className="arc-resource__resource">
                      {r.resource}
                    </th>
                    <td className="arc-resource__unit">{r.unit}</td>
                    <td className="arc-resource__tells">
                      <span className="arc-resource__tellsline">{r.tells}</span>
                      {r.misses ? <span className="arc-resource__misses">{r.misses}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      </div>
    </ArcBeat>
  );
}
