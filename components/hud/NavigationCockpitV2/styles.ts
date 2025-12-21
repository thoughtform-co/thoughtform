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
  /* Hero wordmark container - top aligned with HUD line */
  .hero-wordmark-container {
    position: fixed;
    top: 90px;
    left: calc(var(--rail-width) + 120px);
    z-index: 10;
    transition: opacity 0.3s ease-out;
  }

  .hero-wordmark-topleft {
    width: 460px;
  }

  .hero-wordmark-topleft svg {
    width: 100%;
    height: auto;
  }

  /* Hero text container - at the bottom */
  .hero-text-container {
    position: fixed;
    bottom: 90px;
    left: calc(var(--rail-width) + 120px);
    z-index: 10;
    transition: opacity 0.3s ease-out;
  }

  /* Runway arrows pointing to gateway - vertically centered, same width as hero text */
  .hero-runway-arrows {
    position: fixed;
    top: 50%;
    left: calc(var(--rail-width) + 120px);
    transform: translateY(-50%);
    display: flex;
    justify-content: space-between;
    /* Match the hero text frame width (padding 24px on each side + text content) */
    width: 460px;
    z-index: 10;
    transition: opacity 0.3s ease-out;
  }

  .runway-arrow {
    font-size: 20px;
    color: var(--gold, #caa554);
    opacity: 0.3;
    animation: runway-pulse 2s ease-in-out infinite;
  }

  .runway-arrow-1 { animation-delay: 0s; }
  .runway-arrow-2 { animation-delay: 0.1s; }
  .runway-arrow-3 { animation-delay: 0.2s; }
  .runway-arrow-4 { animation-delay: 0.3s; }
  .runway-arrow-5 { animation-delay: 0.4s; }
  .runway-arrow-6 { animation-delay: 0.5s; }
  .runway-arrow-7 { animation-delay: 0.6s; }
  .runway-arrow-8 { animation-delay: 0.7s; }
  .runway-arrow-9 { animation-delay: 0.8s; }
  .runway-arrow-10 { animation-delay: 0.9s; }
  .runway-arrow-11 { animation-delay: 1.0s; }
  .runway-arrow-12 { animation-delay: 1.1s; }

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
    line-height: 1.4 !important;
    margin: 0 !important;
    color: var(--dawn) !important;
    font-weight: 300 !important;
  }

  .hero-description-v2 {
    font-size: 16px !important;
    line-height: 1.6 !important;
    color: var(--dawn-70) !important;
    margin-bottom: var(--space-2xl) !important;
  }

  /* ═══════════════════════════════════════════════════════════════
     MANIFESTO - Text-based layout like Services section
     ═══════════════════════════════════════════════════════════════ */
  .section-manifesto {
    /* Use same padding as default .section (which Services uses) */
    padding: 100px calc(var(--hud-padding) + var(--rail-width) + 120px) !important;
    padding-top: 180px !important; /* Extra top padding so it starts later */
    padding-right: 18% !important;
    justify-content: flex-start !important;
    align-items: flex-start !important;
  }

  .manifesto-layout-text {
    width: 100%;
    max-width: 640px;
    margin: 0;
    margin-right: auto;
  }

  /* Content area with vertical line on left */
  .manifesto-content-area {
    border-left: 1px solid var(--dawn-15);
    padding-left: var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  /* Large title - only this is big */
  .manifesto-title-large {
    font-family: var(--font-display);
    font-size: clamp(48px, 6vw, 72px);
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: 0.01em;
    color: var(--dawn);
    margin: 0;
  }

  /* Body text - all paragraphs same size */
  .manifesto-body-text {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .manifesto-body-text p {
    font-family: var(--font-body);
    font-size: clamp(17px, 2vw, 20px);
    font-weight: 300;
    line-height: 1.7;
    color: var(--dawn-80);
    margin: 0;
    max-width: 540px;
  }

  .manifesto-body-text em {
    color: var(--gold);
    font-style: normal;
  }

  .manifesto-body-text strong {
    font-weight: 500;
    color: var(--dawn);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .manifesto-title-large {
      font-size: clamp(36px, 8vw, 48px);
    }

    .manifesto-body-text p {
      font-size: 17px;
    }
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
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--dawn, #ECE3D6);
    margin-bottom: 8px;
  }

  .module-desc {
    font-family: var(--font-body, system-ui);
    font-size: 12px;
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
`;
