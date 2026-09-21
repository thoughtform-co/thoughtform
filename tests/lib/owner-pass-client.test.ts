import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The browser's half of the owner's pass (ADR-117): when it mints, when it
 * stays quiet, and the one reload that heals an expired pass.
 *
 * ⚠ THE RELOAD IS THE DANGEROUS PART — a reload that can repeat is a loop on
 * the owner's own 404. It fires once per tab, only on the overview's 404,
 * only after a mint succeeded.
 */

const ALLOWED = "owner@example.com";
const session = (email = ALLOWED) => ({ access_token: "tok", user: { email } });

let fetchMock: ReturnType<typeof vi.fn>;

function okMint(exp = Math.floor(Date.now() / 1000) + 7 * 86400) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ exp }), { status: 200 }));
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_ALLOWED_EMAIL", ALLOWED);
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("syncOwnerPass (ADR-117)", () => {
  it("does nothing without a session or for anyone but the owner", async () => {
    const { syncOwnerPass } = await import("@/lib/auth/ownerPassClient");
    await syncOwnerPass(null);
    await syncOwnerPass(session("someone@example.com"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mints with the session's bearer token and mirrors the expiry", async () => {
    const { syncOwnerPass } = await import("@/lib/auth/ownerPassClient");
    const exp = Math.floor(Date.now() / 1000) + 7 * 86400;
    okMint(exp);
    await syncOwnerPass(session());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/owner-pass");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(localStorage.getItem("tf-owner-pass-exp")).toBe(String(exp));
  });

  it("stays quiet while the pass has more than half its life", async () => {
    const { syncOwnerPass } = await import("@/lib/auth/ownerPassClient");
    localStorage.setItem("tf-owner-pass-exp", String(Math.floor(Date.now() / 1000) + 6 * 86400));
    await syncOwnerPass(session());
    expect(fetchMock).not.toHaveBeenCalled();
    localStorage.setItem("tf-owner-pass-exp", String(Math.floor(Date.now() / 1000) + 3 * 86400));
    okMint();
    await syncOwnerPass(session());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("on the overview's 404 it mints whatever the mirror says, and reloads ONCE", async () => {
    const { syncOwnerPass } = await import("@/lib/auth/ownerPassClient");
    window.history.replaceState({}, "", "/arcs");
    document.body.innerHTML = '<div data-tf-404=""></div>';
    localStorage.setItem("tf-owner-pass-exp", String(Math.floor(Date.now() / 1000) + 6 * 86400));
    const reload = vi.fn();
    okMint();
    await syncOwnerPass(session(), { reload });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    // The reload landed on the 404 again (a misconfigured key): no loop.
    okMint();
    await syncOwnerPass(session(), { reload });
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("never reloads after a failed mint, nor on a 404 that is not the overview", async () => {
    const { syncOwnerPass } = await import("@/lib/auth/ownerPassClient");
    const reload = vi.fn();
    window.history.replaceState({}, "", "/arcs");
    document.body.innerHTML = '<div data-tf-404=""></div>';
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 401 }));
    await syncOwnerPass(session(), { reload });
    expect(reload).not.toHaveBeenCalled();
    window.history.replaceState({}, "", "/somewhere-else");
    okMint();
    await syncOwnerPass(session(), { reload });
    expect(reload).not.toHaveBeenCalled();
  });

  it("the overview rendering re-arms the reload for the next expiry", async () => {
    const { syncOwnerPass } = await import("@/lib/auth/ownerPassClient");
    sessionStorage.setItem("tf-owner-pass-reloaded", "1");
    window.history.replaceState({}, "", "/arcs");
    localStorage.setItem("tf-owner-pass-exp", String(Math.floor(Date.now() / 1000) + 6 * 86400));
    await syncOwnerPass(session());
    expect(sessionStorage.getItem("tf-owner-pass-reloaded")).toBeNull();
  });

  it("clearOwnerPass drops the mirror and asks the server to clear the cookie", async () => {
    const { clearOwnerPass } = await import("@/lib/auth/ownerPassClient");
    localStorage.setItem("tf-owner-pass-exp", "1");
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    await clearOwnerPass();
    expect(localStorage.getItem("tf-owner-pass-exp")).toBeNull();
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });
});
