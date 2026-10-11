import { sliceV7Sections } from "@/lib/v7-parse";

/* Stylesheet order: landing.css carries the @font-face block and every HUD
   token the frame paints with; home-v2.css makes the HUD root `display:
   contents`; rail-instruments.css the right rail's telemetry; ours last. No
   theme.css: this page is dark by the brief. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "./halyard.css";

import { HalyardShell, type HalyardDir } from "./HalyardShell";

type Search = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function HalyardRoute({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const d = one(sp.d);
  const dir: HalyardDir = d === "b" || d === "c" ? d : "a";
  const n = Number(one(sp.step));
  const step = n === 1 || n === 2 || n === 3 ? n : null;
  const still = one(sp.still) === "1";
  const slice = sliceV7Sections([]);
  return (
    <HalyardShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      dir={dir}
      step={step}
      still={still}
    />
  );
}
