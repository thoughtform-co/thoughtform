import type { CSSProperties } from "react";

import type { CaseTrack } from "@/lib/cases/types";

/**
 * The selected track's concise evidence, kept beside the brief instead of
 * underneath the visual. `readouts` remain a compatibility input and are
 * normalized into the same markup rather than reviving a second register.
 */
export function TrackProofRegister({ track }: { track: CaseTrack }) {
  const items = track.blocks?.length
    ? track.blocks.map((block) => ({
        value: block.value,
        label: block.title,
        description: block.desc,
      }))
    : (track.readouts ?? []).map((readout) => ({
        value: readout.value,
        label: readout.label,
        description: undefined,
      }));

  if (!items.length) return null;

  return (
    <section
      className="fl-proof-register"
      data-fl-zone="proof-register"
      data-fl-panel
      style={{ "--ci-off": 0.3, "--fl-dx": "-48px" } as CSSProperties}
      aria-label={`${track.project} proof points`}
    >
      <ul className="fl-proof-register__list">
        {items.map((item, index) => (
          <li
            className="fl-proof-register__item"
            key={`${track.id}-${index}`}
            aria-label={[item.value, item.label, item.description].filter(Boolean).join(". ")}
          >
            <strong
              className="fl-proof-register__value"
              data-wide={item.value.length > 12 || undefined}
            >
              {item.value}
            </strong>
            <span className="fl-proof-register__label">{item.label}</span>
            {item.description ? (
              <span className="fl-proof-register__description">{item.description}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
