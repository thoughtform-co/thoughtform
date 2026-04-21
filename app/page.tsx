import type { Metadata } from "next";
import { getV7Content } from "./v7-parse";
import { LandingPage } from "@/components/landing/v7";
import "@/components/landing/v7/landing.css";

export const metadata: Metadata = {
  title: "Thoughtform — Navigate Intelligence",
  description:
    "Thoughtform pioneers intuitive human-AI collaboration. We teach teams how to navigate AI for creative and strategic work.",
};

export default function Home() {
  const { bodyHtml, bodyClass } = getV7Content();

  return <LandingPage bodyHtml={bodyHtml} bodyClass={bodyClass} />;
}
