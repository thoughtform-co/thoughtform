import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/home-v2 â€” internal dev route for the depth-gateway homepage v2.
 *
 * Blocked from production by `proxy.ts` and indexed `noindex` so
 * the experiment never leaks into search. Auth is handled by the
 * parent `(internal)/test` layout (admin-gated outside dev).
 */
export const metadata: Metadata = {
  title: "Home v2 â€” Depth Gateway (Internal)",
  description: "Experimental depth-gateway homepage with z-axis camera dolly.",
  robots: { index: false, follow: false },
};

export default function HomeV2Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
