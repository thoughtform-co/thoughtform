/* The Loop visuals are the casefile's own plates, mounted through the proof
   card's field, so their sheets come with them (the arcs route's own set). */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/services/proof-stack/proof-stack.css";
import "./loop-proof-lab.css";

import { LoopProofLab } from "./LoopProofLab";

export default async function LoopProofLabRoute({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;
  return <LoopProofLab initialCard={card} />;
}
