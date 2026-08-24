import { render, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useHeroBoot } from "@/components/landing/v7/hooks/useHeroBoot";

/**
 * The hero's terminal boot, pinned in BOTH hero shapes (ADR-075).
 *
 * The boot was extracted out of `LandingPage` so `/arcs/[slug]` can boot
 * its hero identically, and the extraction carried one generalisation:
 * the line collector recurses into child elements, so a headline with the
 * arcs' upright-gold `<em>` decodes both halves. That is exactly the kind
 * of change that could silently alter the LANDING's own headline, so both
 * shapes are asserted here:
 *
 *   landing — plain text split by `<br>`  ⇒ two lines, `<br>` untouched
 *   arc     — text + `<em>`               ⇒ two lines, the `<em>` KEPT,
 *                                           its span nested inside it
 *
 * A blank `.hero__headline-line` at the first frame is the contract, not
 * an accident: the kernel reads `from` off the live element, so React (or
 * a pre-resolved span) rendering the text would make `queueScramble`
 * no-op and the boot would never play.
 */

const originalMatchMedia = window.matchMedia;

function installMatchMedia(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;
}

/** The landing's hero: plain headline text broken by `<br>`. */
function LandingHero() {
  const ref = useRef<HTMLDivElement>(null);
  useHeroBoot(ref);
  return (
    <div ref={ref}>
      <div className="hero__content">
        <h1
          className="hero__headline"
          dangerouslySetInnerHTML={{ __html: "AI capability<br/>your team owns" }}
        />
        <p className="hero__desc">We map your work to the right intelligence.</p>
        <div className="hero__cta">
          <a className="hero__cta__btn hero__cta__btn--primary">Begin navigation</a>
        </div>
      </div>
    </div>
  );
}

/** An arc's hero: the upright-gold `em` pivot inside the headline. */
function ArcHeroShape() {
  const ref = useRef<HTMLDivElement>(null);
  useHeroBoot(ref);
  return (
    <div ref={ref}>
      <div className="hero__content">
        <h1 className="hero__headline">
          {"AI capability, "}
          <em>built inside the work.</em>
        </h1>
        <p className="hero__desc">Eighteen months at Loop Earplugs.</p>
        <div className="hero__cta">
          <a className="hero__cta__btn hero__cta__btn--primary">See the tools</a>
        </div>
      </div>
    </div>
  );
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("hero boot (ADR-075)", () => {
  it("wraps the landing's two lines and leaves the <br> alone", () => {
    installMatchMedia(false);
    const { container } = render(<LandingHero />);
    const headline = container.querySelector(".hero__headline")!;
    const lines = headline.querySelectorAll(".hero__headline-line");
    expect(lines).toHaveLength(2);
    // The break is not a text node, so it stays outside every span.
    expect(headline.querySelector("br")).not.toBeNull();
    expect(headline.children[0].tagName).toBe("SPAN");
    // Blanked on arm — the kernel writes every character back.
    lines.forEach((line) => expect(line.textContent).toBe(""));
  });

  it("keeps the arc's <em> and decodes inside it", () => {
    installMatchMedia(false);
    const { container } = render(<ArcHeroShape />);
    const headline = container.querySelector(".hero__headline")!;
    const em = headline.querySelector("em");
    expect(em, "the gold pivot survived the boot").not.toBeNull();
    // One span for the leading text, one INSIDE the em.
    expect(headline.querySelectorAll(".hero__headline-line")).toHaveLength(2);
    expect(em!.querySelector(".hero__headline-line")).not.toBeNull();
  });

  it("types the paragraph behind a cursor and unfurls the buttons", async () => {
    installMatchMedia(false);
    const { container } = render(<LandingHero />);
    const desc = container.querySelector(".hero__desc")!;
    expect(desc.querySelector(".hero__type-cursor"), "the CRT cursor").not.toBeNull();
    expect(container.querySelector(".hero__cta")!.getAttribute("data-unfurl")).toBe("shut");
    // The boot resolves on its own clock: the copy comes back in full, the
    // buttons open, and the cursor is removed on the last frame.
    await waitFor(
      () => {
        expect(desc.textContent).toContain("We map your work");
        expect(container.querySelector(".hero__cta")!.getAttribute("data-unfurl")).toBe("open");
      },
      { timeout: 4000 }
    );
  });

  it("does nothing at all under reduced motion", () => {
    installMatchMedia(true);
    const { container } = render(<LandingHero />);
    expect(container.querySelectorAll(".hero__headline-line")).toHaveLength(0);
    expect(container.querySelector(".hero__type-cursor")).toBeNull();
    expect(container.querySelector(".hero__cta")!.hasAttribute("data-unfurl")).toBe(false);
    expect(container.querySelector(".hero__headline")!.textContent).toContain("AI capability");
  });
});
