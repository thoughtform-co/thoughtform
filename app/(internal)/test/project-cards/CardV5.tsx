"use client";

import type { CSSProperties } from "react";
import type { ProjectCase } from "@/components/landing/v7/tools-cards";
import { CaseImage, IndexReadout, LabelChip, TitleSegs } from "@/components/landing/v7/tools-cards";

/**
 * V5 — SIGNAL LEDGER. The calm editorial pole (spade.com card IA
 * translated into the system). One label chip, generous darkspace, large
 * mono display title, IBM Plex Sans body, single hairline image frame,
 * features as a 2×2 grid with diamond markers, one gold CTA. Proves the
 * system at low chrome density — closest to shippable.
 */
export function CardV5({ data, index }: { data: ProjectCase; index: number }) {
  const d = (n: number) => ({ "--d": n }) as CSSProperties;
  return (
    <>
      <header className="pcl-card__head pcl-v5__head">
        <IndexReadout index={data.index} />
        <span className="pcl-foot__spacer" />
        <LabelChip>{data.team}</LabelChip>
      </header>

      <div className="pcl-card__body pcl-v5__body">
        <div className="pcl-grid">
          <div className="pcl-left">
            <p className="pcl-cap pcl-v5__tagline" data-r style={d(0.05)}>
              {data.tagline}
            </p>
            <h2 className="pcl-v5__title" data-r style={d(0.1)}>
              <TitleSegs segs={data.title} />
            </h2>
            <p className="pcl-v5__codename" data-r style={d(0.14)}>
              {data.codename}
            </p>
            <p className="pcl-v5__lede" data-r style={d(0.18)}>
              {data.subline}
            </p>
            <p className="pcl-v5__copy" data-r style={d(0.22)}>
              {data.shift}
            </p>

            <p className="pcl-v5__cta" data-r style={d(0.26)}>
              <a href="#" onClick={(e) => e.preventDefault()}>
                View case detail <i aria-hidden="true" />
              </a>
            </p>

            <p className="pcl-v5__provenance" data-r style={d(0.3)}>
              <LabelChip tone="mint">Built in-house · {data.year}</LabelChip>
            </p>
          </div>

          <div className="pcl-right">
            <figure className="pcl-media pcl-v5__media" data-r style={d(0.12)}>
              <CaseImage image={data.image} index={index} />
            </figure>

            <ul className="pcl-caps pcl-v5__caps">
              {data.capabilities.map((cap, i) => (
                <li key={cap.title} data-r style={d(0.2 + i * 0.05)}>
                  <i className="pcl-v5__dia" aria-hidden="true" />
                  <p className="pcl-cap-title">{cap.title}</p>
                  <p className="pcl-cap-desc">{cap.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="pcl-foot pcl-v5__foot">
          <span className="pcl-foot__spacer" />
          <span>
            {data.codename} · {data.year}
          </span>
        </footer>
      </div>
    </>
  );
}
