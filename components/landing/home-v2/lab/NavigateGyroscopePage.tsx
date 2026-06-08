"use client";

import { useEffect } from "react";
import type { V7CorridorText } from "@/lib/v7-parse";
import { useGyroLabStore } from "@/lib/stores/gyroLabStore";
import { HomeV2Page } from "../HomeV2Page";
import { GyroLabPanel } from "./GyroLabPanel";

interface NavigateGyroscopePageProps {
  hudHtml: string;
  bodyClass: string;
  text: V7CorridorText;
}

/**
 * NavigateGyroscopePage — lab wrapper for `/test/navigate-gyroscope`.
 *
 * Renders the unmodified `HomeV2Page` corridor showcase (hero + the real
 * `HomeCorridor` + tail) and enables the gyroscope variant for the
 * duration of the route. The actual swap happens inside
 * `BrandmarkAccretionShell`, which reads `gyroLabStore.enabled`.
 *
 * Enabling on mount / resetting on unmount keeps the toggle scoped to
 * this route — navigating to `/test/home-v2` (or production) within the
 * same session restores the flat compass.
 */
export function NavigateGyroscopePage({ hudHtml, bodyClass, text }: NavigateGyroscopePageProps) {
  useEffect(() => {
    useGyroLabStore.getState().set({ enabled: true });
    return () => useGyroLabStore.getState().reset();
  }, []);

  return (
    <>
      <HomeV2Page hudHtml={hudHtml} bodyClass={bodyClass} text={text} />
      <GyroLabPanel />
    </>
  );
}
