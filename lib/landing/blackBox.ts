/**
 * The landing's BLACK BOX (ADR-123 §Part 1) — a small record that survives a
 * page kill, so the reload the owner sees on his phone can be read AFTER it
 * happened.
 *
 * WebKit ends a tab's content process for memory and reloads the page with
 * nothing in the console, no error, no event; the only witness is what the
 * previous page wrote to `sessionStorage` before it went, and `sessionStorage`
 * survives a same-tab reload (it does not survive a closed tab, which is what
 * makes it the right store — nothing here outlives the reader's own visit).
 *
 * Three-free, DOM-only, and it throws nothing: every storage access is
 * wrapped, because a private tab or a full quota turns a diagnostic into the
 * crash it was meant to record.
 *
 * ⚠ IT IS OFF THE ANONYMOUS PATH. `record()` is only ever called by the diag
 * panel (`?diag=phone`) and by the services boundary's catch; a reader who
 * never opened the panel writes nothing.
 */

const KEY = "tf-blackbox";
const SESSION_KEY = "tf-blackbox-session";
/** Writes are merged and coalesced: at most this often, or on `pagehide`. */
const FLUSH_MS = 250;

export type BlackBoxRecord = Record<string, unknown>;

let pending: BlackBoxRecord | null = null;
let timer: number | null = null;
let armed = false;

function readRaw(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* quota, private mode, a disabled store — the record is best effort */
  }
}

function flush(): void {
  if (timer != null) {
    window.clearTimeout(timer);
    timer = null;
  }
  if (!pending) return;
  const prev = readCurrent();
  const next = { ...prev, ...pending, at: Date.now() };
  pending = null;
  try {
    writeRaw(KEY, JSON.stringify(next));
  } catch {
    /* a value that cannot serialise is dropped rather than thrown */
  }
}

function arm(): void {
  if (armed || typeof window === "undefined") return;
  armed = true;
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

/** The record the CURRENT page has written so far (merged). */
export function readCurrent(): BlackBoxRecord {
  const raw = readRaw(KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as BlackBoxRecord) : {};
  } catch {
    return {};
  }
}

/**
 * Merge fields into the record. Coalesced to ≤4 Hz and flushed on
 * `pagehide` / hidden, so a scroll-driven caller can write every frame
 * without the storage becoming the cost being measured.
 */
export function record(fields: BlackBoxRecord): void {
  if (typeof window === "undefined") return;
  arm();
  pending = { ...(pending ?? {}), ...fields };
  if (timer == null) timer = window.setTimeout(flush, FLUSH_MS);
}

/** Force the pending merge to storage now. */
export function flushNow(): void {
  flush();
}

/**
 * The PREVIOUS page's record, read once at boot before this page writes
 * anything, and the previous page's is then archived under `prev` so the
 * panel can show NOW beside PREV. Returns `{}` on a fresh session.
 */
let prevCache: BlackBoxRecord | null = null;
export function readPrev(): BlackBoxRecord {
  if (prevCache) return prevCache;
  if (typeof window === "undefined") return {};
  const prev = readCurrent();
  prevCache = prev;
  try {
    writeRaw(KEY, "{}");
  } catch {
    /* ignore */
  }
  return prev;
}

/**
 * A per-page session counter: 1 on the first page of the tab, +1 on every
 * reload of it. A reload the reader did not ask for shows up as the number
 * climbing while the URL never changed.
 */
export function bumpSession(): { session: number; prevAt: number | null } {
  if (typeof window === "undefined") return { session: 0, prevAt: null };
  const raw = readRaw(SESSION_KEY);
  let session = 0;
  let prevAt: number | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { session?: number; at?: number };
      session = typeof parsed.session === "number" ? parsed.session : 0;
      prevAt = typeof parsed.at === "number" ? parsed.at : null;
    } catch {
      /* corrupt — start over */
    }
  }
  session += 1;
  writeRaw(SESSION_KEY, JSON.stringify({ session, at: Date.now() }));
  return { session, prevAt };
}
