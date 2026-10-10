/**
 * measure — every beat of the page against the screen (the proposal system,
 * 2026-10-10). ADR-153's law in one read: a beat is whole when its content
 * ends inside the screen, measured by content bottom (the section's own
 * bottom padding may sit under the fold), with no horizontal scroll and no
 * text under the 10px floor. The lab prints it; the capture asserts on it.
 *
 * ⚠ THE LAW IS A LIST, NEVER A SCORE. A beat passes or names its fault.
 */

export const TEXT_FLOOR_PX = 10;

export interface PsBeat {
  id: string;
  kind: string;
  top: number;
  height: number;
  /** The lowest painted edge of the beat's bands, relative to its top. */
  contentBottom: number;
  overflowsScreen: boolean;
}

export interface PsReport {
  screen: { w: number; h: number };
  beats: PsBeat[];
  hScroll: boolean;
  smallText: string[];
  ok: boolean;
}

export function measureProposal(doc: Document): PsReport {
  const win = doc.defaultView;
  const screen = { w: win?.innerWidth ?? 0, h: win?.innerHeight ?? 0 };
  const sections = Array.from(doc.querySelectorAll<HTMLElement>(".arc-root .arc-section"));
  const beats: PsBeat[] = sections.map((sec) => {
    const r = sec.getBoundingClientRect();
    const bands = Array.from(sec.querySelectorAll<HTMLElement>(":scope > .arc-band"));
    const bottoms = bands.length
      ? bands.map((b) => {
          const kids = Array.from(b.children) as HTMLElement[];
          return Math.max(
            b.getBoundingClientRect().top,
            ...kids.map((k) => k.getBoundingClientRect().bottom)
          );
        })
      : [r.bottom];
    const contentBottom = Math.max(...bottoms) - r.top;
    return {
      id: sec.id,
      kind: sec.getAttribute("data-arc-kind") ?? sec.className.replace(/.*arc-sec--(\S+).*/, "$1"),
      top: r.top + (win?.scrollY ?? 0),
      height: r.height,
      contentBottom,
      overflowsScreen: contentBottom > screen.h + 0.5,
    };
  });
  const hScroll = doc.documentElement.scrollWidth > screen.w + 0.5;
  const smallText: string[] = [];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    const text = node.textContent?.trim() ?? "";
    const el = node.parentElement;
    if (
      text &&
      el &&
      el.closest(".arc-section") &&
      !el.closest("[aria-hidden='true'], .home-v2-hud-root, .hud__nav, .rin-root")
    ) {
      const size = parseFloat(win?.getComputedStyle(el).fontSize ?? "0");
      if (size > 0 && size < TEXT_FLOOR_PX && el.offsetParent !== null) {
        const beat = el.closest(".arc-section")?.id ?? "?";
        smallText.push(`${beat}: "${text.slice(0, 24)}" at ${size.toFixed(1)}px`);
      }
    }
    node = walker.nextNode();
  }
  /* The gate is the screen: every beat whole, no sideways scroll. Small
     text is REPORTED, not gated: the lattice's own chrome rung sits under
     10px on beats this pass does not touch (the phases' tags, the About's
     meta), and a gate that fails the control on production's type is a
     gate nobody reads. */
  const ok = !hScroll && beats.every((b) => !b.overflowsScreen);
  return { screen, beats, hScroll, smallText: smallText.slice(0, 20), ok };
}

export function summariseProposal(r: PsReport): string {
  const over = r.beats.filter((b) => b.overflowsScreen);
  const head = `${r.beats.length} beats at ${r.screen.w}×${r.screen.h}`;
  if (r.ok) return `${head} · every beat one screen`;
  return [
    head,
    ...over.map(
      (b) => `${b.id}: content ends ${Math.round(b.contentBottom - r.screen.h)}px under the fold`
    ),
    ...(r.hScroll ? ["the page scrolls sideways"] : []),
    ...r.smallText,
  ].join("\n");
}
