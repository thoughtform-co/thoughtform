"use client";

import { SIGNAL_PLACEHOLDER } from "./revealData";

/**
 * NavigateSignalCard — the Navigate reveal's content: a LinkedIn-post-shaped
 * "signal" artifact rendered in the HUD grammar (ADR-032). Placeholder copy
 * lives in `revealData.ts`; a real post is a data-only swap.
 */
export function NavigateSignalCard() {
  const s = SIGNAL_PLACEHOLDER;
  return (
    <article className="reveal-signal">
      <header className="reveal-signal__head">
        <span className="reveal-signal__avatar" aria-hidden="true" />
        <span className="reveal-signal__ident">
          <span className="reveal-signal__handle">{s.handle}</span>
          <span className="reveal-signal__role">{s.role}</span>
        </span>
        <span className="reveal-signal__stamp">{s.timestamp}</span>
      </header>
      <div className="reveal-signal__body">
        {s.lines.map((line, i) => (
          <p key={i} className="reveal-signal__line">
            {line}
          </p>
        ))}
      </div>
      <footer className="reveal-signal__foot">
        <ul className="reveal-signal__metrics">
          {s.metrics.map((m) => (
            <li key={m.label} className="reveal-signal__metric">
              <span className="reveal-signal__metric-value">{m.value}</span>
              <span className="reveal-signal__metric-label">{m.label}</span>
            </li>
          ))}
        </ul>
        <span className="reveal-signal__status">{s.statusLabel}</span>
      </footer>
    </article>
  );
}
