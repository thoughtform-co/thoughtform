/**
 * /test/intelligence-map-diagrams — look-dev for the Intelligence Map as
 * three diagram types inside the REAL proof-casefile chrome.
 *
 * Owner direction (2026-08-05): not the v1–v7 standalone HTML chassis, and
 * not the Arc's route notation — three levels, three diagram languages:
 *   01 THE WORK          plan view (team plates, stream nodes)
 *   02 THE CONFIGURATION sectional stack (person above; skill⇄model a pair)
 *   03 THE SUBSTRATES    flow braid (14 strands × 5 engines, 47 ticks)
 *
 * CSS import order is load-bearing (same recipe as intelligence-map-lab):
 * production sheets first so the casefile geometry is genuine, theme.css
 * last of production (ADR-058), the lab layer after everything.
 */

import { sliceV7Sections } from "@/lib/v7-parse/sliceSections";
import { DiagramsShell } from "./DiagramsShell";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/v7/theme.css";
import "./intelligence-map-diagrams.css";

export default function IntelligenceMapDiagramsPage() {
  const slice = sliceV7Sections([]);
  return <DiagramsShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
