import { fireEvent, render, waitFor } from "@testing-library/react";
import { useLayoutEffect, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useServicesStageScroll } from "@/components/landing/home-v2/hooks/useServicesStageScroll";
import { ServicesCasefile } from "@/components/landing/home-v2/services/casefile/ServicesCasefile";
import { SERVICES_PROOF_RUNWAY_VH } from "@/components/landing/home-v2/unifiedServicesInstrument";

interface MediaMode {
  mobile: boolean;
  reduced: boolean;
}

const originalMatchMedia = window.matchMedia;
const originalScrollTo = window.scrollTo;

function installMediaMode(mode: MediaMode): void {
  window.matchMedia = ((query: string) => {
    const matches = query.includes("max-width: 960px")
      ? mode.mobile
      : query === "(prefers-reduced-motion: reduce)"
        ? mode.reduced
        : query.includes("min-width: 961px") && query.includes("no-preference")
          ? !mode.mobile && !mode.reduced
          : false;

    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }) as typeof window.matchMedia;
}

/**
 * The runway's height, DERIVED (ADR-087 Phase B) — `services.css` is
 * `calc(var(--svc-proof-runway) + 500svh)`, so the harness has to be the
 * dwell plus the ring's five viewports at some nominal height. 900px is
 * that nominal; it was a 7200 literal, which said "eight viewports" and
 * meant nothing in particular once the dwell became a derivation.
 *
 * Nothing here depends on the exact number — the stage is read at `top: 0`,
 * where `splitServicesRunway` returns proofP 0 whatever the travel — but a
 * literal that no longer tracks the constant is a literal that will be wrong
 * on the day someone reads it as documentation.
 */
const HARNESS_VH = 900;
const RUNWAY_H = (5 + SERVICES_PROOF_RUNWAY_VH) * HARNESS_VH;

function runwayRect(): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    right: 1280,
    bottom: RUNWAY_H,
    left: 0,
    width: 1280,
    height: RUNWAY_H,
    toJSON: () => ({}),
  };
}

function StageHarness() {
  const runwayRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (runwayRef.current) runwayRef.current.getBoundingClientRect = runwayRect;
  }, []);
  useServicesStageScroll(stageRef);

  return (
    <div className="services-stage-root" ref={runwayRef}>
      <section className="services-stage" ref={stageRef}>
        <ServicesCasefile />
      </section>
    </div>
  );
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  window.scrollTo = originalScrollTo;
});

describe("static Proof browse ownership", () => {
  it("retunes one mobile seat and keeps the case rail in parity with the directory", async () => {
    installMediaMode({ mobile: true, reduced: false });
    window.scrollTo = vi.fn();

    const { container } = render(<StageHarness />);
    const casefile = container.querySelector<HTMLElement>(".fl-case")!;
    const artifact = container.querySelector<HTMLButtonElement>("#svc-casefile-view-artifact")!;
    const proof = container.querySelector<HTMLButtonElement>("#svc-casefile-view-proof")!;
    const stops = container.querySelectorAll<HTMLButtonElement>(".fl-mobile-rail__stop");

    await waitFor(() => expect(casefile.style.getPropertyValue("--svc-proof-in")).toBe("1.0000"));
    expect(casefile).toHaveAttribute("data-mobile-view", "artifact");
    expect(artifact).toHaveAttribute("aria-pressed", "true");
    expect(proof).toHaveAttribute("aria-pressed", "false");
    expect(stops).toHaveLength(4);
    expect(stops[0]).toHaveAttribute("aria-current", "step");

    fireEvent.click(proof);
    expect(casefile).toHaveAttribute("data-mobile-view", "proof");
    expect(proof).toHaveAttribute("aria-pressed", "true");
    expect(artifact).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(stops[2]);
    const studioRow = container.querySelector<HTMLElement>("[id$='-row-studio']")!;
    expect(studioRow).toHaveAttribute("aria-selected", "true");
    expect(stops[2]).toHaveAttribute("aria-current", "step");
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it.each([
    ["mobile", { mobile: true, reduced: false }],
    ["reduced motion", { mobile: false, reduced: true }],
  ] as const)(
    "omits the browse channel and keeps the default track in %s mode",
    async (_, mode) => {
      installMediaMode({ ...mode });
      const { container } = render(<StageHarness />);
      const casefile = container.querySelector<HTMLElement>(".fl-case")!;
      const firstRow = container.querySelector<HTMLElement>("[id$='-row-ai-transformation']")!;

      // Wait for the hook's initial rAF rather than passing on the server markup.
      await waitFor(() => expect(casefile.style.getPropertyValue("--svc-proof-in")).toBe("1.0000"));
      expect(casefile.style.getPropertyValue("--svc-proof-browse")).toBe("");
      expect(firstRow).toHaveAttribute("aria-selected", "true");
    }
  );

  it("preserves a clicked track when a desktop resize enters static mode", async () => {
    const mode: MediaMode = { mobile: false, reduced: false };
    installMediaMode(mode);
    window.scrollTo = vi.fn();

    const { container } = render(<StageHarness />);
    const casefile = container.querySelector<HTMLElement>(".fl-case")!;
    const studioRow = container.querySelector<HTMLButtonElement>("[id$='-row-studio']")!;

    await waitFor(() =>
      expect(casefile.style.getPropertyValue("--svc-proof-browse")).toBe("0.0000")
    );
    fireEvent.click(studioRow);
    expect(studioRow).toHaveAttribute("aria-selected", "true");

    mode.mobile = true;
    fireEvent(window, new Event("resize"));

    await waitFor(() => expect(casefile.style.getPropertyValue("--svc-proof-browse")).toBe(""));
    expect(studioRow).toHaveAttribute("aria-selected", "true");
  });
});
