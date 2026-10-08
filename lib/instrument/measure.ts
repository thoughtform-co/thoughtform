/**
 * measure — `useFitReadout`'s law moved to the DOM (ADR-154).
 *
 * One read of the live page: every instrument on it, every box the grammar
 * names (panel, chip, pin, station, label), and three faults a drawing can
 * carry: two boxes that overlap and are not one inside the other, a box that
 * leaves its housing, and text rendered under the 10px floor. The lab prints
 * it; the capture asserts on it; `tests/visual/instrument-fit.spec.ts` runs it
 * at the binding viewport in both themes.
 *
 * ⚠ THE LAW IS A LIST, NEVER A SCORE. A figure passes or names its faults.
 */

export const TEXT_FLOOR_PX = 10;
export const OVERLAP_TOLERANCE_PX = 0.5;

export interface InsBox {
  figure: string;
  kind: string;
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InsCollision {
  figure: string;
  a: string;
  b: string;
  /** The overlap, in px. */
  dx: number;
  dy: number;
}

export interface InsReport {
  figures: string[];
  boxes: InsBox[];
  collisions: InsCollision[];
  overflow: string[];
  smallText: string[];
  ok: boolean;
}

const BOX_SELECTOR = ".ins-panel, .ins-chip, .ins-pin, .ins-station, .ins-node, .ins-label";

function rectOf(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

export function measureInstrument(doc: Document): InsReport {
  const figures = Array.from(doc.querySelectorAll<HTMLElement>("[data-ins]"));
  const boxes: InsBox[] = [];
  const collisions: InsCollision[] = [];
  const overflow: string[] = [];
  const smallText: string[] = [];
  const names: string[] = [];

  figures.forEach((fig, fi) => {
    const figure = fig.dataset.ins || `figure-${fi + 1}`;
    names.push(figure);
    const root = rectOf(fig);
    const els = Array.from(fig.querySelectorAll<HTMLElement>(BOX_SELECTOR)).filter(
      (el) => el.offsetParent !== null
    );
    const local: { el: HTMLElement; box: InsBox }[] = [];
    els.forEach((el, i) => {
      const r = rectOf(el);
      const kind = el.className.split(" ").find((c) => c.startsWith("ins-")) ?? "ins";
      const id = el.dataset.insPart ?? el.dataset.insId ?? `${kind}-${i + 1}`;
      const box = { figure, kind, id, ...r };
      boxes.push(box);
      local.push({ el, box });
      if (
        r.w > 0 &&
        (r.x < root.x - OVERLAP_TOLERANCE_PX || r.x + r.w > root.x + root.w + OVERLAP_TOLERANCE_PX)
      ) {
        overflow.push(`${figure}: ${id} leaves the figure horizontally`);
      }
    });
    for (let i = 0; i < local.length; i += 1) {
      for (let j = i + 1; j < local.length; j += 1) {
        const A = local[i];
        const B = local[j];
        if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
        const dx = Math.min(A.box.x + A.box.w, B.box.x + B.box.w) - Math.max(A.box.x, B.box.x);
        const dy = Math.min(A.box.y + A.box.h, B.box.y + B.box.h) - Math.max(A.box.y, B.box.y);
        if (dx > OVERLAP_TOLERANCE_PX && dy > OVERLAP_TOLERANCE_PX) {
          collisions.push({
            figure,
            a: A.box.id,
            b: B.box.id,
            dx: Math.round(dx),
            dy: Math.round(dy),
          });
        }
      }
    }
    const view = doc.defaultView;
    if (view) {
      fig.querySelectorAll<HTMLElement>("*").forEach((el) => {
        if (!el.textContent?.trim() || el.children.length) return;
        const px = parseFloat(view.getComputedStyle(el).fontSize);
        if (px && px < TEXT_FLOOR_PX) {
          smallText.push(
            `${figure}: "${el.textContent.trim().slice(0, 24)}" at ${px.toFixed(1)}px`
          );
        }
      });
    }
  });

  return {
    figures: names,
    boxes,
    collisions,
    overflow,
    smallText,
    ok: collisions.length === 0 && overflow.length === 0 && smallText.length === 0,
  };
}

export function summariseInstrument(r: InsReport): string {
  const head = `${r.figures.length} figure${r.figures.length === 1 ? "" : "s"} · ${r.boxes.length} boxes`;
  if (r.ok) return `${head} · clean`;
  return [
    head,
    ...r.collisions.map((c) => `collide ${c.figure}: ${c.a} × ${c.b} (${c.dx}×${c.dy})`),
    ...r.overflow,
    ...r.smallText,
  ].join("\n");
}
