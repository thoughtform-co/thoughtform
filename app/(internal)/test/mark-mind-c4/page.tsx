import type { Metadata } from "next";
import { Stage } from "./Stage";

export const metadata: Metadata = { title: "The mark is the mind · C4", robots: { index: false, follow: false } };

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The mark is the mind, C4, simplified (owner's pick 2026-10-19,
 * `docs/design/machine-mind/round-06/wave-4/c4a_gpt.png`), built so the flat
 * brand mark of a section above can become it.
 *
 *   ?mode=loop|scroll   play flat mark → drum → flat mark, or scroll it
 *   ?g=0..1             one moment of the transition (default 1, the drum)
 *   ?theme=light        the light theme
 *   ?still=1&t=<s>      the drawing alone, the clock frozen
 */
export default async function MarkMindC4Route({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const theme = one(q.theme) === "light" ? "light" : "dark";
  const m = one(q.mode);
  const mode = m === "loop" || m === "scroll" ? m : "still";
  const gq = Number(one(q.g));
  const g = one(q.g) !== undefined && Number.isFinite(gq) ? Math.min(1, Math.max(0, gq)) : 1;
  const still = one(q.still) === "1";
  const tq = one(q.t);
  const t = tq !== undefined && Number.isFinite(Number(tq)) ? Number(tq) : undefined;
  const ground = theme === "light" ? "#efe9dc" : "#0a0908";
  const dim = theme === "light" ? "rgba(42,34,20,0.62)" : "rgba(235,227,214,0.62)";
  const gold = theme === "light" ? "#8a6b20" : "#caa554";
  const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  const href = (patch: Record<string, string | undefined>) => {
    const next: Record<string, string | undefined> = { mode: mode === "still" ? undefined : mode, theme: theme === "light" ? "light" : undefined, ...patch };
    const s = Object.entries(next).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${v}`).join("&");
    return `/test/mark-mind-c4${s ? `?${s}` : ""}`;
  };
  const tab = (label: string, on: boolean, to: string) => (
    <a href={to} style={{ color: on ? gold : dim, textDecoration: "none", borderBottom: `1px solid ${on ? gold : "transparent"}`, paddingBottom: 4 }}>{label}</a>
  );
  const stage = <Stage theme={theme} g={g} mode={mode} t={t} />;
  if (still) {
    return (
      <main style={{ position: "fixed", inset: 0, background: ground, zIndex: 10001 }}>
        <style>{"nextjs-portal{display:none!important}"}</style>
        {stage}
      </main>
    );
  }
  return (
    <main style={{ background: ground, color: dim, fontFamily: mono, fontSize: 12, letterSpacing: "0.16em", minHeight: "100svh" }}>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 2, display: "flex", justifyContent: "space-between", gap: 24, padding: "20px 28px", flexWrap: "wrap" }}>
        <span>■ THE MARK IS THE MIND · C4</span>
        <nav style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {tab("DRUM", mode === "still", href({ mode: undefined }))}
          {tab("LOOP", mode === "loop", href({ mode: "loop" }))}
          {tab("SCROLL", mode === "scroll", href({ mode: "scroll" }))}
          <span style={{ opacity: 0.4 }}>·</span>
          {tab("DARK", theme === "dark", href({ theme: undefined }))}
          {tab("LIGHT", theme === "light", href({ theme: "light" }))}
        </nav>
      </header>
      {mode === "scroll" ? (
        <div style={{ height: "300svh" }}>
          <div style={{ position: "sticky", top: 0, height: "100svh" }}>{stage}</div>
        </div>
      ) : (
        <div style={{ height: "100svh" }}>{stage}</div>
      )}
    </main>
  );
}
