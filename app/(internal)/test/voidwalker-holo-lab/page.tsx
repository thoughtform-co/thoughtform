import type { Metadata } from "next";

import { HoloLabShell } from "./HoloLabShell";

/* Stylesheet order is load-bearing (the hud-instruments-lab precedent):
   production sheets first — `landing.css` owns the @font-face block and
   the :root token chain every `--gold*` below resolves against — then
   `theme.css` LAST of the production sheets, because its
   `html[data-theme="light"]` cascade has to win over all of them, and
   only then the lab's own sheet so its scoped overrides sit on top. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/voidwalker/voidwalker.css";
import "@/components/landing/home-v2/voidwalker/voidwalker-wire.css";
import "@/components/landing/home-v2/voidwalker/hologram/voidwalker-hologram.css";
import "@/components/landing/v7/theme.css";
import "./holo-lab.css";

export const metadata: Metadata = {
  title: "Voidwalker hologram lab · Thoughtform",
  robots: { index: false, follow: false },
};

export default function VoidwalkerHoloLabRoute() {
  return <HoloLabShell />;
}
