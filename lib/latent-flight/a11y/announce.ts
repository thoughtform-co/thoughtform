/**
 * lib/latent-flight/a11y/announce — the status sentences, and their gate.
 *
 * The screen reader hears DISCRETE events in words — a lock, an engagement,
 * a dock, a mode change — never a per-frame value. `Announcer` holds one
 * pending sentence and lets at most one through per `minGapS`; a newer
 * sentence replaces an older one still waiting, so the reader hears the
 * latest state rather than a backlog.
 */

export const ANNOUNCE_MIN_GAP_S = 2;

export function lockSentence(name: string, range: string): string {
  return `Locked: ${name}. Range ${range}.`;
}
export function releaseSentence(): string {
  return "Released. Holding.";
}
export function stateSentence(word: string, sector: string): string {
  return `${word}. Sector ${sector}.`;
}
export function chartSentence(): string {
  return "Chart mode. Renderer unavailable; every waypoint is reachable from the list.";
}

export class Announcer {
  private pending: string | null = null;
  private lastAt = Number.NEGATIVE_INFINITY;
  private last = "";

  constructor(private readonly minGapS = ANNOUNCE_MIN_GAP_S) {}

  say(sentence: string): void {
    if (sentence === this.last && this.pending === null) return;
    this.pending = sentence;
  }

  /** Called once per frame with the clock; returns a sentence to emit, or
   *  null. */
  tick(nowS: number): string | null {
    if (this.pending === null) return null;
    if (nowS - this.lastAt < this.minGapS) return null;
    const out = this.pending;
    this.pending = null;
    this.lastAt = nowS;
    this.last = out;
    return out;
  }
}
