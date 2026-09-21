import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MediaLightbox } from "@/components/landing/home-v2/services/casefile/MediaLightbox";

/**
 * The lightbox's own markup, pinned (ADR-082 U31).
 *
 * `MediaLightbox` is rendered by five surfaces — the casefile's films, the
 * tools plate's walkthroughs, the portfolio arc's dossiers, the Trinny proof
 * card and the era stage's transmission — and until this file NOTHING pinned
 * what it renders: `tool-gallery-markup.test.tsx` mounts `ToolGallery` with the
 * dialog CLOSED, so its snapshot never contains one. The era stage's pile needs
 * a third branch (a still, beside `src` and `embed`), and "additive" is a claim
 * about the other two that only a pin taken BEFORE the change can prove.
 *
 * ⚠ THE DIALOG PORTALS TO `document.body`, so `renderToStaticMarkup` cannot see
 * it (a portal renders nothing on the server). It is mounted into jsdom and read
 * off the body.
 *
 * The snapshot is the blanket; the explicit pins name what each branch must
 * keep, so a snapshot update cannot silently re-bless a lost attribute.
 */
const noop = () => {};
const dialog = () => document.body.querySelector<HTMLElement>(".fl-lightbox");

describe("MediaLightbox markup (ADR-082 U31 pin)", () => {
  it("the `src` branch — a self-hosted film", () => {
    render(
      <MediaLightbox
        src="/videos/cases/smug-owl.mp4"
        label="Smug Owl · Loop ATL"
        meta="16:9 master · 30 sec"
        onClose={noop}
      />
    );
    const el = dialog();
    expect(el?.outerHTML).toMatchSnapshot();

    expect(el?.getAttribute("role")).toBe("dialog");
    expect(el?.getAttribute("aria-modal")).toBe("true");
    expect(el?.getAttribute("aria-label")).toBe("Smug Owl · Loop ATL");
    const video = el?.querySelector("video.fl-lightbox__video");
    expect(video?.getAttribute("src")).toBe("/videos/cases/smug-owl.mp4");
    // Poster-first law: the element exists only inside an opened dialog, and it
    // carries NO `poster` (measured: it re-fetches the raw JPEG).
    expect(video?.hasAttribute("poster")).toBe(false);
    expect(video?.hasAttribute("controls")).toBe(true);
    expect(el?.querySelector("iframe")).toBeNull();
    expect(el?.querySelector(".fl-lightbox__close")?.textContent).toBe("Close");
  });

  it("the `embed` branch — the one third-party frame", () => {
    render(
      <MediaLightbox
        embed={{
          src: "https://www.youtube-nocookie.com/embed/a5-DcdfxCvU?autoplay=1&rel=0",
          title: "How the power of fans saved The Expanse",
        }}
        label="How the power of fans saved The Expanse"
        meta="2018"
        onClose={noop}
      />
    );
    const el = dialog();
    expect(el?.outerHTML).toMatchSnapshot();

    const frame = el?.querySelector("iframe.fl-lightbox__video");
    expect(frame?.getAttribute("src")).toContain("youtube-nocookie.com/embed/");
    expect(frame?.getAttribute("referrerpolicy")).toBe("strict-origin-when-cross-origin");
    expect(el?.querySelector("video")).toBeNull();
  });

  it("omits the meta separator when there is no meta", () => {
    render(<MediaLightbox src="/videos/cases/smug-owl.mp4" label="Smug Owl" onClose={noop} />);
    expect(dialog()?.querySelector(".fl-lightbox__label")?.innerHTML).toBe("Smug Owl");
  });
});
