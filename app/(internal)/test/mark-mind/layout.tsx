import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The mark is the mind: the build lab (owner, 2026-10-19: "The mark, the
 * mind, is genius … the thought and the form bringing together adoption and
 * automation"; "the circle is a loop: that's the flywheel").
 *
 * A brief-first lab (CLAUDE.md "New design starts from the brief"): its own
 * geometry, contents and painter, reading only the brand mark's paths from
 * `lib/brandmark`. Its image studies and the scope are in
 * `docs/design/machine-mind/round-06/` and `docs/plans/mark-is-the-mind-build.md`.
 */
export const metadata: Metadata = {
  title: "The mark is the mind",
  robots: { index: false, follow: false },
};

export default function MarkMindLayout({ children }: { children: ReactNode }) {
  return children;
}
