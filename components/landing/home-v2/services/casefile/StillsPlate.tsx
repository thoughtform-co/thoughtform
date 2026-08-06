import Image from "next/image";

import type { CaseImage } from "@/lib/cases/types";

import { ConsoleFrame } from "./console/ConsoleFrame";

/**
 * StillsPlate — shipped work, shown whole.
 *
 * The three 4:5 tiles share the full-height instrument on a centred grid.
 * Their authored proportions remain intact; the frame never invents a
 * landscape crop merely to consume horizontal space.
 *
 * ⚠ NATURAL COLOUR — no duotone, and the console frame is WHY that holds
 * (ADR-064). The owner's ask was "a filter so everything feels uniform"; the
 * answer is that the uniformity comes from the chrome, not from recolouring
 * the evidence. These are Loop's actual ads. The `tools` recipe existed to
 * NORMALIZE dark UI captures — `grayscale(1)` collapses arbitrary vendor
 * colour to luminance so heterogeneous screenshots agree — which on authored
 * photography does the opposite: it destroys intended colour instead of
 * unifying accidental colour. Same split the arcs rule states: content media
 * renders in natural colour, the gold is card and chrome treatment only.
 *
 * NO RAIL, NO FOOT. Three tiles need no navigation, and ADR-056's "the right
 * panel has no generic foot" means a row with nothing to say prints nothing.
 * The frame is the whole of what this row gained.
 *
 * SIZING. `sizes` is a fixed ~200px because each of the three columns remains
 * compact even though the instrument itself is taller — so Next serves a
 * modest WebP off the 1080x1350 source rather than the full JPEG.
 * No prefetch: `TrackPanel` only mounts the selected track, and this is not
 * the default row, so a visitor who never opens the studio pays nothing.
 */
export function StillsPlate({ shots }: { shots: readonly CaseImage[] }) {
  return (
    <ConsoleFrame className="fl-plate fl-plate--stills">
      <ul className="fl-stills">
        {shots.map((shot) => (
          <li className="fl-still" key={shot.src}>
            <Image
              className="fl-still__shot"
              src={shot.src}
              alt={shot.alt}
              width={shot.width ?? 1080}
              height={shot.height ?? 1350}
              sizes="200px"
            />
          </li>
        ))}
      </ul>
    </ConsoleFrame>
  );
}
