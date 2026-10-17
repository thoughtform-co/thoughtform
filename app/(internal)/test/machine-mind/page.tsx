import { DIRECTIONS, directionOf, LATEST, type MindDirection } from "./directions";
import { MindStage } from "./MindStage";
import { TONES } from "./hull";

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Directions for the keynote brain as a machine mind, on the brain's own
 * shape, camera and kit, the newest round first.
 *
 *   ?v=all|e1…|d1…d6|today   every direction one under another, newest round
 *                            first (default), or one direction whole, parted
 *                            and face on
 *   ?theme=light             the light theme's tones
 *   ?view=front              the act's face-on camera instead of the isometric
 *   ?still=1                 the drawing alone, no chrome (for stills); with
 *   ?parted=1                the halves parted
 *   ?t=<seconds>             the clock frozen there (a live layer's still)
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

  // the rounds, newest first; today's brain closes the page
  const rounds = [...new Set(DIRECTIONS.map((d) => d.round).filter((r): r is number => r !== undefined))].sort((a, b) => b - a);
  const inRound = (r: number) => DIRECTIONS.filter((d) => d.round === r);
  const reference = DIRECTIONS.filter((d) => d.round === undefined);
  const roundName = (r: number) => `Round ${r}${r === LATEST ? " · latest" : ""}`;

  const href = (patch: Partial<Record<"v" | "theme" | "view", string | undefined>>) => {
    const next = { v, theme: light ? "light" : undefined, view: front ? "front" : undefined, ...patch };
    const s = Object.entries(next)
      .filter(([k, val]) => val !== undefined && !(k === "v" && val === "all"))
      .map(([k, val]) => `${k}=${val}`)
      .join("&");
    return `/test/machine-mind${s ? `?${s}` : ""}`;
  };
  const short = (d: MindDirection) => (d.id === "today" ? "Today" : d.id.toUpperCase());
  const tab = (d: MindDirection) => {
    const on = d.id === v;
    return (
      <a key={d.id} href={v === "all" ? `#${d.id}` : href({ v: d.id })} style={{ color: on ? tones.gold : dim, textDecoration: "none", borderBottom: `1px solid ${on ? tones.gold : "transparent"}`, paddingBottom: 4, whiteSpace: "nowrap" }}>
        {d.id === "today" ? "Today" : `${short(d)} ${d.name}`}
      </a>
    );
  };

  if (still) {
    const id = v === "all" ? DIRECTIONS[0].id : v;
    const d = directionOf(id)!;
    return (
      <main style={{ minHeight: "100svh", background: tones.ground, display: "grid", placeItems: "center", padding: 24, boxSizing: "border-box" }}>
        <div style={{ width: "100%" }}>
          <MindStage id={id} front={front} light={light} parted={partedOnly} still t={t} label={`${d.name}, the machine brain`} />
        </div>
      </main>
    );
  }

  /** The direction's name, over the figure. */
  const label = (d: MindDirection) => (
    <p style={{ margin: "0 0 16px", fontFamily: mono, fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", color: tones.gold }}>
      {short(d)} · {d.name}
    </p>
  );
  /** Its one line, under it. */
  const line = (d: MindDirection) => <p style={{ margin: "20px 0 0", maxWidth: "70ch", fontSize: 17, lineHeight: 1.45, color: dim }}>{d.line}</p>;
  const roundHead = (r: number | null) => (
    <p style={{ margin: "0 0 40px", fontFamily: mono, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: r === LATEST ? tones.gold : dim, borderTop: `1px solid ${dim}`, paddingTop: 14, opacity: 0.9 }}>
      {r === null ? "For reference" : roundName(r)}
    </p>
  );

  return (
    <main style={{ minHeight: "100svh", background: tones.ground, color: tones.ink, padding: "40px clamp(16px, 6vw, 120px) 120px", boxSizing: "border-box", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "grid", gap: 10, marginBottom: 8 }}>
        <p style={{ margin: 0, fontFamily: mono, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: tones.gold }}>Machine mind</p>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.4, color: dim }}>The keynote brain drawn as a machine, the newest round first.</p>
      </header>
      <nav style={{ position: "sticky", top: 0, zIndex: 2, background: tones.ground, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "12px 22px", padding: "16px 0", marginBottom: 24, fontFamily: mono, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
        {v === "all" ? null : (
          <a href={href({ v: "all" })} style={{ color: dim, textDecoration: "none" }}>
            All
          </a>
        )}
        {rounds.map((r) => (
          <span key={r} style={{ display: "inline-flex", flexWrap: "wrap", gap: "12px 22px", alignItems: "baseline" }}>
            <span style={{ color: r === LATEST ? tones.gold : dim, opacity: 0.75 }}>{r === LATEST ? `R${r} latest` : `R${r}`}</span>
            {inRound(r).map(tab)}
          </span>
        ))}
        {reference.map(tab)}
        <span style={{ flex: 1 }} />
        <a href={href({ theme: light ? undefined : "light" })} style={{ color: dim, textDecoration: "none" }}>
          {light ? "Dark" : "Light"}
        </a>
        <a href={href({ view: front ? undefined : "front" })} style={{ color: dim, textDecoration: "none" }}>
          {front ? "Isometric" : "Face on"}
        </a>
      </nav>
      {v === "all" ? (
        <>
          {[...rounds.map((r) => ({ r, list: inRound(r) })), { r: null, list: reference }].map(({ r, list }) => (
            <div key={r ?? "ref"} style={{ marginBottom: 40 }}>
              {roundHead(r)}
              {list.map((d) => (
                <section key={d.id} id={d.id} style={{ scrollMarginTop: 72, marginBottom: 120 }}>
                  {label(d)}
                  <MindStage id={d.id} front={front} light={light} t={t} label={`${d.name}, the machine brain`} />
                  {line(d)}
                </section>
              ))}
            </div>
          ))}
        </>
      ) : (
        <>
          <section style={{ marginBottom: 96 }}>
            {label(directionOf(v)!)}
            <MindStage id={v} front={front} light={light} t={t} label={`${directionOf(v)!.name}, whole`} />
            {line(directionOf(v)!)}
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
