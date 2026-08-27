"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import proofConcept from "@/docs/design/mobile-instruments/proof-mobile-concept.png";
import voidwalkerConcept from "@/docs/design/mobile-instruments/voidwalker-mobile-concept.png";

type Surface = "proof" | "voidwalker";
type Presentation = "html" | "concept";
type DeviceWidth = 320 | 390 | 430;
type ProofMode = "brief" | "proof" | "artifact";
type VoidwalkerMode = "record" | "scope" | "transmission";

interface ProofTrack {
  short: string;
  meta: string;
  project: string;
  classification: string;
  brief: string;
  proofs: readonly string[];
  artifact: "map" | "tools" | "studio" | "films";
}

interface Era {
  year: string;
  short: string;
  title: string;
  motto: string;
  loadout: string;
  facts: readonly [string, string][];
  transmission?: string;
}

const DEVICES: readonly DeviceWidth[] = [320, 390, 430];

const PROOF_TRACKS: readonly ProofTrack[] = [
  {
    short: "Map",
    meta: "27 → 47",
    project: "Intelligence Map",
    classification: "AI adoption · active",
    brief:
      "Every piece of work at Loop, and how much intelligence runs in it. The board lays out the estate: work streams as modules, clustered by the team that owns them.",
    proofs: [
      "Every stream on one board",
      "47 Skills encoded",
      "Reuse beats rebuilding",
      "Draw stays within envelope",
    ],
    artifact: "map",
  },
  {
    short: "Software",
    meta: "4 tools",
    project: "Software for Few",
    classification: "AI-assisted development · active",
    brief:
      "AI made software worth building for workflows a conventional product roadmap would ignore. Four internal tools grew from live bottlenecks.",
    proofs: [
      "Too specific to buy",
      "Rebuilt, not accelerated",
      "Owned by the teams",
      "One substrate, four tools",
    ],
    artifact: "tools",
  },
  {
    short: "Studio",
    meta: "500 ads/mo",
    project: "AI Fluency Studio",
    classification: "AI adoption · creative production · active",
    brief:
      "Creative Technology embedded inside Studio to turn AI from a specialist service into a capability the creative team owns.",
    proofs: [
      "97% of briefings involve AI",
      "Campaigns beat their target",
      "Two to three times faster",
      "The studio owns the work",
    ],
    artifact: "studio",
  },
  {
    short: "Films",
    meta: "2 films",
    project: "AI Above-the-Line",
    classification: "Generative production · shipped",
    brief:
      "Two narrative films produced with AI for top-of-funnel paid media, held to the same direction, edit, colour, and sound standard as live action.",
    proofs: [
      "Two 30-second masters",
      "One craft standard",
      "Ran on YouTube and CTV",
      "Ran beside live action",
    ],
    artifact: "films",
  },
] as const;

const ERAS: readonly Era[] = [
  {
    year: "2026",
    short: "Architect",
    title: "The Intelligence Architect",
    motto: "Owning the map between work and intelligence.",
    loadout: "Long coat · Thoughtform cap · brooch · rings · signet map on the hand.",
    facts: [
      ["Seat", "Loop Earplugs"],
      ["Owns", "The map between work and intelligence"],
      ["Decides", "Which setup runs which workflow"],
    ],
  },
  {
    year: "2025",
    short: "Thoughtform",
    title: "The Founder",
    motto: "The practice, founded.",
    loadout: "Blazer · turtleneck · Thoughtform cap · brooch · rings.",
    facts: [
      ["Founded", "Thoughtform, the practice"],
      ["Subject", "Organisations"],
      ["In place of", "A platform, an intelligence"],
    ],
  },
  {
    year: "2022",
    short: "Latent Land",
    title: "The AI Captain",
    motto: "The models arrived. Wrote the charter.",
    loadout: "Blazer · shirt · Latent Land cape · cap.",
    facts: [
      ["Founded", "Starhaven"],
      ["First", "Hybrid AI-video production in Belgium"],
      ["Charter", "UBA/ACC AI Charter, co-drafted"],
    ],
    transmission: "Welcome to Latent Land",
  },
  {
    year: "2020",
    short: "Azeroth",
    title: "The Azeroth Teacher",
    motto: "Class moved into the game.",
    loadout: "Blazer · turtleneck · cap · lecturer's tote · headphones.",
    facts: [
      ["Field site", "Azeroth"],
      ["Course", "Online Communities"],
      ["The exit", "Built into the calendar"],
    ],
  },
  {
    year: "2016–18",
    short: "The Crowd",
    title: "The Street Organiser",
    motto: "The crowd was the work.",
    loadout: "Blazer · shirt · lanyard · camera · phone · cap.",
    facts: [
      ["Petition", "Past 100,000 signatures"],
      ["Street hunt", "About a thousand"],
      ["Zoo hunt", "Sixteen thousand"],
    ],
    transmission: "How the power of fans saved The Expanse",
  },
  {
    year: "2014",
    short: "Creatives",
    title: "The Community Manager",
    motto: "Antwerp. Powered by Creatives.",
    loadout: "Shorter blazer · shirt · mic · lanyard · cap.",
    facts: [
      ["Role", "Community manager"],
      ["Terrain", "The Antwerp creative industry"],
      ["The test", "It holds without its organiser"],
    ],
  },
] as const;

function ProofArtifact({ kind }: { kind: ProofTrack["artifact"] }) {
  if (kind === "map") {
    return (
      <div className="mil-map" aria-label="Intelligence Map schematic">
        {[
          ["Research", 4],
          ["Strategy", 3],
          ["Creative", 4],
          ["Engineering", 3],
          ["Operations", 3],
        ].map(([label, count]) => (
          <section className="mil-map__group" key={String(label)}>
            <h4>{label}</h4>
            <div className="mil-map__nodes">
              {Array.from({ length: Number(count) }, (_, index) => (
                <span key={index}>
                  <i />
                  <b />
                </span>
              ))}
            </div>
          </section>
        ))}
        <div className="mil-map__bus" aria-hidden="true" />
      </div>
    );
  }

  if (kind === "tools") {
    return (
      <div className="mil-tools" aria-label="Software for Few dossier">
        {[
          "Campaign Generator",
          "Briefing Orchestrator",
          "Briefing Intelligence",
          "Localization Pipeline",
        ].map((tool, index) => (
          <article key={tool}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h4>{tool}</h4>
            <p>Workflow owner / active instrument</p>
          </article>
        ))}
      </div>
    );
  }

  if (kind === "studio") {
    return (
      <div className="mil-studio" aria-label="AI Fluency Studio production sheets">
        {["Brief", "Generate", "Review", "Ship"].map((step, index) => (
          <article key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h4>{step}</h4>
            <div aria-hidden="true" />
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="mil-films" aria-label="AI Above-the-Line film masters">
      {["Master / 01", "Master / 02"].map((film) => (
        <article key={film}>
          <div aria-hidden="true">
            <span />
          </div>
          <h4>{film}</h4>
          <p>30 sec · 16:9 · shipped</p>
        </article>
      ))}
    </div>
  );
}

function ProofInstrument() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [mode, setMode] = useState<ProofMode>("artifact");
  const track = PROOF_TRACKS[trackIndex];

  return (
    <section className="mil-instrument mil-proof" aria-label="Interactive Proof mobile mockup">
      <header className="mil-proof__series">
        <span>Proof / Loop Earplugs</span>
        <span>Case / {String(trackIndex + 1).padStart(2, "0")} of 04</span>
      </header>

      <div className="mil-proof__identity" aria-live="polite">
        <p>{track.meta}</p>
        <h2>
          {track.project}
          <b>.</b>
        </h2>
        <span>{track.classification}</span>
      </div>

      <div className="mil-modes" role="group" aria-label={`${track.project} view`}>
        {(["brief", "proof", "artifact"] as const).map((item) => (
          <button
            key={item}
            type="button"
            data-on={mode === item || undefined}
            aria-pressed={mode === item}
            onClick={() => setMode(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mil-proof__seat" tabIndex={0} aria-label={`${track.project} ${mode}`}>
        {mode === "brief" ? (
          <article className="mil-brief">
            <p className="mil-kicker">Brief / {track.short}</p>
            <p>{track.brief}</p>
          </article>
        ) : null}
        {mode === "proof" ? (
          <ol className="mil-proof-list">
            {track.proofs.map((proof, index) => (
              <li key={proof}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{proof}</p>
                <i aria-hidden="true" />
              </li>
            ))}
          </ol>
        ) : null}
        {mode === "artifact" ? <ProofArtifact kind={track.artifact} /> : null}
      </div>

      <div className="mil-proof__readout" aria-hidden="true">
        <span>27 modules</span>
        <span>47 Skills</span>
        <span>19 / 24 reused</span>
      </div>

      <nav className="mil-proof__rail" aria-label="Cases">
        {PROOF_TRACKS.map((item, index) => (
          <button
            key={item.short}
            type="button"
            data-on={trackIndex === index || undefined}
            aria-current={trackIndex === index ? "true" : undefined}
            onClick={() => setTrackIndex(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{item.short}</b>
          </button>
        ))}
      </nav>
    </section>
  );
}

function VoidwalkerInstrument() {
  const [eraIndex, setEraIndex] = useState(1);
  const [mode, setMode] = useState<VoidwalkerMode>("scope");
  const era = ERAS[eraIndex];

  const selectEra = (index: number) => {
    const next = ERAS[index];
    if (mode === "transmission" && !next.transmission) setMode("record");
    setEraIndex(index);
  };

  return (
    <section
      className="mil-instrument mil-voidwalker"
      aria-label="Interactive Voidwalker mobile mockup"
    >
      <header className="mil-voidwalker__series">
        <span>Voidwalker</span>
        <span>Era / {String(eraIndex + 1).padStart(2, "0")} of 06</span>
      </header>

      <div className="mil-voidwalker__identity" aria-live="polite">
        <h2>{era.title}</h2>
        <p>{era.year}</p>
      </div>

      <figure className="mil-projector">
        <span className="mil-projector__scan" aria-hidden="true" />
        <Image
          src="/images/voidwalker/holo-still-thoughtform.webp"
          alt="Full-body Thoughtform hologram study"
          width={720}
          height={1280}
          priority
        />
        <figcaption>Projection / {era.short}</figcaption>
      </figure>

      <nav className="mil-era-rail" aria-label="Eras">
        {ERAS.map((item, index) => (
          <button
            key={item.year}
            type="button"
            data-on={eraIndex === index || undefined}
            aria-current={eraIndex === index ? "true" : undefined}
            aria-label={`${item.year} — ${item.title}`}
            onClick={() => selectEra(index)}
          >
            {item.year}
          </button>
        ))}
      </nav>

      <div className="mil-modes" role="group" aria-label="Dossier view">
        {(["record", "scope", "transmission"] as const).map((item) => {
          const unavailable = item === "transmission" && !era.transmission;
          return (
            <button
              key={item}
              type="button"
              data-on={mode === item || undefined}
              aria-pressed={mode === item}
              disabled={unavailable}
              onClick={() => setMode(item)}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="mil-dossier" tabIndex={0} aria-label={`${era.title} ${mode}`}>
        {mode === "record" ? (
          <dl>
            {era.facts.map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {mode === "scope" ? (
          <article>
            <p className="mil-kicker">Scope</p>
            <h3>{era.motto}</h3>
            <p>{era.loadout}</p>
          </article>
        ) : null}
        {mode === "transmission" && era.transmission ? (
          <article className="mil-transmission">
            <div aria-hidden="true">
              <span />
            </div>
            <p className="mil-kicker">Transmission</p>
            <h3>{era.transmission}</h3>
          </article>
        ) : null}
      </div>
    </section>
  );
}

export function MobileInstrumentsLab() {
  const [surface, setSurface] = useState<Surface>("proof");
  const [presentation, setPresentation] = useState<Presentation>("html");
  const [device, setDevice] = useState<DeviceWidth>(390);

  const liveHref = surface === "proof" ? "/#services" : "/#voidwalker";
  const concept = useMemo(
    () =>
      surface === "proof"
        ? { src: proofConcept, alt: "Generated Proof mobile instrument concept" }
        : { src: voidwalkerConcept, alt: "Generated Voidwalker mobile instrument concept" },
    [surface]
  );

  return (
    <main className="mil" data-device={device}>
      <aside className="mil-controls">
        <header className="mil-controls__head">
          <p>Thoughtform / Look-dev</p>
          <h1>
            Mobile
            <br />
            Instruments
          </h1>
          <span>Proof + Voidwalker / ADR-083</span>
        </header>

        <section className="mil-control-group" aria-labelledby="mil-surface-label">
          <h2 id="mil-surface-label">01 / Surface</h2>
          <div role="group" aria-label="Surface">
            {(["proof", "voidwalker"] as const).map((item) => (
              <button
                key={item}
                type="button"
                data-on={surface === item || undefined}
                aria-pressed={surface === item}
                onClick={() => setSurface(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="mil-control-group" aria-labelledby="mil-view-label">
          <h2 id="mil-view-label">02 / View</h2>
          <div role="group" aria-label="Preview type">
            {(["html", "concept"] as const).map((item) => (
              <button
                key={item}
                type="button"
                data-on={presentation === item || undefined}
                aria-pressed={presentation === item}
                onClick={() => setPresentation(item)}
              >
                {item === "html" ? "Interactive HTML" : "Image study"}
              </button>
            ))}
          </div>
        </section>

        <section className="mil-control-group" aria-labelledby="mil-device-label">
          <h2 id="mil-device-label">03 / Viewport</h2>
          <div role="group" aria-label="Device width">
            {DEVICES.map((width) => (
              <button
                key={width}
                type="button"
                data-on={device === width || undefined}
                aria-pressed={device === width}
                onClick={() => setDevice(width)}
              >
                {width}
              </button>
            ))}
          </div>
        </section>

        <section className="mil-ia" aria-labelledby="mil-ia-label">
          <h2 id="mil-ia-label">Information architecture</h2>
          {surface === "proof" ? (
            <ol>
              <li>Case identity</li>
              <li>3 explicit readings</li>
              <li>One stable evidence seat</li>
              <li>4-stop case rail</li>
            </ol>
          ) : (
            <ol>
              <li>Era identity</li>
              <li>Full-body projector</li>
              <li>6-stop era rail</li>
              <li>3-mode dossier seat</li>
            </ol>
          )}
        </section>

        <footer className="mil-controls__foot">
          <p>Look-dev only. Production registries remain the source of truth.</p>
          <a href={liveHref}>
            Open live section <span aria-hidden="true">↗</span>
          </a>
        </footer>
      </aside>

      <section className="mil-workbench" aria-label={`${surface} ${presentation} preview`}>
        <div className="mil-workbench__meta" aria-hidden="true">
          <span>{device} × 844</span>
          <span>
            {surface} / {presentation}
          </span>
        </div>

        <div className="mil-device">
          <div className="mil-device__top" aria-hidden="true">
            <span>TF-MOBILE / {device}</span>
            <span>LOOK-DEV</span>
          </div>
          <div className="mil-device__screen">
            {presentation === "html" ? (
              surface === "proof" ? (
                <ProofInstrument />
              ) : (
                <VoidwalkerInstrument />
              )
            ) : (
              <Image
                className="mil-concept"
                src={concept.src}
                alt={concept.alt}
                sizes={`${device}px`}
                priority
              />
            )}
          </div>
          <div className="mil-device__bottom" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
    </main>
  );
}
