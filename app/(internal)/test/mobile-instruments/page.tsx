import type { Metadata } from "next";

import { MobileInstrumentsLab } from "./MobileInstrumentsLab";

import "./mobile-instruments.css";

export const metadata: Metadata = {
  title: "Mobile Instruments Look-dev · Thoughtform",
  description: "Interactive phone studies for the Proof and Voidwalker evidence instruments.",
  robots: { index: false, follow: false },
};

export default function MobileInstrumentsLookDevRoute() {
  return <MobileInstrumentsLab />;
}
