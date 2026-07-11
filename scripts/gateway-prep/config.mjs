// Gateway Motion prep — shared configuration.
// Source plates live in Dropbox (path has spaces — always pass as argv array,
// never through a shell string; see prep.mjs spawnSync usage).

export const DEFAULT_SRC_DIR =
  "C:/Users/buyss/Dropbox/03_Thoughtform/01_Thoughtform Branding/05_Key Visuals/2026/Web";

export const VISUALS = [
  { id: "gateway-v1", srcFile: "Gateway_v1.webp", name: "Gateway I" },
  { id: "gateway-v1b", srcFile: "Gateway_v1b.webp", name: "Gateway I·b" },
  { id: "gateway-v2", srcFile: "Gateway_v2.webp", name: "Gateway II" },
  { id: "gateway-v3a", srcFile: "Gateway_v3a.webp", name: "Gateway III·a" },
  { id: "gateway-v4", srcFile: "Gateway_v4.webp", name: "Gateway IV" },
  { id: "gateway-v5", srcFile: "Gateway_v5.webp", name: "Gateway V" },
  { id: "gateway-v6a", srcFile: "Gateway_v6a.webp", name: "Gateway VI·a" },
  { id: "gateway-v7", srcFile: "Gateway_v7.webp", name: "Gateway VII" },
  { id: "gateway-v8", srcFile: "Gateway_v8.webp", name: "Gateway VIII" },
  { id: "gateway-v9", srcFile: "Gateway_v9.webp", name: "Gateway IX" },
];

export const OUT_PUBLIC = "public/gateway-motion";
export const OUT_MASTERS = "scripts/gateway-prep/out";
export const MODEL_PATH = "scripts/gateway-prep/models/depth_anything_v2_vitb.onnx";

// Web derivative targets (see docs/gateway-motion/COMPARISON.md for budgets).
export const PLATE_WIDTHS = [2560, 1600];
export const AVIF_QUALITY = 45;
export const WEBP_QUALITY = 78;
export const DEPTH_WEB_WIDTH = 1024;
export const MASK_WEB_WIDTH = 1024;
export const BACKGROUND_WEB_WIDTH = 1600;
export const LQIP_WIDTH = 24;
