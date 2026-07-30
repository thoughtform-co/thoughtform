# Plan: Review follow-up for 1bf30b9 (message-pass + name harmonization)

## Context

An xhigh-effort adversarial code review of commit `1bf30b9` ("feat(services, about): message-pass the cards + about; harmonize the name") ran on 2026-07-17: 6 finder angles, independent verification of every candidate, 26 verified → 25 kept, collapsing into **15 distinct defects** (12 correctness, 3 cleanup). This plan folds them into fix workstreams. Verdicts: CONFIRMED = code-verified; PLAUSIBLE = mechanism confirmed in code, visual repro pending.

**The unifying theme:** the commit tuned everything against the main landing surface while three sibling surfaces that share the code — the `/claude-workshop` prototype fork, the ≤640px mobile fallback, and the WebGL card-face bake — were not swept.

**Review target note:** the working tree was clean at `1bf30b9` when the review ran. New work (continuum stage math) is landing on top; rebase mentally as needed.

---

## Workstream 1 — Sweep the missed sibling surfaces (user-visible, highest priority)

### 1.1 `/claude-workshop` identity divergence — CONFIRMED

`public/prototypes/v7/landing-claude-workshop.html` (~line 4294) still ships `Vince Buyssens<br><em>// Voidwalker.</em>` plus all three retired bio paragraphs ("has spent a decade moving teams…", "keynotes, intensives, and embedded residencies…"). It is parsed at build time (`lib/v7-parse/index.ts:44`, `getClaudeWorkshopContent`) and served live on `app/(marketing)/claude-workshop/page.tsx` — and it inherits the shared `landing.css` restyle, so it renders retired content in the half-new treatment.
**Fix:** port the 1bf30b9 markup/copy changes into the workshop prototype: drop the `<em>` alias line, replace the three bio paragraphs with the new navigate-the-tides copy (source of truth: `components/landing/home-v2/about/aboutStageData.ts`).

### 1.2 Mobile (≤640px) name/masthead size mismatch — CONFIRMED

Only the base `.voidwalker__name` rule was restyled. The max-width-640 override `font-size: clamp(28px, 7vw, 40px)` at `components/landing/v7/landing.css:9573-9575` (mirrored `public/prototypes/v7/landing-v7-motion.html:4022-4024`) was untouched. Below 640px the static `.voidwalker` fallback is the ONLY about surface (ADR-045; deck stage gated ≥961px): name resolves up to 40px vs the masthead's 26px clamp floor, and the 641→640 crossing jumps 26px→40px.
**Fix:** retune the ≤640 override to track the masthead clamp (same face = same clamp), in both landing.css and the motion prototype.

**DONE.** `landing.css` + `landing-v7-motion.html` landed with the original
pass; `landing-claude-workshop.html:4010` was MISSED and swept 2026-07-30 —
that fork parses its **own** CSS (`getClaudeWorkshopContent`), so the sweep
has to name it explicitly. All three now read `clamp(26px, 3vw, 44px)`.
Verified live on `/claude-workshop`: base and ≤640 rules resolve to the same
clamp, and the name computes 26px at both 641 and 640 (was 26 → 40) —
matching `.services-masthead__title`. This is finding 5.1's drift mode
firing a second time; the token extraction is still open.

### 1.3 Gold glow clipped flat in the deck stage — CONFIRMED

New `text-shadow: 0 0 22px rgba(202,165,84,0.18)` on `.voidwalker__name` (`landing.css:9384`) is cropped by `about-stage.css:117-124`, which permanently applies `clip-path: inset(0 0 0 calc((1-var(--ci))*100%))` to every `.about-stage__copy` child — `inset(0)` still clips painting outside the border box, and the h2's ~48px line box has no headroom for a 22px blur. The masthead one section earlier shows the full halo.
**Fix options:** clear the clip-path once `--ci` reaches 1 (e.g. toggle a `--ci-done` class / animation-fill release), or pad the clip box (`inset(-32px 0 -32px …)`) so the emergence wipe still works but the resolved state has blur headroom. Keep the RTL emergence intact (ADR-047 reveal contract).

---

## Workstream 2 — Ring math: front-card emphasis

### 2.1 MacBook Air (~1440) gets a diluted boost — CONFIRMED

`lib/services-ring/ringMath.ts:92-95`: doc promises the full narrow boost to "laptops incl. MacBook Air ~1440", but `RING_FRONT_EMPHASIS_WIDTH = [1280, 1728]` puts 1440 inside the interpolation band → `smootherstep ≈ 0.246` → emphasis ~0.206 instead of 0.24 (~86%).
**Fix:** either raise the low edge to ≥1440 so the named target sits at/below it, or update the doc + retune constants to whatever is actually intended. Decide once, then pin (see 4.1).

### 2.2 Compounding with the ADR-044 parked-instrument boost — CONFIRMED

`frontScaleEmphasis` (ringMath.ts:98) multiplies with the pre-existing rig-wide boost from `lib/home-v2/parkedInstrumentScale.ts` (applied in `BrandmarkPhysicsCoreActor.tsx:862-866`). Gates differ (width-only 1280–1728 vs aspect>1.3 + height≤1000): a 1440×900 MacBook lands at ~1.15 × 1.206 ≈ **1.39×** tuned base; a 1280×1024 window gets only 1.24×.
**Fix:** make the two boosts aware of each other — either compute the front emphasis net of the parked-instrument scale, or gate both off one shared viewport-class helper. Document the composition in ADR-044.

### 2.3 Entrance offset not retuned for the boosted card — PLAUSIBLE

`ServicesCardRing.tsx:1443` applies `frontBoost` (≤1.24×) during the corridor→services entrance (deck not engaged → fade=1), but `RING_ENTRANCE_OFFSET` (2.1) was tuned so cards start fully off-frame at pre-boost size; with `RING_ENTRANCE_OPACITY_LEAD` completing opacity at 50% travel, the enlarged front card can pop/fade partially in-frame on narrow viewports.
**Fix:** verify visually at ~1280w; if reproduced, scale the entrance offset by the active front boost (or suppress the boost until entrance completes).

---

## Workstream 3 — Plate card choreography + parity

### 3.1 Title decode desynced 40ms from its rise — CONFIRMED

`ServicePlateCard.tsx:202` moved the title `--d2`→`--d3` (0.18s→0.22s) but the scramble-decode offset at `ServicePlateCard.tsx:88-91` is still hardcoded +0.18s with a now-stale comment ("lands … with the \_\_fx--d2 rise"). Decode starts writing into the still-hidden h3.
**Fix:** bump the decode offset to 0.22s (or derive both from one constant) and fix the comment.

### 3.2 Bake/DOM includes→title gap breaks the 2× contract — CONFIRMED

`ServicesCardRing.tsx:599` `incBottom = titleTop - 20`, but the DOM `.svc-plate__title` margin-top is 12px (`services.css:2044`) → the bake's own 2× contract (ServicesCardRing.tsx:519-520, 554-555) demands 24. Net: ~10 vs ~15 CSS px of visual air between surfaces.
**Fix:** set the baked gap to 24 (2×12) and re-eyeball against the DOM plate.

### 3.3 Open-plate height budget not retuned — PLAUSIBLE

The reordered copy stack grew net +12px (margins 52→64), but `.svc-plate__pspace: clamp(200px, calc(100svh - 500px), 360px)` (`services.css:2025`, constant encodes chrome+copy height) wasn't bumped. On <~700px-tall windows (pspace at its 200px floor) the CTA can extend past the tuned stage bound.
**Fix:** verify on a short window; if reproduced, 500→512.

### 3.4 Includes row invisible to heading-nav screen readers — CONFIRMED

`ServicePlateCard.tsx:193`: includes now render before the `<h3>`, so a screen-reader user jumping to the card heading and reading forward never encounters "Monthly cadence · Strategic memos · …".
**Fix:** keep the visual order but restore reading order — e.g. keep includes after the h3 in DOM and reposition visually (grid row / order within the reveal stack), or attach the includes to the heading via `aria-describedby`. Pick whichever preserves the bake parity mapping most simply.

---

## Workstream 4 — Docs, contracts, and pins (fast, do with the above)

### 4.1 No unit pins for the new seam-critical curves — CONFIRMED

`frontScaleEmphasis` / `frontScaleBoost` (ringMath.ts:98,107) are the only curves in the module with zero coverage in `tests/lib/services-ring-math.test.ts`, despite documented seam guarantees (boost ≡ 1 at fade 0; ≡ 1 on side cards; deck seam untouched). Sibling `frontPoseBias` window behavior IS pinned (test line ~370).
**Fix:** add pins for the seam identities + the width-band endpoints (also freezes the 2.1 decision).

### 4.2 ADR-047 still specifies the three-target decode — CONFIRMED

`sentinel/decisions/047-about-deck-flip-stage.md:356` still says NAME / `// Voidwalker.` em / ROLE with 2× stagger; the mandated post-incident ADR update didn't run. Stale in-file comments too: `AboutStage.tsx:13-15` ("name / em / role") and `:20` ("name, then em, then role").
**Fix:** update ADR-047 to the two-target decode (owner decision 2026-07-17: "just my name in caps") + fix the comments.

### 4.3 Two order-contract banners describe the old stack — CONFIRMED

`ServicesCardRing.tsx:36-38` still lists "filled gold chip, feed caption, title, lede, includes" (caption removed in the prior same-day pass; includes moved above title in this one). `services.css:1375-1378` still specifies "photo window → feed caption → title → lede → includes → CTA".
**Fix:** rewrite both banners to the shipped order: photo window → caption → includes → title → lede → CTA.

---

## Workstream 5 — Structural cleanups (lower priority, separate commit)

### 5.1 "One big-title face" duplicated 4+ times — CONFIRMED

`.home-v2-station-header__title`, `.services-masthead__title` (`services.css:464`), `.voidwalker__name` (`landing.css:9371`), and the prototype-HTML mirrors are verbatim copies synced only by "Matched EXACTLY" comments. Finding 1.1/1.2 is this drift mode already happening.
**Fix:** extract `--big-title-*` custom properties into the tokens both pipelines load; point all four sites at them.

### 5.2 Front-window curve triplicated — CONFIRMED

`smootherstep(RING_FRONT_BIAS_WINDOW[0], RING_FRONT_BIAS_WINDOW[1], nz)` appears in `frontPoseBias` (ringMath.ts:78), `frontScaleBoost` (:108), and hardcoded 0.35/0.95 for the glow at `ServicesCardRing.tsx:1502` — computed twice per card per frame.
**Fix:** export `frontWindowWeight(nz)` from ringMath; consume in all three sites.

---

## Refuted during review (do NOT act on)

- "`.voidwalker__name em` rule (landing.css:9387) is dead code" — **false**: the claude-workshop prototype still renders that `<em>` live. It only becomes dead after 1.1 lands; delete it then.

## Verification

- `npm run verify` (lint + typecheck + unit incl. new 4.1 pins).
- Visual: main landing about (desktop deck ≥961px, glow unclipped; ≤640px name/masthead parity), `/claude-workshop` about section, services ring entrance at ~1280w and 1440×900, open plate on a <700px-tall window, VoiceOver/NVDA heading-nav pass over an open plate.
- Post-incident checklist (`sentinel/MAINTENANCE.md`): ADR-047 update is 4.2; consider whether 2.2 warrants an ADR-044 amendment.

---

# Addendum — second sweep: continuum-stage work (2026-07-17)

A second xhigh review ran later the same day over the continuum-stage work that landed on top of `1bf30b9` (the "new work landing on top" flagged in the target note above). 6 finder angles, independent verification of every candidate, 6 verified → 5 kept (two shared a root cause and were merged): **2 correctness, 3 cleanup**. No overlap with workstreams 1–5; all findings are in continuum/waist-rail files the first pass never touched.

## Workstream 6 — Continuum correctness (do with Workstream 1)

### 6.1 `masterOpacityGetterFor` bypasses the `SERVICES_CARD_RING` rollback gate — CONFIRMED

`CorridorArmillary.tsx:260` wires the new per-ring `masterOpacityGetterFor` off `CONTINUUM_RAIL_STAGE` alone, while the adjacent `masterOpacityGetter` prop on the same element is still gated `SERVICES_CARD_RING ? orbitExitGetter : undefined`. `continuumWaistSelector` (`CorridorArmillary.tsx:101`) returns `orbitExitGetter` for every non-waist ring and never returns `undefined`, so inside `HologramOrbits` the `masterOpacityGetterFor?.(o) ?? masterOpacityGetter` chain never reaches the fallback. With `CONTINUUM_RAIL_STAGE = true` + `SERVICES_CARD_RING = false`, every structural ring is still dimmed by the services-exit clock — breaking the "absent ⇒ 1, byte-identical" invariant documented in `HologramOrbits.tsx`.
**Fix:** for non-waist rings, have the selector mirror the adjacent gate — return `SERVICES_CARD_RING ? orbitExitGetter : undefined` — so the flag-off path falls through to the intentionally-undefined `masterOpacityGetter`.

### 6.2 Spectrum stop descriptions `aria-hidden` on the capable-desktop stage — CONFIRMED

`ContinuumStage.tsx:110` wraps the three tool / "AI lives here" / collaborator stop descriptions in `aria-hidden="true"`. The static `.crail__stops-grid` fallback deliberately exposes that same kicker/title/body content and only hides the decorative chrome (frame, bearings, reticle, readout, brand image). Net: desktop screen-reader users hear the masthead and lede but none of the section's core explanatory content; mobile/reduced-motion users get all of it. Regression introduced by this diff.
**Fix:** lift the stop descriptions out of the `aria-hidden` wrapper (keep chrome hidden), matching the fallback's decorative/content split. Pair with the 3.4 VoiceOver/NVDA pass.

## Workstream 7 — Continuum cleanups

### 7.1 Unclamped `delta` in the thumb phase accumulator — CONFIRMED

`ContinuumWaistRail.tsx:79`: `phaseRef.current += delta / THUMB_PERIOD_S` feeds raw useFrame delta into a phase accumulator with no cap, violating the BEST-PRACTICES dt-clamp rule that every other integrator in the codebase follows (`Math.min(0.1, ...)`). A backgrounded tab / frameloop reset while #continuum is engaged snaps the reticle thumb to an arbitrary position on return — exactly what the component's own "no wall clock" comment claims is avoided.
**Fix:** clamp the delta (`Math.min(0.1, delta)`) before accumulating.

### 7.2 Third copy-pasted stage-scroll hook, already diverging — CONFIRMED

`useContinuumStageScroll.ts` is a near-verbatim copy of `useAboutStageScroll.ts` (with `useServicesStageScroll.ts` as a third sibling): same capable-media check, `.home-v2-stage` corridor-fallback probe, disengage/write/rAF structure, resize + 600ms/1800ms settle timers. The drift is already real: this diff adds a `visibilitychange` tab-return re-sync (~lines 104–108) that the about hook now lacks, so #about can silently miss the same stale-frame fix. Same disease as 5.1's "Matched EXACTLY" comment-sync.
**Fix:** extract a shared parametrized pinned-stage scroll-watcher factory and point all three hooks at it; at minimum, port the `visibilitychange` re-sync to the about and services hooks now.

### 7.3 Redundant selector targeting the same node — CONFIRMED

`continuum-stage.css:56-59`: the fallback element is `<div class="continuum continuum--focused">`, so `#continuum[data-continuum-mode="stage"] > .continuum` and `... .continuum--focused` in the same comma-joined rule resolve to the identical node.
**Fix:** drop one of the two selectors (keep the structural `> .continuum`).

## Verification (addendum)

- Flag matrix: `CONTINUUM_RAIL_STAGE = true` + `SERVICES_CARD_RING = false` must render the armillary byte-identical to the pre-services-ring behavior (no ring dimming past the services exit).
- Screen reader (VoiceOver/NVDA) over #continuum on a capable desktop viewport: all three stop descriptions must be announced.
- Tab-hide with #continuum engaged and the approach envelope open, return after ~10s: thumb must resume smoothly, no teleport.
- After 7.2: #about and #services stages still re-sync on tab return.
