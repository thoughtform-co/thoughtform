import "./proof-cards.css";
import "./proof-cards-c2.css";
import "./proof-cards-c3.css";
import "./proof-cards-c4.css";
import "./proof-cards-c5.css";

import { ProofCardsShell } from "./ProofCardsShell";

export default async function ProofCardsRoute({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job } = await searchParams;
  return <ProofCardsShell initialJob={job} />;
}
