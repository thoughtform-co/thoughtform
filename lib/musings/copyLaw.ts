/**
 * lib/musings/copyLaw — what a public post may not say (ADR-114).
 *
 * The proposal bans (`lib/arcs/copyLaw.ts`) hold: no fleet words, no
 * unfilled bracket, no em dash. A post adds the ways a draft leaks a
 * placeholder into print, and the money rule the whole site keeps.
 */
import { PROPOSAL_COPY_BANS } from "@/lib/arcs/copyLaw";

export const MUSINGS_COPY_BANS: readonly (readonly [RegExp, string])[] = [
  ...PROPOSAL_COPY_BANS,
  [/lorem/i, "placeholder copy"],
  [/(TODO|TBD|FIXME)/, "a note to self, in print"],
  [/[€$£]|(EUR|USD|GBP)/, "money stays in the proposal"],
];
