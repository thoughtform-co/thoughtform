import { CorridorRevealsLabPage } from "@/components/landing/home-v2/lab/CorridorRevealsLabPage";
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "./corridor-reveals-lab.css";

/**
 * /test/corridor-reveals — look-dev for the Arc reveal consoles (ADR-032).
 *
 * Freezes the depth corridor at each stage park and mounts the reveal
 * chip + drawer over the live scene so the console can be judged without
 * scrolling. Internal-only: production blocks `/test/*` via `middleware.ts`.
 */
export default function CorridorRevealsLabRoute() {
  return <CorridorRevealsLabPage />;
}
