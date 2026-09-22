/**
 * The practice's public channels — ONE record, two readers (ADR-105).
 *
 * The site footer and the About stage both printed their own list, and every
 * entry in both was `href="#"` — three in the old `<footer class="foot">`,
 * four on `aboutStageData`. A launch page with dead social links is a defect,
 * not a placeholder, and two lists of the same four channels is how one gets
 * fixed and the other does not.
 *
 * ⚠ **`href: null` MEANS NOT PUBLISHED, AND IT RENDERS NOTHING.** The channels
 * are decided (owner, 2026-09-15: LinkedIn · X · Instagram · YouTube); the
 * URLs are an input this file is still waiting for. A null entry is skipped by
 * both renderers, so the page is CORRECT today and lights up the moment a URL
 * lands — where a `"#"` ships an affordance that does nothing.
 *
 * ⚠ **`"#"` IS A GUARD FAILURE**, not a value. `tests/lib/socials.test.ts`
 * pins it: an entry is either `null` or an absolute `https://` URL. That is
 * the whole reason this file exists rather than a fifth inline array.
 *
 * Zero imports, so the guard can walk it and neither renderer drags the other
 * in.
 */
export type SocialIcon = "linkedin" | "x" | "instagram" | "youtube" | "email";

export interface SocialLink {
  /** The channel's public URL, or `null` while it is unpublished. */
  readonly href: string | null;
  readonly label: string;
  readonly icon: SocialIcon;
}

/** The mailbox the site answers on. Published, and the one that always shows. */
export const CONTACT_EMAIL = "hello@thoughtform.co";

export const SOCIALS: readonly SocialLink[] = [
  /* The one URL this file had been waiting for since ADR-105 (owner supplied
     it 2026-09-22). It lights in BOTH readers at once — the footer's Connect
     column and the About stage's list — which is the whole reason the record
     is one array rather than a fifth inline list. */
  { href: "https://www.linkedin.com/in/starhaven/", label: "LinkedIn", icon: "linkedin" },
  { href: null, label: "X", icon: "x" },
  { href: null, label: "Instagram", icon: "instagram" },
  { href: null, label: "YouTube", icon: "youtube" },
];

/** The channels that actually have somewhere to go. Both renderers map this. */
export function publishedSocials(): readonly (SocialLink & { href: string })[] {
  return SOCIALS.filter((s): s is SocialLink & { href: string } => typeof s.href === "string");
}
