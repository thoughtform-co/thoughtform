"use client";

/**
 * Post-processing pipeline placeholder.
 *
 * The EffectComposer/Noise path was disabled because of a version mismatch
 * between @react-three/postprocessing v3 and @react-three/fiber v8 in this
 * project (throws "Cannot read properties of undefined (reading 'length')"
 * at runtime). Add a dedicated pass here once the versions are aligned; the
 * DOM-side transition is the active codepath for now.
 */
export function SceneBlur() {
  return null;
}
