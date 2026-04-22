import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#0a0908",
        color: "rgba(235, 227, 214, 0.7)",
        fontFamily: "var(--font-ibm-plex-mono, 'IBM Plex Mono', monospace)",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(202, 165, 84, 0.6)",
          marginBottom: "1.5rem",
        }}
      >
        Signal Lost
      </div>

      <h1
        style={{
          fontFamily: "var(--font-mondwest, 'PP Mondwest', serif)",
          fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: 400,
          color: "rgba(235, 227, 214, 0.9)",
          margin: "0 0 1rem",
          lineHeight: 1.1,
        }}
      >
        404
      </h1>

      <p
        style={{
          fontSize: "13px",
          maxWidth: "360px",
          lineHeight: 1.6,
          margin: "0 0 2rem",
        }}
      >
        The coordinates you entered do not map to any known region of the Thoughtform navigation
        field.
      </p>

      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "10px 24px",
          border: "1px solid rgba(202, 165, 84, 0.3)",
          color: "rgba(235, 227, 214, 0.8)",
          textDecoration: "none",
          fontSize: "11px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          transition: "border-color 0.2s, color 0.2s",
        }}
      >
        Return to Origin
      </Link>
    </div>
  );
}
