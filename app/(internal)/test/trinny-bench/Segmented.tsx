"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";

export interface SegOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * One control for the two rows above the module and for the image type:
 * 1 px seams, square corners, the chosen segment in ink (Moira's
 * `.lic-ws-tabs`, in the house's form).
 *
 * `tabs` is a real tablist whose panels the module owns (`idBase` wires
 * `aria-controls` to them); `radio` is a radiogroup. Both rove on the arrow
 * keys, Home and End, and choose as they move.
 */
export function Segmented<T extends string>({
  kind,
  label,
  options,
  value,
  onChange,
  idBase,
  wide,
}: {
  kind: "tabs" | "radio";
  label: string;
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
  idBase?: string;
  wide?: boolean;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const chosen = options.findIndex((o) => o.value === value);
  const home = chosen >= 0 ? chosen : 0;

  const move = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = options.length;
    let dir = 0;
    let j = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") dir = 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") dir = -1;
    else if (e.key === "Home") {
      dir = 1;
      j = -1;
    } else if (e.key === "End") {
      dir = -1;
      j = n;
    } else return;
    e.preventDefault();
    for (let k = 0; k < n; k++) {
      j = (j + dir + n) % n;
      if (!options[j].disabled) break;
    }
    onChange(options[j].value);
    refs.current[j]?.focus();
  };

  return (
    <div
      className="tb-seg"
      data-wide={wide ? "1" : undefined}
      role={kind === "tabs" ? "tablist" : "radiogroup"}
      aria-label={label}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            className="tb-seg__opt"
            role={kind === "tabs" ? "tab" : "radio"}
            id={kind === "tabs" && idBase ? `${idBase}-tab-${o.value}` : undefined}
            aria-controls={kind === "tabs" && idBase ? `${idBase}-${o.value}` : undefined}
            aria-selected={kind === "tabs" ? on : undefined}
            aria-checked={kind === "radio" ? on : undefined}
            tabIndex={i === home ? 0 : -1}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => move(e, i)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
