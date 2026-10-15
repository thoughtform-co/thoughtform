import type { CSSProperties, ReactNode } from "react";

import { ArcBeat } from "@/components/arcs/ArcBeat";
import { ArcSectionHead } from "@/components/arcs/ArcSectionHead";
import { rung } from "@/components/arcs/arcMotion";
import { arcTitleText } from "@/components/arcs/chrome";
import type { ArcMotion } from "@/lib/arcs/types";

import {
  CHAPTERS,
  FRAMES,
  FX,
  INDEX,
  KICKS,
  NOISE,
  SCENES,
  STEPS,
  THUMBS,
  type Chapter,
} from "./chapters";
import { PortfolioFilm } from "./PortfolioFilm";

/**
 * The case's chapters, each one beat in the house's shell (`ArcBeat`, the
 * arc's own head, the decode) with ONE drawing under it, lettered in DOM on
 * the ramp. Server, no state; the film's sound is the one island.
 *
 * Grammar, after the proposal and the talk: hairline frames with survey
 * corners, mono designations, gold only on the one lit object of a beat,
 * a filled node for a person's hand and an open one for the model.
 */

const PTL = "/arcs/prompt-to-loop";
const pct = (frame: number) => `${(frame / FRAMES) * 100}%`;

function Shell({
  chapter,
  index,
  motion,
  mod,
  children,
}: {
  chapter: Chapter;
  index: number;
  motion: ArcMotion;
  mod: string;
  children: ReactNode;
}) {
  return (
    <ArcBeat
      id={chapter.id}
      kind="media"
      className={`arc-section arc-sec tfp-sec tfp-sec--${mod}`}
      ariaLabel={arcTitleText(chapter.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={chapter.head}
          kind="media"
          index={index}
          sectionId={chapter.id}
          motion={motion}
        />
        <div className={`tfp-body tfp-body--${mod} arc-reveal`} {...rung(motion, 0.16)}>
          {children}
        </div>
      </div>
    </ArcBeat>
  );
}

/** A frame with the house's survey corners. */
function Frame({
  children,
  className = "",
  label,
  lit = false,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  lit?: boolean;
}) {
  return (
    <div className={`tfp-frame${lit ? " is-lit" : ""} ${className}`}>
      <i className="tfp-frame__c tfp-frame__c--tl" aria-hidden="true" />
      <i className="tfp-frame__c tfp-frame__c--br" aria-hidden="true" />
      {label ? <span className="tfp-frame__label">{label}</span> : null}
      {children}
    </div>
  );
}

const Check = ({ ok }: { ok: boolean }) => (
  <span className={`tfp-mark ${ok ? "is-ok" : "is-no"}`} aria-label={ok ? "Kept" : "Cut"}>
    {ok ? "✓" : "✕"}
  </span>
);

/* ── 00 · The film ───────────────────────────────────────────────────── */

export function FilmChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  return (
    <Shell chapter={CHAPTERS.film} index={index} motion={motion} mod="film">
      <div className="tfp-film">
        <div className="tfp-film__pic">
          <PortfolioFilm />
          <dl className="tfp-readout tfp-readout--row">
            <div>
              <dt>Format</dt>
              <dd>9:16</dd>
            </div>
            <div>
              <dt>Frames</dt>
              <dd>240</dd>
            </div>
            <div>
              <dt>Length</dt>
              <dd>10 s, loops</dd>
            </div>
          </dl>
        </div>
        <nav className="tfp-index" aria-label="The steps">
          <span className="tfp-kicker">The breakdown · twelve steps</span>
          <ol>
            {INDEX.map((item) => (
              <li key={item.n}>
                <a href={item.href}>
                  <span className="tfp-index__n">{item.n}</span>
                  <span className="tfp-index__l">{item.label}</span>
                  <i aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </Shell>
  );
}

/* ── 02 · How it runs ────────────────────────────────────────────────── */

export function RunsChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  return (
    <Shell chapter={CHAPTERS.runs} index={index} motion={motion} mod="runs">
      <ol className="tfp-run">
        <li className="tfp-run__st" data-by="person">
          <i className="tfp-node" aria-hidden="true" />
          <span className="tfp-run__k">You ask</span>
          <p className="tfp-run__quote">
            “A looping stop-motion Halloween video for Experience 2 Gold.”
          </p>
        </li>
        <li className="tfp-run__st" data-by="model">
          <i className="tfp-node" aria-hidden="true" />
          <span className="tfp-run__k">Claude picks the skill</span>
          <ul className="tfp-run__list">
            <li className="is-lit">
              studio-ai-motion <b>match</b>
            </li>
            <li>loop-in-design-copy</li>
            <li>loop-paid-social</li>
            <li>genai-prompting</li>
          </ul>
        </li>
        <li className="tfp-run__st" data-by="model">
          <i className="tfp-node" aria-hidden="true" />
          <span className="tfp-run__k">It follows the steps</span>
          <ul className="tfp-run__chips">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </li>
        <li className="tfp-run__st" data-by="model">
          <i className="tfp-node" aria-hidden="true" />
          <span className="tfp-run__k">It checks itself</span>
          <ul className="tfp-run__list">
            <li>
              <Check ok /> Code measures timing, sound, colour
            </li>
            <li>
              <Check ok /> An AI viewer watches it
            </li>
          </ul>
        </li>
        <li className="tfp-run__st is-lit" data-by="person">
          <i className="tfp-node" aria-hidden="true" />
          <span className="tfp-run__k">You decide</span>
          <p className="tfp-run__p">
            Your call. Notes go back to the skill with <code>/skill-feedback</code>.
          </p>
        </li>
      </ol>
      <dl className="tfp-evals">
        <div className="tfp-evals__head">
          <dt>Its evals</dt>
          <dd>5 real requests × 3 runs</dd>
        </div>
        <div>
          <dt>15 of 15</dt>
          <dd>runs pass with the skill</dd>
        </div>
        <div>
          <dt>+0.71</dt>
          <dd>over Claude without the skill, on average</dd>
        </div>
        <div>
          <dt>0 → 3 of 3</dt>
          <dd>one case, after one line in the skill&apos;s description changed</dd>
        </div>
      </dl>
    </Shell>
  );
}

/* ── 03 · The ask ────────────────────────────────────────────────────── */

const ANSWERS = [
  ["Format", "9:16, a 10 s loop"],
  ["Product", "Experience 2 Gold"],
  ["Call to action", "You draft, I pick"],
  ["Sound", "ElevenLabs, your key"],
] as const;

export function AskChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  return (
    <Shell chapter={CHAPTERS.ask} index={index} motion={motion} mod="ask">
      <div className="tfp-ask">
        <Frame className="tfp-chat" label="Loop Studio / Halloween loop for Experience 2">
          <p className="tfp-chat__you">
            A slick, looping stop-motion Halloween video for Experience 2 Gold. Cool text
            animation, and an endcard like our June ads.
          </p>
          <p className="tfp-chat__note">Read the brief and planned four questions ›</p>
          <div className="tfp-q">
            <div className="tfp-q__head">
              <span>Format and length?</span>
              <span className="tfp-q__count">1 of 4</span>
            </div>
            <ol className="tfp-q__opts">
              <li className="is-lit">
                <span>1</span>9:16, a 10 s loop <b>Recommended</b>
              </li>
              <li>
                <span>2</span>9:16, 15 seconds
              </li>
              <li>
                <span>3</span>4:5 for the feed
              </li>
              <li>
                <span>4</span>Both 9:16 and 4:5
              </li>
              <li className="is-ghost">
                <span>✎</span>Something else
              </li>
            </ol>
            <p className="tfp-q__keys">↑↓ to navigate · Enter to select · Esc to skip</p>
          </div>
        </Frame>
        <div className="tfp-answers">
          <span className="tfp-kicker">Your four answers</span>
          <ol className="tfp-ledger">
            {ANSWERS.map(([k, v], i) => (
              <li key={k}>
                <span className="tfp-ledger__n">{String(i + 1).padStart(2, "0")}</span>
                <span className="tfp-ledger__k">{k}</span>
                <span className="tfp-ledger__v">{v}</span>
                <span className="tfp-tag">Recommended</span>
              </li>
            ))}
          </ol>
          <div className="tfp-line">
            <span className="tfp-kicker">Then the line, from three drafts</span>
            <p className="tfp-line__text">
              More boo <span>/</span> less ringing
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ── 04 · Look first ─────────────────────────────────────────────────── */

export function LookChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  return (
    <Shell chapter={CHAPTERS.look} index={index} motion={motion} mod="look">
      <div className="tfp-look">
        <div className="tfp-look__col">
          <span className="tfp-kicker">Loop&apos;s June ads</span>
          <Frame className="tfp-look__ads">
            <img
              src={`${PTL}/ptl-03.jpg`}
              alt="Two of Loop's June paid social ads: tall condensed headlines, a pill-shaped offer, small support lines"
            />
          </Frame>
          <ul className="tfp-tags">
            <li>Tall condensed headline</li>
            <li>A pill</li>
            <li>A small support line</li>
            <li>The product on a calm ground</li>
          </ul>
        </div>
        <div className="tfp-look__col tfp-look__col--safe">
          <span className="tfp-kicker">Where text may go</span>
          <div className="tfp-safe" role="img" aria-label="A 9:16 frame: the top and bottom bands are covered by the app, all text lives in the middle">
            <span className="tfp-safe__ban tfp-safe__ban--top">App bar</span>
            <span className="tfp-safe__ok">All text here</span>
            <span className="tfp-safe__ban tfp-safe__ban--foot">Captions, buttons</span>
          </div>
          <p className="tfp-cap">Measured, not guessed.</p>
        </div>
        <div className="tfp-look__col">
          <span className="tfp-kicker">Four trends that agreed</span>
          <ol className="tfp-ledger tfp-ledger--plain">
            {[
              "Paper cut-out craft",
              "Type as the hero",
              "A real product in a handmade world",
              "Made for vertical",
            ].map((t, i) => (
              <li key={t}>
                <span className="tfp-ledger__n">{String(i + 1).padStart(2, "0")}</span>
                <span className="tfp-ledger__k">{t}</span>
              </li>
            ))}
          </ol>
          <p className="tfp-cap tfp-cap--lit">
            One source is a mood. Four that agree are a direction.
          </p>
        </div>
      </div>
    </Shell>
  );
}

/* ── 05 · The idea ───────────────────────────────────────────────────── */

const STRIP = [
  { src: "ptl-05.jpg", alt: "BOO", cap: "The O" },
  { src: "ptl-06.jpg", alt: "Diving through the O", cap: "Dive in" },
  { src: "ptl-07.jpg", alt: "Haunted raves", cap: "Next scene" },
  { src: "ptl-08.jpg", alt: "Diving back through the endcard's O", cap: "Dive back to the start" },
] as const;

export function IdeaChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  return (
    <Shell chapter={CHAPTERS.idea} index={index} motion={motion} mod="idea">
      <div className="tfp-idea">
        <Frame className="tfp-idea__hinge" lit>
          <img src={`${PTL}/ptl-04.jpg`} alt="Frame 0: the word BOO, its two O's are the gold earplugs" />
        </Frame>
        <div className="tfp-idea__side">
          <ol className="tfp-ledger tfp-ledger--tall">
            <li>
              <span className="tfp-ledger__n">01</span>
              <span className="tfp-ledger__k">A letter</span>
              <span className="tfp-ledger__v">The O&apos;s in BOO, so you read the product before you see it.</span>
            </li>
            <li>
              <span className="tfp-ledger__n">02</span>
              <span className="tfp-ledger__k">The product</span>
              <span className="tfp-ledger__v">Loop&apos;s real gold render, never redrawn.</span>
            </li>
            <li>
              <span className="tfp-ledger__n">03</span>
              <span className="tfp-ledger__k">A door</span>
              <span className="tfp-ledger__v">The camera dives through it into the next scene.</span>
            </li>
          </ol>
          <ol className="tfp-strip">
            {STRIP.map((s) => (
              <li key={s.src}>
                <img src={`${PTL}/${s.src}`} alt={s.alt} />
                <span>{s.cap}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Shell>
  );
}

/* ── 06 · The plan ───────────────────────────────────────────────────── */

export function PlanChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  const seconds = Array.from({ length: 11 }, (_, s) => s);
  const beats = Array.from({ length: FRAMES / 10 + 1 }, (_, b) => b * 10);
  return (
    <Shell chapter={CHAPTERS.plan} index={index} motion={motion} mod="plan">
      <div className="tfp-math" aria-label="144 beats a minute times 24 frames a second: one beat is 10 frames, six bars are 10.000 seconds">
        <span>144 beats a minute</span>
        <i>×</i>
        <span>24 frames a second</span>
        <i>→</i>
        <span>1 beat = 10 frames</span>
        <i>→</i>
        <span className="is-lit">6 bars = 10.000 s</span>
      </div>
      <Frame className="tfp-tl">
        <div className="tfp-tl__track" role="img" aria-label="240 frames on one line: six scenes, a beat every 10 frames, the camera hits on measured kicks, and two dives through the O">
          <div className="tfp-tl__kicks">
            {KICKS.map((k) => (
              <i key={k} style={{ left: pct(k) }} />
            ))}
          </div>
          <div className="tfp-tl__scenes">
            {SCENES.map((s) => (
              <span
                key={`${s.from}`}
                className={`tfp-tl__sc tfp-tl__sc--${s.tone}`}
                style={{ left: pct(s.from), width: pct(s.to - s.from) }}
              >
                {s.name}
              </span>
            ))}
            <span className="tfp-tl__dive" style={{ left: pct(47) }}>
              dive
            </span>
            <span className="tfp-tl__dive" style={{ left: pct(237) }}>
              dive back
            </span>
          </div>
          <div className="tfp-tl__ruler">
            {beats.map((b) => (
              <i key={b} className={b % 40 === 0 ? "is-bar" : undefined} style={{ left: pct(b) }} />
            ))}
          </div>
          <div className="tfp-tl__secs">
            {seconds.map((s) => (
              <span key={s} style={{ left: pct(s * 24) }}>
                {s}s
              </span>
            ))}
          </div>
        </div>
        <p className="tfp-tl__key">
          <span>
            <i className="tfp-tl__dot" /> Camera hit on a kick
          </span>
          <span>Short tick · one beat = 10 frames</span>
          <span>Tall tick · one bar = 40 frames</span>
        </p>
      </Frame>
      <ol className="tfp-thumbs">
        {THUMBS.map((t) => (
          <li key={t.src}>
            <img src={t.src} alt={t.alt} />
          </li>
        ))}
      </ol>
    </Shell>
  );
}

/* ── 07 · Ingredients ────────────────────────────────────────────────── */

export function IngredientsChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  return (
    <Shell chapter={CHAPTERS.stuff} index={index} motion={motion} mod="stuff">
      <ol className="tfp-ingr">
        <li data-src="generated">
          <span className="tfp-ingr__k">Paper</span>
          <div className="tfp-ingr__ev tfp-ingr__swatches">
            {[
              ["ptl-15.jpg", "Black paper"],
              ["ptl-16.jpg", "Orange paper"],
              ["ptl-17.jpg", "Cream paper"],
              ["ptl-18.jpg", "Violet paper"],
            ].map(([src, alt]) => (
              <img key={src} src={`${PTL}/${src}`} alt={alt} />
            ))}
          </div>
          <span className="tfp-ingr__fig">4 papers</span>
          <span className="tfp-ingr__line">Generated once, then recoloured in code to the exact brand colours.</span>
          <span className="tfp-tag">Generated</span>
        </li>
        <li data-src="loop" className="is-lit">
          <span className="tfp-ingr__k">Product</span>
          <div className="tfp-ingr__ev tfp-ingr__prod">
            <img src={`${PTL}/ptl-19.png`} alt="Loop Experience 2 Gold, the real render" />
          </div>
          <span className="tfp-ingr__fig">The real render</span>
          <span className="tfp-ingr__line">Placed untouched. It only bobs a pixel and swaps angle.</span>
          <span className="tfp-tag tfp-tag--lit">Loop&apos;s file</span>
        </li>
        <li data-src="generated">
          <span className="tfp-ingr__k">Music</span>
          <div className="tfp-ingr__ev tfp-ingr__bars" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <i key={i} className={i === 2 ? "is-kept" : undefined} />
            ))}
          </div>
          <span className="tfp-ingr__fig">5 tried → 1 kept</span>
          <span className="tfp-ingr__line">
            Cut on its own loop. The track repeats every 32 beats, so the cut does too: no jump at the seam.
          </span>
          <span className="tfp-tag">Generated</span>
        </li>
        <li data-src="generated">
          <span className="tfp-ingr__k">Effects</span>
          <div className="tfp-ingr__ev tfp-ingr__fx" aria-hidden="true">
            {Array.from({ length: 19 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <span className="tfp-ingr__fig">19 sounds</span>
          <span className="tfp-ingr__line">
            Paper slaps, a ghost, a crowd. Each one written as what makes the sound, then placed on its frame.
          </span>
          <span className="tfp-tag">Generated</span>
        </li>
      </ol>
    </Shell>
  );
}

/* ── 08 · Making it ──────────────────────────────────────────────────── */

const RULES = [
  {
    k: "Hand-cut edges",
    v: "Every shape is cut three ways and flickers between them, like real paper.",
    glyph: (
      <>
        <path d="M10 14 L44 11 L46 42 L12 45 Z" />
        <path d="M13 17 L41 14.5 L43 39 L15 41.5 Z" className="is-ghost" />
      </>
    ),
  },
  {
    k: "Shadows by height",
    v: "Lift a piece and its shadow grows. Type falls onto the table.",
    glyph: (
      <>
        <ellipse cx="30" cy="46" rx="17" ry="4" className="is-fill" />
        <path d="M14 10 H40 V32 H14 Z" />
        <path d="M27 32 V42" className="is-ghost" />
      </>
    ),
  },
  {
    k: "12 poses a second",
    v: "Paper moves on every other frame. Only the camera dives move every frame.",
    glyph: (
      <>
        <path d="M6 22 H50" />
        <path d="M10 16 V28 M22 16 V28 M34 16 V28 M46 16 V28" />
        <circle cx="10" cy="40" r="3.5" className="is-fill" />
        <circle cx="34" cy="40" r="3.5" className="is-fill" />
        <circle cx="22" cy="40" r="3.5" className="is-ghost" />
        <circle cx="46" cy="40" r="3.5" className="is-ghost" />
      </>
    ),
  },
  {
    k: "One light",
    v: "Everything is lit from the top left, so the world holds together.",
    glyph: (
      <>
        <circle cx="15" cy="15" r="7" className="is-fill" />
        <path d="M22 22 L44 44 M26 17 L46 37 M17 26 L37 46" />
      </>
    ),
  },
] as const;

export function MakeChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  return (
    <Shell chapter={CHAPTERS.make} index={index} motion={motion} mod="make">
      <div className="tfp-make">
        <figure className="tfp-make__mosaic">
          <Frame>
            <img src={`${PTL}/ptl-20.jpg`} alt="Every fourth frame of the finished loop, in rows" />
          </Frame>
          <figcaption className="tfp-cap">Every 4th frame of 240.</figcaption>
        </figure>
        <ol className="tfp-rules">
          {RULES.map((r) => (
            <li key={r.k}>
              <svg viewBox="0 0 56 56" aria-hidden="true" className="tfp-glyph">
                {r.glyph}
              </svg>
              <div>
                <span className="tfp-rules__k">{r.k}</span>
                <p>{r.v}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Shell>
  );
}

/* ── 09 · Sound ──────────────────────────────────────────────────────── */

const W = 960;
const fx = (frame: number) => (frame / FRAMES) * W;

export function SoundChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  /* The noise bed as an area on a 0–100 band, its floor at 100. */
  const noise =
    `M0 100 ` +
    NOISE.map(([f, level]) => `L${fx(f).toFixed(1)} ${(100 - level * 92).toFixed(1)}`).join(" ") +
    ` L${W} 100 Z`;
  const drop = fx(120);
  return (
    <Shell chapter={CHAPTERS.sound} index={index} motion={motion} mod="sound">
      <Frame className="tfp-snd">
        <div
          className="tfp-snd__plot"
          role="img"
          aria-label="Music stays level for ten seconds; the noise rises, then drops 17 dB on frame 120 as the earplug lands, and the ringing stops dead on the same frame"
          style={{ "--drop": pct(120) } as CSSProperties}
        >
          <div className="tfp-snd__lane tfp-snd__lane--music">
            <span className="tfp-snd__lab">Music</span>
            <i className="tfp-snd__music" />
          </div>
          <div className="tfp-snd__lane tfp-snd__lane--noise">
            <span className="tfp-snd__lab">Noise: crowd, screams</span>
            <svg viewBox={`0 0 ${W} 100`} preserveAspectRatio="none" aria-hidden="true">
              <path d={noise} className="tfp-snd__noise" />
              <path d={`M${fx(108)} 6 H${drop}`} className="tfp-snd__ring" />
            </svg>
            <span className="tfp-snd__ringlab">Ringing, made in code, stops dead</span>
            <span className="tfp-snd__db">
              <b>−17 dB</b> the earplug lands
            </span>
          </div>
          <div className="tfp-snd__lane tfp-snd__lane--fx">
            <span className="tfp-snd__lab">Effects: each one on its frame</span>
            <div className="tfp-snd__ticks">
              {FX.map((f, i) => (
                <i key={`${f}-${i}`} style={{ left: pct(f) }} />
              ))}
            </div>
          </div>
          <i className="tfp-snd__cut" aria-hidden="true" />
          <div className="tfp-snd__secs" aria-hidden="true">
            {[0, 2, 4, 6, 8, 10].map((s) => (
              <span key={s} style={{ left: pct(s * 24) }}>
                {s}s
              </span>
            ))}
          </div>
        </div>
      </Frame>
    </Shell>
  );
}

/* ── 10 · Check ──────────────────────────────────────────────────────── */

const PAIRS = [
  {
    k: "Eyelids",
    wide: true,
    no: { src: "ptl-21.jpg", alt: "Black paper lids over the earplugs", cap: "Read as tombstones" },
    ok: { src: "ptl-22.jpg", alt: "Closed-eye arcs instead", cap: "Closed eyes" },
  },
  {
    k: "Sound waves",
    wide: false,
    no: { src: "ptl-23.jpg", alt: "Smooth sine waves", cap: "Read as stock vector" },
    ok: { src: "ptl-24.jpg", alt: "Torn paper zigzags", cap: "Torn paper" },
  },
] as const;

export function CheckChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  return (
    <Shell chapter={CHAPTERS.check} index={index} motion={motion} mod="check">
      <div className="tfp-check">
        <div className="tfp-check__pairs">
          {PAIRS.map((p) => (
            <div key={p.k} className={`tfp-pair${p.wide ? " tfp-pair--wide" : ""}`}>
              <span className="tfp-kicker">{p.k}</span>
              <div className="tfp-pair__row">
                <figure className="is-no">
                  <img src={`${PTL}/${p.no.src}`} alt={p.no.alt} />
                  <figcaption>
                    <Check ok={false} /> {p.no.cap}
                  </figcaption>
                </figure>
                <i className="tfp-pair__arrow" aria-hidden="true">
                  →
                </i>
                <figure className="is-ok">
                  <img src={`${PTL}/${p.ok.src}`} alt={p.ok.alt} />
                  <figcaption>
                    <Check ok /> {p.ok.cap}
                  </figcaption>
                </figure>
              </div>
            </div>
          ))}
        </div>
        <div className="tfp-who">
          <span className="tfp-kicker">Who checks what</span>
          <ol className="tfp-ledger tfp-ledger--tall">
            <li>
              <Check ok />
              <span className="tfp-ledger__k">Code</span>
              <span className="tfp-ledger__v">Timing, sync, loudness, colours, safe area.</span>
            </li>
            <li>
              <Check ok />
              <span className="tfp-ledger__k">An AI viewer</span>
              <span className="tfp-ledger__v">“What is this for?” Right on every run.</span>
            </li>
            <li className="is-dim">
              <Check ok={false} />
              <span className="tfp-ledger__k">An AI critic</span>
              <span className="tfp-ledger__v">Invented problems, and ranked your favourite last.</span>
            </li>
            <li className="is-lit">
              <i className="tfp-node" aria-hidden="true" />
              <span className="tfp-ledger__k">You decide</span>
              <span className="tfp-ledger__v">
                You picked version 3, and asked for no logo and a softer whoosh. Both are now rules.
              </span>
            </li>
          </ol>
        </div>
      </div>
    </Shell>
  );
}

/* ── 11 · Cost ───────────────────────────────────────────────────────── */

const SPEND = [
  ["Claude, thinking and building", "$25.32", 25.32],
  ["Gemini, watching and listening", "$1.05", 1.05],
  ["Music and sound effects", "$0.69", 0.69],
  ["Paper textures", "$0.21", 0.21],
] as const;

export function CostChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  return (
    <Shell chapter={CHAPTERS.cost} index={index} motion={motion} mod="cost">
      <div className="tfp-cost">
        <div>
          <span className="tfp-kicker">Where the money went</span>
          <ol className="tfp-spend">
            {SPEND.map(([k, v, n]) => (
              <li key={k}>
                <span className="tfp-spend__k">{k}</span>
                <i className="tfp-spend__lead" aria-hidden="true" />
                <span className="tfp-spend__v">{v}</span>
                <i
                  className="tfp-spend__bar"
                  aria-hidden="true"
                  style={{ width: `${(n / 27.3) * 100}%` }}
                />
              </li>
            ))}
            <li className="tfp-spend__total">
              <span className="tfp-spend__k">Total</span>
              <i className="tfp-spend__lead" aria-hidden="true" />
              <span className="tfp-spend__v">about $27.30</span>
            </li>
          </ol>
        </div>
        <div>
          <span className="tfp-kicker">For that</span>
          <dl className="tfp-readout">
            <div>
              <dt>Time</dt>
              <dd>1 h 51 min</dd>
            </div>
            <div>
              <dt>Master</dt>
              <dd>10 s, 1080 × 1920</dd>
            </div>
            <div>
              <dt>Copy for upload</dt>
              <dd>30 s, plays 3 times</dd>
            </div>
            <div>
              <dt>Plus</dt>
              <dd>Source code and the mix</dd>
            </div>
          </dl>
        </div>
      </div>
    </Shell>
  );
}

/* ── 12 · Next time ──────────────────────────────────────────────────── */

export function NextChapter({ index, motion }: { index: number; motion: ArcMotion }) {
  return (
    <Shell chapter={CHAPTERS.next} index={index} motion={motion} mod="next">
      <div className="tfp-next">
        <Frame className="tfp-next__chat" label="A new chat">
          <p className="tfp-chat__you">
            <span className="tfp-chat__who">You</span>Hey, I want a motion design video for Loop Quiet.
          </p>
          <span className="tfp-caret" aria-hidden="true" />
        </Frame>
        <div className="tfp-next__runs">
          <span className="tfp-kicker">Runs on</span>
          <p className="tfp-next__skill">studio-ai-motion</p>
          <p className="tfp-next__plugin">in the Loop Studio AI Motion plugin</p>
          <ol className="tfp-rail">
            {STEPS.map((s, i) => (
              <li key={s}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Shell>
  );
}

/** The chapters by id, in the record's order (`PORTFOLIO_RUN`). */
export const CHAPTER_VIEWS = {
  film: FilmChapter,
  runs: RunsChapter,
  ask: AskChapter,
  look: LookChapter,
  idea: IdeaChapter,
  plan: PlanChapter,
  ingredients: IngredientsChapter,
  make: MakeChapter,
  sound: SoundChapter,
  check: CheckChapter,
  cost: CostChapter,
  next: NextChapter,
} as const;

export const CHAPTER_MENU: Record<keyof typeof CHAPTER_VIEWS, string> = {
  film: CHAPTERS.film.menuLabel,
  runs: CHAPTERS.runs.menuLabel,
  ask: CHAPTERS.ask.menuLabel,
  look: CHAPTERS.look.menuLabel,
  idea: CHAPTERS.idea.menuLabel,
  plan: CHAPTERS.plan.menuLabel,
  ingredients: CHAPTERS.stuff.menuLabel,
  make: CHAPTERS.make.menuLabel,
  sound: CHAPTERS.sound.menuLabel,
  check: CHAPTERS.check.menuLabel,
  cost: CHAPTERS.cost.menuLabel,
  next: CHAPTERS.next.menuLabel,
};
