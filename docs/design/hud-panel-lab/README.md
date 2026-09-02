# The HUD panel lab

**`http://localhost:3003/test/hud-panel-lab`**

Six directions, two surfaces, one question: **do the evidence panels belong to
the frame, or are they sitting in front of it?**

The owner's read (2026-09-02, pre-launch): on both surfaces the elements "just
seem to be floating. They don't really feel integrated as part of a HUD or
interface … If you look at all the references I shared, it just feels more
balanced and integrated."

Nothing on the landing has changed. There is no flag — a winner is promoted
with its own ADR and the losers are deleted with their guards (ADR-070 U35).

---

## What the references actually do

⚠ **The 30 images the owner means are the one part of the reference pool the
design skill never saw.** Every `original:` path in the corpus's 53 notes
points at the flat root of `_01_GENERAL REFERENCES`, plus `LP\` and
`Marathon\`. Not one points into **`Panels\`** or **`Character\`** — which is
where the Vilimovský Cyberpunk 2077 kit, the amber terminal instruments and
the character screens live. So "the skill was trained on these" is false for
exactly the set this pass is about, and these distillations stand in until the
surveyor is run over those two folders.

Read across all 30, six things separate them from our two surfaces:

1. **A datum and a terminus.** Every reference hangs from a header strip (the
   tablet's `RIPPERDOC SURGICAL SOFTWARE V2 | FIR SK 5.0 MFS | FLAIR TRS 5mmP`;
   the amber instruments' thick rule over `GALACTIC POSITION · ACTIVE · 2B`)
   and sits on a foot row (a barcode strip, a row of indicator chips). Content
   is bounded above and below by chrome that belongs to the device.
2. **Seams, not gutters.** Adjacent regions share drawn edges and cells touch.
   Alignment is drawn where regions meet, never as a long line through empty
   space — which is also why the owner deleted our datum rails twice.
3. **A line-weight ladder.** Thick datum / 1px edges / faint interior rules.
   Ours is one weight: every rule on the casefile is 1px of **gold** at
   .12–.24 while the frame beside it runs 2px of **dawn** at .55. A hue swap
   and a 4× alpha gap between a panel and the thing it is meant to belong to
   is itself the "not part of the HUD" signal.
4. **Corner labels.** A field with micro-labels in its corners reads as an
   instrument; a field with bare corners reads as a picture.
5. **The centrepiece has a bay.** The figure or the evidence sits in a column
   with head and foot micro-labels (`FN 17 HEAD`, `MODEL LINE 12.12AA`),
   seated in an apparatus rather than floated in a space.
6. **One material.** Today the proof surface is a boxed translucent console
   beside bare text-on-void; the era stage is bare text around a glowing
   figure.

**What NOT to take**, per the corpus's own rulings and this house's: the red
or teal as a primary accent, the CRT curvature and decorative scanlines, the
bloom, the placeholder-data density, and any leader line from a label to a
body part (ADR-082 U19: it claims a relationship the record does not have).

---

## The directions

Each is one thesis, applied identically to both surfaces so the owner is
choosing a **site-level grammar** rather than two panel fixes.

| id   | name           | what it does                                                                                                                                                                                                            | trade-off                                                                          |
| ---- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `v0` | **Shipped**    | Production, mounted, byte-identical. The control.                                                                                                                                                                       | Paints **8 gold structure lines**; the number is in the capture's table            |
| `v1` | **Tuned**      | The null hypothesis: it is a LINE problem. Structure goes to dawn at the frame's own two weights, the column seam becomes solid, the reticle pair is completed, the era mast becomes a header row. Nothing moves house. | May prove insufficient — which is a real answer                                    |
| `v2` | **Housing**    | One chamfered slab (TR+BL) across the band, header bar fused to its top edge, seams inside, foot bar. The console drops its own chamfer and becomes a cell.                                                             | Heaviest; retires ADR-065 U2; costs 92px of band width on proof                    |
| `v3` | **Grid**       | No box, no fill. A top rule on tick 1, a solid column seam, cell seams that stop at it, a head row on every cell.                                                                                                       | Risks reading as a spreadsheet if the heads are uniform                            |
| `v4` | **Instrument** | A 2px datum bar in the rail's own material, a header row under it, the field boxed and corner-labelled, the record as boxed readout cells.                                                                              | Introduces a horizontal 2px rung; a horizontal rail was rejected once (ADR-082 U9) |
| `v5` | **Tether**     | No enclosure. The rail's ticks continue as 21px datum stubs, each head rule runs out to the band edge and terminates on one, the centrepiece sits in a bracket-cornered bay carrying its own identity in its corners.   | Stubs occupy 21px of the gutter ADR-082 U9 left empty                              |

**Knobs** (orthogonal to the direction):

| param    | values           | asks                                                                                                                                   |
| -------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `?mat=`  | `line` · `glass` | Does an enclosure need the console's own ground, or is line work enough? Defaults to `glass` on `v2` only.                             |
| `?foot=` | `none` · `rule`  | Draws the band rule the owner deleted twice, **band-inset** rather than full-bleed, so the amendment can be looked at. Off by default. |

Other parameters: `?s=proof|eras`, `?v=v0…v5`, `?theme=dark|light`,
`?era=<id>`, `?row=<track id>`, `?in=0…1` (scrubs the casefile's arrival
ladder), `?console=0` (removes the lab console for a still).

---

## What the lab measured

Everything below was found by the capture's gates or by looking at a still,
not by reading the code.

- **The control paints 8 gold structure lines; every direction paints 0.**
  That is the defect stated as a number.
- **A band-width housing cannot clear the right rail's telemetry.** SECTOR
  reaches x 1129 at 1280×720 against a band edge of 1150.9. On the proof
  surface the whole direction moves in by 28px a side to clear it, which is
  the housing's real cost. On the era stage the housing is **line-only
  instead**, because that station is transparent by law — a slab with a ground
  there is a black pane sliding over `#about`.
- **The era stage's foot can never be a rule at the rail's last tick.** That
  tick lands 16px inside the chip frames at 1280×720, 6.5px inside at
  1440×900, and exactly on the band's twice-deleted `border-top` at the
  owner's 1920×1247. Era housings are open-bottomed; the chips are the
  terminus.
- **A header row buys ~20px and a foot row spends it.** The mast stacks an
  11px kicker over a 42px title; a row is the taller of the two. `v4`'s 2px
  datum then overspent it by 6px until its air came down to 4px and the foot
  band to 22px. Chrome first, rhythm second, never the type.
- **The era title cannot seat at the bay's width.** Its clamp is locked
  byte-for-byte to the About name's footprint, and "The campaign commander" at
  38.4px needs ~420px against a 230px figure column — so `v5` centres the
  title on the bay's axis at its own measure. Found on `expanse` alone, which
  is why the gate walk visits all five eras.
- **Two labels overlapping is the check containment never makes**, and it bit
  twice: the header's centre slot printed through the client's name, and the
  field's corner labels printed through `WORK / CONFIGURATION / SUBSTRATE`.
  Both were caught by LOOKING at the first still of a direction, with every
  geometry gate green.
- **The register and the directory have ~4px of slack**, so neither may grow a
  head row at the binding viewport; the brief's head sits in the air that
  already exists above `--fl-body-top`, and the register's appears only above
  1070h where `--fl-proof-top-gap` is 14–18px of nothing.

### And two traps in the lab's own machinery

- **`will-change: transform` on a ladder wrapper makes it a containing block.**
  Chrome wrapped in a `[data-fl-panel]` div resolved `bottom` against a
  zero-height box and landed 800px off screen. Every piece carries its own
  ladder seat now, exactly as `.fl-split` and `.fl-ret` do, and everything in
  the sheet is positioned from the TOP.
- **A guard that resolves a token on the wrong element measures nothing.**
  `--vwd-pad-x` is declared on `.vwd`, not `:root`, so the probe's throwaway
  element resolved it to 0, the era band came back as the whole viewport, and
  every wide-ink test passed because nothing can be wider than everything.

---

## Verifying

```bash
node scripts/capture-hud-panel-lab.mjs
```

Two surfaces × six directions × {1280×720, 1440×800, 1920×1080, 1920×1247} ×
{dark, light}, with the per-era and per-row gate walks at the binding
viewport. Needs the dev server; `--port`, `--s`, `--v`, `--vp`, `--theme` and
`--headed` narrow it. Stills and `report.json` land beside this file and are
gitignored — they regenerate.

Gates: no panel clips (measured from the INK, because `scrollHeight` reports
zero both when content fits and when a centred box spills equally both ways);
every seat and the figure inside the frame; nothing wider than the station's
own band paints; no painted line enters a rail box and no lab ground sits
under a telemetry readout; every datum stub on a real tick; structure in dawn;
production chrome ≥8.5px and lab chrome ≥10px; no ordinal; zero page errors;
the figure on its alpha branch.

⚠ **The subjects are read off the page, never hardcoded.** Three of four track
ids were guessed wrong on the first run, the parser fell back to row one, and
four "different" rows shot the same still with every gate green.

---

## Rulings the lab needs before anything is promoted

1. **ADR-065 U2** — may the casefile console lose its TL+BR chamfer inside a
   TR+BL housing (`v2`)? That exception is the owner's own mockup, and
   retiring it cascades to the rail's leading station notch, the capability
   plates' seat notch and the smoke's two-ended corner guard.
2. **The 2026-08-07 "one framed object" ruling** (`casefile.css`) — does a
   housing, a grid or boxed cells supersede it, or is the console still the
   only frame on that surface?
3. **The deleted chrome** — the top-right reticle went in commit `e3b33867`
   with the route diagram and the three dotted rules. `v1`–`v5` draw it again.
   May it come back?
4. **"These long horizontal lines … remove those" (ADR-082 U21)** — was that
   about full-plate lines through the tick ladder, or about any long line? The
   answer decides whether `v2`, `v3` and `v4` are possible on the era stage at
   all, and it is the wording the committed >700px test would need.
5. **The era stage's foot** — leave the reel band's top edge undrawn
   (default), or accept `?foot=rule`?
6. **The gutter** — is a 21px tick terminating a head rule "something else in
   the gutter" (ADR-082 U9), or is it the rule's own end?
7. **Structure in dawn, sitewide** — the register's and directory's gold
   hairlines are pre-existing and sit against `console.css`'s own ruling.
8. **`--fl-tabs-h` derived as `rail-h / 12`** so the tab strip's baseline IS
   tick 1. It is 44px today and lands 1.07px off the tick at 1280×720, 6.0px
   at 1440×800. `v5`'s stub sits on the TICK and shows the gap.
9. **The identity's seat on the era stage** — a header row or the bay's head.
   It moves where the About name lands in the handoff.

## Out of scope

Mobile (≤960px): both surfaces have their own IA under ADR-083 and the
viewport table starts at 1280. A phone pass follows the desktop pick.
