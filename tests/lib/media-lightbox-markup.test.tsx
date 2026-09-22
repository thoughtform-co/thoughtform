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

  it("the `image` branch — a still, whole, in a frame that shrinks to it", () => {
    render(
      <MediaLightbox
        image={{
          src: "/images/voidwalker/media/film-latent-land.jpg",
          alt: "A frame from the film.",
          width: 960,
          height: 540,
        }}
        label="Welcome to Latent Land"
        meta="2023"
        onClose={noop}
      />
    );
    const el = dialog();
    const img = el?.querySelector<HTMLImageElement>("img.fl-lightbox__still");
    expect(img?.getAttribute("alt")).toBe("A frame from the film.");
    // The file's own pixels: the box is solved from these, never from 16:9.
    expect(img?.getAttribute("width")).toBe("960");
    expect(img?.getAttribute("height")).toBe("540");
    expect(el?.querySelector(".fl-lightbox__frame")?.className).toBe(
      "fl-lightbox__frame fl-lightbox__frame--still"
    );
    // One medium per dialog.
    expect(el?.querySelector("video, iframe")).toBeNull();
    expect(el?.querySelector(".fl-lightbox__close")?.textContent).toBe("Close");
  });

  it("an embed outranks a still, and the frame keeps the film's box", () => {
    render(
      <MediaLightbox
        embed={{ src: "https://www.youtube-nocookie.com/embed/a5-DcdfxCvU", title: "t" }}
        image={{
          src: "/images/voidwalker/media/film-latent-land.jpg",
          alt: "a",
          width: 1,
          height: 1,
        }}
        label="t"
        onClose={noop}
      />
    );
    const el = dialog();
    expect(el?.querySelector("iframe")).not.toBeNull();
    expect(el?.querySelector("img")).toBeNull();
    expect(el?.querySelector(".fl-lightbox__frame")?.className).toBe("fl-lightbox__frame");
  });

  it("omits the meta separator when there is no meta", () => {
    render(<MediaLightbox src="/videos/cases/smug-owl.mp4" label="Smug Owl" onClose={noop} />);
    expect(dialog()?.querySelector(".fl-lightbox__label")?.innerHTML).toBe("Smug Owl");
  });
});

/**
 * The FRAMED dialog (ADR-082 U35 — the era stage's pop-up, owner: it "needs to
 * be uniform. It also needs to sit in a frame"). Additive: the snapshots above
 * were taken before `frame` existed and must pass untouched.
 */
describe("MediaLightbox — the framed dialog (ADR-082 U35)", () => {
  const STILL = "/images/voidwalker/media/film-latent-land.jpg";
  const kinds = [
    {
      name: "a film on its channel",
      props: {
        embed: { src: "https://www.youtube-nocookie.com/embed/a5-DcdfxCvU?autoplay=1", title: "t" },
      },
      media: "iframe",
    },
    { name: "a self-hosted video", props: { src: "/videos/cases/smug-owl.mp4" }, media: "video" },
    {
      name: "a still",
      props: { image: { src: STILL, alt: "A frame.", width: 960, height: 540 } },
      media: "img",
    },
  ] as const;

  for (const kind of kinds) {
    it(`gives ${kind.name} the same card and the same box`, () => {
      render(
        <MediaLightbox
          {...kind.props}
          label="Welcome to Latent Land"
          meta="2023"
          frame={{ tab: "Film 02" }}
          onClose={noop}
        />
      );
      const el = dialog();
      expect(el?.className).toBe("fl-lightbox fl-lightbox--frame");
      expect(el?.getAttribute("role")).toBe("dialog");
      expect(el?.getAttribute("aria-modal")).toBe("true");
      // One card, its tab lettering the card it came from, the mark lit.
      const card = el?.querySelectorAll(".fl-lightbox__card");
      expect(card).toHaveLength(1);
      expect(el?.querySelector(".fl-lightbox__tab")?.textContent).toBe("Film 02");
      expect(el?.querySelector(".fl-lightbox__tab .fl-lightbox__mark")).not.toBeNull();
      // The title leads the picture.
      const title = el?.querySelector(".fl-lightbox__title");
      expect(title?.textContent).toBe("Welcome to Latent Land · 2023");
      expect(title?.nextElementSibling?.className).toBe("fl-lightbox__box");
      // ONE box, holding exactly one medium, whatever the kind.
      const boxes = el?.querySelectorAll(".fl-lightbox__box");
      expect(boxes).toHaveLength(1);
      const inside = boxes?.[0]?.querySelectorAll("iframe, video, img");
      expect(inside).toHaveLength(1);
      expect(inside?.[0]?.tagName.toLowerCase()).toBe(kind.media);
      expect(inside?.[0]?.classList.contains("fl-lightbox__media")).toBe(true);
      // None of the unframed dialog's shape-of-its-own classes.
      expect(
        el?.querySelector(".fl-lightbox__frame, .fl-lightbox__video, .fl-lightbox__still")
      ).toBeNull();
      expect(el?.querySelector(".fl-lightbox__close")?.textContent).toBe("Close");
    });
  }

  it("serves the still straight from /public, never through the optimizer", () => {
    // One stuck optimizer job left a card's still black for good (ADR-082 U35).
    render(
      <MediaLightbox
        image={{ src: STILL, alt: "A frame.", width: 960, height: 540 }}
        label="t"
        frame={{ tab: "Image" }}
        onClose={noop}
      />
    );
    const img = dialog()?.querySelector<HTMLImageElement>("img.fl-lightbox__media");
    expect(img?.getAttribute("src")).toBe(STILL);
    expect(img?.getAttribute("srcset") ?? "").not.toContain("/_next/image");
  });

  it("omits the meta separator when there is no meta", () => {
    render(
      <MediaLightbox
        src="/videos/cases/smug-owl.mp4"
        label="Smug Owl"
        frame={{ tab: "Video" }}
        onClose={noop}
      />
    );
    expect(dialog()?.querySelector(".fl-lightbox__title")?.innerHTML).toBe("Smug Owl");
  });
});
