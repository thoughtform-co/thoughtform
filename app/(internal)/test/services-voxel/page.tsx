import { ServicesVoxelLab } from "@/components/landing/home-v2/services/voxel/ServicesVoxelLab";
import { sliceV7Sections } from "@/lib/v7-parse";
import "@/components/landing/v7/landing.css";

/**
 * /test/services-voxel — voxel media-block effect lab.
 *
 * Prototype for the rogierdeboeve-style blocky/voxel displacement that will
 * replace the Services centerpiece: a grid of blocks, each an image/video
 * extruded into instanced cubes displaced by scrolling perlin noise, lit and
 * fogged for atmosphere. Slider panel tunes the look; "Force fallback"
 * exercises the no-WebGL static grid.
 *
 * Loads the production v7 HUD chrome via `sliceV7Sections([])` — same pattern
 * as `/test/hero-mockups`. Internal-only: production blocks `/test/*` via
 * `middleware.ts`.
 */
export default function ServicesVoxelRoute() {
  const slice = sliceV7Sections([]);
  return <ServicesVoxelLab hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
