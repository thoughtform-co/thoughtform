# Gateway Motion — treatment comparison

Live side-by-side: `/test/gateway-motion` (dev). All treatments consume the
same manifest (`public/gateway-motion/manifest.json`, `npm run gateway:prep`).

First-pass measurements from the initial build session (2026-07-05, desktop
RTX 5080, 1568×669 viewport, Chrome; refine after a tuning pass on real
target hardware — especially a mid-tier laptop + phone):

|                                 | KEN BURNS                  | DEPTH PARALLAX                             | 2.5D MESH                                       | LIVING PLATE                             | SCRUB SEQUENCE                                                             |
| ------------------------------- | -------------------------- | ------------------------------------------ | ----------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| Plate fidelity                  | perfect                    | ~perfect (reprojection ≤26 px)             | good at relief ≤0.55; taffy-stretch beyond ~0.7 | perfect (plate is static)                | limited by source render (proxy = old AI video; grain layer rescues a lot) |
| Motion depth illusion           | none (zoom only)           | good — real occlusion feel at small shifts | strongest — true perspective + orbit            | none (life, not depth)                   | as good as the rendered camera move                                        |
| Idle life (no scroll)           | drift only                 | shimmer + sweep + grain                    | shimmer via grain + orbit sway                  | star twinkle + motes + grain — the point | static frame until scroll                                                  |
| Payload (gateway-v1, AVIF path) | ~77 KB plate               | ~77 KB + 40 KB depth + 6 KB mask           | ~77 KB + 40 KB depth + 113 KB background        | plate + 238 KB star mask                 | 8.0 MB proxy (145×1280w WebP); AVIF finals ~similar at 1600w               |
| Runtime cost                    | ~zero (CSS/GSAP transform) | 1 fullscreen quad, trivial GPU             | 320×180-seg mesh + bg plane — light             | 2D canvas, ~zero                         | canvas blit on frame change, ~zero GPU                                     |
| WebGL required                  | no                         | yes (fallback → Ken Burns)                 | yes (fallback → Ken Burns)                      | no                                       | no                                                                         |
| Mobile viability                | perfect                    | good (dpr cap 1.4)                         | good, halve segments                            | perfect                                  | watch payload; ship 1280w + fewer frames                                   |
| Reduced motion                  | static frame (built-in)    | render once, no anim                       | render once, no anim                            | static plate, overlays off               | poster only                                                                |
| Production effort from here     | none                       | tuning only                                | tuning only                                     | tuning only                              | needs a real render (TD/UE) to replace the proxy                           |

## Read of the room (initial recommendation)

- **Hero candidate: DEPTH PARALLAX + the Living Plate ideas layered in**
  (its shader already carries grain/shimmer/sweep). Near-perfect fidelity,
  tiny payload, pointer-reactive, degrades cleanly.
- **2.5D MESH** is the "wow" demo and the best pitch for what a real UE
  rebuild would feel like — keep relief ≤0.55 for brand-safe fidelity.
- **SCRUB SEQUENCE** is infrastructure: it turns any future TD/UE render
  into a scroll-synced hero with zero code. The proxy already proves the
  legacy AI video is usable _today_ with the grain layer masking its softness.
- **KEN BURNS** stays as the universal fallback and reduced-motion path.
- **LIVING PLATE** techniques should layer onto whichever treatment wins,
  not compete (twinkle needs a static or WebGL-registered plate).

## Follow-ups before promoting to the landing hero

- [ ] Tuning pass per visual → persist as `tuning` blocks in the manifest
      (survives `gateway:prep` re-runs).
- [ ] Phone + mid-laptop FPS pass (dpr caps, mesh segment halving).
- [ ] Decide depth-packed (16-bit) vs 8-bit depth on the mesh after looking
      for banding on large displays.
- [ ] TD or UE render replaces the scrub proxy (docs in this folder).
- [ ] Hero integration plan (v7 prototype's `.gateway` div is the slot;
      protected-path rules apply — see ADR-027).
