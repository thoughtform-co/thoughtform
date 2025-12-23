"use client";

import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// MANIFESTO VIDEO STACK - Atlas Entity Card Style
// Stacked video cards that play on hover
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
    role: "Manifesto",
  },
  {
    id: "card-2",
    videoUrl: "",
    thumbnail: "",
    title: "Navigate Strangeness",
    description: "The source of truly novel ideas.",
    role: "Manifesto",
  },
  {
    id: "card-3",
    videoUrl: "",
    thumbnail: "",
    title: "Think WITH AI",
    description: "Navigating its strangeness for creative breakthroughs.",
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
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

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
              onClick={() => setActiveCardIndex(isActive ? null : index)}
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

      <style jsx>{`
        .video-stack-container {
          position: fixed;
          /* Position centered between terminal right edge and right rail
             Using right positioning with transform to center in available space */
          right: calc(var(--rail-width, 48px) + 70px);
          top: 50%;
          transform: translateY(-50%);
          z-index: 50; /* Below the terminal (z-index 100) */
          display: flex;
          flex-direction: column;
          align-items: center;
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
          width: 200px;
          height: 267px;
        }

        /* ─── CARD STYLING (Atlas-inspired) ─── */
        .video-card {
          position: absolute;
          width: 200px;
          height: 267px;
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

        /* ─── RESPONSIVE ─── */
        /* On smaller screens, reduce gap and card size to fit between manifesto and rail */
        @media (max-width: 1400px) {
          .video-stack-container {
            right: calc(var(--rail-width, 48px) + 60px);
          }

          .video-stack {
            width: 180px;
            height: 240px;
          }

          .video-card {
            width: 180px;
            height: 240px;
          }
        }

        @media (max-width: 1200px) {
          .video-stack-container {
            right: calc(var(--rail-width, 48px) + 50px);
          }

          .video-stack {
            width: 160px;
            height: 213px;
          }

          .video-card {
            width: 160px;
            height: 213px;
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
