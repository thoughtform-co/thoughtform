# Proposal kit lab, round 01 (2026-10-12)

The X-Bionic proposal is the template for the next ones. This round draws its shape system and iterates three of its sections against production, on one lab page:

```
http://localhost:3019/test/proposal-kit
```

(`?b=system|flow|job|close` for one board, `?d=<id>` for one section, `?job=1..4` on the job board, `?still=1` without lab chrome. The port is the lab worktree's; read it off the running server.)

Branch `lab/proposal-kit`, cut from `main`. Nothing on the proposal changed: the only edit to a shipped file is eleven `export` keywords in `PlugFlow.tsx`.

## The ruling this round draws on

Owner, 2026-10-12: **rings are instruments, connectors are straight.** A precise circle stays where it is an instrument (the mark, a graduated ring, an orbit, as behind the portrait). Everything that joins or holds is a level run, a plumb run, a 45-degree cut or a square corner. No soft curve, no rounded corner, no pill.

## The system (board S)

`components/xb-proposal/kit/`:

| file        | what it holds                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| `trace.ts`  | connectors as pure geometry: run, elbow, cut turn, jog, bundle, ribbon, bearing, chevron, rail ticks            |
| `dial.ts`   | the About drawing's ring register as data: six rings, a rim graduated every 15 degrees, stubs, spokes, brackets |
| `marks.tsx` | tap, diamond, junction, cross, bracket                                                                          |
| `kit.css`   | two line weights, the dash ladder, the tag, the key label, the frame                                            |

`tests/lib/proposal-kit.test.ts` holds the law: no connector is a curve, every wire ends on the thing it joins, a bearing passes through its dial's centre.

Found in the kit as it ships: five mono trackings (0.12 to 0.18em), two chamfer recipes with different inner legs, a hard-coded green in four sheets, three section heads. Consolidating them is the pass after the picks.

## Recommendations

Stills are under `round-01/<board>/`, a contact sheet per board, viewport and theme at `round-01/contact-*.png`.

### Flow · "AI capability your teams own."

|                  | what it argues                                                                                                | read                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| F0               | production                                                                                                    |                                                                                                           |
| F1 · Trace       | the same flow, every line straight: a tick rail, cut corners, one collector, a graduated hub in brackets      | the smallest change; the collector reads a little like one large bracket                                  |
| **F2 · Bearing** | the hub is the About dial; the team arrives on straight dotted bearings; the interfaces are one ruled readout | **recommended**: the most the site's own, and the furthest from Cluster while keeping left, centre, right |
| F3 · Axis        | the mark's own bar is the datum; workstreams and interfaces hang off it, two above and two below              | the boldest; the mark at this size is a statement, so it needs his eye                                    |

In F2 the readout is shorter than the column of chips beside it (four one-line rows against four chips on production's rows). That is the one balance question left on it.

### Job card

|                               | what it argues                                                              | read                                                                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J0                            | production: 44px past the fold at 1470×830, 121px at 1280×720               |                                                                                                                                                                                 |
| J1 · One ladder               | the tools are a fourth box in the steps' own frame; connectors meet exactly | combines with either of the others                                                                                                                                              |
| J2 · Split follows the figure | the frame hugs the evidence; the result cards meet on the rule above        | strongest on the film and the map                                                                                                                                               |
| **J3 · Result strip**         | the result as one ruled strip across the foot                               | **recommended**: the only one that changes the fold (the card ends at 786 to 796 of 830 at 1470×830; at 1280×720 it is still 40 to 50px over), and it replaces two unlike cards |

### Closing run · the four weeks, who takes part, the fee

|                     | what it argues                                                                            | read                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| C0a to C0c          | production: two frames, then the console                                                  |                                                                               |
| **C1 · One frame**  | the fee in the weeks' grammar: one frame, cells on shared edges, the rate at reading size | **recommended**: the smallest change that makes the three one grammar         |
| C2 · One sheet      | the weeks and the fee as one ledger, the frame closing on the days and the rate           | the stronger idea, but two screens tall, and the fee loses its own head       |
| C3 · A matched pair | who takes part and the fee as two frames of one shape                                     | clean; the fee's wide cell has no lead sentence because the record holds none |

## Found in production, not changed

- Flow: the card stamps ("Now", "2 min") render 10.8px at 1280×720 and 11.3px at 1470×830.
- Job card: tabs, tool chips and result keys are 11px; the centre lines start 1px under one box and run 1px into the next; in light, gold used as text is faint on parchment.
- Fee console: 8px coordinates, a 9.5px eyebrow, and it runs 13 to 18px past the fold at both laptop sizes.
- "How we suggest what to measure" is in the first person, as filed.

## Not done

- Nothing below 961px was looked at.
- "THE / FEE." sets one word a line under the masthead; a title for him to word.
- No direction is ported. On a pick: port it as-is, delete the others with their lab entries, then the token consolidation above.

## Re-shooting

```bash
node scripts/capture-proposal-kit.mjs --port 3019            # everything
node scripts/capture-proposal-kit.mjs --port 3019 --board flow --sizes 1470x830 --themes dark
```

The gate fails a still for text under 12px, a rail crossing or two labels printing through each other, and reports whether a section fits one screen. In this round 34 of 90 stills fail it, every one on text under 12px and none on a crossing or an overlap: the three controls with the findings above, and the three job directions, which keep production's 11px labels because type size was not their argument.

The repo keeps the contact sheets and the 1470×830 stills; the other sizes are one command away.
