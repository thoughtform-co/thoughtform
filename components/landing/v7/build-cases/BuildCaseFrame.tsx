"use client";

import Image from "next/image";
import type { BuildCase } from "./buildCaseData";

interface BuildCaseFrameProps {
  study: BuildCase;
  /** Slide index — drives bearing/depth readouts in the frame chrome. */
  slideIndex: number;
  /** "a" mirrors brackets to TL/BR; "b" mirrors to TR/BL. */
  variant: "a" | "b";
}

/**
 * The navigationally-inspired image panel for a build case. Holds the hero
 * screenshot inside a HUD-grade frame with asymmetric corner brackets, a
 * depth ladder, bearing readouts, and a small inset detail screenshot. Per
 * variant, the inset and ladder swap sides so consecutive cases feel
 * mirrored.
 */
export function BuildCaseFrame({ study, slideIndex, variant }: BuildCaseFrameProps) {
  const { hero, inserts } = study;
  const inset = inserts?.[0];

  // 8-position depth gauge — drives the right/left ladder. Cases land at
  // bearings 042, 116, 248, 304 to keep the readouts asymmetric without
  // looking random; pads to 3 chars for a stable monospace width.
  const bearings = ["042", "116", "248", "304"];
  const bearing = bearings[slideIndex % bearings.length];
  const depth = (0.31 + slideIndex * 0.13).toFixed(2);
  const figLabel = `FIG · ${study.index.replace(/\s/g, "")} / ${study.id.toUpperCase()}`;

  return (
    <figure
      className={`build-case__frame build-case__frame--${variant}`}
      aria-labelledby={`build-case-${study.id}-caption`}
    >
      <div className="build-case__frame__shell">
        <span
          className="build-case__frame__bracket build-case__frame__bracket--tl"
          aria-hidden="true"
        />
        <span
          className="build-case__frame__bracket build-case__frame__bracket--br"
          aria-hidden="true"
        />

        <span className="build-case__frame__topbar" aria-hidden="true">
          <span className="build-case__frame__topbar__id">
            <span className="k">δ</span>
            {depth}
          </span>
          <span className="build-case__frame__topbar__rule" />
          <span className="build-case__frame__topbar__fig">{figLabel}</span>
        </span>

        <span className="build-case__frame__bottombar" aria-hidden="true">
          <span className="build-case__frame__bottombar__brg">
            <span className="k">brg</span>
            {bearing}°
          </span>
          <span className="build-case__frame__bottombar__rule" />
          <span className="build-case__frame__bottombar__tag">
            {study.status === "production" ? "● Live · production" : "◐ WIP · in build"}
          </span>
        </span>

        <span className="build-case__frame__ladder" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={`build-case__frame__ladder__tick${i === 2 || i === 6 ? " is-major" : ""}`}
            />
          ))}
        </span>

        <span className="build-case__frame__reticle" aria-hidden="true">
          <span className="build-case__frame__reticle__diamond" />
          <span className="build-case__frame__reticle__label">04q · {study.id}</span>
        </span>

        <div className="build-case__frame__hero">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            sizes="(max-width: 760px) 100vw, (max-width: 1200px) 60vw, 760px"
            className="build-case__frame__hero__img"
            priority={slideIndex === 0}
          />
        </div>

        {inset && (
          <div className="build-case__frame__inset" aria-hidden="true">
            <span className="build-case__frame__inset__label">
              <span className="k">det</span>· {study.id}/02
            </span>
            <Image
              src={inset.src}
              alt={inset.alt}
              fill
              sizes="(max-width: 760px) 60vw, 320px"
              className="build-case__frame__inset__img"
            />
          </div>
        )}
      </div>

      <figcaption id={`build-case-${study.id}-caption`} className="visually-hidden">
        {hero.alt}
      </figcaption>
    </figure>
  );
}
