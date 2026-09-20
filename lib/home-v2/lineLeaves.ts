/**
 * lineLeaves — the rendered LINE BOXES of a text run, and a leaf dressed in
 * the run's own face (ADR-103's `headCarrier` idiom, lifted for ADR-115).
 *
 * A decode that writes a run's `textContent` re-wraps it: the shuffle's
 * glyphs are mono caps against a proportional face, so a decoding line is
 * wider than its resting self, and a CENTRED line re-centres on every frame.
 * The answer is to decode a run on one absolutely positioned leaf PER
 * RENDERED LINE, posed on that line's own pixels with `white-space: nowrap`,
 * over a ghost that keeps holding the true box. `lineBoxes` finds the lines
 * — every word's `Range` rect, grouped by the line it sits on — and `dress`
 * copies the run's computed face onto a leaf, once per measure.
 *
 * ⚠ A `Range` rect is the glyph CONTENT area, not the line box: a leaf is a
 * block with the run's own `line-height`, so its glyphs land on the source's
 * pixels only once the half-leading is subtracted from its top — the caller
 * does that with `lineHeight` from the run's computed style.
 *
 * DOM-only (a `Range` and a `Text`), no three, no scroll reads: the two
 * hosts are the phone's services band and about band, both inside the
 * landing's First Load JS.
 */

export interface Line {
  /** The node's own substring, exactly as the browser broke it. */
  text: string;
  /** Viewport-space left / top of the line's first glyph box. */
  left: number;
  top: number;
  /** The tallest word rect on the line (the content area's height). */
  height: number;
}

/**
 * The rendered lines of one text node: every word's rect, grouped by the
 * line it sits on. The line's text is the node's own substring from its
 * first word's start to its last word's end, so a line reads exactly as the
 * browser broke it.
 */
export function lineBoxes(node: Text): Line[] {
  const text = node.textContent ?? "";
  const lines: (Line & { end: number; start: number })[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const range = document.createRange();
    range.setStart(node, m.index);
    range.setEnd(node, m.index + m[0].length);
    const r = range.getBoundingClientRect();
    range.detach();
    if (r.width === 0 && r.height === 0) continue;
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.top - r.top) < 2) {
      last.end = m.index + m[0].length;
      last.left = Math.min(last.left, r.left);
      last.height = Math.max(last.height, r.height);
    } else {
      lines.push({
        text: "",
        start: m.index,
        end: m.index + m[0].length,
        left: r.left,
        top: r.top,
        height: r.height,
      });
    }
  }
  return lines.map((l) => ({
    text: text.slice(l.start, l.end),
    left: l.left,
    top: l.top,
    height: l.height,
  }));
}

/** Write the run's face onto a leaf, once. */
export function dress(leaf: HTMLElement, cs: CSSStyleDeclaration): void {
  leaf.style.fontFamily = cs.fontFamily;
  leaf.style.fontSize = cs.fontSize;
  leaf.style.fontWeight = cs.fontWeight;
  leaf.style.lineHeight = cs.lineHeight;
  leaf.style.letterSpacing = cs.letterSpacing;
  leaf.style.textTransform = cs.textTransform;
  leaf.style.color = cs.color;
  leaf.style.textShadow = cs.textShadow;
}

/** The first non-blank Text child of an element — a title's own run beside
 *  its `<em>` or `<strong>` children. */
export function firstText(el: Element | null): Text | null {
  if (!el) return null;
  for (const n of el.childNodes) {
    if (n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim()) return n as Text;
  }
  return null;
}

/**
 * The rendered lines of EVERY text node under an element, in document
 * order — a paragraph with `<strong>` and `<em>` runs inside it is several
 * text nodes on the same lines. Each node's lines come back with the node
 * that owns them, so a caller can dress each leaf in its own run's face
 * (the `em` keeps its gold) and merge adjacent lines by `top`.
 */
export function textRuns(el: Element): Array<{ node: Text; el: HTMLElement; lines: Line[] }> {
  const out: Array<{ node: Text; el: HTMLElement; lines: Line[] }> = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n: Node | null = walker.nextNode();
  while (n) {
    const node = n as Text;
    if ((node.textContent ?? "").trim()) {
      const owner = (node.parentElement ?? el) as HTMLElement;
      out.push({ node, el: owner, lines: lineBoxes(node) });
    }
    n = walker.nextNode();
  }
  return out;
}
