/**
 * The route's view of the shared stack order (ADR-096).
 *
 * The pile, the card and its sequence were built here for ADR-094 and moved
 * to `components/landing/home-v2/services/proof-stack/` when the owner asked
 * for the same beat on the homepage — content by reference, ONE order, so
 * the two surfaces cannot letter `01 … 04` differently.
 *
 * This file survives as the route's names for it: `trinny-proof-order.test.ts`
 * is the guard that pins the sequence against `arc.step`, and it is written
 * against these exports.
 */
export {
  PROOF_STACK_CASE as TRINNY_PROOF_CASE,
  PROOF_STACK_ORDER as TRINNY_PROOF_ORDER,
  proofStackTracks as trinnyProofTracks,
  proofStackClient as trinnyProofClient,
} from "@/components/landing/home-v2/services/proof-stack/proofOrder";
