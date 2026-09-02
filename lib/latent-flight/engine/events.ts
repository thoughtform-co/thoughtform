/**
 * lib/latent-flight/engine/events — a typed emitter, nothing more.
 *
 * The engine emits on DISCRETE events only (a state transition, a target
 * change, a context loss). Nothing per-frame ever passes through here; the
 * per-frame channel is a module ref a painter reads, never a listener.
 */

export type Listener<T> = (payload: T) => void;

export class Emitter<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<never>>>();

  on<K extends keyof Events>(name: K, fn: Listener<Events[K]>): () => void {
    let set = this.listeners.get(name);
    if (!set) {
      set = new Set();
      this.listeners.set(name, set);
    }
    set.add(fn as Listener<never>);
    return () => {
      set?.delete(fn as Listener<never>);
    };
  }

  emit<K extends keyof Events>(name: K, payload: Events[K]): void {
    const set = this.listeners.get(name);
    if (!set) return;
    for (const fn of Array.from(set)) (fn as Listener<Events[K]>)(payload);
  }

  clear(): void {
    this.listeners.clear();
  }
}
