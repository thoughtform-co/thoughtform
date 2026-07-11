"use client";

import type { CSSProperties } from "react";
import type { ProjectCase } from "./toolCardData";
import { CaseImage, TitleSegs, seedDigits } from "./chrome";

/**
 * ToolCardConsole — the CONSOLE PLATE skin: a bolted industrial faceplate
 * (CP77 Petrochem gold monitors). The compact production readout keeps
 * one metadata strip, the operational outcome, the artifact screenshot,
 * four capability rows, and a terse technology/version footer.
 *
 * Promoted from the /test/project-cards lab's CardV2 ("V2 Console") —
 * Vince's picked direction for the landing #tools section (ADR-030). The
 * lab still mounts it under its V2 chip; skin CSS lives in tools-cards.css
 * under the `.pcl-stack--v2` scope.
 */
export function toolCardTitleId(id: ProjectCase["id"]): string {
  return `tool-${id}-title`;
}

export function ToolCardConsole({ data, index }: { data: ProjectCase; index: number }) {
  const d = (n: number) => ({ "--d": n }) as CSSProperties;
  const titleId = toolCardTitleId(data.id);

  return (
    <>
      <header className="pcl-card__head pcl-v2__head">
        <span className="pcl-v2__plate">TF·{data.codename.toUpperCase()}</span>
        <h3 id={titleId} className="pcl-v2__title">
          <TitleSegs segs={data.title} />
        </h3>
        <span className="pcl-v2__unit">UNIT {data.index}/04</span>
      </header>

      <div className="pcl-card__body pcl-v2__body">
        <dl className="pcl-v2__meta" data-r style={d(0.05)}>
          <div className="pcl-v2__meta-item">
            <dt>Function</dt>
            <dd>{data.tagline}</dd>
          </div>
          <div className="pcl-v2__meta-item">
            <dt>Operator</dt>
            <dd>{data.team}</dd>
          </div>
          <div className="pcl-v2__meta-item">
            <dt>Mode</dt>
            <dd>{data.mode}</dd>
          </div>
          <div className="pcl-v2__meta-item">
            <dt>Status</dt>
            <dd>{data.status}</dd>
          </div>
        </dl>

        <div className="pcl-grid pcl-v2__readout">
          <div className="pcl-left">
            <div className="pcl-v2__outcome" data-r style={d(0.12)}>
              <p className="pcl-cap">Operational outcome</p>
              <p className="pcl-body-copy pcl-v2__shift">{data.shift}</p>
            </div>

            <ul className="pcl-caps pcl-v2__caps">
              {data.capabilities.map((cap, i) => (
                <li key={cap.title} data-r style={d(0.18 + i * 0.04)}>
                  <i className="pcl-v2__check" aria-hidden="true" />
                  <span className="pcl-v2__proc">CAP 0{i + 1}</span>
                  <span className="pcl-v2__capbody">
                    <span className="pcl-cap-title">{cap.title}</span>
                    <span className="pcl-cap-desc">{cap.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pcl-right">
            <figure className="pcl-media pcl-v2__media" data-r style={d(0.08)}>
              <CaseImage image={data.image} index={index} />
            </figure>
          </div>
        </div>

        <footer className="pcl-foot pcl-v2__foot">
          <span className="pcl-v2__tech">
            <span className="pcl-v2__tech-label">TECH</span>
            {data.stack.join(" · ")}
          </span>
          <span className="pcl-foot__spacer" />
          <span>SW {String(data.year).slice(2)}RC</span>
          <span className="pcl-v2__model">
            {seedDigits(data.id, [3])}N.{seedDigits(data.id + "m", [3])}C.
            {seedDigits(data.id + "x", [4])}.B
          </span>
        </footer>
      </div>
    </>
  );
}
