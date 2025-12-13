import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ═══════════════════════════════════════════════════════════════════
         THOUGHTFORM NAVIGATION COCKPIT DESIGN TOKENS
         ═══════════════════════════════════════════════════════════════════ */
      colors: {
        // Void (Backgrounds) - The depths, infinite space
        void: {
          DEFAULT: "#0a0908",
          deep: "#050504",
        },
        // Surface Layers
        surface: {
          0: "#0D0B07",
          1: "#141210",
          2: "#1A1814",
        },
        // Dawn (Text & Particles) - Emergence into light
        dawn: {
          DEFAULT: "#ebe3d6",
          90: "rgba(235, 227, 214, 0.9)",
          70: "rgba(235, 227, 214, 0.7)",
          50: "rgba(235, 227, 214, 0.5)",
          30: "rgba(235, 227, 214, 0.3)",
          15: "rgba(235, 227, 214, 0.15)",
          "08": "rgba(235, 227, 214, 0.08)",
          "04": "rgba(235, 227, 214, 0.04)",
        },
        // Gold (Accent) - Navigation & measurement
        gold: {
          DEFAULT: "#caa554",
          70: "rgba(202, 165, 84, 0.7)",
          50: "rgba(202, 165, 84, 0.5)",
          30: "rgba(202, 165, 84, 0.3)",
          15: "rgba(202, 165, 84, 0.15)",
          10: "rgba(202, 165, 84, 0.10)",
          "05": "rgba(202, 165, 84, 0.05)",
        },
        // Alert - For emphasis
        alert: "#ff6b35",
      },
      fontFamily: {
        display: ["var(--font-mondwest)", "'PP Mondwest'", "serif"],
        body: ["var(--font-ibm-plex)", "'IBM Plex Sans'", "sans-serif"],
        data: ["var(--font-ibm-plex)", "'IBM Plex Sans'", "sans-serif"],
      },
      fontSize: {
        // HUD data sizes
        "2xs": ["9px", { lineHeight: "1.4", letterSpacing: "0.1em" }],
        xs: ["11px", { lineHeight: "1.4", letterSpacing: "0.08em" }],
        sm: ["12px", { lineHeight: "1.5", letterSpacing: "0.06em" }],
      },
      spacing: {
        // 8px grid spacing
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
        "4xl": "96px",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "300ms",
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "hud-enter": "hudEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        hudEnter: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
