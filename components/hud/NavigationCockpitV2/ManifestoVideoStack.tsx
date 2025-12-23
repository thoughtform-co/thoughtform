"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// ═══════════════════════════════════════════════════════════════════
// MANIFESTO VIDEO STACK - Atlas Entity Card Style (Exact Match)
// Stacked video cards that play on hover, with expanded modal view
// Following: atlas/src/components/constellation/EntityCard.tsx
// ═══════════════════════════════════════════════════════════════════

interface VideoCard {
  id: string;
  /** Video source URL */
  videoUrl: string;
  /** Thumbnail/poster image */
  thumbnail?: string;
  /** Speaker name or title */
  title: string;
  /** Short description or quote */
  description: string;
  /** Full quote or extended text for modal */
  fullText?: string;
  /** Optional speaker role/affiliation */
  role?: string;
  /** Optional type label */
  type?: string;
}

// Placeholder cards - replace with actual video content
const PLACEHOLDER_CARDS: VideoCard[] = [
  {
    id: "card-1",
    videoUrl: "",
    thumbnail: "",
    title: "AI as Intelligence",
    description: "It leaps across dimensions we can't fathom.",
    fullText:
      "AI isn't just a tool—it's a strange, new intelligence that leaps across dimensions we can't fully comprehend. It sees patterns in places we've never looked.",
    role: "Manifesto",
    type: "Voice",
  },
  {
    id: "card-2",
    videoUrl: "",
    thumbnail: "",
    title: "Navigate Strangeness",
    description: "The source of truly novel ideas.",
    fullText:
      "In technical work, AI's strangeness must be constrained. But in creative and strategic work, that strangeness becomes the source of truly novel ideas.",
    role: "Manifesto",
    type: "Voice",
  },
  {
    id: "card-3",
    videoUrl: "",
    thumbnail: "",
    title: "Think WITH AI",
    description: "Navigating its strangeness for creative breakthroughs.",
    fullText:
      "Thoughtform teaches teams to think WITH that intelligence—not against it, not around it—navigating its strangeness for creative breakthroughs.",
    role: "Manifesto",
    type: "Voice",
  },
];

interface ManifestoVideoStackProps {
  /** Whether the stack is visible */
  isVisible: boolean;
  /** Cards to display (defaults to placeholder) */
  cards?: VideoCard[];
  /** Optional: reveal progress for staggered entrance */
  revealProgress?: number;
}

export function ManifestoVideoStack({
  isVisible,
  cards = PLACEHOLDER_CARDS,
  revealProgress = 1,
}: ManifestoVideoStackProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<VideoCard | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // Control video playback based on hover state
  useEffect(() => {
    cards.forEach((card) => {
      const video = videoRefs.current.get(card.id);
      if (video) {
        if (hoveredCard === card.id && card.videoUrl) {
          video.play().catch(() => {
            // Autoplay may be blocked
          });
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [hoveredCard, cards]);

  // Elapsed time for modal (mimicking Atlas)
  useEffect(() => {
    if (!expandedCard) {
      setElapsedTime(0);
      return;
    }
    const interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [expandedCard]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expandedCard) {
        setExpandedCard(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedCard]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setExpandedCard(null);
    }
  }, []);

  // Format time like Atlas modal
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  if (!isVisible) return null;

  // Calculate staggered reveal for each card
  const getCardOpacity = (index: number) => {
    const cardRevealStart = index * 0.15;
    const cardProgress = Math.max(0, (revealProgress - cardRevealStart) / 0.3);
    return Math.min(1, cardProgress);
  };

  return (
    <div className="video-stack-container">
      {/* Stack of cards */}
      <div className="video-stack">
        {cards.map((card, index) => {
          const isHovered = hoveredCard === card.id;
          const stackOffset = index * 4; // Offset for stack effect (matching Atlas stacked hint)
          const rotation = (index % 2 === 0 ? 1 : -1) * 0.8; // Slight rotation like Atlas
          const cardOpacity = getCardOpacity(index);

          return (
            <article
              key={card.id}
              className={`video-card group ${isHovered ? "hovered" : ""}`}
              style={{
                left: `${stackOffset}px`,
                top: `${stackOffset}px`,
                transform: `rotate(${rotation}deg) ${isHovered ? "translateY(-2px)" : ""}`,
                zIndex: isHovered ? 50 : cards.length - index,
                opacity: cardOpacity,
              }}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setExpandedCard(card)}
            >
              {/* Outer glow - exact Atlas style */}
              <div className="card-glow" />

              {/* Corner bracket accents - exact Atlas style */}
              <div className="corner-accent tl" />
              <div className="corner-accent br" />

              {/* Main frame */}
              <div className="card-frame">
                {/* Media container - 3:4 aspect ratio like Atlas */}
                <div className="card-media">
                  {/* Video (plays on hover) */}
                  {card.videoUrl ? (
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current.set(card.id, el);
                      }}
                      src={card.videoUrl}
                      poster={card.thumbnail}
                      loop
                      muted
                      playsInline
                      className="card-video"
                    />
                  ) : (
                    /* Placeholder background */
                    <div className="card-placeholder">
                      <span className="placeholder-letter">{card.title[0]}</span>
                    </div>
                  )}

                  {/* Gradient overlay for readability - exact Atlas style */}
                  <div className="card-gradient" />

                  {/* Scanlines (appear on hover) - exact Atlas style */}
                  <div className="scanlines" />
                </div>

                {/* Info overlay - Atlas glassmorphism style */}
                <div className="card-info">
                  {/* Title */}
                  <h3 className="card-title">{card.title}</h3>

                  {/* Description - only show if available */}
                  <p className="card-description">{card.description}</p>

                  {/* Meta row - exact Atlas style */}
                  <div className="card-meta">
                    <span className="card-type">
                      TYPE <span>{card.type || "Voice"}</span>
                    </span>
                    <span className="card-indicator">◆</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Label */}
      <div className="stack-label">
        <span className="label-dot">◆</span>
        <span className="label-text">VOICES</span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          EXPANDED MODAL - Exact DenizenModalV3 Layout
          3-column grid: 150px | 1fr | 150px
          3-row grid: 32px | 1fr | 110px
          ═══════════════════════════════════════════════════════════════════ */}
      {expandedCard &&
        createPortal(
          <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-card">
              {/* Scan line animation - exact Atlas style */}
              <div className="modal-scanline" />

              {/* Full-bleed media background */}
              <div className="modal-media">
                {expandedCard.videoUrl ? (
                  <video
                    ref={modalVideoRef}
                    src={expandedCard.videoUrl}
                    poster={expandedCard.thumbnail}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="modal-video"
                  />
                ) : (
                  <div className="modal-placeholder">
                    <div className="modal-placeholder-box">◇</div>
                    <span className="modal-placeholder-text">[VIDEO COMING SOON]</span>
                  </div>
                )}
                {/* Gradient overlay - exact DenizenModalV3 */}
                <div className="modal-gradient" />
              </div>

              {/* Header - glassmorphism spanning all columns */}
              <div className="modal-header">
                <span className="modal-header-brand">THOUGHTFORM</span>
                <span className="modal-header-data">
                  MODE: <span>PLAYBACK</span>
                </span>
                <span className="modal-header-data">
                  SIG: <span>0.946</span>
                </span>
                <div className="modal-header-right">
                  <span className="modal-header-data">
                    EPOCH: <span>4.2847</span>
                  </span>
                  <span className="modal-header-data">
                    [<span>{formatTime(elapsedTime)}</span>]
                  </span>
                  <button
                    className="modal-close-btn"
                    onClick={() => setExpandedCard(null)}
                    title="Close"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Left Column - glassmorphism with minimal background */}
              <div className="modal-left-col">
                <div className="modal-readout">
                  <div className="readout-label">▸ Source</div>
                  <div className="readout-value">
                    {expandedCard.role?.toUpperCase() || "MANIFESTO"}
                  </div>
                </div>
                <div className="modal-readout">
                  <div className="readout-label">▸ Type</div>
                  <div className="readout-value">{expandedCard.type?.toUpperCase() || "VOICE"}</div>
                </div>
                <div className="modal-readout">
                  <div className="readout-label">▸ Status</div>
                  <div className="readout-value-alert">ACTIVE</div>
                </div>
              </div>

              {/* Center - transparent to show background media */}
              <div className="modal-center">
                {/* Coordinates display - centered above visual */}
                <div className="modal-coords">
                  <span className="coord-label">◆</span>
                  <span className="coord-value">VOICE</span>
                </div>
              </div>

              {/* Right Column - glassmorphism with minimal background */}
              <div className="modal-right-col">
                <div className="modal-readout">
                  <div className="readout-label">▸ Duration</div>
                  <div className="readout-value">{formatTime(elapsedTime)}</div>
                </div>
                <div className="modal-readout">
                  <div className="readout-label">▸ Signal</div>
                  <div className="readout-value">0.946</div>
                </div>
                <div className="modal-readout">
                  <div className="readout-label">▸ Clarity</div>
                  <div className="readout-value-dynamics">NOMINAL</div>
                </div>
              </div>

              {/* Footer - glassmorphism spanning all columns */}
              <div className="modal-footer">
                <div className="modal-footer-left">
                  <div className="modal-name">{expandedCard.title.toUpperCase()}</div>
                  <div className="modal-meta">
                    <div className="modal-meta-line">
                      TYPE <span>{expandedCard.type?.toUpperCase() || "VOICE"}</span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer-right">
                  <div className="modal-bio">
                    {expandedCard.fullText || expandedCard.description}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      <style jsx>{`
        /* ═══════════════════════════════════════════════════════════════════
           VIDEO STACK CONTAINER
           ═══════════════════════════════════════════════════════════════════ */
        .video-stack-container {
          position: fixed;
          right: 200px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
          animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }

        .video-stack {
          position: relative;
          width: 220px;
          height: 293px;
        }

        /* ═══════════════════════════════════════════════════════════════════
           CARD STYLING - Exact Atlas EntityCard.tsx Match
           ═══════════════════════════════════════════════════════════════════ */
        .video-card {
          position: absolute;
          width: 220px;
          cursor: pointer;
        }

        /* Outer glow - exact Atlas radial gradient */
        .card-glow {
          position: absolute;
          inset: -30px;
          background: radial-gradient(
            ellipse 60% 70% at 50% 45%,
            rgba(236, 227, 214, 0.08) 0%,
            rgba(236, 227, 214, 0.03) 40%,
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .video-card:hover .card-glow {
          opacity: 1;
        }

        /* Corner bracket accents - exact Atlas style */
        .corner-accent {
          position: absolute;
          width: 12px;
          height: 12px;
          border: 1px solid var(--dawn-15, rgba(236, 227, 214, 0.15));
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 10;
        }

        .corner-accent.tl {
          top: -1px;
          left: -1px;
          border-right: none;
          border-bottom: none;
        }

        .corner-accent.br {
          bottom: -1px;
          right: -1px;
          border-left: none;
          border-top: none;
        }

        .video-card:hover .corner-accent {
          opacity: 1;
        }

        /* Main frame - exact Atlas styling */
        .card-frame {
          position: relative;
          width: 220px;
          overflow: hidden;
          border: 1px solid var(--dawn-08, rgba(236, 227, 214, 0.08));
          background: var(--surface-0, #0a0908);
          transition: all 0.25s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .video-card:hover .card-frame {
          border-color: var(--dawn-30, rgba(236, 227, 214, 0.3));
          transform: translateY(-2px);
          box-shadow:
            0 0 0 1px rgba(236, 227, 214, 0.03),
            0 20px 50px -15px rgba(0, 0, 0, 0.5);
        }

        /* Media container - 3:4 aspect ratio like Atlas */
        .card-media {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          background: linear-gradient(
            180deg,
            var(--surface-1, #0f0e0c) 0%,
            var(--surface-0, #0a0908) 100%
          );
          overflow: hidden;
        }

        .card-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .video-card:hover .card-video {
          transform: scale(1.03);
        }

        .card-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            180deg,
            var(--surface-1, #0f0e0c) 0%,
            var(--surface-0, #0a0908) 100%
          );
        }

        .placeholder-letter {
          font-family: var(--font-mono, "Iosevka Web", "PT Mono", monospace);
          font-size: 4rem;
          color: var(--dawn-08, rgba(236, 227, 214, 0.08));
          transition: color 0.3s ease;
        }

        .video-card:hover .placeholder-letter {
          color: var(--dawn-15, rgba(236, 227, 214, 0.15));
        }

        /* Gradient overlay - exact Atlas style */
        .card-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(5, 4, 3, 0.1) 0%,
            transparent 30%,
            transparent 50%,
            rgba(5, 4, 3, 0.4) 80%,
            rgba(5, 4, 3, 0.85) 100%
          );
          pointer-events: none;
        }

        /* Scanlines - exact Atlas style */
        .scanlines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
          );
          transition: opacity 0.3s ease;
        }

        .video-card:hover .scanlines {
          opacity: 1;
        }

        /* ═══════════════════════════════════════════════════════════════════
           INFO OVERLAY - Exact Atlas Glassmorphism
           ═══════════════════════════════════════════════════════════════════ */
        .card-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 14px;
          background: rgba(10, 9, 8, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(236, 227, 214, 0.1);
        }

        .card-title {
          font-family: var(--font-mono, "Iosevka Web", "PT Mono", monospace);
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--dawn, #ece3d6);
          line-height: 1.35;
          margin: 0;
          transition: color 0.2s ease;
        }

        .video-card:hover .card-title {
          color: white;
        }

        .card-description {
          margin: 6px 0 0 0;
          font-family: var(--font-mono, "Iosevka Web", monospace);
          font-size: 8px;
          line-height: 1.5;
          color: var(--dawn-50, rgba(236, 227, 214, 0.5));
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Meta row - exact Atlas style */
        .card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--dawn-08, rgba(236, 227, 214, 0.08));
        }

        .card-type {
          font-family: var(--font-mono, "Iosevka Web", monospace);
          font-size: 7px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--dawn-30, rgba(236, 227, 214, 0.3));
        }

        .card-type span {
          color: var(--dawn-50, rgba(236, 227, 214, 0.5));
        }

        .card-indicator {
          font-size: 8px;
          color: var(--gold, #caa554);
        }

        /* ═══════════════════════════════════════════════════════════════════
           STACK LABEL
           ═══════════════════════════════════════════════════════════════════ */
        .stack-label {
          display: flex;
          align-items: center;
          gap: 6px;
          padding-left: 8px;
        }

        .label-dot {
          font-size: 10px;
          color: var(--gold, #caa554);
          opacity: 0.5;
        }

        .label-text {
          font-family: var(--font-mono, "Iosevka Web", monospace);
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold, #caa554);
          opacity: 0.5;
        }

        /* ═══════════════════════════════════════════════════════════════════
           MODAL - Exact Atlas EntityCardPreview.module.css Match
           ═══════════════════════════════════════════════════════════════════ */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: rgba(5, 4, 3, 0.3);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: modalFadeIn 0.3s ease-out forwards;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Card - exact DenizenModalV3 grid layout: 150px | 1fr | 150px */
        .modal-card {
          position: relative;
          width: min(calc(100vh * 0.8), 720px);
          max-width: calc(100vw - 80px);
          aspect-ratio: 4 / 5;
          background: #050403;
          overflow: hidden;
          display: grid;
          grid-template-columns: 150px 1fr 150px;
          grid-template-rows: 32px 1fr 110px;
          gap: 1px;
          border: 1px solid rgba(236, 227, 214, 0.08);
          animation: modalCardIn 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }

        @keyframes modalCardIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Scanline - exact Atlas animation */
        .modal-scanline {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to bottom, rgba(202, 165, 84, 0.4), transparent);
          z-index: 100;
          animation: modalScan 12s linear infinite;
          pointer-events: none;
        }

        @keyframes modalScan {
          0% {
            top: 0;
            opacity: 0;
          }
          5% {
            opacity: 0.6;
          }
          95% {
            opacity: 0.6;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        /* Full-bleed media background - exact Atlas style */
        .modal-media {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .modal-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .modal-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--void, #050403);
        }

        .modal-placeholder-box {
          width: 100px;
          height: 100px;
          border: 1px dashed rgba(236, 227, 214, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: rgba(236, 227, 214, 0.3);
        }

        .modal-placeholder-text {
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(236, 227, 214, 0.3);
        }

        .modal-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(5, 4, 3, 0.4) 0%,
            rgba(5, 4, 3, 0.2) 50%,
            rgba(5, 4, 3, 0.6) 100%
          );
          pointer-events: none;
        }

        /* Header - exact Atlas EntityCardPreview.module.css */
        .modal-header {
          grid-column: 1 / -1;
          background: rgba(10, 9, 8, 0.1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          padding: 0 12px;
          font-size: 9px;
          letter-spacing: 0.1em;
          gap: 12px;
          border-bottom: 1px solid rgba(236, 227, 214, 0.12);
          position: relative;
          z-index: 10;
        }

        .modal-header-brand {
          color: var(--gold, #caa554);
          text-transform: uppercase;
          font-family: var(--font-mono, "PT Mono", monospace);
        }

        .modal-header-data {
          color: rgba(236, 227, 214, 0.3);
          font-family: var(--font-mono, "PT Mono", monospace);
        }

        .modal-header-data span {
          color: rgba(236, 227, 214, 0.5);
        }

        .modal-header-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-close-btn {
          background: none;
          border: none;
          width: 24px;
          height: 24px;
          padding: 0;
          cursor: pointer;
          color: rgba(236, 227, 214, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .modal-close-btn:hover {
          color: rgba(236, 227, 214, 0.8);
        }

        /* Left Column - exact DenizenModalV3 glassmorphism */
        .modal-left-col {
          display: flex;
          flex-direction: column;
          gap: 1px;
          position: relative;
          z-index: 10;
          background: rgba(5, 4, 3, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-right: 1px solid rgba(236, 227, 214, 0.08);
        }

        /* Readout panels - exact DenizenModalV3 styling */
        .modal-readout {
          background: rgba(5, 4, 3, 0.03);
          padding: 8px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          border-bottom: 1px solid rgba(236, 227, 214, 0.06);
        }

        .readout-label {
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(236, 227, 214, 0.4);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .readout-value {
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 10px;
          color: var(--gold, #caa554);
          text-align: center;
          letter-spacing: 0.05em;
          margin-top: auto;
        }

        .readout-value-alert {
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 10px;
          color: #c17f59;
          text-align: center;
          letter-spacing: 0.05em;
          margin-top: auto;
        }

        .readout-value-dynamics {
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 10px;
          color: #5b8a7a;
          text-align: center;
          letter-spacing: 0.05em;
          margin-top: auto;
        }

        /* Center - transparent to show background media */
        .modal-center {
          background: transparent;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .modal-coords {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 15;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 9px;
          color: rgba(236, 227, 214, 0.4);
          letter-spacing: 0.08em;
        }

        .coord-label {
          color: var(--gold, #caa554);
        }

        .coord-value {
          color: rgba(236, 227, 214, 0.5);
        }

        /* Right Column - exact DenizenModalV3 glassmorphism */
        .modal-right-col {
          display: flex;
          flex-direction: column;
          gap: 1px;
          position: relative;
          z-index: 10;
          background: rgba(5, 4, 3, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-left: 1px solid rgba(236, 227, 214, 0.08);
        }

        /* Footer - exact DenizenModalV3 glassmorphism */
        .modal-footer {
          grid-column: 1 / -1;
          position: relative;
          z-index: 10;
          background: rgba(10, 9, 8, 0.1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(236, 227, 214, 0.12);
          padding: 12px 28px;
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 20px;
        }

        .modal-footer-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .modal-name {
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 24px;
          color: var(--gold, #caa554);
          letter-spacing: 0.1em;
          line-height: 1;
          text-transform: uppercase;
        }

        .modal-meta {
          margin-top: 8px;
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .modal-meta-line {
          color: rgba(236, 227, 214, 0.3);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .modal-meta-line span {
          color: rgba(236, 227, 214, 0.5);
        }

        .modal-footer-right {
          display: flex;
          align-items: flex-start;
          border-left: 1px solid rgba(236, 227, 214, 0.08);
          padding-left: 24px;
          padding-top: 4px;
          padding-bottom: 4px;
        }

        .modal-bio {
          font-family: var(--font-sans, "IBM Plex Sans", sans-serif);
          font-size: 12px;
          color: rgba(236, 227, 214, 0.5);
          line-height: 1.6;
        }

        /* ═══════════════════════════════════════════════════════════════════
           RESPONSIVE
           ═══════════════════════════════════════════════════════════════════ */
        @media (max-width: 1400px) {
          .video-stack-container {
            right: 160px;
          }

          .video-stack {
            width: 200px;
            height: 267px;
          }

          .video-card {
            width: 200px;
          }

          .card-frame {
            width: 200px;
          }
        }

        @media (max-width: 1200px) {
          .video-stack-container {
            right: 120px;
          }

          .video-stack {
            width: 180px;
            height: 240px;
          }

          .video-card {
            width: 180px;
          }

          .card-frame {
            width: 180px;
          }

          .card-info {
            padding: 10px;
          }

          .card-title {
            font-size: 9px;
          }

          .card-description {
            font-size: 7px;
          }

          /* Modal responsive - collapse side columns */
          .modal-card {
            width: 100%;
            max-width: 500px;
            grid-template-columns: 1fr;
            grid-template-rows: 32px 1fr 120px;
          }

          .modal-left-col,
          .modal-right-col {
            display: none;
          }

          .modal-footer {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 14px 20px;
          }

          .modal-footer-right {
            border-left: none;
            border-top: 1px solid rgba(236, 227, 214, 0.08);
            padding-left: 0;
            padding-top: 12px;
          }
        }

        /* Hide on narrow screens where there's no room */
        @media (max-width: 1024px) {
          .video-stack-container {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default ManifestoVideoStack;
