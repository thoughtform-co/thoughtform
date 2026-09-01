"use client";

import { useEffect } from "react";

/**
 * Root-layout error boundary. This only renders when the root layout
 * itself (or Providers) throws — app/error.tsx covers everything below
 * it. It must render its own <html>/<body>, and it CANNOT rely on the
 * font variables or globals.css: the layout that declares them is the
 * thing that crashed. Everything here is inline, literal, and
 * dependency-free — the branded twin of app/error.tsx with raw font
 * stacks in place of the CSS variables.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Thoughtform] Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "#0a0908",
            color: "rgba(235, 227, 214, 0.7)",
            fontFamily: "'IBM Plex Mono', 'PT Mono', ui-monospace, monospace",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255, 107, 53, 0.7)",
              marginBottom: "1.5rem",
            }}
          >
            System Fault
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 400,
              color: "rgba(235, 227, 214, 0.9)",
              margin: "0 0 1rem",
              lineHeight: 1.1,
            }}
          >
            Error
          </h1>

          <p
            style={{
              fontSize: "13px",
              maxWidth: "360px",
              lineHeight: 1.6,
              margin: "0 0 2rem",
            }}
          >
            A fault was detected at the root of the system. The error has been logged for review.
          </p>

          <button
            onClick={reset}
            style={{
              display: "inline-block",
              padding: "10px 24px",
              border: "1px solid rgba(202, 165, 84, 0.3)",
              background: "transparent",
              color: "rgba(235, 227, 214, 0.8)",
              cursor: "pointer",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "inherit",
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
