/**
 * The footer's link columns — ONE record, derived from the journey (ADR-105 U2).
 *
 * The owner's reference set (Eclipsera, Zellic, Meridian, Lighthouse, GIC) all
 * carry a NAMED LINK GRID of three to five columns; the shipped footer carried
 * none. This is that grid's data.
 *
 * ⚠ **IT DERIVES FROM `MANIFEST_ENTRIES`, IT DOES NOT RE-TYPE THEM.** A second
 * hand-written "Services / About / Voidwalker" is the two-lists-one-gets-fixed
 * failure `lib/site/socials.ts` was created to end, and `HudNav.tsx` is the
 * in-repo cautionary tale — hardcoded items that parse-time cleanup could not
 * reach, and its own comment records the dead anchor it shipped. Resolving the
 * label and the href through the manifest means a renamed or deleted station is
 * a TEST FAILURE, never a dead anchor.
 *
 * ⚠ **BUT IT IS CURATED ON TOP, NOT MAPPED.** `MANIFEST_ENTRIES` is a
 * scroll-choreography roster: nine rows including `hero`, four corridor beats
 * and `contact` — which is this footer. A table of contents needs a different
 * projection. (`READOUT_SECTIONS` is not it either: it seats a `proof` row that
 * has NO ANCHOR OF ITS OWN, since the casefile shares `#services`' section, so
 * mapping it would print a duplicate href.)
 *
 * ⚠ **WHAT MAY NOT BE LINKED, AND IT IS NOT A STYLE QUESTION.** `/arcs` and
 * every arc slug are **noindexed client material**: `app/robots.ts` leaves them
 * crawlable only so each page's `robots: { index: false }` is visible, and
 * `app/sitemap.ts` names them "noindexed client decks, deliberately absent".
 * `ARCS` holds three live CLIENT PROPOSALS. A footer link there publishes them.
 * `tests/lib/footer-nav.test.ts` asserts every internal path is a member of the
 * sitemap's URL set, which is what makes that mistake unmergeable rather than
 * merely discouraged.
 *
 * ⚠ **AND `href: null` MEANS NOT PUBLISHED**, exactly as in `socials.ts`: the
 * row is decided and its destination is an input we do not have. A null row is
 * dropped by `footerColumns()`, and a column left with no rows is dropped with
 * it — so a blocked column is recorded HERE, in code, rather than in a comment,
 * and lights up the day the destination exists.
 *
 * Zero imports beyond the two records it composes, so the guard can walk it.
 */
import {
  MANIFEST_ENTRIES,
  CORRIDOR_MOUNT_ID,
  type ManifestEntryId,
} from "@/lib/rail-manifest/entries";
import { CONTACT_EMAIL, SOCIALS, type SocialIcon } from "@/lib/site/socials";

export interface FooterLink {
  readonly label: string;
  /** Destination, or `null` while it is unpublished — the row renders nothing. */
  readonly href: string | null;
  /** Opens in a new tab: cross-origin `https://` ONLY. Never a `mailto:` —
   *  Chrome opens the blank tab first and leaves it behind when the mail
   *  client takes the link (the review's finding); the renderer refuses the
   *  pair and the test pins it. */
  readonly external?: boolean;
  readonly social?: SocialIcon;
}

export interface FooterColumn {
  readonly heading: string;
  readonly links: readonly FooterLink[];
}

/** The manifest row for an id, or a throw — a deleted station must be loud. */
function entry(id: ManifestEntryId) {
  const row = MANIFEST_ENTRIES.find((e) => e.id === id);
  if (!row) throw new Error(`footer-nav: no manifest entry "${id}"`);
  return row;
}

/** A station link, labelled and targeted by the manifest itself. */
function station(id: ManifestEntryId, label?: string): FooterLink {
  const row = entry(id);
  return { label: label ?? row.name, href: `#${row.targetId}` };
}

/**
 * The Arc is four manifest rows sharing one mount, so the footer names it once
 * and points at the mount — the same collapse the corner readout makes.
 */
function arcLink(): FooterLink {
  return { label: "The Arc", href: `#${CORRIDOR_MOUNT_ID}` };
}

const social = (icon: SocialIcon): FooterLink | null => {
  const row = SOCIALS.find((s) => s.icon === icon);
  return row ? { label: row.label, href: row.href, external: true, social: icon } : null;
};

/**
 * The authored columns, before the unpublished rows are dropped.
 *
 * ⚠ TWO SHIP TODAY, AND THE THIRD IS BLOCKED RATHER THAN MISSING. A "Practice"
 * column of the four formats would need four rows all pointing at `#services`,
 * because nothing reads a URL to open a card — four rows, one destination, four
 * lies. It returns behind a `?service=<id>` deep link, which is its own change.
 * `LEGAL` is authored below with both rows null: Privacy and Terms have no
 * routes, and a legal label that is not a link is worse than an absent one.
 */
const AUTHORED: readonly FooterColumn[] = [
  {
    heading: "Navigate",
    links: [
      arcLink(),
      station("services"),
      station("about"),
      station("voidwalker"),
      { label: "Claude workshop", href: "/claude-workshop" },
      /* The sheet pages (ADR-114). ⚠ MUSINGS IS LIT SINCE ADR-119 — the
         three posts are published (`draft: false`) and the homepage carries
         a station that racks them, so a footer row pointing at the index is
         no longer outrunning anything. The `null` it held until then is the
         contract working, not a placeholder: the row was decided and its
         destination had nothing to list. */
      { label: "Home sessions", href: "/home-sessions" },
      { label: "Musings", href: "/musings" },
    ],
  },
  {
    heading: "Connect",
    links: [
      social("linkedin") ?? { label: "LinkedIn", href: null },
      social("x") ?? { label: "X", href: null },
      { label: "Email", href: `mailto:${CONTACT_EMAIL}` },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: null },
      { label: "Terms", href: null },
    ],
  },
];

/** A row that has somewhere to go — what the renderer and the guard receive. */
export type PublishedLink = FooterLink & { href: string };
export interface PublishedColumn extends FooterColumn {
  readonly links: readonly PublishedLink[];
}

/** The columns that actually have somewhere to go. The renderer maps this. */
export function footerColumns(): readonly PublishedColumn[] {
  return AUTHORED.map((col) => ({
    ...col,
    links: col.links.filter((l): l is PublishedLink => typeof l.href === "string"),
  })).filter((col) => col.links.length > 0);
}

/** Every authored row, published or not — the guard walks this. */
export const FOOTER_COLUMNS = AUTHORED;
