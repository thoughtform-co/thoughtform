import { OfferBoard } from "@/components/xb-proposal/offer/OfferBoard";
import { OfferPinned } from "@/components/xb-proposal/offer/OfferPinned";
import { OfferSchematic } from "@/components/xb-proposal/offer/OfferSchematic";
import { Ready } from "@/components/xb-proposal/Ready";

import "@/components/xb-proposal/xb.css";

/* Section 1 of the X-Bionic proposal, rebuilt from the 2026-10-11 brief in
   three directions. `?d=a|b|c` shows one; `&step=1|2|3` fixes A's move for a
   still. With no `d`, all three run down the page. */

type Step = 1 | 2 | 3;

export default async function XbOfferRebuildPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; step?: string }>;
}) {
  const { d, step } = await searchParams;
  const s = step === "1" || step === "2" || step === "3" ? (Number(step) as Step) : undefined;
  return (
    <main className="xb">
      <Ready />
      {(!d || d === "a") && <OfferPinned step={s} />}
      {(!d || d === "b") && <OfferSchematic />}
      {(!d || d === "c") && <OfferBoard />}
    </main>
  );
}
