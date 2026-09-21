/**
 * The offer's record MOVED to `lib/arcs/content/trinny-london-offer.ts`
 * (ADR-118 U2): the `/arcs` overview draws Trinny London's configuration from
 * the same board and phases this page renders, and a `lib/` module may not
 * reach into `app/` for it. This path stays so the page's two leaves and the
 * three suites that import it are untouched — one record, two import paths.
 */
export * from "@/lib/arcs/content/trinny-london-offer";
