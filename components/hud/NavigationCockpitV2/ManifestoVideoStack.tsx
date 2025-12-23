"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// ═══════════════════════════════════════════════════════════════════
// MANIFESTO VIDEO STACK - Atlas Entity Card Style
// Stacked video cards that play on hover, with expanded modal view
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
}

// Placeholder cards - replace with actual video content
const PLACEHOLDER_CARDS: VideoCard[] = [
  {
    id: "card-1",
    videoUrl: "", // Add video URL when available
    thumbnail: "",
    title: "AI as Intelligence",
    description: "It leaps across dimensions we can't fathom.",
    fullText:
      "AI isn't just a tool—it's a strange, new intelligence that leaps across dimensions we can't fully comprehend. It sees patterns in places we've never looked.",
    role: "Manifesto",
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
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
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
    const cardRevealStart = index * 0.15; // Stagger by 15% each
    const cardProgress = Math.max(0, (revealProgress - cardRevealStart) / 0.3);
    return Math.min(1, cardProgress);
  };

  return (
    <div className="video-stack-container">
      {/* Stack of cards */}
      <div className="video-stack">
        {cards.map((card, index) => {
          const isActive = activeCardIndex === index;
          const isHovered = hoveredCard === card.id;
          const stackOffset = index * 12; // Offset for stack effect
          const rotation = (index - 1) * 2; // Slight rotation: -2, 0, 2 degrees
          const cardOpacity = getCardOpacity(index);

          return (
            <article
              key={card.id}
              className={`video-card ${isActive ? "active" : ""} ${isHovered ? "hovered" : ""}`}
              style={{
                transform: `
                  translateX(${stackOffset}px)
                  translateY(${stackOffset}px)
                  rotate(${rotation}deg)
                  ${isHovered ? "translateY(-8px) scale(1.02)" : ""}
                `,
                zIndex: isHovered ? 50 : cards.length - index,
                opacity: cardOpacity,
                animationDelay: `${index * 0.1}s`,
              }}
              onMouseEnter={() => {
                setHoveredCard(card.id);
                setActiveCardIndex(index);
              }}
              onMouseLeave={() => {
                setHoveredCard(null);
                setActiveCardIndex(null);
              }}
              onClick={() => setExpandedCard(card)}
            >
              {/* Outer glow */}
              <div className="card-glow" />

              {/* Corner accents */}
              <div className="corner-accent tl" />
              <div className="corner-accent br" />

              {/* Media container */}
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
                    <span className="placeholder-icon">▶</span>
                  </div>
                )}

                {/* Scanlines (appear on hover) */}
                <div className="scanlines" />

                {/* Gradient overlay */}
                <div className="card-gradient" />
              </div>

              {/* Info overlay - Atlas glassmorphism style */}
              <div className="card-info">
                {/* Title */}
                <h4 className="card-title">{card.title}</h4>

                {/* Description */}
                <p className="card-description">{card.description}</p>

                {/* Meta row */}
                {card.role && (
                  <div className="card-meta">
                    <span className="card-role">{card.role}</span>
                    <span className="card-indicator">◆</span>
                  </div>
                )}
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
          EXPANDED MODAL - Atlas Style
          ═══════════════════════════════════════════════════════════════════ */}
      {expandedCard &&
        createPortal(
          <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-card">
              {/* Scan line animation */}
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
                    <span className="modal-placeholder-icon">▶</span>
                    <span className="modal-placeholder-text">VIDEO COMING SOON</span>
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="modal-gradient" />
              </div>

              {/* Header - glassmorphism (Atlas style) */}
              <div className="modal-header">
                <span className="modal-header-brand">THOUGHTFORM</span>
                <span className="modal-header-mode">
                  MODE: <span className="modal-header-value">PLAYBACK</span>
                </span>
                <div className="modal-header-right">
                  <span className="modal-header-time">
                    [<span className="modal-header-value">{formatTime(elapsedTime)}</span>]
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

              {/* Footer - glassmorphism (Atlas style) */}
              <div className="modal-footer">
                <div className="modal-footer-left">
                  <h2 className="modal-title">{expandedCard.title.toUpperCase()}</h2>
                  <div className="modal-meta">
                    {expandedCard.role && (
                      <span className="modal-role">{expandedCard.role.toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div className="modal-footer-right">
                  <p className="modal-description">
                    {expandedCard.fullText || expandedCard.description}
                  </p>
                </div>
              </div>

              {/* Corner accents */}
              <div className="modal-corner tl" />
              <div className="modal-corner tr" />
              <div className="modal-corner bl" />
              <div className="modal-corner br" />
            </div>
          </div>,
          document.body
        )}

      <style jsx>{`
        .video-stack-container {
          position: fixed;
          /* Mirror the Sources positioning - close to the right rail
             Sources are at left: 160px, add extra for card width balance */
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

        /* ─── CARD STYLING (Atlas-inspired) ─── */
        .video-card {
          position: absolute;
          width: 220px;
          height: 293px;
          cursor: pointer;
          background: var(--surface-0, #0a0908);
          border: 1px solid rgba(236, 227, 214, 0.08);
          transition: all 0.35s cubic-bezier(0.19, 1, 0.22, 1);
          overflow: hidden;
        }

        .video-card:hover {
          border-color: rgba(236, 227, 214, 0.3);
        }

        .video-card.hovered {
          box-shadow:
            0 0 0 1px rgba(236, 227, 214, 0.03),
            0 20px 50px -15px rgba(0, 0, 0, 0.5);
        }

        /* Outer glow */
        .card-glow {
          position: absolute;
          inset: -20px;
          background: radial-gradient(
            ellipse 60% 70% at 50% 45%,
            rgba(202, 165, 84, 0.08) 0%,
            rgba(202, 165, 84, 0.03) 40%,
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .video-card:hover .card-glow {
          opacity: 1;
        }

        /* Corner accents */
        .corner-accent {
          position: absolute;
          width: 12px;
          height: 12px;
          border: 1px solid rgba(236, 227, 214, 0.15);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
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

        /* ─── MEDIA CONTAINER ─── */
        .card-media {
          position: relative;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, rgba(15, 14, 12, 1) 0%, rgba(10, 9, 8, 1) 100%);
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
          background: linear-gradient(180deg, rgba(20, 18, 15, 1) 0%, rgba(10, 9, 8, 1) 100%);
        }

        .placeholder-icon {
          font-size: 24px;
          color: rgba(202, 165, 84, 0.3);
          transition: all 0.3s ease;
        }

        .video-card:hover .placeholder-icon {
          color: rgba(202, 165, 84, 0.6);
          transform: scale(1.1);
        }

        /* Scanlines */
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

        /* Gradient overlay */
        .card-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(5, 4, 3, 0.1) 0%,
            transparent 30%,
            transparent 50%,
            rgba(5, 4, 3, 0.4) 75%,
            rgba(5, 4, 3, 0.95) 100%
          );
          pointer-events: none;
        }

        /* ─── INFO OVERLAY (Glassmorphism) ─── */
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
          font-family: "Iosevka Web", "Iosevka", "PT Mono", monospace;
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
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 9px;
          line-height: 1.5;
          color: rgba(236, 227, 214, 0.6);
          letter-spacing: 0.02em;
        }

        .card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(236, 227, 214, 0.08);
        }

        .card-role {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 7px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(236, 227, 214, 0.3);
        }

        .card-indicator {
          font-size: 8px;
          color: var(--gold, #caa554);
          opacity: 0.6;
        }

        /* ─── STACK LABEL ─── */
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
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold, #caa554);
          opacity: 0.5;
        }

        /* ═══════════════════════════════════════════════════════════════════
           EXPANDED MODAL STYLES (Atlas-inspired)
           ═══════════════════════════════════════════════════════════════════ */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: rgba(5, 4, 3, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
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

        .modal-card {
          position: relative;
          width: min(calc(100vh * 0.8), 640px);
          max-width: calc(100vw - 80px);
          aspect-ratio: 4/5;
          background: #050403;
          border: 1px solid rgba(236, 227, 214, 0.1);
          overflow: hidden;
          display: grid;
          grid-template-rows: 36px 1fr 120px;
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

        /* Scan line */
        .modal-scanline {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to bottom, rgba(202, 165, 84, 0.5), transparent);
          z-index: 100;
          animation: modalScan 10s linear infinite;
          pointer-events: none;
        }

        @keyframes modalScan {
          0% {
            top: 0;
            opacity: 0;
          }
          5% {
            opacity: 0.7;
          }
          95% {
            opacity: 0.7;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        /* Modal media */
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
          gap: 16px;
          background: linear-gradient(180deg, rgba(20, 18, 15, 1) 0%, rgba(10, 9, 8, 1) 100%);
        }

        .modal-placeholder-icon {
          font-size: 48px;
          color: rgba(202, 165, 84, 0.3);
        }

        .modal-placeholder-text {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: rgba(236, 227, 214, 0.3);
        }

        .modal-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(5, 4, 3, 0.4) 0%,
            rgba(5, 4, 3, 0.15) 30%,
            rgba(5, 4, 3, 0.15) 60%,
            rgba(5, 4, 3, 0.7) 100%
          );
          pointer-events: none;
        }

        /* Modal header */
        .modal-header {
          position: relative;
          z-index: 10;
          background: rgba(10, 9, 8, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(236, 227, 214, 0.1);
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 16px;
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
        }

        .modal-header-brand {
          color: var(--gold, #caa554);
          text-transform: uppercase;
        }

        .modal-header-mode {
          color: rgba(236, 227, 214, 0.3);
        }

        .modal-header-value {
          color: rgba(236, 227, 214, 0.6);
        }

        .modal-header-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-header-time {
          color: rgba(236, 227, 214, 0.3);
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
          transition: color 0.2s ease;
        }

        .modal-close-btn:hover {
          color: rgba(236, 227, 214, 0.9);
        }

        /* Modal footer */
        .modal-footer {
          position: relative;
          z-index: 10;
          background: rgba(10, 9, 8, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(236, 227, 214, 0.1);
          padding: 16px 20px;
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 24px;
        }

        .modal-footer-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .modal-title {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 22px;
          font-weight: 400;
          color: var(--gold, #caa554);
          letter-spacing: 0.1em;
          line-height: 1;
          margin: 0;
        }

        .modal-meta {
          margin-top: 8px;
        }

        .modal-role {
          font-family: "Iosevka Web", "Iosevka", monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: rgba(236, 227, 214, 0.4);
        }

        .modal-footer-right {
          display: flex;
          align-items: center;
          border-left: 1px solid rgba(236, 227, 214, 0.08);
          padding-left: 24px;
        }

        .modal-description {
          font-family: var(--font-sans, "Inter", sans-serif);
          font-size: 13px;
          color: rgba(236, 227, 214, 0.6);
          line-height: 1.7;
          margin: 0;
        }

        /* Modal corner accents */
        .modal-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 1px solid rgba(236, 227, 214, 0.2);
          pointer-events: none;
          z-index: 50;
        }

        .modal-corner.tl {
          top: -1px;
          left: -1px;
          border-right: none;
          border-bottom: none;
        }

        .modal-corner.tr {
          top: -1px;
          right: -1px;
          border-left: none;
          border-bottom: none;
        }

        .modal-corner.bl {
          bottom: -1px;
          left: -1px;
          border-right: none;
          border-top: none;
        }

        .modal-corner.br {
          bottom: -1px;
          right: -1px;
          border-left: none;
          border-top: none;
        }

        /* ─── RESPONSIVE ─── */
        /* Mirroring Sources positioning - adjust on smaller screens */
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
            height: 267px;
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
            height: 240px;
          }

          .card-info {
            padding: 10px;
          }

          .card-title {
            font-size: 9px;
          }

          .card-description {
            font-size: 8px;
          }

          .modal-footer {
            grid-template-columns: 1fr;
            gap: 12px;
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
