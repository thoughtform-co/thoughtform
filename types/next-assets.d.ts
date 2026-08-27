/**
 * Ambient types for static asset imports (`.png`, `.jpg`, `.svg`, ...).
 *
 * ⚠ THIS EXISTS BECAUSE `next-env.d.ts` IS GITIGNORED AND CI NEVER HAS IT.
 * That generated file carries the only `next/image-types/global` reference in
 * the project, and it is written by `next dev` / `next build` — so a local
 * `tsc --noEmit` resolves image imports and the same command on CI does not.
 * `MobileInstrumentsLab.tsx` imports two PNGs and turned that gap into a red
 * pipeline (`TS2307: Cannot find module '@/docs/design/.../*.png'`) while
 * every developer's machine stayed green.
 *
 * Referencing the same types package twice is idempotent, so this is inert
 * wherever `next-env.d.ts` does exist. Verified by running `tsc --noEmit`
 * with `next-env.d.ts` moved aside — which is the only way to reproduce CI's
 * view of the project locally.
 */

/// <reference types="next/image-types/global" />
