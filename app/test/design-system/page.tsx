"use client";

import {
  // Tokens
  gold,
  dawn,
  chamferColors,
  // Atoms
  CornerBracket,
  CornerBrackets,
  Surface,
  AccentBar,
  Label,
  Diamond,
  Rail,
  TargetReticle,
  // Molecules
  Frame,
  ChamferedFrame,
  Badge,
  SectionHeader,
  // Organisms
  Card,
  Button,
  Panel,
} from "@thoughtform/ui";

export default function DesignSystemTest() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0908",
        color: "#ebe3d6",
        padding: "64px",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "32px",
          color: gold.DEFAULT,
          marginBottom: "48px",
        }}
      >
        Atomic Design System
      </h1>

      {/* Tokens Section */}
      <SectionHeader index="01" label="Tokens" showLine />
      <div style={{ display: "flex", gap: "16px", marginBottom: "48px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="Gold" variant="gold" />
          <div style={{ width: "80px", height: "40px", background: gold.DEFAULT }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="Dawn" variant="dawn" />
          <div style={{ width: "80px", height: "40px", background: dawn.DEFAULT }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="Dawn 50" variant="muted" />
          <div style={{ width: "80px", height: "40px", background: dawn[50] }} />
        </div>
      </div>

      {/* Atoms Section */}
      <SectionHeader index="02" label="Atoms" showLine />
      <div
        style={{
          display: "flex",
          gap: "48px",
          marginBottom: "48px",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* Corner Brackets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="CornerBrackets" />
          <div
            style={{
              position: "relative",
              width: "100px",
              height: "80px",
              background: "rgba(202, 165, 84, 0.05)",
            }}
          >
            <CornerBrackets corners="four" preset="card" />
          </div>
        </div>

        {/* Diamond */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="Diamond" />
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Diamond size={8} filled />
            <Diamond size={12} filled />
            <Diamond size={8} filled={false} />
          </div>
        </div>

        {/* Rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="Rail" />
          <Rail orientation="vertical" ticks={11} length={100} />
        </div>

        {/* Surface */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="Surface (glass)" />
          <Surface variant="glass" border style={{ padding: "16px", width: "120px" }}>
            <span style={{ fontSize: "12px" }}>Glass surface</span>
          </Surface>
        </div>
      </div>

      {/* Molecules Section */}
      <SectionHeader index="03" label="Molecules" showLine />
      <div
        style={{
          display: "flex",
          gap: "32px",
          marginBottom: "48px",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* Frame */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="Frame" />
          <Frame corners="four" cornerPreset="card" border surface="elevated" padding="md">
            <span style={{ fontSize: "12px" }}>Framed content</span>
          </Frame>
        </div>

        {/* Badge */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="Badge" />
          <div style={{ display: "flex", gap: "8px" }}>
            <Badge>Default</Badge>
            <Badge variant="gold">Gold</Badge>
            <Badge variant="muted">Muted</Badge>
          </div>
        </div>
      </div>

      {/* ChamferedFrame Section */}
      <SectionHeader index="04" label="ChamferedFrame" showLine />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "32px",
          marginBottom: "48px",
        }}
      >
        {/* Inspector Ticket (default) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="inspectorTicket (default)" />
          <ChamferedFrame
            shape="inspectorTicket"
            titleSlot={
              <span
                style={{
                  fontFamily: "var(--font-data, 'PT Mono', monospace)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: gold.DEFAULT,
                  textTransform: "uppercase",
                }}
              >
                PANEL TITLE
              </span>
            }
            toolbarSlot={
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: dawn[50],
                  cursor: "pointer",
                  padding: "2px 6px",
                }}
              >
                ×
              </button>
            }
            style={{ height: "280px" }}
          >
            <div style={{ fontSize: "12px", color: dawn[50] }}>
              <p style={{ marginBottom: "12px" }}>
                This is the default inspector ticket frame, matching the Astrogation inspector panel
                geometry.
              </p>
              <p style={{ marginBottom: "12px" }}>
                The step-down notch on top-right creates a title zone, with toolbar buttons in the
                opposite corner.
              </p>
              <p>Content scrolls and clips below the notch area automatically.</p>
            </div>
          </ChamferedFrame>
        </div>

        {/* Inspector Ticket Compact */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="inspectorTicketCompact" />
          <ChamferedFrame
            shape="inspectorTicketCompact"
            titleSlot={
              <span
                style={{
                  fontFamily: "var(--font-data, 'PT Mono', monospace)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: gold.DEFAULT,
                  textTransform: "uppercase",
                }}
              >
                COMPACT
              </span>
            }
            style={{ height: "280px" }}
          >
            <div style={{ fontSize: "12px", color: dawn[50] }}>
              <p>Smaller notch variant for tighter layouts.</p>
            </div>
          </ChamferedFrame>
        </div>

        {/* Custom: Danger stroke */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="Danger variant (custom stroke)" />
          <ChamferedFrame
            shape="inspectorTicket"
            strokeColor={chamferColors.strokeDanger}
            titleSlot={
              <span
                style={{
                  fontFamily: "var(--font-data, 'PT Mono', monospace)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: "#ff6b35",
                  textTransform: "uppercase",
                }}
              >
                ⚠ ALERT
              </span>
            }
            style={{ height: "280px" }}
          >
            <div style={{ fontSize: "12px", color: dawn[50] }}>
              <p>
                Custom stroke color for alert/danger states. No baked glow — use CSS drop-shadow if
                needed.
              </p>
            </div>
          </ChamferedFrame>
        </div>

        {/* Cut Corners Medium */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="cutCornersMd" />
          <ChamferedFrame shape="cutCornersMd" style={{ height: "280px" }}>
            <div style={{ fontSize: "12px", color: dawn[50] }}>
              <p style={{ marginBottom: "12px" }}>
                Four-corner chamfer variant with no step-down. Good for cards and dialogs.
              </p>
              <p>All corners get a 16px 45-degree cut.</p>
            </div>
          </ChamferedFrame>
        </div>

        {/* Cut Corners Small */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="cutCornersSm" />
          <ChamferedFrame
            shape="cutCornersSm"
            strokeColor={chamferColors.strokeMuted}
            style={{ height: "280px" }}
          >
            <div style={{ fontSize: "12px", color: dawn[50] }}>
              <p>Small 8px corner cuts with muted stroke. Subtle asymmetry for cards.</p>
            </div>
          </ChamferedFrame>
        </div>

        {/* Custom shape: Top-Left notch */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label text="Custom: Top-Left notch" />
          <ChamferedFrame
            shape={{
              kind: "ticketNotch",
              corner: "tl",
              notchWidthPx: 200,
              notchHeightPx: 28,
            }}
            titleSlot={
              <span
                style={{
                  fontFamily: "var(--font-data, 'PT Mono', monospace)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: gold.DEFAULT,
                  textTransform: "uppercase",
                }}
              >
                MIRRORED
              </span>
            }
            style={{ height: "280px" }}
          >
            <div style={{ fontSize: "12px", color: dawn[50] }}>
              <p>
                Notch on top-left corner instead of top-right. Title and toolbar positions swap.
              </p>
            </div>
          </ChamferedFrame>
        </div>
      </div>

      {/* Organisms Section */}
      <SectionHeader index="05" label="Organisms" showLine />
      <div
        style={{
          display: "flex",
          gap: "32px",
          marginBottom: "48px",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* Cards */}
        <Card tier="content" title="Content Card" index="01" label="Content">
          <p style={{ fontSize: "12px", color: dawn[50], marginTop: "8px" }}>A content tier card</p>
        </Card>

        <Card tier="terminal" title="Terminal" label="System">
          <p style={{ fontSize: "12px", color: dawn[50], marginTop: "8px" }}>Terminal style</p>
        </Card>

        <Card tier="data" title="42" label="Metric" />

        {/* Button */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Button variant="solid">Solid Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      </div>

      {/* Target Reticle Section */}
      <SectionHeader index="06" label="Target Reticle" showLine />
      <div
        style={{
          display: "flex",
          gap: "80px",
          marginBottom: "48px",
          paddingTop: "48px",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <TargetReticle label="CARD">
          <Card tier="content" title="Selected Component" index="01" label="Demo">
            <p style={{ fontSize: "12px", color: dawn[50], marginTop: "8px" }}>
              This card is targeted
            </p>
          </Card>
        </TargetReticle>

        <TargetReticle label="BUTTON">
          <Button variant="solid">Target Button</Button>
        </TargetReticle>

        <TargetReticle label="SURFACE" scanning>
          <Surface variant="elevated" border style={{ padding: "24px 32px" }}>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Scan in progress
            </span>
          </Surface>
        </TargetReticle>
      </div>
    </div>
  );
}
