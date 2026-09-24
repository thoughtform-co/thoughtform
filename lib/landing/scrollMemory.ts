/**
 * Where the reader was (ADR-123 §Part 1, commit A).
 *
 * The landing runs `history.scrollRestoration = "manual"`: the browser's own
 * restore fires before the corridor chunk has landed and before the pile has
 * split, against a document that is still short, and clamps the reader to
 * wherever the page happened to end at that instant — the "lands at the
 * bottom" the owner saw after a reload in the proof section. This module is
 * the memory half; `ScrollRestoration.tsx` is the replay, which waits for the
 * document to reach the remembered height before it moves.
 *
 * Three-free and DOM-only. Every storage access is wrapped: a private tab
 * must not turn a convenience into a crash.
 */

import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";

export interface ScrollMemory {
  /** Document y at the last write. */
  y: number;
  /** `scrollHeight` at that write — the replay waits for the document to
   *  reach it, since a restore against a shorter document clamps. */
  docH: number;
  /** Viewport at the write, so a rotation is recognised and the record
   *  dropped rather than replayed into a different layout. */
  vw: number;
  vh: number;
  /** Wall-clock of the write. */
  t: number;
}

/** A record older than this is not replayed — the reader came back, not
 *  the page. */
export const SCROLL_MEMORY_MAX_AGE_MS = 30 * 60 * 1000;
/** A width change beyond this is a rotation (or a resize): drop the record. */
export const SCROLL_MEMORY_ROTATION_PX = 40;
/** Writes are coalesced to at most this often (plus `pagehide`). */
const WRITE_MS = 250;

export function scrollMemoryKey(pathname: string): string {
  return `tf-scroll:${pathname}`;
}

export function readScrollMemory(pathname: string): ScrollMemory | null {
  try {
    const raw = window.sessionStorage.getItem(scrollMemoryKey(pathname));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScrollMemory>;
    if (
      typeof parsed.y !== "number" ||
      typeof parsed.docH !== "number" ||
      typeof parsed.vw !== "number" ||
      typeof parsed.vh !== "number" ||
      typeof parsed.t !== "number"
    )
      return null;
    return parsed as ScrollMemory;
  } catch {
    return null;
  }
}

export function writeScrollMemory(pathname: string): void {
  try {
    const rec: ScrollMemory = {
      y: Math.round(window.scrollY),
      docH: document.documentElement.scrollHeight,
      vw: window.innerWidth,
      vh: layoutViewportHeight(),
      t: Date.now(),
    };
    window.sessionStorage.setItem(scrollMemoryKey(pathname), JSON.stringify(rec));
  } catch {
    /* best effort */
  }
}

/**
 * Whether a record should be replayed. Pure so the unit test can walk it:
 * no hash (an anchor wins), no bfcache restore (the browser restored the
 * snapshot itself), a record from this width, and not stale.
 */
export function shouldRestore(
  rec: ScrollMemory | null,
  ctx: { hash: string; persisted: boolean; vw: number; now: number }
): rec is ScrollMemory {
  if (!rec) return false;
  if (ctx.hash) return false;
  if (ctx.persisted) return false;
  if (Math.abs(rec.vw - ctx.vw) > SCROLL_MEMORY_ROTATION_PX) return false;
  if (ctx.now - rec.t > SCROLL_MEMORY_MAX_AGE_MS) return false;
  return rec.y > 0;
}

/**
 * Start the writer: coalesced on scroll, flushed on `pagehide`. Returns the
 * stop function.
 */
export function startScrollMemory(pathname: string): () => void {
  let timer: number | null = null;
  const write = () => {
    timer = null;
    writeScrollMemory(pathname);
  };
  const onScroll = () => {
    if (timer == null) timer = window.setTimeout(write, WRITE_MS);
  };
  const onHide = () => {
    if (timer != null) {
      window.clearTimeout(timer);
      timer = null;
    }
    writeScrollMemory(pathname);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pagehide", onHide);
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pagehide", onHide);
    if (timer != null) window.clearTimeout(timer);
  };
}
