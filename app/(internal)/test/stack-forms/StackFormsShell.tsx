"use client";

/* The page: one full-height slot a direction, and one control they share.

   `open` is the only thing a reader can change, because it is the only thing
   the proposal changes: whichever drawing is picked has to close and open.
   A direction moves on its own only while its slot is on screen and the
   reader has not asked for less motion; otherwise it is handed "hold" and
   shows its rest frame, which is also what a still shoots. */

import { type ChangeEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { type Form, FORMS } from "./forms";
import { factsOf, poseAt } from "./model";

const subscribeMotion = (notify: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
};
const reducedNow = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Slot({ form, open, hold }: { form: Form; open: number; hold: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const C = form.C;
  return (
    <section className="sf-slot" id={form.id} ref={ref} data-sf-form={form.id}>
      <header className="sf-tag">
        <b>{form.code}</b>
        <span className="sf-tag__name">{form.name}</span>
        <span className="sf-tag__made">{form.made}</span>
        <span className="sf-tag__note">{form.note}</span>
        <span className="sf-tag__after">After {form.after}</span>
      </header>
      <div className="sf-stage">
        <C open={open} motion={hold || !seen ? "hold" : "run"} />
      </div>
    </section>
  );
}

export function StackFormsShell({
  only,
  open0,
  still,
}: {
  /** The drawings to show; none named means all of them. */
  only: Form["id"][];
  open0: number;
  still: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(open0);
  const reduced = useSyncExternalStore(subscribeMotion, reducedNow, () => false);

  /* the capture waits on this stamp: the layouts above render nothing until
     the session has loaded, so `load` is too early */
  useEffect(() => {
    root.current?.setAttribute("data-sf-ready", "1");
  }, []);

  const onOpen = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    setOpen(v);
    const url = new URL(window.location.href);
    url.searchParams.set("open", v.toFixed(2));
    window.history.replaceState(null, "", url);
  };

  const some = only.length > 0;
  const shown = FORMS.filter((f) => !some || only.includes(f.id));
  /* the direction the first drawing shown belongs to, for the family link */
  const head = some ? (shown[0]?.of ?? shown[0]?.id) : undefined;
  const family = FORMS.filter((f) => f.id === head || f.of === head);
  const facts = factsOf(poseAt(open));

  return (
    <div className="sf-root" ref={root} data-sf-still={still ? "" : undefined}>
      <nav className="sf-bar" aria-label="Stack forms">
        <span className="sf-bar__title">Stack forms</span>
        <span className="sf-bar__links">
          {FORMS.map((f) => (
            <a
              key={f.id}
              href={some ? `?v=${f.id}` : `#${f.id}`}
              data-on={some && only.includes(f.id) ? "" : undefined}
            >
              {f.of ? f.code : `${f.code} ${f.name}`}
            </a>
          ))}
          {head && family.length > 1 && shown.length < family.length && (
            <a href={`?of=${head}`}>Its family</a>
          )}
          {some && <a href="?">All</a>}
        </span>
        <label className="sf-bar__open">
          <span>Closed</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(open * 100)}
            onChange={onOpen}
            aria-label="How far the stack is opened"
          />
          <span>Opened</span>
          <output>{facts.openPct}%</output>
        </label>
      </nav>

      {shown.map((f) => (
        <Slot key={f.id} form={f} open={open} hold={still || reduced} />
      ))}
    </div>
  );
}
