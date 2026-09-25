"use client";

import { useLayoutEffect, useRef, useState } from "react";

import {
  FormField,
  isFormKey,
} from "@/components/landing/home-v2/services/casefile/map/pda/substrateForms";

import { Mark, Position, Spine } from "./kit";
import { shapeFor, streamOf, type MplModel, type MplReading } from "./models";

/**
 * SWIPE DECK — one object per swipe. A horizontal snap track, each card a
 * little narrower than the bay so the next one shows its edge (the affordance
 * that says "swipe" without a word), and ONE lit segment on a hairline track
 * for the position — the rail's own travelling spine, no dots, no numbers.
 *
 *   WORK           a card per department, its streams as rows you pick from.
 *   CONFIGURATION  a card per stream, opening on the picked one; swiping IS
 *                  the stepper, and the stream you land on is the pick.
 *   LAYER          a card per shape over its own physics field (the carrier's
 *                  material, `substrateForms`), opening on the picked
 *                  stream's first shape.
 *
 * ⚠ Promotion risks, recorded in the lab README: a horizontal track inside
 * the vertical pile needs its own `touch-action`, a diagonal gesture lands in
 * an 18svh dwell, and the pile's card is transformed every frame — Chromium
 * cannot show how iOS arbitrates the two gestures.
 */
export function VariantDeck({
  model,
  reading,
  sel,
  onSel,
}: {
  model: MplModel;
  reading: MplReading;
  sel: string;
  onSel: (id: string) => void;
}) {
  const s = streamOf(model, sel);
  const trackRef = useRef<HTMLDivElement>(null);
  const n =
    reading === "work"
      ? model.depts.length
      : reading === "configuration"
        ? model.streams.length
        : model.shapes.length;
  const startAt =
    reading === "work"
      ? Math.max(
          0,
          model.depts.findIndex((d) => d.id === s.dept)
        )
      : reading === "configuration"
        ? Math.max(
            0,
            model.streams.findIndex((x) => x.id === s.id)
          )
        : Math.max(
            0,
            model.shapes.findIndex((sh) => sh.key === shapeFor(model, s).key)
          );
  const [pos, setPos] = useState(startAt);

  /* Open on the picked object — once per reading (the lab keys the deck on
     its reading), never on every pick: on CONFIGURATION the swipe IS the
     pick, and re-scrolling to it would fight the finger. */
  const startRef = useRef(startAt);
  useLayoutEffect(() => {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollLeft = startRef.current * (card.getBoundingClientRect().width + 8);
  }, []);

  const onScroll = () => {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const pitch = card.getBoundingClientRect().width + 8;
    const i = Math.max(0, Math.min(n - 1, Math.round(el.scrollLeft / pitch)));
    if (i !== pos) setPos(i);
    if (reading === "configuration") {
      const id = model.streams[i]?.id;
      if (id && id !== sel) onSel(id);
    }
  };

  return (
    <div className="mpl-v mpl-deck" data-reading={reading}>
      <div className="mpl-deck__track" ref={trackRef} onScroll={onScroll}>
        {reading === "work"
          ? model.depts.map((d) => (
              <section key={d.id} className="mpl-deck__card">
                <p className="mpl-deck__head">{d.name}</p>
                <ul className="mpl-deck__streams">
                  {d.streams.map((x) => (
                    <li key={x.id}>
                      <button
                        type="button"
                        className="mpl-deck__stream"
                        data-on={x.id === s.id || undefined}
                        aria-pressed={x.id === s.id}
                        onClick={() => onSel(x.id)}
                      >
                        <Mark led={!x.configured} />
                        <span className="mpl-deck__title">{x.title}</span>
                        <span className="mpl-deck__lane">{x.lane}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          : reading === "configuration"
            ? model.streams.map((x) => (
                <section key={x.id} className="mpl-deck__card">
                  <Spine s={x} />
                </section>
              ))
            : model.shapes.map((sh, i) => (
                <section key={sh.key} className="mpl-deck__card mpl-deck__card--shape">
                  {isFormKey(sh.key) ? (
                    <svg
                      className="mpl-deck__field"
                      viewBox="0 0 300 360"
                      preserveAspectRatio="xMidYMid slice"
                      aria-hidden="true"
                    >
                      <FormField form={sh.key} w={300} h={360} seed={701 + i * 37} k={0.7} p={14} />
                    </svg>
                  ) : null}
                  <p className="mpl-deck__head">{sh.name}</p>
                  <p className="mpl-sentence">{sh.meaning}</p>
                  <p className="mpl-deck__skills">
                    {sh.skills.map((k) => (
                      <span key={k.id} data-flag={k.flagship || undefined}>
                        {k.short}
                      </span>
                    ))}
                  </p>
                </section>
              ))}
      </div>
      <Position n={n} i={pos} />
    </div>
  );
}
