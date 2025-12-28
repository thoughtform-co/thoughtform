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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
