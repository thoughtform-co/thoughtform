"use client";

import { useEffect } from "react";

/**
 * ToolsTitleTypewriter — reversible terminal type-on for the fixed Tools
 * headline ("Bottlenecks removed, one tool at a time.").
 *
 * The title lives in the parsed station shell (outside the cards root).
 * On the capable desktop path this null leaf takes the `<h2>` over: it
 * splits the authored copy into per-character spans (preserving the `<br>`
 * line break and the gold `<em>` accent) and types them in left-to-right
 * with a block caret riding the typing head when `#tools` becomes the
 * active station. On exit it re-arms so the next entry re-types cleanly.
 *
 * Below the capability gate (mobile / short viewport / reduced-motion) the
 * authored markup is left untouched — the CSS clip-path reveal and the
 * static header layout stay exactly as before. Chars occupy their box from
 * the first frame (opacity-only reveal) so nothing reflows; the caret is an
 * absolutely-positioned `::after` on the head char, so it adds no layout.
 */

/** Characters per second — a readable terminal type-on for the display
 *  heading (the ~39-char title clears in ~1.1s). Slower than the corridor's
 *  snappy flush so the type-on reads as a deliberate typewriter. */
const TYPE_CPS = 36;
/** Seconds the type-on waits after the station arms, so the fixed head has
 *  begun its fade-in before the first glyph lands. */
const START_DELAY_S = 0.08;

interface CharToken {
  ch: string;
  em: boolean;
}

/** Tokenize one authored line (already `<br>`-split) into char tokens,
 *  tagging chars inside an `<em>` so the gold accent survives. Any other
 *  tag is dropped — the title copy stays to the single-`<em>` shape. */
function tokenizeLine(raw: string): CharToken[] {
  const tokens: CharToken[] = [];
  let i = 0;
  let em = false;
  while (i < raw.length) {
    if (raw[i] === "<") {
      const close = raw.indexOf(">", i);
      if (close === -1) break;
      const tag = raw
        .slice(i + 1, close)
        .toLowerCase()
        .trim();
      if (tag === "em") em = true;
      else if (tag === "/em") em = false;
      i = close + 1;
      continue;
    }
    tokens.push({ ch: raw[i] ?? "", em });
    i += 1;
  }
  return tokens;
}

export function ToolsTitleTypewriter() {
  useEffect(() => {
    const title = document.querySelector<HTMLElement>("#tools .tools__title");
    if (!title) return;

    const html = document.documentElement;
    const enhanced = window.matchMedia(
      "(min-width: 1101px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)"
    );

    // Authored markup captured BEFORE any takeover, so the reduced-motion /
    // capability-lost path can restore it verbatim.
    const originalHtml = title.innerHTML;
    const lines = originalHtml
      .split(/<br\s*\/?>/i)
      .map((line) => tokenizeLine(line.trim()))
      .filter((line) => line.length > 0);
    const plain = lines.map((line) => line.map((t) => t.ch).join("")).join(" ");

    let charSpans: HTMLElement[] = [];
    let headEl: HTMLElement | null = null;
    let built = false;
    let raf = 0;
    let startSec = 0;
    let armed = true;

    const build = () => {
      if (built || lines.length === 0) return;
      const wrap = document.createElement("span");
      wrap.setAttribute("aria-hidden", "true");
      charSpans = [];
      lines.forEach((tokens, li) => {
        const lineEl = document.createElement("span");
        lineEl.className = "tools__tw-line";
        for (const tok of tokens) {
          const span = document.createElement("span");
          span.className = tok.em ? "tools__tw-char tools__tw-char--em" : "tools__tw-char";
          span.textContent = tok.ch;
          lineEl.appendChild(span);
          charSpans.push(span);
        }
        wrap.appendChild(lineEl);
        // No trailing <br>: each line is a block-level row (see CSS).
        void li;
      });
      title.setAttribute("aria-label", plain);
      title.setAttribute("data-tw", "");
      title.textContent = "";
      title.appendChild(wrap);
      built = true;
    };

    const restore = () => {
      if (!built) return;
      title.removeAttribute("aria-label");
      title.removeAttribute("data-tw");
      title.innerHTML = originalHtml;
      charSpans = [];
      headEl = null;
      built = false;
    };

    const setHead = (el: HTMLElement | null) => {
      if (headEl === el) return;
      if (headEl) headEl.classList.remove("tools__tw-char--head");
      headEl = el;
      if (headEl) headEl.classList.add("tools__tw-char--head");
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const frame = () => {
      const elapsed = performance.now() / 1000 - startSec;
      const head = elapsed * TYPE_CPS;
      let done = true;
      for (let i = 0; i < charSpans.length; i++) {
        const local = head - i;
        if (local >= 1) {
          charSpans[i].style.opacity = "1";
        } else if (local > 0) {
          charSpans[i].style.opacity = local.toFixed(3);
          done = false;
        } else {
          charSpans[i].style.opacity = "0";
          done = false;
        }
      }
      if (charSpans.length > 0) {
        const hi = Math.min(charSpans.length - 1, Math.max(0, Math.floor(head)));
        setHead(charSpans[hi] ?? null);
      }
      if (done) {
        setHead(charSpans[charSpans.length - 1] ?? null);
        raf = 0;
      } else {
        raf = requestAnimationFrame(frame);
      }
    };

    const startTyping = () => {
      stop();
      for (const span of charSpans) span.style.opacity = "0";
      setHead(null);
      startSec = performance.now() / 1000 + START_DELAY_S;
      raf = requestAnimationFrame(frame);
    };

    const update = () => {
      if (!enhanced.matches) {
        // Mobile / short / reduced-motion: hand the authored copy back and
        // let the base CSS reveal own it.
        stop();
        armed = true;
        restore();
        return;
      }
      build();
      const active = html.getAttribute("data-active-station") === "tools";
      if (!active) {
        // CSS owns the fixed head's opacity exit. Leave the typed glyphs in
        // place while it fades so a reverse-scroll never blanks the title a
        // frame early; the next arrival re-arms the type-on.
        stop();
        armed = true;
        return;
      }
      if (!armed) return;
      armed = false;
      startTyping();
    };

    const observer = new MutationObserver(update);
    observer.observe(html, { attributes: true, attributeFilter: ["data-active-station"] });
    enhanced.addEventListener("change", update);
    update();

    return () => {
      observer.disconnect();
      enhanced.removeEventListener("change", update);
      stop();
      restore();
    };
  }, []);

  return null;
}
