import type { Metadata } from "next";

import { HoloGalleryShell } from "./HoloGalleryShell";

/* ⚠ THIS LAB IMPORTS NO PRODUCTION HOLOGRAM SHEET, AND THAT IS THE POINT.
   `voidwalker-holo-lab` renders the SHIPPING `.vwh` DOM so its tuning lands
   in production for free. This gallery does the opposite job — it puts every
   asset ever produced side by side so the owner can SEE which one to ship.
   It therefore owns its own raster/blend controls rather than inheriting one
   composition's, because inheriting them would make every asset look like
   whatever the current production tuning happens to be. */
import "./holo-gallery.css";

export const metadata: Metadata = {
  title: "Voidwalker hologram gallery · Thoughtform",
  robots: { index: false, follow: false },
};

export default function VoidwalkerHoloGalleryRoute() {
  return <HoloGalleryShell />;
}
