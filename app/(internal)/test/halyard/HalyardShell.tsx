"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { RailInstruments } from "@/components/landing/v7/rail-instruments/RailInstruments";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";

/* The REAL frame, borrowed from the panel lab: the rails, ticks, corners and
   wordmark are the shipped markup, so the sections are judged inside the
   page they will live on. Render-stable: mounted once, never keyed. */
import { HudFrame } from "../hud-panel-lab/HudFrame";
import { DirectionA } from "./DirectionA";
import { DirectionB } from "./DirectionB";
import { DirectionC } from "./DirectionC";

export type HalyardDir = "a" | "b" | "c";

interface Props {
  hudHtml: string;
  bodyClass: string;
  dir: HalyardDir;
  step: number | null;
  still: boolean;
}

export function HalyardShell({ hudHtml, bodyClass, dir, step, still }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  /* The frame is revealed by clipping the rails to the hero's bottom edge;
     with no hero the property is absent and the rails stay hidden. */
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("--hero-lift", "1");
    html.style.setProperty("--hero-cover", "1");
    return () => {
      html.style.removeProperty("--hero-lift");
      html.style.removeProperty("--hero-cover");
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`hy-root ${bodyClass}`}
      data-hy-dir={dir}
      data-hy-still={still ? "" : undefined}
    >
      <HudFrame hudHtml={hudHtml} />
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} />}
      {THEME_TOGGLE && <SettingsCluster />}

      {dir === "a" ? <DirectionA step={step} /> : dir === "b" ? <DirectionB /> : <DirectionC />}

      {still ? null : (
        <nav className="hy-switch" aria-label="Directions">
          {(["a", "b", "c"] as const).map((d) => (
            <Link key={d} href={`/test/halyard?d=${d}`} data-on={d === dir ? "" : undefined}>
              {d.toUpperCase()}
            </Link>
          ))}
          {dir === "a" ? (
            <span className="hy-switch__steps">
              {[1, 2, 3].map((n) => (
                <Link
                  key={n}
                  href={`/test/halyard?d=a&step=${n}`}
                  data-on={n === step ? "" : undefined}
                >
                  {n}
                </Link>
              ))}
            </span>
          ) : null}
        </nav>
      )}
    </div>
  );
}
