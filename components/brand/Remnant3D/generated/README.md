# Generated — do not hand-edit

`createRemnantModel.ts` and `object-sculpt-spec.json` are **verbatim output** of
the [img2threejs](https://github.com/hoainho/img2threejs) skill
(v1.4.0, Apache-2.0), run against the Gateway key visual. They are checked in for
provenance, so the reconstruction can be audited and re-run.

## What produced them

Source plate: `public/images/Gateway_v1b.webp`, via the derivatives that
`scripts/gateway-prep/` already generates — `plate-2560.webp` cut against
`mask-artifact.webp` (largest connected component only, so the light streaks and
the telemetry block are excluded), with `depth-8.webp` as the second reference.

Pipeline: pre-spec assessment → sculpt spec → `--strict-quality` validation →
`generate_threejs_factory.py`. Material scalars come from
`extract_pbr_evidence.py` (confidence 0.83–0.86) and per-component colour recipes
from `extract_part_color_recipe.py`, both run over real pixel crops — not
hand-authored.

## What is NOT from the generator

The spiral spine in `geometryDescriptor.curveSweep` is **ours**. The generator
falls back to a single hardcoded S-curve placeholder for every `curve-sweep`
component when that field is absent, so the actual form was solved separately
against measurements taken off the mask (cavity inscribed radius, coil outer
radius, spar band centroids) and written into the spec before code generation.
That solver lives in the session scratchpad, and its constants are reproduced in
`../remnantSpine.ts` — that file is the maintained source of truth for the curve.

## To regenerate

Re-run the pipeline against an updated spec and overwrite this file. Do not patch
it by hand: edits here are lost on the next run, and the point of checking it in
is that it stays a faithful record of what the tool produced.

Anything that shapes how the object _looks_ on the site — materials, the fray,
lighting — belongs in `../Remnant3D.tsx`, not here.
