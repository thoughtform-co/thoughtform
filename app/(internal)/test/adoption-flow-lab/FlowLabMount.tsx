"use client";

import dynamic from "next/dynamic";

import type { FlowOptionId } from "@/components/adoption-flow/options";
import type { ThemeMode } from "@/lib/theme/themeModeRef";

/** three.js stays off the server and out of the page's first chunk. */
const AdoptionFlowCanvas = dynamic(() => import("@/components/adoption-flow/AdoptionFlowCanvas"), {
  ssr: false,
});

export function FlowLabMount({ option, mode }: { option: FlowOptionId; mode: ThemeMode }) {
  return <AdoptionFlowCanvas option={option} mode={mode} />;
}
