"use client";

import { useEffect, useRef, useState } from "react";

import { Glyph } from "@/components/arcs/ArcLeverage";
import { disciplineOf } from "@/lib/arcs/content/shared/disciplines";

import { type Job, resultLabel } from "./parts";
import { PRACTICE } from "./practice";
import { Figure } from "./RoundFour";

/**
 * Round seven (owner, 2026-10-12): block 15, pinned. The references keep
 * their width and buy room with height: the section pins, the steps are
 * listed, one is open at a time and the rest fold to their label line
 * (Unsiloed, Euclid, Griffin). Here the card holds the 1200 × 880 box; the
 * brief stays open as the anchor, and Embed, Solve it together, Plug in and
 * the result open in turn as the reader scrolls. The visual stays put.
 */
const STEPS = 4;

export function DirectionJ({ job }: { job: Job }) {
  const p = PRACTICE[job.id];
  const d = disciplineOf(job.bucket);
  const runway = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = runway.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const t = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      setStep(Math.min(STEPS - 1, Math.floor(t * STEPS)));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const open = (i: number) => (step === i ? true : undefined);
  const done = (i: number) => (step > i ? true : undefined);

  return (
    <div className="pk-j__runway" ref={runway} data-step={step}>
      <div className="pk-j__pin">
        <article
          className="pk-card pk-c pk-h pk-i pk-j"
          aria-label={p.name}
          style={{ ["--pk-left" as string]: "55%" }}
        >
          <header className="pk-c__head pk-h__head">
            <span className="pk-h__client">{job.client}</span>
            <span className="pk-h__name">{p.name}</span>
            <span className="pk-h__ws">
              <Glyph kind={d.glyph} />
              {d.long}
            </span>
          </header>
          <div className="pk-i__body">
            <div className="pk-i__words pk-j__words">
              <div className="pk-c__box pk-i__brief">
                <p className="pk-c__tab">The brief</p>
                <p className="pk-lede">{p.problem}</p>
              </div>
              <ol className="pk-i__flow pk-j__flow" aria-label="The work">
                <li className="pk-c__box pk-i__big pk-j__step" data-open={open(0)} data-done={done(0)}>
                  <p className="pk-c__tab">Embed</p>
                  <div className="pk-j__fold">
                    <div>
                      <p className="pk-body">{p.identify}</p>
                    </div>
                  </div>
                </li>
                <li className="pk-c__box pk-j__step pk-j__solve" data-open={open(1)} data-done={done(1)}>
                  <p className="pk-c__tab">Solve it together</p>
                  <div className="pk-j__fold">
                    <div>
                      <ol className="pk-j__did">
                        {job.did.map((t, i) => (
                          <li key={t}>
                            <span>Claude {i + 1}</span>
                            {t}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </li>
                <li className="pk-c__box pk-i__big pk-j__step" data-open={open(2)} data-done={done(2)}>
                  <p className="pk-c__tab">Plug in</p>
                  <div className="pk-j__fold">
                    <div>
                      <p className="pk-body">{p.plug}</p>
                    </div>
                  </div>
                </li>
              </ol>
              <div className="pk-c__box pk-c__box--lit pk-i__allows pk-j__step" data-open={open(3)}>
                <p className="pk-c__tab">What it now allows</p>
                <div className="pk-j__fold">
                  <div>
                    <p className="pk-lede">{job.result.allows}</p>
                    <hr className="pk-i__rule pk-j__rule" />
                    <p className="pk-j__saved-k">
                      {resultLabel(job)}
                      {job.result.label === "The return" ? null : " · estimated"}
                    </p>
                    <div className="pk-i__bars">
                      <p className="pk-i__bar-row">
                        <span className="pk-i__bar-k">Before</span>
                        <i className="pk-i__bar" data-w="long" aria-hidden="true" />
                        <span className="pk-i__bar-v">{p.before}</span>
                      </p>
                      <p className="pk-i__bar-row" data-lit="true">
                        <span className="pk-i__bar-k">Now</span>
                        <i className="pk-i__bar" data-w="short" aria-hidden="true" />
                        <span className="pk-i__bar-v">{p.now}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Figure job={job} wide ba={false} />
          </div>
          <p className="pk-j__dots" aria-hidden="true">
            {Array.from({ length: STEPS }, (_, i) => (
              <i key={i} data-on={i === step ? true : undefined} />
            ))}
          </p>
        </article>
      </div>
    </div>
  );
}
