import type { Metadata } from "next";

import { safeArcNext } from "@/lib/arcs/arcGate";

/**
 * /unlock — the arcs' password page (ADR-135). `proxy.ts` sends a reader here
 * with `?next=` when an arc page has a password and their browser holds no
 * pass for it; the form posts to `/api/arcs/unlock`, which sets the pass and
 * sends them back. Server-rendered and script-free, so it works as a plain
 * form. Outside `/arcs/` on purpose, so the gate can never gate its own door.
 */

export const metadata: Metadata = {
  title: "Password — Thoughtform",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface UnlockProps {
  /* Next 16: search params arrive as a Promise. */
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function UnlockPage({ searchParams }: UnlockProps) {
  const { next, error } = await searchParams;
  const target = safeArcNext(next) ?? "";
  return (
    <main className="tf-unlock">
      <style>{UNLOCK_CSS}</style>
      <form className="tf-unlock__form" method="post" action="/api/arcs/unlock">
        <span className="tf-unlock__eyebrow">Thoughtform</span>
        <h1 className="tf-unlock__title">This page needs a password.</h1>
        <label className="tf-unlock__label" htmlFor="tf-unlock-password">
          Password
        </label>
        <input
          id="tf-unlock-password"
          className="tf-unlock__input"
          type="password"
          name="password"
          autoComplete="current-password"
          autoFocus
          required
        />
        <input type="hidden" name="next" value={target} />
        {error ? <p className="tf-unlock__error">That password did not work.</p> : null}
        <button className="tf-unlock__button" type="submit">
          Open the page
        </button>
      </form>
    </main>
  );
}

const UNLOCK_CSS = `
.tf-unlock {
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--void, #0a0908);
  color: var(--dawn, #ebe3d6);
}
.tf-unlock__form {
  display: grid;
  gap: 12px;
  width: min(100%, 360px);
}
.tf-unlock__eyebrow,
.tf-unlock__label {
  font-family: var(--font-pt-mono, "PT Mono", ui-monospace, monospace);
  font-size: 11px;
  letter-spacing: var(--track-eyebrow, 0.15em);
  text-transform: uppercase;
}
.tf-unlock__eyebrow {
  color: var(--gold, #caa554);
}
.tf-unlock__label {
  margin-top: 12px;
  opacity: 0.7;
}
.tf-unlock__title {
  margin: 0;
  font-family: var(--font-pp-neue-montreal, system-ui, sans-serif);
  font-weight: var(--weight-lit, 500);
  font-size: 24px;
  line-height: 1.25;
}
.tf-unlock__input {
  padding: 12px 14px;
  border: 1px solid rgba(var(--dawn-rgb, 235, 227, 214), 0.3);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 16px;
}
.tf-unlock__input:focus {
  outline: 1px solid var(--gold, #caa554);
  outline-offset: 2px;
}
.tf-unlock__error {
  margin: 0;
  font-family: var(--font-pp-neue-montreal, system-ui, sans-serif);
  font-size: 14px;
  color: var(--gold, #caa554);
}
.tf-unlock__button {
  margin-top: 8px;
  padding: 12px 14px;
  border: 1px solid var(--gold, #caa554);
  background: var(--gold, #caa554);
  color: var(--gold-contrast, #0a0908);
  font-family: var(--font-pt-mono, "PT Mono", ui-monospace, monospace);
  font-size: 12px;
  letter-spacing: var(--track-label, 0.08em);
  text-transform: uppercase;
  cursor: pointer;
}
`;
