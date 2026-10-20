import { MarkMindStage } from "./MarkMindStage";

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 *   ?floors=section|terrace   the people as floors seen in the cut, or as
 *                             terraces stepping down to the bar (default section)
 *   ?theme=light              the light theme
 *   ?el=<degrees>             the camera's elevation (default 38; 35.264 is the
 *                             swarm's true isometric)
 *   ?still=1                  the drawing alone, no chrome, the clock held
 *   ?t=<seconds>              the clock frozen there
 *   ?part=0..1                the sectors pulled apart (the deep view)
 *   ?detail=0..1              1 the offices and circuits, 0 the dot fields
 *   ?mode=scroll              the page scrolls the drum from hero to section
 *                             to deep
 */
export default async function MarkMindRoute({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const floors = one(q.floors) === "terrace" ? "terrace" : "section";
  const theme = one(q.theme) === "light" ? "light" : "dark";
  const elQ = Number(one(q.el));
  const el = Number.isFinite(elQ) && elQ > 10 && elQ < 80 ? elQ : 38;
  const still = one(q.still) === "1";
  const tq = one(q.t);
  const t = tq !== undefined && Number.isFinite(Number(tq)) ? Number(tq) : undefined;
  const ground = theme === "light" ? "#efe9dc" : "#0a0908";
  const inkDim = theme === "light" ? "rgba(42,34,20,0.62)" : "rgba(235,227,214,0.62)";
  const gold = theme === "light" ? "#8a6b20" : "#caa554";
  const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  const unit = (v: string | undefined, d: number) => {
    const n = Number(v);
    return v !== undefined && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : d;
  };
  const part = unit(one(q.part), 0);
  const detail = unit(one(q.detail), 1);
  const scrolling = one(q.mode) === "scroll";

  const stage = <MarkMindStage theme={theme} floors={floors} el={el} still={still} t={t} part={part} detail={detail} scroll={scrolling} />;
  if (still) {
    // the still covers the dev chrome (the env banner, the Next badge) so a capture is the drawing alone
    return (
      <main style={{ position: "fixed", inset: 0, background: ground, zIndex: 10001 }}>
        <style>{"nextjs-portal{display:none!important}"}</style>
        {stage}
      </main>
    );
  }

  const href = (patch: Record<string, string | undefined>) => {
    const next: Record<string, string | undefined> = { floors: floors === "section" ? undefined : floors, theme: theme === "light" ? "light" : undefined, el: el === 38 ? undefined : String(el), ...patch };
    const s = Object.entries(next)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return `/test/mark-mind${s ? `?${s}` : ""}`;
  };
  const tab = (label: string, on: boolean, to: string) => (
    <a href={to} style={{ color: on ? gold : inkDim, textDecoration: "none", borderBottom: `1px solid ${on ? gold : "transparent"}`, paddingBottom: 4 }}>
      {label}
    </a>
  );

  return (
    <main style={{ minHeight: "100svh", background: ground, color: inkDim, fontFamily: mono, fontSize: 12, letterSpacing: "0.16em", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 24, padding: "20px 28px", flexWrap: "wrap" }}>
        <span>■ THE MARK IS THE MIND · BUILD LAB · P1</span>
        <nav style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {tab("FLOORS IN SECTION", floors === "section", href({ floors: undefined }))}
          {tab("TERRACES", floors === "terrace", href({ floors: "terrace" }))}
          <span style={{ opacity: 0.4 }}>·</span>
          {tab("DARK", theme === "dark", href({ theme: undefined }))}
          {tab("LIGHT", theme === "light", href({ theme: "light" }))}
          <span style={{ opacity: 0.4 }}>·</span>
          {tab("38°", el === 38, href({ el: undefined }))}
          {tab("ISOMETRIC", Math.abs(el - 35.264) < 0.01, href({ el: "35.264" }))}
          <span style={{ opacity: 0.4 }}>·</span>
          {tab("STILL VIEW", !scrolling, href({ mode: undefined }))}
          {tab("SCROLL", scrolling, href({ mode: "scroll" }))}
        </nav>
      </header>
      {scrolling ? (
        <div style={{ height: "400svh", position: "relative" }}>
          <div style={{ position: "sticky", top: 0, height: "100svh" }}>
            {stage}
            <div style={{ position: "absolute", left: 28, bottom: 24, display: "flex", gap: 24, letterSpacing: "0.2em" }}>
              <span>01 HERO</span>
              <span>02 SECTION</span>
              <span>03 DEEP</span>
              <span style={{ opacity: 0.6 }}>SCROLL ↓</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, height: "calc(100svh - 64px)" }}>{stage}</div>
      )}
    </main>
  );
}
