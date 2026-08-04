import { fireEvent, render, waitFor } from "@testing-library/react";
import { useLayoutEffect, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useServicesStageScroll } from "@/components/landing/home-v2/hooks/useServicesStageScroll";
import { ServicesCasefile } from "@/components/landing/home-v2/services/casefile/ServicesCasefile";

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

function runwayRect(): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    right: 1280,
    bottom: 7200,
    left: 0,
    width: 1280,
    height: 7200,
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
