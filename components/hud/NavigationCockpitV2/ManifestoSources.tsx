"use client";

// ═══════════════════════════════════════════════════════════════════
// MANIFESTO SOURCES - Left Rail
// Clean source list aligned with navigation grid
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
  if (!isVisible) return null;

  return (
    <nav className="sources-rail" aria-label="Manifesto sources">
      {/* Vertical line */}
      <div className="sources-line" aria-hidden="true" />

      {/* Content container */}
      <div className="sources-content">
        {/* Label */}
        <header className="sources-header">
          <span className="header-marker" aria-hidden="true">
            °
          </span>
          <span className="header-label">SOURCES</span>
        </header>

        {/* Source list */}
        <ul className="sources-list">
          {SOURCES.map((source, index) => (
            <li
              key={source.id}
              className="source-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                <span className="source-id">{source.id}</span>
                <div className="source-info">
                  <span className="source-title">{source.title}</span>
                  <span className="source-author">{source.author}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        .sources-rail {
          position: fixed;
          left: 220px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          display: flex;
          flex-direction: row;
          align-items: stretch;
          animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Solid vertical line */
        .sources-line {
          width: 1px;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(202, 165, 84, 0.3) 10%,
            rgba(202, 165, 84, 0.3) 90%,
            transparent 100%
          );
          margin-right: 16px;
          flex-shrink: 0;
        }

        /* Content container */
        .sources-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Header */
        .sources-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .header-marker {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 14px;
          color: var(--gold, #caa554);
          opacity: 0.5;
        }

        .header-label {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.15em;
          color: var(--gold, #caa554);
          opacity: 0.6;
        }

        /* Source list */
        .sources-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Individual source item */
        .source-item {
          animation: slideIn 0.4s ease-out forwards;
          opacity: 0;
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

        .source-link {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          text-decoration: none;
          padding: 8px 10px;
          margin: -8px -10px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .source-link:hover {
          background: rgba(202, 165, 84, 0.06);
        }

        .source-link:focus-visible {
          outline: 1px solid rgba(202, 165, 84, 0.4);
          outline-offset: 2px;
        }

        /* Source ID number */
        .source-id {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 11px;
          color: var(--gold, #caa554);
          opacity: 0.4;
          min-width: 20px;
          padding-top: 2px;
          transition: opacity 0.2s ease;
        }

        .source-link:hover .source-id {
          opacity: 0.8;
        }

        /* Source info container */
        .source-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Source title */
        .source-title {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 12px;
          font-weight: 400;
          color: var(--semantic-dawn, #ece3d6);
          opacity: 0.8;
          line-height: 1.4;
          transition: all 0.2s ease;
        }

        .source-link:hover .source-title {
          color: var(--gold, #caa554);
          opacity: 1;
        }

        /* Source author */
        .source-author {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 11px;
          color: var(--gold, #caa554);
          opacity: 0.4;
          transition: opacity 0.2s ease;
        }

        .source-link:hover .source-author {
          opacity: 0.7;
        }

        /* Hide on mobile */
        @media (max-width: 768px) {
          .sources-rail {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}

export default ManifestoSources;
