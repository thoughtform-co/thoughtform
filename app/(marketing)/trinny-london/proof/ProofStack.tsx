"use client";

import { ProofStack } from "@/components/landing/home-v2/services/proof-stack/ProofStack";

import { trinnyProofClient, trinnyProofTracks } from "./proofOrder";

/**
 * The route's entry point into the shared pile (ADR-094, shared by ADR-096).
 *
 * `TrinnyPortals` mounts this through `lazy()`, so it stays a DEFAULT export;
 * everything it does is choose the tracks, which is the one thing a route
 * owns (`proofOrder.ts`).
 */
export default function TrinnyProofStack() {
  return <ProofStack tracks={trinnyProofTracks()} client={trinnyProofClient()} />;
}
