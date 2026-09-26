import { SiteFooter } from "@/components/landing/v7/site-footer/SiteFooter";

/**
 * The close (ADR-114): the site's own footer (ADR-105), seated as the last
 * section. `SiteFooter` reads two padding tokens off its station and its
 * plate negates them to reach the viewport's edge; `.sh-sec--close` declares
 * that pair, so the page ends on the plate's last pixel exactly as the
 * landing does. Mounted directly — `SiteFooterPortal` exists for the parsed
 * prototype body, which this page does not have.
 *
 * ⚠ THE FOOTER'S OWN SHEET IS THE ROUTE'S TO LOAD. `site-footer.css` is a
 * route-level import like every sheet in this house, and a page that mounts
 * this component without it renders the footer's bare markup (ADR-127: every
 * sheet route did, for two weeks, with every gate excluding the close). The
 * five routes import it after `sheet.css`; `sheet-close.test.ts` pins that.
 * On a flowing page the close is also welded up over the body and the body
 * drifts under it (`SheetRenderer`'s `rise`, sheet.css §14b).
 */
export function SheetClose({ id }: { id: string }) {
  return (
    <section
      id={id}
      className="sh-sec sh-sec--close"
      data-sh-arrangement="close"
      aria-label="Contact"
    >
      <SiteFooter />
    </section>
  );
}
