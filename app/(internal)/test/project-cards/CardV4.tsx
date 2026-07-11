"use client";

import type { CSSProperties } from "react";
import type { ProjectCase } from "@/components/landing/v7/tools-cards";
import { CaseImage, LabelChip, TitleSegs } from "@/components/landing/v7/tools-cards";

/**
 * V4 — SPEC SHEET. A proprietary technical drawing of the build
 * (Perplexity blueprint grammar). Hatched notch bottom-right, dashed
 * outline; dimension callouts around the image on a faint drafting grid;
 * capabilities as a numbered parts list (BOM); engineering title block
 * as the footer.
 */
export function CardV4({ data, index }: { data: ProjectCase; index: number }) {
  const d = (n: number) => ({ "--d": n }) as CSSProperties;
  const partNo = `TF-PC-${data.id.slice(0, 3).toUpperCase()}-0${index + 1}`;
  return (
    <>
      <header className="pcl-card__head pcl-v4__head">
        <span className="pcl-v4__doc">{partNo}</span>
        <h2 className="pcl-v4__title">
          || <TitleSegs segs={data.title} /> — SPECIFICATION DOCUMENT ||
        </h2>
        <span className="pcl-v4__rev">REV {"ABCD"[index]}</span>
      </header>

      <div className="pcl-card__body pcl-v4__body">
        <div className="pcl-grid">
          <div className="pcl-left">
            <div className="pcl-v4__section" data-r style={d(0.05)}>
              <p className="pcl-cap">Scope</p>
              <p className="pcl-body-copy">{data.challenge}</p>
            </div>
            <div className="pcl-v4__section" data-r style={d(0.1)}>
              <p className="pcl-cap">Method</p>
              <p className="pcl-body-copy">{data.shift}</p>
            </div>

            <div className="pcl-v4__section" data-r style={d(0.15)}>
              <p className="pcl-cap">Deployed surfaces</p>
              <ol className="pcl-v4__surfaces">
                {data.surfaces.map((s, i) => (
                  <li key={s}>
                    <span>({["i", "ii", "iii", "iv", "v", "vi"][i]})</span> {s}
                  </li>
                ))}
              </ol>
            </div>

            <div className="pcl-v4__tolerance" data-r style={d(0.2)}>
              <LabelChip>Tolerance ±0.1</LabelChip>
              <LabelChip tone="inverted">Do not scale drawing</LabelChip>
            </div>
          </div>

          <div className="pcl-right">
            <figure className="pcl-media pcl-v4__media" data-r style={d(0.1)}>
              <span className="pcl-v4__dim pcl-v4__dim--w">
                <i aria-hidden="true" />W {data.image.width}
              </span>
              <span className="pcl-v4__dim pcl-v4__dim--h">
                <i aria-hidden="true" />H {data.image.height}
              </span>
              <CaseImage image={data.image} index={index} />
            </figure>

            <table className="pcl-v4__bom" data-r style={{ "--d": 0.18 } as CSSProperties}>
              <thead>
                <tr>
                  <th>NO</th>
                  <th>COMPONENT</th>
                  <th>SPECIFICATION</th>
                </tr>
              </thead>
              <tbody>
                {data.capabilities.map((cap, i) => (
                  <tr key={cap.title}>
                    <td>0{i + 1}</td>
                    <td>{cap.title}</td>
                    <td>{cap.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="pcl-foot pcl-v4__foot">
          <div className="pcl-v4__block">
            <span className="pcl-v4__blocklabel">Title</span>
            <span className="pcl-v4__blockvalue">
              {data.title.map((s) => s.text).join("")} · {data.codename}
            </span>
          </div>
          <div className="pcl-v4__block">
            <span className="pcl-v4__blocklabel">Part No</span>
            <span className="pcl-v4__blockvalue">{partNo}</span>
          </div>
          <div className="pcl-v4__block">
            <span className="pcl-v4__blocklabel">Date</span>
            <span className="pcl-v4__blockvalue">{data.year}</span>
          </div>
          <div className="pcl-v4__block">
            <span className="pcl-v4__blocklabel">Scale</span>
            <span className="pcl-v4__blockvalue">1:1</span>
          </div>
          <div className="pcl-v4__block">
            <span className="pcl-v4__blocklabel">Sheet</span>
            <span className="pcl-v4__blockvalue">{data.index} OF 04</span>
          </div>
        </footer>
      </div>
    </>
  );
}
