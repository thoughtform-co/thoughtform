import type { Metadata } from "next";
import { IBM_Plex_Sans, PT_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex",
  display: "swap",
});

const ptMono = PT_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pt-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thoughtform │ Navigate AI for Creative Breakthroughs",
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
  ],
  authors: [{ name: "Vince Buyssens" }],
  openGraph: {
    title: "Thoughtform │ Navigate AI for Creative Breakthroughs",
    description:
      "Thoughtform pioneers intuitive human-AI collaboration. We teach teams how to navigate AI for creative and strategic work.",
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
    <html lang="en" className={`${ibmPlex.variable} ${ptMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

