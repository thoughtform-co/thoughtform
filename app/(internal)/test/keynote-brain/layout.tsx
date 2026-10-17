import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/keynote-brain: the keynote's machine brain machined all over
 * (ADR-159 U7, owner 2026-10-17: "we only have these circuits on top.
 * Aren't there other ways we can make the rest of the things feel like
 * chips are designed, like wafers ... play with our golds a bit, weave them
 * throughout").
 *
 * ⚠ NOT A BRIEF-FIRST LAB, AND THAT IS RECORDED: this iterates an existing
 * object, so it draws the act's own `brainIso` with its new `chip` options
 * (every one off by default, the Ghent brain byte-identical), and the pick
 * ports by passing the same options from the act.
 *
 * Internal-only: `/test/*` is a 404 in production.
 */
export const metadata: Metadata = {
  title: "Keynote brain",
  robots: { index: false, follow: false },
};

export default function KeynoteBrainLayout({ children }: { children: ReactNode }) {
  return children;
}
