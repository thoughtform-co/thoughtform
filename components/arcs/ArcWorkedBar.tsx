export interface ArcWorkedChoice {
  id: string;
  label: string;
}

interface ArcWorkedBarProps {
  /** The switched beat this bar sits over. */
  group: string;
  /** The choices, in the record's order. The first is the resting pick. */
  choices: readonly ArcWorkedChoice[];
  /** The control's own name, read before the choices. */
  label: string;
}

/**
 * ArcWorkedBar — the control over a switched beat (ADR-139).
 *
 * ⚠ IT IS A RADIO GROUP, NOT A TABLIST. Tabs control the panel beneath
 * them; this control changes SIX beats at once, because the room is
 * following one piece of work down a whole chapter rather than comparing
 * three panes of one section. `radiogroup` says "choose one of these", which
 * is exactly what it does, and it is the only role that does not promise a
 * relationship to the panel below that the page does not honour.
 *
 * ⚠ IT IS NOT ON THE PAGE UNTIL JS IS. A control that does nothing is worse
 * than no control: with no script the first example simply reads whole, as
 * the markup already renders it, and the stylesheet keeps this bar away
 * until `is-arc-worked-js` says a hand is listening. Same idiom as
 * `useArcReveal`'s own `jsClass`.
 *
 * ⚠ ZERO-HEIGHT AND STICKY. It takes no room in the flow — every beat in the
 * chapter is budgeted to one screen and a bar in flow would spend a line of
 * it — so it rides over the beat, dropped clear of the masthead by a token
 * the stylesheet owns, and stays in reach for the whole run.
 *
 * ⚠ SERVER. The island writes `aria-checked` and `tabindex`; what is
 * rendered here is the resting state, correct before any script runs.
 */
export function ArcWorkedBar({ group, choices, label }: ArcWorkedBarProps) {
  const labelId = `arc-worked-${group}-label`;
  return (
    <div className="arc-worked__bar" data-arc-worked-bar={group}>
      <div className="arc-worked__inner">
        <span className="arc-worked__barlabel" id={labelId}>
          {label}
        </span>
        <div className="arc-worked__tabs" role="radiogroup" aria-labelledby={labelId}>
          {choices.map((choice, i) => (
            <button
              key={choice.id}
              type="button"
              role="radio"
              className="arc-worked__tab"
              data-arc-worked-tab={choice.id}
              aria-checked={i === 0 ? "true" : "false"}
              tabIndex={i === 0 ? 0 : -1}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
