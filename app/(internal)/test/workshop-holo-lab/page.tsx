import { WorkshopHoloLab } from "./WorkshopHoloLab";

import "@/components/landing/v7/theme.css";
import "./workshop-holo-lab.css";

/**
 * /test/workshop-holo-lab — the directions for the workshop's three figures,
 * drawn from the owner's references, side by side (ADR-140, rounds two to
 * four; round four's instrument plates first).
 * `?only=stages-instrument,curve-instrument` · `?scan=0.1` · `?life=0.6` ·
 * `?post=pyramid|bloom` · `?t=4.2` (a frozen clock) · `?sweep=off` ·
 * `?w=1280` · `?theme=light`.
 */
export default function WorkshopHoloLabRoute() {
  return <WorkshopHoloLab />;
}
