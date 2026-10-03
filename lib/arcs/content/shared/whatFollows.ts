import type { ArcSectionOf, ArcTitle } from "../../types";

/**
 * "Then it runs without me." — the workshop's client close (ADR-139), hoisted
 * by ADR-143 because the third house cut ends on it too. The eyebrow carries
 * the beat's NUMBER, which differs per page (23 on the second cut, 11 on the
 * third), so each page authors the eyebrow and spreads the rest — the
 * `FRONTIER_CURVE` precedent: share the record, author the frame.
 * `arcs-registry` pins the title, the sub and the actions `toBe` these.
 */
export const WHAT_FOLLOWS_TITLE: ArcTitle = { pre: "Then it runs", em: "without me." };

export const WHAT_FOLLOWS_SUB =
  "The first workstream goes through the loop with your own team at the controls. Then a second, with the checks that have accumulated. Then we hand over, with a date on it, and come back once to see what changed.";

export const WHAT_FOLLOWS_CLOSE: Pick<
  ArcSectionOf<"close">,
  "actions" | "footerLine" | "signature"
> = {
  actions: [
    {
      id: "mail",
      label: "vince@thoughtform.co",
      href: "mailto:vince@thoughtform.co",
      primary: true,
    },
  ],
  footerLine: "Thoughtform · Antwerp · 2026",
  signature: "Vince Buyssens",
};

/** The close at a page's own position: `eyebrow` is the page's number. */
export function whatFollows(eyebrow: string): ArcSectionOf<"close"> {
  return {
    id: "close",
    kind: "close",
    menuLabel: "What follows",
    head: { eyebrow, title: WHAT_FOLLOWS_TITLE, sub: WHAT_FOLLOWS_SUB },
    ...WHAT_FOLLOWS_CLOSE,
  };
}
