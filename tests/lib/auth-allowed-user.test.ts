import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `lib/auth/allowed-user.ts` is the centralized allowlist check used
 * by both client gates (`AdminGate`, `AdminGroupLayout`) and server
 * routes (`isAuthorized` in `lib/auth-server.ts`). The behavior must
 * stay byte-identical across machines: case-insensitive equality
 * against the configured `NEXT_PUBLIC_ALLOWED_EMAIL`, with a strict
 * `false` for any falsy / missing input.
 */

describe("allowed-user — getAllowedEmail / isAllowedUserEmail", () => {
  const originalEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEmail === undefined) {
      delete process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
    } else {
      process.env.NEXT_PUBLIC_ALLOWED_EMAIL = originalEmail;
    }
  });

  it("getAllowedEmail returns the lowercased configured email", async () => {
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL = "Admin@Example.COM";
    const { getAllowedEmail } = await import("@/lib/auth/allowed-user");
    expect(getAllowedEmail()).toBe("admin@example.com");
  });

  it("getAllowedEmail returns null when the env var is missing", async () => {
    delete process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
    const { getAllowedEmail } = await import("@/lib/auth/allowed-user");
    expect(getAllowedEmail()).toBeNull();
  });

  it("isAllowedUserEmail compares case-insensitively against the configured email", async () => {
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL = "vince@thoughtform.co";
    const { isAllowedUserEmail } = await import("@/lib/auth/allowed-user");
    expect(isAllowedUserEmail("vince@thoughtform.co")).toBe(true);
    expect(isAllowedUserEmail("VINCE@thoughtform.co")).toBe(true);
    expect(isAllowedUserEmail("Vince@Thoughtform.CO")).toBe(true);
  });

  it("isAllowedUserEmail rejects missing / mismatched / falsy inputs", async () => {
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL = "vince@thoughtform.co";
    const { isAllowedUserEmail } = await import("@/lib/auth/allowed-user");
    expect(isAllowedUserEmail(null)).toBe(false);
    expect(isAllowedUserEmail(undefined)).toBe(false);
    expect(isAllowedUserEmail("")).toBe(false);
    expect(isAllowedUserEmail("attacker@evil.example")).toBe(false);
  });

  it("isAllowedUserEmail returns false when no allowlist is configured (fail closed)", async () => {
    delete process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
    const { isAllowedUserEmail } = await import("@/lib/auth/allowed-user");
    expect(isAllowedUserEmail("vince@thoughtform.co")).toBe(false);
  });
});
