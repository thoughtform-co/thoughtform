"use client";

import { useLayoutEffect } from "react";

import EquilibriumMount from "@/app/(marketing)/arcs/thoughtform/workshop-v3/EquilibriumMount";
import { useNestedRoot } from "@/app/(marketing)/arcs/trinny-london/proposal/useNestedRoot";
import { useThemeStore } from "@/lib/stores/themeStore";

/** The live mount, armed at once: the lab has no hero to lift off it. */
const NODE = <EquilibriumMount armAt={0} />;

export function EqLabMount() {
  /* ⚠ THE STORE FOLLOWS THE DOM ONLY WHEN SOMETHING HYDRATES IT. On the page
     the theme switch does; the lab mounts no switch, so without this the
     canvas paints the dark palette (additive dawn) on a parchment page. A
     LAYOUT effect, as `ThemeLock`'s, so the first frame already agrees. */
  useLayoutEffect(() => {
    useThemeStore.getState().hydrateFromDom();
  }, []);
  useNestedRoot(".eql-root [data-tw-eq-canvas]", NODE);
  return null;
}
