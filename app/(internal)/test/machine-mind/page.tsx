import { DIRECTIONS, directionOf } from "./directions";
import { MindStage } from "./MindStage";
import { TONES } from "./hull";

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Six directions for the keynote brain as a machine mind, on the brain's own
 * shape, camera and kit.
 *
 *   ?v=all|d1…d6|today   all six one under another (default), or one
 *                        direction whole, parted and face on
 *   ?theme=light         the light theme's tones
 *   ?view=front          the act's face-on camera instead of the isometric
 *   ?still=1             the drawing alone, no chrome (for stills); with
 *   ?parted=1            the halves parted
 *   ?t=<seconds>         the clock frozen there (a live layer's still)
 */
export default async function MachineMindRoute({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const asked = one(q.v) ?? "all";
  const v = asked === "all" || directionOf(asked) ? asked : "all";
  const light = one(q.theme) === "light";
  const front = one(q.view) === "front";
  const still = one(q.still) === "1";
  const partedOnly = one(q.parted) === "1";
  const tq = one(q.t);
  const t = tq !== undefined && Number.isFinite(Number(tq)) ? Number(tq) : undefined;
  const tones = TONES[light ? "light" : "dark"];
  const dim = light ? "rgba(42, 34, 20, 0.62)" : "rgba(235, 227, 214, 0.62)";
  const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  const href = (patch: Partial<Record<"v" | "theme" | "view", string | undefined>>) => {
    const next = { v, theme: light ? "light" : undefined, view: front ? "front" : undefined, ...patch };
    const s = Object.entries(next)
      .filter(([k, val]) => val !== undefined && !(k === "v" && val === "all"))
      .map(([k, val]) => `${k}=${val}`)
      .join("&");
    return `/test/machine-mind${s ? `?${s}` : ""}`;
  };
  const tab = (id: string, text: string) => {
    const on = id === v;
    return (
      <a key={id} href={v === "all" && id !== "all" ? `#${id}` : href({ v: id })} style={{ color: on ? tones.gold : dim, textDecoration: "none", borderBottom: `1px solid ${on ? tones.gold : "transparent"}`, paddingBottom: 4, whiteSpace: "nowrap" }}>
        {text}
      </a>
    );
  };
  const short = (id: string) => (id === "today" ? "Today" : id.toUpperCase());

  if (still) {
    const id = v === "all" ? "d1" : v;
    const d = directionOf(id)!;
    return (
      <main style={{ minHeight: "100svh", background: tones.ground, display: "grid", placeItems: "center", padding: 24, boxSizing: "border-box" }}>
        <div style={{ width: "100%" }}>
          <MindStage id={id} front={front} light={light} parted={partedOnly} still t={t} label={`${d.name}, the machine brain`} />
        </div>
      </main>
    );
  }

  const caption = (id: string) => {
    const d = directionOf(id)!;
    return (
      <div style={{ display: "grid", gap: 6, marginTop: 20, maxWidth: "70ch" }}>
        <p style={{ margin: 0, fontFamily: mono, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: tones.gold }}>
          {short(id)} · {d.name}
        </p>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.45, color: dim }}>{d.line}</p>
      </div>
    );
  };

  return (
    <main style={{ minHeight: "100svh", background: tones.ground, color: tones.ink, padding: "40px clamp(16px, 6vw, 120px) 120px", boxSizing: "border-box", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "grid", gap: 10, marginBottom: 8 }}>
        <p style={{ margin: 0, fontFamily: mono, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: tones.gold }}>Machine mind</p>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.4, color: dim }}>Six directions for the keynote brain: the same shape, drawn as a machine.</p>
      </header>
      <nav style={{ position: "sticky", top: 0, zIndex: 2, background: tones.ground, display: "flex", flexWrap: "wrap", gap: "12px 22px", padding: "16px 0", marginBottom: 24, fontFamily: mono, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
        {v === "all" ? null : tab("all", "All")}
        {DIRECTIONS.map((d) => tab(d.id, d.id === "today" ? "Today" : `${short(d.id)} ${d.name}`))}
        <span style={{ flex: 1 }} />
        <a href={href({ theme: light ? undefined : "light" })} style={{ color: dim, textDecoration: "none" }}>
          {light ? "Dark" : "Light"}
        </a>
        <a href={href({ view: front ? undefined : "front" })} style={{ color: dim, textDecoration: "none" }}>
          {front ? "Isometric" : "Face on"}
        </a>
      </nav>
      {v === "all" ? (
        DIRECTIONS.map((d) => (
          <section key={d.id} id={d.id} style={{ scrollMarginTop: 72, marginBottom: 120 }}>
            <MindStage id={d.id} front={front} light={light} t={t} label={`${d.name}, the machine brain`} />
            {caption(d.id)}
          </section>
        ))
      ) : (
        <>
          <section style={{ marginBottom: 96 }}>
            <MindStage id={v} front={front} light={light} t={t} label={`${directionOf(v)!.name}, whole`} />
            {caption(v)}
          </section>
          <section style={{ marginBottom: 96 }}>
            <p style={{ margin: "0 0 12px", fontFamily: mono, fontSize: 12, letterSpacing: "0.18em", color: dim }}>PARTED · THE LAYER BEAT</p>
            <MindStage id={v} front={front} light={light} parted t={t} label={`${directionOf(v)!.name}, parted`} />
          </section>
          <section>
            <p style={{ margin: "0 0 12px", fontFamily: mono, fontSize: 12, letterSpacing: "0.18em", color: dim }}>{front ? "ISOMETRIC" : "FACE ON"}</p>
            <MindStage id={v} front={!front} light={light} t={t} label={`${directionOf(v)!.name}, ${front ? "isometric" : "face on"}`} />
          </section>
        </>
      )}
    </main>
  );
}
