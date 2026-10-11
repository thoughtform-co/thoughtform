import { sliceV7Sections } from "@/lib/v7-parse";

/* Halyard's stylesheet order (the frame's fonts and tokens, the HUD root,
   the right rail's telemetry, halyard's own sheet), then the xb-proposal
   kit's sheets, then this page's, last. Dark by the brief: no theme.css. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "../halyard/halyard.css";
import "@/components/xb-proposal/xb.css";
import "@/components/xb-proposal/layer/layer.css";
import "@/components/xb-proposal/substrate/substrate.css";
import "@/components/xb-proposal/flow/flow.css";
import "./proposition.css";

import { PropositionShell } from "./PropositionShell";

export default function PropositionArtifactRoute() {
  const slice = sliceV7Sections([]);
  return <PropositionShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
