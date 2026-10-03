"use client";

import { ProofStack } from "@/components/landing/home-v2/services/proof-stack/ProofStack";
import {
  proofStackClient,
  proofStackTracks,
} from "@/components/landing/home-v2/services/proof-stack/proofOrder";

/**
 * The proof, mounted into `#services` (ADR-137): the homepage's own pile —
 * the same four Loop projects in the record's arc order, and the same
 * first-card arrival — with no card ring behind it. A default export because
 * `WorkshopPortals` mounts it through `lazy()`.
 */
export default function WorkshopProof() {
  return <ProofStack tracks={proofStackTracks()} client={proofStackClient()} arrival="glitch" />;
}
