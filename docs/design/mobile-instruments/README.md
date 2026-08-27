# Proof + Voidwalker mobile instruments

Status: implemented direction, pending final visual approval on physical phones.

These screens are not compressed versions of the desktop compositions. On a
phone, each section becomes one stable instrument with explicit modes, one
dominant content seat, and direct position controls. Canonical website content
still comes from the case and era registries; the generated images below are
layout studies, not content sources.

## Information architecture

### Proof

1. Client and case position
2. Selected case identity and classification
3. `BRIEF / PROOF / ARTIFACT` view switch
4. One active, height-stable content seat
5. Four-stop case rail

The desktop Directory remains mounted for its wide-screen contract. At
`<=960px`, the case rail owns selection and the three-button switch retunes one
seat. Briefs, evidence registers, maps, tools, and studio sheets can scroll
inside that seat, but release to page scrolling at their bounds.

### Voidwalker

1. Era identity and position
2. Full-body hologram and projector
3. Six-stop era rail
4. `RECORD / SCOPE / TRANSMISSION` dossier switch
5. One active, height-stable dossier seat

At `<=700px`, all six eras remain directly tappable in one row. Transmission
is unavailable when an era has no authored film. The wider `701–1100px`
normal-flow fallback and the capable desktop character sheet remain unchanged.

## Interaction and visual contract

- Minimum control height is 44px; important state is never swipe-only.
- Identity, navigation, and active content remain visible as one coherent
  instrument instead of a long serialized document.
- Phone navigation is normal-flow, not fixed or sticky.
- Void black, parchment, and restrained antique gold remain the only hierarchy
  system. Geometry is sharp, rules are hairline, and active state is a bearing
  rather than a filled pill.
- The useful reference patterns were a dominant stage, compact readouts,
  explicit modes, and a persistent position rail. Literal Cyberpunk branding,
  medical semantics, invented telemetry, rounded cards, and decorative game
  chrome were rejected.

Refero references were used as pattern evidence: Gt Planar for severe planar
hierarchy, Oxide for compact technical data, Julia Krantz for index density,
and RAD Weather / Linear / Box Box Club for large mobile targets, explicit
state, and dominant visual staging.

## Concept studies

- [Proof mobile concept](./proof-mobile-concept.png)
- [Voidwalker mobile concept](./voidwalker-mobile-concept.png)
- Interactive HTML/React look-dev: `/test/mobile-instruments` while the local
  development server is running.

The studies were generated with GPT Image 2 from the supplied panel references
and existing Thoughtform imagery. Their copy, quantities, and character-era
selection are illustrative; production UI must use the repository's canonical
records.

## Verification matrix

The browser contract walks Proof at `320×568`, `390×844`, and its `960px`
boundary; Voidwalker at `320×568`, `390×844`, `700×900`, and the `701px`
fallback boundary. It checks one active surface, invariant seat geometry,
44px controls, local horizontal fit, media containment, semantic current/
pressed state, unavailable transmissions, and release from nested scrolling.
