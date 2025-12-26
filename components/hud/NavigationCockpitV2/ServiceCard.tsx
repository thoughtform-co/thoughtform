"use client";

import { useState, useCallback } from "react";
import { SigilCanvas, type SigilConfig } from "./SigilCanvas";

// ═══════════════════════════════════════════════════════════════════
// SERVICE CARD
// ═══════════════════════════════════════════════════════════════════
//
// Individual service card component for the Services section deck.
// Part of the manifesto → services scroll-driven transition.
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ DESIGN SYSTEM (Thoughtform Brandworld)                         │
// │                                                                 │
// │ • Terminal Aesthetic: SIGNAL anchor - "THOUGHTFORM@MANIFESTO:~"│
// │   header evokes command-line interface, connecting to the      │
// │   manifesto terminal that precedes this section.               │
// │                                                                 │
// │ • Tensor Gold (#caa554): Primary accent for terminal elements, │
// │   corners, and headers. Applied via CSS variables.             │
// │                                                                 │
// │ • Glass Morphism: rgba(10,9,8,0.85) + backdrop-blur creates    │
// │   depth while maintaining the void/dark aesthetic.             │
// │                                                                 │
// │ • PP Mondwest: Display font for titles, maintains brand voice. │
// │                                                                 │
// │ • Sigil Particles: LIVING_GEOMETRY anchor - each service has   │
// │   a unique particle configuration (gateway, torus, spiral)     │
// │   representing different aspects of Thoughtform's offerings.   │
// └─────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ SENTINEL BEST PRACTICES                                        │
// │                                                                 │
// │ • CSS Variables: All colors use --gold, --dawn, --void vars.   │
// │ • GPU Acceleration: will-change + backface-visibility applied  │
// │   via CSS for scroll-driven animations.                        │
// │ • Overflow: Set to hidden to contain sigil particles within    │
// │   the card frame (allowSpill={false}).                         │
// └─────────────────────────────────────────────────────────────────┘
//
// ═══════════════════════════════════════════════════════════════════

export interface ServiceData {
  id: string;
  /** Display title shown in PP Mondwest font (e.g., "Keynotes.") */
  title: string;
  /** Body text describing the service offering */
  body: string;
}

export interface ServiceCardProps {
  service: ServiceData;
  sigilConfig: SigilConfig;
  sigilSeed: number;
  index: number;
  /** Whether to show admin edit panel on hover */
  isAdmin?: boolean;
  /** Callback when admin clicks edit */
  onEditClick?: (cardIndex: number) => void;
  /** Card width in pixels */
  width?: number;
  /** Card height in pixels (optional; useful for aligning the 3-up deck) */
  height?: number;
  /** Card opacity (for stacking effect) */
  opacity?: number;
  /** Card z-index */
  zIndex?: number;
  /** Additional transform for positioning */
  transform?: string;
  /** Whether this card is currently being edited */
  isEditing?: boolean;
}

export function ServiceCard({
  service,
  sigilConfig,
  sigilSeed,
  index,
  isAdmin = false,
  onEditClick,
  width = 340,
  height,
  opacity = 1,
  zIndex = 1,
  transform,
  isEditing = false,
}: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleEditClick = useCallback(() => {
    onEditClick?.(index);
  }, [onEditClick, index]);

  return (
    <div
      className={`service-card ${isHovered ? "service-card--hovered" : ""} ${isEditing ? "service-card--editing" : ""}`}
      style={{
        width,
        height,
        opacity,
        zIndex,
        transform,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ─────────────────────────────────────────────────────────────
          TENSOR GOLD CORNER BRACKETS
          Design: 16px L-shaped corners at TL and BR positions.
          These echo the terminal frame aesthetic and create visual
          hierarchy without a full border. Uses --gold CSS variable.
          ───────────────────────────────────────────────────────────── */}
      <div className="service-card__corner service-card__corner--tl" />
      <div className="service-card__corner service-card__corner--br" />

      {/* ─────────────────────────────────────────────────────────────
          TERMINAL HEADER
          SIGNAL anchor: Creates continuity with the manifesto terminal.
          The "THOUGHTFORM@MANIFESTO:~" prompt-style text reinforces
          the command-line aesthetic. Separated by a subtle border-bottom
          (rgba(236,227,214,0.1)) from the content below.
          ───────────────────────────────────────────────────────────── */}
      <div className="service-card__header">
        <span className="service-card__header-text">THOUGHTFORM@MANIFESTO:~</span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CARD CONTENT
          Typography: PP Mondwest for titles (32px), body (18px).
          Color: --dawn for text, 0.75 opacity for body to create
          visual hierarchy. Content has flex: 1 to push sigil to bottom.
          ───────────────────────────────────────────────────────────── */}
      <div className="service-card__content">
        <h3 className="service-card__title">{service.title}</h3>
        <p className="service-card__body">{service.body}</p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SIGIL PARTICLE SYSTEM
          LIVING_GEOMETRY anchor: Each card has a unique sigil shape
          (gateway, torus, spiral) rendered via SigilCanvas.
          
          Key settings:
          • size={140}: Standard sigil size across all cards
          • seed={sigilSeed}: Deterministic particle positions
          • allowSpill={false}: Particles contained within card frame
            (overflow: hidden applied to parent container)
          ───────────────────────────────────────────────────────────── */}
      <div className="service-card__sigil">
        <SigilCanvas config={sigilConfig} size={140} seed={sigilSeed} allowSpill={false} />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ADMIN EDIT BUTTON
          Only renders for authenticated admins on hover.
          Uses AdminGate pattern from auth system.
          See: sentinel/BEST-PRACTICES.md → Authentication
          ───────────────────────────────────────────────────────────── */}
      {isAdmin && isHovered && (
        <button className="service-card__edit-btn" onClick={handleEditClick} type="button">
          Edit Sigil
        </button>
      )}
    </div>
  );
}

export default ServiceCard;
