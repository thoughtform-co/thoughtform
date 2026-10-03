import { describe, expect, it } from "vitest";

import {
  arcGateKey,
  arcPassCookieName,
  arcPassToken,
  arcPasswordFor,
  safeArcNext,
} from "@/lib/arcs/arcGate";

/**
 * The arcs' password (ADR-135). The gate is only as good as its idea of what
 * is an arc PAGE: a miss on an asset breaks the homepage's own pictures (they
 * live in `public/arcs/`), and a miss on a page leaves it open.
 */

describe("the arcs' password (ADR-135)", () => {
  it("covers every page under /arcs/, keyed in the environment's own shape", () => {
    expect(arcGateKey("/arcs/pandora/proposal")).toBe("PANDORA_PROPOSAL");
    expect(arcGateKey("/arcs/pandora-proposal/")).toBe("PANDORA_PROPOSAL");
    expect(arcGateKey("/arcs/pandora")).toBe("PANDORA");
    expect(arcGateKey("/arcs/trinny-london/proposal")).toBe("TRINNY_LONDON_PROPOSAL");
  });

  it("keys the page's payloads and its escaped spellings as the page (ADR-117's two leaks)", () => {
    expect(arcGateKey("/arcs/pandora-proposal.rsc")).toBe("PANDORA_PROPOSAL");
    expect(arcGateKey("/arcs/pandora-proposal.segments/_tree.segment.rsc")).toBe(
      "PANDORA_PROPOSAL"
    );
    expect(arcGateKey("/arcs/pandora-proposal.segments/arcs/$d$slug/__PAGE__.segment.rsc")).toBe(
      "PANDORA_PROPOSAL"
    );
    expect(arcGateKey("/%61rcs/pandora-proposal")).toBe("PANDORA_PROPOSAL");
    expect(arcGateKey("/arcs/%70andora-proposal")).toBe("PANDORA_PROPOSAL");
    expect(arcGateKey("/arcs//pandora-proposal")).toBe("PANDORA_PROPOSAL");
    expect(arcGateKey("//arcs/pandora/proposal")).toBe("PANDORA_PROPOSAL");
  });

  it("leaves the owner's overview, the assets and everything else alone", () => {
    expect(arcGateKey("/arcs")).toBeNull();
    expect(arcGateKey("/arcs/")).toBeNull();
    expect(arcGateKey("/arcs/vince-portrait.png")).toBeNull();
    expect(arcGateKey("/arcs/studio-line/ai.webp")).toBeNull();
    expect(arcGateKey("/arcs/pandora-proposal/ring-retouch-a.webp")).toBeNull();
    expect(arcGateKey("/")).toBeNull();
    expect(arcGateKey("/musings/a-note")).toBeNull();
    expect(arcGateKey("/unlock")).toBeNull();
  });

  it("reads the page's own password first, then the arcs' shared one, and fails open", () => {
    const env = { ARC_PASSWORD_PANDORA_PROPOSAL: "Copenhagen", ARCS_PASSWORD: "shared" };
    expect(arcPasswordFor("PANDORA_PROPOSAL", env)).toBe("Copenhagen");
    expect(arcPasswordFor("SURI_PROPOSAL", env)).toBe("shared");
    expect(arcPasswordFor("SURI_PROPOSAL", {})).toBeNull();
    expect(arcPasswordFor("PANDORA_PROPOSAL", { ARCS_PASSWORD: "" })).toBeNull();
  });

  it("keeps the pass to a hash, per page", async () => {
    const a = await arcPassToken("PANDORA_PROPOSAL", "Copenhagen");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("Copenhagen");
    expect(await arcPassToken("PANDORA_PROPOSAL", "Copenhagen")).toBe(a);
    expect(await arcPassToken("SURI_PROPOSAL", "Copenhagen")).not.toBe(a);
    expect(arcPassCookieName("PANDORA_PROPOSAL")).toBe("tf_arc_pandora_proposal");
  });

  it("sends a reader back only to an arc page on this site", () => {
    expect(safeArcNext("/arcs/pandora/proposal")).toBe("/arcs/pandora/proposal");
    expect(safeArcNext("/arcs/pandora/proposal#phases")).toBe("/arcs/pandora/proposal#phases");
    expect(safeArcNext("//evil.example/arcs/x")).toBeNull();
    expect(safeArcNext("https://evil.example/arcs/x")).toBeNull();
    expect(safeArcNext("/admin")).toBeNull();
    expect(safeArcNext("/arcs")).toBeNull();
    expect(safeArcNext(null)).toBeNull();
  });
});

describe("the gate, end to end (ADR-135)", () => {
  const withEnv = async (env: Record<string, string>, fn: () => Promise<void>) => {
    const saved = { ...process.env };
    Object.assign(process.env, env);
    try {
      await fn();
    } finally {
      for (const k of Object.keys(env)) delete process.env[k];
      Object.assign(process.env, saved);
    }
  };

  it("sends a reader without a pass to the password page, and lets one with it through", async () => {
    const { NextRequest } = await import("next/server");
    const { proxy } = await import("@/proxy");
    await withEnv({ ARC_PASSWORD_PANDORA_PROPOSAL: "Copenhagen" }, async () => {
      const blocked = await proxy(new NextRequest("http://localhost/arcs/pandora/proposal"));
      expect(blocked.status).toBe(307);
      const to = new URL(blocked.headers.get("location") ?? "");
      expect(to.pathname).toBe("/unlock");
      expect(to.searchParams.get("next")).toBe("/arcs/pandora/proposal");

      const token = await arcPassToken("PANDORA_PROPOSAL", "Copenhagen");
      const open = await proxy(
        new NextRequest("http://localhost/arcs/pandora/proposal", {
          headers: { cookie: `tf_arc_pandora_proposal=${token}` },
        })
      );
      expect(open.status).toBe(200);
      expect(open.headers.get("location")).toBeNull();

      // The payload is gated with the page, and the reader is sent back to
      // the PAGE, never to the payload.
      const payload = await proxy(
        new NextRequest("http://localhost/arcs/pandora/proposal.rsc?_rsc=abc")
      );
      expect(payload.status).toBe(307);
      expect(new URL(payload.headers.get("location") ?? "").searchParams.get("next")).toBe(
        "/arcs/pandora/proposal"
      );
      const escaped = await proxy(new NextRequest("http://localhost/%61rcs/pandora-proposal"));
      expect(escaped.status).toBe(307);

      // Another arc has no password of its own and no shared one: open.
      const other = await proxy(new NextRequest("http://localhost/arcs/suri-proposal"));
      expect(other.headers.get("location")).toBeNull();
    });
  });

  it("sets the pass on the right password, and returns to the form on a wrong one", async () => {
    const { POST } = await import("@/app/api/arcs/unlock/route");
    await withEnv({ ARC_PASSWORD_PANDORA_PROPOSAL: "Copenhagen" }, async () => {
      const post = (password: string) => {
        const body = new FormData();
        body.set("password", password);
        body.set("next", "/arcs/pandora/proposal");
        return POST(new Request("http://localhost/api/arcs/unlock", { method: "POST", body }));
      };
      const ok = await post("Copenhagen");
      expect(ok.status).toBe(303);
      expect(new URL(ok.headers.get("location") ?? "").pathname).toBe("/arcs/pandora/proposal");
      const cookie = ok.headers.get("set-cookie") ?? "";
      expect(cookie).toContain("tf_arc_pandora_proposal=");
      expect(cookie).not.toContain("Copenhagen");
      expect(cookie.toLowerCase()).toContain("httponly");

      const bad = await post("copenhagen!");
      expect(bad.status).toBe(303);
      const back = new URL(bad.headers.get("location") ?? "");
      expect(back.pathname).toBe("/unlock");
      expect(back.searchParams.get("error")).toBe("1");
      expect(bad.headers.get("set-cookie")).toBeNull();
    });
  });
});
