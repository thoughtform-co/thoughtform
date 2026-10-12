import type { ReactNode } from "react";

import {
  brackets,
  DIAL_RINGS,
  rimStubs,
  rimTicks,
  spokes,
  type Pt,
} from "@/components/xb-proposal/kit/dial";
import { Bracket, Cross, Diamond, Junction, Tap } from "@/components/xb-proposal/kit/marks";
import {
  bearing,
  bundle,
  chevron,
  elbow,
  jog,
  pathOf,
  railTicks,
  run,
} from "@/components/xb-proposal/kit/trace";
import { MastheadTitle } from "@/components/xb-proposal/Masthead";

/* Board S: the shape system, drawn. Every cell is one primitive of the kit
   (`components/xb-proposal/kit/`), drawn by the kit's own function, with its
   name and where the site already uses it. The last group is what the
   system leaves out. A cell is 200 × 80 units. */

const VB = "0 0 200 80";
const MIDY = 40;
const C: Pt = [100, MIDY];

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox={VB} className="pkit-spec__svg" aria-hidden>
      {children}
    </svg>
  );
}
const line = (pts: readonly Pt[], cls = "") => (
  <path d={pathOf(pts)} className={`kit-line ${cls}`} />
);
const many = (lines: readonly (readonly Pt[])[], cls = "") => (
  <path d={lines.map((l) => pathOf(l)).join("")} className={`kit-line ${cls}`} />
);

interface Cell {
  key: string;
  note: string;
  draw: ReactNode;
}

const turn = elbow([24, 22], [176, 58], "h", 14);
const bear = bearing([24, 18], [150, MIDY], 26);

const GROUPS: readonly { name: string; rule: string; out?: boolean; cells: readonly Cell[] }[] = [
  {
    name: "Lines",
    rule: "One pixel at every size. Two weights, three paints.",
    cells: [
      {
        key: "Seam",
        note: "Divides a region from its neighbour.",
        draw: <Svg>{line(run(24, 176, MIDY))}</Svg>,
      },
      {
        key: "Rule",
        note: "Rules within a region.",
        draw: <Svg>{line(run(24, 176, MIDY), "kit-line--rule")}</Svg>,
      },
      {
        key: "Gold",
        note: "The one lit thing: the layer, and what leaves it.",
        draw: <Svg>{line(run(24, 176, MIDY), "kit-line--gold")}</Svg>,
      },
      {
        key: "Green",
        note: "People, and nothing else.",
        draw: <Svg>{line(run(24, 176, MIDY), "kit-line--green")}</Svg>,
      },
    ],
  },
  {
    name: "Connectors",
    rule: "Level, plumb, or a 45-degree cut. Never a curve.",
    cells: [
      {
        key: "Run",
        note: "The masthead's rule, the bus's stubs.",
        draw: <Svg>{line(run(24, 176, MIDY))}</Svg>,
      },
      {
        key: "Elbow",
        note: "The job card's centre lines.",
        draw: <Svg>{line(elbow([24, 22], [176, 58], "h"))}</Svg>,
      },
      {
        key: "Cut turn",
        note: "The map's ribbons, the board's lanes.",
        draw: <Svg>{line(turn)}</Svg>,
      },
      {
        key: "Jog",
        note: "A level run that changes level once.",
        draw: <Svg>{line(jog([24, 26], [176, 54], 86))}</Svg>,
      },
      {
        key: "Bundle",
        note: "Three lines: the layer's way in and out.",
        draw: <Svg>{many(bundle(turn, 3, 3.4), "kit-line--gold")}</Svg>,
      },
      {
        key: "Ribbon",
        note: "Eight wires: the configuration board.",
        draw: <Svg>{many(bundle(jog([24, 26], [176, 54], 86), 8, 2.6), "kit-line--rule")}</Svg>,
      },
      {
        key: "Bus and taps",
        note: "One plumb line, a square where each stub leaves.",
        draw: (
          <Svg>
            {line(
              [
                [70, 12],
                [70, 68],
              ],
              "kit-line--gold"
            )}
            {[20, 40, 60].map((y) => (
              <g key={y}>
                {line(run(70, 150, y))}
                <Tap at={[70, y]} />
              </g>
            ))}
          </Svg>
        ),
      },
      {
        key: "Bearing",
        note: "A station's line to a dial: the angle is what it says.",
        draw: (
          <Svg>
            <circle
              cx={150}
              cy={MIDY}
              r={26}
              className="kit-ring"
              data-tone="dawn"
              strokeOpacity={0.42}
              strokeDasharray="1 6"
            />
            {line(bear, "kit-line--green kit-line--bearing")}
            {line(chevron(bear[0], bear[1], 8), "kit-line--green")}
          </Svg>
        ),
      },
    ],
  },
  {
    name: "Marks",
    rule: "Squares and diamonds. A mark is the same mark everywhere.",
    cells: [
      {
        key: "Tap",
        note: "Where a line leaves a bus.",
        draw: (
          <Svg>
            {line(run(24, 176, MIDY), "kit-line--gold")}
            <Tap at={C} />
          </Svg>
        ),
      },
      {
        key: "Diamond",
        note: "A station on a ring.",
        draw: (
          <Svg>
            {line(run(24, 176, MIDY), "kit-line--rule")}
            <Diamond at={C} size={6} />
          </Svg>
        ),
      },
      {
        key: "Junction",
        note: "Where several lines become one.",
        draw: (
          <Svg>
            {line(run(24, 95, MIDY), "kit-line--green")}
            {line(run(105, 176, MIDY), "kit-line--gold")}
            <Junction at={C} size={10} />
          </Svg>
        ),
      },
      {
        key: "Cross",
        note: "A registration mark at a frame's corner.",
        draw: (
          <Svg>
            <Cross at={C} size={7} />
          </Svg>
        ),
      },
      {
        key: "Bracket",
        note: "Framed, but not a housing.",
        draw: (
          <Svg>
            {brackets(C, 22, 6, 9).map((b, i) => (
              <Bracket key={i} pts={b} />
            ))}
          </Svg>
        ),
      },
      {
        key: "Tick rail",
        note: "The page rail's own ladder.",
        draw: (
          <Svg>
            {line([
              [92, 8],
              [92, 72],
            ])}
            {railTicks(8, 72, 8, [8, 40, 72]).map((t) => (
              <path
                key={t.y}
                d={`M92 ${t.y}H${92 + (t.major ? 14 : 6)}`}
                className={t.major ? "kit-tick" : "kit-tick kit-tick--minor"}
              />
            ))}
          </Svg>
        ),
      },
    ],
  },
  {
    name: "Instruments",
    rule: "The only circles: a ring is something you read off.",
    cells: [
      {
        key: "Ring register",
        note: "The drawing behind the portrait: six rings on a dash ladder.",
        draw: (
          <Svg>
            {DIAL_RINGS.map((r, i) => (
              <circle
                key={i}
                cx={C[0]}
                cy={C[1]}
                r={r.r * 36}
                className="kit-ring"
                data-tone={r.tone}
                strokeOpacity={Math.min(1, r.a * 2.4)}
                strokeDasharray={r.dash}
              />
            ))}
            <path
              d={spokes(C, 28, 16)
                .map((s) => pathOf(s))
                .join("")}
              className="kit-tick kit-tick--minor"
            />
          </Svg>
        ),
      },
      {
        key: "Graduated rim",
        note: "A tick every 15 degrees, a longer stub on each cardinal.",
        draw: (
          <Svg>
            <circle
              cx={C[0]}
              cy={C[1]}
              r={32}
              className="kit-ring"
              data-tone="dawn"
              strokeOpacity={0.42}
            />
            <path
              d={rimTicks(C, 32, 4)
                .map((s) => pathOf(s))
                .join("")}
              className="kit-tick kit-tick--minor"
            />
            <path
              d={rimStubs(C, 32, 9)
                .map((s) => pathOf(s))
                .join("")}
              className="kit-tick"
            />
          </Svg>
        ),
      },
    ],
  },
  {
    name: "Housings and words",
    rule: "Square corners. A tag is an edge and its text, never a fill.",
    cells: [
      {
        key: "Frame",
        note: "The four weeks, who takes part.",
        draw: <span className="kit-frame pkit-spec__box" />,
      },
      {
        key: "Tag",
        note: "Context, Skills, Evals.",
        draw: <span className="kit-tag kit-tag--gold">Context</span>,
      },
      {
        key: "Key",
        note: "PT Mono, capitals, two tracking rungs.",
        draw: <span className="kit-key kit-key--eyebrow">Week one · on site</span>,
      },
    ],
  },
  {
    name: "Not in the system",
    rule: "What the flow borrowed, and what goes.",
    out: true,
    cells: [
      {
        key: "Soft curve",
        note: "A connector is never a curve.",
        draw: (
          <Svg>
            <path d="M24 22C100 22 100 58 176 58" className="kit-line" />
          </Svg>
        ),
      },
      {
        key: "Rounded corner",
        note: "A corner is square, or cut once.",
        draw: (
          <Svg>
            <rect x={50} y={18} width={100} height={44} rx={12} className="kit-line" fill="none" />
          </Svg>
        ),
      },
      {
        key: "Pill",
        note: "A label is a tag.",
        draw: (
          <Svg>
            <rect x={50} y={26} width={100} height={28} rx={14} className="kit-line" fill="none" />
          </Svg>
        ),
      },
    ],
  },
];

/** What the pass found in the kit as it ships, and the one value each
    collapses to. */
const FOUND: readonly [string, string][] = [
  ["Five mono trackings, 0.12 to 0.18em", "two rungs: label and eyebrow"],
  ["Two chamfer recipes, two inner legs", "one cut, one leg"],
  ["A hard-coded green in four sheets", "the site's own green"],
  ["Three section heads", "the one masthead"],
];

export function Specimen() {
  return (
    <section className="arc-section arc-xb-port">
      <div className="xb xb-in-frame xc-sec">
        <div className="pkit-spec">
          <MastheadTitle lines={["The shape", "system."]} />
          <p className="pkit-spec__law">Rings are instruments. Connectors are straight.</p>
          <div className="pkit-spec__groups">
            {GROUPS.map((g) => (
              <div key={g.name} className="pkit-spec__group" data-out={g.out ? "" : undefined}>
                <header className="pkit-spec__head">
                  <span className="kit-key kit-key--eyebrow">{g.name}</span>
                  <span className="pkit-spec__rule">{g.rule}</span>
                </header>
                <div className="pkit-spec__cells">
                  {g.cells.map((c) => (
                    <figure key={c.key} className="pkit-spec__cell">
                      <div className="pkit-spec__draw">{c.draw}</div>
                      <figcaption>
                        <span className="kit-key">{c.key}</span>
                        <span className="pkit-spec__note">{c.note}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <dl className="pkit-spec__found">
            <dt className="kit-key kit-key--eyebrow">Found in the kit today</dt>
            {FOUND.map(([was, becomes]) => (
              <dd key={was}>
                <span>{was}</span>
                <i aria-hidden />
                <span>{becomes}</span>
              </dd>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
