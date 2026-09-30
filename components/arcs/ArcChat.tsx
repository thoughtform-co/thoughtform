import type { ArcChatBlock, ArcChatTurn, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcChatProps {
  section: ArcSectionOf<"chat">;
  index: number;
  motion?: ArcMotion;
}

function ChatBlock({ block }: { block: ArcChatBlock }) {
  switch (block.kind) {
    case "p":
      return <p className="arc-chat__p">{block.text}</p>;
    case "list":
      return (
        <ul className="arc-chat__list">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "rows":
      return (
        <dl className="arc-chat__rows">
          {block.rows.map((row) => (
            <div key={row.term} className="arc-chat__row">
              <dt>{row.term}</dt>
              <dd>{row.def}</dd>
            </div>
          ))}
        </dl>
      );
    case "issue":
      return (
        <div className="arc-plate arc-chat__issue">
          <span className="arc-chat__issuetitle">{block.title}</span>
          <dl className="arc-chat__rows">
            {block.rows.map((row) => (
              <div key={row.term} className="arc-chat__row">
                <dt>{row.term}</dt>
                <dd>{row.def}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}

function ChatTurn({ turn }: { turn: ArcChatTurn }) {
  switch (turn.kind) {
    case "you":
      return (
        <div className="arc-chat__you" data-chat-turn="you">
          {turn.slash ? <b className="arc-chat__slash">{turn.slash}</b> : null}
          {turn.text}
        </div>
      );
    case "tool":
      return (
        <div className="arc-chat__tool" data-chat-turn="tool">
          {turn.text}
        </div>
      );
    case "claude":
      return (
        <div className="arc-chat__claude" data-chat-turn="claude">
          {turn.blocks.map((block, i) => (
            <ChatBlock key={`${block.kind}-${i}`} block={block} />
          ))}
        </div>
      );
    default: {
      const exhaustive: never = turn;
      return exhaustive;
    }
  }
}

/**
 * ArcChat — a conversation (ADR-139): what using this actually looks like.
 *
 * Two readings of one panel, and the section's `variant` picks which column
 * stands beside it. `ask` shows a request in ordinary words answered by the
 * right skill, with the slash menu beside it for the room that would rather
 * point than describe. `feedback` shows a person saying what went wrong in
 * the chat itself, the exact thing that will be filed shown back to them
 * before anything is filed, and the four steps that follow.
 *
 * ⚠ IT IS DRAWN, NOT SCREENSHOTTED. A screenshot is stale within a month,
 * carries another product's type and colour onto the page, and cannot be
 * read by anyone using a screen reader. This is the house's own ink, and
 * every word in it is text.
 *
 * ⚠ THE PANEL SHOWS THE ASK BEFORE THE FILE. On the feedback reading, the
 * issue block is what Claude is proposing to send, shown whole, with the
 * person's yes after it. A beat that showed only the outcome would be
 * teaching the room that something is filed on their behalf without asking,
 * which is the opposite of how it works.
 *
 * ⚠ THE COMPOSER NEVER IDLES. Its caret is CSS and arrives once (ADR-080);
 * a blinking cursor on a page that fills a viewport is a thing the eye
 * cannot leave alone.
 *
 * ⚠ SERVER, NO STATE, NO LISTENER. `data-chat-*` only.
 */
export function ArcChat({ section, index, motion = "reveal" }: ArcChatProps) {
  const { thread, aside, variant } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="chat"
      className="arc-section arc-sec arc-sec--chat"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="chat"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-chat arc-reveal" data-chat-figure={variant} {...rung(motion, 0.14)}>
          <div className="arc-plate arc-chat__panel" {...rung(motion, 0.18)}>
            <header className="arc-chat__mast">{thread.title}</header>
            <div className="arc-chat__turns">
              {thread.turns.map((turn) => (
                <ChatTurn key={turn.id} turn={turn} />
              ))}
            </div>
            {thread.composer ? (
              <footer className="arc-chat__composer" aria-hidden="true">
                <span className="arc-chat__composertext">{thread.composer}</span>
              </footer>
            ) : null}
          </div>

          <div className="arc-chat__aside" data-chat-aside={aside.kind} {...rung(motion, 0.24)}>
            <span className="arc-chat__asidelabel">{aside.label}</span>
            {aside.kind === "menu" ? (
              <div className="arc-plate arc-chat__menu">
                <span className="arc-chat__menutitle">{aside.title}</span>
                <ul className="arc-chat__menuitems">
                  {aside.items.map((item) => (
                    <li key={item.id} data-chat-on={item.on ? "" : undefined}>
                      <span className="arc-chat__menuname">{item.name}</span>
                      <span className="arc-chat__menufrom">{item.from}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ol className="arc-chat__steps">
                {aside.items.map((item, i) => (
                  <li
                    key={item.id}
                    className="arc-plate arc-chat__step"
                    {...rung(motion, ladder(0.28, 0.04, i, 0.42))}
                  >
                    <span className="arc-chat__steptitle">{item.title}</span>
                    <span className="arc-chat__stepbody">{item.body}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}
