"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Gateway } from "./components/Gateway";
import { HUDChrome } from "./components/HUDChrome";
import {
  HeroStation,
  DefinitionStation,
  PracticeStation,
  ServicesStation,
  ProductsStation,
  ApproachStation,
  AboutStation,
  ContactStation,
} from "./components/stations";

export type StationId =
  | "hero"
  | "definition"
  | "practice"
  | "services"
  | "products"
  | "approach"
  | "about"
  | "contact";

export interface StationMeta {
  id: StationId;
  num: string;
  label: string;
  sector: string;
  status: string;
}

export const STATIONS: StationMeta[] = [
  {
    id: "hero",
    num: "01",
    label: "Interface",
    sector: "Origin",
    status: "Scroll to descend · the window stays · the world changes",
  },
  {
    id: "definition",
    num: "02",
    label: "Definition",
    sector: "Continuum",
    status: "Reading definition · locating the spectrum",
  },
  {
    id: "practice",
    num: "03",
    label: "Practice",
    sector: "Field",
    status: "Surveying practice · adopt → encode → build",
  },
  {
    id: "services",
    num: "04",
    label: "Services",
    sector: "Runway",
    status: "Approaching service triad · three instruments mapped",
  },
  {
    id: "products",
    num: "05",
    label: "Products",
    sector: "Fleet",
    status: "Fleet constellation · 4 instruments in deck",
  },
  {
    id: "approach",
    num: "06",
    label: "Approach",
    sector: "Method",
    status: "Surveying method · 6 principles logged",
  },
  {
    id: "about",
    num: "07",
    label: "About",
    sector: "Story",
    status: "Telemetry nominal · crew identity resolved",
  },
  {
    id: "contact",
    num: "08",
    label: "Contact",
    sector: "Horizon",
    status: "Event horizon · awaiting handshake",
  },
];

export interface Telemetry {
  progress: number; // 0..1
  depth: number; // 0..1 (capped)
  active: StationId;
  coords: { d: string; t: string; r: string; z: string };
  signal: string;
}

function computeTelemetry(progress: number, active: StationId): Telemetry {
  const depth = Math.min(1, progress * 1.2);
  return {
    progress,
    depth,
    active,
    coords: {
      d: (0.2 + progress * 0.55).toFixed(2),
      t:
        String(Math.round(progress * 359)).padStart(3, "0") +
        "." +
        String(Math.round((progress * 10) % 10)) +
        "°",
      r: (0.4 + Math.sin(progress * 6) * 0.25 + 0.3).toFixed(2),
      z: (1.2 + progress * 5.8).toFixed(1),
    },
    signal: (0.72 + Math.sin(progress * 4) * 0.12 + 0.05).toFixed(2),
  };
}

export function LandingV2() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [telemetry, setTelemetry] = useState<Telemetry>(() => computeTelemetry(0, "hero"));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const stations = Array.from(root.querySelectorAll<HTMLElement>("section[data-station]"));

    let rafId: number | null = null;
    const update = () => {
      rafId = null;
      const h = document.documentElement;
      const scrollMax = h.scrollHeight - window.innerHeight;
      const p = scrollMax > 0 ? Math.max(0, Math.min(1, window.scrollY / scrollMax)) : 0;

      const viewportMid = window.scrollY + window.innerHeight / 2;
      let activeEl: HTMLElement = stations[0];
      for (const s of stations) {
        if (s.offsetTop <= viewportMid) activeEl = s;
      }
      const active = (activeEl?.getAttribute("data-station") as StationId) || "hero";

      const next = computeTelemetry(p, active);
      setTelemetry(next);

      root.style.setProperty("--depth", next.depth.toFixed(4));
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const onNavClick = (id: StationId) => (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    window.scrollTo({ top: target.offsetTop - 20, behavior: "smooth" });
  };

  const activeStation = useMemo(
    () => STATIONS.find((s) => s.id === telemetry.active) ?? STATIONS[0],
    [telemetry.active]
  );

  return (
    <div className="v2-landing" ref={rootRef}>
      <Gateway />
      <HUDChrome telemetry={telemetry} activeStation={activeStation} onNavClick={onNavClick} />

      <main className="stations">
        <HeroStation />
        <DefinitionStation />
        <PracticeStation />
        <ServicesStation />
        <ProductsStation />
        <ApproachStation />
        <AboutStation />
        <ContactStation />
      </main>

      <footer className="foot">
        <div className="foot__l">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/Thoughtform_Brandmark.svg" alt="" />
          <span>Thoughtform · 2026</span>
        </div>
        <div className="foot__c">Navigate intelligence.</div>
        <div className="foot__r">
          <a href="#">Twitter</a>
          <a href="#">LinkedIn</a>
          <a href="#">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
