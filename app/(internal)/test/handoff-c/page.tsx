import { HandoffLabPage } from "@/components/landing/home-v2/handoff-lab/HandoffLabPage";
import { sliceV7Sections } from "@/lib/v7-parse";
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/handoff-lab/handoff-lab.css";

export default function HandoffCRoute() {
  const slice = sliceV7Sections([]);
  return <HandoffLabPage hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} scenario="collapse" />;
}
