import "./proof-cards.css";
import "./proof-cards-c2.css";

import { ProofCardsShell } from "./ProofCardsShell";

export default async function ProofCardsRoute({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job } = await searchParams;
  return <ProofCardsShell initialJob={job} />;
}
