import { INK, sceneSvg, type Cam, type Stage } from "./scene";

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => (v !== undefined && Number.isFinite(Number(v)) ? Number(v) : undefined);

/**
 *   ?stage=blockout|bare|full   the camera-solve blockout, the bare drum with
 *                               the mark built in, the full still (default bare)
 *   ?cam=top                    the 90° top view: the logo check
 *   ?nomark=1                   the drum with the mark taken away
 *   ?diag=1                     sector tops in flat blue (for the checks)
 *   ?solo=1                     the mark alone, no drum (for the checks)
 *   ?el= ?k= ?cx= ?cy=          camera overrides for the solve
 *   ?still=1                    the drawing alone, no chrome (for capture)
 */
export default async function MarkMindAnatomyRoute({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const s = one(q.stage);
  const stage: Stage = s === "blockout" || s === "full" ? s : "bare";
  const cam: Cam = one(q.cam) === "top" ? "top" : "hero";
  const noMark = one(q.nomark) === "1";
  const { svg } = sceneSvg({
    stage,
    cam,
    noMark,
    diag: one(q.diag) === "1",
    solo: one(q.solo) === "1",
    over: { elevation: num(one(q.el)), k: num(one(q.k)), cx: num(one(q.cx)), cy: num(one(q.cy)) },
  });
  return (
    <main
      data-mark-mind-anatomy=""
      data-ready=""
      style={{ position: "fixed", inset: 0, background: INK.ground, zIndex: 10001, display: "grid", placeItems: "center" }}
    >
      <style>{"nextjs-portal{display:none!important}"}</style>
      <div style={{ position: "relative", width: "min(100vw, 100vh)", height: "min(100vw, 100vh)" }}>
        <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </main>
  );
}
