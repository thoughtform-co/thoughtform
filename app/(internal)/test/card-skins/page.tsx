import "../proof-cards/proof-cards.css";
import "../proof-cards/proof-cards-c2.css";
import "../proof-cards/proof-cards-c3.css";
import "../proof-cards/proof-cards-c4.css";
import "../proof-cards/proof-cards-c5.css";
import "../proof-cards/proof-cards-c6.css";
import "../proof-cards/proof-cards-c7.css";

import { CardSkinsShell } from "./CardSkinsShell";

export default async function CardSkinsRoute({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job } = await searchParams;
  return <CardSkinsShell initialJob={job} />;
}
