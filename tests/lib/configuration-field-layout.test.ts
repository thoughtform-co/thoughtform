import { describe, expect, it } from "vitest";

import {
  ALLOCATION_TIERS,
  CONFIGURATION_SHAPES,
  MAP_FIELD_REFERENCE_SIZE,
  MAP_MODES,
  MAP_PROJECTIONS,
  PUBLIC_FUNCTION_ORDER,
  layoutConfigurationField,
  type AllocationTierName,
  type ConfigurationFieldInputNode,
  type ConfigurationFieldLayout,
  type MapLayoutAnchor,
  type MapLayoutNode,
  type MapMode,
  type MapProjection,
} from "@/components/landing/home-v2/services/casefile/configurationFieldLayout";

/** The approved eight public work configurations, reduced to layout fields. */
const NODES: readonly ConfigurationFieldInputNode[] = [
  {
    id: "nda-review",
    shape: "Judgment",
    publicFunction: "Legal & Risk",
    allocationTier: "Deep",
  },
  {
    id: "firmware-audit",
    shape: "Judgment",
    publicFunction: "Product & Engineering",
    allocationTier: "Frontier",
  },
  {
    id: "product-pressure-test",
    shape: "Judgment",
    publicFunction: "Product & Engineering",
    allocationTier: "Everyday",
  },
  {
    id: "packaging-handover",
    shape: "Pattern",
    publicFunction: "Design & Production",
    allocationTier: "Deep",
  },
  {
    id: "paid-social-copy",
    shape: "Voice",
    publicFunction: "Creative & Brand",
    allocationTier: "Everyday",
  },
  {
    id: "supplier-invoice-review",
    shape: "Validation",
    publicFunction: "Operations",
    allocationTier: "Everyday",
  },
  {
    id: "general-ledger-reconciliation",
    shape: "Validation",
    publicFunction: "Finance",
    allocationTier: "Everyday",
  },
  {
    id: "cross-team-status-digest",
    shape: "Stakeholder",
    publicFunction: "People & Programs",
    allocationTier: "Everyday",
  },
] as const;

interface PixelBox {
  key: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function nodePixelBox(node: MapLayoutNode, mode: MapMode): PixelBox {
  const { width, height } = MAP_FIELD_REFERENCE_SIZE[mode];
  return {
    key: node.id,
    left: node.x * width,
    top: node.y * height,
    right: (node.x + node.width) * width,
    bottom: (node.y + node.height) * height,
  };
}

function anchorPixelBox(anchor: MapLayoutAnchor, mode: MapMode): PixelBox {
  const { width, height } = MAP_FIELD_REFERENCE_SIZE[mode];
  return {
    key: anchor.key,
    left: anchor.x * width,
    top: anchor.y * height,
    right: (anchor.x + (anchor.width ?? 0)) * width,
    bottom: (anchor.y + (anchor.height ?? 0)) * height,
  };
}

function boxesIntersect(a: PixelBox, b: PixelBox): boolean {
  const epsilon = 0.01;
  return !(
    a.right <= b.left + epsilon ||
    b.right <= a.left + epsilon ||
    a.bottom <= b.top + epsilon ||
    b.bottom <= a.top + epsilon
  );
}

function expectInBounds(layout: ConfigurationFieldLayout) {
  const boxes = [...layout.nodes.values(), ...layout.anchors];
  for (const box of boxes) {
    expect(box.x, `${"id" in box ? box.id : box.key}: x`).toBeGreaterThanOrEqual(0);
    expect(box.y, `${"id" in box ? box.id : box.key}: y`).toBeGreaterThanOrEqual(0);
    expect(
      box.x + (box.width ?? 0),
      `${"id" in box ? box.id : box.key}: right`
    ).toBeLessThanOrEqual(1);
    expect(
      box.y + (box.height ?? 0),
      `${"id" in box ? box.id : box.key}: bottom`
    ).toBeLessThanOrEqual(1);
  }
}

function expectNoCollisions(layout: ConfigurationFieldLayout, mode: MapMode) {
  const nodes = [...layout.nodes.values()].map((node) => nodePixelBox(node, mode));
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      expect(
        boxesIntersect(nodes[i], nodes[j]),
        `${mode}: ${nodes[i].key} overlaps ${nodes[j].key}`
      ).toBe(false);
    }
  }

  const anchors = layout.anchors.map((anchor) => anchorPixelBox(anchor, mode));
  for (let i = 0; i < anchors.length; i += 1) {
    for (let j = i + 1; j < anchors.length; j += 1) {
      expect(
        boxesIntersect(anchors[i], anchors[j]),
        `${mode}: anchor ${anchors[i].key} overlaps ${anchors[j].key}`
      ).toBe(false);
    }
  }

  for (const node of nodes) {
    for (const anchor of anchors) {
      expect(
        boxesIntersect(node, anchor),
        `${mode}: ${node.key} overlaps anchor ${anchor.key}`
      ).toBe(false);
    }
  }
}

function expectCompleteNavigation(layout: ConfigurationFieldLayout) {
  const navigable = layout.navRows.flat();
  expect(navigable).toHaveLength(NODES.length);
  expect(new Set(navigable)).toEqual(new Set(NODES.map((node) => node.id)));

  for (const row of layout.navRows) {
    const placements = row.map((id) => layout.nodes.get(id)!);
    expect(new Set(placements.map((node) => node.y)).size).toBe(1);
    for (let index = 1; index < placements.length; index += 1) {
      expect(placements[index].x).toBeGreaterThanOrEqual(placements[index - 1].x);
    }
  }
}

function serialize(layout: ConfigurationFieldLayout) {
  return {
    nodes: [...layout.nodes.entries()].sort(([a], [b]) => a.localeCompare(b)),
    anchors: layout.anchors,
    navRows: layout.navRows,
  };
}

const layoutFor = (
  projection: MapProjection,
  mode: MapMode,
  focusedTier?: AllocationTierName,
  nodes: readonly ConfigurationFieldInputNode[] = NODES
) => layoutConfigurationField({ nodes, projection, mode, focusedTier });

describe("configuration field layout", () => {
  it("places every persistent node exactly once in every base view and mode", () => {
    for (const mode of MAP_MODES) {
      for (const projection of MAP_PROJECTIONS) {
        const layout = layoutFor(projection, mode);
        expect(layout.nodes.size).toBe(NODES.length);
        expect(new Set(layout.nodes.keys())).toEqual(new Set(NODES.map((node) => node.id)));
        expectInBounds(layout);
        expectNoCollisions(layout, mode);
        expectCompleteNavigation(layout);
      }
    }
  });

  it("is deterministic and independent of source-array order", () => {
    const reversed = [...NODES].reverse();
    for (const mode of MAP_MODES) {
      for (const projection of MAP_PROJECTIONS) {
        expect(serialize(layoutFor(projection, mode, undefined, reversed))).toEqual(
          serialize(layoutFor(projection, mode))
        );
      }
      for (const tier of ALLOCATION_TIERS) {
        expect(serialize(layoutFor("allocation", mode, tier, reversed))).toEqual(
          serialize(layoutFor("allocation", mode, tier))
        );
      }
    }
  });

  it("keeps all five shape attractors and files nodes under their shape", () => {
    for (const mode of MAP_MODES) {
      const layout = layoutFor("configuration", mode);
      expect(layout.anchors.map((anchor) => anchor.label)).toEqual(CONFIGURATION_SHAPES);

      for (const input of NODES) {
        const node = layout.nodes.get(input.id)!;
        expect(node.clusterKey).toBe(`shape:${input.shape}`);
        const anchor = layout.anchors.find((item) => item.key === node.clusterKey)!;
        expect(node.y).toBeLessThanOrEqual(anchor.y + (anchor.height ?? 0));
        expect(anchor.y).toBeLessThanOrEqual(node.y + node.height);
      }
    }
  });

  it("orders public-function lanes canonically and files every node under its function", () => {
    for (const mode of MAP_MODES) {
      const layout = layoutFor("team", mode);
      expect(layout.anchors.map((anchor) => anchor.label)).toEqual(PUBLIC_FUNCTION_ORDER);

      for (const input of NODES) {
        expect(layout.nodes.get(input.id)?.clusterKey).toBe(`team:${input.publicFunction}`);
      }
    }
  });

  it("always exposes all four allocation attractors, including an explicit empty Fast tier", () => {
    for (const mode of MAP_MODES) {
      const layout = layoutFor("allocation", mode);
      expect(layout.anchors.map((anchor) => anchor.label)).toEqual(ALLOCATION_TIERS);
      expect(layout.anchors.find((anchor) => anchor.label === "Fast")).toMatchObject({
        key: "tier:Fast",
        empty: true,
      });

      for (const input of NODES) {
        expect(layout.nodes.get(input.id)?.clusterKey).toBe(`tier:${input.allocationTier}`);
      }
    }
  });

  it("treats a null focused tier as the unfocused allocation field", () => {
    for (const mode of MAP_MODES) {
      expect(
        serialize(
          layoutConfigurationField({
            nodes: NODES,
            projection: "allocation",
            mode,
            focusedTier: null,
          })
        )
      ).toEqual(serialize(layoutFor("allocation", mode)));
    }
  });

  it("fans the focused tier centrally and condenses every other tier without unmounting nodes", () => {
    for (const mode of MAP_MODES) {
      for (const tier of ALLOCATION_TIERS) {
        const layout = layoutFor("allocation", mode, tier);
        const focusedAnchor = layout.anchors.find((anchor) => anchor.label === tier)!;

        expect(focusedAnchor.focused).toBe(true);
        expect(focusedAnchor.condensed).not.toBe(true);
        expect(focusedAnchor.x + (focusedAnchor.width ?? 0) / 2).toBeCloseTo(0.5, 6);
        expect(layout.nodes.size).toBe(NODES.length);

        for (const input of NODES) {
          const node = layout.nodes.get(input.id)!;
          expect(Boolean(node.condensed)).toBe(input.allocationTier !== tier);
          if (input.allocationTier === tier) {
            expect(node.x).toBeGreaterThanOrEqual(0.19);
            expect(node.x + node.width).toBeLessThanOrEqual(0.81);
          }
        }

        for (const anchor of layout.anchors) {
          if (anchor.label !== tier) expect(anchor.condensed).toBe(true);
        }

        expectInBounds(layout);
        expectNoCollisions(layout, mode);
        expectCompleteNavigation(layout);
      }
    }
  });

  it("keeps a focused Fast tier visibly empty while parking every work node at the edges", () => {
    for (const mode of MAP_MODES) {
      const layout = layoutFor("allocation", mode, "Fast");
      const fast = layout.anchors.find((anchor) => anchor.label === "Fast");
      expect(fast).toMatchObject({ empty: true, focused: true });
      expect([...layout.nodes.values()].every((node) => node.condensed)).toBe(true);
    }
  });

  it("uses materially different geometry for compact and expanded fields", () => {
    for (const projection of MAP_PROJECTIONS) {
      expect(serialize(layoutFor(projection, "preview"))).not.toEqual(
        serialize(layoutFor(projection, "expanded"))
      );
    }
  });

  it("rejects duplicate stable ids instead of silently dropping a persistent node", () => {
    expect(() =>
      layoutConfigurationField({
        nodes: [...NODES, { ...NODES[0] }],
        projection: "configuration",
        mode: "preview",
      })
    ).toThrow("Configuration field node id must be unique: nda-review");
  });

  it("does not mutate the authored node array", () => {
    const frozen = Object.freeze(NODES.map((node) => Object.freeze({ ...node })));
    expect(() =>
      layoutConfigurationField({
        nodes: frozen,
        projection: "allocation",
        mode: "expanded",
        focusedTier: "Everyday",
      })
    ).not.toThrow();
  });
});
