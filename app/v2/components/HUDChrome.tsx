import { STATIONS, type StationId, type StationMeta, type Telemetry } from "../LandingV2";

interface HUDChromeProps {
  telemetry: Telemetry;
  activeStation: StationMeta;
  onNavClick: (id: StationId) => (e: React.MouseEvent) => void;
}

const TICK_COUNT = 24;

function buildTicks(side: "left" | "right") {
  const ticks: Array<{ key: string; top: string; major: boolean; label?: string }> = [];
  for (let i = 0; i < TICK_COUNT; i++) {
    const top = (i / (TICK_COUNT - 1)) * 100 + "%";
    const major = i % 4 === 0;
    let label: string | undefined;
    if (major && side === "left") label = String(i * 2).padStart(2, "0");
    if (major && side === "right") label = String(Math.floor(i / 4) + 1).padStart(2, "0");
    ticks.push({ key: `${side}-${i}`, top, major, label });
  }
  return ticks;
}

const LEFT_TICKS = buildTicks("left");
const RIGHT_TICKS = buildTicks("right");

export function HUDChrome({ telemetry, activeStation, onNavClick }: HUDChromeProps) {
  const depthTop = `${4 + telemetry.progress * 92}%`;
  const progressPct = `${(telemetry.progress * 100).toFixed(1)}%`;
  const progressLabel = `${String(Math.round(telemetry.progress * 100)).padStart(2, "0")}%`;

  return (
    <div className="hud" aria-hidden={false}>
      <div className="hud__corner hud__corner--tl" />
      <div className="hud__corner hud__corner--tr" />
      <div className="hud__corner hud__corner--bl" />
      <div className="hud__corner hud__corner--br" />

      {/* Top bar */}
      <header className="hud__top">
        <div className="hud__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/Thoughtform_Brandmark.svg" alt="" />
          <span>Thoughtform</span>
          <span className="div">/</span>
          <span className="sector">{activeStation.sector}</span>
        </div>
        <nav className="hud__nav">
          {STATIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              data-station={s.id}
              className={activeStation.id === s.id ? "is-active" : undefined}
              onClick={onNavClick(s.id)}
            >
              <span className="num">{s.num}</span>
              {s.label}
            </a>
          ))}
        </nav>
        <div className="hud__signal">
          <span>
            <span className="dot" />
            <span className="l">Signal</span>
            <span className="v">{telemetry.signal}</span>
          </span>
          <span>
            <span className="l">Tier</span>
            <span className="v">Canonical</span>
          </span>
        </div>
      </header>

      {/* Left rail: depth */}
      <aside className="hud__rail hud__rail--l">
        <div className="hud__rail__track" />
        {LEFT_TICKS.map((t) => (
          <div
            key={t.key}
            className={`hud__rail__tick${t.major ? " hud__rail__tick--major" : ""}`}
            style={{ top: t.top }}
          />
        ))}
        {LEFT_TICKS.filter((t) => t.label).map((t) => (
          <div
            key={`${t.key}-lbl`}
            className="hud__rail__label"
            style={{ top: t.top, transform: "translateY(-50%)" }}
          >
            {t.label}
          </div>
        ))}
        <div className="hud__depth" style={{ top: depthTop }} />
      </aside>

      {/* Right rail: section markers */}
      <aside className="hud__rail hud__rail--r">
        <div className="hud__rail__track" />
        {RIGHT_TICKS.map((t) => (
          <div
            key={t.key}
            className={`hud__rail__tick${t.major ? " hud__rail__tick--major" : ""}`}
            style={{ top: t.top }}
          />
        ))}
        {RIGHT_TICKS.filter((t) => t.label).map((t) => (
          <div
            key={`${t.key}-lbl`}
            className="hud__rail__label"
            style={{ top: t.top, transform: "translateY(-50%)" }}
          >
            {t.label}
          </div>
        ))}
      </aside>

      {/* Bottom bar */}
      <footer className="hud__bottom">
        <div className="hud__coords">
          <span>
            <span className="k">δ</span>
            {telemetry.coords.d}
          </span>
          <span>
            <span className="k">θ</span>
            {telemetry.coords.t}
          </span>
          <span>
            <span className="k">ρ</span>
            {telemetry.coords.r}
          </span>
          <span>
            <span className="k">ζ</span>
            {telemetry.coords.z}
          </span>
        </div>
        <div className="hud__status">
          <span>{activeStation.status}</span>
          <span className="cursor" />
        </div>
        <div className="hud__progress">
          <span>{progressLabel}</span>
          <span className="bar" style={{ ["--p" as string]: progressPct } as React.CSSProperties} />
          <span>TOTAL</span>
        </div>
      </footer>
    </div>
  );
}
