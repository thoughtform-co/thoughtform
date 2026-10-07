import { Frame, Grid } from "@/components/lattice";
import { SPECIMEN } from "@/lib/lattice/specimen-copy";
import type { LatKnobs } from "@/lib/lattice/variants";

import { cutOf, lineOf, type FrameCut, type FrameLine } from "./knobProps";

/**
 * The frames board: the recipe's whole matrix, so every combination is on one
 * still — cut × line × ground — then the five chamfer rungs, then the one
 * box with something hanging outside it (`overflow="visible"`: the ring at
 * `inset: -1px`, the ground on `::after`; a host clip would cut the chevron
 * off — ADR-148's chevrons).
 *
 * The MATRIX draws every cut regardless of the knob (it is the matrix); the
 * chamfer row and the overflow case take the knobs, so the stamp's cut and
 * line are what they paint. Every frame carries an `id` of the form `lat-frame-<spec>`, so
 * `measureLattice` can name the one that is off (the spec is read off the id;
 * `Frame` takes no arbitrary attribute).
 */

const CUTS: readonly FrameCut[] = ["tr-bl", "tr", "bl", "none"];
const LINES: readonly FrameLine[] = ["lip", "seam", "rule"];
const GROUNDS = ["plate", "thin", "none"] as const;
const CH = ["chrome", "seed", "card", "plate", "plate-fluid"] as const;

const CUT_LABEL: Record<FrameCut, string> = {
  "tr-bl": "TR+BL",
  tr: "TR",
  bl: "BL",
  none: "SQUARE",
};

const CH_LABEL: Record<(typeof CH)[number], string> = {
  chrome: "0",
  seed: "16px",
  card: "clamp(14px, 1.3vw, 22px)",
  plate: "26px",
  "plate-fluid": "clamp(16px, 1.8vw, 26px)",
};

export function FramesBoard({ knobs }: { knobs: LatKnobs }) {
  const cut = cutOf(knobs);
  const line = lineOf(knobs);
  let i = 0;

  return (
    <div className="lat-scroll lat-frames" data-lat-frames="">
      <h2 className="lat-board__head">
        <span className="lat-board__kicker">The frame recipe</span>
        cut × line × ground
      </h2>

      <Grid className="lat-frames__matrix" air>
        {CUTS.map((c) =>
          LINES.map((l) =>
            GROUNDS.map((g) => {
              const spec = `${c}-${l}-${g}`;
              const sentence = SPECIMEN.cells[i++ % SPECIMEN.cells.length].line;
              return (
                <Frame
                  key={spec}
                  id={`lat-frame-${spec}`}
                  cut={c}
                  line={l}
                  ground={g}
                  ch="plate-fluid"
                  className="lat-frames__cell"
                  head={
                    <span className="lat-frames__kicker">
                      FRAME · {CUT_LABEL[c]} · {l.toUpperCase()} · {g.toUpperCase()}
                    </span>
                  }
                  foot={
                    <span className="lat-frames__foot">
                      {c} · {l} · {g}
                    </span>
                  }
                >
                  <p className="lat-frames__body">{sentence}</p>
                </Frame>
              );
            })
          )
        )}
      </Grid>

      <h2 className="lat-board__head">
        <span className="lat-board__kicker">The chamfer ladder</span>
        chrome · seed · card · plate · plate-fluid
      </h2>

      <Grid className="lat-frames__ladder" air>
        {CH.map((ch) => (
          <Frame
            key={ch}
            id={`lat-frame-ch-${ch}`}
            cut={cut}
            line={line}
            ground="plate"
            ch={ch}
            className="lat-frames__cell"
            head={<span className="lat-frames__kicker">CH · {ch.toUpperCase()}</span>}
            foot={
              <span className="lat-frames__foot">
                cut {cut} · ch {ch} · {CH_LABEL[ch]}
              </span>
            }
          >
            <p className="lat-frames__body">{SPECIMEN.frames.body}</p>
          </Frame>
        ))}
      </Grid>

      <h2 className="lat-board__head">
        <span className="lat-board__kicker">Overflow</span>
        something hanging outside the box
      </h2>

      <Grid className="lat-frames__overflow" air>
        <Frame
          id="lat-frame-overflow"
          cut={cut}
          line={line}
          ground="plate"
          ch="plate-fluid"
          overflow="visible"
          className="lat-frames__cell lat-frames__cell--overflow"
          head={
            <span className="lat-frames__kicker">
              {SPECIMEN.frames.kicker.toUpperCase()} · OVERFLOW VISIBLE
            </span>
          }
          foot={<span className="lat-frames__foot">{SPECIMEN.frames.foot}</span>}
        >
          <p className="lat-frames__body">{SPECIMEN.frames.body}</p>
          {/* The chevron: a small absolute span seated past the frame's bottom
              edge. No `::after` — the recipe's ground lives there under
              `overflow="visible"`. */}
          <span className="lat-frames__chevron" aria-hidden="true" />
        </Frame>
      </Grid>
    </div>
  );
}
