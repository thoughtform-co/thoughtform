"use client";

/**
 * /test/services-demo
 *
 * A composed demo of the Services section built on the hologram centerpiece:
 * the brandmark armillary hologram in the centre, the three real services
 * (Keynote / Workshop / Embedded) as HUD cards, and CV-scan connector lines
 * fanning from detected points on the artifact out to each card. This is the
 * "not three blocks" composition — one connected instrument.
 *
 * Fixed front camera (no orbit) like the real section: the mark billboards to
 * face the viewer, the orbital armature turns around it, and the connector
 * anchors stay put so the scan-lines read cleanly.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Link from "next/link";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

import { ServicesHologramScene } from "@/components/landing/home-v2/services/hologram";
import { SERVICES, type Service } from "@/components/landing/home-v2/services/serviceData";
import { CornerBracket } from "@/components/ui/CornerBracket";
import { useHologramConnectors, type ConnectorAnchor } from "@/lib/stores/hologramConnectorStore";

const PALETTE = {
  void: "#050403",
  gold: "#caa554",
  hotGold: "#f0c36a",
  dawn: "#ebe3d6",
  dim: "rgba(235, 227, 214, 0.55)",
  faint: "rgba(235, 227, 214, 0.32)",
  panel: "rgba(12, 10, 8, 0.5)",
  border: "rgba(202, 165, 84, 0.28)",
};

/** Anchor angle (radians) on the artifact ring per service — upper-right,
 *  right, lower-right — so the scan-lines fan toward the stacked cards. */
const ANCHOR_ANGLES = [0.95, 0.02, -0.95];
const ANCHOR_RADIUS = 1.02;

/** Card vertical placement (top %) per service. */
const CARD_TOP = ["8%", "37%", "66%"];

// ── In-canvas projector: world ring anchors → screen pixels ─────────
function ConnectorProjector({ scale }: { scale: number }) {
  const setAnchors = useHologramConnectors((s) => s.setAnchors);
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());
  const fwd = useRef(new THREE.Vector3());
  const v = useRef(new THREE.Vector3());

  useFrame(({ camera, size }) => {
    camera.matrixWorld.extractBasis(right.current, up.current, fwd.current);
    const out: ConnectorAnchor[] = [];
    for (let i = 0; i < ANCHOR_ANGLES.length; i++) {
      const a = ANCHOR_ANGLES[i];
      v.current
        .set(0, 0, 0)
        .addScaledVector(right.current, Math.cos(a) * ANCHOR_RADIUS * scale)
        .addScaledVector(up.current, Math.sin(a) * ANCHOR_RADIUS * scale);
      v.current.project(camera);
      out.push({
        x: (v.current.x * 0.5 + 0.5) * size.width,
        y: (-v.current.y * 0.5 + 0.5) * size.height,
        visible: v.current.z < 1,
      });
    }
    setAnchors(out);
  });

  return null;
}

// ── HUD service card ────────────────────────────────────────────────
function DemoCard({
  service,
  cardRef,
}: {
  service: Service;
  cardRef: (el: HTMLElement | null) => void;
}) {
  const lead = !!service.lead;
  return (
    <article
      ref={cardRef}
      style={{
        position: "relative",
        width: 340,
        padding: "20px 22px",
        background: PALETTE.panel,
        backdropFilter: "blur(10px)",
        border: `1px solid ${lead ? "rgba(202,165,84,0.55)" : PALETTE.border}`,
        boxShadow: lead
          ? "0 0 0 1px rgba(235,227,214,0.05), 0 0 50px rgba(202,165,84,0.14), 0 24px 60px rgba(0,0,0,0.55)"
          : "0 0 0 1px rgba(235,227,214,0.04), 0 18px 50px rgba(0,0,0,0.5)",
        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
        color: PALETTE.dawn,
      }}
    >
      <CornerBracket mode="four" armLength={13} thickness={1.5} color="var(--gold, #caa554)" />

      <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: PALETTE.gold, letterSpacing: "0.1em" }}>
          {service.index}
        </span>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: PALETTE.gold }} />
        <span style={{ fontSize: 10, letterSpacing: "0.14em", color: PALETTE.faint }}>
          {service.kicker}
        </span>
      </header>

      <h3
        style={{
          fontSize: 26,
          lineHeight: 1.05,
          margin: "0 0 6px",
          letterSpacing: "0.02em",
          fontFamily: "'PP Neue Montreal', system-ui, sans-serif",
          color: lead ? PALETTE.hotGold : PALETTE.dawn,
        }}
      >
        {service.verb}
      </h3>
      <p style={{ fontSize: 13, margin: "0 0 10px", color: PALETTE.dim }}>{service.tagline}</p>
      <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "0 0 14px", color: PALETTE.dim }}>
        {service.body}
      </p>

      <dl style={{ margin: "0 0 14px", display: "grid", gap: 6 }}>
        {service.meta.map((row) => (
          <div
            key={row.label}
            style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 10 }}
          >
            <dt
              style={{
                fontSize: 9.5,
                letterSpacing: "0.1em",
                color: PALETTE.faint,
                textTransform: "uppercase",
              }}
            >
              {row.label}
            </dt>
            <dd style={{ fontSize: 11, margin: 0, color: PALETTE.dim }}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, letterSpacing: "0.08em", color: PALETTE.faint }}>
          {service.phase === "navigate"
            ? "Navigate"
            : service.phase === "navigate-encode"
              ? "Navigate · Encode"
              : "Navigate · Encode · Build"}
        </span>
        <a
          href={service.ctaHref}
          style={{ fontSize: 11.5, color: PALETTE.gold, textDecoration: "none" }}
        >
          {service.ctaLabel} →
        </a>
      </footer>
    </article>
  );
}

// ── SVG scan-line overlay (anchors → cards) ─────────────────────────
function ConnectorOverlay({ cardEls }: { cardEls: MutableRefObject<(HTMLElement | null)[]> }) {
  const anchors = useHologramConnectors((s) => s.anchors);
  if (!anchors.length) return null;

  return (
    <svg
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <style>{`@keyframes holoScanFlow { to { stroke-dashoffset: -20; } } .holo-scan-line { animation: holoScanFlow 0.9s linear infinite; }`}</style>
      {anchors.map((anchor, i) => {
        const el = cardEls.current[i];
        if (!el || !anchor.visible) return null;
        const r = el.getBoundingClientRect();
        const cardX = r.left - 6;
        const cardY = r.top + r.height / 2;
        const elbowX = r.left - 34;
        const points = `${anchor.x},${anchor.y} ${elbowX},${cardY} ${cardX},${cardY}`;
        return (
          <g key={i}>
            {/* soft glow underlay */}
            <polyline
              points={points}
              fill="none"
              stroke="#caa554"
              strokeWidth={3}
              strokeOpacity={0.12}
            />
            {/* animated scan dash — data flowing from the artifact to the card */}
            <polyline
              className="holo-scan-line"
              points={points}
              fill="none"
              stroke="#f0c36a"
              strokeWidth={1.3}
              strokeOpacity={0.92}
              strokeDasharray="5 5"
            />
            {/* anchor reticle — a detected point on the artifact */}
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r={4.5}
              fill="none"
              stroke="#caa554"
              strokeWidth={1}
              strokeOpacity={0.85}
            />
            <circle cx={anchor.x} cy={anchor.y} r={1.4} fill="#f0c36a" />
            <line
              x1={anchor.x - 8}
              y1={anchor.y}
              x2={anchor.x - 4.5}
              y2={anchor.y}
              stroke="#caa554"
              strokeWidth={1}
              strokeOpacity={0.7}
            />
            <line
              x1={anchor.x + 4.5}
              y1={anchor.y}
              x2={anchor.x + 8}
              y2={anchor.y}
              stroke="#caa554"
              strokeWidth={1}
              strokeOpacity={0.7}
            />
            {/* connection node at the card */}
            <circle
              cx={cardX}
              cy={cardY}
              r={2.6}
              fill="none"
              stroke="#caa554"
              strokeWidth={1}
              strokeOpacity={0.9}
            />
            <circle cx={cardX} cy={cardY} r={0.9} fill="#caa554" />
          </g>
        );
      })}
    </svg>
  );
}

export default function ServicesDemoPage() {
  const SCALE = 0.92;
  const cardEls = useRef<(HTMLElement | null)[]>([null, null, null]);
  // Nudge a resize after mount so the R3F canvas measures correctly in the
  // preview harness (initial layout can race the first measure).
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: `radial-gradient(130% 100% at 42% 45%, #0d0a07 0%, ${PALETTE.void} 72%)`,
        overflow: "hidden",
      }}
    >
      {/* Section eyebrow */}
      <div
        style={{
          position: "absolute",
          top: 34,
          left: 40,
          zIndex: 6,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.32em", color: PALETTE.gold }}>SERVICES</div>
        <div style={{ fontSize: 13, letterSpacing: "0.06em", color: PALETTE.faint, marginTop: 6 }}>
          One loop. Three depths.
        </div>
      </div>

      {/* Hologram centerpiece */}
      <Canvas
        camera={{ position: [0, 0, 3.6], fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <ServicesHologramScene flyIn={1} scale={SCALE} orbitsRotate={0.1} scanGain={0.6} />
        <ConnectorProjector scale={SCALE} />
        <EffectComposer>
          <Bloom intensity={0.85} luminanceThreshold={0.18} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      </Canvas>

      {/* Scan-line connectors (between canvas and cards) */}
      <ConnectorOverlay cardEls={cardEls} />

      {/* Service cards */}
      {SERVICES.map((service, i) => (
        <div
          key={service.id}
          style={{
            position: "absolute",
            top: CARD_TOP[i],
            right: service.lead ? 44 : 64,
            zIndex: 6,
          }}
        >
          <DemoCard
            service={service}
            cardRef={(el) => {
              cardEls.current[i] = el;
            }}
          />
        </div>
      ))}

      <Link
        href="/test/services-hologram"
        style={{
          position: "absolute",
          bottom: 18,
          left: 22,
          zIndex: 6,
          fontSize: 11,
          letterSpacing: "0.08em",
          color: PALETTE.faint,
          fontFamily: "ui-monospace, monospace",
          textDecoration: "none",
        }}
      >
        ← hologram lab
      </Link>
    </div>
  );
}
