import type { Metadata } from "next";
import { LandingV7 } from "./LandingV7";
import "./v7.css";

export const metadata: Metadata = {
  title: "Thoughtform — Navigate Intelligence",
  description:
    "Thoughtform pioneers intuitive human-AI collaboration. We teach teams how to navigate AI for creative and strategic work.",
};

export default function V7Page() {
  return <LandingV7 />;
}
