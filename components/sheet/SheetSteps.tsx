import type { SheetSection } from "@/lib/sheet/types";

import { SheetCta } from "./SheetParts";

type Steps = Extract<SheetSection, { kind: "steps" }>;

/**
 * The stepped list (ADR-114): a date rail on the left, the item opposite,
 * and ONE open item elaborated — its lines and its call to action — while
 * every other item stays one line in its own ink. Selection is elaboration,
 * never a fill (the weapon-chooser reference's one transferable idea).
 */
export function SheetSteps({ section }: { section: Steps }) {
  const openIdx = section.items.findIndex((it) => it.id === section.open);
  return (
    <ol className="sh-steps">
      {section.items.map((it, i) => {
        const isOpen = it.id === section.open;
        const isPast = openIdx >= 0 && i < openIdx;
        return (
          <li
            key={it.id}
            className={`sh-steps__item sh-reveal${isOpen ? " is-open" : ""}${isPast ? " is-past" : ""}`}
            data-id={it.id}
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className="sh-steps__when">
              <span className={`sh-diamond${isOpen ? " is-lit" : ""}`} aria-hidden="true" />
              <span>{it.when}</span>
            </div>
            <div className="sh-steps__body">
              <h3 className="sh-steps__title">{it.title}</h3>
              {it.lines?.length ? (
                <ul className="sh-steps__lines">
                  {it.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              ) : null}
              {it.cta ? (
                <div className="sh-steps__cta">
                  <SheetCta href={it.cta.href} label={it.cta.label} />
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
