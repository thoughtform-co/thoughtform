import { BRAIN_VIEW_ISO, brainIsoBox, brainIsoPoint, brainIsoSvg, type BrainChip } from "@/components/arcs/figures/foundation/brainIso";

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** The directions, each a set of `brainIso`'s `chip` options. */
const DIRECTIONS: Record<string, { name: string; chip: BrainChip; line: string }> = {
  base: { name: "Today", chip: {}, line: "The brain as the page draws it now: the machine on the crowns alone." },
  b1: {
    name: "B1 · Wafer terraces",
    chip: { wafer: true },
    line: "A scribe line round every plate, die pads on the upper rims, bond pads round each crown's board wired up to it in gold.",
  },
  b2: {
    name: "B2 · Gold woven through",
    chip: { wafer: true, weave: true },
    line: "B1, and gold traces stepping down the terraces from the crown, a via at every step.",
  },
  b3: {
    name: "B3 · Die walls",
    chip: { wafer: true, weave: true, die: true },
    line: "B2, and the medial walls flat, each a die's face: it shows when the halves part.",
  },
};
const ORDER = ["b1", "b2", "b3", "base"] as const;

/** How far each half moves out along L when the brain parts, brain units (the act's `LAYER_PART`). */
const PART = 175;

const uri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/**
 * The machine brain, one direction at a time, whole and parted, at the act's
 * isometric.
 *
 *   ?v=b1|b2|b3|base     the direction (default b1)
 *   ?theme=light         the light theme's tones
 *   ?still=1             no chrome (for stills)
 */
export default async function KeynoteBrainRoute({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const asked = one(q.v) ?? "b1";
  const v = asked in DIRECTIONS ? asked : "b1";
  const light = one(q.theme) === "light";
  const still = one(q.still) === "1";
  const d = DIRECTIONS[v];
  const tones = light
    ? { ink: "#2a2214", gold: "#8a6b20", lit: "#6e5216", green: "rgb(70, 108, 58)" }
    : { ink: "#ebe3d6", gold: "#caa554", lit: "#f0c86a", green: "rgb(122, 158, 106)" };
  const opts = { base: "tendrils" as const, chip: d.chip, light, ...tones };
  const B = brainIsoBox(BRAIN_VIEW_ISO);
  const w = B.x1 - B.x0;
  const h = B.y1 - B.y0;
  const o = brainIsoPoint(0, 0, 0);
  const l1 = brainIsoPoint(1, 0, 0);
  const ux = (l1[0] - o[0]) * PART;
  const uy = (l1[1] - o[1]) * PART;
  const pad = 24;
  const parted = {
    x0: B.x0 - Math.abs(ux) - pad,
    y0: B.y0 - Math.abs(uy) - pad,
    w: w + 2 * Math.abs(ux) + 2 * pad,
    h: h + 2 * Math.abs(uy) + 2 * pad,
  };
  const ground = light ? "#efe9dc" : "#0a0908";
  const ink = light ? "#2a2214" : "#ebe3d6";
  const dim = light ? "rgba(42, 34, 20, 0.6)" : "rgba(235, 227, 214, 0.6)";
  const link = (id: string, label: string, extra = "") => (
    <a
      key={id + extra}
      href={`/test/keynote-brain?v=${id}${light ? "&theme=light" : ""}${extra}`}
      style={{ color: id === v ? tones.gold : dim, textDecoration: "none", borderBottom: id === v ? `1px solid ${tones.gold}` : "1px solid transparent", paddingBottom: 4 }}
    >
      {label}
    </a>
  );
  const figure = { display: "block", width: "100%", height: "auto", maxHeight: "86svh" } as const;
  return (
    <main style={{ minHeight: "100svh", background: ground, color: ink, padding: "48px clamp(16px, 6vw, 120px) 96px", boxSizing: "border-box", fontFamily: "system-ui, sans-serif" }}>
      {still ? null : (
        <header style={{ display: "grid", gap: 12, marginBottom: 32 }}>
          <p style={{ margin: 0, fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: tones.gold }}>Keynote brain · {d.name}</p>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.4, maxWidth: "60ch", color: dim }}>{d.line}</p>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 24, fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            {ORDER.map((id) => link(id, DIRECTIONS[id].name))}
            <a href={`/test/keynote-brain?v=${v}${light ? "" : "&theme=light"}`} style={{ color: dim, textDecoration: "none" }}>
              {light ? "Dark" : "Light"}
            </a>
          </nav>
        </header>
      )}
      <section aria-label="Whole" style={{ display: "grid", gap: 12 }}>
        {still ? null : <p style={{ margin: 0, fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.2em", color: dim }}>WHOLE</p>}
        {/* eslint-disable-next-line @next/next/no-img-element -- a generated SVG, not a photo */}
        <img src={uri(brainIsoSvg(opts))} alt={`The machine brain whole, ${d.name}`} style={figure} />
      </section>
      <section aria-label="Parted" style={{ display: "grid", gap: 12, marginTop: 64 }}>
        {still ? null : <p style={{ margin: 0, fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.2em", color: dim }}>PARTED · THE LAYER BEAT</p>}
        <svg viewBox={`${parted.x0} ${parted.y0} ${parted.w} ${parted.h}`} role="img" aria-label={`The machine brain parted, ${d.name}`} style={figure}>
          {/* far half first: +L is up the screen at this camera */}
          <image href={uri(brainIsoSvg({ ...opts, only: uy < 0 ? 1 : -1 }))} x={B.x0 + (uy < 0 ? ux : -ux)} y={B.y0 + (uy < 0 ? uy : -uy)} width={w} height={h} />
          <image href={uri(brainIsoSvg({ ...opts, only: uy < 0 ? -1 : 1 }))} x={B.x0 - (uy < 0 ? ux : -ux)} y={B.y0 - (uy < 0 ? uy : -uy)} width={w} height={h} />
        </svg>
      </section>
    </main>
  );
}
