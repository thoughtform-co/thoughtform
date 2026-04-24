export interface ProductEntry {
  id: string;
  name: string;
  tagline: string;
  synopsis: string;
  status: "live" | "preview" | "forge";
  statusLabel: string;
  capabilities: string[];
  url: string;
  /** Hex color for the ambient glow behind this card */
  glowColor: string;
}

export const PRODUCTS: ProductEntry[] = [
  {
    id: "astrolabe",
    name: "Astrolabe",
    tagline: "Semantic workbench",
    synopsis:
      "Between algorithm and insight, navigation is what remains. Reference, style, strategy — all in one frame.",
    status: "live",
    statusLabel: "Live · beta",
    capabilities: ["Semantic exploration", "Multi-model generation", "Style reference"],
    url: "/astrolabe",
    glowColor: "#CAA554",
  },
  {
    id: "atlas",
    name: "Atlas",
    tagline: "Latent-space bestiary",
    synopsis:
      "Name the creatures of latent space so you can work with them. A catalogue where meaning bleeds into geometry.",
    status: "live",
    statusLabel: "Live · beta",
    capabilities: ["Entity forge", "Connection mapping", "Domain clustering"],
    url: "/atlas",
    glowColor: "#5B7A4E",
  },
  {
    id: "sigil",
    name: "Sigil",
    tagline: "Identity as geometry",
    synopsis:
      "Particle marks and service crests that feel hand-drawn by the system itself. Render identity as geometry.",
    status: "preview",
    statusLabel: "Preview",
    capabilities: ["Generative marks", "Service crests", "Particle rendering"],
    url: "/sigil",
    glowColor: "#CAA554",
  },
  {
    id: "sybil",
    name: "Sybil",
    tagline: "Ambient intelligence",
    synopsis:
      "She reads the schedules of mortals and whispers what approaches. For teams who share a calendar with the future.",
    status: "forge",
    statusLabel: "In forge",
    capabilities: ["Schedule awareness", "Ambient briefings", "Team coordination"],
    url: "#",
    glowColor: "#8B5A5A",
  },
];
