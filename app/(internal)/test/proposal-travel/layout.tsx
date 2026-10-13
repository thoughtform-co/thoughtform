import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/proposal-travel: a copy of the X-Bionic proposal on which the stack
 * travels across its first three sections (owner, 2026-10-13, after
 * arrakis.tech/platform: "use our stacked flow and place it at the center,
 * then move it to the section afterwards … so yes that means we need to make
 * a copy of our x-bionic proposal").
 *
 * The whole proposal through the real arc shell. Only its first two sections
 * are drawn here by hand: "AI capability your teams own." opens on the closed
 * stack, which arrives opened in Navigate, Encode, Build and closes there as
 * it does on the proposal, then hands over to "Marketing first, then every
 * team." as it does on the proposal. Every other section is the proposal's
 * own record, by reference.
 *
 * The opening is the proposal's own flow with the stack where its ringed hub
 * was (`StackFlow`; owner, same day: "integrate Navigate with your team,
 * built on Claude Enterprise, and all these things into that new AI
 * capability your team owns"). `?hero=index` keeps the other reading for
 * now: a number and a name a plate (`StackHero`).
 *
 * Internal-only: the sent page, its record and its listing are untouched.
 */
export const metadata: Metadata = {
  title: "Proposal, the stack travels",
  robots: { index: false, follow: false },
};

export default function ProposalTravelLayout({ children }: { children: ReactNode }) {
  return children;
}
