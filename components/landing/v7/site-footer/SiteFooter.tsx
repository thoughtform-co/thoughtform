"use client";

import { CONTACT_EMAIL, publishedSocials, type SocialIcon } from "@/lib/site/socials";

/**
 * SiteFooter — the page's ending (ADR-105).
 *
 * Owner, 2026-09-15: _"once you slide out of the era section, we should have
 * maybe a super simple slick contact form. I don't think we need 'Plot Your
 * Course' or the current footer. Maybe we can use one of our key visuals for
 * the footer — that way it's nicely aligned with our hero section … I would
 * put the contact form there as well, along with some links to my socials.
 * That way we can combine the contact form and the bold footer."_
 *
 * ONE section, not two: the key visual, the ask, the form and the socials.
 * Composition is the Zellic reference he gave me — the plate IS the station's
 * ground, the copy sits ON it in its quiet zone, and the legal bar rides its
 * darkest strip at the floor.
 *
 * ⚠ **IT IS THE CORRIDOR'S OPAQUE COVER.** `#voidwalker` is a pinned
 * TRANSPARENT stage in hologram mode, so the WebGL ambient runs until the
 * next opaque station covers it — a role `#practice` held as an empty
 * breather until this replaced it. Two consequences that are not style:
 * the station keeps its own opaque `var(--void)` ground with the plate as an
 * absolutely-inset layer INSIDE it (a transparent station, or one whose only
 * ground is the image, fails the handoff guard's `alpha === 1`), and the
 * markup stays inside `<main class="stations">` so `home-v2.css`'s `~`
 * sibling selector can still reach it.
 *
 * ⚠ **NO `data-m` ANYWHERE.** `useRevealMotion` collects its targets once at
 * LandingPage mount; this is a nested root, so its nodes are never observed
 * and a `data-m` here would rest at opacity 0 forever with nothing to say so.
 *
 * ⚠ **U1 — THE PLATE IS THE STATION'S WHOLE GROUND, AND BOTH PLATES ARE THE
 * HERO'S.** The first cut anchored a 46svh strip to the floor and washed half
 * of it out; the owner's read was that it "looks really bad, especially in
 * dark mode — the visual needs to be as full bleed as possible". Two things
 * were doing it: the strip, and `Key Visual 14d`, which is parchment ABOVE and
 * void BELOW and therefore could only ever be shown cropped to its bottom
 * half. Dark takes `Gateway_v1b` now — the hero's own plate, already fetched,
 * ring right-of-centre over deep void with its trail running out to the left
 * where the copy sits — and light keeps `Gateway_v2-light`, which is the hero's
 * too. So the page opens and closes on the same pair in BOTH themes, which is
 * the closest reading of "aligned with our hero section".
 *
 * ⚠ **AND THE THEME EXCEPTION STOPPED EXISTING WITH IT.** A kept-dark plate
 * needed two values pinned against ADR-058's swap — cream ink for the bar on
 * it, a dark wash under that ink — and getting one right silently inverted the
 * other. With the hero's pair, the bar's ink IS the page's ink and the scrim IS
 * the page's ground, both plain tokens, and theme.css carries no block for this
 * sheet at all.
 *
 * ⚠ **`display: none` + `loading="lazy"` IS WHAT KEEPS EACH THEME FROM
 * FETCHING THE OTHER'S PLATE** — the hero's own recipe in theme.css, and the
 * reason the swap is two elements rather than a `src` the theme store
 * rewrites. No `HERO_ROUTES` row either: a footer is below the fold and must
 * never compete with the hero's LCP — and since U1 both plates are files the
 * hero has already requested, so in either theme this is a cache hit.
 *
 * The form arrives in the next pass (it needs a transport). Until then the ask
 * is answered by the mail CTA, so the page has a correct ending either way.
 */
function Icon({ name }: { name: SocialIcon }) {
  switch (name) {
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8h4.56v14H.22V8zm7.6 0h4.37v1.92h.06c.61-1.15 2.1-2.37 4.32-2.37 4.62 0 5.47 3.04 5.47 7v7.45h-4.56v-6.6c0-1.58-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.5V22H7.82V8z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.88l-5.4-7.04L4.5 22H1.24l8.02-9.16L1 2h7.04l4.88 6.43L18.244 2zm-2.41 18h1.86L7.25 4H5.25l10.58 16z" />
        </svg>
      );
    case "instagram":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 3.9 12 3.9 12 3.9s-7.5 0-9.4.5A3 3 0 0 0 .5 6.5C0 8.4 0 12 0 12s0 3.6.5 5.5a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.5.5-5.5s0-3.6-.5-5.5zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
        </svg>
      );
    case "email":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="2.5" y="4.5" width="19" height="15" />
          <path d="M2.5 6.5 12 13l9.5-6.5" />
        </svg>
      );
  }
}

export function SiteFooter() {
  const socials = publishedSocials();
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
          <p className="ft-foot__eyebrow">Contact</p>
          {/* ⚠ A TITLE IS A NAME, NOT AN APHORISM (the copy law, ADR-078).
              "Plot your course." was exactly the shape that law bans, and the
              replacement may not be a second epigram — so this is the
              practice's own claim, which is also what the hero opens on. */}
          <h2 className="ft-foot__title">
            Navigate intelligence
            <br />
            with your team.
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
      </div>

      <div className="ft-foot__bar">
        <p className="ft-foot__mark">
          <span className="ft-foot__diamond" aria-hidden="true" />
          Thoughtform · {year}
        </p>
        {/* ⚠ RENDERED ONLY WHEN A CHANNEL HAS SOMEWHERE TO GO. Every social on
            this site was `href="#"` before ADR-105; `lib/site/socials.ts`
            holds the four channels and a guard fails on a `"#"`, so an
            unpublished one is ABSENT rather than dead. */}
        {socials.length > 0 ? (
          <ul className="ft-foot__socials">
            {socials.map((s) => (
              <li key={s.icon}>
                <a href={s.href} aria-label={s.label} target="_blank" rel="noreferrer noopener">
                  <Icon name={s.icon} />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
