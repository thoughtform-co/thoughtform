import { SiteFooter } from "@/components/landing/v7/site-footer/SiteFooter";
import type { SessionsPageModel } from "@/lib/sessions/page";

/**
 * 04 · Reserve, then the site's footer (ADR-150). The ask as one housing —
 * the lattice frame with its lit lip and washed band, the configuration
 * card's material — holding the display line, the next morning in words,
 * the one filled button and the address. Then `SiteFooter`, as every page
 * ends (ADR-127), in a close station that declares the padding pair its
 * plate negates.
 */
export function SessionsReserve({ reserve }: { reserve: SessionsPageModel["reserve"] }) {
  return (
    <>
      <section
        className="hs-sec hs-reserve"
        id="reserve"
        aria-labelledby="hs-reserve-title"
        data-hs-section="reserve"
      >
        <div className="hs-band">
          <div className="lat-frame hs-ask hs-reveal" data-cut="tr" data-line="lip-lit">
            <div className="lat-frame__head hs-ask__head" data-head="wash">
              <span>04 · {reserve.kicker}</span>
              <span>{reserve.date}</span>
            </div>
            <div className="hs-ask__body">
              <div className="hs-ask__copy">
                <h2 className="hs-ask__title" id="hs-reserve-title">
                  {reserve.title}
                </h2>
                <p className="hs-ask__sub">{reserve.sub}</p>
              </div>
              <div className="hs-ask__act">
                <a
                  className="lat-frame hs-cta"
                  data-cut="tr"
                  data-ch="seed"
                  data-line="lip-lit"
                  href={reserve.href}
                >
                  {reserve.label}
                  <span aria-hidden="true">→</span>
                </a>
                <a className="hs-ask__mail" href={`mailto:${reserve.email}`}>
                  {reserve.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="contact" className="hs-close" aria-label="Contact" data-hs-section="contact">
        <SiteFooter />
      </section>
    </>
  );
}
