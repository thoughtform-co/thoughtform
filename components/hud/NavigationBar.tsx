"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";

// ═══════════════════════════════════════════════════════════════
// NAVIGATION BAR - Brandworld Specification
// Fixed top navigation with logo and text links
// Mobile: Hamburger menu with slide-out panel
// ═══════════════════════════════════════════════════════════════

interface NavItem {
  label: string;
  sectionId: string;
}

const navItems: NavItem[] = [
  { label: "Definition", sectionId: "definition" },
  { label: "Manifesto", sectionId: "manifesto" },
  { label: "Services", sectionId: "services" },
  { label: "About", sectionId: "about" },
  { label: "Contact", sectionId: "contact" },
];

// Thoughtform Sigil SVG (brand mark)
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

// Hamburger menu icon
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      style={{
        transition: "transform 0.3s ease",
        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
      }}
    >
      <line
        x1="4"
        y1="8"
        x2="20"
        y2="8"
        style={{
          transition: "all 0.3s ease",
          transform: isOpen ? "translateY(4px)" : "translateY(0)",
        }}
      />
      <line
        x1="4"
        y1="16"
        x2="20"
        y2="16"
        style={{
          transition: "all 0.3s ease",
          transform: isOpen ? "translateY(-4px) rotate(90deg)" : "translateY(0)",
          transformOrigin: "center",
        }}
      />
    </svg>
  );
}

// Export handle type for the NavigationBar ref
export interface NavigationBarHandle {
  getLogoPosition: () => { x: number; y: number; width: number; height: number } | null;
}

interface NavigationBarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const NavigationBar = forwardRef<NavigationBarHandle, NavigationBarProps>(
  function NavigationBar({ activeSection, onNavigate }, ref) {
    const logoRef = useRef<SVGSVGElement>(null);
    const isMobile = useIsMobile();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close menu when navigating
    const handleNavigate = (sectionId: string) => {
      setIsMenuOpen(false);
      onNavigate(sectionId);
    };

    // Close menu on escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsMenuOpen(false);
      };
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }, []);

    // Prevent body scroll when menu is open
    useEffect(() => {
      if (isMenuOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [isMenuOpen]);

    // Expose logo position through imperative handle
    useImperativeHandle(ref, () => ({
      getLogoPosition: () => {
        if (!logoRef.current) return null;
        const rect = logoRef.current.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        };
      },
    }));

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      e.preventDefault();
      handleNavigate(sectionId);
    };

    const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setIsMenuOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
      <>
        <div className="navbar-container">
          <nav className="navbar">
            {/* Logo on the left */}
            <a href="#" className="navbar-logo" onClick={handleLogoClick}>
              <ThoughtformLogo ref={logoRef} size={22} />
            </a>

            {/* Desktop: Nav links */}
            {!isMobile &&
              navItems.map((item) => {
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

            {/* Mobile: Hamburger button */}
            {isMobile && (
              <button
                className="navbar-hamburger"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
              >
                <HamburgerIcon isOpen={isMenuOpen} />
              </button>
            )}
          </nav>
        </div>

        {/* Mobile menu overlay */}
        {isMobile && (
          <>
            <div
              className={`mobile-menu-backdrop ${isMenuOpen ? "open" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            />
            <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
              <div className="mobile-menu-content">
                {navItems.map((item, index) => {
                  const isActive = activeSection === item.sectionId;
                  return (
                    <a
                      key={item.sectionId}
                      href={`#${item.sectionId}`}
                      className={`mobile-menu-link ${isActive ? "active" : ""}`}
                      onClick={(e) => handleClick(e, item.sectionId)}
                      style={{
                        animationDelay: isMenuOpen ? `${index * 50}ms` : "0ms",
                      }}
                    >
                      <span className="mobile-menu-number">0{index + 1}</span>
                      <span className="mobile-menu-label">{item.label}</span>
                    </a>
                  );
                })}
              </div>

              <div className="mobile-menu-footer">
                <span className="mobile-menu-email">hello@thoughtform.co</span>
              </div>
            </div>
          </>
        )}

        <style jsx>{`
          .navbar-container {
            position: fixed;
            top: 20px;
            left: 0;
            right: 0;
            z-index: 1000;
            display: flex;
            justify-content: center;
            pointer-events: none;
          }

          .navbar {
            display: flex;
            align-items: center;
            background: rgba(10, 9, 8, 0.25);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(236, 227, 214, 0.1);
            height: 44px;
            pointer-events: auto;
          }

          .navbar-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 14px;
            height: 100%;
            border-right: 1px solid rgba(236, 227, 214, 0.08);
            transition: opacity 150ms ease;
          }

          .navbar-logo:hover {
            opacity: 0.8;
          }

          .navbar-link {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 16px;
            height: 100%;
            font-family: var(--font-data, "PT Mono", monospace);
            font-size: 12px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(202, 165, 84, 0.5);
            text-decoration: none;
            background: transparent;
            border-right: 1px solid rgba(236, 227, 214, 0.08);
            transition: all 150ms ease;
          }

          .navbar-link:last-child {
            border-right: none;
          }

          .navbar-link:hover {
            color: rgba(202, 165, 84, 0.8);
          }

          .navbar-link.active {
            color: var(--dawn, #ece3d6);
            background: rgba(236, 227, 214, 0.1);
          }

          /* Mobile hamburger button */
          .navbar-hamburger {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            padding: 0;
            margin: 0;
            background: transparent;
            border: none;
            color: var(--gold, #caa554);
            cursor: pointer;
            transition: color 150ms ease;
          }

          .navbar-hamburger:hover {
            color: var(--dawn, #ece3d6);
          }

          /* Mobile menu backdrop */
          .mobile-menu-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(5, 4, 3, 0.8);
            opacity: 0;
            visibility: hidden;
            transition:
              opacity 0.3s ease,
              visibility 0.3s ease;
            z-index: 999;
          }

          .mobile-menu-backdrop.open {
            opacity: 1;
            visibility: visible;
          }

          /* Mobile menu panel */
          .mobile-menu {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: min(320px, 85vw);
            background: rgba(10, 9, 8, 0.98);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-left: 1px solid rgba(236, 227, 214, 0.1);
            z-index: 1001;
            display: flex;
            flex-direction: column;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .mobile-menu.open {
            transform: translateX(0);
          }

          .mobile-menu-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 80px 32px;
            gap: 8px;
          }

          .mobile-menu-link {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 0;
            text-decoration: none;
            border-bottom: 1px solid rgba(236, 227, 214, 0.06);
            opacity: 0;
            transform: translateX(20px);
            transition: all 0.2s ease;
          }

          .mobile-menu.open .mobile-menu-link {
            opacity: 1;
            transform: translateX(0);
            animation: slideIn 0.4s ease forwards;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .mobile-menu-link:hover,
          .mobile-menu-link.active {
            border-bottom-color: var(--gold, #caa554);
          }

          .mobile-menu-number {
            font-family: var(--font-data, monospace);
            font-size: 11px;
            color: var(--gold, #caa554);
            letter-spacing: 0.1em;
            min-width: 24px;
          }

          .mobile-menu-label {
            font-family: var(--font-data, monospace);
            font-size: 18px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--dawn-70, rgba(235, 227, 214, 0.7));
            transition: color 0.2s ease;
          }

          .mobile-menu-link:hover .mobile-menu-label,
          .mobile-menu-link.active .mobile-menu-label {
            color: var(--dawn, #ece3d6);
          }

          .mobile-menu-footer {
            padding: 24px 32px;
            border-top: 1px solid rgba(236, 227, 214, 0.08);
          }

          .mobile-menu-email {
            font-family: var(--font-data, monospace);
            font-size: 12px;
            letter-spacing: 0.05em;
            color: var(--dawn-30, rgba(235, 227, 214, 0.3));
          }

          /* Mobile adjustments */
          @media (max-width: 768px) {
            .navbar-container {
              top: 12px;
            }
          }
        `}</style>
      </>
    );
  }
);
