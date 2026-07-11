"use client";

import { type ReactNode } from "react";
import type { GatewayVisualEntry } from "@/lib/gateway-motion/manifest";
import "./motion.css";

/**
 * Shared stage chrome for every Gateway Motion treatment: void background,
 * LQIP underlay (blurred manifest thumb shows while plates/textures decode),
 * optional grain layer on top. Treatments render as children filling the box.
 *
 * Visibility gating lives with the caller (useOnScreen on the sticky stage
 * wrapper) so one observer serves the treatment, the overlay, and the meters.
 */
export function GatewayStage({
  entry,
  grain = true,
  children,
}: {
  entry: GatewayVisualEntry | null;
  grain?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="gwm-stage">
      {entry?.plate.lqip ? (
        // eslint-disable-next-line @next/next/no-img-element -- raw public asset, optimizer disabled for this pipeline
        <img
          className="gwm-stage__lqip"
          src={entry.plate.lqip}
          alt=""
          aria-hidden
          draggable={false}
        />
      ) : null}
      <div className="gwm-stage__layer">{children}</div>
      {grain ? <div className="gwm-grain" aria-hidden /> : null}
    </div>
  );
}
