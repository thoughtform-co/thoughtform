"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════
// MANIFESTO SOURCES
// Curated references grounding the manifesto philosophy
// Styled to integrate with the navigation rail system
// ═══════════════════════════════════════════════════════════════════

interface Source {
  id: string;
  title: string;
  author: string;
  publication?: string;
  url: string;
  excerpt: string;
}

const SOURCES: Source[] = [
  {
    id: "01",
    title: "Why AI Is Harder Than We Think",
    author: "Melanie Mitchell",
    publication: "arXiv",
    url: "https://arxiv.org/abs/2104.12871",
    excerpt: "The gap between narrow AI and general intelligence is vast and often underestimated.",
  },
  {
    id: "02",
    title: "The Rise of AI-Assisted Writing",
    author: "Amelia Wattenberger",
    publication: "Wattenberger.com",
    url: "https://wattenberger.com/thoughts/ai-writing",
    excerpt: "AI collaboration requires a new mental model—not command, but conversation.",
  },
  {
    id: "03",
    title: "Latent Space Interpolation Is Powering the Next Wave of Generative AI",
    author: "Ethan Mollick",
    publication: "One Useful Thing",
    url: "https://www.oneusefulthing.org/p/latent-space-interpolation",
    excerpt: "Understanding how AI navigates possibility space changes how we work with it.",
  },
  {
    id: "04",
    title: "The Urgency of Interpretability",
    author: "Dario Amodei",
    publication: "Anthropic",
    url: "https://www.anthropic.com/research/interpretability",
    excerpt: "We're building systems whose internal reasoning we don't fully understand.",
  },
  {
    id: "05",
    title: "Homogenization Effects of Large Language Models on Human Creative Ideation",
    author: "Chung et al.",
    publication: "arXiv",
    url: "https://arxiv.org/abs/2402.01536",
    excerpt:
      "When everyone uses AI the same way, ideas converge. True creativity requires navigation.",
  },
];

interface ManifestoSourcesProps {
  /** Whether sources should be visible */
  isVisible: boolean;
  /** Opacity for fade-in effect */
  opacity?: number;
}

export function ManifestoSources({ isVisible, opacity = 1 }: ManifestoSourcesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!isVisible) return null;

  return (
    <div className="manifesto-sources" style={{ opacity }}>
      {/* Section header - aligned with rail system */}
      <div className="sources-header">
        <span className="header-marker">◆</span>
        <span className="header-label">GROUNDTRUTH</span>
        <span className="header-line" />
      </div>

      {/* Source list */}
      <div className="sources-list">
        {SOURCES.map((source, index) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`source-item ${hoveredId === source.id ? "hovered" : ""}`}
            onMouseEnter={() => setHoveredId(source.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            {/* Coordinate marker - like the rail system */}
            <span className="source-marker">{source.id}</span>

            {/* Content */}
            <div className="source-content">
              <div className="source-title">{source.title}</div>
              <div className="source-meta">
                {source.author}
                {source.publication && (
                  <>
                    <span className="meta-divider">·</span>
                    {source.publication}
                  </>
                )}
              </div>
              {hoveredId === source.id && <div className="source-excerpt">{source.excerpt}</div>}
            </div>

            {/* External link indicator */}
            <span className="source-link-icon">↗</span>
          </a>
        ))}
      </div>

      <style jsx>{`
        .manifesto-sources {
          width: 100%;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(202, 165, 84, 0.15);
          animation: fadeIn 0.6s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Header aligned with rail aesthetic */
        .sources-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .header-marker {
          color: var(--gold, #caa554);
          font-size: 10px;
          opacity: 0.6;
        }

        .header-label {
          font-family: "Iosevka Web", "Iosevka", "IBM Plex Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          color: var(--gold, #caa554);
          opacity: 0.7;
          text-shadow: 0 0 4px rgba(202, 165, 84, 0.3);
        }

        .header-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(202, 165, 84, 0.2) 0%, transparent 100%);
        }

        /* Source list */
        .sources-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Individual source item */
        .source-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 12px;
          text-decoration: none;
          border-radius: 4px;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          animation: slideIn 0.4s ease-out forwards;
          opacity: 0;
          background: transparent;
        }

        .source-item:hover,
        .source-item.hovered {
          background: rgba(202, 165, 84, 0.05);
          border-color: rgba(202, 165, 84, 0.15);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Coordinate marker - matches rail system */
        .source-marker {
          font-family: "Iosevka Web", "Iosevka", "IBM Plex Mono", monospace;
          font-size: 10px;
          color: var(--gold, #caa554);
          opacity: 0.5;
          min-width: 20px;
          padding-top: 3px;
          text-shadow: 0 0 4px rgba(202, 165, 84, 0.3);
        }

        .source-item:hover .source-marker {
          opacity: 1;
          text-shadow:
            0 0 4px rgba(202, 165, 84, 0.6),
            0 0 8px rgba(202, 165, 84, 0.3);
        }

        /* Content area */
        .source-content {
          flex: 1;
          min-width: 0;
        }

        .source-title {
          font-family: "Iosevka Web", "Iosevka", "IBM Plex Mono", monospace;
          font-size: 13px;
          color: var(--semantic-dawn, #ece3d6);
          line-height: 1.4;
          transition: color 0.2s ease;
        }

        .source-item:hover .source-title {
          color: var(--gold, #caa554);
          text-shadow: 0 0 8px rgba(202, 165, 84, 0.3);
        }

        .source-meta {
          font-family: "Iosevka Web", "Iosevka", "IBM Plex Mono", monospace;
          font-size: 11px;
          color: var(--semantic-dawn, #ece3d6);
          opacity: 0.5;
          margin-top: 2px;
        }

        .meta-divider {
          margin: 0 6px;
          opacity: 0.5;
        }

        .source-excerpt {
          font-family: "Iosevka Web", "Iosevka", "IBM Plex Mono", monospace;
          font-size: 11px;
          color: var(--gold, #caa554);
          opacity: 0.7;
          margin-top: 6px;
          line-height: 1.5;
          animation: expandIn 0.2s ease-out forwards;
        }

        @keyframes expandIn {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 0.7;
            max-height: 60px;
          }
        }

        /* External link icon */
        .source-link-icon {
          font-size: 12px;
          color: var(--gold, #caa554);
          opacity: 0;
          transition: all 0.2s ease;
          padding-top: 2px;
        }

        .source-item:hover .source-link-icon {
          opacity: 0.6;
          transform: translateX(2px) translateY(-2px);
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .manifesto-sources {
            margin-top: 24px;
            padding-top: 16px;
          }

          .source-item {
            padding: 8px;
          }

          .source-title {
            font-size: 12px;
          }

          .source-excerpt {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default ManifestoSources;
