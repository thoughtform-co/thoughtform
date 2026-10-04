import type { Metadata } from "next";

import { equilibriumStationHtml } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/equilibrium";
import {
  EQ_FIGURE_LIVE,
  type EqFigureId,
  isEqFigureId,
} from "@/components/holo-program/equilibriumFigures";
import { WORKSHOP_INTRO } from "@/lib/arcs/content/shared/workshopIntro";

import { EqLabMount } from "./EqLabMount";

import "@/components/landing/v7/landing.css";
import "@/app/(marketing)/arcs/thoughtform/workshop-v1/thoughtform-workshop.css";
import "@/app/(marketing)/arcs/thoughtform/workshop-v3/equilibrium.css";
import "@/components/landing/v7/theme.css";
import "./equilibrium-lab.css";

export const metadata: Metadata = {
  title: "Equilibrium Lab — the opener's figures (Internal)",
  description:
    "Look-dev for the workshop's opener (ADR-143 U8/U9): the instrument on one axis beside the river of data through a diorama, in the station they ship in.",
  robots: { index: false, follow: false },
};

const FIGURES: { id: EqFigureId; label: string }[] = [
  { id: "river", label: "River · diorama" },
  { id: "instrument", label: "Instrument · one axis" },
];

/**
 * /test/equilibrium-lab — the opener's figures (ADR-143 U9), one at a time,
 * in the station they ship in.
 *
 * ⚠ A WINDOW ONTO PRODUCTION, NOT A COPY (the holo-program lab's rule): the
 * markup is `equilibriumStationHtml` itself and the canvas is the live
 * `EquilibriumMount`, so what is judged here is what the page would render.
 * The page shows `EQ_FIGURE_LIVE`; promoting a figure is that constant.
 *
 * ⚠ THE SWITCH IS A FULL LOAD (plain links, not `next/link`): the canvas
 * mounts as a nested root into the station's slot, and a client-side swap of
 * the station would leave that root on a detached node.
 */
export default async function EquilibriumLabRoute({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; theme?: string }>;
}) {
  const { v, theme } = await searchParams;
  const light = theme === "light";
  const variant: EqFigureId = isEqFigureId(v) ? v : "river";
  const html = equilibriumStationHtml(WORKSHOP_INTRO.equilibrium, variant);

  return (
    <>
      <nav className="eql-bar" aria-label="Figures">
        <span className="eql-bar__title">Equilibrium lab</span>
        {FIGURES.map((f) => (
          <a
            key={f.id}
            className="eql-bar__tab"
            href={`?v=${f.id}${light ? "&theme=light" : ""}`}
            aria-current={f.id === variant ? "page" : undefined}
          >
            {f.label}
            {f.id === EQ_FIGURE_LIVE ? " · live" : ""}
          </a>
        ))}
        <a className="eql-bar__tab" href={`?v=${variant}${light ? "" : "&theme=light"}`}>
          {light ? "Dark" : "Light"}
        </a>
      </nav>
      <div
        className="tw-root eql-root"
        data-tw-cut="v3"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <EqLabMount />
    </>
  );
}
