import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "@/lib/security/headers";

/**
 * The Draco/CSP contract, pinned (2026-09-01, the CSP enforcement pass).
 *
 * drei's default decoder path is `https://www.gstatic.com/draco/…` — a host
 * the enforced CSP deliberately does not allow. ADR-074 recorded that as
 * "what stands between this policy and enforcement"; the pre-launch audit
 * then mis-measured both GLBs as non-Draco, and the FIRST RUN of this test
 * (in its original "no Draco anywhere" form) caught the truth: the
 * brandmark — the corridor's centerpiece — REQUIRES
 * KHR_draco_mesh_compression. So the invariant is not "no Draco"; it is
 * "Draco never leaves this origin":
 *
 *   1. If any production GLB requires Draco, the decoder is self-hosted
 *      under public/draco/ (copied from three/examples/jsm/libs/draco/gltf;
 *      re-copy when three is upgraded).
 *   2. Every module that loads production GLBs points drei at it.
 *   3. The enforced CSP carries 'wasm-unsafe-eval' (wasm-only, never JS
 *      eval) — Chrome refuses WebAssembly.instantiate without it even for
 *      same-origin wasm.
 */

const ROOT = join(__dirname, "..", "..");
const PRODUCTION_GLBS = [
  "public/models/brandmark/brandmark.glb",
  "public/models/voidwalker/thoughtform.glb",
];
const GLB_LOADER_MODULES = [
  "components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx",
  "components/landing/home-v2/services/hologram/VolumetricBrandmarkArtifact.tsx",
];

function isDraco(path: string): boolean {
  const buf = readFileSync(path);
  expect(buf.toString("ascii", 0, 4), `${path} is a GLB`).toBe("glTF");
  const jsonLength = buf.readUInt32LE(12);
  expect(buf.toString("ascii", 16, 20), `${path} first chunk is JSON`).toBe("JSON");
  const json = JSON.parse(buf.toString("utf8", 20, 20 + jsonLength));
  return [...(json.extensionsUsed ?? []), ...(json.extensionsRequired ?? [])].includes(
    "KHR_draco_mesh_compression"
  );
}

describe("Draco never leaves this origin", () => {
  const dracoGlbs = PRODUCTION_GLBS.filter((rel) => isDraco(join(ROOT, rel)));

  it("knows which GLBs are compressed (the brandmark is, on purpose)", () => {
    // If this list changes, the change is a decision: a NEW Draco GLB rides
    // the same self-hosted decoder for free; the brandmark becoming plain
    // would let this whole contract retire.
    expect(dracoGlbs).toEqual(["public/models/brandmark/brandmark.glb"]);
  });

  it("self-hosts the decoder the compressed GLBs need", () => {
    if (dracoGlbs.length === 0) return;
    for (const f of ["draco_wasm_wrapper.js", "draco_decoder.wasm", "draco_decoder.js"]) {
      expect(existsSync(join(ROOT, "public/draco", f)), `public/draco/${f} missing`).toBe(true);
    }
  });

  it("points every GLB-loading module at the self-hosted path", () => {
    if (dracoGlbs.length === 0) return;
    for (const rel of GLB_LOADER_MODULES) {
      const source = readFileSync(join(ROOT, rel), "utf8");
      expect(source, `${rel} must call useGLTF.setDecoderPath("/draco/")`).toMatch(
        /useGLTF\.setDecoderPath\(\s*["']\/draco\/["']\s*\)/
      );
    }
  });

  it("keeps 'wasm-unsafe-eval' in the enforced script-src while Draco ships", () => {
    if (dracoGlbs.length === 0) return;
    const prod = buildContentSecurityPolicy({ allowUnsafeEval: false });
    expect(prod).toMatch(/script-src[^;]*'wasm-unsafe-eval'/);
  });

  it("never allows the gstatic decoder host", () => {
    const prod = buildContentSecurityPolicy({ allowUnsafeEval: false });
    expect(prod).not.toContain("gstatic.com");
  });
});
