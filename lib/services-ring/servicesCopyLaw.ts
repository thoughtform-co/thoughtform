/**
 * servicesCopyLaw — the services cards' COPY LAW as regexes (ADR-111 left it
 * open: "the surface that carries the offer had no guard at all").
 *
 * `.claude/rules/services-ring.md` §The copy law states it in prose; this is
 * the mechanical half, read by the re-cut test over the lab's records AND
 * the production records. It is its own list rather than
 * `lib/arcs/copyLaw.ts`'s `PROPOSAL_COPY_BANS` because that list bans the em
 * dash and the owner's Advisory body carries one verbatim (a ban that fails
 * approved copy is a ban that gets deleted).
 *
 * Three-free, types only — the lab test and any future production test read
 * it; nothing on the landing does.
 */

import type { Service } from "@/components/landing/home-v2/services/serviceData";
import type { ServicePlate } from "@/components/landing/home-v2/services/servicePlateData";

export const SERVICES_COPY_BANS: readonly (readonly [RegExp, string])[] = [
  [/self-suffic/i, "says the word instead of the behaviour (say: a setup the team runs by itself)"],
  [/flywheel/i, "the founder says it in the room; copy says what turns"],
  [
    /fractional/i,
    "never alone — and never on a card, where the cadence and the dated handover do not fit beside it",
  ],
  [/[€$£]/, "no price field: money stays in the proposal"],
  [/\bUSD\b|\bEUR\b|\bGBP\b/i, "no price field: money stays in the proposal"],
  [/\barmada\b|\bcallsign\b|\bharvest\b/i, "fleet vocabulary"],
  [/\bthe wave\b|\bwave one\b|\brubric\b/i, "fleet vocabulary"],
  [/\bVince\b|\bBuyssens\b/, "the founder is not the offer"],
];

/** Every string a plate letters on a card, the phone back or the mobile plate.
 *  ⚠ Not `photo.alt` — an alt text names the person in the photograph, which
 *  is description, not offer. */
export function plateCopyStrings(plate: ServicePlate): readonly string[] {
  return [
    plate.chip,
    plate.title,
    ...plate.lede.map((s) => (typeof s === "string" ? s : s.em)),
    ...plate.breakdown,
    plate.spec.duration,
    plate.spec.participants,
    plate.spec.format,
    plate.spec.language,
    plate.spec.leavesWith,
    plate.feedLabel,
    plate.feedStatus,
    ...plate.includes,
    plate.ctaLabel,
  ];
}

/** Every string the DOM side letters (the rail register, the accordion). */
export function serviceCopyStrings(service: Service): readonly string[] {
  return [
    service.verb,
    service.name,
    service.kicker,
    service.tagline,
    service.body,
    ...service.meta.map((m) => m.value),
    service.ctaLabel,
  ];
}

export interface CopyViolation {
  id: string;
  text: string;
  reason: string;
}

export function servicesCopyViolations(id: string, strings: readonly string[]): CopyViolation[] {
  const out: CopyViolation[] = [];
  for (const text of strings) {
    for (const [re, reason] of SERVICES_COPY_BANS) {
      if (re.test(text)) out.push({ id, text, reason });
    }
  }
  return out;
}

/** The lede's ceiling in characters (`servicePlateData.ts`: past ~160 it
 *  crowds the title band). */
export const LEDE_MAX_CH = 160;

export function ledeLength(plate: ServicePlate): number {
  return plate.lede.reduce((n, s) => n + (typeof s === "string" ? s.length : s.em.length), 0);
}
