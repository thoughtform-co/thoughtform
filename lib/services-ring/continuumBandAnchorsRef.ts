// Continuum band label anchors — the cross-tree bridge between the corridor
// canvas (which projects the mark-band's endpoints each frame) and the DOM
// continuum stage (which renders the Tool / Collaborator cap labels).
//
// ADR-049 Update 3 rev a: the labels are DOCKED to the band's PROJECTED 3D
// endpoints so they ride the instrument through pointer-look / the approach
// zoom instead of being plastered at fixed positions. The stage REGISTERS its
// two cap elements here (mount effect); the corridor-side publisher
// (`ContinuumBandLabelAnchors` in BrandmarkPhysicsCoreActor) projects the
// endpoints and writes transform/opacity onto them imperatively every frame —
// no store, no re-render, no DOM-side rAF loop (the corridor's frame loop is
// the single writer, and it is already alive exactly while the band can be).
//
// Kept free of three/react imports: the DOM stage imports this module, and
// the continuum stage must stay off the landing route's heavy chunks.

export interface ContinuumBandAnchorEls {
  /** Tool cap (left band end). Registered by ContinuumStage; null while the
   *  stage is unmounted / below the capability gate. */
  leftEl: HTMLElement | null;
  /** Collaborator cap (right band end). */
  rightEl: HTMLElement | null;
}

export const continuumBandAnchorsRef: { current: ContinuumBandAnchorEls } = {
  current: { leftEl: null, rightEl: null },
};
