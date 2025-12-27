"use client";

import { useState } from "react";
import { ManifestoTerminal } from "./ManifestoTerminal";

// ═══════════════════════════════════════════════════════════════════
// MANIFESTO MOBILE TABS
// Single panel with vertical tabs: MANIFESTO / SOURCES / VOICES
// Used on mobile to replace fixed left/right rails
// ═══════════════════════════════════════════════════════════════════

// Source data (duplicated from ManifestoSources for mobile)
const SOURCES = [
  {
    id: "01",
    title: "Cognition All The Way Down",
    author: "Chis-Ciure & Levin",
    url: "https://link.springer.com/article/10.1007/s11229-025-05319-6",
  },
  {
    id: "02",
    title: "Universal Geometry of Embeddings",
    author: "Pandey et al.",
    url: "https://arxiv.org/abs/2505.12540",
  },
  {
    id: "03",
    title: "Why Concepts Are (Probably) Vectors",
    author: "Piantadosi",
    url: "https://colala.berkeley.edu/papers/piantadosi2024why.pdf",
  },
  {
    id: "04",
    title: "Creativity Through Associative Thinking",
    author: "Wang et al.",
    url: "https://arxiv.org/abs/2405.06715",
  },
  {
    id: "05",
    title: "Deep Meditations: Latent Space Navigation",
    author: "Mordvintsev et al.",
    url: "https://nips2018creativity.github.io/doc/Deep_Meditations.pdf",
  },
];

// Voice data (duplicated from ManifestoVideoStack for mobile)
const VOICES = [
  {
    id: "card-1",
    title: "AI as Intelligence",
    description: "It leaps across dimensions we can't fathom.",
    fullText:
      "AI isn't just a tool—it's a strange, new intelligence that leaps across dimensions we can't fully comprehend. It sees patterns in places we've never looked.",
  },
  {
    id: "card-2",
    title: "Navigate Strangeness",
    description: "The source of truly novel ideas.",
    fullText:
      "In technical work, AI's strangeness must be constrained. But in creative and strategic work, that strangeness becomes the source of truly novel ideas.",
  },
  {
    id: "card-3",
    title: "Think WITH AI",
    description: "Navigating its strangeness for creative breakthroughs.",
    fullText:
      "Thoughtform teaches teams to think WITH that intelligence—not against it, not around it—navigating its strangeness for creative breakthroughs.",
  },
];

type TabId = "manifesto" | "sources" | "voices";

interface ManifestoMobileTabsProps {
  /** Reveal progress for manifesto terminal (0-1) */
  revealProgress: number;
  /** Whether the component is visible */
  isVisible: boolean;
}

export function ManifestoMobileTabs({ revealProgress, isVisible }: ManifestoMobileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("manifesto");
  const [expandedVoice, setExpandedVoice] = useState<string | null>(null);

  if (!isVisible) return null;

  return (
    <div className="manifesto-mobile-tabs">
      {/* Content area */}
      <div className="mobile-tab-content">
        {/* Manifesto Tab */}
        {activeTab === "manifesto" && (
          <div className="tab-panel tab-panel--manifesto">
            <ManifestoTerminal revealProgress={revealProgress} isActive={true} />
          </div>
        )}

        {/* Sources Tab */}
        {activeTab === "sources" && (
          <div className="tab-panel tab-panel--sources">
            <div className="sources-list-mobile">
              {SOURCES.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-item-mobile"
                >
                  <span className="source-number">{source.id}</span>
                  <div className="source-info">
                    <span className="source-title">{source.title}</span>
                    <span className="source-author">{source.author}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Voices Tab */}
        {activeTab === "voices" && (
          <div className="tab-panel tab-panel--voices">
            <div className="voices-list-mobile">
              {VOICES.map((voice) => {
                const isExpanded = expandedVoice === voice.id;
                return (
                  <button
                    key={voice.id}
                    className={`voice-item-mobile ${isExpanded ? "expanded" : ""}`}
                    onClick={() => setExpandedVoice(isExpanded ? null : voice.id)}
                  >
                    <div className="voice-header">
                      <span className="voice-title">{voice.title}</span>
                      <span className="voice-expand-icon">{isExpanded ? "−" : "+"}</span>
                    </div>
                    {isExpanded ? (
                      <p className="voice-fulltext">{voice.fullText}</p>
                    ) : (
                      <p className="voice-desc">{voice.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Horizontal tab bar at bottom */}
      <div className="mobile-tab-bar">
        <button
          className={`mobile-tab-btn ${activeTab === "manifesto" ? "active" : ""}`}
          onClick={() => setActiveTab("manifesto")}
          aria-selected={activeTab === "manifesto"}
        >
          <span className="tab-label">MANIFESTO</span>
        </button>
        <button
          className={`mobile-tab-btn ${activeTab === "sources" ? "active" : ""}`}
          onClick={() => setActiveTab("sources")}
          aria-selected={activeTab === "sources"}
        >
          <span className="tab-label">SOURCES</span>
        </button>
        <button
          className={`mobile-tab-btn ${activeTab === "voices" ? "active" : ""}`}
          onClick={() => setActiveTab("voices")}
          aria-selected={activeTab === "voices"}
        >
          <span className="tab-label">VOICES</span>
        </button>
      </div>

      <style jsx>{`
        .manifesto-mobile-tabs {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }

        /* Horizontal Tab Bar at bottom - flush with terminal bottom and full width */
        .mobile-tab-bar {
          display: flex;
          flex-direction: row;
          gap: 0;
          padding: 0;
          margin: 0;
          margin-left: -20px !important; /* Counteract hero-text-frame horizontal padding */
          margin-right: -20px !important;
          margin-top: 0 !important;
          background: transparent;
          border-top: 1px solid rgba(202, 165, 84, 0.2);
          flex-shrink: 0;
          width: calc(100% + 40px) !important; /* Extend to full width including padding */
          position: relative;
        }

        .mobile-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 8px;
          background: transparent;
          border: none;
          border-right: 1px solid rgba(202, 165, 84, 0.1);
          cursor: pointer;
          transition: all 150ms ease;
          position: relative;
        }

        .mobile-tab-btn:last-child {
          border-right: none;
        }

        .mobile-tab-btn .tab-label {
          font-family: var(--font-data, "PT Mono", monospace);
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(236, 227, 214, 0.4);
          transition: color 150ms ease;
        }

        .mobile-tab-btn.active .tab-label {
          color: var(--gold, #caa554);
        }

        .mobile-tab-btn.active {
          background: rgba(202, 165, 84, 0.06);
        }

        .mobile-tab-btn.active::before {
          content: "";
          position: absolute;
          top: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--gold, #caa554);
        }

        .mobile-tab-btn:not(.active):hover .tab-label {
          color: rgba(236, 227, 214, 0.6);
        }

        /* Content Area */
        .mobile-tab-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          /* Hide scrollbar */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
          padding-bottom: 0; /* No bottom padding - tabs are flush */
        }

        .mobile-tab-content::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .tab-panel {
          padding: 16px;
          padding-bottom: 16px; /* Keep side/top padding, but ensure bottom is consistent */
          animation: fadeInPanel 0.3s ease;
        }

        .tab-panel--manifesto {
          padding-bottom: 0; /* Manifesto tab has no bottom padding - tabs are flush */
        }

        @keyframes fadeInPanel {
          from {
            opacity: 0;
            transform: translateX(8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Manifesto Tab */
        .tab-panel--manifesto {
          padding: 0;
        }

        /* Sources Tab */
        .sources-list-mobile {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .source-item-mobile {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: rgba(10, 9, 8, 0.5);
          border: 1px solid rgba(236, 227, 214, 0.08);
          text-decoration: none;
          transition: all 150ms ease;
        }

        .source-item-mobile:hover {
          border-color: rgba(202, 165, 84, 0.3);
          background: rgba(10, 9, 8, 0.7);
        }

        .source-number {
          font-family: var(--font-data, "PT Mono", monospace);
          font-size: 10px;
          color: var(--gold, #caa554);
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }

        .source-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .source-title {
          font-family: var(--font-body, system-ui);
          font-size: 12px;
          font-weight: 500;
          color: var(--dawn, #ece3d6);
          line-height: 1.3;
        }

        .source-author {
          font-family: var(--font-data, "PT Mono", monospace);
          font-size: 10px;
          color: rgba(236, 227, 214, 0.5);
        }

        /* Voices Tab */
        .voices-list-mobile {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .voice-item-mobile {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          background: rgba(10, 9, 8, 0.5);
          border: 1px solid rgba(236, 227, 214, 0.08);
          cursor: pointer;
          transition: all 150ms ease;
          text-align: left;
          width: 100%;
        }

        .voice-item-mobile:hover {
          border-color: rgba(202, 165, 84, 0.3);
        }

        .voice-item-mobile.expanded {
          border-color: var(--gold, #caa554);
          background: rgba(10, 9, 8, 0.7);
        }

        .voice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .voice-title {
          font-family: var(--font-body, system-ui);
          font-size: 13px;
          font-weight: 500;
          color: var(--dawn, #ece3d6);
        }

        .voice-expand-icon {
          font-family: var(--font-data, "PT Mono", monospace);
          font-size: 14px;
          color: var(--gold, #caa554);
          line-height: 1;
        }

        .voice-desc {
          font-family: var(--font-body, system-ui);
          font-size: 11px;
          color: rgba(236, 227, 214, 0.6);
          line-height: 1.4;
          margin: 0;
        }

        .voice-fulltext {
          font-family: var(--font-body, system-ui);
          font-size: 12px;
          color: rgba(236, 227, 214, 0.8);
          line-height: 1.6;
          margin: 0;
          animation: fadeInText 0.2s ease;
        }

        @keyframes fadeInText {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
