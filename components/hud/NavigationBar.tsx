"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import for LogoGlowEffect (uses Three.js/R3F)
// This reduces initial bundle size - the glow effect only loads when triggered
const LogoGlowEffect = dynamic(() => import("./LogoGlowEffect").then((m) => m.LogoGlowEffect), {
  ssr: false,
  loading: () => null,
});

// ═══════════════════════════════════════════════════════════════
// NAVIGATION BAR - Brandworld Specification
// Fixed top navigation with logo and text links
// Mobile: Vertical section list (left) + Thoughtform sigil (right)
// ═══════════════════════════════════════════════════════════════

interface NavItem {
  label: string;
  sectionId: string;
}

const navItems: NavItem[] = [
  { label: "Interface", sectionId: "definition" },
  { label: "Manifesto", sectionId: "manifesto" },
  { label: "Services", sectionId: "services" },
  { label: "About", sectionId: "about" },
  { label: "Contact", sectionId: "contact" },
];

// Thoughtform Sigil SVG (brand mark) - Filled version with color prop
const ThoughtformLogo = forwardRef<SVGSVGElement, { size?: number; color?: string }>(
  function ThoughtformLogo({ size = 24, color = "#caa554" }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 430.99 436"
        width={size}
        height={size}
        fill={color}
        style={{
          transition: "fill 0.4s ease-in-out",
        }}
      >
        <path d="M336.78,99.43c18.82,18.93,33.41,41.16,43.78,66.63,5.03,12.35,8.81,24.86,11.42,37.57h19.62c-1.91-18.99-6.54-37.52-13.79-55.54-10.01-24.71-24.56-46.73-43.78-66.02-19.17-19.29-41.16-33.97-65.92-43.99-7.9-3.24-15.9-5.92-23.95-8.1l-1.36,7.49-.9,4.91-1.41,7.49c2.87,1.11,5.79,2.28,8.65,3.54,25.51,10.99,48.06,26.33,67.63,46.02h.01Z" />
        <path d="M383.13,314.65c-8.61,22.23-21.59,41.97-38.85,59.38-16.91,16.61-35.23,29.06-55,37.36-19.78,8.3-40.21,12.45-61.29,12.45-11.68,0-23.35-1.22-34.92-3.7-2.47-.46-4.93-1.01-7.4-1.67-2.42-.61-4.88-1.27-7.3-2.02-7.4-2.18-14.74-4.91-22.14-8.1-1.21-.51-2.47-1.06-3.67-1.62-1.16-.51-2.31-1.06-3.42-1.62-2.37-1.11-4.73-2.28-7.05-3.49-20.78-10.83-39.75-24.86-56.91-42.07-19.98-19.69-35.63-42.88-46.9-69.56-5.38-12.61-9.46-25.36-12.28-38.22-.6-2.53-1.11-5.06-1.56-7.59s-.85-5.06-1.21-7.59c-.81-5.87-1.41-11.85-1.71-17.77-.1-2.53-.2-5.06-.2-7.59-.05-.96-.05-1.92-.05-2.89,0-1.57,0-3.14.1-4.71.45-21.06,4.48-41.21,11.98-60.45,8.1-20.66,20.53-39.49,37.44-56.45,16.86-17.01,35.48-29.57,55.86-37.67,20.33-8.1,41.62-12.2,63.91-12.2,5.99,0,11.93.25,17.86.81l2.72-14.68c-26.82,0-53.19,5.32-79,15.95-25.92,10.63-49.06,26.12-69.39,46.63-20.73,20.81-36.38,43.99-46.95,69.51-6.59,15.85-11.12,32.05-13.59,48.55-.35,2.53-.7,5.06-.96,7.59-.3,2.53-.5,5.06-.7,7.59-.35,5.01-.55,10.02-.55,15.04,0,.91,0,1.82.05,2.73,0,2.53.1,5.06.25,7.59.1,2.53.25,5.06.5,7.59,1.76,19.9,6.49,39.24,14.14,57.97,9.96,24.3,24.56,46.12,43.78,65.41,19.93,19.74,42.57,34.78,67.93,45.21,3.72,1.52,7.5,2.99,11.27,4.25,2.42.86,4.83,1.67,7.25,2.38,2.42.76,4.88,1.47,7.3,2.13,7.5,2.03,15.1,3.59,22.74,4.71,2.52.35,5.03.71,7.55.96,2.52.3,5.03.51,7.55.66,4.88.41,9.76.56,14.64.56,26.87,0,52.84-5.11,78-15.34,25.16-10.23,47.71-25.41,67.68-45.51,20.33-20.81,35.78-44.2,46.35-70.07,7.1-17.42,11.78-35.18,14.09-53.31h-15.1c-.71,21.82-4.98,42.78-12.83,62.88h-.01Z" />
        <path d="M29.12,218.81l132.09-.05v.05H29.12h0Z" />
        <path d="M163.32,250.35l12.58.05h-12.58v-.05Z" />
        <path d="M179.17,408.81l30.34-158.46-29.79,158.61s-.35-.1-.55-.15h0Z" />
        <path d="M430.98,218.81l-5.23,17.77h-184.93l-10.32.05-2.47,13.72h-18.52l-30.34,158.46c-7.2-2.23-14.44-4.96-21.59-8.1l24.05-132.9h-8.86l3.12-17.42h-20.73l2.57-13.77H30.87c-.86-5.87-1.46-11.8-1.76-17.77h132.09l10.32-.05,2.47-13.72h18.52l29.54-157.85,1.36-7.49,1.41-7.44.2-1.21,1.41-7.49,1.36-7.44L230.76.06h23.6l-3.52,19.14-1.36,7.44-1.41,7.49-.65,3.44-1.36,7.49-1.41,7.54-23.9,129.71h.6l13.49.1-4.78,21.52h17.01l-.2,1.16-2.57,13.77h186.69v-.05h-.01Z" />
        <path d="M254.35,0l-33.01,182.26h-.6L254.35,0h0Z" />
      </svg>
    );
  }
);

// Mobile section list items (ordered for rendering)
// About is excluded from the HUD sequence per design spec
const mobileSectionItems = [
  { sectionId: "hero", number: "01", name: "HOME" },
  { sectionId: "definition", number: "02", name: "INTERFACE" },
  { sectionId: "manifesto", number: "03", name: "MANIFESTO" },
  { sectionId: "services", number: "04", name: "SERVICES" },
  { sectionId: "contact", number: "05", name: "CONTACT" },
];

// Export handle type for the NavigationBar ref
export interface NavigationBarHandle {
  getLogoPosition: () => { x: number; y: number; width: number; height: number } | null;
  triggerLogoGlow: () => void;
  resetLogoColor: () => void;
}

interface NavigationBarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

// Get current section index in the mobile list
function getCurrentSectionIndex(activeSection: string): number {
  const index = mobileSectionItems.findIndex((item) => item.sectionId === activeSection);
  // About section isn't in our list, map it to services (closest neighbor)
  return index >= 0 ? index : mobileSectionItems.findIndex((item) => item.sectionId === "services");
}

export const NavigationBar = forwardRef<NavigationBarHandle, NavigationBarProps>(
  function NavigationBar({ activeSection, onNavigate }, ref) {
    const desktopLogoRef = useRef<SVGSVGElement>(null);
    const mobileLogoRef = useRef<SVGSVGElement>(null);
    const [isLogoGlowing, setIsLogoGlowing] = useState(false);
    // Logo is semantic dawn until particles arrive, then tensor gold
    const [isLogoGold, setIsLogoGold] = useState(false);

    // Get current section index for the mobile list
    const currentSectionIndex = getCurrentSectionIndex(activeSection);

    // Expose logo position and glow trigger through imperative handle
    useImperativeHandle(ref, () => ({
      getLogoPosition: () => {
        const getRect = (el: SVGSVGElement | null) => {
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          // If the element is display:none, rect will be 0x0 — treat as unavailable.
          if (rect.width === 0 || rect.height === 0) return null;
          return rect;
        };

        const mobileRect = getRect(mobileLogoRef.current);
        const desktopRect = getRect(desktopLogoRef.current);
        const rect = mobileRect ?? desktopRect;
        if (!rect) return null;
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        };
      },
      triggerLogoGlow: () => {
        setIsLogoGlowing(true);
        setIsLogoGold(true);
        // Reset glow after animation completes
        setTimeout(() => setIsLogoGlowing(false), 800);
      },
      resetLogoColor: () => {
        setIsLogoGold(false);
      },
    }));

    const handleClick = (
      e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
      sectionId: string
    ) => {
      e.preventDefault();
      onNavigate(sectionId);
    };

    const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
      <>
        {/* Desktop: Centered navbar (CSS-hidden on mobile) */}
        <div className="navbar-container">
          <nav className="navbar" aria-label="Primary navigation">
            {/* Logo on the left */}
            <a
              href="#"
              className={`navbar-logo ${isLogoGlowing ? "logo-glowing" : ""} ${!isLogoGold ? "logo-pulse" : ""}`}
              onClick={handleLogoClick}
              style={{
                opacity: isLogoGold ? 1 : undefined,
                position: "relative",
              }}
            >
              <ThoughtformLogo
                ref={desktopLogoRef}
                size={22}
                color={isLogoGold ? "#caa554" : "#ece3d6"}
              />
              <LogoGlowEffect active={isLogoGlowing} size={22} />
            </a>

            {/* Desktop: Nav links */}
            {navItems.map((item) => {
              const isActive = activeSection === item.sectionId;
              return (
                <a
                  key={item.sectionId}
                  href={`#${item.sectionId}`}
                  className={`navbar-link ${isActive ? "active" : ""}`}
                  onClick={(e) => handleClick(e, item.sectionId)}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Mobile: Vertical section list (left) + Thoughtform sigil (right) (CSS-hidden on desktop) */}
        <nav className="mobile-section-list" aria-label="Section navigation">
          {mobileSectionItems.map((item, index) => {
            const isActive = index === currentSectionIndex;
            // Mobile: only show the active section for more real estate
            if (!isActive) return null;

            return (
              <button
                key={item.sectionId}
                className={`mobile-section-item ${isActive ? "active" : ""}`}
                onClick={(e) => handleClick(e, item.sectionId)}
                aria-current={isActive ? "true" : undefined}
              >
                <span className="mobile-section-number">{item.number}</span>
                <span className="mobile-section-name">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Top-right: Thoughtform brandmark (replaces hamburger on mobile) */}
        <button
          className={`mobile-sigil ${isLogoGlowing ? "logo-glowing" : ""} ${!isLogoGold ? "logo-pulse" : ""}`}
          onClick={handleLogoClick}
          aria-label="Scroll to top"
        >
          <ThoughtformLogo
            ref={mobileLogoRef}
            size={24}
            color={isLogoGold ? "#caa554" : "#ece3d6"}
          />
          <LogoGlowEffect active={isLogoGlowing} size={24} />
        </button>
        {/* Styles moved to app/styles/navigation/_navbar.css */}
      </>
    );
  }
);
