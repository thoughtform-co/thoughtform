"use client";

/* Where Thoughtform plugs in, as one flow (owner, 2026-10-12, after
   getcluster.ai: "a simple flow: left, middle, right … left for us would be
   the different workstreams … at the center, we built that node, that
   intelligence layer, which then gets leveraged by Claude Enterprise and then
   exposed via interfaces").

   Left, the four workstreams seated on an arc. Their lines merge into one
   bundle that enters the layer: the mark in a ringed core, its three parts
   (context, skills, evals) riding the rings. One bundle leaves it for Claude
   Enterprise, which fans out to the interfaces the team already uses, as
   live cards, one lit.

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
/* The arc the teams sit on: a circle centred off the frame's left edge. */
const ARC = { x: -140, y: 230, r: 330 };
const CHIP_W = 200;
const MERGE_X = 432;
const RING = [130, 112, 96];
const CORE = 64;
const CE = { x0: 770, x1: 924 };
const CARD_X = 944;

type Pt = [number, number];
const at = (x: number, y: number): CSSProperties =>
  ({ "--px": (x / W).toFixed(4), "--py": (y / H).toFixed(4) }) as CSSProperties;

const TEAMS: { id: GlyphName; name: string; deg: number }[] = [
  { id: "strategy", name: "Creative strategy", deg: -32 },
  { id: "production", name: "Creative production", deg: -11 },
  { id: "review", name: "Creative review", deg: 11 },
  { id: "ops", name: "Creative ops", deg: 32 },
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
  enterprise: "M4 5h16v6H4z M4 13h16v6H4z M7 8h2 M7 16h2",
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
  {
    icon: "claude",
    tool: "Claude",
    title: "Brief drafted",
    sub: "Three angles",
    time: "Now",
  },
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
const CARD_Y = [86, 182, 278, 374];

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
            Your teams, one layer,
            <br />
            <span>your stack.</span>
          </h2>
        </div>
        <p className="xb-body pl-lede">
          Your four creative workstreams feed one intelligence layer, built with the people who run
          them. Claude Enterprise runs it, and the work comes back through the tools your team
          already uses. Three steps get it there.
        </p>
      </header>

      <figure
        className="pl-fig"
        aria-label="Your workstreams feed one intelligence layer, which Claude Enterprise runs and your interfaces show"
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="pl-svg" aria-hidden>
          {/* the teams' arc */}
          {[ARC.r - 44, ARC.r, ARC.r + 44].map((r, i) => (
            <circle
              key={r}
              cx={ARC.x}
              cy={ARC.y}
              r={r}
              className={i === 1 ? "pl-arc" : "pl-arc pl-arc--faint"}
            />
          ))}

          {/* the teams' lines merge into one bundle */}
          {TEAMS.map((t, i) => {
            const [x, y] = onArc(t.deg);
            const x0 = x + CHIP_W - 14;
            return (
              <path
                key={t.id}
                d={`M${x0} ${y}C${(x0 + MERGE_X) / 2 + 30} ${y} ${MERGE_X - 40} ${C.y} ${MERGE_X} ${C.y}`}
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

          {/* out: one bundle to Claude Enterprise, then a fan to the cards */}
          <Bundle x0={C.x + RING[0]} x1={CE.x0} y={C.y} d="1100ms" />
          {CARD_Y.map((y, i) => (
            <path
              key={y}
              d={`M${CE.x1} ${C.y}C${CE.x1 + 22} ${C.y} ${CARD_X - 22} ${y} ${CARD_X} ${y}`}
              className={`pl-wire pl-wire--out pl-draw${CARDS[i].lit ? " pl-wire--lit" : ""}`}
              style={{ "--d": `${1350 + i * 70}ms` } as CSSProperties}
              pathLength={1}
            />
          ))}
        </svg>

        {/* words: DOM, seated in the frame's own units */}
        {TEAMS.map((t, i) => {
          const [x, y] = onArc(t.deg);
          return (
            <div
              key={t.id}
              className="pl-chip pl-in"
              style={{ ...at(x - 14, y), "--d": `${i * 70}ms` } as CSSProperties}
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
              data-side={x < C.x ? "l" : "r"}
              style={{ ...at(x, y), "--d": `${900 + i * 90}ms` } as CSSProperties}
            >
              {p.name}
            </div>
          );
        })}

        <div
          className="pl-cap pl-in"
          style={{ ...at(C.x, C.y + RING[0] + 30), "--d": "800ms" } as CSSProperties}
        >
          <span className="pl-cap__key">The X-Bionic layer</span>
          <span className="pl-cap__sub">built by Thoughtform, with your team</span>
        </div>

        <div
          className="pl-ce pl-in"
          style={
            {
              ...at(CE.x0, C.y),
              "--w": ((CE.x1 - CE.x0) / W).toFixed(4),
              "--d": "1250ms",
            } as CSSProperties
          }
        >
          <Icon d={ICON.enterprise} />
          <span>Claude Enterprise</span>
        </div>

        {CARDS.map((c, i) => (
          <div
            key={c.tool}
            className="pl-card pl-in"
            data-lit={c.lit ? "" : undefined}
            style={{ ...at(CARD_X, CARD_Y[i]), "--d": `${1500 + i * 90}ms` } as CSSProperties}
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

        {/* the three regions, keyed to the three steps below: a bracket
            over the part of the drawing a step covers, and a link to it */}
        <nav className="pl-steps" aria-label="The three steps">
          {PLUG_STEPS.map((st) => (
            <a
              key={st.id}
              href={`#${stepAnchor(st.id)}`}
              className="pl-step pl-in"
              data-tone={st.tone}
              style={
                {
                  "--x0": (st.span[0] / W).toFixed(4),
                  "--x1": (st.span[1] / W).toFixed(4),
                  "--d": `${1800 + Number(st.n) * 90}ms`,
                } as CSSProperties
              }
            >
              <span className="pl-step__key">
                <i aria-hidden />
                {st.n} · {st.step}
              </span>
              <span className="pl-step__line">{st.line}</span>
            </a>
          ))}
        </nav>
      </figure>
    </div>
  );
}
