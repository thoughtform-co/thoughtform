"use client";

/* The four variants, one runway each, and the lab's bar. In sequence
   (`?v=a`) one variant is followed by the proposal's own steps and network,
   as the page would read: the point of the round is whether the opening
   still repeats what the steps say. */

import type { ComponentType } from "react";

import { EmbedStack } from "@/components/xb-proposal/embed/EmbedStack";
import { NetworkOrg } from "@/components/xb-proposal/network/NetworkOrg";

import { Runway } from "./shared";
import { VariantCrossover } from "./VariantCrossover";
import { VariantFlywheel } from "./VariantFlywheel";
import { VariantHandover } from "./VariantHandover";
import { VariantInOut } from "./VariantInOut";

export type VariantId = "a" | "b" | "c" | "d";

interface Variant {
  id: VariantId;
  code: string;
  name: string;
  /** The runway's height, in screens. */
  screens: number;
  C: ComponentType<{ p: number; still: boolean }>;
}

export const VARIANTS: readonly Variant[] = [
  { id: "a", code: "A", name: "Handover", screens: 3.4, C: VariantHandover },
  { id: "b", code: "B", name: "Flywheel", screens: 3.8, C: VariantFlywheel },
  { id: "c", code: "C", name: "Crossover", screens: 3, C: VariantCrossover },
  { id: "d", code: "D", name: "In, then out", screens: 4.2, C: VariantInOut },
];
export const VARIANT_IDS = VARIANTS.map((v) => v.id);

export function CapabilityLab({
  only,
  fixed,
  still,
}: {
  only?: VariantId;
  fixed: number | null;
  still: boolean;
}) {
  const shown = only ? VARIANTS.filter((v) => v.id === only) : VARIANTS;
  return (
    <>
      {shown.map((v) => (
        <Runway
          key={v.id}
          id={`co-${v.id}`}
          label={`AI capability your teams own, variant ${v.code}: ${v.name}`}
          screens={v.screens}
          fixed={fixed}
        >
          {(p) => <v.C p={p} still={still} />}
        </Runway>
      ))}

      {only && (
        <section id="adoption" className="arc-section arc-xb-port" aria-label="Navigate, encode, build">
          <div className="xb xb-in-frame">
            <EmbedStack />
          </div>
          <div className="xb xb-in-frame">
            <NetworkOrg />
          </div>
        </section>
      )}

      {still ? null : <LabBar only={only} />}
    </>
  );
}

function LabBar({ only }: { only?: VariantId }) {
  return (
    <nav className="co-bar" aria-label="Capability lab">
      <span className="co-bar__title">Capability · round 01</span>
      <span className="co-bar__set">
        {VARIANTS.map((v) => (
          <a
            key={v.id}
            href={only ? `?v=${v.id}` : `#co-${v.id}`}
            data-on={only === v.id ? "" : undefined}
          >
            <b>{v.code}</b> {v.name}
          </a>
        ))}
      </span>
      <span className="co-bar__set">
        <a href={only ? "?" : "?v=a"} data-on={only ? "" : undefined}>
          {only ? "All four" : "In sequence"}
        </a>
      </span>
    </nav>
  );
}
