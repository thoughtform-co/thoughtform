"use client";

import { createContext, useContext } from "react";

import { resolveCorridorCopy, type CorridorCopy } from "@/lib/home-v2/corridorCopy";

/**
 * The route's corridor copy, provided once by `HomeCorridor` (ADR-143 U3).
 *
 * The default is today's copy, so a reader mounted outside the provider
 * (a lab, a story) still prints what `/` prints. The value is a static
 * prop resolved at mount; it never changes while the corridor lives, so
 * nothing re-renders on it and `LandingPage` stays render-stable.
 */
const CorridorCopyContext = createContext<CorridorCopy>(resolveCorridorCopy());

export const CorridorCopyProvider = CorridorCopyContext.Provider;

export function useCorridorCopy(): CorridorCopy {
  return useContext(CorridorCopyContext);
}
