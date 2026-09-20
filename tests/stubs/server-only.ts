/**
 * The `server-only` marker, stubbed for vitest (ADR-114).
 *
 * The real package throws on import outside a React Server Component so a
 * module that reads the filesystem (lib/musings/registry) can never reach a
 * client bundle. Vitest is neither a client nor a server component, and the
 * registry test IS the reader the marker exists to stop, on purpose; the
 * alias in vitest.config.ts points the marker here so the test can import
 * the module while Next keeps the real guard.
 */
export {};
