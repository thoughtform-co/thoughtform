"use client";

import { useState, useCallback } from "react";
import { SigilCanvas, type SigilConfig } from "./SigilCanvas";

// ═══════════════════════════════════════════════════════════════════
// SERVICE CARD
// Individual service card with particle sigil header
// Design: Tensor Gold TL/BR corners, glass background, PP Mondwest body
// ═══════════════════════════════════════════════════════════════════

export interface ServiceData {
  id: string;
  title: string; // e.g., "Inspire // Keynotes"
  body: string; // Description text
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

  // Parse title into label and main title
  // Format: "Inspire // Keynotes" → label: "Inspire", title: "Keynotes"
  const titleParts = service.title.split(" // ");
  const label = titleParts[0] || "";
  const mainTitle = titleParts[1] || service.title;

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
      {/* Tensor Gold corners - TL */}
      <div className="service-card__corner service-card__corner--tl" />
      {/* Tensor Gold corners - BR */}
      <div className="service-card__corner service-card__corner--br" />

      {/* Sigil header */}
      <div className="service-card__sigil">
        <SigilCanvas config={sigilConfig} size={140} seed={sigilSeed} allowSpill={true} />
      </div>

      {/* Content */}
      <div className="service-card__content">
        <div className="service-card__label">{label}</div>
        <h3 className="service-card__title">{mainTitle}</h3>
        <p className="service-card__body">{service.body}</p>
      </div>

      {/* Admin edit button (only visible on hover for admins) */}
      {isAdmin && isHovered && (
        <button className="service-card__edit-btn" onClick={handleEditClick} type="button">
          Edit Sigil
        </button>
      )}
    </div>
  );
}

export default ServiceCard;
