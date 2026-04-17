import type { Metadata } from "next";
import { LandingV2 } from "./LandingV2";
import "./landing-v2.css";

export const metadata: Metadata = {
  title: "Thoughtform — Navigate Intelligence · v2",
  description: "Redesign in progress. The interface for navigating human–AI collaboration.",
};

export default function LandingV2Page() {
  return <LandingV2 />;
}
