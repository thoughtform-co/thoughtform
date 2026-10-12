import { sliceV7Sections } from "@/lib/v7-parse";

/* The proposition artifact's stylesheet order (the frame's fonts and tokens,
   the HUD root, the right rail's telemetry, halyard's shell), the kit's own
   sheet, then the two sections' sheets and this page's, last. Dark. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "../halyard/halyard.css";
import "@/components/xb-proposal/xb.css";
import "@/components/xb-proposal/plug/plug.css";
import "@/components/xb-proposal/motion/motion.css";
import "@/components/xb-proposal/embed/embed.css";
import "./proposition-v2.css";

import { PropositionV2Shell } from "./PropositionV2Shell";

export default function PropositionV2Route() {
  const slice = sliceV7Sections([]);
  return <PropositionV2Shell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
