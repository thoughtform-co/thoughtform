/**
 * useMediaTexture — load a block's still image (always) and, when the
 * block is `active`, a looping video sampled live into the voxel grid.
 *
 * Perf contract (plan): at most ONE video decodes at a time. The grid
 * passes `active` to exactly one block (in-view / hovered); inactive
 * blocks fall back to their still image and the video element is paused.
 * The video is muted + `playsInline` + low-res by construction.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { SRGBColorSpace, Texture, TextureLoader, VideoTexture } from "three";

export interface MediaTextureResult {
  /** The currently-active texture (video when playing, else still image). */
  texture: Texture | null;
  /** Natural aspect ratio (width / height) of the still image. */
  aspect: number;
}

export function useMediaTexture(
  image: string,
  video: string | undefined,
  active: boolean,
): MediaTextureResult {
  const [imageTex, setImageTex] = useState<Texture | null>(null);
  const [aspect, setAspect] = useState(1);
  const [videoReady, setVideoReady] = useState(false);

  // --- still image (always loaded) ---
  useEffect(() => {
    let disposed = false;
    const loader = new TextureLoader();
    loader.load(image, (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = SRGBColorSpace;
      const img = tex.image as HTMLImageElement;
      if (img?.width && img?.height) setAspect(img.width / img.height);
      setImageTex(tex);
    });
    return () => {
      disposed = true;
    };
  }, [image]);

  // --- video element (created once if a src exists; played only when active) ---
  const videoEl = useMemo<HTMLVideoElement | null>(() => {
    if (!video || typeof document === "undefined") return null;
    const el = document.createElement("video");
    el.src = video;
    el.loop = true;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.crossOrigin = "anonymous";
    el.preload = "auto";
    return el;
  }, [video]);

  const videoTex = useMemo<VideoTexture | null>(() => {
    if (!videoEl) return null;
    const tex = new VideoTexture(videoEl);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, [videoEl]);

  const playingRef = useRef(false);
  useEffect(() => {
    if (!videoEl) return;
    const onData = () => setVideoReady(videoEl.readyState >= 2);
    videoEl.addEventListener("loadeddata", onData);

    if (active) {
      const p = videoEl.play();
      if (p?.catch) p.catch(() => {});
      playingRef.current = true;
    } else if (playingRef.current) {
      videoEl.pause();
      playingRef.current = false;
    }

    return () => {
      videoEl.removeEventListener("loadeddata", onData);
    };
  }, [active, videoEl]);

  // Dispose video texture + element on unmount.
  useEffect(() => {
    return () => {
      videoTex?.dispose();
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
      }
    };
  }, [videoTex, videoEl]);

  const useVideo = active && videoReady && videoTex != null;
  return { texture: useVideo ? videoTex : imageTex, aspect };
}
