# Voidwalker flight-grammar lab

The look-dev harness for ADR-081's flight grammar. Runs off
`/test/voidwalker-flight-lab` (dev-only) and captures a preset table
into contact sheets for owner pick.

## How to use

**Ship a lever change:** run the dev server (`npm run dev`), open
`http://localhost:3003/test/voidwalker-flight-lab`. The panel top-left
lists the current knobs (default value on the right, dirty values in
gold). Every knob syncs to the URL, so a variant can be linked or
reloaded. Presets are one-click shortcuts.

**Capture one preset:**

```
node scripts/capture-voidwalker-travel.mjs \
  --variant V2-noomo-swing --headless --vp 1440x800
```

Writes stills to `docs/design/voidwalker-flight-lab/1440x800_dark_<preset>_<mark>.png`.

**Capture ALL presets** (one subprocess per preset, subfoldered):

```
node scripts/capture-voidwalker-travel.mjs --all-variants --headless
```

Writes to `docs/design/voidwalker-flight-lab/<preset>/…`.

## Presets

Table lives in [`app/(internal)/test/voidwalker-flight-lab/FlightLabPanel.tsx`](<../../../app/(internal)/test/voidwalker-flight-lab/FlightLabPanel.tsx>)
(`PRESETS`) and mirrored in [`scripts/capture-voidwalker-travel.mjs`](../../../scripts/capture-voidwalker-travel.mjs)
(`PRESET_URLS`). Any preset added to the panel must also be added to
the CLI table before `--all-variants` picks it up.

- **V1-default** — production baseline. Straight-lerp path, no bank,
  no bow, additive uniforms at zero. Every capture is byte-identical
  to a marketing-page capture at the same viewport/theme, so this is
  the regression pin as much as the reference.
- **V2-noomo-swing** — curved swing (Noomo/Codrops reference). Bow
  (`curveBend 0.18`) + bank (`rollMax 8`) + wider approach
  (`xFar 0.32`, `xNear 0.78`), yaw lifted to 12°. Cards fly OUT past
  their park before arriving and throw wide on the way past.
- **V3-housed** — housed flight. Same swing as V2 with slightly
  gentler numbers, plus the drawn housing frame (`beatHousingOpacity`)
  powers on with the detail gate. The panel exposes the card
  through-line whether or not the pick lands on V3; the housed variant
  simply gates the frame visibility on the ADR-081 U2 detail ramp.
- **populated-field** — the "field reads populated" lever set. Span
  widened to 5 (so up to 5 slim cards paint down the tunnel), fog
  reach deepened (`fogIn 0.88`, `fogOut 0.36`), wall density × 1.35.
  Layered ON TOP of any path variant.
- **slow-cinema** — feel lever. Chase widened to 0.32 s, runway
  extended to 18 svh. The reference sites' "buttery" comes as much
  from a slower damped clock as from more content in the field.
- **entry-burst** — entry-dive drama. `entryReactionStrength 1` +
  `velocityStrength 1`: the nearest ring blooms as the camera dives
  through the mark, and scroll velocity brightens the walls in flight.
  0 in production, so combining this with V1 shows the addressable
  headroom without any other change.

## Contact sheet layout

The capture script walks every stop plus two mid-flight marks
(`flight-a`, `flight-b`) plus the foot and a `before` mark ABOVE the
runway. The last is load-bearing: it proves the rail's gate is
positional, not modal (ADR-081 U1). Every mark is captured per
preset so a comparison reads across the same runway progress.

## Governor / regression pins

- `V1-default` MUST come out byte-identical to a same-viewport,
  same-theme capture of `/`. Any drift means the config resolver
  leaked a non-default value into production. Compare against
  `docs/design/voidwalker-travel/`.
- Every preset run asserts the ADR-081 gate suite: travel engaged,
  runway inflated, ambient alive at every stop, ≤3 painting, chase
  damped, rail lit only inside the runway.

## Where it lives in code

- Config module (three-free): [`lib/voidwalker/voidwalkerFlightConfig.ts`](../../../lib/voidwalker/voidwalkerFlightConfig.ts)
- Clock (reads config at call time): [`lib/voidwalker/voidwalkerTravelClock.ts`](../../../lib/voidwalker/voidwalkerTravelClock.ts)
- Hook (writes velocity, roll, housing vars): [`components/landing/home-v2/hooks/useVoidwalkerTravelScroll.ts`](../../../components/landing/home-v2/hooks/useVoidwalkerTravelScroll.ts)
- Tunnel (consumes velocity + entry-burst): [`components/landing/home-v2/DepthGatewayScene/VoidwalkerTimeTunnel.tsx`](../../../components/landing/home-v2/DepthGatewayScene/VoidwalkerTimeTunnel.tsx)
- Panel: [`app/(internal)/test/voidwalker-flight-lab/FlightLabPanel.tsx`](<../../../app/(internal)/test/voidwalker-flight-lab/FlightLabPanel.tsx>)
- Route (mounts the marketing landing + panel): [`app/(internal)/test/voidwalker-flight-lab/page.tsx`](<../../../app/(internal)/test/voidwalker-flight-lab/page.tsx>)
