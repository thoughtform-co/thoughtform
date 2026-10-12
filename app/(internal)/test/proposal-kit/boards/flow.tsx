import type { ComponentType, ReactNode } from "react";

import { PlugAxis } from "@/components/xb-proposal/plug/PlugAxis";
import { PlugBearing } from "@/components/xb-proposal/plug/PlugBearing";
import { PlugFlow } from "@/components/xb-proposal/plug/PlugFlow";
import { PlugTrace } from "@/components/xb-proposal/plug/PlugTrace";

import type { KitSection } from "../types";

/** The section as `ArcPlugPort` mounts it on the proposal. */
function Port({ children }: { children: ReactNode }) {
  return (
    <section className="arc-section arc-xb-port">
      <div className="xb xb-in-frame xb-sec">{children}</div>
    </section>
  );
}

const ported = (Flow: ComponentType) =>
  function Ported() {
    return (
      <Port>
        <Flow />
      </Port>
    );
  };

/** Board F · "AI capability your teams own." Control first, then F1 to F3. */
export const FLOW: readonly KitSection[] = [
  {
    id: "flow-control",
    board: "flow",
    code: "F0",
    name: "Production",
    note: "The flow as it ships.",
    control: true,
    C: ported(PlugFlow),
  },
  {
    id: "flow-f1",
    board: "flow",
    code: "F1",
    name: "Trace",
    note: "The same flow, every line straight: a rail, cut corners, one collector.",
    C: ported(PlugTrace),
  },
  {
    id: "flow-f2",
    board: "flow",
    code: "F2",
    name: "Bearing",
    note: "The hub is the About dial; the team arrives on bearings.",
    C: ported(PlugBearing),
  },
  {
    id: "flow-f3",
    board: "flow",
    code: "F3",
    name: "Axis",
    note: "The mark's own bar is the datum everything hangs off.",
    C: ported(PlugAxis),
  },
];
