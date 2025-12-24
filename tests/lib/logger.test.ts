import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to mock process.env before importing logger
describe("logger", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe("in development", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("logger.log should call console.log in development", async () => {
      vi.resetModules();
      const { logger } = await import("@/lib/logger");
      logger.log("test message");
      expect(console.log).toHaveBeenCalledWith("test message");
    });

    it("logger.warn should call console.warn in development", async () => {
      vi.resetModules();
      const { logger } = await import("@/lib/logger");
      logger.warn("warning message");
      expect(console.warn).toHaveBeenCalledWith("warning message");
    });

    it("logger.error should always call console.error", async () => {
      vi.resetModules();
      const { logger } = await import("@/lib/logger");
      logger.error("error message");
      expect(console.error).toHaveBeenCalledWith("error message");
    });

    it("logger.debug should call console.log with [DEBUG] prefix", async () => {
      vi.resetModules();
      const { logger } = await import("@/lib/logger");
      logger.debug("debug message");
      expect(console.log).toHaveBeenCalledWith("[DEBUG]", "debug message");
    });

    it("logger.success should call console.log with ✓ prefix", async () => {
      vi.resetModules();
      const { logger } = await import("@/lib/logger");
      logger.success("success message");
      expect(console.log).toHaveBeenCalledWith("✓", "success message");
    });
  });

  describe("in production", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("logger.error should still log in production", async () => {
      vi.resetModules();
      const { logger } = await import("@/lib/logger");
      logger.error("error message");
      expect(console.error).toHaveBeenCalledWith("error message");
    });
  });
});
