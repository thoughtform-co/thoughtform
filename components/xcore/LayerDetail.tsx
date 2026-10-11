import { BANKS } from "./data";
import { at, Fig, notched, Pin, trace, type Box } from "./fig";

/**
 * L3 · Detail A. The technical manual's move: the offering's board at a
 * glance on the left, the chip circled, and the chip drawn large on the
 * right with what each bank holds. Work comes in at the bottom edge (the
 * team's jobs with Claude: adoption) and leaves at the top edge (agents
 * running it against the evals: automation). The same object as the
 * offering, one level down.
 */
export const L3_BOX: Box = { W: 1000, H: 470 };
const B = L3_BOX;
const CHIP = { x: 352, y: 66, w: 624, h: 330 } as const;
const MINI = { x: 24, y: 120, s: 0.27 } as const;
const BANKW = CHIP.w / 3;
const IO = [CHIP.x + BANKW / 2, CHIP.x + BANKW * 1.5, CHIP.x + BANKW * 2.5] as const;

/** The offering's board, small: four nodes, the chip, Claude. */
function Mini() {
  const m = (x: number, y: number, w: number, h: number) => ({
    x: MINI.x + x * MINI.s,
    y: MINI.y + y * MINI.s,
    width: w * MINI.s,
    height: h * MINI.s,
  });
  const chipC = { x: MINI.x + 490 * MINI.s, y: MINI.y + 183 * MINI.s };
  return (
    <g>
      {[66, 130, 194, 258].map((y) => (
        <rect key={y} className="xc-node" {...m(28, y, 234, 50)} />
      ))}
      {[91, 155, 219, 283].map((y) => (
        <line
          key={y}
          className="xc-trace"
          x1={MINI.x + 262 * MINI.s}
          y1={MINI.y + y * MINI.s}
          x2={MINI.x + 340 * MINI.s}
          y2={MINI.y + y * MINI.s}
        />
      ))}
      <path
        className="xc-chip"
        d={notched(MINI.x + 340 * MINI.s, MINI.y + 58 * MINI.s, 300 * MINI.s, 250 * MINI.s, 5)}
      />
      <line
        className="xc-trace xc-trace--lit"
        x1={MINI.x + 640 * MINI.s}
        y1={MINI.y + 170 * MINI.s}
        x2={MINI.x + 720 * MINI.s}
        y2={MINI.y + 130 * MINI.s}
      />
      <rect className="xc-node" {...m(720, 58, 256, 150)} />
      <rect className="xc-node xc-node--quiet" {...m(720, 240, 116, 40)} />
      <rect className="xc-node xc-node--quiet" {...m(860, 240, 116, 40)} />
      <circle className="xc-callout" cx={chipC.x} cy={chipC.y} r={58} />
      <path
        className="xc-leader"
        d={trace(
          [
            [chipC.x + 58, chipC.y],
            [CHIP.x - 24, chipC.y],
            [CHIP.x - 24, CHIP.y + CHIP.h / 2],
            [CHIP.x, CHIP.y + CHIP.h / 2],
          ],
          10
        )}
      />
    </g>
  );
}

export function LayerDetail() {
  return (
    <Fig
      box={B}
      className="xc-board"
      label="Detail A: the X-Bionic layer drawn large. Context, skills and evals, three each. The team's jobs with Claude come in at the bottom; agents run the work against the evals out of the top."
      svg={
        <>
          <pattern id="xc-dots-3" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.9" className="xc-dot" />
          </pattern>
          <rect x={0} y={0} width={B.W} height={B.H} fill="url(#xc-dots-3)" />
          <Mini />
          {/* out, at the top edge */}
          {IO.map((x) => (
            <g key={`o${x}`}>
              <path className="xc-trace xc-trace--lit" d={`M${x} ${CHIP.y} V${CHIP.y - 30}`} />
              <Pin x={x} y={CHIP.y} lit />
              <Pin x={x} y={CHIP.y - 30} lit s={8} />
            </g>
          ))}
          {/* in, at the bottom edge */}
          {IO.map((x) => (
            <g key={`i${x}`}>
              <path className="xc-trace" d={`M${x} ${CHIP.y + CHIP.h} V${CHIP.y + CHIP.h + 30}`} />
              <Pin x={x} y={CHIP.y + CHIP.h} lit />
              <Pin x={x} y={CHIP.y + CHIP.h + 30} s={8} />
            </g>
          ))}
          <path className="xc-chip" d={notched(CHIP.x, CHIP.y, CHIP.w, CHIP.h, 16)} />
          <line
            className="xc-chip__rule"
            x1={CHIP.x}
            y1={CHIP.y + 40}
            x2={CHIP.x + CHIP.w}
            y2={CHIP.y + 40}
          />
          {[1, 2].map((k) => (
            <line
              key={k}
              className="xc-chip__seam"
              x1={CHIP.x + BANKW * k}
              y1={CHIP.y + 54}
              x2={CHIP.x + BANKW * k}
              y2={CHIP.y + CHIP.h - 14}
            />
          ))}
        </>
      }
    >
      <p className="xc-cellhead" style={at(B, 24, 20)}>
        <span className="xc-cellhead__n">Fig. 1</span>The offering
      </p>
      <p className="xc-cellhead" style={at(B, MINI.x, MINI.y + 330 * MINI.s + 16)}>
        <span className="xc-cellhead__n">A</span>The layer, circled
      </p>
      <p className="xc-iotag" style={at(B, IO[0] - 6, CHIP.y - 58)}>
        <span className="xc-cellhead__n">Out</span>Agents run the work, against the evals
      </p>
      <p className="xc-iotag" style={at(B, IO[0] - 6, CHIP.y + CHIP.h + 38)}>
        <span className="xc-cellhead__n">In</span>The team&apos;s jobs with Claude, and what worked
      </p>
      <p className="xc-chiphead" style={at(B, CHIP.x + 20, CHIP.y, CHIP.w - 40, 40)}>
        <span>Detail A · X-Bionic layer</span>
        <span className="xc-chiphead__r">Written in phase one</span>
      </p>
      {BANKS.map((b, i) => (
        <div
          key={b.id}
          className="xc-detail"
          style={at(B, CHIP.x + BANKW * i + 20, CHIP.y + 56, BANKW - 40, CHIP.h - 66)}
        >
          <span className="xc-bank__name">{b.name}</span>
          <span className="xc-detail__what">{b.what}</span>
          <ul>
            {b.detail.map(([name, note]) => (
              <li key={name}>
                <span className="xc-detail__n">{name}</span>
                <span className="xc-detail__note">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Fig>
  );
}
