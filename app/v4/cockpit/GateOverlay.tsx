"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "tf-v4-gate-seen";
const EXIT_DURATION_MS = 800;

interface Props {
  onEnter?: () => void;
}

export function GateOverlay({ onEnter }: Props) {
  const [shouldRender, setShouldRender] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) {
      return;
    }
    setShouldRender(true);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    };
  }, []);

  const handleEnter = () => {
    if (exiting) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setExiting(true);
    window.dispatchEvent(new CustomEvent("particle-field-activate"));

    exitTimerRef.current = window.setTimeout(() => {
      document.documentElement.style.overflow = "";
      setShouldRender(false);
      onEnter?.();
    }, EXIT_DURATION_MS);
  };

  if (!shouldRender) return null;

  return (
    <div
      className="gate-overlay"
      data-exiting={exiting ? "true" : "false"}
      onClick={handleEnter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleEnter();
      }}
    >
      <div className="gate-overlay__frame">
        <div className="gate-overlay__eyebrow">
          <span className="gate-overlay__diamond" aria-hidden>
            ◆
          </span>
          <span>THOUGHTFORM · INTERFACE</span>
          <span className="gate-overlay__diamond" aria-hidden>
            ◆
          </span>
        </div>
        <div className="gate-overlay__title">ENTER THE MANIFOLD</div>
        <div className="gate-overlay__sub">
          A latent space where AI is navigated, not commanded.
        </div>
        <div className="gate-overlay__cta">
          <span className="gate-overlay__cta-arrow">{"»"}</span>
          <span>CLICK TO BEGIN</span>
          <span className="gate-overlay__cta-arrow">{"«"}</span>
        </div>
      </div>
      <style jsx>{`
        .gate-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 9, 8, 0.78);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          color: #ebe3d6;
          cursor: pointer;
          opacity: 1;
          transition:
            opacity ${EXIT_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1),
            backdrop-filter ${EXIT_DURATION_MS}ms ease-out,
            filter ${EXIT_DURATION_MS}ms ease-out;
        }
        .gate-overlay[data-exiting="true"] {
          opacity: 0;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          filter: blur(16px);
          pointer-events: none;
        }
        .gate-overlay__frame {
          position: relative;
          padding: 56px 80px;
          text-align: center;
          transform: scale(1);
          transition: transform ${EXIT_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gate-overlay[data-exiting="true"] .gate-overlay__frame {
          transform: scale(1.08);
        }
        .gate-overlay__frame::before,
        .gate-overlay__frame::after {
          content: "";
          position: absolute;
          width: 28px;
          height: 28px;
          border-color: rgba(202, 165, 84, 0.55);
        }
        .gate-overlay__frame::before {
          top: 0;
          left: 0;
          border-top: 1px solid;
          border-left: 1px solid;
        }
        .gate-overlay__frame::after {
          bottom: 0;
          right: 0;
          border-bottom: 1px solid;
          border-right: 1px solid;
        }
        .gate-overlay__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10px;
          letter-spacing: 0.22em;
          color: rgba(235, 227, 214, 0.55);
          margin-bottom: 28px;
          text-transform: uppercase;
        }
        .gate-overlay__diamond {
          color: #caa554;
          font-size: 8px;
        }
        .gate-overlay__title {
          font-family: var(--font-serif-display, Georgia, serif);
          font-size: clamp(32px, 5vw, 56px);
          line-height: 1.05;
          letter-spacing: 0.04em;
          color: #ebe3d6;
          margin-bottom: 18px;
        }
        .gate-overlay__sub {
          font-family: var(--font-sans, system-ui, sans-serif);
          font-size: 14px;
          color: rgba(235, 227, 214, 0.6);
          max-width: 34ch;
          margin: 0 auto 36px;
          font-style: italic;
        }
        .gate-overlay__cta {
          display: inline-flex;
          gap: 14px;
          align-items: center;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11px;
          letter-spacing: 0.3em;
          color: #caa554;
          text-transform: uppercase;
          padding: 14px 22px;
          border: 1px solid rgba(202, 165, 84, 0.4);
          background: rgba(202, 165, 84, 0.04);
          transition:
            background-color 200ms ease,
            border-color 200ms ease;
        }
        .gate-overlay:hover .gate-overlay__cta {
          background: rgba(202, 165, 84, 0.1);
          border-color: rgba(202, 165, 84, 0.7);
        }
        .gate-overlay__cta-arrow {
          color: rgba(202, 165, 84, 0.5);
        }
      `}</style>
    </div>
  );
}
