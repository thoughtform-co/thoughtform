import type { Metadata } from "next";
import { getClaudeWorkshopContent } from "@/lib/v7-parse";
import { LandingPage } from "@/components/landing/v7";
import { getCelestialSlots } from "@/lib/celestial/queries";
import "@/components/landing/v7/landing.css";

export const metadata: Metadata = {
  title: "Thoughtform — Claude Workshop",
  description:
    "Hands-on Claude workshop. Encode how your team works into a substrate every model, tool, and surface inherits.",
};

export default async function ClaudeWorkshopPage() {
  const { bodyHtml, bodyClass } = getClaudeWorkshopContent();
  const celestialSlots = await getCelestialSlots();

  return <LandingPage bodyHtml={bodyHtml} bodyClass={bodyClass} celestialSlots={celestialSlots} />;
}
