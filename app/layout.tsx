import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-ibm-plex",
  display: "swap",
});

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={ibmPlex.variable}>
      <head>
        {/* PP Mondwest font - add your font files to /public/fonts/ */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'PP Mondwest';
                src: url('/fonts/PPMondwest-Regular.woff2') format('woff2'),
                     url('/fonts/PPMondwest-Regular.woff') format('woff');
                font-weight: 400;
                font-style: normal;
                font-display: swap;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
