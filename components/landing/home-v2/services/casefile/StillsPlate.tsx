import Image from "next/image";

import type { CaseImage } from "@/lib/cases/types";

/**
 * StillsPlate — shipped work, shown whole.
 *
 * The three 4:5 tiles share the full-height instrument on a centred grid.
 * Their authored proportions remain intact; the frame never invents a
 * landscape crop merely to consume horizontal space.
 *
 * NATURAL COLOUR — no duotone. The `tools` plate filters its shots because
 * those are dark UI captures sitting on a photo bar; these are the creative
 * itself. Same split the arcs rule states: content media renders in natural
 * colour, the gold is card and chrome treatment only.
 *
 * SIZING. `sizes` is a fixed ~200px because each of the three columns remains
 * compact even though the instrument itself is taller — so Next serves a
 * modest WebP off the 1080x1350 source rather than the full JPEG.
 * No prefetch: `TrackPanel` only mounts the selected track, and this is not
 * the default row, so a visitor who never opens the studio pays nothing.
 */
export function StillsPlate({ shots }: { shots: readonly CaseImage[] }) {
  return (
    <div className="fl-plate fl-plate--stills">
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
    </div>
  );
}
