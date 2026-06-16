import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Shared API guards (`lib/api/guards.ts`).
 *
 * These tests run with mocked underpinnings so we can drive every
 * code path without hitting Supabase. The guards are critical for
 * the upcoming hardening sweep — every mutating admin route in
 * `app/api/**` will flow through them — so we pin their failure
 * modes and Cache-Control behavior here.
 */

const isAuthorizedMock = vi.fn();
const getServerUserMock = vi.fn();
const createServerClientMock = vi.fn();

vi.mock("@/lib/auth-server", () => ({
  isAuthorized: (...args: unknown[]) => isAuthorizedMock(...args),
  getServerUser: (...args: unknown[]) => getServerUserMock(...args),
}));

vi.mock("@/lib/supabase", () => ({
  createServerClient: (...args: unknown[]) => createServerClientMock(...args),
}));

beforeEach(() => {
  isAuthorizedMock.mockReset();
  getServerUserMock.mockReset();
  createServerClientMock.mockReset();
});

afterEach(() => {
  vi.resetModules();
});

describe("jsonError / jsonSuccess", () => {
  it("jsonError returns the canonical error body with no-store cache", async () => {
    const { jsonError } = await import("@/lib/api/guards");
    const res = jsonError("nope", 401, "unauthorized");
    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = await res.json();
    expect(body).toEqual({ error: "nope", code: "unauthorized" });
  });

  it("jsonError defaults to 500 when status is omitted", async () => {
    const { jsonError } = await import("@/lib/api/guards");
    const res = jsonError("boom");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "boom" });
  });

  it("jsonSuccess sets no-store cache and forwards the body", async () => {
    const { jsonSuccess } = await import("@/lib/api/guards");
    const res = jsonSuccess({ slot: "ok" }, { status: 201 });
    expect(res.status).toBe(201);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = await res.json();
    expect(body).toEqual({ slot: "ok" });
  });
});

describe("requireAdmin", () => {
  it("returns null when isAuthorized resolves true", async () => {
    isAuthorizedMock.mockResolvedValueOnce(true);
    const { requireAdmin } = await import("@/lib/api/guards");
    const result = await requireAdmin(new Request("http://t/"));
    expect(result).toBeNull();
  });

  it("returns a 401 NextResponse when isAuthorized resolves false", async () => {
    isAuthorizedMock.mockResolvedValueOnce(false);
    const { requireAdmin } = await import("@/lib/api/guards");
    const result = await requireAdmin(new Request("http://t/"));
    expect(result).not.toBeNull();
    expect(result?.status).toBe(401);
    const body = await result!.json();
    expect(body.error).toMatch(/admin/i);
  });
});

describe("requireUser", () => {
  it("returns ok:true with the authenticated user when a real id is present", async () => {
    getServerUserMock.mockResolvedValueOnce({ id: "u123", email: "vince@thoughtform.co" });
    const { requireUser } = await import("@/lib/api/guards");
    const result = await requireUser(new Request("http://t/"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.id).toBe("u123");
    }
  });

  it("returns ok:false with a 401 when no user is found", async () => {
    getServerUserMock.mockResolvedValueOnce(null);
    const { requireUser } = await import("@/lib/api/guards");
    const result = await requireUser(new Request("http://t/"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("rejects the dev shim that lacks a real user id", async () => {
    // `getServerUser` returns this shape in dev when no Bearer token is present.
    getServerUserMock.mockResolvedValueOnce({ email: "dev@example.com" });
    const { requireUser } = await import("@/lib/api/guards");
    const result = await requireUser(new Request("http://t/"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });
});

describe("requireServiceClient", () => {
  it("returns ok:true with the configured client", async () => {
    const fakeClient = { mock: true };
    createServerClientMock.mockReturnValueOnce(fakeClient);
    const { requireServiceClient } = await import("@/lib/api/guards");
    const result = requireServiceClient();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.supabase).toBe(fakeClient);
    }
  });

  it("returns a 503 NextResponse when Supabase isn't configured", async () => {
    createServerClientMock.mockReturnValueOnce(null);
    const { requireServiceClient } = await import("@/lib/api/guards");
    const result = requireServiceClient();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(503);
      const body = await result.response.json();
      expect(body.code).toBe("service_unavailable");
    }
  });
});

describe("requireAdminAndServiceClient", () => {
  it("short-circuits with the admin denial when the caller is not authorized", async () => {
    isAuthorizedMock.mockResolvedValueOnce(false);
    createServerClientMock.mockReturnValueOnce({ mock: true });
    const { requireAdminAndServiceClient } = await import("@/lib/api/guards");
    const result = await requireAdminAndServiceClient(new Request("http://t/"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("short-circuits with 503 when the admin passes but the client is unavailable", async () => {
    isAuthorizedMock.mockResolvedValueOnce(true);
    createServerClientMock.mockReturnValueOnce(null);
    const { requireAdminAndServiceClient } = await import("@/lib/api/guards");
    const result = await requireAdminAndServiceClient(new Request("http://t/"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(503);
    }
  });

  it("returns the supabase client when the admin passes and the client is configured", async () => {
    const fakeClient = { mock: true };
    isAuthorizedMock.mockResolvedValueOnce(true);
    createServerClientMock.mockReturnValueOnce(fakeClient);
    const { requireAdminAndServiceClient } = await import("@/lib/api/guards");
    const result = await requireAdminAndServiceClient(new Request("http://t/"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.supabase).toBe(fakeClient);
    }
  });
});
