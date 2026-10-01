import { WorkshopHoloLab } from "./WorkshopHoloLab";

import "@/components/landing/v7/theme.css";
import "./workshop-holo-lab.css";

/**
 * /test/workshop-holo-lab — the directions for the workshop's three figures,
 * drawn from the owner's references, side by side (ADR-140, round two).
 * `?only=orbits,discharge` · `?scan=0.12` · `?sweep=off` · `?w=1280` ·
 * `?theme=light`.
 */
export default function WorkshopHoloLabRoute() {
  return <WorkshopHoloLab />;
}
