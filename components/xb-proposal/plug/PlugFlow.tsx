"use client";

/* Where Thoughtform plugs in, as one flow (owner, 2026-10-12, after
   getcluster.ai: "a simple flow: left, middle, right … left for us would be
   the different workstreams … at the center, we built that node, that
   intelligence layer, which then gets leveraged by Claude Enterprise and then
   exposed via interfaces").

   Three parts, each named on a tab that links to its step in the stack
   below (`PLUG_STEPS`, one record for both):
     · left, a frame: your team, the four workstreams seated on an arc, their
       lines merging into one bundle out of the frame;
     · centre, the layer: the mark in a ringed core, its three parts
       (context, skills, evals) riding the rings;
     · right, a frame: Claude Enterprise. The whole right side IS Claude
       Enterprise (owner: "it doesn't need a separate pill"), so the bundle
       enters the frame onto a bus that feeds the interfaces, as live cards,
       one lit.
   A footer line reads the flow, after the operator page's substrate map.

   The SVG draws the line work in a 1200 × 460 frame; every word is DOM,
   seated in percent of the same frame over a box that holds its aspect, so
   the two can never drift. Arrival only (`useArrive`), never an idle loop. */

import type { CSSProperties } from "react";

import { BRANDMARK_PATHS, BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";

import { GLYPH, type GlyphName } from "../glyphs";
import { PLUG_STEPS, stepAnchor } from "../plugSteps";
import { useArrive } from "../useArrive";

const W = 1200;
const H = 460;
const C = { x: 600, y: 230 };
/* The two frames: your team on the left, Claude Enterprise on the right. */
const LEFT = { x0: 12, x1: 408, y0: 24, y1: 436 };
const RIGHT = { x0: 792, x1: 1188, y0: 24, y1: 436 };
/* The arc the teams sit on: a circle centred off the left frame. */
const ARC = { x: -176, y: 230, r: 330 };
const CHIP_W = 200;
const MERGE_X = 386;
const RING = [130, 112, 96];
const CORE = 64;
const BUS_X = 818;
const CARD_X = 840;
const CARD_X1 = 1166;

type Pt = [number, number];
const at = (x: number, y: number): CSSProperties =>
  ({ "--px": (x / W).toFixed(4), "--py": (y / H).toFixed(4) }) as CSSProperties;

const TEAMS: { id: GlyphName; name: string; deg: number }[] = [
  { id: "strategy", name: "Creative strategy", deg: -28 },
  { id: "production", name: "Creative production", deg: -9.5 },
  { id: "review", name: "Creative review", deg: 9.5 },
  { id: "ops", name: "Creative ops", deg: 28 },
];
const onArc = (deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [ARC.x + ARC.r * Math.cos(a), ARC.y + ARC.r * Math.sin(a)];
};

/* The layer's three parts, riding the second ring. */
const PARTS: { name: string; deg: number; out: number }[] = [
  { name: "Context", deg: -140, out: 30 },
  { name: "Skills", deg: -38, out: 30 },
  { name: "Evals", deg: 62, out: 30 },
];
const onRing = (deg: number, r: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [C.x + r * Math.cos(a), C.y + r * Math.sin(a)];
};

const ICON: Record<string, string> = {
  claude: "M12 3v18 M3 12h18 M5.6 5.6l12.8 12.8 M18.4 5.6L5.6 18.4",
  slack: "M9 3v18 M15 3v18 M3 9h18 M3 15h18",
  shopify: GLYPH.shopify,
  ads: "M3 5h18v14H3z M10 9l5 3-5 3z",
};

/* What the team sees, in the tools they already use. Illustrative, and
   lettered as such: no figure here is a claim. */
const CARDS: {
  icon: string;
  tool: string;
  title: string;
  sub: string;
  time: string;
  lit?: boolean;
}[] = [
  { icon: "claude", tool: "Claude", title: "Brief drafted", sub: "Three angles", time: "Now" },
  {
    icon: "slack",
    tool: "Slack",
    title: "Review posted",
    sub: "Two variants off-voice",
    time: "2 min",
    lit: true,
  },
  {
    icon: "shopify",
    tool: "Shopify",
    title: "Product copy ready",
    sub: "EN · DE · FR",
    time: "5 min",
  },
  {
    icon: "ads",
    tool: "Ad accounts",
    title: "Variants queued",
    sub: "Every market",
    time: "9 min",
  },
];
const CARD_Y = [96, 188, 280, 372];

const STEP = Object.fromEntries(PLUG_STEPS.map((s) => [s.id, s])) as Record<
  (typeof PLUG_STEPS)[number]["id"],
  (typeof PLUG_STEPS)[number]
>;

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="pl-ico" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/** Three hairlines a few units apart: one bundle (Cluster's own line). Each
    its own path, so each draws on from its own start. */
function Bundle({ x0, x1, y, d }: { x0: number; x1: number; y: number; d: string }) {
  return (
    <>
      {[-3, 0, 3].map((o) => (
        <path
          key={o}
          d={`M${x0} ${y + o}H${x1}`}
          className="pl-bundle pl-draw"
          style={{ "--d": d } as CSSProperties}
          pathLength={1}
        />
      ))}
    </>
  );
}

/** A frame's tab: the step and the part it names, linking to the step. */
function Tab({
  id,
  x,
  y,
  align = "start",
  d,
}: {
  id: (typeof PLUG_STEPS)[number]["id"];
  x: number;
  y: number;
  align?: "start" | "center";
  d: string;
}) {
  const st = STEP[id];
  return (
    <a
      href={`#${stepAnchor(id)}`}
      className="pl-tab pl-in"
      data-tone={st.tone}
      data-align={align}
      style={{ ...at(x, y), "--d": d } as CSSProperties}
    >
      <i aria-hidden />
      <span className="pl-tab__n">
        {st.n} · {st.step}
      </span>
      <span className="pl-tab__name">{st.frame}</span>
    </a>
  );
}

export function PlugFlow() {
  const ref = useArrive<HTMLDivElement>();
  const mk = BRANDMARK_VIEWBOX;
  const markH = 46;
  const k = markH / mk.h;

  return (
    <div className="pl" ref={ref}>
      <header className="pl-head">
        <div>
          <div className="xb-eyebrow">Where Thoughtform plugs in</div>
          <h2 className="xb-title">
            Your team, one layer,
            <br />
            <span>Claude Enterprise.</span>
          </h2>
        </div>
        <p className="xb-body pl-lede">
          Your four creative workstreams feed one intelligence layer, built with the people who run
          them. It runs in your Claude Enterprise, and the work comes back through the tools your
          team already uses. Three steps get it there.
        </p>
      </header>

      <figure
        className="pl-fig"
        aria-label="Your team feeds one intelligence layer, which runs in Claude Enterprise and shows up in your tools"
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="pl-svg" aria-hidden>
          <defs>
            <clipPath id="pl-left">
              <rect x={LEFT.x0} y={LEFT.y0} width={LEFT.x1 - LEFT.x0} height={LEFT.y1 - LEFT.y0} />
            </clipPath>
          </defs>

          {/* the two frames */}
          <rect
            x={LEFT.x0}
            y={LEFT.y0}
            width={LEFT.x1 - LEFT.x0}
            height={LEFT.y1 - LEFT.y0}
            className="pl-frame pl-frame--team"
          />
          <rect
            x={RIGHT.x0}
            y={RIGHT.y0}
            width={RIGHT.x1 - RIGHT.x0}
            height={RIGHT.y1 - RIGHT.y0}
            className="pl-frame pl-frame--run"
          />

          {/* the teams' arc, inside its frame */}
          <g clipPath="url(#pl-left)">
            {[ARC.r - 44, ARC.r, ARC.r + 44].map((r, i) => (
              <circle
                key={r}
                cx={ARC.x}
                cy={ARC.y}
                r={r}
                className={i === 1 ? "pl-arc" : "pl-arc pl-arc--faint"}
              />
            ))}
          </g>

          {/* the teams' lines merge into one bundle out of the frame */}
          {TEAMS.map((t, i) => {
            const [x, y] = onArc(t.deg);
            const x0 = x + CHIP_W - 14;
            return (
              <path
                key={t.id}
                d={`M${x0} ${y}C${(x0 + MERGE_X) / 2 + 10} ${y} ${MERGE_X - 30} ${C.y} ${MERGE_X} ${C.y}`}
                className="pl-wire pl-draw"
                style={{ "--d": `${300 + i * 60}ms` } as CSSProperties}
                pathLength={1}
              />
            );
          })}
          <Bundle x0={MERGE_X} x1={C.x - RING[0]} y={C.y} d="620ms" />

          {/* the layer */}
          <g className="pl-core">
            <circle cx={C.x} cy={C.y} r={RING[0]} className="pl-ring pl-ring--faint" />
            <circle cx={C.x} cy={C.y} r={RING[1]} className="pl-ring pl-ring--gold" />
            <circle cx={C.x} cy={C.y} r={RING[2]} className="pl-ring" />
            <circle cx={C.x} cy={C.y} r={CORE} className="pl-coreDisc" />
            <g
              transform={`translate(${C.x - (mk.w * k) / 2} ${C.y - markH / 2}) scale(${k})`}
              className="pl-mark"
            >
              {BRANDMARK_PATHS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            {PARTS.map((p) => {
              const [x, y] = onRing(p.deg, RING[1]);
              return <circle key={p.name} cx={x} cy={y} r={3.5} className="pl-node" />;
            })}
          </g>

          {/* out: one bundle into Claude Enterprise, onto a bus that feeds
              every interface */}
          <Bundle x0={C.x + RING[0]} x1={BUS_X} y={C.y} d="1100ms" />
          <path
            d={`M${BUS_X} ${CARD_Y[0]}V${CARD_Y[3]}`}
            className="pl-bus pl-draw"
            style={{ "--d": "1300ms" } as CSSProperties}
            pathLength={1}
          />
          {CARD_Y.map((y, i) => (
            <g key={y}>
              <path
                d={`M${BUS_X} ${y}H${CARD_X}`}
                className={`pl-wire pl-wire--out pl-draw${CARDS[i].lit ? " pl-wire--lit" : ""}`}
                style={{ "--d": `${1400 + i * 70}ms` } as CSSProperties}
                pathLength={1}
              />
              <rect x={BUS_X - 3} y={y - 3} width={6} height={6} className="pl-tap" />
            </g>
          ))}
        </svg>

        {/* words: DOM, seated in the frame's own units */}
        <Tab id="embed" x={LEFT.x0 + 18} y={LEFT.y0} d="0ms" />
        <Tab id="run" x={RIGHT.x0 + 18} y={RIGHT.y0} d="1200ms" />

        {TEAMS.map((t, i) => {
          const [x, y] = onArc(t.deg);
          return (
            <div
              key={t.id}
              className="pl-chip pl-in"
              style={{ ...at(x - 14, y), "--d": `${80 + i * 70}ms` } as CSSProperties}
            >
              <svg viewBox="0 0 24 24" className="pl-ico pl-ico--team" aria-hidden>
                <path d={GLYPH[t.id]} />
              </svg>
              <span>{t.name}</span>
            </div>
          );
        })}

        {PARTS.map((p, i) => {
          const [x, y] = onRing(p.deg, RING[1] + p.out);
          return (
            <div
              key={p.name}
              className="pl-part pl-in"
              style={{ ...at(x, y), "--d": `${900 + i * 90}ms` } as CSSProperties}
            >
              {p.name}
            </div>
          );
        })}

        <Tab id="encode" x={C.x} y={C.y + RING[0] + 30} align="center" d="800ms" />
        <div
          className="pl-cap pl-in"
          style={{ ...at(C.x, C.y + RING[0] + 52), "--d": "850ms" } as CSSProperties}
        >
          built by Thoughtform, with your team
        </div>

        {CARDS.map((c, i) => (
          <div
            key={c.tool}
            className="pl-card pl-in"
            data-lit={c.lit ? "" : undefined}
            style={
              {
                ...at(CARD_X, CARD_Y[i]),
                "--w": ((CARD_X1 - CARD_X) / W).toFixed(4),
                "--d": `${1500 + i * 90}ms`,
              } as CSSProperties
            }
          >
            <span className="pl-card__ico">
              <Icon d={ICON[c.icon]} />
            </span>
            <span className="pl-card__body">
              <span className="pl-card__title">
                {c.title}
                <em>{c.time}</em>
              </span>
              <span className="pl-card__sub">
                {c.tool} · {c.sub}
              </span>
            </span>
          </div>
        ))}

        <p className="pl-foot pl-in" style={{ "--d": "1900ms" } as CSSProperties}>
          The work stays with your team <span aria-hidden>→</span> the layer adds judgment{" "}
          <span aria-hidden>→</span> Claude Enterprise runs it
        </p>
      </figure>
    </div>
  );
}
