// Continuum band slider anchors — the cross-tree bridge between the corridor
// canvas (which projects the mark-band's endpoints + the slider head each
// frame) and the DOM continuum stage (which renders the Tool / Collaborator
// cap labels and the navigator reticle).
//
// ADR-049 Update 6: the tool ↔ collaborator slider is INTEGRATED INTO the
// brandmark's horizontal wireframe band — the band lights in the mark's own
// shader (the `uBand*` block) and every piece of DOM chrome docks to the
// band's PROJECTED geometry so it rides the instrument through the approach
// zoom instead of being plastered at fixed screen positions. The stage
// REGISTERS its elements here (mount effect); the corridor-side publisher
// (`ContinuumBandSliderAnchors` in BrandmarkPhysicsCoreActor) projects the
// band each frame and writes transform/opacity onto them imperatively — no
// store, no re-render, no DOM-side rAF (the corridor's frame loop is the
// single writer, and it is already alive exactly while the band can be).
//
// Kept free of three/react imports: the DOM stage imports this module, and
// the continuum stage must stay off the landing route's heavy chunks.

export interface ContinuumBandAnchorEls {
  /** Tool cap (left band end). Registered by ContinuumStage; null while the
   *  stage is unmounted / below the capability gate. */
  leftEl: HTMLElement | null;
  /** Collaborator cap (right band end). */
  rightEl: HTMLElement | null;
  /** The navigator reticle riding the lit band — positioned at the slider
   *  head's projected point (the SAME x01 the shader's pendulum head
   *  lights, so the crisp DOM diamond and the glowing particle head are
   *  one object). */
  reticleEl: HTMLElement | null;
}

export const continuumBandAnchorsRef: { current: ContinuumBandAnchorEls } = {
  current: { leftEl: null, rightEl: null, reticleEl: null },
};
