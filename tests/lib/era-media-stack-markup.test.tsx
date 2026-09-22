import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EraMediaStack } from "@/components/landing/home-v2/voidwalker/hologram/EraMediaStack";
import type { CharacterEraMedia } from "@/lib/voidwalker/characterEras";

/**
 * The TRANSMISSION pile's markup (ADR-082 U31).
 *
 * The pile's GEOMETRY is the sheet's and is measured live
 * (`scripts/capture-era-media.mjs`); what is pinned here is the part a still
 * cannot show — which card is in front, what each tab says to a reader who
 * cannot see it, that a card behind the front one renders NO body, and that no
 * player is ever mounted on the page.
 */
const noop = () => {};

const film: CharacterEraMedia = {
  kind: "embed",
  youtubeId: "a5-DcdfxCvU",
  title: "How the power of fans saved The Expanse",
  duration: "2:14",
  poster: "/images/voidwalker/media/film-save-the-expanse.jpg",
};
const cut: CharacterEraMedia = {
  kind: "video",
  src: "/videos/voidwalker/media/a-cut.mp4",
  title: "A cut",
  poster: "/images/voidwalker/media/film-latent-land.jpg",
};
const still: CharacterEraMedia = {
  kind: "image",
  src: "/images/voidwalker/media/film-latent-land.jpg",
  width: 960,
  height: 540,
  title: "A plate",
  alt: "What the plate shows.",
  focus: [0.25, 0.75],
};

const render = (items: readonly CharacterEraMedia[], front = 0) =>
  renderToStaticMarkup(
    <EraMediaStack items={items} front={front} onFront={noop} onOpen={noop} idPrefix="t" />
  );

const parse = (html: string) => {
  const host = document.createElement("div");
  host.innerHTML = html;
  return host;
};

describe("EraMediaStack markup (ADR-082 U31)", () => {
  it("renders nothing for an empty pile — the seat SAYS the absence instead", () => {
    expect(render([])).toBe("");
  });

  it("a single card letters its kind and no ordinal", () => {
    const root = parse(render([film]));
    const tabs = root.querySelectorAll(".vwd__mcard__tab");
    expect(tabs).toHaveLength(1);
    // `FILM 01` on the only card an era holds is an ordinal with nothing to order.
    expect(tabs[0]!.textContent).toBe("Film");
    expect(root.querySelector(".vwd__mstack")?.getAttribute("aria-label")).toBe("Transmission");
    // ADR-082 U34: one tab width for every card, solved in the SHEET — the
    // component no longer writes a per-pile character count.
    expect(
      root.querySelector<HTMLElement>(".vwd__mstack")?.style.getPropertyValue("--vwd-mtab-fch")
    ).toBe("");
  });

  it("orders a pile BY DEPTH, cyclically, from whichever card is in front", () => {
    const depths = (front: number) =>
      [
        ...parse(render([film, cut, still], front)).querySelectorAll<HTMLElement>(".vwd__mcard"),
      ].map((c) => Number(c.dataset.vwdMediaDepth));
    expect(depths(0)).toEqual([0, 1, 2]);
    // Choosing the last card ROTATES the pile: the first is now one behind it.
    expect(depths(2)).toEqual([1, 2, 0]);
    expect(depths(1)).toEqual([2, 0, 1]);
    // Out of range is the front, never a crash and never an empty pile.
    expect(depths(9)).toEqual([0, 1, 2]);
    expect(depths(-1)).toEqual([0, 1, 2]);
  });

  it("every tab letters the same thing — its mark, its KIND and its own index (ADR-082 U34)", () => {
    const root = parse(render([film, cut, still], 2));
    const tabs = [...root.querySelectorAll(".vwd__mcard__tab")];
    // One notch, one lettering, on every folder, whichever card is in front.
    expect(tabs.map((t) => t.textContent)).toEqual(["Film01", "Film02", "Image03"]);
    // ⚠ The COUNT is never lettered: the tabs stacked above the front one ARE it.
    expect(root.textContent).not.toMatch(/\/\s*03/);
    // Every tab carries the mark; the SHEET lights the pressed one's alone.
    expect(root.querySelectorAll(".vwd__mcard__mark")).toHaveLength(3);
    for (const tab of tabs) expect(tab.querySelector(".vwd__mcard__mark")).not.toBeNull();
    expect(tabs.filter((t) => t.getAttribute("aria-pressed") === "true")).toHaveLength(1);
    expect(tabs[2]!.getAttribute("aria-pressed")).toBe("true");
  });

  it("every tab stays a button in every state, and says what it is", () => {
    const root = parse(render([film, cut, still], 0));
    const tabs = [...root.querySelectorAll(".vwd__mcard__tab")];
    // ⚠ A chosen tab that turned into a label would unmount the focused element.
    for (const tab of tabs) expect(tab.tagName).toBe("BUTTON");
    expect(tabs.map((t) => t.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
    expect(tabs.map((t) => t.getAttribute("aria-label"))).toEqual([
      "Film 1 of 3: How the power of fans saved The Expanse",
      "Film 2 of 3: A cut",
      "Image 3 of 3: A plate",
    ]);
    expect(root.querySelector(".vwd__mstack")?.getAttribute("aria-label")).toBe(
      "Transmissions, 3 on record"
    );
  });

  it("ONLY the front card renders a body — the glass looks onto empty folders", () => {
    const root = parse(render([film, cut, still], 1));
    const cards = [...root.querySelectorAll(".vwd__mcard")];
    expect(cards.map((c) => c.querySelectorAll(".vwd__mcard__body").length)).toEqual([0, 1, 0]);
    expect(root.querySelectorAll(".vwd__mcard__frame")).toHaveLength(1);
    expect(root.querySelector(".vwd__mcard__title")?.textContent).toBe("A cut");
    // ADR-082 U32 (owner): the title LEADS the frame — read before the picture.
    const body = root.querySelector(".vwd__mcard__body")!;
    expect([...body.children].map((c) => c.className)).toEqual([
      "vwd__mcard__title",
      "vwd__mcard__frame",
    ]);
    // The pressed tab names the body it controls.
    const front = cards[1]!;
    expect(front.querySelector(".vwd__mcard__tab")?.getAttribute("aria-controls")).toBe(
      front.querySelector(".vwd__mcard__body")?.id
    );
  });

  it("a film says Play, a still says View, and the still's window follows `focus`", () => {
    const playing = parse(render([film])).querySelector(".vwd__mcard__frame");
    expect(playing?.getAttribute("aria-label")).toBe(
      "Play: How the power of fans saved The Expanse"
    );
    expect(playing?.getAttribute("aria-haspopup")).toBe("dialog");

    const viewing = parse(render([still]));
    expect(viewing.querySelector(".vwd__mcard__frame")?.getAttribute("aria-label")).toBe(
      "View: A plate"
    );
    const img = viewing.querySelector<HTMLImageElement>("img.vwd__mcard__still");
    // Decorative: the frame's own label names it, and the dialog carries the alt.
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.style.objectPosition).toBe("25% 75%");
    expect(viewing.querySelector(".vwd__mcard")?.getAttribute("data-vwd-media-kind")).toBe("image");
  });

  it("mounts no player — a card frames a STILL, the dialog builds the rest", () => {
    const html = render([film, cut, still], 1);
    expect(html).not.toMatch(/<video|<iframe|youtube/i);
    // A self-hosted video's card shows its POSTER, never its file.
    expect(html).not.toContain("a-cut.mp4");
  });
});
