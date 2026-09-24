"use client";

import { CONTACT_EMAIL } from "@/lib/site/socials";
import { footerColumns } from "@/lib/site/footer-nav";

export function SiteFooter() {
  const columns = footerColumns();
  /* ⚠ HARDCODED ON PURPOSE. `new Date().getFullYear()` is a server/client
     hydration mismatch waiting to happen and would churn the visual snapshots
     every January with no owner in the loop. */
  const year = 2026;

  return (
    <div className="ft-foot" role="contentinfo">
      {/* The key visual — the station's whole ground, edge to edge (U1).
          `aria-hidden` and `loading="lazy"`: below the fold, and it says
          nothing. Its box is the station's BORDER box; the sheet's plate rule
          negates the station's own padding to get there. */}
      <div className="ft-foot__plate" aria-hidden="true">
        {/* ⚠ `<img>`, NOT `next/image`, AND FOR THE SWAP'S OWN SAKE. The theme
            pair works because a `display: none` + `loading="lazy"` image is
            never FETCHED (theme.css's own hero recipe), and that is a property
            of the raw element — an optimizer wrapper puts a component between
            this rule and the request. It is below the fold, lazy and
            dimensioned, so the LCP the lint rule protects is not in play.
            ⚠ THE SWAP CLASS IS ON THE `<img>`, NEVER THE `<picture>`: source
            selection is part of the img's own deferred fetch, so a hidden lazy
            img requests NEITHER format. The hero hides only its img for the
            same reason. And no `fetchpriority` and no `HERO_ROUTES` row — this
            is the same file the hero already preloaded, so in dark it is a
            cache hit, and a footer must never compete with the hero's LCP. */}
        {/* ⚠ No `eslint-disable` here and one on the light plate below: the
            `no-img-element` rule does not fire on an `<img>` inside a
            `<picture>`, and an unused directive is itself a lint warning. */}
        <picture>
          <source srcSet="/images/Gateway_v1b.avif" type="image/avif" />
          <img
            className="ft-foot__plate-img ft-foot__plate-img--dark"
            src="/images/Gateway_v1b.webp"
            alt=""
            width={2880}
            height={1620}
            loading="lazy"
            decoding="async"
          />
        </picture>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="ft-foot__plate-img ft-foot__plate-img--light"
          src="/images/Gateway_v2-light.webp"
          alt=""
          width={2912}
          height={1632}
          loading="lazy"
          decoding="async"
        />
        {/* Three layers, one job each: a top feather welding the plate into
            `#voidwalker`'s void above, a directional bed under the copy
            column only, and a bottom band so the legal bar and the HUD's
            fixed corners keep their contrast. Tokens, so it inverts. */}
        <div className="ft-foot__scrim" />
      </div>

      <div className="ft-foot__band">
        <div className="ft-foot__head">
          <p className="ft-foot__eyebrow">Let&rsquo;s build</p>
          {/* ⚠ A TITLE IS A NAME, NOT AN APHORISM (the copy law, ADR-078).
              "Plot your course." was exactly the shape that law bans, and the
              replacement may not be a second epigram — so this is the
              practice's own claim, which is also what the hero opens on.
              ⚠ AUTHORED IN CAPITALS, NEVER TRANSFORMED (ADR-105 U4, owner: the
              title "should be full caps"). The sans does not shout by
              `text-transform` on this site (ADR-092; the ratchet pins it), so
              the string is the caps — the services masthead's and the musings
              head's own recipe. */}
          <h2 className="ft-foot__title">
            NAVIGATE INTELLIGENCE
            <br />
            WITH YOUR TEAM.
          </h2>
          <p className="ft-foot__lede">
            Tell me what your team is trying to do with AI. I&rsquo;ll reply with a route.
          </p>
        </div>

        {/* The form's slot. Until it has a transport the ask is answered by
            the mail CTA — the page needs a correct ending either way. */}
        <div className="ft-foot__act">
          <a className="ft-foot__cta" href={`mailto:${CONTACT_EMAIL}`}>
            Start a conversation
            <span className="ft-foot__cta-arrow" aria-hidden="true" />
          </a>
          <a className="ft-foot__mail" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>

        {/* The link grid. ⚠ IT SITS UNDER THE ASK RATHER THAN BESIDE IT, AND
            THAT IS MEASURED, NOT PREFERRED (ADR-105 U2). `Gateway_v1b`'s ring
            occupies y 0.23-0.67 and u 0.57-0.96 of the station, so there is no
            quiet upper region to seat a wide band in and the band must clear
            the ring HORIZONTALLY — which leaves ~680px at 1920x1247, enough
            for the ask OR a column row beside it, not both. U1's own principle:
            the layout yields, the picture stays whole.
            ⚠ The track is count-agnostic (`grid-auto-flow: column`), so the
            third column costs one data entry the day its destinations exist —
            no rung, no JS-fed count. */}
        {columns.length > 0 ? (
          <nav className="ft-foot__nav" aria-label="Site">
            {columns.map((col) => (
              <div className="ft-foot__col" key={col.heading}>
                <h3 className="ft-foot__col-head">{col.heading}</h3>
                <ul className="ft-foot__col-list">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        className="ft-foot__link"
                        href={link.href}
                        {...(link.social ? { "data-social": link.social } : null)}
                        {...(link.external
                          ? { target: "_blank", rel: "noreferrer noopener" }
                          : null)}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        ) : null}
      </div>

      <div className="ft-foot__bar">
        <p className="ft-foot__mark">
          <span className="ft-foot__diamond" aria-hidden="true" />
          Thoughtform · {year}
        </p>
        {/* ⚠ THE SOCIAL ICON ROW IS DELETED (ADR-105 U2). LinkedIn and X are
            NAMED ROWS in the Connect column now, and the same two channels as
            icons in the bar is the same thing said twice on one screen — which
            is what this surface has removed a console head, a foot and a
            designator for. `lib/site/socials.ts` keeps its `href: null`
            contract; the Connect column is what reads it, and an unpublished
            channel is still ABSENT rather than dead.
            The right side of the bar is where Privacy / Terms will sit once
            those routes exist; until then it is deliberately empty rather than
            filled with labels that do not link. */}
      </div>
    </div>
  );
}
