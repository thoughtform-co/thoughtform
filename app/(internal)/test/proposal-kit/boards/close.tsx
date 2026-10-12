import type { ComponentType, ReactNode } from "react";

import { ArcTerms } from "@/components/arcs/ArcTerms";
import { FeeFrame, FeePair, WeeksLedger } from "@/components/xb-proposal/closing/Fee";
import { WeeksFrame, WhoFrame } from "@/components/xb-proposal/closing/Frames";
import { X_BIONIC_PROPOSAL_ARC } from "@/lib/arcs/content/x-bionic-proposal";
import type { ArcSectionOf } from "@/lib/arcs/types";

import type { KitSection } from "../types";

/** A kit section as `ArcClosingPort` mounts it on the proposal. */
function Port({ children }: { children: ReactNode }) {
  return (
    <section className="arc-section arc-xb-port">
      <div className="xb xb-in-frame xc-sec">{children}</div>
    </section>
  );
}

const ported = (...frames: ComponentType[]) =>
  function Ported() {
    return (
      <>
        {frames.map((Frame, i) => (
          <Port key={i}>
            <Frame />
          </Port>
        ))}
      </>
    );
  };

/* The fee as the page draws it: the record's `pricing` section, at the index
   `ArcSectionRenderer` hands it (its place in the section list; X-Bionic has
   no multi-beat section before it to shift the count). */
const PRICING_AT = X_BIONIC_PROPOSAL_ARC.sections.findIndex((s) => s.id === "pricing");
function FeeConsole() {
  const pricing = X_BIONIC_PROPOSAL_ARC.sections[PRICING_AT] as ArcSectionOf<"terms">;
  return <ArcTerms section={pricing} index={PRICING_AT} motion="reveal" />;
}

/** Board C · the closing run. Controls first, then C1 to C3. */
export const CLOSE: readonly KitSection[] = [
  {
    id: "close-weeks",
    board: "close",
    code: "C0a",
    name: "Production · the four weeks",
    note: "One hairline frame, three phases, as it ships.",
    control: true,
    C: ported(WeeksFrame),
  },
  {
    id: "close-who",
    board: "close",
    code: "C0b",
    name: "Production · who takes part",
    note: "One frame, two cells, as it ships.",
    control: true,
    C: ported(WhoFrame),
  },
  {
    id: "close-fee",
    board: "close",
    code: "C0c",
    name: "Production · the fee",
    note: "The console: a cut plate, a SYS bar, a display numeral.",
    control: true,
    C: FeeConsole,
  },
  {
    id: "close-c1",
    board: "close",
    code: "C1",
    name: "One frame",
    note: "The fee in the weeks' grammar: one frame, cells on shared edges, the rate at reading size.",
    C: ported(FeeFrame),
  },
  {
    id: "close-c2",
    board: "close",
    code: "C2",
    name: "One sheet",
    note: "The weeks and the fee as one ledger: each stretch ends on its days, the frame on the rate.",
    C: ported(WeeksLedger),
  },
  {
    id: "close-c3",
    board: "close",
    code: "C3",
    name: "A matched pair",
    note: "Who takes part and the fee as two frames of one shape: time, then money.",
    C: ported(WhoFrame, FeePair),
  },
];
