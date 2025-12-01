import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ═══════════════════════════════════════════════════════════════════
         ASTROLABE DESIGN TOKENS
         ═══════════════════════════════════════════════════════════════════ */
      colors: {
        // Background Layers
        void: "#070604",
        surface: {
          0: "#0D0B07",
          1: "#141210",
          2: "#1A1814",
        },
        // Semantic Dawn (Text)
        dawn: {
          DEFAULT: "#ECE3D6",
          70: "rgba(236, 227, 214, 0.7)",
          50: "rgba(236, 227, 214, 0.5)",
          30: "rgba(236, 227, 214, 0.3)",
          15: "rgba(236, 227, 214, 0.15)",
          "08": "rgba(236, 227, 214, 0.08)",
          "04": "rgba(236, 227, 214, 0.04)",
        },
        // Tensor Gold (Accent)
        gold: {
          DEFAULT: "#CAA554",
          70: "rgba(202, 165, 84, 0.7)",
          40: "rgba(202, 165, 84, 0.4)",
          15: "rgba(202, 165, 84, 0.15)",
          10: "rgba(202, 165, 84, 0.10)",
          "05": "rgba(202, 165, 84, 0.05)",
        },
        // Dynamics Teal (Cardinal)
        teal: {
          DEFAULT: "#5B8A7A",
          40: "rgba(91, 138, 122, 0.4)",
          15: "rgba(91, 138, 122, 0.15)",
        },
      },
      fontFamily: {
        mono: ["var(--font-pt-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-ibm-plex)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Custom sizes for precise control
        "2xs": ["10px", { lineHeight: "1.4", letterSpacing: "0.1em" }],
        xs: ["11px", { lineHeight: "1.4", letterSpacing: "0.08em" }],
      },
      spacing: {
        // Section spacing tokens
        "section-mobile": "120px",
        "section-tablet": "160px",
        "section-desktop": "200px",
        "section-compact-mobile": "80px",
        "section-compact-tablet": "120px",
        "section-compact-desktop": "160px",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.19, 1, 0.22, 1)",
      },
      transitionDuration: {
        base: "150ms",
        slow: "300ms",
        slower: "500ms",
      },
      animation: {
        float: "float 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateX(-50%) translateY(0)" },
          "50%": { transform: "translateX(-50%) translateY(8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

