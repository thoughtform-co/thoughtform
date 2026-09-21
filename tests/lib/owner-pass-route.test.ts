import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The mint route and the strict verifier behind it (ADR-117).
 *
 * ⚠ THE ONE ASSERTION THAT MATTERS MOST IS THE DEVELOPMENT ONE: the rest of
 * the admin API trusts everybody under `next dev` (`isAuthorized`'s DX
 * bypass), and a pass minted that way would be valid in production whenever
 * the dev server shares the key. The mint route must refuse a missing token
 * in development exactly as it does in production.
 */

const getUserMock = vi.fn();
const createServerClientMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createServerClient: (...args: unknown[]) => createServerClientMock(...args),
}));

const ALLOWED = "owner@example.com";
const ROOT = "a-root-secret-long-enough-to-be-a-real-one-0123456789";

function withBearer(token?: string): Request {
  return new Request("http://localhost/api/owner-pass", {
    method: "POST",
    headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
  });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_ALLOWED_EMAIL", ALLOWED);
  vi.stubEnv("OWNER_PASS_SECRET", ROOT);
  getUserMock.mockReset();
  createServerClientMock.mockReset();
  createServerClientMock.mockReturnValue({ auth: { getUser: getUserMock } });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("verifyAllowlistedBearer — no development bypass", () => {
  it("refuses a missing or empty token even under NODE_ENV=development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { verifyAllowlistedBearer, isAuthorized } = await import("@/lib/auth-server");
    expect(await verifyAllowlistedBearer(withBearer())).toBe(false);
    expect(await verifyAllowlistedBearer(withBearer(""))).toBe(false);
    expect(getUserMock).not.toHaveBeenCalled();
    // …while the admin API's own check keeps its DX shortcut, unchanged.
    expect(await isAuthorized(withBearer())).toBe(true);
  });

  it("accepts only a real user with the allowlisted email", async () => {
    const { verifyAllowlistedBearer } = await import("@/lib/auth-server");
    getUserMock.mockResolvedValueOnce({ data: { user: { email: ALLOWED } }, error: null });
    expect(await verifyAllowlistedBearer(withBearer("t"))).toBe(true);
    getUserMock.mockResolvedValueOnce({
      data: { user: { email: "else@example.com" } },
      error: null,
    });
    expect(await verifyAllowlistedBearer(withBearer("t"))).toBe(false);
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: new Error("bad jwt") });
    expect(await verifyAllowlistedBearer(withBearer("t"))).toBe(false);
    createServerClientMock.mockReturnValueOnce(null);
    expect(await verifyAllowlistedBearer(withBearer("t"))).toBe(false);
  });
});

describe("POST /api/owner-pass", () => {
  it("401s without a verified owner, and sets no cookie", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { POST } = await import("@/app/api/owner-pass/route");
    const res = await POST(withBearer());
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("mints a pass the server's own verifier accepts, on the right cookie", async () => {
    vi.stubEnv("NODE_ENV", "production");
    getUserMock.mockResolvedValueOnce({ data: { user: { email: ALLOWED } }, error: null });
    const { POST } = await import("@/app/api/owner-pass/route");
    const { verifyOwnerPass, ownerPassKey } = await import("@/lib/auth/ownerPass");
    const res = await POST(withBearer("t"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = (await res.json()) as { exp: number };
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^tf_owner=v1\.\d+\.[A-Za-z0-9_-]{43};/);
    expect(cookie).toMatch(/Path=\/arcs/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Secure/i);
    const token = cookie.split(";")[0].slice("tf_owner=".length);
    expect(token.split(".")[1]).toBe(String(body.exp));
    expect(verifyOwnerPass(ownerPassKey(), token, Math.floor(Date.now() / 1000))).toBe(true);
  });

  it("503s rather than minting when no key can be derived", async () => {
    vi.stubEnv("OWNER_PASS_SECRET", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    getUserMock.mockResolvedValueOnce({ data: { user: { email: ALLOWED } }, error: null });
    const { POST } = await import("@/app/api/owner-pass/route");
    const res = await POST(withBearer("t"));
    expect(res.status).toBe(503);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("DELETE clears the pass on its own path", async () => {
    const { DELETE } = await import("@/app/api/owner-pass/route");
    const res = await DELETE();
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^tf_owner=;/);
    expect(cookie).toMatch(/Path=\/arcs/);
    expect(cookie).toMatch(/Max-Age=0/i);
  });
});
