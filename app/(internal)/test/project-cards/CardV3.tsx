"use client";

import type { CSSProperties } from "react";
import type { ProjectCase } from "@/components/landing/v7/tools-cards";
import {
  CaseImage,
  ReticleBrackets,
  TickRuler,
  TitleSegs,
  seedDigits,
} from "@/components/landing/v7/tools-cards";

/**
 * V3 — NAV TERMINAL. A navigation screen with the mission target locked
 * (Alien-style CRT nav). Thick gold rule over the title row; the image is
 * a map field with corner annotations INSIDE, a mint reticle lock and a
 * dotted course line to a waypoint; capabilities as channel plates;
 * STBY / tick-ruler / L VECTORS footer. Rust (`--alert`) secondary ink.
 */
export function CardV3({ data, index }: { data: ProjectCase; index: number }) {
  const d = (n: number) => ({ "--d": n }) as CSSProperties;
  const pageCode = `${index + 1}${"ABCD"[index]}`;
  return (
    <>
      <header className="pcl-card__head pcl-v3__head">
        <i className="pcl-v3__rule" aria-hidden="true" />
        <span className="pcl-v3__proj">PROJECT {data.index}</span>
        <span className="pcl-v3__team">{data.team}</span>
        <span className="pcl-v3__page">
          {pageCode}
          <i aria-hidden="true">◄</i>
        </span>
      </header>

      <div className="pcl-card__body pcl-v3__body">
        <div className="pcl-grid">
          <div className="pcl-left">
            <h2 className="pcl-v3__title" data-r style={d(0.05)}>
              <TitleSegs segs={data.title} />
            </h2>
            <p className="pcl-v3__callsign" data-r style={d(0.1)}>
              CALLSIGN · <em>{data.codename.toUpperCase()}</em>
            </p>

            <dl className="pcl-v3__status" data-r style={d(0.14)}>
              <div>
                <dt>MODE</dt>
                <dd>{data.mode}</dd>
              </div>
              <div>
                <dt>STATUS</dt>
                <dd className="pcl-v3__rust">{data.status.toUpperCase()}</dd>
              </div>
              <div>
                <dt>CYCLE</dt>
                <dd>{data.year}</dd>
              </div>
            </dl>

            <div className="pcl-v3__reading" data-r style={d(0.18)}>
              <p className="pcl-cap">Signal</p>
              <p className="pcl-body-copy">{data.challenge}</p>
            </div>
            <div className="pcl-v3__reading" data-r style={d(0.22)}>
              <p className="pcl-cap">Course correction</p>
              <p className="pcl-body-copy">{data.shift}</p>
            </div>

            <div className="pcl-v3__vectors" data-r style={d(0.26)}>
              <p className="pcl-cap">R Vectors</p>
              <p className="pcl-v3__vectorline">{data.stack.join("  ·  ")}</p>
            </div>
          </div>

          <div className="pcl-right">
            <figure className="pcl-media pcl-v3__media" data-r style={d(0.12)}>
              <span className="pcl-v3__ann pcl-v3__ann--tl">SIG LOCKED</span>
              <span className="pcl-v3__ann pcl-v3__ann--tr pcl-v3__rust">REC ▪</span>
              <span className="pcl-v3__ann pcl-v3__ann--bl">STBY</span>
              <span className="pcl-v3__ann pcl-v3__ann--br">{seedDigits(data.id, [2, 2, 4])}</span>
              <span className="pcl-v3__lock">
                <ReticleBrackets />
              </span>
              <svg
                className="pcl-v3__course"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <line x1="36" y1="40" x2="76" y2="70" />
              </svg>
              <span className="pcl-v3__waypoint">
                <i className="pcl-v3__waydia" aria-hidden="true" />
                {data.codename.toUpperCase()}.STATION
              </span>
              <CaseImage image={data.image} index={index} />
            </figure>

            <ul className="pcl-caps pcl-v3__caps">
              {data.capabilities.map((cap, i) => (
                <li key={cap.title} data-r style={d(0.2 + i * 0.05)}>
                  <span className="pcl-v3__channel">
                    0{i + 1}-{seedDigits(data.id + i, [4])}
                    <span className="pcl-v3__chips" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                  <p className="pcl-cap-title">{cap.title}</p>
                  <p className="pcl-cap-desc">{cap.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="pcl-foot pcl-v3__foot">
          <span>STBY</span>
          <TickRuler ticks={61} />
          <span>L VECTORS</span>
        </footer>
      </div>
    </>
  );
}
