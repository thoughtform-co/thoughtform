"use client";

/* "AI capability your teams own.", the flow through the stack (owner,
   2026-10-13, on the stack-first opening: "we lost the context from the left
   and right sides. Let's make a combination where you can really see the
   lines connecting to the different parts of the stack").

   Asked again the same day, more plainly: "integrate Navigate with your
   team, built on Claude Enterprise, and all these things into that new AI
   capability your team owns … the artifact in the middle … maybe we can
   make it a bit smaller".

   So: the proposal's flow, whole, with the stack where its ringed hub was,
   no larger than it needs to be. What each line says:
     · left, your team: the four workstreams on one bus, which runs level
       into the TEAM's plate, the stack's top;
     · the layer, the middle plate: tied to its tab by one gold line down
       the right-hand gutter, and lettering its three parts (context,
       skills, evals) on a second down the left;
     · right, Claude Enterprise: the AGENTS' plate, the stack's bottom, runs
       level out onto the bus that feeds the tools.
   In high on the left, out low on the right, the gold the other way round:
   the figure turns onto itself about its centre.

   The chips, the cards, the tabs and every word are production's, by
   reference (`PlugFlow`, `plugShared`); the geometry is `heroLayouts.ts`.
   The stack is the arrival's donor (`ClosedStack`); the lines that touch it
   let go as it leaves (`--sh-away`, written by the steps' section). */

import { type CSSProperties, useEffect } from "react";

import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";

import { Junction, Tap } from "../kit/marks";
import { pathOf } from "../kit/trace";
import { MastheadTitle } from "../Masthead";
import { CARDS, H, Tab, TITLE, W } from "../plug/PlugFlow";
import { Cards, Chips, delay, Draw, FIG_LABEL, PartTags } from "../plug/plugShared";
import { usePhoneStage } from "../phone/usePhoneStage";
import { useArrive } from "../useArrive";

import { ClosedStack } from "./ClosedStack";
import { FLOW as L } from "./heroLayouts";

/* When each plate falls in on the phone stage, on the section's arrival
   (0 as its top meets the fold, 1 as it reaches the top): bottom plate
   first, as the swarm's fall lands it on desktop. Indexed by plate: the
   team (top), the layer, the agents (bottom). */
const FALL: readonly (readonly [number, number])[] = [
  [0.45, 0.75],
  [0.3, 0.6],
  [0.15, 0.45],
];

export function StackFlow({
  phone,
}: {
  /** `"stage"`: on a phone with room for it (ADR-160), the stack falls
      together plate by plate as the section arrives, then holds under the
      chrome while its three parts pass beneath it, lighting the plate each
      one names. Absent, the phone reads the stack and its rows still. */
  phone?: "stage";
} = {}) {
  const ref = useArrive<HTMLDivElement>();
  const [team, layer, agents] = L.ports;
  const stage = usePhoneStage(phone === "stage");

  useEffect(() => {
    const root = ref.current;
    if (!stage || !root) return;
    const plates = [...root.querySelectorAll<SVGGElement>(".shf-stage [data-plate]")];
    const tabs = [...root.querySelectorAll<HTMLElement>(".pl-fig > .pl-tab")];
    let raf = 0;
    const frame = () => {
      raf = 0;
      const vh = layoutViewportHeight();
      const top = root.getBoundingClientRect().top;
      if (top > vh || top < -2 * vh) return;
      const q = Math.min(1, Math.max(0, 1 - top / vh));
      plates.forEach((g) => {
        const [a, b] = FALL[Number(g.dataset.plate)];
        const t = Math.min(1, Math.max(0, (q - a) / (b - a)));
        const v = (t * t * (3 - 2 * t)).toFixed(3);
        if (g.style.getPropertyValue("--fall") !== v) g.style.setProperty("--fall", v);
      });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    /* the part being read lights its plate: the tab that crosses the
       reading band just under the held stack (from its foot, 160px down) */
    const held = root.querySelector<HTMLElement>(".shf-stage");
    const foot = (held?.offsetHeight ?? 220) + 64;
    const vh = layoutViewportHeight();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting)
            root.dataset.shfPart = String(tabs.indexOf(e.target as HTMLElement));
        }
      },
      { rootMargin: `-${foot}px 0px -${Math.max(0, vh - foot - 160)}px 0px` }
    );
    tabs.forEach((tab) => io.observe(tab));
    frame();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
      plates.forEach((g) => g.style.removeProperty("--fall"));
      delete root.dataset.shfPart;
    };
  }, [stage, ref]);

  return (
    <div className="pl sh shf" ref={ref} data-phone={phone}>
      <MastheadTitle lines={TITLE} />

      <figure
        className="pl-fig"
        aria-label={FIG_LABEL}
        style={{ "--shf-col": (L.col / W).toFixed(4) } as CSSProperties}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="pl-svg" aria-hidden>
          {/* your team: a stub a workstream, onto one bus */}
          {L.team.stubs.map((s, i) => (
            <g key={i}>
              <Draw pts={s} className="shf-team" d={260 + i * 60} />
              <Tap at={s[1]} className="kit-tap--green shf-fade" />
            </g>
          ))}
          <Draw pts={L.team.bus} className="shf-team" d={420} />

          {/* the tools: production's bus, taps and stubs */}
          <Draw pts={L.tools.bus} className="shf-run" d={1200} />
          {L.tools.stubs.map((s, i) => (
            <g key={i}>
              <Draw
                pts={s}
                className={`pl-wire pl-wire--out${CARDS[i].lit ? " pl-wire--lit" : ""}`}
                d={1300 + i * 70}
              />
              <Tap at={s[0]} className="kit-tap--dawn shf-fade" />
            </g>
          ))}

          {/* the three lines that touch the stack: they let go as it leaves */}
          <g className="shf-port">
            <Draw pts={L.runIn} className="shf-team" d={620} />
            <g className="shf-fade" style={delay(600)}>
              <Junction
                at={L.team.junction.at}
                size={L.team.junction.size}
                className="shf-junction--team"
              />
              <Tap at={team.left} size={5} className="kit-tap--green" />
            </g>

            <g className="shf-fade" style={delay(900)}>
              <path d={pathOf(L.tie)} className="shf-tie" />
              <Tap at={layer.right} size={5} />
              <path d={pathOf(L.drop)} className="shf-tie" />
              <Tap at={layer.left} size={5} />
            </g>

            <Draw pts={L.runOut} className="shf-run" d={1000} />
            <g className="shf-fade" style={delay(1100)}>
              <Junction
                at={L.tools.junction.at}
                size={L.tools.junction.size}
                className="shf-junction--run"
              />
              <Tap at={agents.right} size={5} className="kit-tap--dawn" />
            </g>
          </g>
        </svg>

        {/* the stack, in its box of the frame: seated to six places, finer
            than the words' four, because three lines end on its plates */}
        <div
          className="shf-stage"
          style={
            {
              "--px": (L.box.x / W).toFixed(6),
              "--py": (L.box.y / H).toFixed(6),
              "--s": (L.box.side / W).toFixed(6),
            } as CSSProperties
          }
        >
          <ClosedStack />
        </div>

        <Tab id="embed" x={L.tabs.team} y={L.tabs.y} d="0ms" />
        <Tab id="encode" x={L.tabs.layer} y={L.tabs.y} d="800ms" />
        <Tab id="run" x={L.tabs.run} y={L.tabs.y} d="1200ms" />

        <Chips seats={L.chips} />
        {/* the layer's parts, on its drop; they let go with it */}
        <div className="shf-parts">
          <PartTags seats={L.parts} />
        </div>
        <Cards x0={L.cards.x0} x1={L.cards.x1} rows={L.cards.rows} />
      </figure>
    </div>
  );
}
