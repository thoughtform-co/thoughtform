/**
 * lib/arcs — client arc pages (ADR-052).
 *
 * An "arc page" is a client-specific landing page under `/arcs/[slug]` —
 * a ported presentation deck rendered in the landing's HUD grammar. This
 * is DISTINCT from "the Arc" (the Navigate → Encode → Build loop on the
 * corridor, LANGUAGE.md) — never shorten "arc page" to "the Arc".
 *
 * Content is data: each arc is one `ArcDef` whose sections are a small
 * discriminated union of static primitives. Rendering lives in
 * `components/arcs/*` server components. This module must stay free of
 * runtime imports (no react, no three, no supabase) — types only.
 */

/**
 * Split title with the upright-gold emphasis pivot. The site rule is no
 * italics anywhere — `em` renders `font-style: normal; color: var(--gold)`
 * (the corridor station-header recipe, home-v2.css).
 */
export interface ArcTitle {
  pre?: string;
  em?: string;
  post?: string;
}

export interface ArcImage {
  src: string;
  alt: string;
}

export interface ArcMetaRow {
  label: string;
  value: string;
}

/**
 * Shared section head — the services-masthead grammar rebuilt in flow:
 * designation label + station-voice title on the left, state chip + intro
 * copy on the right, survey crosses claiming the diagonal.
 */
export interface ArcHead {
  /** PT Mono designation label above the title, e.g. "ARC / SETTINGS · 05". */
  eyebrow?: string;
  title: ArcTitle;
  /** Right-column intro copy (editorial body register, `--band-copy`). */
  sub?: string;
  /** Right-column state chip (gold), e.g. "Open". */
  state?: string;
}

export interface ArcCardItem {
  id: string;
  /** Mono counter, e.g. "01". */
  n?: string;
  /** Mono gold kicker above the title, e.g. "Stripe · January 2026". */
  kicker?: string;
  title: string;
  body: string;
  image?: ArcImage;
  /** Mono label/value rows (e.g. SKU / Spend / ROAS on proof cards). */
  metaRows?: readonly ArcMetaRow[];
  /** Per-card mono receipt line (gold diamond prefix). */
  receipt?: string;
  /** Mono byline under the body, e.g. "Bloomberg · Enterprise track". */
  byline?: string;
  /** Optional outbound link — renders the title as an anchor. */
  href?: string;
}

export interface ArcTip {
  id: string;
  /** Mono chip, e.g. "TIP · MEMORY". */
  tag: string;
  body: string;
}

export interface ArcListItem {
  id: string;
  /** Small mono status chip before the name, e.g. "LIVE". */
  tag?: string;
  name: string;
  body?: string;
  href?: string;
  /** Trailing mono meta, e.g. a count or status label. */
  meta?: string;
}

export interface ArcListGroup {
  id: string;
  label: string;
  blurb?: string;
  items: readonly ArcListItem[];
}

export interface ArcAnatomyRow {
  id: string;
  label: string;
  body: string;
}

export interface ArcAction {
  id: string;
  label: string;
  href: string;
  primary?: boolean;
}

interface ArcSectionBase {
  /** DOM id — anchor target + ArcMenu key. Unique within the arc. */
  id: string;
  ariaLabel?: string;
  /** Present ⇒ the section appears in the header's drawer under this label,
   *  and its name is what the corner readout decodes to while it is on
   *  screen (ADR-073). */
  menuLabel?: string;
  /**
   * A CHAPTER: the section also takes a link in the header's inline row,
   * the state the hero shows before the readout collapses in (ADR-073).
   *
   * The drawer takes every `menuLabel`; a deck runs to ten of them and ten
   * inline links do not fit a hero, so the row is the spine of the argument
   * and the drawer is the index. Registry-capped at five — past that the
   * row wraps into the hero copy at the binding viewport.
   */
  menuPrimary?: true;
}

export type ArcSection = ArcSectionBase &
  (
    | {
        /** Standalone masthead band (a chapter head with no body). */
        kind: "head";
        head: ArcHead;
      }
    | {
        /** Numbered card grid + optional tips strip and receipt lines. */
        kind: "cards";
        head: ArcHead;
        cards: readonly ArcCardItem[];
        tips?: readonly ArcTip[];
        receipt?: string;
        footnote?: string;
        columns?: 2 | 3 | 4;
      }
    | {
        /** Grouped lists — status stacks (LIVE / IN PROGRESS / …) or column maps. */
        kind: "list-groups";
        head: ArcHead;
        layout: "stack" | "columns";
        groups: readonly ArcListGroup[];
        closing?: string;
      }
    | {
        /** Labelled rows — skill anatomy, invariants, freedom bands. */
        kind: "anatomy";
        head: ArcHead;
        /** Gold chip badge above the head, e.g. "Claude · Skill". */
        badge?: string;
        rows: readonly ArcAnatomyRow[];
      }
    | {
        /** Full-bleed display line — chapter question, callout, or quote. */
        kind: "interstitial";
        variant: "question" | "callout" | "quote";
        eyebrow?: string;
        line: ArcTitle;
        subline?: string;
        /** Quote variant only — the mono attribution line. */
        attribution?: string;
      }
    | {
        /** Framed video or image figure with a two-column head. */
        kind: "media";
        head: ArcHead;
        media: {
          type: "video" | "image";
          src: string;
          /** Required for video (preload="none" shows only the poster). */
          poster?: string;
          alt?: string;
        };
        caption: {
          label: string;
          role?: string;
          meta?: string;
          sourceLabel: string;
          sourceHref?: string;
        };
      }
    | {
        /** Portrait + bio + meta rows (the About Vince read). */
        kind: "portrait";
        head: ArcHead;
        image: ArcImage;
        bio: readonly string[];
        meta: readonly ArcMetaRow[];
      }
    | {
        /** Closing CTA band — doubles as the page footer. */
        kind: "close";
        head: ArcHead;
        actions: readonly ArcAction[];
        footerLine?: string;
        signature?: string;
      }
    | {
        /**
         * One production tool, drawn from its canonical record (ADR-072):
         * the record column beside the casefile's own console — the
         * authored wireframe, the fused "Watch walkthrough" bar that opens
         * the lightbox, the four capability blocks — at page scale. ONE
         * tool per section, one beat each.
         */
        kind: "dossier";
        /**
         * A `PROJECT_CASES` id. A plain string here — this module stays
         * free of runtime imports — resolved by the renderer and pinned by
         * `tests/lib/arcs-registry.test.ts`.
         */
        toolId: string;
        /**
         * The mode's definition, lettered after the mode chip. It is the
         * shared sentence for the tool's mode (`MODE_LEGEND`,
         * `content/shared/loop-tools.ts`), pinned equal by the registry
         * test — the template says the same thing everywhere.
         */
        legend: string;
        /**
         * Masthead override. Absent ⇒ derived from the record (codename ·
         * tagline eyebrow, the em-segmented title), which is the one
         * source the page shares with the landing. Never authors `sub` —
         * the record column is the intro, and a split head would wedge it
         * into the narrow column (pinned).
         */
        head?: ArcHead;
      }
    | {
        /**
         * The intelligence architecture, at page scale (ADR-076): the
         * landing casefile's own three-reading console — THE WORK · THE
         * CONFIGURATION · THE SUBSTRATE — mounted in a section of its own.
         *
         * It carries NO data. The record is `LOOP_INTELLIGENCE_MAP`
         * (`lib/cases/content/loop-earplugs.ts`), resolved by the renderer
         * and shared BY REFERENCE with the casefile row, exactly as the
         * `dossier` kind resolves `PROJECT_CASES`. A content module that
         * re-typed the 47 Skills would be publishing a second portfolio.
         */
        kind: "intelligence";
        head: ArcHead;
      }
    | {
        /**
         * The studio's three sheets, at page scale (ADR-078): the output,
         * the rule and the limit — THE ADS · THE LINE · THE RED LINE — on
         * the casefile's own `SheetsPlate`.
         *
         * Same contract as `intelligence`, one directory row across: it
         * carries NO data. The record is `LOOP_STUDIO_SHEETS`, shared by
         * reference with the casefile row, so the studio's imagery policy
         * cannot say one thing on the landing and another on a page a
         * reader forwards. It REPLACED three ad cards, which showed only
         * what the studio shipped; half the engagement was deciding what
         * AI may make, and that half is what a stranger has to trust.
         */
        kind: "sheets";
        head: ArcHead;
      }
    | {
        /**
         * The above-the-line reel, at page scale (ADR-078): both films on
         * the casefile's own `FilmsPlate` — poster-first, the `<video>`
         * mounted only on a click, playing in the shared lightbox.
         *
         * The record is `LOOP_ATL_FILMS`, by reference. It replaced a
         * single-film `media` beat that was invisible to the navigation,
         * and the page gains the second film for free: a reel is the one
         * shape where "there is another one" is itself the claim.
         */
        kind: "films";
        head: ArcHead;
      }
    | {
        /**
         * The thesis, drawn (ADR-078): adoption and automation as ONE
         * mechanism — a ratchet between two strands, the canon figures as
         * its registers, and the career route as its course strip.
         *
         * ⚠ IT CARRIES NO FIGURES. The registers are `LOOP_FIGURES`, read
         * by the renderer, for the same reason a `dossier` carries only a
         * `toolId`: a hand-typed count is the one that goes stale, and the
         * canon is parity-pinned to the casefile in one place.
         */
        kind: "flywheel";
        head: ArcHead;
        /**
         * The course strip — this page's own chart. Each waypoint is a
         * section `id` on THIS arc (registry-pinned to resolve), so the
         * route doubles as the table of contents; exactly one carries
         * `seat`, the terminus the mechanism converges into.
         */
        route: readonly {
          id: string;
          label: string;
          /** Mono sub-caption under the waypoint, e.g. a year or a set. */
          sub?: string;
          /** A section id on this arc. */
          target?: string;
          /** The terminus — the drawing's ONE gold object. Exactly one. */
          seat?: true;
        }[];
        footnote?: string;
      }
  );

export type ArcSectionKind = ArcSection["kind"];

/** The section narrowed to one kind — component prop types. */
export type ArcSectionOf<K extends ArcSectionKind> = Extract<ArcSection, { kind: K }>;

/** Overview chip text. `portfolio` is ADR-072's one arc so far. */
export type ArcFormat = "workshop" | "keynote" | "portfolio";

/**
 * Section choreography system (ADR-057). Absent or "reveal" is the
 * ADR-052 one-shot IO reveal — those pages stay byte-identical, the flag
 * being unset is what guarantees it. "terminal" is the pinned-beat
 * grammar: sections pin, mastheads decode in place, panels power on, and
 * the plane folds LIFO behind an iris before the beat unpins.
 */
export type ArcMotion = "reveal" | "terminal";

export interface ArcDef {
  /** Route segment — kebab-case, unique across the registry. */
  slug: string;
  /** Overview card chip text (WORKSHOP / KEYNOTE). */
  format: ArcFormat;
  /** Choreography system — see ArcMotion. Default "reveal". */
  motion?: ArcMotion;
  /**
   * Overview chip override. Defaults to `format`; set it when two arcs
   * share a format and would otherwise show identical chips.
   */
  cardChip?: string;
  /** Overview card copy. */
  cardTitle: string;
  cardLede: string;
  cardImage: ArcImage;
  /** Detail-page hero (landing hero recipe, parallax photo background). */
  hero: {
    /** PT Mono designation above the headline, e.g. "THOUGHTFORM · CLAUDE WORKSHOP". */
    eyebrow?: string;
    title: ArcTitle;
    lede: string;
    actions?: readonly ArcAction[];
    image: ArcImage & { width: number; height: number };
    /**
     * `"gateway"` ⇒ this hero IS the landing's (ADR-075): the Gateway
     * plate, delivered the landing's way — an AVIF `<source>` over the
     * WebP `<img>` in dark, and `theme.css`'s own light rule painting
     * `Gateway_v2-light.webp` as a background with the `<img>` hidden.
     *
     * Absent ⇒ the arc's own `image` in BOTH themes. That needs saying
     * because the light rule is global on `.hero__bg`: until ADR-075 an
     * arc showed its own plate in dark and the GATEWAY in light, with
     * nothing declaring it. `ArcHero` marks those heroes `data-plate="own"`
     * and `arcs.css` hands the image back.
     */
    plate?: "gateway";
  };
  /** Route metadata (robots noindex is applied by the route, not here). */
  meta: { title: string; description: string };
  sections: readonly ArcSection[];
}
