import type { Metadata } from "next";

import {
  ProofCard,
  type ProofRailSeat,
} from "@/components/landing/home-v2/services/proof-stack/ProofCard";
import {
  proofStackClient,
  proofStackTracks,
} from "@/components/landing/home-v2/services/proof-stack/proofOrder";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/services/proof-stack/proof-stack.css";
import "@/components/landing/v7/theme.css";

import "./proof-card-head-lab.css";

/**
 * The head-rail lab — where the proof card's tabs should live.
 *
 * Owner, 2026-09-12: "try to integrate the tabs into the top part where we
 * have the client name … before you implement it show me a screenshot from
 * a test page on how a proof card would look like."
 *
 * ⚠ IT DRAWS THE REAL CARD, not a mock of one. `ProofCard` gained one
 * optional prop (`railSeat`, defaulting to the shipped `"field"`), so every
 * production call renders byte-identically and this page is the only caller
 * passing anything else. A lab that redraws its subject answers a question
 * about the redrawing.
 *
 * The three directions, left to right down the page:
 *
 *   field  the shipped grammar (ADR-094 U2) — the rail on the right panel's
 *          own top edge. Here as the thing to compare against, not as an
 *          option; it is what is live.
 *   panel  the stations up in the band, in the FIELD'S OWN COLUMN, boxed.
 *   flat   the same seat, no box — labels, the lit one in gold.
 *
 * The cards are STATIC here — the stack's sticky pile and its arrival
 * channels are a scroll mechanic and have nothing to say about where a rail
 * belongs. Each frame is one card at the height a pinned card actually gets.
 */
export const metadata: Metadata = {
  title: "Proof card · head rail — lab",
  robots: { index: false, follow: false },
};

const DIRECTIONS: readonly { seat: ProofRailSeat; name: string; note: string }[] = [
  {
    seat: "field",
    name: "field · shipped",
    note: "ADR-094 U2. The rail is the right panel's own top edge; the band is the client and the ordinal.",
  },
  {
    seat: "panel",
    name: "panel · boxes, the field's column",
    note: "The shipped station boxes, spanning the field's column exactly and inset on the bay's own verticals. They cannot reach the record: the band is the body's grid now.",
  },
  {
    seat: "flat",
    name: "flat · labels, from the bay's left edge",
    note: "No box. The band is chrome, and a bordered box in it is a control bolted onto a label. The lit station is the one gold thing and its diamond is the marker.",
  },
];

export default function ProofCardHeadLab() {
  const tracks = proofStackTracks();
  const client = proofStackClient();
  /* The films card: two stations, the shortest labels, and a bay whose
     content is a frame rather than a drawing — the clearest read of where a
     rail sits. The tools card is drawn underneath at the winning treatment
     only, because four stations is the width case. */
  const films = tracks[0];
  const tools = tracks[1];

  return (
    <main className="pchl" data-theme="dark">
      <header className="pchl__head">
        <p className="pchl__desig">Lab · proof card · the rail&rsquo;s seat</p>
        <h1 className="pchl__title">Where do the tabs live?</h1>
        <p className="pchl__lede">
          The real card, three ways. Nothing here is shipped: the component takes one optional prop
          and production does not pass it.
        </p>
      </header>

      {DIRECTIONS.map((d) => (
        <section className="pchl__row" key={d.seat} aria-label={d.name}>
          <div className="pchl__label">
            <p className="pchl__name">{d.name}</p>
            <p className="pchl__note">{d.note}</p>
          </div>
          <div className="pf-stack pchl__frame">
            <ProofCard track={films} client={client} railSeat={d.seat} />
          </div>
        </section>
      ))}

      <section className="pchl__row" aria-label="four stations, in the band">
        <div className="pchl__label">
          <p className="pchl__name">the width case · four stations</p>
          <p className="pchl__note">
            The tools card at <code>panel</code>. Four handles is the width case: the longest is{" "}
            <code>BRIEFING AGENT</code>, which already truncates at 2vw of inset on the
            field&rsquo;s own row.
          </p>
        </div>
        <div className="pf-stack pchl__frame">
          <ProofCard track={tools} client={client} railSeat="panel" />
        </div>
      </section>
    </main>
  );
}
