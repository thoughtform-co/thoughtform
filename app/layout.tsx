import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";

// Google Fonts
const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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

export const metadata: Metadata = {
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
  openGraph: {
    title: "Thoughtform — Navigate Intelligence",
    description:
      "Navigate the alien terrain of machine intelligence. Thoughtform pioneers intuitive human-AI collaboration.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${ibmPlex.variable} ${ibmPlexMono.variable} ${ppMondwest.variable}`}
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
      </body>
    </html>
  );
}
