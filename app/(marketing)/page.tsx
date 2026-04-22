import type { Metadata } from "next";
import { getV7Content } from "@/lib/v7-parse";
import { LandingPage } from "@/components/landing/v7";
import { getCelestialSlots } from "@/lib/celestial/queries";
import "@/components/landing/v7/landing.css";

export const metadata: Metadata = {
  title: "Thoughtform — Navigate Intelligence",
  description:
    "Thoughtform pioneers intuitive human-AI collaboration. We teach teams how to navigate AI for creative and strategic work.",
};

export default async function Home() {
  const { bodyHtml, bodyClass } = getV7Content();
  const celestialSlots = await getCelestialSlots();

  return <LandingPage bodyHtml={bodyHtml} bodyClass={bodyClass} celestialSlots={celestialSlots} />;
}
