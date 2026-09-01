import { describe, expect, it } from "vitest";

import {
  BROWSE_HYSTERESIS,
  SEAM_SWAP_HYSTERESIS,
  browseBandVh,
  browseClientCount,
  browseRowBand,
  browseSeamClocks,
  browseSegments,
  browseState,
  browseTargetFor,
  rowFromBrowse,
} from "@/components/landing/home-v2/services/casefile/browseMap";
import {
  SERVICES_PROOF_BROWSE_FRAC,
  SERVICES_PROOF_CLIENT_SEAM_VH,
  SERVICES_PROOF_RELEASE_VH,
  SERVICES_PROOF_ROW_VH,
  SERVICES_PROOF_RUNWAY_VH,
  SERVICES_PROOF_SEGMENTS,
} from "@/components/landing/home-v2/unifiedServicesInstrument";

/**
 * The browse map's arithmetic (ADR-087 Phase B).
 *
 * ⚠ **THE POINT OF THIS FILE IS THE N = 1 IDENTITY.** The mechanism is
 * client-aware now, and the only acceptance proof that means anything is
 * that today's single-client surface computes today's numbers — not
 * approximately, EXACTLY. So the identity assertions use `toBe` on raw
 * doubles rather than `toBeCloseTo`: `0.5 × 4 + 1.2` and `2 / 3.2` are both
 * dyadic-or-tie cases that land on the shipped literals bit for bit, and a
 * tolerance here would hide precisely the drift this is written to catch.
 *
 * The second half exercises the shape nothing on disk has yet — TWO clients
 * with UNEQUAL row counts — because a seam that is only ever tested at N = 1
 * is a seam that has never run.
 */

/** The live shape: one client, four directory rows. */
const N1 = browseSegments([4], SERVICES_PROOF_ROW_VH, SERVICES_PROOF_CLIENT_SEAM_VH);

/**
 * Two clients, DELIBERATELY UNEQUAL. Four rows then three: an equal fixture
 * cannot tell "sized by its own row count" from "half the band each", and
 * half-the-band-each is the bug a reader would ship by accident.
 */
const N2 = browseSegments([4, 3], SERVICES_PROOF_ROW_VH, SERVICES_PROOF_CLIENT_SEAM_VH);

describe("the dwell is derived, and at N = 1 it is exactly what shipped", () => {
  it("collapses to 2.0 + 1.2 = 3.2 and 0.625 with no float drift", () => {
    const browseVh = browseBandVh([4], SERVICES_PROOF_ROW_VH, SERVICES_PROOF_CLIENT_SEAM_VH);
    expect(browseVh).toBe(2);
    // ⚠ `2 + 1.2` is a rounding TIE between the two doubles bracketing 3.2,
    // and round-half-to-even picks the one that IS 3.2's representation.
    // That is luck the test is entitled to check, not to assume.
    expect(browseVh + SERVICES_PROOF_RELEASE_VH).toBe(3.2);
    expect(SERVICES_PROOF_RUNWAY_VH).toBe(3.2);
    expect(SERVICES_PROOF_BROWSE_FRAC).toBe(0.625);
    // …and the release's absolute budget is the pre-browse dwell, which is
    // the sentence the constant's comment makes.
    expect(SERVICES_PROOF_RUNWAY_VH * (1 - SERVICES_PROOF_BROWSE_FRAC)).toBeCloseTo(1.2, 12);
  });

  it("publishes one client band spanning the whole domain", () => {
    expect(SERVICES_PROOF_SEGMENTS).toEqual(N1);
    expect(browseClientCount(N1)).toBe(1);
    expect(N1).toHaveLength(1);
    expect(N1[0]).toEqual({ kind: "client", clientIdx: 0, start: 0, end: 1, rows: 4 });
  });

  it("keeps the U13 click-pins-scroll formula bit-for-bit", () => {
    for (let i = 0; i < 4; i++) {
      // The expression `selectTrack` carried inline until this pass.
      expect(browseTargetFor(N1, 0, i)).toBe((i + 0.5) / 4);
    }
  });

  it("keeps the U13 row bands bit-for-bit", () => {
    for (let i = 0; i < 4; i++) {
      expect(browseRowBand(N1, 0, i)).toEqual({ start: i / 4, end: (i + 1) / 4 });
    }
  });

  it("reads the same row the U13 spy read, at the smoke's own dwell samples", () => {
    // The smoke drives DWELL fractions; the channel carries BROWSE. 0.1 of
    // the dwell is row one's band and 0.42 is row three's — the two readings
    // `services-ring-smoke` asserts by name.
    const cursor = { clientIdx: 0, rowIdx: 0 };
    const at = (dwell: number) => browseState(dwell / SERVICES_PROOF_BROWSE_FRAC, N1, cursor);
    expect(at(0.1).rowIdx).toBe(0);
    expect(at(0.42).rowIdx).toBe(2);
    // The band table agrees with the spy about which rows those are.
    expect(0.1 / SERVICES_PROOF_BROWSE_FRAC).toBeGreaterThanOrEqual(browseRowBand(N1, 0, 0).start);
    expect(0.1 / SERVICES_PROOF_BROWSE_FRAC).toBeLessThan(browseRowBand(N1, 0, 0).end);
    expect(0.42 / SERVICES_PROOF_BROWSE_FRAC).toBeGreaterThanOrEqual(browseRowBand(N1, 0, 2).start);
    expect(0.42 / SERVICES_PROOF_BROWSE_FRAC).toBeLessThan(browseRowBand(N1, 0, 2).end);
  });

  it("runs rowFromBrowse itself, unchanged, over the whole band", () => {
    // Parity against the pre-move implementation, re-typed here so a silent
    // edit to the moved function fails rather than agreeing with itself.
    const legacy = (browse: number, current: number, rowCount: number) => {
      const raw = Math.min(rowCount - 1, Math.max(0, Math.floor(browse * rowCount)));
      if (raw === current) return current;
      if (raw > current) return browse >= raw / rowCount + 0.04 ? raw : current;
      return browse <= (raw + 1) / rowCount - 0.04 ? raw : current;
    };
    for (let i = 0; i <= 400; i++) {
      const b = i / 400;
      for (let cur = 0; cur < 4; cur++) {
        expect(rowFromBrowse(b, cur, 4)).toBe(legacy(b, cur, 4));
        expect(browseState(b, N1, { clientIdx: 0, rowIdx: cur }).rowIdx).toBe(legacy(b, cur, 4));
      }
    }
  });

  it("never writes a client clock inside a seamless band", () => {
    for (let i = 0; i <= 200; i++) {
      const { clientIn, clientOut } = browseSeamClocks(i / 200, N1);
      expect(clientIn).toBe(1);
      expect(clientOut).toBe(0);
    }
  });
});

describe("two clients with unequal row counts", () => {
  it("sizes each band by its OWN rows and charges one seam between", () => {
    // 4 × 0.5 + 0.5 + 3 × 0.5 = 4.0 viewports.
    expect(browseBandVh([4, 3], SERVICES_PROOF_ROW_VH, SERVICES_PROOF_CLIENT_SEAM_VH)).toBe(4);
    expect(browseClientCount(N2)).toBe(2);
    expect(N2).toEqual([
      { kind: "client", clientIdx: 0, start: 0, end: 0.5, rows: 4 },
      { kind: "seam", after: 0, start: 0.5, end: 0.625 },
      { kind: "client", clientIdx: 1, start: 0.625, end: 1, rows: 3 },
    ]);
    // ⚠ NOT half the band each — the second client is 0.375 wide because it
    // carries three rows, and an equal-count fixture could not see that.
    expect(N2[2].end - N2[2].start).toBeCloseTo(0.375, 12);
  });

  it("tiles: every band is contiguous and the table ends on 1", () => {
    let at = 0;
    for (const seg of N2) {
      expect(seg.start).toBeCloseTo(at, 12);
      expect(seg.end).toBeGreaterThan(seg.start);
      at = seg.end;
    }
    expect(at).toBe(1);
  });

  it("pins each row's click target to its own band's centre", () => {
    for (const [client, rows] of [
      [0, 4],
      [1, 3],
    ] as const) {
      for (let i = 0; i < rows; i++) {
        const band = browseRowBand(N2, client, i);
        const target = browseTargetFor(N2, client, i);
        expect(target).toBeCloseTo((band.start + band.end) / 2, 12);
        // ROUND TRIP: the pinned scroll must resolve back to the row that
        // was clicked — the click-pins-scroll contract's other half.
        const back = browseState(target, N2, { clientIdx: client, rowIdx: 0 });
        expect(back.clientIdx).toBe(client);
        expect(back.rowIdx).toBe(i);
      }
    }
  });

  it("walks every row of both clients in order as the band is scrolled", () => {
    const seen: string[] = [];
    const cursor = { clientIdx: 0, rowIdx: 0 };
    for (let i = 0; i <= 2000; i++) {
      const s = browseState(i / 2000, N2, cursor);
      cursor.clientIdx = s.clientIdx;
      cursor.rowIdx = s.rowIdx;
      const key = `${s.clientIdx}:${s.rowIdx}`;
      if (seen[seen.length - 1] !== key) seen.push(key);
    }
    expect(seen).toEqual(["0:0", "0:1", "0:2", "0:3", "1:0", "1:1", "1:2"]);
  });
});

describe("the seam", () => {
  const seam = N2[1] as Extract<(typeof N2)[number], { kind: "seam" }>;
  const atT = (t: number) => seam.start + t * (seam.end - seam.start);

  it("ends on identity at both edges and hits full-out at the midpoint", () => {
    // Entering the seam: the outgoing client is still fully painted.
    expect(browseSeamClocks(seam.start, N2)).toEqual({ clientIn: 1, clientOut: 0 });
    // Leaving it: the incoming client is fully painted.
    const end = browseSeamClocks(seam.end - 1e-9, N2);
    expect(end.clientOut).toBe(0);
    expect(end.clientIn).toBeGreaterThan(0.999);
    // …and both halves are fully faded out where they meet.
    expect(browseSeamClocks(atT(0.5 - 1e-9), N2).clientOut).toBeGreaterThan(0.999);
    expect(browseSeamClocks(atT(0.5), N2).clientIn).toBe(0);
  });

  it("is monotone in visibility on each half, and reversible", () => {
    const vis = (t: number) => {
      const c = browseSeamClocks(atT(t), N2);
      return c.clientIn * (1 - c.clientOut);
    };
    for (let i = 1; i <= 250; i++) {
      const a = vis((i - 1) / 500);
      const b = vis(i / 500);
      expect(b).toBeLessThanOrEqual(a + 1e-12); // first half: fading out
    }
    for (let i = 251; i <= 500; i++) {
      const a = vis((i - 1) / 500);
      const b = vis(i / 500);
      expect(b).toBeGreaterThanOrEqual(a - 1e-12); // second half: fading in
    }
    // REVERSIBLE — the clocks are a pure function of the reading, so
    // scrolling back up re-reads the same numbers. No hidden state.
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      expect(browseSeamClocks(atT(t), N2)).toEqual(browseSeamClocks(atT(t), N2));
    }
  });

  it("swaps the client only where the panel is already invisible", () => {
    // ⚠ THE CONTAINMENT IS THE CONTRACT, NOT THE CONSTANT. The swap window is
    // the hysteresis band around the midpoint; inside it EITHER identity may
    // be reported, so the panel must be painting nothing throughout —
    // otherwise a reader parked on the midpoint watches the record change
    // under a lit surface, which is the one thing the crossfade exists to
    // prevent.
    //
    // ⚠ The quantity is the COMPOSED one, `clientIn × (1 − clientOut)` —
    // exactly what casefile.css multiplies into the reveal and maxes into the
    // departure. Asserting the two clocks SEPARATELY is wrong and was the
    // first cut of this test: `clientIn` rests at 1 through the whole outgoing
    // half (the panel is hidden there by `clientOut`, not by `clientIn`), so a
    // per-clock bound fails on a seam that is behaving perfectly.
    const vis = (t: number) => {
      const c = browseSeamClocks(atT(t), N2);
      return c.clientIn * (1 - c.clientOut);
    };
    for (let i = 0; i <= 200; i++) {
      const t = 0.5 - SEAM_SWAP_HYSTERESIS + (i / 200) * (2 * SEAM_SWAP_HYSTERESIS);
      expect(vis(t), `the panel paints ${vis(t)} at seam t=${t}`).toBeLessThan(0.05);
    }
    // …and the window is a real window: outside it the panel is visible
    // again on BOTH sides, so this is not vacuously true.
    expect(vis(0.5 - 2 * SEAM_SWAP_HYSTERESIS)).toBeGreaterThan(0.05);
    expect(vis(0.5 + 2 * SEAM_SWAP_HYSTERESIS)).toBeGreaterThan(0.05);
  });

  it("freezes the outgoing client on its LAST row and lands the incoming on its first", () => {
    const down = browseState(atT(0.2), N2, { clientIdx: 0, rowIdx: 3 });
    expect(down).toMatchObject({ clientIdx: 0, rowIdx: 3 });
    const landed = browseState(atT(0.8), N2, { clientIdx: 0, rowIdx: 3 });
    expect(landed).toMatchObject({ clientIdx: 1, rowIdx: 0 });
    // Coming back UP the same seam, the incoming client is the FIRST one and
    // it is entered on its last row — one expression, both directions.
    const up = browseState(atT(0.2), N2, { clientIdx: 1, rowIdx: 0 });
    expect(up).toMatchObject({ clientIdx: 0, rowIdx: 3 });
  });

  it("does not flicker for a reader parked on the seam midpoint", () => {
    // Rest jitter around the swap point, from either side. The held
    // identity must survive every sample within the hysteresis band.
    for (const held of [0, 1]) {
      const cursor = { clientIdx: held, rowIdx: held === 0 ? 3 : 0 };
      for (let i = 0; i <= 100; i++) {
        const t = 0.5 - SEAM_SWAP_HYSTERESIS * 0.99 + (i / 100) * (2 * SEAM_SWAP_HYSTERESIS * 0.99);
        expect(browseState(atT(t), N2, cursor).clientIdx).toBe(held);
      }
    }
  });

  it("does not flicker for a reader parked on a ROW edge", () => {
    // The same question one level down, at every shared edge of both
    // clients — the U13 guarantee, now over a table.
    for (const [client, rows] of [
      [0, 4],
      [1, 3],
    ] as const) {
      const seg = N2.find((s) => s.kind === "client" && s.clientIdx === client)!;
      const span = seg.end - seg.start;
      for (let r = 1; r < rows; r++) {
        const edge = seg.start + (r / rows) * span;
        // Held BELOW the edge: jitter up to (but not past) the hysteresis.
        for (let i = 0; i <= 40; i++) {
          const b = edge + (i / 40) * BROWSE_HYSTERESIS * span * 0.99;
          expect(browseState(b, N2, { clientIdx: client, rowIdx: r - 1 }).rowIdx).toBe(r - 1);
        }
        // Held ABOVE it, jittering back down.
        for (let i = 0; i <= 40; i++) {
          const b = edge - (i / 40) * BROWSE_HYSTERESIS * span * 0.99;
          expect(browseState(b, N2, { clientIdx: client, rowIdx: r }).rowIdx).toBe(r);
        }
      }
    }
  });
});

describe("degenerate inputs", () => {
  it("returns an empty table for no cases and holds the cursor", () => {
    expect(browseSegments([], SERVICES_PROOF_ROW_VH, SERVICES_PROOF_CLIENT_SEAM_VH)).toEqual([]);
    expect(browseState(0.4, [], { clientIdx: 2, rowIdx: 1 })).toEqual({
      clientIdx: 2,
      rowIdx: 1,
      clientIn: 1,
      clientOut: 0,
    });
    expect(browseTargetFor([], 0, 0)).toBe(0);
  });

  it("clamps readings outside [0, 1] onto the end bands", () => {
    expect(browseState(-3, N2, { clientIdx: 0, rowIdx: 0 })).toMatchObject({
      clientIdx: 0,
      rowIdx: 0,
    });
    expect(browseState(9, N2, { clientIdx: 1, rowIdx: 2 })).toMatchObject({
      clientIdx: 1,
      rowIdx: 2,
    });
  });
});
