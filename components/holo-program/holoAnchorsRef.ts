/**
 * holoAnchorsRef — where each waypoint currently IS on screen.
 *
 * ⚠ THREE-FREE, and that is the whole point. The labels are real DOM text
 * (crisp PT Mono, clickable chapter links, theme-aware) but the object they
 * name is orbited freely, so their positions have to come FROM the scene
 * every frame. A module-scope ref is how the two sides talk without an
 * import edge into three — the `corridorDissipateRef` transport pattern,
 * whose own note records why this is not a CSS custom property: a per-frame
 * var write invalidates computed style for the whole subtree, and this value
 * is read by a render loop.
 *
 * ⚠ ROUND 1 HAD THIS BACKWARDS. It solved the SCENE's geometry so the rings
 * would land under DOM stations fixed at `left: var(--at)`, which is what
 * forced a single camera pose and forbade rotation. The dependency now runs
 * the honest way: the object moves, and the labels follow it.
 */

export interface HoloAnchor {
  id: string;
  /** Screen position, 0 → 1, left→right and TOP→bottom (DOM percentages,
   *  not NDC — the consumer writes them straight into a transform). */
  x: number;
  y: number;
  /** 1 at the front of the object, 0 at the back. The label layer fades and
   *  de-emphasises with it, so a name never floats brightly over a ring that
   *  is currently behind the core. */
  frontness: number;
  /** False when the point is behind the camera — the label must not paint at
   *  all, since a projected point behind the lens lands mirrored. */
  visible: boolean;
  /** Which side of the cone this label hangs from, so the DOM layer can put
   *  its tie-line on the correct edge. The rings alternate, which is what
   *  stops seven labels collapsing into one diagonal. */
  side: "up" | "dn";
}

let anchors: readonly HoloAnchor[] = [];
/** Bumped on every write, so a consumer can skip work when nothing moved. */
let version = 0;

export function publishHoloAnchors(next: readonly HoloAnchor[]): void {
  anchors = next;
  version++;
}

export function readHoloAnchors(): readonly HoloAnchor[] {
  return anchors;
}

export function holoAnchorVersion(): number {
  return version;
}

export function clearHoloAnchors(): void {
  anchors = [];
  version++;
}
