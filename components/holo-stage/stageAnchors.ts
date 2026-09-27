/**
 * stageAnchors — where each label's anchor currently IS on screen.
 *
 * ⚠ THREE-FREE, and it is a CHANNEL rather than a module singleton. The
 * trajectory beat's `holoAnchorsRef` is a module-scope ref, which is correct
 * while exactly one canvas on the page publishes to it; this page mounts FOUR.
 * A singleton there would have the four scenes overwriting one another every
 * frame and the labels of whichever beat rendered last landing on all of them
 * — silently, since every write is valid and every read returns something.
 *
 * Otherwise the transport is the same one `corridorDissipateRef` documents: a
 * plain object, never a CSS custom property (a per-frame var write invalidates
 * computed style for the whole subtree, and this value is read by a render
 * loop).
 */

import type { HoloAnchor } from "@/components/holo-program/holoAnchorsRef";

export type { HoloAnchor };

export interface AnchorChannel {
  publish(next: readonly HoloAnchor[]): void;
  read(): readonly HoloAnchor[];
  version(): number;
  clear(): void;
}

export function createAnchorChannel(): AnchorChannel {
  let anchors: readonly HoloAnchor[] = [];
  let version = 0;
  return {
    publish(next) {
      anchors = next;
      version++;
    },
    read: () => anchors,
    version: () => version,
    clear() {
      anchors = [];
      version++;
    },
  };
}
