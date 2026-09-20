import Link from "next/link";
import type { CSSProperties } from "react";

import type { SheetSection } from "@/lib/sheet/types";

import { CLIENT_DESIG } from "./chrome";
import { dataAttrs } from "./SheetCells";
import { SheetConsoleStack } from "./SheetConsoleStack";
import { SheetFlashcard } from "./SheetFlashcard";
import { SheetReadout } from "./SheetParts";

type Console = Extract<SheetSection, { kind: "console" }>;

/**
 * The client console (ADR-114): a sticky terminal panel on the left four
 * columns — a chamfered housing with a head bar fused to its top edge
 * (the client's name and a slash-slash designation), a readout column of
 * facts DERIVED from the registry, the lede — beside the client's
 * flashcards, which stack on scroll when there is more than one.
 *
 * A set of consoles is ONE section (a uniform set is one object on the
 * sheet); each console is its own `<article id>`, so it is a chapter the
 * header's nav can reach.
 *
 * ⚠ AT n = 1 THERE IS NO STACK: no slot, no sticky, no tail, no hook. Every
 * real console today is this case; the kit's fixture exercises the pile.
 */
export function SheetConsole({ section }: { section: Console }) {
  return (
    <div className="sh-consoles">
      {section.consoles.map((c) => (
        <article
          key={c.id}
          id={c.id}
          className="sh-console"
          aria-label={c.panel.name}
          {...dataAttrs(c.data)}
        >
          <aside className="sh-console__panel">
            <div className="sh-console__in sh-reveal">
              <div className="sh-console__bar">
                <h3 className="sh-console__name">
                  {c.panel.href ? <Link href={c.panel.href}>{c.panel.name}</Link> : c.panel.name}
                </h3>
                <span className="sh-console__desig" aria-hidden="true">
                  {c.panel.kicker ?? CLIENT_DESIG}
                </span>
              </div>
              <SheetReadout rows={c.panel.readout} className="sh-console__readout" />
              <p className="sh-console__lede">{c.panel.lede}</p>
            </div>
          </aside>
          {c.cards.length > 1 ? (
            <SheetConsoleStack n={c.cards.length}>
              {c.cards.map((card, i) => (
                <div
                  key={card.id}
                  className="sh-console__slot"
                  data-pc-slot=""
                  data-pc-index={i}
                  style={{ "--i": i, zIndex: i + 1 } as CSSProperties}
                >
                  <SheetFlashcard card={card} />
                </div>
              ))}
            </SheetConsoleStack>
          ) : (
            <div className="sh-console__one">
              {c.cards[0] ? <SheetFlashcard card={c.cards[0]} /> : null}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
