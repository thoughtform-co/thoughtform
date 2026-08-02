/**
 * rigPointerYawRef — the yaw, in radians, that `BrandmarkPhysicsCoreActor`
 * currently has applied to its `pointerLookRef` group (pointer-look damp +
 * per-service settle pose, i.e. exactly the `rotation.y` it writes).
 *
 * Writer: `BrandmarkPhysicsCoreActor`, once per frame, on the same line that
 * applies the rotation — so the published value can never disagree with the
 * scene graph.
 *
 * Reader: `ServicesCardRing`, to CANCEL this yaw on a card whose spec drawer
 * is open (ADR-050 "Flush seam"). The open pair is a card plus a tray offset
 * along the card's local +x, so any world yaw puts the two slabs at different
 * depths and perspective then draws the tray shorter than the card — their
 * top and bottom borders visibly step apart. Subtracting the rig's yaw from
 * the card's own leaves the OPEN PAIR square to the camera while the mark and
 * the orbits keep leaning with the cursor, which stilling the rig outright
 * did not (that made the whole instrument go dead while a card was open).
 *
 * Why a published number and not `parent.rotation.y` off the scene graph:
 * `ServicesCardRing` sits two groups below `pointerLookRef` (via
 * `CorridorArmillary`), so walking up would conflate any other rotation on
 * the way — and what has to be cancelled is precisely the pointer term.
 *
 * Vanilla module ref (not Zustand): written every frame, never needs to
 * trigger a React render, one polling reader. The `brandmarkScreenRectRef`
 * precedent.
 */

export const rigPointerYawRef: { current: number } = { current: 0 };

/**
 * rigPointerPitchRef — the same contract, one axis over: the `rotation.x`
 * (pointer-look damp + settle pose) the actor applied this frame.
 *
 * Published 2026-08-02, when the owner reported the open pair reading
 * "Escher-esque". Yaw had been cancelled since ADR-050, but PITCH still
 * accumulated two channels (this rig term plus the card's own hover tilt) to
 * ~0.3 rad at a screen corner — and at that lean the pair's extruded frames
 * stop agreeing with their flat baked faces: the glass box shows its side
 * walls and both silhouettes while the content barely foreshortens. The ring
 * DAMPS (not zeroes) the pair's world pitch through `openPairPitch`, so the
 * open state keeps a whisper of pointer life without the impossible-object
 * read. Same single-writer line as the yaw above.
 */
export const rigPointerPitchRef: { current: number } = { current: 0 };
