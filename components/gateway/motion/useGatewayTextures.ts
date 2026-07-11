"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { pickPlate, supportsAvif, type GatewayVisualEntry } from "@/lib/gateway-motion/manifest";

export interface GatewayTextureSet {
  plate: THREE.Texture;
  depth: THREE.Texture | null;
  mask: THREE.Texture | null;
  background: THREE.Texture | null;
}

interface TextureNeeds {
  depth?: boolean;
  mask?: boolean;
  background?: boolean;
}

function configure(tex: THREE.Texture, mips: boolean) {
  // NoColorSpace + <Canvas flat linear> = plate bytes pass through
  // untouched (see shaders.ts header). Depth/masks are data — never mips.
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  tex.generateMipmaps = mips;
  tex.anisotropy = 1;
  tex.needsUpdate = true;
}

/**
 * Loads the texture set a WebGL treatment needs for one visual, sized for
 * the current viewport (plate picked from the manifest srcset, AVIF when
 * decodable). Resolves to null until every requested texture is ready, so
 * treatments swap atomically; disposes everything on visual change/unmount.
 */
export function useGatewayTextures(
  entry: GatewayVisualEntry | null,
  needs: TextureNeeds,
  dprCap: number
): GatewayTextureSet | null {
  const [set, setSet] = useState<GatewayTextureSet | null>(null);
  const needsDepth = Boolean(needs.depth);
  const needsMask = Boolean(needs.mask);
  const needsBackground = Boolean(needs.background);

  useEffect(() => {
    // No synchronous resets here: the cleanup below already nulled the set
    // when deps changed, and the initial state is null.
    if (!entry) return;
    if (needsDepth && !entry.depth) return;

    let disposed = false;
    const loader = new THREE.TextureLoader();
    const loaded: THREE.Texture[] = [];

    const load = (src: string, mips: boolean) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          src,
          (tex) => {
            configure(tex, mips);
            loaded.push(tex);
            resolve(tex);
          },
          undefined,
          reject
        );
      });

    (async () => {
      const avifOk = await supportsAvif();
      const cssWidth = window.innerWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const plateSrc = pickPlate(entry, cssWidth, dpr, avifOk).src;

      const [plate, depth, mask, background] = await Promise.all([
        load(plateSrc, true),
        needsDepth && entry.depth ? load(entry.depth.src8, false) : Promise.resolve(null),
        needsMask && entry.masks.artifact
          ? load(entry.masks.artifact, false)
          : Promise.resolve(null),
        needsBackground && entry.masks.background
          ? load(entry.masks.background, true)
          : Promise.resolve(null),
      ]);

      if (disposed) return;
      setSet({ plate, depth, mask, background });
    })().catch((err) => {
      if (!disposed) console.error("[gateway-motion] texture load failed", err);
    });

    return () => {
      disposed = true;
      setSet(null);
      for (const tex of loaded) tex.dispose();
    };
  }, [entry, needsDepth, needsMask, needsBackground, dprCap]);

  return set;
}
