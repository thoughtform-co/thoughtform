import { sliceV7Sections } from "@/lib/v7-parse";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "@/components/landing/v7/theme.css";
import "../halyard/halyard.css";
import "@/components/xb-proposal/xb.css";
import "@/components/xb-proposal/xb-in-frame.css";
import "@/components/xb-proposal/masthead.css";
import "@/components/xb-proposal/closing/closing.css";
import "./xb-closing.css";

import { XbClosingShell } from "./XbClosingShell";

export default function XbClosingRoute() {
  const slice = sliceV7Sections([]);
  return <XbClosingShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
