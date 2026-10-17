import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The machine-mind lab: six directions for the keynote brain (owner,
 * 2026-10-17: "how can we use the aesthetic of circuit boards and machines to
 * make something look really elegant? Right now it just feels like plateaus
 * … still retaining the beautiful 3D shape"; and a family from the hero, the
 * machine head of sand, "transistor metal, gold, beautifully blended with
 * the more sandy, stone-like aesthetic").
 *
 * ⚠ NOT A BRIEF-FIRST LAB (CLAUDE.md "New design starts from the brief"), like
 * `/test/keynote-brain`: it iterates an existing object, so it draws from the
 * act's own `brainIso` (shape, axes, camera), the anatomy kit and the swarm
 * engine. Nothing here is imported by the act until the owner picks.
 */
export const metadata: Metadata = {
  title: "Machine mind",
  robots: { index: false, follow: false },
};

export default function MachineMindLayout({ children }: { children: ReactNode }) {
  return children;
}
