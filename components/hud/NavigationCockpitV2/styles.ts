// ═══════════════════════════════════════════════════════════════════
// NAVIGATION COCKPIT V2 STYLES
// Extracted from inline JSX styles for better maintainability
// ═══════════════════════════════════════════════════════════════════

export const cockpitStyles = `
  /* Hero section and layout */
  .section-hero {
    position: relative;
    min-height: 100vh;
    height: 100vh;
  }

  .hero-layout {
    position: relative;
    width: 100%;
    height: 100vh;
  }

  /* Hero main container - Logo + Text in Stack */
  /* Wordmark container - slides from hero (top) to definition (mid-left, above frame) */
  .hero-wordmark-container {
    position: fixed;
    /* top is now controlled by inline style for animation */
    left: calc(var(--rail-width) + 120px);
    z-index: 10;
  }

  .hero-wordmark-topleft {
    width: 400px;
  }

  .hero-wordmark-topleft svg {
    width: 100%;
    height: auto;
  }

  /* Fade embedded brandmark (gold paths) using CSS variable */
  .hero-wordmark-topleft svg .st0 {
    opacity: var(--brandmark-opacity, 1);
    transition: opacity 0.1s ease-out;
  }

  /* Definition Wordmark - positioned within the same container */
  .definition-wordmark-inner {
    width: 380px;
  }

  .definition-wordmark-inner svg {
    width: 100%;
    height: auto;
  }

  /* Hero text container - at the bottom (legacy, kept for reference) */
  .hero-text-container {
    position: fixed;
    bottom: 90px;
    left: calc(var(--rail-width) + 120px);
    z-index: 10;
    transition: opacity 0.3s ease-out;
  }

  /* ═══════════════════════════════════════════════════════════════
     BRIDGE FRAME - Unified hero→definition text container
     Frame maintains FIXED SIZE, only slides position
     ═══════════════════════════════════════════════════════════════ */
  .bridge-frame {
    position: fixed;
    left: calc(var(--rail-width) + 120px);
    z-index: 10;
    width: 500px; /* Fixed width - no scaling */
    max-width: 500px;
    box-sizing: border-box; /* Ensure padding is included in width */
  }

  .bridge-frame .hero-text-frame {
    position: relative;
    width: 100%; /* Fill parent */
    box-sizing: border-box; /* Padding included in width */
    /* Reduced padding to bring text closer together */
    padding: 16px 20px;
    min-height: 100px; /* Prevent layout shift during glitch transition */
  }

  /* Glitch text content - inherits hero-tagline-v2 styling from parent */
  .bridge-content-glitch {
    display: block;
  }

  /* Ensure glitch text inherits parent font styling */
  .hero-tagline .bridge-content-glitch .glitch-text-main {
    font-size: inherit;
    line-height: inherit;
    color: inherit;
    font-weight: inherit;
    font-family: inherit;
  }
  
  /* First line (phonetic) - smaller font and spacing */
  .hero-tagline .bridge-content-glitch .glitch-text-main .glitch-line-first,
  .hero-tagline .bridge-content-glitch .glitch-text-ghost .glitch-line-first {
    font-size: 0.75em !important;
    display: block;
    margin-bottom: 0.5em;
    line-height: 1.2;
  }

  /* Runway arrows pointing to gateway - vertically centered */
  /* Only visible in hero section, hidden during definition transition */
  .hero-runway-arrows {
    position: fixed;
    top: 50%;
    left: calc(var(--rail-width) + 120px);
    transform: translateY(-50%);
    display: flex;
    justify-content: space-between;
    width: 230px;
    z-index: 5; /* Lower z-index so they don't appear above wordmark/frame */
    transition: opacity 0.3s ease-out;
  }

  .runway-arrow {
    font-size: 32px;
    color: var(--gold, #caa554);
    opacity: 0.4;
    animation: runway-pulse 2s ease-in-out infinite;
  }

  .runway-arrow-1 { animation-delay: 0s; }
  .runway-arrow-2 { animation-delay: 0.1s; }
  .runway-arrow-3 { animation-delay: 0.2s; }
  .runway-arrow-4 { animation-delay: 0.3s; }
  .runway-arrow-5 { animation-delay: 0.4s; }
  .runway-arrow-6 { animation-delay: 0.5s; }
  .runway-arrow-7 { animation-delay: 0.6s; }

  @keyframes runway-pulse {
    0%, 100% {
      opacity: 0.2;
    }
    50% {
      opacity: 0.7;
    }
  }

  /* Transparent frame around hero text */
  .hero-text-frame {
    position: relative;
    padding: 20px 24px;
    border: 1px solid rgba(236, 227, 214, 0.1);
    background: rgba(10, 9, 8, 0.25);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  /* Gold corner accents for hero text frame */
  .hero-text-frame::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    width: 10px;
    height: 10px;
    border-top: 1px solid var(--gold, #caa554);
    border-left: 1px solid var(--gold, #caa554);
  }

  .hero-text-frame::after {
    content: '';
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 10px;
    height: 10px;
    border-bottom: 1px solid var(--gold, #caa554);
    border-right: 1px solid var(--gold, #caa554);
  }

  /* Hero tagline - vertically centered on left, no frame */
  .hero-tagline-frame {
    position: fixed;
    top: calc(50% + 30px);
    left: calc(var(--rail-width) + 120px);
    transform: translateY(-50%);
    max-width: 500px;
    padding: 0;
    z-index: 10;
    transition: opacity 0.3s ease-out;
  }

  /* Hero V2 - Cleaner, more focused */
  .hero-tagline-v2 {
    font-size: clamp(20px, 2.5vw, 28px) !important;
    line-height: 1.2 !important; /* Reduced from 1.4 to bring lines closer */
    margin: 0 !important;
    color: var(--dawn) !important;
    font-weight: 300 !important;
  }
  
  /* Reduce spacing between lines in bridge frame */
  .bridge-frame .hero-tagline-v2 br {
    line-height: 0.8; /* Tighter line breaks */
  }

  .hero-description-v2 {
    font-size: 16px !important;
    line-height: 1.6 !important;
    color: var(--dawn-70) !important;
    margin-bottom: var(--space-2xl) !important;
  }

  /* ═══════════════════════════════════════════════════════════════
     INTERSTITIAL - Typewriter question before manifesto
     ═══════════════════════════════════════════════════════════════ */
  .section-interstitial {
    min-height: 100vh;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    padding: 100px calc(var(--hud-padding) + var(--rail-width) + 60px) !important;
  }

  .interstitial-text {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .typewriter-text {
    font-family: var(--font-display, "PP Mondwest", serif);
    font-size: clamp(42px, 7vw, 80px);
    font-weight: 400;
    color: var(--gold, #caa554);
    letter-spacing: 0.02em;
    line-height: 1.2;
    display: inline-block;
    overflow: hidden;
    border-right: 3px solid var(--gold, #caa554);
    white-space: nowrap;
    animation: 
      typewriter 2s steps(28, end) forwards,
      blink-caret 0.75s step-end infinite;
  }

  @keyframes typewriter {
    from { width: 0; }
    to { width: 100%; }
  }

  @keyframes blink-caret {
    from, to { border-color: transparent; }
    50% { border-color: var(--gold, #caa554); }
  }

  /* ═══════════════════════════════════════════════════════════════
     MANIFESTO - Terminal-styled with ASCII art title
     Retro CRT aesthetic with amber/gold text
     ═══════════════════════════════════════════════════════════════ */
  .section-manifesto {
    padding: 100px calc(var(--hud-padding) + var(--rail-width) + 60px) !important;
    padding-top: 140px !important;
    justify-content: center !important;
    align-items: center !important;
    display: flex !important;
    min-height: 100vh !important;
  }
  
  /* Override generic section * rule for manifesto terminal */
  .section-manifesto .manifesto-terminal,
  .section-manifesto .manifesto-terminal * {
    z-index: auto;
  }

  .section-manifesto .manifesto-terminal {
    position: relative;
    width: 100%;
    max-width: 920px;
    background: rgba(10, 9, 8, 0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(236, 227, 214, 0.1);
    z-index: 2;
  }

  /* Gold corner accents */
  .terminal-corner {
    position: absolute;
    width: 20px;
    height: 20px;
    pointer-events: none;
    z-index: 50;
  }

  .terminal-corner-tl {
    top: -1px;
    left: -1px;
    border-top: 2px solid var(--gold, #caa554);
    border-left: 2px solid var(--gold, #caa554);
  }

  .terminal-corner-br {
    bottom: -1px;
    right: -1px;
    border-bottom: 2px solid var(--gold, #caa554);
    border-right: 2px solid var(--gold, #caa554);
  }

  /* Terminal header bar */
  .terminal-header {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 1px solid rgba(236, 227, 214, 0.1);
  }

  .terminal-title {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 12px;
    color: var(--gold, #caa554);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  /* Terminal body */
  .terminal-body {
    position: relative;
    padding: 24px 32px 32px 32px;
    min-height: 400px;
    text-align: left;
  }

  /* Subtle scanlines effect */
  .terminal-scanlines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.1) 2px,
      rgba(0, 0, 0, 0.1) 4px
    );
    z-index: 15;
    opacity: 0.5;
  }

  /* ASCII Art Title */
  .ascii-title {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: clamp(5px, 0.9vw, 9px);
    line-height: 1.15;
    color: var(--gold, #caa554);
    margin: 0 0 32px 0;
    overflow-x: auto;
    white-space: pre;
    position: relative;
    z-index: 5;
    text-align: left;
  }

  /* Terminal content */
  .terminal-content {
    position: relative;
    z-index: 5;
    text-align: left;
  }

  .terminal-line {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 14px;
  }

  .prompt {
    color: var(--gold, #caa554);
    font-weight: 600;
  }

  .command {
    color: var(--gold, #caa554);
  }

  .cursor {
    color: var(--gold, #caa554);
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* Terminal output text */
  .terminal-output {
    padding-left: 24px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    text-align: left;
  }

  .terminal-output p {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: clamp(13px, 1.4vw, 15px);
    line-height: 1.9;
    color: var(--dawn-80, rgba(236, 227, 214, 0.8));
    margin: 0;
    max-width: 72ch;
    text-align: left;
  }

  .terminal-output em {
    color: var(--gold, #caa554);
    font-style: italic;
  }

  .terminal-output strong {
    color: var(--dawn, #ece3d6);
    font-weight: 600;
  }

  /* ═══════════════════════════════════════════════════════════════
     FIXED SIGIL - Appears centered during scroll
     ═══════════════════════════════════════════════════════════════ */
  .fixed-sigil-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 5;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: opacity 0.3s ease-out;
  }

  /* Wordmark above the definition text */
  .definition-wordmark {
    width: 100%;
    max-width: 380px;
  }

  .definition-wordmark svg {
    width: 100%;
    height: auto;
  }

  .definition-frame {
    /* No frame styling - just layout */
  }

  .definition-phonetic {
    font-family: var(--font-data, 'PT Mono', monospace);
    font-size: 16px;
    color: rgba(202, 165, 84, 0.6);
    letter-spacing: 0.05em;
  }

  /* ═══════════════════════════════════════════════════════════════
     MODULE CARDS - Right side pointing to sigil
     ═══════════════════════════════════════════════════════════════ */
  .definition-modules {
    position: fixed;
    right: calc(var(--rail-width, 60px) + 120px);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 32px;
    z-index: 10;
    transition: opacity 0.3s ease-out, visibility 0.3s ease-out;
  }

  .module-card {
    position: relative;
    background: rgba(10, 9, 8, 0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(236, 227, 214, 0.1);
    padding: 20px 24px;
    max-width: 280px;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .module-card:hover {
    background: rgba(20, 18, 16, 0.7);
    border-color: var(--gold, #caa554);
    transform: translateX(-5px);
  }

  /* Technical corner accents */
  .module-card::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    width: 10px;
    height: 10px;
    border-top: 1px solid var(--gold, #caa554);
    border-left: 1px solid var(--gold, #caa554);
  }

  .module-card::after {
    content: '';
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 10px;
    height: 10px;
    border-bottom: 1px solid var(--gold, #caa554);
    border-right: 1px solid var(--gold, #caa554);
  }

  /* ═══════════════════════════════════════════════════════════════
     MODULE CONNECTION LINES - Lines from cards to sigil
     ═══════════════════════════════════════════════════════════════ */
  .module-connection-lines {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 4;
    pointer-events: none;
  }

  .module-line {
    transition: opacity 0.3s ease-out;
  }

  /* Connection point - dot on left edge */
  .module-connect {
    position: absolute;
    left: -4px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    background: var(--gold, #caa554);
    border-radius: 50%;
  }

  .module-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .module-id {
    font-family: var(--font-data, 'PT Mono', monospace);
    font-size: 10px;
    color: var(--gold, #caa554);
    letter-spacing: 0.1em;
  }

  .module-icon {
    font-size: 16px;
    color: rgba(236, 227, 214, 0.5);
  }

  .module-title {
    font-family: var(--font-body, system-ui);
    font-size: 18px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--dawn, #ECE3D6);
    margin-bottom: 10px;
  }

  .module-desc {
    font-family: var(--font-body, system-ui);
    font-size: 14px;
    line-height: 1.5;
    color: rgba(236, 227, 214, 0.5);
  }

  /* ═══════════════════════════════════════════════════════════════
     DEFINITION SECTION - Placeholder for layout flow
     ═══════════════════════════════════════════════════════════════ */
  .section-definition {
    position: relative;
    min-height: 100vh !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    padding: 30px calc(var(--rail-width) + 60px) 80px !important;
  }

  .sigil-placeholder {
    width: 220px;
    height: 220px;
  }

  /* Responsive adjustments */
  @media (max-width: 1100px) {
    .section-definition {
      padding: 60px var(--hud-padding) !important;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     INFO CARD SYSTEM (Kriss.ai inspired - for Services, etc.)
     ═══════════════════════════════════════════════════════════════ */
  .info-card {
    position: relative;
    background: rgba(10, 9, 8, 0.94);
    border: 1px solid var(--dawn-15);
    padding: 32px;
    max-width: 340px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Corner brackets */
  .card-corner {
    position: absolute;
    width: 16px;
    height: 16px;
    pointer-events: none;
  }

  .card-corner-tl {
    top: -1px;
    left: -1px;
    border-top: 2px solid var(--gold);
    border-left: 2px solid var(--gold);
  }

  .card-corner-tr {
    top: -1px;
    right: -1px;
    border-top: 2px solid var(--gold);
    border-right: 2px solid var(--gold);
  }

  .card-corner-bl {
    bottom: -1px;
    left: -1px;
    border-bottom: 2px solid var(--gold);
    border-left: 2px solid var(--gold);
  }

  .card-corner-br {
    bottom: -1px;
    right: -1px;
    border-bottom: 2px solid var(--gold);
    border-right: 2px solid var(--gold);
  }

  /* Card header */
  .card-header {
    display: flex;
    align-items: center;
  }

  .card-label {
    font-family: var(--font-data);
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--gold);
  }

  /* Card title */
  .card-title {
    font-family: var(--font-display);
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 400;
    letter-spacing: 0.02em;
    color: var(--dawn);
    line-height: 1.2;
    margin: 0;
  }

  /* Card description */
  .card-description {
    color: var(--dawn-70);
    font-size: 14px;
    line-height: 1.65;
  }

  .card-description p {
    margin: 0;
  }

  .card-description em {
    color: var(--gold);
    font-style: normal;
  }

  /* Feature list */
  .card-features {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 8px;
  }

  .features-label {
    font-family: var(--font-data);
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--dawn-30);
  }

  .features-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .features-list li {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .feature-icon {
    font-size: 12px;
    color: var(--gold);
    width: 16px;
    text-align: center;
  }

  .feature-text {
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 400;
    color: var(--dawn);
    letter-spacing: 0.01em;
  }

  /* Card CTA */
  .card-cta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid var(--dawn-08);
    text-decoration: none;
    color: var(--gold);
    font-family: var(--font-data);
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.04em;
    transition: color 0.15s ease;
    cursor: pointer;
  }

  .card-cta:hover {
    color: var(--dawn);
  }

  .cta-arrow {
    font-size: 14px;
    transition: transform 0.15s ease;
  }

  .card-cta:hover .cta-arrow {
    transform: translateX(4px);
  }

  /* Gradient overlay at bottom */
  .card-gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(
      to top,
      rgba(202, 165, 84, 0.06) 0%,
      transparent 100%
    );
    pointer-events: none;
  }

  /* Responsive adjustments */
  @media (max-width: 900px) {
    .info-card {
      padding: 24px;
      max-width: 100%;
    }

    .card-title {
      font-size: clamp(22px, 5vw, 28px);
    }

    .card-description {
      font-size: 13px;
    }

    .feature-text {
      font-size: 12px;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     MOBILE RESPONSIVE STYLES (768px and below)
     Restructures layout for single-column mobile experience
     ═══════════════════════════════════════════════════════════════ */
  @media (max-width: 768px) {
    /* Hero section mobile layout */
    .section-hero {
      min-height: 100vh;
      min-height: 100dvh;
      height: auto;
    }

    .hero-layout {
      height: auto;
      min-height: 100vh;
      min-height: 100dvh;
    }

    /* Wordmark - centered above gateway */
    .hero-wordmark-container {
      left: 50% !important;
      right: auto !important;
      transform: translateX(-50%) !important;
      width: 80vw;
      max-width: 280px;
      top: 12vh !important;
      display: flex;
      justify-content: center;
    }

    .hero-wordmark-topleft {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .hero-wordmark-topleft svg {
      max-width: 100%;
    }

    .definition-wordmark-inner {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    /* Bridge frame - centered, animates from bottom to below wordmark */
    .bridge-frame {
      left: 50% !important;
      right: auto !important;
      width: 85vw !important;
      max-width: 320px !important;
    }

    .bridge-frame .hero-text-frame {
      padding: 16px 20px;
      min-height: 70px;
      text-align: center;
      background: rgba(10, 9, 8, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    /* Center text in bridge frame */
    .bridge-frame .hero-tagline {
      text-align: center;
    }

    .bridge-frame .hero-tagline-v2 {
      font-size: clamp(13px, 3.5vw, 16px) !important;
      line-height: 1.4 !important;
    }

    /* Hide runway arrows on mobile */
    .hero-runway-arrows {
      display: none !important;
    }

    /* Hero tagline mobile sizing */
    .hero-tagline-v2 {
      font-size: clamp(14px, 4vw, 18px) !important;
      line-height: 1.3 !important;
      text-align: center !important;
    }

    /* Definition section mobile */
    .section-definition {
      padding: 60px 24px !important;
      min-height: auto !important;
    }

    .sigil-placeholder {
      width: 160px;
      height: 160px;
    }

    /* Fixed sigil mobile - smaller and centered */
    .fixed-sigil-container {
      transform: translate(-50%, -50%) scale(0.7);
    }

    /* Module cards - hide desktop version on mobile */
    .definition-modules {
      display: none !important;
    }

    /* Module connection lines - hide on mobile */
    .module-connection-lines {
      display: none !important;
    }

    /* Interstitial mobile */
    .section-interstitial {
      padding: 60px 24px !important;
    }

    .typewriter-text {
      font-size: clamp(24px, 8vw, 42px);
      white-space: normal;
      border-right: 2px solid var(--gold, #caa554);
    }

    /* Manifesto terminal mobile */
    .section-manifesto {
      padding: 80px 12px !important;
      padding-top: 100px !important;
    }

    .manifesto-terminal {
      max-width: 100%;
      border-width: 1px;
    }

    .terminal-header {
      padding: 10px 14px;
    }

    .terminal-title {
      font-size: 10px;
    }

    .control-dot {
      width: 8px;
      height: 8px;
    }

    .terminal-body {
      padding: 20px 16px;
      min-height: auto;
    }

    .ascii-title {
      font-size: 2.5px;
      margin-bottom: 24px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .terminal-line {
      font-size: 12px;
      gap: 8px;
      margin-bottom: 14px;
    }

    .terminal-output {
      padding-left: 20px;
      gap: 18px;
    }

    .terminal-output p {
      font-size: 12px;
      line-height: 1.75;
    }

    /* Info card mobile */
    .info-card {
      padding: 20px;
      max-width: 100%;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     MOBILE MODULE TABS - Tabbed interface for module cards
     Used when desktop ModuleCards are hidden
     ═══════════════════════════════════════════════════════════════ */
  .mobile-module-tabs {
    position: fixed;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 80px);
    max-width: 320px;
    z-index: 20;
    background: rgba(10, 9, 8, 0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(236, 227, 214, 0.15);
    display: none;
  }

  @media (max-width: 768px) {
    .mobile-module-tabs {
      display: block;
    }
  }

  .mobile-tabs-header {
    display: flex;
    border-bottom: 1px solid rgba(236, 227, 214, 0.1);
  }

  .mobile-tab-button {
    flex: 1;
    padding: 12px 6px;
    background: transparent;
    border: none;
    font-family: var(--font-data, monospace);
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dawn-50, rgba(235, 227, 214, 0.5));
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .mobile-tab-button.active {
    color: var(--gold, #caa554);
  }

  .mobile-tab-button.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 20%;
    right: 20%;
    height: 2px;
    background: var(--gold, #caa554);
  }

  .mobile-tabs-content {
    padding: 16px 20px;
    min-height: 80px;
  }

  .mobile-tab-panel {
    display: none;
  }

  .mobile-tab-panel.active {
    display: block;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .mobile-tab-title {
    font-family: var(--font-body, system-ui);
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--dawn, #ECE3D6);
    margin-bottom: 6px;
  }

  .mobile-tab-desc {
    font-family: var(--font-body, system-ui);
    font-size: 12px;
    line-height: 1.5;
    color: var(--dawn-70, rgba(235, 227, 214, 0.7));
  }

`;
