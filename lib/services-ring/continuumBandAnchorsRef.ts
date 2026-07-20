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
  /** The centre seat block ("AI lives here" + the statement + body +
   *  readout), projected to the band's MIDPOINT (ADR-049 U9). Before U9 it
   *  was screen-anchored at a fixed --continuum-axis-y, so it drifted
   *  against the projected caps under the approach zoom and pointer-look
   *  and read as pasted over the mark. Projecting it makes the whole
   *  instrument — caps, reticle, seat — one rigid body riding the mark. */
  seatEl: HTMLElement | null;
  /** The readout's live value spans. The projector writes textContent every
   *  frame (delta-gated on the 2dp string) with the head's complementary
   *  tool / collaborator weights. */
  readoutToolEl: HTMLElement | null;
  readoutCollabEl: HTMLElement | null;
  /** The stage root. Carries the writer-owned `data-continuum-assembled`
   *  attribute: the projector sets it when the chrome window opens
   *  (hysteresis on labelGain) and removes it when the band closes, which
   *  resets the CSS type-on / unfold animations so the instrument re-plays
   *  its assembly on every re-entry. */
  stageEl: HTMLElement | null;
}

export const continuumBandAnchorsRef: { current: ContinuumBandAnchorEls } = {
  current: {
    leftEl: null,
    rightEl: null,
    reticleEl: null,
    seatEl: null,
    readoutToolEl: null,
    readoutCollabEl: null,
    stageEl: null,
  },
};
