import Image from "next/image";

import type { CaseImage } from "@/lib/cases/types";

/**
 * StillsPlate — shipped work, shown whole.
 *
 * The tiles fit by HEIGHT (`height: 100%; width: auto` via the aspect-ratio
 * box in `casefile.css`), not by width, so nothing is cropped: the plate rect
 * is short and wide (~864 x 240 at 1440x800) and these are 4:5 ads. Cropping
 * them to fill would cut the composition the ad was designed around, which is
 * the one thing this plate exists to show.
 *
 * NATURAL COLOUR — no duotone. The `tools` plate filters its shots because
 * those are dark UI captures sitting on a photo bar; these are the creative
 * itself. Same split the arcs rule states: content media renders in natural
 * colour, the gold is card and chrome treatment only.
 *
 * SIZING. `sizes` is a fixed ~200px because the tile height is driven off the
 * HUD rail and never exceeds ~300px on any supported viewport — so Next
 * serves ~400px-wide WebP off the 1080x1350 source rather than the full JPEG.
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
