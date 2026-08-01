import type { ArcMotion, ArcTitle } from "@/lib/arcs/types";

import { ArcTitleText, arcTitleText, glueFor } from "./chrome";

/**
 * Server-rendered decode markup (ADR-057). Three rules make this safe:
 *
 * 1. **The attribute holds the target, the child holds the same text.**
 *    SSR, no-JS and the sub-961px fallback tier all ship RESOLVED copy;
 *    only the client controller ever blanks it. Never pre-render a blank
 *    (hydration mismatch, and the page reads broken without JS).
 * 2. **Decode targets are LEAF spans.** The scramble kernel writes
 *    `textContent`, which would destroy any markup inside — so the gold
 *    `em` pivot wraps its target rather than living inside it.
 * 3. **Every decoding box has a ghost twin.** Arc sections are centred
 *    grids; an unreserved blank collapses the box and shifts the whole
 *    section. The ghost holds the full text at `visibility: hidden` and
 *    the live layer floats over it.
 *
 * (The scramble itself pads to the target's full length from frame one,
 * so text never reflows mid-decode — only the armed blank needs a box.)
 */

type DecodeEffect = "scramble" | "type";

/** One decode target — a leaf span carrying its own target string. */
function Target({ text, effect }: { text: string; effect: DecodeEffect }) {
  return effect === "type" ? (
    <span data-arc-type={text}>{text}</span>
  ) : (
    <span data-arc-decode={text}>{text}</span>
  );
}

/**
 * A split title with each segment as its own decode target. Spacing and
 * punctuation glue mirror `ArcTitleText` exactly, so the resolved render
 * is identical to the reveal-mode one.
 */
function TitleSegments({ title, effect }: { title: ArcTitle; effect: DecodeEffect }) {
  const { pre, em, post } = title;
  return (
    <>
      {pre ? <Target text={pre} effect={effect} /> : null}
      {pre && em ? " " : ""}
      {em ? (
        <em>
          <Target text={em} effect={effect} />
        </em>
      ) : null}
      {post ? (
        <>
          {pre || em ? glueFor(post) : ""}
          <Target text={post} effect={effect} />
        </>
      ) : null}
    </>
  );
}

interface ArcDecodeTitleProps {
  title: ArcTitle;
  motion: ArcMotion;
  className: string;
  as?: "h2" | "p";
  /** Render the CRT caret after the last segment (mastheads and lines). */
  cursor?: boolean;
  /**
   * "scramble" (default) is the station voice — mono-caps glyph shuffle.
   * "type" is the typewriter, for sentence-case display lines (quotes):
   * the caps glyph pool reads as noise through lowercase, but a quote
   * being TYPED still honours the only-via-the-effect law.
   */
  effect?: DecodeEffect;
}

/** A title that decodes into place, or the plain title in reveal mode. */
export function ArcDecodeTitle({
  title,
  motion,
  className,
  as = "h2",
  cursor = true,
  effect = "scramble",
}: ArcDecodeTitleProps) {
  const Tag = as;
  if (motion !== "terminal") {
    return (
      <Tag className={className}>
        <ArcTitleText title={title} />
      </Tag>
    );
  }
  return (
    <Tag className={`${className} arc-tdec`} aria-label={arcTitleText(title)}>
      <span className="arc-tdec__ghost" aria-hidden="true">
        <ArcTitleText title={title} />
      </span>
      <span className="arc-tdec__live" aria-hidden="true">
        <TitleSegments title={title} effect={effect} />
        {cursor ? <i className="arc-cursor" aria-hidden="true" /> : null}
      </span>
    </Tag>
  );
}

interface ArcTypeCopyProps {
  text: string;
  motion: ArcMotion;
  className: string;
  as?: "p" | "span";
}

/**
 * Body copy that types in character by character. Typing (not
 * scrambling) is the register for sentence-case prose — the glyph pool
 * is mono caps, so a scrambled sentence reads as noise.
 */
export function ArcTypeCopy({ text, motion, className, as = "p" }: ArcTypeCopyProps) {
  const Tag = as;
  if (motion !== "terminal") {
    return <Tag className={className}>{text}</Tag>;
  }
  return (
    <Tag className={`${className} arc-tdec`} aria-label={text}>
      <span className="arc-tdec__ghost" aria-hidden="true">
        {text}
      </span>
      <span className="arc-tdec__live" aria-hidden="true" data-arc-type={text}>
        {text}
      </span>
    </Tag>
  );
}

/** A single-string chrome readout that scrambles (designations, chips). */
export function ArcDecodeWord({
  text,
  motion,
  className,
}: {
  text: string;
  motion: ArcMotion;
  className: string;
}) {
  if (motion !== "terminal") {
    return (
      <span className={className} aria-hidden="true">
        {text}
      </span>
    );
  }
  return (
    <span className={`${className} arc-tdec arc-tdec--inline`} aria-hidden="true">
      <span className="arc-tdec__ghost">{text}</span>
      <span className="arc-tdec__live">
        <Target text={text} effect="scramble" />
      </span>
    </span>
  );
}
