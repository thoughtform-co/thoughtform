import { BANKS, CLAUDE, PHASES, WORKSTREAMS } from "./data";
import { at, Fig, notched, Pin, trace, type Box } from "./fig";

/**
 * O1 · The circuit. The offering read left to right on one board, three
 * cells sharing their edges: the team's four workstreams, the layer as the
 * one chip (the only gold object), X-Bionic's Claude Enterprise with the
 * layer installed in it. Each cell ends on its step and one sentence.
 */
export const O1_BOX: Box = { W: 1000, H: 450 };
const COL = [0, 300, 680, 1000] as const;
const NODE = { x: 28, w: 234, h: 50, ys: [66, 130, 194, 258] } as const;
const CHIP = { x: 340, y: 58, w: 300, h: 250 } as const;
const BANK_Y = [100, 170, 240] as const;
const CL = { x: 720, y: 58, w: 256, h: 150 } as const;
const CONN = { y: 240, h: 40, xs: [720, 860], w: 116 } as const;
const OUT_PINS = [135, 205, 275] as const;
const IN_PINS = [92, 124, 156] as const;
const JOG = [690, 700, 710] as const;

export function OfferCircuit() {
  const pinY = NODE.ys.map((y) => y + NODE.h / 2);
  return (
    <Fig
      box={O1_BOX}
      className="xc-board"
      label="The offering: the team's four workstreams wired into one layer, the layer installed in X-Bionic's Claude Enterprise."
      svg={
        <>
          <path className="xc-housing" d={notched(0.5, 0.5, O1_BOX.W - 1, O1_BOX.H - 1, 16)} />
          {COL.slice(1, -1).map((x) => (
            <line key={x} className="xc-rule" x1={x} y1={1} x2={x} y2={O1_BOX.H - 1} />
          ))}
          {/* the datum: a dot grid under the drawing zone */}
          <pattern id="xc-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.9" className="xc-dot" />
          </pattern>
          <rect x={1} y={44} width={O1_BOX.W - 2} height={286} fill="url(#xc-dots)" />

          {/* team → layer */}
          {pinY.map((y, i) => (
            <g key={i}>
              <path
                className="xc-trace"
                d={trace([
                  [NODE.x + NODE.w, y],
                  [CHIP.x, y],
                ])}
              />
              <Pin x={NODE.x + NODE.w} y={y} />
              <Pin x={CHIP.x} y={y} lit />
            </g>
          ))}
          {/* layer → Claude */}
          {OUT_PINS.map((y, i) => (
            <g key={i}>
              <path
                className="xc-trace xc-trace--lit"
                d={trace([
                  [CHIP.x + CHIP.w, y],
                  [JOG[i], y],
                  [JOG[i], IN_PINS[i]],
                  [CL.x, IN_PINS[i]],
                ])}
              />
              <Pin x={CHIP.x + CHIP.w} y={y} lit />
              <Pin x={CL.x} y={IN_PINS[i]} lit />
            </g>
          ))}
          {/* Claude → connectors */}
          {CONN.xs.map((x) => (
            <g key={x}>
              <path
                className="xc-trace"
                d={trace([
                  [x + CONN.w / 2, CL.y + CL.h],
                  [x + CONN.w / 2, CONN.y],
                ])}
              />
              <Pin x={x + CONN.w / 2} y={CONN.y} />
            </g>
          ))}

          {NODE.ys.map((y) => (
            <rect key={y} className="xc-node" x={NODE.x} y={y} width={NODE.w} height={NODE.h} />
          ))}
          <path className="xc-chip" d={notched(CHIP.x, CHIP.y, CHIP.w, CHIP.h, 14)} />
          <line
            className="xc-chip__rule"
            x1={CHIP.x}
            y1={CHIP.y + 34}
            x2={CHIP.x + CHIP.w}
            y2={CHIP.y + 34}
          />
          {BANK_Y.slice(1).map((y) => (
            <line
              key={y}
              className="xc-chip__seam"
              x1={CHIP.x + 12}
              y1={y}
              x2={CHIP.x + CHIP.w - 12}
              y2={y}
            />
          ))}
          <rect className="xc-node" x={CL.x} y={CL.y} width={CL.w} height={CL.h} />
          <line className="xc-rule" x1={CL.x} y1={CL.y + 38} x2={CL.x + CL.w} y2={CL.y + 38} />
          <rect
            className="xc-installed"
            x={CL.x + 10}
            y={CL.y + CL.h - 40}
            width={CL.w - 20}
            height={30}
          />
          {CONN.xs.map((x) => (
            <rect
              key={x}
              className="xc-node xc-node--quiet"
              x={x}
              y={CONN.y}
              width={CONN.w}
              height={CONN.h}
            />
          ))}
        </>
      }
    >
      {/* cell heads */}
      {PHASES.map((p, i) => (
        <p key={p.id} className="xc-cellhead" style={at(O1_BOX, COL[i] + 24, 16)}>
          <span className="xc-cellhead__n">{p.n}</span>
          {p.tag}
        </p>
      ))}

      {WORKSTREAMS.map((w, i) => (
        <div
          key={w.id}
          className="xc-nodetext"
          style={at(O1_BOX, NODE.x, NODE.ys[i], NODE.w, NODE.h)}
        >
          <span className="xc-nodetext__name">{w.name}</span>
          <span className="xc-nodetext__meta">{w.owner}</span>
        </div>
      ))}

      <p className="xc-chiphead" style={at(O1_BOX, CHIP.x + 16, CHIP.y, CHIP.w - 32, 34)}>
        <span>X-Bionic layer</span>
        <span className="xc-chiphead__r">Plugin</span>
      </p>
      {BANKS.map((b, i) => (
        <div
          key={b.id}
          className="xc-bank"
          style={at(O1_BOX, CHIP.x + 16, BANK_Y[i] - 2, CHIP.w - 32, 66)}
        >
          <span className="xc-bank__name">{b.name}</span>
          <span className="xc-bank__items">
            {b.items.map((it) => (
              <span key={it}>{it}</span>
            ))}
          </span>
        </div>
      ))}

      <div className="xc-nodetext xc-nodetext--head" style={at(O1_BOX, CL.x, CL.y, CL.w, 38)}>
        <span className="xc-nodetext__name">{CLAUDE.name}</span>
      </div>
      <ul className="xc-list" style={at(O1_BOX, CL.x + 16, CL.y + 46, CL.w - 32)}>
        {CLAUDE.surfaces.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <p
        className="xc-installedtext"
        style={at(O1_BOX, CL.x + 10, CL.y + CL.h - 40, CL.w - 20, 30)}
      >
        + X-Bionic layer
      </p>
      {CLAUDE.connectors.map((c, i) => (
        <div
          key={c}
          className="xc-nodetext xc-nodetext--center"
          style={at(O1_BOX, CONN.xs[i], CONN.y, CONN.w, CONN.h)}
        >
          <span className="xc-nodetext__meta">{c}</span>
        </div>
      ))}

      {/* the steps, one sentence each */}
      {PHASES.map((p, i) => (
        <div
          key={p.id}
          className="xc-step"
          style={at(O1_BOX, COL[i] + 24, 340, COL[i + 1] - COL[i] - 48)}
        >
          <h3 className="xc-step__t">{p.title}</h3>
          <p className="xc-step__l">{p.line}</p>
        </div>
      ))}
    </Fig>
  );
}
