/**
 * /test/design-eval-fixture — the eval harness's self-test, both directions.
 *
 * A gate verified in only one direction is a gate that might be returning a
 * constant. So this page ships TWO panels:
 *
 *   .fixture-bad   deliberately violates six named laws
 *   .fixture-good  the same content, lawful
 *
 * The harness must FAIL the first with the correctly named flags and PASS the
 * second. If either half stops behaving, the gate is broken — not the page.
 *
 *   node scripts/design-eval/mechanical.mjs --url /test/design-eval-fixture --scope ".fixture-bad"   # expect FAIL
 *   node scripts/design-eval/mechanical.mjs --url /test/design-eval-fixture --scope ".fixture-good"  # expect PASS
 *
 * ⚠ The violations here are INTENTIONAL and must not be "fixed". They are the
 * test. This route is `(internal)`, so `proxy.ts` 404s it in production.
 */
export const metadata = { title: "Design eval fixture" };

export default function DesignEvalFixturePage() {
  return (
    <main
      style={{
        background: "var(--void)",
        color: "var(--dawn)",
        minHeight: "100vh",
        padding: 40,
        display: "flex",
        gap: 40,
        fontFamily: "var(--font-pt-mono), monospace",
      }}
    >
      {/* ── the broken half ─────────────────────────────────────────────── */}
      <section
        className="fixture-bad"
        style={{
          // 1. rounded corners — banned outright
          borderRadius: 14,
          // 2. a purple/blue gradient — the standing anti-pattern
          background: "linear-gradient(135deg, rgb(96, 60, 200), rgb(60, 90, 210))",
          // 3. box-shadow as depth
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          padding: 32,
          flex: 1,
        }}
      >
        <h2
          style={{
            // 4. a third font family
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 28,
            margin: 0,
          }}
        >
          Broken on purpose
        </h2>
        <p
          style={{
            // 5. failing contrast — mid grey on a mid ground
            color: "rgb(120,120,120)",
            background: "rgb(96,96,96)",
            fontSize: 13,
            padding: 8,
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          This paragraph is below the contrast floor and set in a banned face.
        </p>
        {/* 6. a circular indicator where a diamond belongs */}
        <span
          style={{
            display: "inline-block",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "rgb(202,165,84)",
          }}
        />
      </section>

      {/* ── the lawful half ─────────────────────────────────────────────── */}
      <section
        className="fixture-good"
        style={{
          background: "var(--void)",
          border: "1px solid var(--dawn-08)",
          padding: 32,
          flex: 1,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-pt-mono), monospace",
            fontSize: 28,
            margin: 0,
            color: "var(--dawn)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Lawful
        </h2>
        <p
          style={{
            fontFamily: "var(--font-pp-neue-montreal), sans-serif",
            color: "var(--dawn)",
            fontSize: 15,
            lineHeight: 1.5,
            maxWidth: "42ch",
          }}
        >
          Square corners, two families by role, no shadow, full-strength ink on the void ground, and
          the accent spent once.
        </p>
        {/* a diamond, not a circle */}
        <span
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            transform: "rotate(45deg)",
            background: "var(--gold)",
          }}
        />
      </section>
    </main>
  );
}
