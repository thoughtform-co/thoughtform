"use client";

import type { CSSProperties } from "react";
import type { ProjectCase } from "@/components/landing/v7/tools-cards";
import {
  BarcodeStrip,
  CaseImage,
  IndexReadout,
  LabelChip,
  ModeBadge,
  TitleSegs,
  seedDigits,
} from "@/components/landing/v7/tools-cards";

/**
 * V1 — DOSSIER. A case file pulled from an archive (CP77 civil-screen
 * folder cards). Folder-tab notch top-right; document frame with corner
 * ticks + edge annotations on the image; features as a 2×2 attachment
 * index; barcode + serial + REV footer.
 */
export function CardV1({ data, index }: { data: ProjectCase; index: number }) {
  const d = (n: number) => ({ "--d": n }) as CSSProperties;
  return (
    <>
      <header className="pcl-card__head pcl-v1__head">
        <span className="pcl-v1__file">
          FILE <IndexReadout index={data.index} />
        </span>
        <h2 className="pcl-v1__title">
          <TitleSegs segs={data.title} />
        </h2>
        <span className="pcl-v1__code">{data.codename}</span>
        <LabelChip>Clearance · Internal</LabelChip>
      </header>

      <div className="pcl-card__body pcl-v1__body">
        <div className="pcl-grid">
          <div className="pcl-left">
            <p className="pcl-cap" data-r style={d(0.05)}>
              {data.team}
            </p>
            <p className="pcl-v1__tagline" data-r style={d(0.1)}>
              {data.tagline} — <em>{data.subline}</em>
            </p>

            <div className="pcl-v1__section" data-r style={d(0.15)}>
              <p className="pcl-cap">Challenge</p>
              <p className="pcl-body-copy">{data.challenge}</p>
            </div>

            <div className="pcl-v1__section" data-r style={d(0.2)}>
              <p className="pcl-cap">
                Workflow shift <ModeBadge mode={data.mode} />
              </p>
              <p className="pcl-body-copy">{data.shift}</p>
            </div>

            <div className="pcl-v1__stack" data-r style={d(0.25)}>
              <p className="pcl-cap">Stack</p>
              <div className="pcl-chiprow">
                {data.stack.map((s) => (
                  <LabelChip key={s}>{s}</LabelChip>
                ))}
              </div>
            </div>
          </div>

          <div className="pcl-right">
            <figure className="pcl-media pcl-v1__media" data-r style={d(0.15)}>
              <i className="pcl-v1__tick pcl-v1__tick--tl" aria-hidden="true" />
              <i className="pcl-v1__tick pcl-v1__tick--tr" aria-hidden="true" />
              <i className="pcl-v1__tick pcl-v1__tick--bl" aria-hidden="true" />
              <i className="pcl-v1__tick pcl-v1__tick--br" aria-hidden="true" />
              <span className="pcl-v1__exhibit">Exhibit A</span>
              <span className="pcl-v1__wl">
                W {data.image.width} · C {data.image.height}
              </span>
              <CaseImage image={data.image} index={index} />
            </figure>

            <ul className="pcl-caps pcl-v1__caps">
              {data.capabilities.map((cap, i) => (
                <li key={cap.title} data-r style={d(0.25 + i * 0.05)}>
                  <span className="pcl-v1__capindex">A{i + 1}</span>
                  <p className="pcl-cap-title">{cap.title}</p>
                  <p className="pcl-cap-desc">{cap.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="pcl-foot pcl-v1__foot">
          <BarcodeStrip seed={data.id} />
          <span className="pcl-foot__serial">TF·{seedDigits(data.id, [3, 4])}</span>
          <span className="pcl-foot__spacer" />
          <span>STATUS · {data.status.toUpperCase()}</span>
          <span>
            REV {data.year}.{index + 1}
          </span>
        </footer>
      </div>
    </>
  );
}
