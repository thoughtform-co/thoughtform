import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import {
  IntelligenceMapField,
  type AllocationTierName,
  type MapProjection,
} from "@/components/landing/home-v2/services/casefile/IntelligenceMapField";
import { IntelligenceMapOverlay } from "@/components/landing/home-v2/services/casefile/IntelligenceMapOverlay";
import { PROOF_CASE } from "@/lib/cases/registry";

function intelligenceMapVisual() {
  const track = PROOF_CASE.casefile.tracks.find(
    (candidate) => candidate.visual.kind === "intelligence-map"
  );
  if (!track || track.visual.kind !== "intelligence-map") {
    throw new Error("Loop Proof must expose its intelligence-map visual");
  }
  return track.visual;
}

const visual = intelligenceMapVisual();

function FieldHarness() {
  const [projection, setProjection] = useState<MapProjection>("configuration");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedTier, setFocusedTier] = useState<AllocationTierName | null>(null);

  return (
    <IntelligenceMapField
      configurations={visual.configurations}
      skills={visual.skills}
      groups={visual.groups}
      intelligence={visual.intelligence}
      mode="expanded"
      projection={projection}
      selectedId={selectedId}
      focusedTier={focusedTier}
      onProjectionChange={setProjection}
      onSelectedIdChange={setSelectedId}
      onFocusedTierChange={setFocusedTier}
    />
  );
}

function OverlayHarness() {
  const [open, setOpen] = useState(true);
  const [projection, setProjection] = useState<MapProjection>("configuration");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedTier, setFocusedTier] = useState<AllocationTierName | null>(null);

  if (!open) return null;
  return (
    <IntelligenceMapOverlay
      configurations={visual.configurations}
      skills={visual.skills}
      groups={visual.groups}
      intelligence={visual.intelligence}
      projection={projection}
      selectedId={selectedId}
      focusedTier={focusedTier}
      onProjectionChange={setProjection}
      onSelectedIdChange={setSelectedId}
      onFocusedTierChange={setFocusedTier}
      onClose={() => setOpen(false)}
    />
  );
}

describe("Loop intelligence-map interaction (ADR-061)", () => {
  it("keeps eight work nodes mounted across projections, inspection, and tier focus", () => {
    const { container } = render(<FieldHarness />);
    const nodes = Array.from(container.querySelectorAll<HTMLElement>(".fl-intel-map__node"));
    expect(nodes).toHaveLength(8);

    const initialById = new Map(nodes.map((node) => [node.dataset.persistentId, node] as const));
    expect(initialById.size).toBe(8);

    fireEvent.click(container.querySelector('[data-config-id="review-nda"]')!);
    expect(
      screen.getByRole("region", { name: "Review an NDA configuration detail" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Deep · Work evidence/)).toBeInTheDocument();
    expect(container.querySelectorAll(".fl-intel-map__reservoir [data-linked]")).toHaveLength(2);

    for (const projection of ["Team", "Allocation"]) {
      fireEvent.click(screen.getByRole("tab", { name: projection }));
      expect(screen.getByRole("tab", { name: projection })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(
        screen.getByRole("region", { name: "Review an NDA configuration detail" })
      ).toBeInTheDocument();
      for (const [id, initial] of initialById) {
        expect(container.querySelector(`[data-persistent-id="${id}"]`)).toBe(initial);
      }
    }

    const everyday = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".fl-intel-map__anchor--tier")
    ).find((anchor) => anchor.textContent?.includes("Everyday"));
    expect(everyday).toBeDefined();
    fireEvent.click(everyday!);
    expect(everyday).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".fl-intel-map__field")).toHaveAttribute(
      "data-focus-tier",
      "Everyday"
    );
    expect(container.querySelectorAll(".fl-intel-map__node")).toHaveLength(8);

    // Escape answers the innermost state first: inspector, then tier focus.
    const root = container.querySelector<HTMLElement>(".fl-intel-map")!;
    fireEvent.keyDown(root, { key: "Escape" });
    expect(
      screen.queryByRole("region", { name: "Review an NDA configuration detail" })
    ).not.toBeInTheDocument();
    expect(container.querySelector(".fl-intel-map__field")).toHaveAttribute(
      "data-focus-tier",
      "Everyday"
    );
    fireEvent.keyDown(root, { key: "Escape" });
    expect(container.querySelector(".fl-intel-map__field")).not.toHaveAttribute("data-focus-tier");
    expect(
      Array.from(
        container.querySelectorAll<HTMLElement>(".fl-intel-map__anchor--tier[data-empty]")
      ).some((anchor) => anchor.textContent?.includes("Fast"))
    ).toBe(true);
  });

  it("portals the expanded map, traps focus, locks scroll, and dismisses on Escape", async () => {
    render(<OverlayHarness />);

    const dialog = screen.getByRole("dialog", { name: "Intelligence Map" });
    const close = screen.getByRole("button", { name: "Close map" });
    expect(dialog.closest(".fl-map-overlay")?.parentElement).toBe(document.body);
    expect(close).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    const selectedNode = dialog.querySelector<HTMLButtonElement>('[data-config-id="review-nda"]')!;
    fireEvent.click(selectedNode);
    const detailClose = screen.getByRole("button", { name: "Close configuration detail" });
    detailClose.focus();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(selectedNode).toHaveFocus());
    expect(screen.getByRole("dialog", { name: "Intelligence Map" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Intelligence Map" })).not.toBeInTheDocument();
    });
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("uses one roving semantic tab stop with arrow-key projection changes", async () => {
    const { container } = render(<FieldHarness />);
    const configuration = screen.getByRole("tab", { name: "Configuration" });
    const team = screen.getByRole("tab", { name: "Team" });
    const panel = screen.getByRole("tabpanel");

    expect(configuration).toHaveAttribute("tabindex", "0");
    expect(team).toHaveAttribute("tabindex", "-1");
    expect(configuration).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", configuration.id);

    configuration.focus();
    fireEvent.keyDown(configuration, { key: "ArrowRight" });
    expect(team).toHaveAttribute("aria-selected", "true");
    expect(team).toHaveAttribute("tabindex", "0");
    expect(configuration).toHaveAttribute("tabindex", "-1");
    expect(panel).toHaveAttribute("aria-labelledby", team.id);
    await waitFor(() => expect(team).toHaveFocus());
    expect(container.querySelectorAll(".fl-intel-map__node")).toHaveLength(8);
    expect(container.querySelector(".fl-intel-map__field")).not.toHaveAttribute("data-morph");
  });

  it("lets mobile rows toggle and switch selection without outside-pointer dismissal", () => {
    const { container } = render(<FieldHarness />);
    const rows = container.querySelectorAll<HTMLButtonElement>(
      ".fl-intel-map__mobile-group button"
    );
    const first = rows[0];
    const second = rows[1];

    fireEvent.click(first);
    expect(screen.getByRole("region", { name: /configuration detail/ })).toBeInTheDocument();

    fireEvent.pointerDown(first);
    fireEvent.click(first);
    expect(screen.queryByRole("region", { name: /configuration detail/ })).not.toBeInTheDocument();

    fireEvent.click(first);
    fireEvent.pointerDown(second);
    fireEvent.click(second);
    expect(
      screen.getByRole("region", {
        name: `${visual.configurations[1].work} configuration detail`,
      })
    ).toBeInTheDocument();
  });

  it("snaps projections without FLIP when reduced motion is requested", () => {
    const previousMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    try {
      const { container } = render(<FieldHarness />);
      fireEvent.click(screen.getByRole("tab", { name: "Team" }));

      expect(screen.getByRole("tab", { name: "Team" })).toHaveAttribute("aria-selected", "true");
      expect(container.querySelector(".fl-intel-map__field")).not.toHaveAttribute("data-morph");
      for (const node of container.querySelectorAll<HTMLElement>(".fl-intel-map__node")) {
        expect(node.style.transform).toBe("");
      }
    } finally {
      window.matchMedia = previousMatchMedia;
    }
  });
});
