/**
 * seamTitleCarrier — on v3 the era title BECOMES the thesis title across the
 * seam (ADR-143 U5, owner 2026-10-04: "I want the titles from the era section
 * (eg the intelligence architect) to glitch morph and move into 'AI sits
 * somewhere between tool and collaborator'").
 *
 * ONE LEAF PER LINE, posed on the era title's own pixels at the start and on
 * the thesis title's at the end. Between the two the leaf travels, its face
 * eases from the era's (display caps, the gold glow) to the thesis's
 * (sentence case, no glow), and the house decode (`captionScramble`) turns
 * one string into the other, line by line on a cascade. The thesis title's
 * `em` words are MARKS on the leaf: their gold ink and weight from the start,
 * their wash rising as each word is spelled, so the landing frame is the real
 * title's own and the hand-over at `p` 1 is invisible.
 *
 * ⚠ A LINE PAIRS BY INDEX. The era title is one line at every capable shape
 * and the thesis title two, so the first line carries the era's name into the
 * thesis's first line and the second decodes in from blank under it. A
 * longer era title (two lines) pairs its second line with the thesis's
 * second; a shorter thesis would scramble the surplus out to nothing.
 *
 * ⚠ BOTH SEATS ARE STILL FOR THE WHOLE GLIDE: the era stage is pinned until
 * `p` 1 and the corridor's stage is held `fixed` under the flow's stamp, so
 * the layer is `fixed` too, and the landing seat follows the thesis title's
 * LIVE box frame to frame (the copy block is world-anchored by the corridor's
 * tracker, which may settle a pixel after the measure).
 *
 * REGISTER LAW (ADR-103): a display title SCRAMBLES. DOM-only, no three, no
 * scroll reads.
 */

import { textRuns } from "@/lib/home-v2/lineLeaves";

import {
  lerp,
  mixRgba,
  mixShadow,
  morphLineT,
  morphLineText,
  morphWall,
  parseRgba,
  parseShadow,
  segmentResolved,
  splitSegments,
  type Rgba,
  type Shadow,
} from "./flowClock";

interface Pt {
  x: number;
  y: number;
}

interface Seg {
  el: HTMLElement;
  start: number;
  end: number;
  mark: boolean;
}

interface MorphLine {
  el: HTMLElement;
  segs: Seg[];
  ends: number[];
  from: string;
  to: string;
  /** First glyph's origin, viewport px: the era's line, the thesis's line. */
  a: Pt;
  b: Pt;
  /** The line opens on a mark, whose left padding sits before its glyph. */
  leadMark: boolean;
}

/** One end's face. `off` is where a leaf's first glyph sits inside its own
 *  box in this face, measured, so a box can be posed from a glyph origin. */
interface Face {
  family: string;
  weight: string;
  size: number;
  lineHeight: number;
  tracking: number;
  color: Rgba | null;
  colorRaw: string;
  shadow: Shadow | null;
  off: Pt;
}

/** The thesis title's `em`: gold ink, its weight, a wash, a padding in em. */
interface Mark {
  color: string;
  weight: string;
  wash: Rgba | null;
  pad: [number, number, number, number];
}

export interface TitleMorph {
  lines: MorphLine[];
  a: Face;
  b: Face;
  mark: Mark | null;
  wall: number;
  /** The era title's text at measure time; a different one re-measures. */
  label: string;
  /** The thesis title's box at measure time, viewport px. */
  seat: Pt;
}

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
const px = (v: number) => `${v.toFixed(2)}px`;

function num(v: string, fallback: number): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function faceOf(cs: CSSStyleDeclaration): Omit<Face, "off"> {
  const size = num(cs.fontSize, 16);
  return {
    family: cs.fontFamily,
    weight: cs.fontWeight,
    size,
    lineHeight: num(cs.lineHeight, size * 1.2),
    tracking: num(cs.letterSpacing, 0),
    color: parseRgba(cs.color),
    colorRaw: cs.color,
    shadow: parseShadow(cs.textShadow),
  };
}

/** Dress an element in one end's face. */
function wearFace(el: HTMLElement, f: Omit<Face, "off">): void {
  el.style.fontFamily = f.family;
  el.style.fontWeight = f.weight;
  el.style.fontSize = px(f.size);
  el.style.lineHeight = px(f.lineHeight);
  el.style.letterSpacing = px(f.tracking);
  el.style.color = f.colorRaw;
}

/** Where a leaf's first glyph sits inside its own box, in this face. */
function glyphOffset(probe: HTMLElement, f: Omit<Face, "off">): Pt {
  wearFace(probe, f);
  probe.textContent = "Hg";
  const node = probe.firstChild;
  if (!node) return { x: 0, y: 0 };
  const range = document.createRange();
  range.setStart(node, 0);
  range.setEnd(node, 1);
  const g = range.getBoundingClientRect();
  range.detach();
  const box = probe.getBoundingClientRect();
  return { x: g.left - box.left, y: g.top - box.top };
}

interface TargetLine {
  left: number;
  top: number;
  segs: { text: string; mark: HTMLElement | null }[];
}

/**
 * The thesis title's rendered lines, each as its run of segments in reading
 * order: a word's line is its own `Range`'s top; the space between two words
 * on one line belongs to the line, the space at a break to neither.
 */
function targetLines(title: HTMLElement): TargetLine[] {
  const lines: TargetLine[] = [];
  let pending: { text: string; mark: HTMLElement | null }[] = [];
  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const node = n as Text;
    const text = node.textContent ?? "";
    const owner = node.parentElement;
    const mark = owner && owner !== title ? owner : null;
    const re = /\S+|\s+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (/^\s/.test(m[0])) {
        pending.push({ text: " ", mark });
        continue;
      }
      const range = document.createRange();
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const r = range.getBoundingClientRect();
      range.detach();
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - r.top) < 2) {
        last.segs.push(...pending, { text: m[0], mark });
      } else {
        lines.push({ left: r.left, top: r.top, segs: [{ text: m[0], mark }] });
      }
      pending = [];
    }
  }
  /* Adjacent tokens of one owner are one segment. */
  for (const line of lines) {
    const merged: TargetLine["segs"] = [];
    for (const s of line.segs) {
      const prev = merged[merged.length - 1];
      if (prev && prev.mark === s.mark) prev.text += s.text;
      else merged.push({ ...s });
    }
    line.segs = merged;
  }
  return lines;
}

function markOf(el: HTMLElement, size: number): Mark {
  const cs = getComputedStyle(el);
  const em = (v: string) => num(v, 0) / (size || 1);
  return {
    color: cs.color,
    weight: cs.fontWeight,
    wash: parseRgba(cs.backgroundColor),
    pad: [em(cs.paddingTop), em(cs.paddingRight), em(cs.paddingBottom), em(cs.paddingLeft)],
  };
}

/**
 * Everything that changes only when the page re-lays-out, or when the era
 * title says something else. `null` when either title has no box.
 * ⚠ REBUILDS THE LAYER'S CHILDREN.
 */
export function measureTitleMorph(
  layer: HTMLElement,
  eraTitle: HTMLElement,
  thesisTitle: HTMLElement
): TitleMorph | null {
  const eraBox = eraTitle.getBoundingClientRect();
  const seatBox = thesisTitle.getBoundingClientRect();
  if (!(eraBox.width > 0 && seatBox.width > 0)) return null;
  const label = eraTitle.getAttribute("aria-label") ?? eraTitle.textContent ?? "";
  const live = eraTitle.querySelector<HTMLElement>(".vwh__decode-live") ?? eraTitle;
  const csA = getComputedStyle(live);
  const faceA = faceOf(csA);
  const faceB = faceOf(getComputedStyle(thesisTitle));
  const upper = csA.textTransform === "uppercase";
  const caseA = (s: string) => (upper ? s.toUpperCase() : s);

  layer.replaceChildren();
  const wasHidden = layer.hidden;
  layer.style.visibility = "hidden";
  layer.hidden = false;
  const probe = document.createElement("span");
  probe.className = "tw-morph-line";
  layer.appendChild(probe);
  const a: Face = { ...faceA, off: glyphOffset(probe, faceA) };
  const b: Face = { ...faceB, off: glyphOffset(probe, faceB) };
  probe.remove();

  /* The era's lines, as rendered. The live span is the decode's target, so
     its text is the era's name once settled; mid-decode (an era picked
     during the exit) the title's own box stands in as its one line. */
  let src: Pt[] = [];
  let fromLines: string[] = [];
  const runs = textRuns(live).flatMap((r) => r.lines);
  if (runs.length && collapse(runs.map((l) => l.text).join(" ")) === collapse(label)) {
    src = runs.map((l) => ({ x: l.left, y: l.top }));
    fromLines = runs.map((l) => caseA(collapse(l.text)));
  } else {
    src = [{ x: eraBox.left + a.off.x, y: eraBox.top + a.off.y }];
    fromLines = [caseA(collapse(label))];
  }

  const tgt = targetLines(thesisTitle);
  if (!tgt.length) {
    layer.hidden = wasHidden;
    layer.style.removeProperty("visibility");
    return null;
  }
  const firstMark = tgt.flatMap((l) => l.segs).find((s) => s.mark)?.mark ?? null;
  const mark = firstMark ? markOf(firstMark, faceB.size) : null;

  const n = Math.max(src.length, tgt.length);
  const lines: MorphLine[] = [];
  for (let i = 0; i < n; i++) {
    const s = src[Math.min(i, src.length - 1)]!;
    const aPt = i < src.length ? s : { x: s.x, y: s.y + (i - src.length + 1) * a.lineHeight };
    const t = tgt[Math.min(i, tgt.length - 1)]!;
    const bPt =
      i < tgt.length
        ? { x: t.left, y: t.top }
        : { x: t.left, y: t.top + (i - tgt.length + 1) * b.lineHeight };
    const segsIn = i < tgt.length ? t.segs : [{ text: "", mark: null }];
    const el = document.createElement("span");
    el.className = "tw-morph-line";
    const segs: Seg[] = [];
    const ends: number[] = [];
    let off = 0;
    for (const sIn of segsIn) {
      const sEl = document.createElement("span");
      const isMark = !!sIn.mark && !!mark;
      if (isMark && mark) {
        sEl.className = "tw-morph-mark";
        sEl.style.color = mark.color;
        sEl.style.fontWeight = mark.weight;
        sEl.style.padding = mark.pad.map((v) => `${v.toFixed(4)}em`).join(" ");
      }
      el.appendChild(sEl);
      segs.push({ el: sEl, start: off, end: off + sIn.text.length, mark: isMark });
      off += sIn.text.length;
      ends.push(off);
    }
    layer.appendChild(el);
    lines.push({
      el,
      segs,
      ends,
      from: fromLines[i] ?? "",
      to: segsIn.map((x) => x.text).join(""),
      a: aPt,
      b: bPt,
      leadMark: !!segs[0]?.mark,
    });
  }

  layer.hidden = wasHidden;
  layer.style.removeProperty("visibility");
  return {
    lines,
    a,
    b,
    mark,
    wall: morphWall(lines),
    label,
    seat: { x: seatBox.left, y: seatBox.top },
  };
}

/**
 * One frame. `e` is the eased glide (position and face), `s` the decode's
 * linear progress, `seat` the thesis title's box NOW, viewport px.
 */
export function writeTitleMorph(
  layer: HTMLElement,
  m: TitleMorph,
  e: number,
  s: number,
  seat: Pt
): void {
  const { a, b } = m;
  const size = lerp(a.size, b.size, e);
  layer.style.fontFamily = e < 0.5 ? a.family : b.family;
  layer.style.fontWeight = e < 0.5 ? a.weight : b.weight;
  layer.style.fontSize = px(size);
  layer.style.lineHeight = px(lerp(a.lineHeight, b.lineHeight, e));
  layer.style.letterSpacing = px(lerp(a.tracking, b.tracking, e));
  layer.style.color =
    a.color && b.color ? mixRgba(a.color, b.color, e) : e < 0.5 ? a.colorRaw : b.colorRaw;
  layer.style.textShadow = mixShadow(a.shadow, b.shadow, e);

  const dx = seat.x - m.seat.x;
  const dy = seat.y - m.seat.y;
  const ox = lerp(a.off.x, b.off.x, e);
  const oy = lerp(a.off.y, b.off.y, e);
  const lead = m.mark ? m.mark.pad[3] * size : 0;
  m.lines.forEach((line, i) => {
    const gx = lerp(line.a.x, line.b.x + dx, e);
    const gy = lerp(line.a.y, line.b.y + dy, e);
    line.el.style.left = px(gx - ox - (line.leadMark ? lead : 0));
    line.el.style.top = px(gy - oy);
    const t = morphLineT(s, i, m.wall);
    const text = s >= 1 ? line.to : morphLineText(line.from, line.to, t);
    const parts = splitSegments(text, line.ends);
    line.segs.forEach((seg, k) => {
      const part = parts[k] ?? "";
      if (seg.el.textContent !== part) seg.el.textContent = part;
      if (seg.mark && m.mark?.wash) {
        const w = s >= 1 ? 1 : segmentResolved(t, seg.start, seg.end);
        const [r, g, bl, al] = m.mark.wash;
        seg.el.style.backgroundColor = `rgba(${r}, ${g}, ${bl}, ${(al * w).toFixed(4)})`;
      }
    });
  });
  if (layer.hidden) layer.hidden = false;
}

/** Put the layer away. */
export function parkTitleMorph(layer: HTMLElement | null): void {
  if (!layer) return;
  layer.hidden = true;
}
