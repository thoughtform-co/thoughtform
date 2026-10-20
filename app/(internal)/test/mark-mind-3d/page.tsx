import type { Metadata } from "next";
import { MarkMindScene } from "./MarkMindScene";

export const metadata: Metadata = { title: "The mark is the mind · 3D", robots: { index: false, follow: false } };

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The mark is the mind, in 3D (owner, 2026-10-19: "our brand mark feels like
 * a flat 2D shape … why can't you make a very cool 3D scene based on our
 * brand mark?"). The brand mark extruded from its own paths; the particle
 * mind inside it.
 *
 *   ?theme=light   the light theme
 *   ?still=1       the scene alone, no chrome
 *   ?t=<seconds>   the clock frozen there
 */
export default async function MarkMind3DRoute({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const theme = one(q.theme) === "light" ? "light" : "dark";
  const still = one(q.still) === "1";
  const tq = one(q.t);
  const t = tq !== undefined && Number.isFinite(Number(tq)) ? Number(tq) : undefined;
  const ground = theme === "light" ? "#efe9dc" : "#0a0908";
  const dim = theme === "light" ? "rgba(42,34,20,0.62)" : "rgba(235,227,214,0.62)";
  const gold = theme === "light" ? "#8a6b20" : "#caa554";
  const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  return (
    <main style={{ position: "fixed", inset: 0, background: ground, zIndex: still ? 10001 : undefined }}>
      {still ? <style>{"nextjs-portal{display:none!important}"}</style> : null}
      <MarkMindScene theme={theme} still={still} t={t} />
      {still ? null : (
        <header style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "20px 28px", fontFamily: mono, fontSize: 12, letterSpacing: "0.16em", color: dim, pointerEvents: "none" }}>
          <span>■ THE MARK IS THE MIND · 3D</span>
          <nav style={{ display: "flex", gap: 20, pointerEvents: "auto" }}>
            <a href="/test/mark-mind-3d" style={{ color: theme === "dark" ? gold : dim, textDecoration: "none" }}>DARK</a>
            <a href="/test/mark-mind-3d?theme=light" style={{ color: theme === "light" ? gold : dim, textDecoration: "none" }}>LIGHT</a>
          </nav>
        </header>
      )}
    </main>
  );
}
