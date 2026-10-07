"use client";

import { useEffect, useRef, useState } from "react";

import { Frame } from "@/components/lattice";
import { LATTICE_BREAKPOINTS } from "@/lib/lattice/breakpoints";
import { SPECIMEN } from "@/lib/lattice/specimen-copy";
import type { LatKnobs } from "@/lib/lattice/variants";

import { cutOf, lineOf } from "./knobProps";

/**
 * The type board: the ladder as rendered specimens, each with its COMPUTED
 * px beside it (read off `getComputedStyle`, never restated from the token),
 * the spacing roles as ruled swatches with their px, the chamfer ladder as
 * five small frames, and a `matchMedia` readout of the seven breakpoints.
 */

const TYPE_RUNGS = [
  { role: "chrome-sm", face: "mono" },
  { role: "chrome-md", face: "mono" },
  { role: "chrome-lg", face: "mono" },
  { role: "copy", face: "sans" },
  { role: "lede", face: "sans" },
  { role: "h3", face: "sans" },
  { role: "h2", face: "sans" },
  { role: "title", face: "sans" },
  { role: "display", face: "sans" },
] as const;

const SPACE_ROLES = [
  "pad-chrome",
  "pad-cell",
  "gap-stack",
  "gap-block",
  "sec-pad",
  "head-gap",
  "air",
  "pitch",
] as const;

const CH = ["chrome", "seed", "card", "plate", "plate-fluid"] as const;

const px = (n: number) => `${Math.round(n * 100) / 100}px`;

export function TypeBoard({ knobs }: { knobs: LatKnobs }) {
  const cut = cutOf(knobs);
  const line = lineOf(knobs);
  const rootRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [spaces, setSpaces] = useState<Record<string, string>>({});
  const [chs, setChs] = useState<Record<string, string>>({});
  const [media, setMedia] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const read = () => {
      const root = rootRef.current;
      if (!root) return;
      const s: Record<string, string> = {};
      root.querySelectorAll<HTMLElement>("[data-type-role]").forEach((el) => {
        s[el.dataset.typeRole ?? ""] = getComputedStyle(el).fontSize;
      });
      const sp: Record<string, string> = {};
      root.querySelectorAll<HTMLElement>("[data-space-role]").forEach((el) => {
        sp[el.dataset.spaceRole ?? ""] = px(el.getBoundingClientRect().width);
      });
      const c: Record<string, string> = {};
      root.querySelectorAll<HTMLElement>("[data-ch-probe]").forEach((el) => {
        c[el.dataset.chProbe ?? ""] = px(el.getBoundingClientRect().width);
      });
      const m: Record<string, boolean> = {};
      for (const bp of LATTICE_BREAKPOINTS) {
        m[bp.name] = window.matchMedia(`(max-${bp.axis}: ${bp.max}px)`).matches;
      }
      setSizes(s);
      setSpaces(sp);
      setChs(c);
      setMedia(m);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  return (
    <div className="lat-scroll lat-type" data-lat-type="" ref={rootRef}>
      <h2 className="lat-board__head">
        <span className="lat-board__kicker">The type ladder</span>
        one modular scale, base × 1.2
      </h2>
      <ol className="lat-type__ladder">
        {TYPE_RUNGS.map((r) => (
          <li className="lat-type__rung" key={r.role}>
            <span className="lat-type__meta">
              --lat-{r.role} · {sizes[r.role] ?? "…"}
            </span>
            <span
              className={`lat-type__specimen lat-type__specimen--${r.face}`}
              data-type-role={r.role}
              style={{ fontSize: `var(--lat-${r.role})` }}
            >
              {r.face === "mono" ? SPECIMEN.masthead.kicker : SPECIMEN.split.columns[0].title}
            </span>
          </li>
        ))}
      </ol>

      <h2 className="lat-board__head">
        <span className="lat-board__kicker">The spacing roles</span>
        the 8px magnitude ladder, named by role
      </h2>
      <ol className="lat-type__spaces">
        {SPACE_ROLES.map((role) => (
          <li className="lat-type__space" key={role}>
            <span className="lat-type__meta">
              --lat-{role} · {spaces[role] ?? "…"}
            </span>
            <span
              className="lat-type__swatch"
              data-space-role={role}
              style={{ width: `var(--lat-${role})` }}
            />
          </li>
        ))}
      </ol>

      <h2 className="lat-board__head">
        <span className="lat-board__kicker">The chamfer ladder</span>
        chrome · seed · card · plate · plate-fluid
      </h2>
      <div className="lat-type__chamfers">
        {CH.map((ch) => (
          <Frame
            key={ch}
            id={`lat-frame-type-${ch}`}
            cut={cut}
            line={line}
            ch={ch}
            className="lat-type__chamfer"
            head={<span>{ch}</span>}
          >
            <span className="lat-type__meta">{chs[ch] ?? "…"}</span>
            <span
              className="lat-type__ch-probe"
              data-ch-probe={ch}
              style={{ width: `var(--lat-ch-${ch})` }}
              aria-hidden="true"
            />
          </Frame>
        ))}
      </div>

      <h2 className="lat-board__head">
        <span className="lat-board__kicker">The breakpoints</span>
        max is the even number, min is max + 1
      </h2>
      <ul className="lat-type__media">
        {LATTICE_BREAKPOINTS.map((bp) => (
          <li className="lat-type__bp" key={bp.name} data-on={media[bp.name] || undefined}>
            <span className="lat-type__meta">
              {bp.name} · max-{bp.axis} {bp.max} / min-{bp.axis} {bp.max + 1}
            </span>
            <span className="lat-type__bp-state">{media[bp.name] ? "inside" : "outside"}</span>
            <span className="lat-type__bp-role">{bp.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
