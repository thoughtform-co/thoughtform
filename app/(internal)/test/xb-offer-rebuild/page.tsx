import { LayerGrowth } from "@/components/xb-proposal/layer/LayerGrowth";
import { LayerOpened } from "@/components/xb-proposal/layer/LayerOpened";
import { LayerPinned } from "@/components/xb-proposal/layer/LayerPinned";
import { OfferBoard } from "@/components/xb-proposal/offer/OfferBoard";
import { OfferPinned } from "@/components/xb-proposal/offer/OfferPinned";
import { OfferSchematic } from "@/components/xb-proposal/offer/OfferSchematic";
import { Ready } from "@/components/xb-proposal/Ready";
import { SubstrateBoard } from "@/components/xb-proposal/substrate/SubstrateBoard";
import { SubstrateFrontal } from "@/components/xb-proposal/substrate/SubstrateFrontal";
import { SubstrateSheets } from "@/components/xb-proposal/substrate/SubstrateSheets";

import "@/components/xb-proposal/xb.css";
import "@/components/xb-proposal/layer/layer.css";
import "@/components/xb-proposal/substrate/substrate.css";

/* The X-Bionic proposal's two core sections, rebuilt from the 2026-10-11
   brief. Section 1 in three directions (`?d=a|b|c`), section 2 in three
   (`?d=2a|2b|2c`), and the substrate visual in three permutations
   (`?d=p1|p2|p3`); `&step=1|2|3` fixes a pinned direction's move for a
   still. With no `d`, every direction runs down the page, section 1 first. */

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
      {(!d || d === "a") && <OfferPinned step={d ? s : undefined} />}
      {(!d || d === "b") && <OfferSchematic />}
      {(!d || d === "c") && <OfferBoard />}
      {(!d || d === "2a") && <LayerPinned step={d ? s : undefined} />}
      {(!d || d === "2b") && <LayerOpened />}
      {(!d || d === "2c") && <LayerGrowth />}
      {(!d || d === "p1") && <SubstrateSheets />}
      {(!d || d === "p2") && <SubstrateFrontal />}
      {(!d || d === "p3") && <SubstrateBoard />}
    </main>
  );
}
