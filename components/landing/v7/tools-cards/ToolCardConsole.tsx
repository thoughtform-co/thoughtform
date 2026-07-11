"use client";

import type { CSSProperties } from "react";
import type { ProjectCase } from "./toolCardData";
import { BarcodeStrip, CaseImage, DataField, TitleSegs, seedDigits } from "./chrome";

/**
 * ToolCardConsole — the CONSOLE PLATE skin: a bolted industrial faceplate
 * (CP77 Petrochem gold monitors). Machined notch bottom-left;
 * caption-above-outlined-box DataFields; capabilities as a PROCESS 01–04
 * checklist with filled checkboxes; T-chip stack table; SW VERSION +
 * model-line footer.
 *
 * Promoted from the /test/project-cards lab's CardV2 ("V2 Console") —
 * Vince's picked direction for the landing #tools section (ADR-030). The
 * lab still mounts it under its V2 chip; skin CSS lives in tools-cards.css
 * under the `.pcl-stack--v2` scope.
 */
export function ToolCardConsole({ data, index }: { data: ProjectCase; index: number }) {
  const d = (n: number) => ({ "--d": n }) as CSSProperties;
  return (
    <>
      <header className="pcl-card__head pcl-v2__head">
        <span className="pcl-v2__plate">TF·{data.codename.toUpperCase()}</span>
        <h2 className="pcl-v2__title">
          <TitleSegs segs={data.title} />
        </h2>
        <span className="pcl-v2__unit">
          UNIT {data.index}/04
          <i className="pcl-v2__certmark" aria-hidden="true">
            TF|{String(data.year).slice(2)}
          </i>
        </span>
      </header>

      <div className="pcl-card__body pcl-v2__body">
        <div className="pcl-grid">
          <div className="pcl-left">
            <div className="pcl-v2__fields" data-r style={d(0.05)}>
              <DataField label="Designation" value={data.codename} />
              <DataField label="Function" value={data.tagline} />
              <DataField label="Operator" value={data.team} />
              <DataField label="Access" value={data.mode} />
            </div>

            <div className="pcl-v2__notes" data-r style={d(0.15)}>
              <p className="pcl-cap">Notes</p>
              <p className="pcl-body-copy">{data.challenge}</p>
              <p className="pcl-body-copy pcl-v2__shift">{data.shift}</p>
            </div>

            <div className="pcl-v2__tchips" data-r style={d(0.22)}>
              <p className="pcl-cap">Components</p>
              <div className="pcl-v2__tgrid">
                {data.stack.map((s) => (
                  <span key={s} className="pcl-v2__tchip">
                    <i aria-hidden="true">T</i>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pcl-right">
            <figure className="pcl-media pcl-v2__media" data-r style={d(0.12)}>
              <CaseImage image={data.image} index={index} />
            </figure>

            <ul className="pcl-caps pcl-v2__caps">
              {data.capabilities.map((cap, i) => (
                <li key={cap.title} data-r style={d(0.2 + i * 0.05)}>
                  <i className="pcl-v2__check" aria-hidden="true" />
                  <span className="pcl-v2__proc">PROCESS 0{i + 1}</span>
                  <span className="pcl-v2__capbody">
                    <p className="pcl-cap-title">{cap.title}</p>
                    <p className="pcl-cap-desc">{cap.desc}</p>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="pcl-foot pcl-v2__foot">
          <span>SW VERSION {String(data.year).slice(2)}RC</span>
          <span className="pcl-v2__model">
            {seedDigits(data.id, [3])}N.{seedDigits(data.id + "m", [3])}C.
            {seedDigits(data.id + "x", [4])}.B
          </span>
          <span className="pcl-foot__spacer" />
          <BarcodeStrip seed={data.id + "-v2"} />
        </footer>
      </div>
    </>
  );
}
