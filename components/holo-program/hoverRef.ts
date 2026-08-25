/**
 * hoverRef — the DOM stations' hover/focus, carried to the scene.
 *
 * ⚠ THREE-FREE, and that is the whole point. The stations are server-rendered
 * DOM inside `components/arcs`, which may not import three; a module-scope ref
 * is how the two sides talk without an import edge (the `corridorDissipateRef`
 * transport pattern, whose own note records why this is not a CSS custom
 * property: a per-frame var write invalidates computed style for the whole
 * subtree, and this value is read by a render loop, not by CSS).
 *
 * ⚠ It carries an ID, never an index. Reordering the course would otherwise
 * light the wrong ring silently.
 */

let hovered: string | null = null;

export function setHoloHover(id: string | null): void {
  hovered = id;
}

export function readHoloHover(): string | null {
  return hovered;
}

/** Reset on unmount, so a remount does not open with a stale ring lit. */
export function clearHoloHover(): void {
  hovered = null;
}
