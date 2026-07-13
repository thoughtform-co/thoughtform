import { CorridorRevealsLabPage } from "@/components/landing/home-v2/lab/CorridorRevealsLabPage";
import { extractV7Text } from "@/lib/v7-parse";
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "./corridor-reveals-lab.css";

/**
 * /test/corridor-reveals — look-dev for the Arc's diegetic detail overlays
 * (ADR-032 Update 1).
 *
 * Freezes the depth corridor at each stage park and mounts the world-
 * anchored cardinals + skill clusters + tool cascade over the live scene,
 * so the bloom/cascade can be judged without scrolling. Internal-only:
 * production blocks `/test/*` via `middleware.ts`.
 */
export default function CorridorRevealsLabRoute() {
  const text = extractV7Text();
  return <CorridorRevealsLabPage text={text} />;
}
