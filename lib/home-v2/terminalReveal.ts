// Terminal decode-scramble reveal — used by the corridor section menu
// (CorridorSectionMenu) so its nav items "boot in" like a console decoding
// text rather than plainly fading. Each element's characters cycle through
// random glyphs and resolve LEFT-TO-RIGHT over `dur` ms after `delay` ms.
//
// The menu is PT Mono, so every glyph is the same width — the scramble
// never changes an element's box, so there is zero layout thrash even
// while the WebGL corridor is rendering. Spaces stay fixed (word shape is
// legible mid-decode). Callers stagger `delay` by row for a print cascade.

/** Console-ish glyph pool (uppercased already; the menu is upper-cased in
 *  CSS anyway). Mix of letters, digits and a few HUD symbols. */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]=+*·";

/**
 * Decode-scramble `el`'s current text. Returns a cleanup that cancels the
 * animation and restores the original text (call on re-trigger / unmount).
 * A no-op cleanup is returned for empty elements.
 */
export function scrambleText(el: HTMLElement, delay: number, dur: number): () => void {
  const target = el.textContent ?? "";
  const len = target.length;
  if (len === 0) return () => {};

  let raf = 0;
  let startAt = 0; // stamped on the first frame so `delay` is real-time

  const frame = (now: number) => {
    if (startAt === 0) startAt = now + delay;
    const t = Math.max(0, Math.min(1, (now - startAt) / dur));
    const resolved = Math.floor(t * len);
    let out = "";
    for (let i = 0; i < len; i++) {
      const ch = target[i];
      out += i < resolved || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (t < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      el.textContent = target;
    }
  };

  raf = requestAnimationFrame(frame);
  return () => {
    if (raf) cancelAnimationFrame(raf);
    el.textContent = target;
  };
}
