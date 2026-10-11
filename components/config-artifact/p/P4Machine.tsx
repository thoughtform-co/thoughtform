/* P4 · The machine, after anatomy: the object is the explanation. Claude
   Enterprise is a console on feet. The configuration is a cartridge seated
   in its first slot, the one lit part, with the brand mark and the lines the
   team has written on its face. The agents and models are cards in the next
   slots, and Shopify and analytics are ports. The team is a patch panel in
   front: four jacks whose leads plug into the cartridge. Built with the
   vendored anatomy kit (`../iso`), painted back to front. */

import { GLYPH, type GlyphName } from "@/components/xb-proposal/glyphs";
import { STAGES, TEAM, WRITTEN_MAX, type FrameNo } from "../copy";
import * as k from "../iso/iso-kit";
import { Dots, Line, Solid, Wire } from "../iso/react/draw";
import { MARK_H, MARK_PATHS } from "../Mark";
import { GOLD, INK, Timeline } from "../parts";
import { VB_W } from "../Shell";

type P3 = k.Point3;

const CHASSIS: k.Plan = { x: -130, y: -55, w: 260, d: 110, r: 8 };
const C_Z0 = 10;
const C_H = 44;
const C_TOP = C_Z0 + C_H;
const CART: k.Plan = { x: -106, y: -40, w: 24, d: 80, r: 2 };
const CART_H = 84;
const CARDS: { plan: k.Plan; name: string; h: number }[] = [
  { plan: { x: -54, y: -36, w: 14, d: 72, r: 1.5 }, name: "AGENTS", h: 42 },
  { plan: { x: -28, y: -36, w: 14, d: 72, r: 1.5 }, name: "MODELS", h: 28 },
];
const PORTS: { plan: k.Plan; glyph: GlyphName }[] = [
  { plan: { x: 22, y: -42, w: 44, d: 34, r: 3 }, glyph: "shopify" },
  { plan: { x: 22, y: 6, w: 44, d: 34, r: 3 }, glyph: "analytics" },
];
const PANEL: k.Plan = { x: -152, y: 86, w: 176, d: 46, r: 5 };
const P_Z0 = 7;
const P_H = 18;
const P_TOP = P_Z0 + P_H;
const JACK_X = [-128, -90, -52, -14];
const JACK_Y = 104;

/** Engraved on a face, at a size that renders near 12.5px whatever the
    projection's scale (the kit's FaceText sizes in world units). */
function Engrave({ transform, P, tone = "mid", children }: { transform: string; P: k.Projection; tone?: k.Tone; children: string }) {
  return (
    <text className="iso-face-text" data-tone={tone} transform={transform} style={{ fontSize: 12.5 / P.scale, letterSpacing: "0.06em" }}>
      {children}
    </text>
  );
}

function glyphOnTop(name: GlyphName, at: k.Plane, z: number, P: k.Projection, size: number) {
  return `${k.topMatrix(at, z, P)} scale(${size / 24})`;
}

function Feet({ plan, z, h, P }: { plan: k.Plan; z: number; h: number; P: k.Projection }) {
  const pts = [...k.corners(plan, 16)].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  return (
    <g>
      {pts.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <Solid paths={k.cylinder(x, y, 7, z, 1.4, P, 24)} tone="lo" />
          <Solid paths={k.cylinder(x, y, 5.2, z + 1.4, h - 1.4, P, 24)} tone="mid" />
        </g>
      ))}
    </g>
  );
}

export function P4Machine({ frame }: { frame: FrameNo }) {
  const late = frame === 2;
  const stage = late ? STAGES[3] : STAGES[0];
  const written = Math.round((stage.written / WRITTEN_MAX) * 12);
  const figH = 470;
  const extremes: P3[] = [
    ...k.boxCorners(CHASSIS, 0, C_TOP),
    ...k.boxCorners(CART, C_TOP, C_TOP + CART_H + 6),
    ...k.boxCorners(PANEL, 0, P_TOP + 8),
  ];
  const P = k.fitProjection(extremes, VB_W, figH, { pad: 26, azimuth: 40 });
  const at = (p: P3) => k.iso(p, P);

  const cartTop = C_TOP + CART_H;
  const cartFace = CART.x + CART.w; // the +x face carries the mark
  const sockets: P3[] = [0, 1, 2, 3].map((i) => [CART.x + CART.w / 2, CART.y + CART.d, C_TOP + 22 + i * 13]);

  // Items on the console's top, painted back to front.
  const onTop = [
    ...CARDS.map((c, i) => ({ key: `card-${i}`, depth: k.depthOf([c.plan.x + c.plan.w / 2, c.plan.y + c.plan.d / 2, C_TOP], P), kind: "card" as const, i })),
    ...PORTS.map((p, i) => ({ key: `port-${i}`, depth: k.depthOf([p.plan.x + p.plan.w / 2, p.plan.y + p.plan.d / 2, C_TOP], P), kind: "port" as const, i })),
    { key: "cart", depth: k.depthOf([CART.x + CART.w / 2, CART.y + CART.d / 2, C_TOP], P), kind: "cart" as const, i: 0 },
  ].sort((a, b) => a.depth - b.depth);

  return (
    <g className="iso">
      {/* 03 · the console: Claude Enterprise. */}
      <path className="iso-halo" d={k.haloOf(CHASSIS, 0, C_TOP, P)} />
      <Feet plan={CHASSIS} z={0} h={C_Z0} P={P} />
      <Solid
        paths={k.slabOf(CHASSIS, C_Z0, C_H, P, 8, 1.4)}
        tone="mid"
        inner={<Line d={k.sideSeam(CHASSIS, C_Z0 + 12, P)} tone="faint" />}
      />
      <Line d={k.planOutline(k.insetPlan(CHASSIS, 6), C_TOP, P)} tone="faint" />
      {/* The slots the cards stand in, and a ruler on the front edge. */}
      {[CART, ...CARDS.map((c) => c.plan)].map((s, i) => (
        <Line key={i} d={k.planOutline(k.insetPlan(s, -3), C_TOP, P, 3)} tone="lo" />
      ))}
      {(() => {
        const strip: k.Plan = { x: -110, y: CHASSIS.y + CHASSIS.d - 15, w: 200, d: 7, r: 1 };
        const t = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, C_TOP + 0.6, [2, 3.6], P);
        return (
          <g>
            <Solid paths={k.slabOf(strip, C_TOP, 0.6, P, 3)} tone="lo" crease="none" />
            <Line d={t.minor} tone="lo" />
            <Line d={t.major} tone="mid" />
          </g>
        );
      })()}
      <Dots points={k.dotGrid(78, -38, 6, 10, 7, C_TOP, P)} size={0.7} tone="lo" />
      <Engrave transform={k.sideMatrix([CHASSIS.x + 150, CHASSIS.y + CHASSIS.d], C_Z0 + 22, P, "left")} P={P} tone="mid">
        03 CLAUDE ENTERPRISE
      </Engrave>

      {onTop.map((item) => {
        if (item.kind === "card") {
          const c = CARDS[item.i];
          const top = C_TOP + c.h;
          return (
            <g key={item.key}>
              <Solid paths={k.slabOf(c.plan, C_TOP, c.h, P, 3, 0.6)} tone="mid" inner={<Line d={k.sideSeam(c.plan, C_TOP + 8, P, 3)} tone="faint" />} />
              <Solid paths={k.cylinder(c.plan.x + c.plan.w / 2, c.plan.y + 12, 2.6, top, 2.2, P, 16)} tone="lo" />
              <Dots points={[at([c.plan.x + c.plan.w / 2, c.plan.y + 12, top + 2.6])]} size={1.4} tone={late ? "hi" : "lo"} />
              <Engrave transform={k.sideMatrix([c.plan.x + c.plan.w, c.plan.y + c.plan.d - 6], top - 5, P, "right")} P={P} tone="mid">
                {c.name}
              </Engrave>
            </g>
          );
        }
        if (item.kind === "port") {
          const p = PORTS[item.i];
          const top = C_TOP + 12;
          const cx = p.plan.x + p.plan.w - 10;
          const cy = p.plan.y + p.plan.d / 2;
          return (
            <g key={item.key}>
              <Solid paths={k.slabOf(p.plan, C_TOP, 12, P, 4, 0.8)} tone="mid" />
              <path d={GLYPH[p.glyph]} transform={glyphOnTop(p.glyph, [p.plan.x + 5, p.plan.y + 5], top, P, 22)} fill="none" stroke={INK} strokeOpacity={0.75} vectorEffect="non-scaling-stroke" strokeWidth={0.8} />
              <Solid paths={k.cylinder(cx, cy, 5, top, 6, P, 24)} tone="mid" />
              <Line d={k.knurl(cx, cy, 5, top + 1, top + 6, 18, P)} tone="lo" />
              <Line d={k.ring(cx, cy, 2.2, top + 6, P, 16)} tone="mid" />
            </g>
          );
        }
        // 02 · the cartridge: the configuration, the one lit part.
        return (
          <g key={item.key}>
            <Solid paths={k.slabOf(CART, C_TOP, CART_H, P, 3, 0.8)} tone="hi" lit inner={<Line d={k.sideSeam(CART, C_TOP + 10, P, 3)} tone="lit" />} />
            <Solid paths={k.slabOf({ x: CART.x + 4, y: CART.y + 18, w: CART.w - 8, d: CART.d - 36, r: 1.5 }, cartTop, 6, P, 3, 0.4)} tone="hi" lit />
            {/* The brand mark and the written lines, on the +x face. */}
            <g transform={`${k.sideMatrix([cartFace, CART.y + CART.d - 6], cartTop - 6, P, "right")} scale(${18 / MARK_H})`} fill={GOLD}>
              {MARK_PATHS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <Engrave transform={k.sideMatrix([cartFace, CART.y + CART.d - 6], cartTop - 36, P, "right")} P={P} tone="hi">
              02 X-BIONIC
            </Engrave>
            {Array.from({ length: 12 }, (_, i) => {
              const z = cartTop - 44 - i * 2.6;
              const len = [52, 44, 58, 36, 50, 60, 40, 54, 30, 56, 46, 38][i];
              const y0 = CART.y + CART.d - 6;
              return <Line key={i} d={k.segment([cartFace, y0, z], [cartFace, y0 - len, z], P)} tone={i < written ? "lit" : "faint"} free="end" />;
            })}
            {sockets.map((s, i) => (
              <Line key={i} d={k.sideRing(s, 3, "y", P, 16)} tone="lit" />
            ))}
          </g>
        );
      })}

      {/* 01 · the team: a patch panel, four jacks. */}
      <path className="iso-halo" d={k.haloOf(PANEL, 0, P_TOP, P)} />
      <Feet plan={PANEL} z={0} h={P_Z0} P={P} />
      <Solid paths={k.slabOf(PANEL, P_Z0, P_H, P, 6, 1)} tone="mid" />
      <Line d={k.planOutline(k.insetPlan(PANEL, 4), P_TOP, P)} tone="faint" />
      {JACK_X.map((x, i) => (
        <g key={x}>
          <path d={GLYPH[TEAM[i].id as GlyphName]} transform={glyphOnTop(TEAM[i].id as GlyphName, [x - 7, JACK_Y + 12], P_TOP, P, 14)} fill="none" stroke={INK} strokeOpacity={0.7} vectorEffect="non-scaling-stroke" strokeWidth={0.8} />
          <Solid paths={k.cylinder(x, JACK_Y, 6.5, P_TOP, 2, P, 28)} tone="lo" />
          <Solid paths={k.cylinder(x, JACK_Y, 4.6, P_TOP + 2, 6, P, 28)} tone="mid" />
          <Line d={k.knurl(x, JACK_Y, 4.6, P_TOP + 3, P_TOP + 8, 20, P)} tone="lo" />
          <Line d={k.ring(x, JACK_Y, 1.8, P_TOP + 8, P, 16)} tone="hi" />
        </g>
      ))}
      <Engrave transform={k.sideMatrix([PANEL.x + 12, PANEL.y + PANEL.d], P_Z0 + 11, P, "left")} P={P} tone="mid">
        01 X-BIONIC TEAM
      </Engrave>

      {/* The leads: each jack to its socket on the cartridge. */}
      {JACK_X.map((x, i) => {
        const from = at([x, JACK_Y, P_TOP + 8]);
        const to = at(sockets[i]);
        const mid: k.Flat = [(from[0] + to[0]) / 2 - 18, Math.max(from[1], to[1]) + 10 - i * 6];
        return <Wire key={x} from={from} to={to} via={[mid]} tone="lit" size={1.6} />;
      })}

      {late ? (
        <Timeline />
      ) : (
        <text x={VB_W / 2} y={540} textAnchor="middle" fill={INK} fillOpacity={0.55}>
          {`AGENTS RUN ON THE CARTRIDGE · ${stage.runs.toUpperCase()}`}
        </text>
      )}
    </g>
  );
}
