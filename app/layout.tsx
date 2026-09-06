import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { THEME_TOGGLE, THEME_STORAGE_KEY } from "@/components/landing/v7/themeToggle";
import { heroPreloadScript } from "@/lib/theme/heroPreload";

// Google Fonts
/**
 * ⚠ **IBM PLEX SANS HAS EXACTLY ONE CONSUMER: THE MAP'S HUB** (owner,
 * 2026-08-29 — ADR-085 U2). It had been loaded on every route since the
 * retired design system and referenced by NO rule anywhere; the substrate
 * carrier's centre readouts now letter in it, so the download finally buys
 * something. Weights are the hub's own two — 400 for the brief and the
 * sentences, **700 for the pinned titles**, which had been asking for a
 * weight this instance did not load (a synthesised bold, and every advance
 * measured off it would have been a fiction).
 */
const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  /* ADR-092: 500 is the site's weight ceiling. The hub's pinned titles moved
     700 → 500, so the instance loads what they ask for — a weight not loaded is
     synthesised, and every advance measured off it is a fiction (the lesson the
     comment above records for the 700 it replaces). */
  weight: ["400", "500"],
  variable: "--font-ibm-plex",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

// Local Fonts
const ppMondwest = localFont({
  src: "../public/fonts/ppmondwest-regular.otf",
  variable: "--font-mondwest",
  display: "swap",
  weight: "400",
});

// Viewport config for iOS safe-area support
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover", // Enables env(safe-area-inset-*) CSS functions
};

// The share card is a 1200×630 centre crop of the dark Gateway plate
// (public/images/Gateway_v1b.webp → sharp, jpeg q82, 57 KB). Regenerate it
// from the plate if the hero art ever changes — a share of this URL is the
// first pixel most people see of the site.
const OG_IMAGE = {
  url: "/images/og/thoughtform-og.jpg",
  width: 1200,
  height: 630,
  alt: "Thoughtform — the Gateway remnant structure",
};

export const metadata: Metadata = {
  // metadataBase is what lets every relative OG/canonical URL below resolve
  // to the production origin (and silences Next's build warning). The
  // canonical host is the apex — Vercel's domain config redirects www.
  metadataBase: new URL("https://thoughtform.co"),
  title: "Thoughtform — Navigate Intelligence",
  description:
    "Thoughtform pioneers intuitive human-AI collaboration. We teach teams how to navigate AI for creative and strategic work.",
  keywords: [
    "AI intuition",
    "human-AI collaboration",
    "AI adoption",
    "creative AI",
    "strategic AI",
    "AI workshops",
    "AI keynotes",
    "navigate intelligence",
    "latent space",
  ],
  authors: [{ name: "Vince Buyssens" }],
  // "./" resolves per-page (not to "/"), so every route self-canonicalizes;
  // noindexed routes (/arcs/*) keep their own robots metadata untouched.
  alternates: { canonical: "./" },
  openGraph: {
    title: "Thoughtform — Navigate Intelligence",
    description:
      "Navigate the alien terrain of machine intelligence. Thoughtform pioneers intuitive human-AI collaboration.",
    type: "website",
    locale: "en_US",
    siteName: "Thoughtform",
    url: "/",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thoughtform — Navigate Intelligence",
    description:
      "Navigate the alien terrain of machine intelligence. Thoughtform pioneers intuitive human-AI collaboration.",
    images: [OG_IMAGE.url],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${ibmPlex.variable} ${ibmPlexMono.variable} ${ppMondwest.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Hero-reveal flag (ADR-039, PROTOTYPE — OFF by default). When
            active, first-viewport `[data-m]` elements reveal via a CSS
            on-load animation instead of waiting for the post-hydration
            JS reveal — collapsing mobile LCP (hero paragraph) toward FCP.
            Set before <body> paints so the CSS applies on first paint.
            Toggle per-URL with `?heroReveal=css` (or `=off`); the
            NEXT_PUBLIC_HERO_CSS_REVEAL env var sets the no-param default.
            Never affects production until Vince signs off and it becomes
            the default. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var q=new URLSearchParams(location.search).get("heroReveal");var on=q?q==="css":${
              process.env.NEXT_PUBLIC_HERO_CSS_REVEAL === "1" ? "true" : "false"
            };if(on)document.documentElement.setAttribute("data-hero-css-reveal","1");}catch(e){}})();`,
          }}
        />
        {/* Light-mode bootstrap (ADR-058). Reads `?theme=light|dark`
            first (QA/Playwright override, never persisted), then
            `localStorage["tf-theme"]`; defaults to DARK. Sets the
            attribute BEFORE <body> paints, so the light cascade applies
            on first paint and there is no flash of the dark theme on a
            light-mode reload. The attribute is only ever "light" or
            absent — dark is the unqualified :root default. Only the
            marketing + arcs routes import `theme.css`, so on admin/test
            routes the attribute is inert. */}
        {THEME_TOGGLE && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var q=new URLSearchParams(location.search).get("theme");var s=null;try{s=localStorage.getItem(${JSON.stringify(
                THEME_STORAGE_KEY
              )})}catch(e){}var t=(q==="light"||q==="dark")?q:((s==="light"||s==="dark")?s:"dark");if(t==="light")document.documentElement.setAttribute("data-theme","light");}catch(e){}})();`,
            }}
          />
        )}
        {/* Hero key visual preload, chosen by theme (ADR-058 Update 2).
            There are two plates now — a dark AVIF and a light WebP — and a
            STATIC link would always fetch the dark one, because the preload
            scanner runs before any script. So this reads the attribute the
            bootstrap above just stamped and injects the matching link.
            Deliberately OUTSIDE the THEME_TOGGLE gate: flipping that flag
            off is ADR-058's rollback, which should fall back to the dark
            plate — not lose the hero preload entirely. */}
        <script dangerouslySetInnerHTML={{ __html: heroPreloadScript() }} />
        {/* Brand faces the canvas bakes depend on (ServicesCardRing +
            caseCardBake draw with PT Mono / PP Neue Montreal). Preloading
            removes the waitForCardFonts() race against its 1500ms
            bake-with-fallback timeout. woff2-only: every browser that can
            run this site supports woff2. */}
        <link
          rel="preload"
          href="/fonts/PTMono-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/PTMono-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/PPNeueMontreal-Book.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        {/* Launch-day measurement (owner decision, 2026-09-01): Vercel Web
            Analytics + Core Web Vitals. Both no-op in dev; in production
            they load from va.vercel-scripts.com, which script-src and
            connect-src allowlist in lib/security/headers.mjs. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
