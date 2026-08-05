import type { CaseMapDistrict, CaseMapShape, CaseMapWork } from "@/lib/cases/types";

/** The record every sheet draws from. One shape so the three stay siblings. */
export interface SheetData {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
}

/** The three drawings, in the order the tabs present them. */
export type MapSheet = "board" | "unit" | "grade";

export const MAP_SHEETS: readonly {
  id: MapSheet;
  ord: string;
  name: string;
  sub: string;
  /** The projection note printed in the tab strip's tail. */
  note: string;
}[] = [
  {
    id: "board",
    ord: "01",
    name: "The work",
    sub: "The board · all streams",
    note: "Isometric / seated on one bus",
  },
  {
    id: "unit",
    ord: "02",
    name: "The configuration",
    sub: "The unit · exploded",
    note: "Exploded axonometric",
  },
  {
    id: "grade",
    ord: "03",
    name: "The substrate",
    sub: "Below grade · shared",
    note: "Isometric / below the board",
  },
];
