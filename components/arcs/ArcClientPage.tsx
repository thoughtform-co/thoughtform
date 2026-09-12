import type { ClientDef } from "@/lib/arcs/clients";
import type { ArcDef } from "@/lib/arcs/types";

import { ArcCardGrid } from "./ArcCardGrid";
import { ArcShell } from "./ArcShell";

/**
 * ArcClientPage — one client's engagements (ADR-098).
 *
 * A client has more than one piece of work over time, and the client is
 * not recreated for each: this is the page that says what they have. It is
 * the overview's own hero band and the same card grid, filtered to one
 * client, and that is deliberate — a client page is a listing, and a
 * listing that invents a second grammar makes the reader learn one.
 *
 * ⚠ IT RENDERS AT `/arcs/<client>`, inside the SAME route as an arc. The
 * two slug sets share one namespace and are pinned disjoint by the
 * registry test, because a client slug colliding with an arc's would
 * shadow a live page with a list of links to it.
 *
 * `variant="index"` for the reason the overview uses it: no hero curtain
 * here, so `--hero-lift` is pinned to 1 and the HUD rails are uncovered
 * from the first paint.
 */
export function ArcClientPage({
  client,
  arcs,
  hudHtml,
  bodyClass,
}: {
  client: ClientDef;
  arcs: readonly ArcDef[];
  hudHtml: string;
  bodyClass: string;
}) {
  return (
    <ArcShell hudHtml={hudHtml} bodyClass={bodyClass} variant="index">
      <section className="arc-section arc-index-hero" aria-label={client.name}>
        <div className="arc-band arc-index-hero__band">
          <p className="arc-desig arc-reveal">Thoughtform · Client</p>
          <h1 className="arc-title arc-index-hero__title arc-reveal">{client.name}</h1>
          <p className="arc-index-hero__lede arc-reveal">{client.lede}</p>
          <p className="arc-cue arc-reveal" aria-hidden="true">
            {arcs.length === 1 ? "One engagement" : `${arcs.length} engagements`}
          </p>
        </div>
      </section>
      <section className="arc-section arc-index-grid" aria-label={`${client.name} engagements`}>
        <div className="arc-band">
          <ArcCardGrid arcs={arcs} />
        </div>
      </section>
    </ArcShell>
  );
}
