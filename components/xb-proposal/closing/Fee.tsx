/* The fee, three directions against the console (`ArcTerms`), each in the
   framed grammar the four weeks and who takes part already speak
   (`Frames.tsx`, the `.xf` block of `closing.css`): one hairline frame, cells
   on shared edges, a title as a sentence at reading size, items numbered
   1.1, 1.2, nothing larger than 28px.

     FeeFrame      C1 · the fee as one frame of its own
     WeeksLedger   C2 · the four weeks and the fee as one sheet
     FeePair       C3 · the fee as the twin of who takes part

   Every word and every figure is the record's (`x-bionic-proposal.ts`, the
   `pricing` and `phases` sections), read by reference. No total is lettered
   (ADR-133 U5): the days and the rate stand side by side, never multiplied. */

import type { ArcListGroup, ArcSectionOf } from "@/lib/arcs/types";
import { X_BIONIC_PROPOSAL_ARC } from "@/lib/arcs/content/x-bionic-proposal";

import { Masthead, type MastheadCopy } from "../Masthead";
import { Lead, PhaseFoot, PhaseItems, label } from "./parts";

function section<T>(id: string): T {
  const s = X_BIONIC_PROPOSAL_ARC.sections.find((x) => x.id === id);
  if (!s) throw new Error(`x-bionic proposal: no section ${id}`);
  return s as unknown as T;
}

const FEE = section<ArcSectionOf<"terms">>("pricing");
const PHASES = section<{ head: { sub?: string }; groups?: readonly ArcListGroup[] }>("phases");
const { rate, shape, measures, readout } = FEE;

/* The fee's head, continuing the closing run's own sequence (the four
   weeks 05, who takes part 06, the contact 08). */
const HEAD_FEE: MastheadCopy = {
  lines: ["The", "fee."],
  brief: FEE.head.sub ?? "",
  survey: {
    title: "XB / FEE · 07",
    brief: "XB / BRIEF · 07",
    state: FEE.console.status,
    titleCoord: "0040 / 1660",
    briefCoord: "1460 / 0720",
  },
};
/* `Frames.tsx` keeps its head private; C2 mounts the same one. */
const HEAD_WEEKS: MastheadCopy = {
  lines: ["The four", "weeks."],
  brief: PHASES.head.sub ?? "",
  survey: {
    title: "XB / PLAN · 05",
    brief: "XB / BRIEF · 05",
    state: "First month",
    titleCoord: "0040 / 1180",
    briefCoord: "1460 / 0240",
  },
};

/** The rate as the frames letter a title: the lead in full ink, the line a
    step down. Reading size, never a display numeral. */
function RateLead() {
  return <Lead lead={`${rate.value} ${rate.unit}.`} rest={rate.line} />;
}

/** The shape of the month as numbered rows: what, then how many days. */
function ShapeRows({ n }: { n: number }) {
  return (
    <ol className="xf-rows">
      {shape.map((r, i) => (
        <li key={r.label}>
          <span className="xf-list__n">
            {n}.{i + 1}
          </span>
          <span className="xf-rows__t">{r.label}</span>
          <span className="xf-mono xf-rows__m">{r.value}</span>
        </li>
      ))}
    </ol>
  );
}

/** The four measures, each a cell of the frame. */
function MeasureCells({ n }: { n: number }) {
  return (
    <>
      {measures.items.map((m, i) => (
        <article key={m.id} className="xf-cell xfee-measure">
          <span className="xf-list__n">
            {n}.{i + 1}
          </span>
          <span className="xf-list__t">{m.label}</span>
          <span className="xf-list__d">{m.line}</span>
        </article>
      ))}
    </>
  );
}

/** The three terms, each a cell: the key in mono, its answer beside it. */
function TermCells() {
  return (
    <>
      {readout.map((r) => (
        <p key={r.label} className="xf-cell xfee-term">
          <span className="xf-mono">{r.label}</span>
          <span className="xfee-v">{r.value}</span>
        </p>
      ))}
    </>
  );
}

/* ── C1 · one frame ───────────────────────────────────────────────────── */

/** The fee in the weeks' grammar: the rate and the month's shape in the
    first column, the four measures as a two-by-two beside it, the three
    terms as the floor, on the frame's three columns. */
export function FeeFrame() {
  return (
    <div className="xc xf">
      <Masthead copy={HEAD_FEE} />
      <div className="xf-frame xfee-one">
        <div className="xf-cell xfee-rate">
          <span className="xf-mono xf-gold">{rate.label}</span>
          <RateLead />
          <ShapeRows n={1} />
        </div>
        <p className="xf-cell xf-mono xfee-k">{measures.label}</p>
        <MeasureCells n={2} />
        <TermCells />
      </div>
    </div>
  );
}

/* ── C2 · one sheet ───────────────────────────────────────────────────── */

/** The four weeks and the fee as one ledger. The three phases stand as
    production draws them; under each the days it takes (the record files
    week one alone and weeks two to four together, so the second line spans
    two phases); the frame closes on the month's days beside the rate, then
    the terms. The measures follow as a second, shorter frame. */
export function WeeksLedger() {
  const groups = PHASES.groups ?? [];
  const [month, weekOne, later] = shape;
  const sub = FEE.head.sub ?? "";
  const cut = sub.indexOf(". ");
  return (
    <div className="xc xf">
      <Masthead copy={HEAD_WEEKS} />
      <div className="xf-frame xf-frame--3 xfee-ledger">
        {groups.map((g, gi) => (
          <article key={g.id} className="xf-cell xf-phase">
            <span className="xf-mono">{label(g.label)}</span>
            <Lead lead={`${g.blurb}.`} />
            <PhaseItems g={g} n={gi + 1} />
            <PhaseFoot g={g} />
          </article>
        ))}
        <p className="xf-cell xfee-line">
          <span className="xf-mono">{weekOne.label}</span>
          <span className="xfee-v">{weekOne.value}</span>
        </p>
        <p className="xf-cell xfee-line xfee-span2">
          <span className="xf-mono">{later.label}</span>
          <span className="xfee-v">{later.value}</span>
        </p>
        <p className="xf-cell xfee-line xfee-sum">
          <span className="xf-mono xf-gold">{month.label}</span>
          <span className="xf-lead">{month.value}</span>
        </p>
        <p className="xf-cell xfee-line xfee-sum xfee-span2">
          <span className="xf-mono xf-gold">{rate.label}</span>
          <span className="xf-lead">
            {rate.value} {rate.unit}
          </span>
          <span className="xfee-sum__line">{rate.line}</span>
        </p>
        <TermCells />
      </div>
      <div className="xf-frame xfee-measures">
        <div className="xf-cell xfee-measures__head">
          <span className="xf-mono">{measures.label}</span>
          <Lead
            lead={cut < 0 ? sub : sub.slice(0, cut + 1)}
            rest={cut < 0 ? undefined : sub.slice(cut + 2)}
          />
        </div>
        <MeasureCells n={4} />
      </div>
    </div>
  );
}

/* ── C3 · a matched pair ──────────────────────────────────────────────── */

/** The fee as the twin of who takes part: the same two cells on the same
    1.55 to 1 split, the same numbered rows, the same floor. The wide cell
    holds the four measures where that frame holds the six seats; the narrow
    one holds the rate, the month's shape and the terms where that frame
    holds Thoughtform's seat and what it needs. */
export function FeePair() {
  return (
    <div className="xc xf">
      <Masthead copy={HEAD_FEE} />
      <div className="xf-frame xf-who">
        <div className="xf-cell">
          <span className="xf-mono">{measures.label}</span>
          <ol className="xf-list xfee-pair__list">
            {measures.items.map((m, i) => (
              <li key={m.id}>
                <span className="xf-list__n">1.{i + 1}</span>
                <span className="xf-list__t">{m.label}</span>
                <span className="xf-list__d">{m.line}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="xf-cell xf-who__tf">
          <span className="xf-mono">{rate.label}</span>
          <RateLead />
          <ShapeRows n={2} />
          <div className="xf-foot">
            <span className="xf-mono xf-gold">
              {FEE.console.name} · {FEE.console.status}
            </span>
            <ul>
              {readout.map((r) => (
                <li key={r.label} className="xfee-pair__term">
                  <span>{r.label}</span> {r.value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
