"use client";

import { useState } from "react";
import Link from "next/link";

interface AdminToolsProps {
  /** Callback when Particle Admin panel is toggled */
  onParticleToggle: (isOpen: boolean) => void;
  /** Whether the Particle Admin panel is open */
  isParticleOpen: boolean;
  /** Whether there are unsaved particle changes */
  hasParticleChanges?: boolean;
}

/**
 * Admin tools menu in the top-right corner
 * Mirrors the [00]/[01] CTA buttons on the left side
 * Only visible to admin users (via AdminGate wrapper)
 */
export function AdminTools({
  onParticleToggle,
  isParticleOpen,
  hasParticleChanges = false,
}: AdminToolsProps) {
  const tools = [
    {
      id: "particles",
      icon: "⚙",
      label: "PARTICLES",
      isActive: isParticleOpen,
      hasIndicator: hasParticleChanges,
      onClick: () => onParticleToggle(!isParticleOpen),
    },
    {
      id: "shape-lab",
      icon: "◇",
      label: "SHAPE LAB",
      isActive: false,
      hasIndicator: false,
      href: "/test/shape-lab",
    },
  ];

  return (
    <>
      <div className="admin-tools">
        {tools.map((tool) => {
          const isActive = tool.isActive;

          const content = (
            <>
              <span className="admin-tools__label">{tool.label}</span>
              <span className="admin-tools__icon">{tool.icon}</span>
              {tool.hasIndicator && <span className="admin-tools__indicator" />}
            </>
          );

          if (tool.href) {
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className={`admin-tools__item ${isActive ? "is-active" : ""}`}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={tool.id}
              className={`admin-tools__item ${isActive ? "is-active" : ""}`}
              onClick={tool.onClick}
            >
              {content}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .admin-tools {
          position: fixed;
          /* Mirror the CTA menu's bottom margin (see MorphingCTAButtons) */
          top: calc(var(--hud-padding, 32px) + var(--corner-size, 40px) - 16px);
          /* Mirror CTA spacing from the rail: sit flush against the right rail edge */
          right: calc(var(--hud-padding, 32px) + var(--rail-width, 60px) + 0px);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          pointer-events: auto;
        }

        .admin-tools__item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: transparent;
          border: none;
          font-family: var(--font-data, "PT Mono", monospace);
          font-size: 10px;
          font-weight: 520;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          color: rgba(202, 165, 84, 0.5);
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          transition: color 150ms ease;
          position: relative;
          justify-content: flex-end;
          text-align: right;
        }

        .admin-tools__item:hover {
          color: var(--gold, #caa554);
        }

        .admin-tools__item.is-active {
          color: var(--dawn, #ebe3d6);
        }

        .admin-tools__icon {
          min-width: 16px;
          font-size: 11px;
          letter-spacing: 0.02em;
          text-align: right;
          opacity: 0.8;
        }

        .admin-tools__label {
          font-size: 10px;
        }

        .admin-tools__indicator {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 5px;
          height: 5px;
          background: #ff6b35;
          border-radius: 50%;
        }

        @media (max-width: 768px) {
          .admin-tools {
            top: calc(var(--hud-padding, 8px) + var(--corner-size, 20px) - 16px);
            right: calc(var(--hud-padding, 8px) + var(--rail-width, 32px) + 0px);
          }

          .admin-tools__item {
            padding: 4px 8px;
            font-size: 9px;
          }

          .admin-tools__icon {
            font-size: 10px;
          }
        }
      `}</style>
    </>
  );
}
