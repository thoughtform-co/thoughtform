/**
 * Per-frame journey scalars, published on a module-level ref.
 *
 * The instruments read this inside their OWN rAF; nothing re-renders per
 * scroll frame. Precedent: `lib/services-ring/ringProgressRef.ts` and
 * `arcCasesLevelRef` — a module ref rather than React state or Zustand,
 * because these are read once per paint and would otherwise cost subscriber
 * churn on every scroll frame.
 *
 * SINGLE WRITER: `useSyntheticJourney`. Nobody else.
 */

export interface LabJourney {
  /** Total document scroll, 0..1. The right rail's continuous channel. */
  scroll01: number;
  /** Index into `RUNWAY_BLOCKS` of the block holding the viewport midline. */
  blockIdx: number;
  /** Progress through the current block, 0..1. */
  blockLocal: number;
  /** Progress through the corridor mount's runway, 0..1 (0 outside it). */
  corridorRaw: number;
  /** `resolveActiveIdx` over `MANIFEST_ENTRIES` — the discrete journey index. */
  activeIdx: number;
  /**
   * How many READOUT_SECTIONS rows have been reached, 0..n.
   *
   * The left rail's progressive disclosure counts off this, not off
   * `activeIdx` — the four corridor beats collapse to one row, so the two
   * are different numbers and mixing them draws four Arc marks.
   */
  reachedRows: number;
}

export const journeyRef: { current: LabJourney } = {
  current: {
    scroll01: 0,
    blockIdx: 0,
    blockLocal: 0,
    corridorRaw: 0,
    activeIdx: 0,
    reachedRows: 0,
  },
};

type JourneyListener = (journey: LabJourney) => void;

const listeners = new Set<JourneyListener>();

/**
 * Subscribe to the writer's frame.
 *
 * Instruments use this rather than their own scroll listener, and the
 * reason is effect ORDER: React runs child effects before parent effects,
 * so a portalled instrument's `scroll` listener would register BEFORE the
 * writer's and read the previous frame's scalars. Notifying from the end of
 * the writer's frame makes the ordering explicit instead of incidental.
 *
 * Fires on every published frame; a listener that touches the DOM should
 * delta-gate its own writes.
 */
export function subscribeJourney(fn: JourneyListener): () => void {
  listeners.add(fn);
  fn(journeyRef.current);
  return () => {
    listeners.delete(fn);
  };
}

/** Writer-only. Publishes the frame, then notifies. */
export function publishJourney(next: LabJourney): void {
  journeyRef.current = next;
  for (const fn of listeners) fn(next);
}
