import Link from "next/link";

import { CLIENTS, kindOf } from "@/lib/arcs/clients";
import { arcsOf, houseArcs } from "@/lib/arcs/registry";
import type { ArcDef } from "@/lib/arcs/types";

import { ArcCardGrid } from "./ArcCardGrid";

/**
 * ArcClientGroups — the overview, grouped by who the work was for
 * (ADR-098).
 *
 * One band per client, in `CLIENTS` order, then a Thoughtform band for the
 * formats that belong to no client. Inside a band the engagements run in
 * registry order, newest first.
 *
 * The head is ADR-089 U1's: the client's NAME alone on a band, and the
 * line is what the name is underlined into. A count sits at the far end
 * because a reader scanning for "what else did they do" is counting.
 *
 * ⚠ EVERY GROUP PUBLISHES THE KINDS IT HOLDS, server-side, so the filter
 * is two CSS rules rather than a `:has()` or a client-side list. The group
 * already knows what is in it; asking the browser to derive that again is
 * work for an answer we have.
 */
function kindsOf(arcs: readonly ArcDef[]): string {
  return Array.from(new Set(arcs.map(kindOf))).join(" ");
}

function ArcClientBand({
  id,
  name,
  lede,
  arcs,
  href,
}: {
  id: string;
  name: string;
  lede: string;
  arcs: readonly ArcDef[];
  href?: string;
}) {
  if (arcs.length === 0) return null;
  return (
    <section className="arc-client" data-kinds={kindsOf(arcs)} aria-label={name}>
      <header className="arc-client__head arc-reveal">
        <h2 className="arc-client__name">{href ? <Link href={href}>{name}</Link> : name}</h2>
        <span className="arc-client__count" aria-hidden="true">
          {String(arcs.length).padStart(2, "0")}
        </span>
      </header>
      <p className="arc-client__lede arc-reveal" id={`${id}-lede`}>
        {lede}
      </p>
      <ArcCardGrid arcs={arcs} />
    </section>
  );
}

export function ArcClientGroups() {
  const house = houseArcs();
  return (
    <div className="arc-clients">
      {CLIENTS.map((client) => (
        <ArcClientBand
          key={client.slug}
          id={client.slug}
          name={client.name}
          lede={client.lede}
          href={`/arcs/${client.slug}`}
          arcs={arcsOf(client.slug)}
        />
      ))}
      {/* The house band has no client page to link to: a format is not an
          engagement, and there is nothing behind the name but the cards
          already under it. */}
      <ArcClientBand
        id="thoughtform"
        name="Thoughtform"
        lede="The formats the practice runs: a keynote that installs the frame, a workshop that builds a configuration with a team in a day."
        arcs={house}
      />
    </div>
  );
}
