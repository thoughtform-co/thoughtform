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
 * Composition is the Zellic reference he gave me — copy above, the plate
 * bleeding up from the floor, the legal bar sitting on its darkest part.
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
 * ⚠ **THE PLATE IS PER THEME, AND ONE KEPT-DARK IMAGE WAS TRIED FIRST.**
 * `Key Visual 14d` is parchment above and void below, and bleeding its VOID
 * half up is right in dark. In light it put a dark slab under the parchment
 * page — bold, and it cost the FRAME two readings: the right rail's `LOCAL`
 * label and the bottom-left brandmark are dark ink in light, they are FIXED at
 * z 60, and they print over whatever is beneath them (ADR-043). On the still
 * `LOCAL` was gone and only its gold value survived. So light takes the hero's
 * own light plate instead, which is also the closest reading of "aligned with
 * our hero section": the page opens and closes on the same pair.
 *
 * ⚠ **`display: none` + `loading="lazy"` IS WHAT KEEPS EACH THEME FROM
 * FETCHING THE OTHER'S PLATE** — theme.css:950-968's recipe, and the reason
 * the swap is two `<img>` rather than a `src` the theme store rewrites. No
 * `HERO_ROUTES` row either: a footer is below the fold and must never compete
 * with the hero's LCP.
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
      {/* The key visual, bleeding up from the floor. `aria-hidden` and
          `loading="lazy"`: it is below the fold and it says nothing. */}
      <div className="ft-foot__plate" aria-hidden="true">
        {/* ⚠ `<img>`, NOT `next/image`, AND FOR THE SWAP'S OWN SAKE. The theme
            pair works because a `display: none` + `loading="lazy"` image is
            never FETCHED (theme.css:950-968), and that is a property of the
            raw element — an optimizer wrapper puts a component between this
            rule and the request. It is below the fold, lazy and dimensioned,
            so the LCP the lint rule protects is not in play. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="ft-foot__plate-img ft-foot__plate-img--dark"
          src="/images/Thoughtform_Key%20Visual_14d.webp"
          alt=""
          width={2560}
          height={1440}
          loading="lazy"
          decoding="async"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="ft-foot__plate-img ft-foot__plate-img--light"
          src="/images/Gateway_v2-light.webp"
          alt=""
          width={2880}
          height={1620}
          loading="lazy"
          decoding="async"
        />
        {/* Feathers the plate into the station's own ground at the top, and
            darkens its foot so the legal bar and the HUD's bottom corners
            keep their contrast. Re-derived per theme in the sheet. */}
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
