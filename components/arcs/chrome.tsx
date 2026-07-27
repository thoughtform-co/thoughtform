import type { ArcSectionKind, ArcTitle } from "@/lib/arcs/types";

/**
 * Shared arc chrome helpers (server-safe, ADR-052). The `em` pivot is
 * the site's upright-gold emphasis — arcs.css styles it
 * `font-style: normal; color: var(--gold)` (no italics anywhere).
 */

/** Does `post` glue directly to the em (leading punctuation) or need a space? */
const glueFor = (post: string) => (/^[.,:;!?)]/.test(post) ? "" : " ");

export function ArcTitleText({ title }: { title: ArcTitle }) {
  const { pre, em, post } = title;
  return (
    <>
      {pre}
      {pre && em ? " " : ""}
      {em ? <em>{em}</em> : null}
      {post ? `${pre || em ? glueFor(post) : ""}${post}` : null}
    </>
  );
}

/** Plain-text form of a split title — aria labels, metadata. */
export function arcTitleText(title: ArcTitle): string {
  const { pre, em, post } = title;
  const main = [pre, em].filter(Boolean).join(" ");
  if (!post) return main;
  return main ? `${main}${glueFor(post)}${post}` : post;
}

/**
 * Deterministic decorative coordinate stamp (the masthead survey
 * grammar). FNV-style hash of the section id — stable across SSR and
 * hydration, no Math.random.
 */
export function coordStamp(seed: string, salt: number): string {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const a = (h >>> 12) % 4096;
  const b = h % 4096;
  return `${String(a).padStart(4, "0")} / ${String(b).padStart(4, "0")}`;
}

const KIND_DESIG: Record<ArcSectionKind, string> = {
  head: "CHAPTER",
  cards: "GRID",
  "list-groups": "INDEX",
  anatomy: "SPEC",
  interstitial: "SIGNAL",
  media: "FEED",
  portrait: "OPERATOR",
  close: "CLOSE",
};

/** Fallback designation label when a section head authors no eyebrow. */
export function sectionDesig(kind: ArcSectionKind, index: number): string {
  return `ARC / ${KIND_DESIG[kind]} · ${String(index + 1).padStart(2, "0")}`;
}

export function padIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}
