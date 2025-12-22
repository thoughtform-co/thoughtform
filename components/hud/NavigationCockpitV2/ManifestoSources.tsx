"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════
// MANIFESTO SOURCES - Left Rail
// Minimalistic source markers aligned with navigation rail
// ═══════════════════════════════════════════════════════════════════

interface Source {
  id: string;
  title: string;
  author: string;
  url: string;
}

const SOURCES: Source[] = [
  {
    id: "01",
    title: "Why AI Is Harder Than We Think",
    author: "Mitchell",
    url: "https://arxiv.org/abs/2104.12871",
  },
  {
    id: "02",
    title: "AI-Assisted Writing",
    author: "Wattenberger",
    url: "https://wattenberger.com/thoughts/ai-writing",
  },
  {
    id: "03",
    title: "Latent Space Interpolation",
    author: "Mollick",
    url: "https://www.oneusefulthing.org/p/latent-space-interpolation",
  },
  {
    id: "04",
    title: "The Urgency of Interpretability",
    author: "Amodei",
    url: "https://www.anthropic.com/research/interpretability",
  },
  {
    id: "05",
    title: "LLM Homogenization Effects",
    author: "Chung et al.",
    url: "https://arxiv.org/abs/2402.01536",
  },
];

interface ManifestoSourcesProps {
  /** Whether sources should be visible */
  isVisible: boolean;
}

export function ManifestoSources({ isVisible }: ManifestoSourcesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!isVisible) return null;

  return (
    <div className="sources-rail">
      {/* Label */}
      <div className="sources-label">SRC</div>

      {/* Source markers */}
      <div className="sources-markers">
        {SOURCES.map((source, index) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`source-marker ${hoveredId === source.id ? "active" : ""}`}
            onMouseEnter={() => setHoveredId(source.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <span className="marker-id">{source.id}</span>

            {/* Tooltip on hover */}
            {hoveredId === source.id && (
              <div className="marker-tooltip">
                <span className="tooltip-title">{source.title}</span>
                <span className="tooltip-author">{source.author}</span>
              </div>
            )}
          </a>
        ))}
      </div>

      <style jsx>{`
        .sources-rail {
          position: fixed;
          left: 24px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .sources-label {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          color: var(--gold, #caa554);
          opacity: 0.4;
          margin-bottom: 8px;
          padding-left: 2px;
        }

        .sources-markers {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .source-marker {
          position: relative;
          display: flex;
          align-items: center;
          text-decoration: none;
          padding: 4px 6px;
          border-radius: 2px;
          transition: all 0.15s ease;
          animation: slideIn 0.3s ease-out forwards;
          opacity: 0;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .source-marker:hover,
        .source-marker.active {
          background: rgba(202, 165, 84, 0.08);
        }

        .marker-id {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 10px;
          color: var(--gold, #caa554);
          opacity: 0.5;
          transition: all 0.15s ease;
        }

        .source-marker:hover .marker-id,
        .source-marker.active .marker-id {
          opacity: 1;
          text-shadow: 0 0 6px rgba(202, 165, 84, 0.5);
        }

        /* Tooltip */
        .marker-tooltip {
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 12px;
          padding: 8px 12px;
          background: rgba(10, 10, 10, 0.95);
          border: 1px solid rgba(202, 165, 84, 0.2);
          border-radius: 4px;
          white-space: nowrap;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: tooltipIn 0.15s ease-out forwards;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        @keyframes tooltipIn {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }

        .tooltip-title {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 11px;
          color: var(--semantic-dawn, #ece3d6);
          line-height: 1.3;
        }

        .tooltip-author {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 10px;
          color: var(--gold, #caa554);
          opacity: 0.6;
        }

        /* Hide on mobile */
        @media (max-width: 768px) {
          .sources-rail {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default ManifestoSources;
