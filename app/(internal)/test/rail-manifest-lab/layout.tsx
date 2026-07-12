import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rail Manifest Lab (Internal)",
  robots: { index: false, follow: false },
};

export default function RailManifestLabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
