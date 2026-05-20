import { HomeV2Page } from "@/components/landing/home-v2/HomeV2Page";
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";

/**
 * /test/home-v2 — depth-gateway homepage v2.
 *
 * Mounts the v7 hero unchanged, then a sticky 3D stage that runs the
 * Definition → Diagnostic → Intelligence-layer chambers as one
 * z-axis dolly inside a shared R3F canvas, and finally a tail of
 * normal-scroll placeholder sections. The production homepage (`/`)
 * is untouched.
 */
export default function HomeV2Route() {
  return <HomeV2Page />;
}
