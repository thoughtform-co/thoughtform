# ADR-152: The X-Bionic proposal, the Pandora cut without the corridor

- **Status:** Proposed (2026-10-08, owner). Built and guarded, not pushed; flips to Accepted once
  the owner has read `/arcs/x-bionic/proposal` live and it has gone to the client.
- **Surface:** `lib/arcs/content/x-bionic-proposal.ts` (new, scaffolded by `new-arc.mjs`);
  `lib/arcs/content/shared/loopProof.ts` (new: Pandora's part one and About, hoisted so two
  proposals read one record); `lib/arcs/content/shared/samakoWork.ts` (new: two breakdowns);
  `SURI_ITERATIONS` in `shared/suriWork.ts`; `public/arcs/samako/`, `public/arcs/suri/iterations/`;
  `lib/arcs/clients.ts`, `lib/arcs/registry.ts`; `HERO_ROUTES` and its test;
  `sheet-config-fit` (the new picker pinned), `sheet-composition` and `sheet-instrument` (the
  real overview's day moves to the newest filing).
- **Related:** [ADR-128](128-the-pandora-proposal-and-two-kinds.md) (the format this cuts),
  [ADR-133](133-the-configuration-travels.md) (the day-rate rule), [ADR-148](148-the-suri-setup-page-and-the-workshop-frame.md)
  (the case switch and the breakdown grammar), [ADR-098](098-arcs-clients-and-the-proposal.md) (the configuration).

## The call

8 October 2026, with X-Bionic's digital lead: paid social is weak, its job is product education
(form, fit, function, materials across socks, base layers and trail shoes); the company already
runs Claude Enterprise wired to Shopify and analytics; an AI champion on the board owns that
setup and the investors will read the proposal for what plugs into it. He asked for a two-week
phase one, then two days a quarter.

## The decision

**1. The spine (owner).** Hero on the house key visual, the About, then the vision as one
instrument, automation through adoption, Loop's four proof cards ending on the layer the agents
run on, what it returned, that layer at work on four real jobs under one switch, then X-Bionic:
today and configured, the plugin, the engagement, who takes part, the day rate, what we measure.
No corridor.

**2. The vision and the disciplines are one drawing (owner, 2026-10-08).** The `configuration`
picker's tiles are Strategy, Production, Ops and Review, so "creative technology is more than
ads" is drawn as the same layer lit four ways. Each case on the switch names its discipline in its
eyebrow, so the four tiles return as proof.

**3. Other clients by name, their people by role (owner, 2026-10-08).** Samako and Suri are
named on their cases; no staff name, no colleague's quote, no money (the registry's breakdown
guard already refuses a currency sign). Each case is cut to two or three beats: the work and how
it was judged, not the recipe. The reviewer's agreement count on Samako's wave 11 is not printed:
the record never totals it.

**4. The fee is the day rate and the shape (owner, 2026-10-08, ADR-133's rule).** €1,000 a day,
about ten days, two days a quarter. No total.

## What is left open

- X-Bionic's mark for `ClientDef.mark`; the slot is empty until we have the SVG.
- `ARC_PASSWORD_X_BIONIC_PROPOSAL` on Vercel before the link is sent.
- The two pre-existing failures (`skill-file-fidelity`, `thoughtform-armada`) read
  `suri-ai-studio` on disk and fail on `main` too; they are not this change's.
