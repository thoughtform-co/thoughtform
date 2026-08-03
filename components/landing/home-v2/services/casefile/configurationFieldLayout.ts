/**
 * Pure geometry for the Loop Intelligence Map work-configuration field.
 *
 * Eight persistent work nodes move between three projections. This module
 * owns their final boxes so the React layer can FLIP the same DOM nodes,
 * position SVG hairlines, and derive keyboard rows without measuring or
 * maintaining a second layout model.
 *
 * Coordinates are normalized top-left boxes in the inclusive 0..1 field
 * space. Multiply x/width by the field width and y/height by its height.
 * Nothing here reads the DOM, window, time, or random state.
 */

export const MAP_PROJECTIONS = ["configuration", "team", "allocation"] as const;
export type MapProjection = (typeof MAP_PROJECTIONS)[number];

export const MAP_MODES = ["preview", "expanded"] as const;
export type MapMode = (typeof MAP_MODES)[number];

export const CONFIGURATION_SHAPES = [
  "Judgment",
  "Voice",
  "Validation",
  "Stakeholder",
  "Pattern",
] as const;

export const PUBLIC_FUNCTION_ORDER = [
  "Legal & Risk",
  "Product & Engineering",
  "Design & Production",
  "Creative & Brand",
  "Operations",
  "Finance",
  "People & Programs",
] as const;

export const ALLOCATION_TIERS = ["Fast", "Everyday", "Deep", "Frontier"] as const;
export type AllocationTierName = (typeof ALLOCATION_TIERS)[number];

/** Reference boxes used by visual QA and geometry tests. */
export const MAP_FIELD_REFERENCE_SIZE: Record<
  MapMode,
  Readonly<{ width: number; height: number }>
> = {
  preview: { width: 690, height: 240 },
  expanded: { width: 1120, height: 620 },
};

/** The structural subset required from a CaseWorkConfiguration. */
export interface ConfigurationFieldInputNode {
  id: string;
  shape: string;
  publicFunction: string;
  allocationTier: AllocationTierName;
}

/** A normalized top-left box for one persistent work node. */
export interface MapLayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  clusterKey: string;
  /** True while this node is parked in an edge lane around a tier focus. */
  condensed?: boolean;
}

/** A normalized top-left box for a shape, function, or tier attractor. */
export interface MapLayoutAnchor {
  key: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  empty?: boolean;
  focused?: boolean;
  condensed?: boolean;
}

export interface ConfigurationFieldLayout {
  nodes: Map<string, MapLayoutNode>;
  anchors: MapLayoutAnchor[];
  /** Visual rows, top-to-bottom and left-to-right, for arrow navigation. */
  navRows: string[][];
}

export interface LayoutConfigurationFieldArgs {
  nodes: readonly ConfigurationFieldInputNode[];
  projection: MapProjection;
  mode: MapMode;
  /** Only read by the allocation projection. */
  focusedTier?: AllocationTierName | null;
}

interface BoxMetrics {
  nodeWidth: number;
  nodeHeight: number;
  nodeGap: number;
  anchorX: number;
  anchorWidth: number;
  anchorHeight: number;
  nodeX: number;
  firstRowY: number;
  lastRowY: number;
}

const CONFIGURATION_METRICS: Record<MapMode, BoxMetrics> = {
  preview: {
    nodeWidth: 0.205,
    nodeHeight: 0.13,
    nodeGap: 0.015,
    anchorX: 0.02,
    anchorWidth: 0.2,
    anchorHeight: 0.08,
    nodeX: 0.27,
    firstRowY: 0.06,
    lastRowY: 0.76,
  },
  expanded: {
    nodeWidth: 0.19,
    nodeHeight: 0.085,
    nodeGap: 0.025,
    anchorX: 0.02,
    anchorWidth: 0.22,
    anchorHeight: 0.05,
    nodeX: 0.28,
    firstRowY: 0.07,
    lastRowY: 0.78,
  },
};

const TEAM_METRICS: Record<MapMode, BoxMetrics> = {
  preview: {
    nodeWidth: 0.205,
    nodeHeight: 0.13,
    nodeGap: 0.015,
    anchorX: 0.02,
    anchorWidth: 0.21,
    anchorHeight: 0.07,
    nodeX: 0.28,
    firstRowY: 0.02,
    lastRowY: 0.84,
  },
  expanded: {
    nodeWidth: 0.22,
    nodeHeight: 0.075,
    nodeGap: 0.025,
    anchorX: 0.02,
    anchorWidth: 0.24,
    anchorHeight: 0.045,
    nodeX: 0.29,
    firstRowY: 0.05,
    lastRowY: 0.85,
  },
};

const ALLOCATION_COLUMN_X = [0.02, 0.26, 0.5, 0.74] as const;
const ALLOCATION_COLUMN_WIDTH = 0.22;

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const round = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

function spread(count: number, first: number, last: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [round((first + last) / 2)];
  return Array.from({ length: count }, (_, index) =>
    round(first + ((last - first) * index) / (count - 1))
  );
}

function orderedKeys(
  values: readonly string[],
  preferred: readonly string[],
  includePreferredEmpty = false
): string[] {
  const present = new Set(values);
  const known = preferred.filter((key) => includePreferredEmpty || present.has(key));
  const preferredSet = new Set(preferred);
  const unknown = [...present].filter((key) => !preferredSet.has(key)).sort(compareText);
  return [...known, ...unknown];
}

function membersFor(
  nodes: readonly ConfigurationFieldInputNode[],
  field: "shape" | "publicFunction" | "allocationTier",
  value: string
): ConfigurationFieldInputNode[] {
  return nodes.filter((node) => node[field] === value).sort((a, b) => compareText(a.id, b.id));
}

function addNode(
  target: Map<string, MapLayoutNode>,
  node: ConfigurationFieldInputNode,
  box: Omit<MapLayoutNode, "id">
) {
  target.set(node.id, {
    id: node.id,
    x: round(box.x),
    y: round(box.y),
    width: round(box.width),
    height: round(box.height),
    clusterKey: box.clusterKey,
    ...(box.condensed ? { condensed: true } : {}),
  });
}

function rowProjection(
  nodes: readonly ConfigurationFieldInputNode[],
  field: "shape" | "publicFunction",
  keys: readonly string[],
  prefix: "shape" | "team",
  metrics: BoxMetrics
): Omit<ConfigurationFieldLayout, "navRows"> {
  const placed = new Map<string, MapLayoutNode>();
  const anchors: MapLayoutAnchor[] = [];
  const rowY = spread(keys.length, metrics.firstRowY, metrics.lastRowY);

  keys.forEach((key, rowIndex) => {
    const members = membersFor(nodes, field, key);
    const clusterKey = `${prefix}:${key}`;
    const y = rowY[rowIndex];

    anchors.push({
      key: clusterKey,
      label: key,
      x: metrics.anchorX,
      y: round(y + (metrics.nodeHeight - metrics.anchorHeight) / 2),
      width: metrics.anchorWidth,
      height: metrics.anchorHeight,
      ...(members.length === 0 ? { empty: true } : {}),
    });

    members.forEach((node, memberIndex) => {
      addNode(placed, node, {
        x: metrics.nodeX + memberIndex * (metrics.nodeWidth + metrics.nodeGap),
        y,
        width: metrics.nodeWidth,
        height: metrics.nodeHeight,
        clusterKey,
      });
    });
  });

  return { nodes: placed, anchors };
}

function allocationDefault(
  nodes: readonly ConfigurationFieldInputNode[],
  mode: MapMode
): Omit<ConfigurationFieldLayout, "navRows"> {
  const placed = new Map<string, MapLayoutNode>();
  const anchors: MapLayoutAnchor[] = [];
  const nodeWidth = mode === "preview" ? 0.2 : 0.18;
  const nodeHeight = mode === "preview" ? 0.125 : 0.08;
  const columnCount = 1;
  const columnGap = 0;
  const rowGap = mode === "preview" ? 0.0125 : 0.045;
  const clusterCenterY = mode === "preview" ? 0.625 : 0.51;

  ALLOCATION_TIERS.forEach((tier, tierIndex) => {
    const members = membersFor(nodes, "allocationTier", tier);
    const clusterKey = `tier:${tier}`;
    const columnX = ALLOCATION_COLUMN_X[tierIndex];

    anchors.push({
      key: clusterKey,
      label: tier,
      x: columnX,
      y: mode === "preview" ? 0.02 : 0.04,
      width: ALLOCATION_COLUMN_WIDTH,
      height: mode === "preview" ? 0.22 : 0.06,
      ...(members.length === 0 ? { empty: true } : {}),
    });

    const rows = Math.ceil(members.length / columnCount);
    const totalHeight = rows * nodeHeight + Math.max(0, rows - 1) * rowGap;
    const firstY = clusterCenterY - totalHeight / 2;

    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      const row = members.slice(rowIndex * columnCount, (rowIndex + 1) * columnCount);
      const rowWidth = row.length * nodeWidth + Math.max(0, row.length - 1) * columnGap;
      const firstX = columnX + (ALLOCATION_COLUMN_WIDTH - rowWidth) / 2;

      row.forEach((node, columnIndex) => {
        addNode(placed, node, {
          x: firstX + columnIndex * (nodeWidth + columnGap),
          y: firstY + rowIndex * (nodeHeight + rowGap),
          width: nodeWidth,
          height: nodeHeight,
          clusterKey,
        });
      });
    }
  });

  return { nodes: placed, anchors };
}

interface EdgeSlot {
  anchor: Readonly<{ x: number; y: number; width: number; height: number }>;
  direction: "vertical" | "horizontal";
  node: Readonly<{
    x: number;
    y: number;
    width: number;
    height: number;
    last: number;
    gap: number;
  }>;
}

const FOCUSED_EDGE_SLOTS: Record<MapMode, readonly EdgeSlot[]> = {
  preview: [
    {
      anchor: { x: 0.01, y: 0.05, width: 0.16, height: 0.06 },
      direction: "vertical",
      node: { x: 0.025, y: 0.18, width: 0.13, height: 0.055, last: 0.64, gap: 0 },
    },
    {
      anchor: { x: 0.83, y: 0.05, width: 0.16, height: 0.06 },
      direction: "vertical",
      node: { x: 0.845, y: 0.18, width: 0.13, height: 0.055, last: 0.64, gap: 0 },
    },
    {
      anchor: { x: 0.22, y: 0.73, width: 0.56, height: 0.06 },
      direction: "horizontal",
      node: { x: 0.22, y: 0.85, width: 0.095, height: 0.055, last: 0.78, gap: 0.018 },
    },
  ],
  expanded: [
    {
      anchor: { x: 0.015, y: 0.05, width: 0.17, height: 0.05 },
      direction: "vertical",
      node: { x: 0.025, y: 0.18, width: 0.15, height: 0.06, last: 0.75, gap: 0 },
    },
    {
      anchor: { x: 0.815, y: 0.05, width: 0.17, height: 0.05 },
      direction: "vertical",
      node: { x: 0.825, y: 0.18, width: 0.15, height: 0.06, last: 0.75, gap: 0 },
    },
    {
      anchor: { x: 0.25, y: 0.8, width: 0.5, height: 0.05 },
      direction: "horizontal",
      node: { x: 0.21, y: 0.9, width: 0.1, height: 0.055, last: 0.79, gap: 0.018 },
    },
  ],
};

function centeredRowX(count: number, width: number, gap: number): number[] {
  const totalWidth = count * width + Math.max(0, count - 1) * gap;
  const firstX = 0.5 - totalWidth / 2;
  return Array.from({ length: count }, (_, index) => round(firstX + index * (width + gap)));
}

function focusedRows<T>(members: readonly T[]): T[][] {
  if (members.length <= 3) return members.length ? [[...members]] : [];
  const firstCount = Math.floor(members.length / 2);
  return [members.slice(0, firstCount), members.slice(firstCount)];
}

function placeCondensedCluster(
  placed: Map<string, MapLayoutNode>,
  members: readonly ConfigurationFieldInputNode[],
  clusterKey: string,
  slot: EdgeSlot
) {
  if (slot.direction === "vertical") {
    const yPositions = spread(members.length, slot.node.y, slot.node.last);
    members.forEach((node, index) => {
      addNode(placed, node, {
        x: slot.node.x,
        y: yPositions[index],
        width: slot.node.width,
        height: slot.node.height,
        clusterKey,
        condensed: true,
      });
    });
    return;
  }

  const rowWidth =
    members.length * slot.node.width + Math.max(0, members.length - 1) * slot.node.gap;
  const firstX = slot.node.x + (slot.node.last - slot.node.x - rowWidth) / 2;
  members.forEach((node, index) => {
    addNode(placed, node, {
      x: firstX + index * (slot.node.width + slot.node.gap),
      y: slot.node.y,
      width: slot.node.width,
      height: slot.node.height,
      clusterKey,
      condensed: true,
    });
  });
}

function allocationFocused(
  nodes: readonly ConfigurationFieldInputNode[],
  mode: MapMode,
  focusedTier: AllocationTierName
): Omit<ConfigurationFieldLayout, "navRows"> {
  const placed = new Map<string, MapLayoutNode>();
  const anchorsByTier = new Map<AllocationTierName, MapLayoutAnchor>();
  const focusedMembers = membersFor(nodes, "allocationTier", focusedTier);
  const focusedClusterKey = `tier:${focusedTier}`;
  const focusedNodeWidth = mode === "preview" ? 0.13 : 0.18;
  const focusedNodeHeight = mode === "preview" ? 0.105 : 0.09;
  const focusedColumnGap = mode === "preview" ? 0.035 : 0.04;
  const focusedRowGap = mode === "preview" ? 0.085 : 0.1;
  const focusedCenterY = mode === "preview" ? 0.43 : 0.4;

  anchorsByTier.set(focusedTier, {
    key: focusedClusterKey,
    label: focusedTier,
    x: mode === "preview" ? 0.35 : 0.36,
    y: mode === "preview" ? 0.05 : 0.04,
    width: mode === "preview" ? 0.3 : 0.28,
    height: mode === "preview" ? 0.08 : 0.06,
    focused: true,
    ...(focusedMembers.length === 0 ? { empty: true } : {}),
  });

  const rows = focusedRows(focusedMembers);
  const totalHeight =
    rows.length * focusedNodeHeight + Math.max(0, rows.length - 1) * focusedRowGap;
  const firstY = focusedCenterY - totalHeight / 2;
  rows.forEach((row, rowIndex) => {
    const xPositions = centeredRowX(row.length, focusedNodeWidth, focusedColumnGap);
    row.forEach((node, columnIndex) => {
      addNode(placed, node, {
        x: xPositions[columnIndex],
        y: firstY + rowIndex * (focusedNodeHeight + focusedRowGap),
        width: focusedNodeWidth,
        height: focusedNodeHeight,
        clusterKey: focusedClusterKey,
      });
    });
  });

  const otherTiers = ALLOCATION_TIERS.filter((tier) => tier !== focusedTier);
  otherTiers.forEach((tier, index) => {
    const members = membersFor(nodes, "allocationTier", tier);
    const slot = FOCUSED_EDGE_SLOTS[mode][index];
    const clusterKey = `tier:${tier}`;

    anchorsByTier.set(tier, {
      key: clusterKey,
      label: tier,
      ...slot.anchor,
      condensed: true,
      ...(members.length === 0 ? { empty: true } : {}),
    });
    placeCondensedCluster(placed, members, clusterKey, slot);
  });

  return {
    nodes: placed,
    anchors: ALLOCATION_TIERS.map((tier) => anchorsByTier.get(tier)!),
  };
}

function navRowsFor(nodes: ReadonlyMap<string, MapLayoutNode>): string[][] {
  const byY = new Map<number, MapLayoutNode[]>();
  const sorted = [...nodes.values()].sort(
    (a, b) => a.y - b.y || a.x - b.x || compareText(a.id, b.id)
  );

  for (const node of sorted) {
    const y = round(node.y);
    const row = byY.get(y) ?? [];
    row.push(node);
    byY.set(y, row);
  }

  return [...byY.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) =>
      row.sort((a, b) => a.x - b.x || compareText(a.id, b.id)).map((node) => node.id)
    );
}

function assertUniqueIds(nodes: readonly ConfigurationFieldInputNode[]) {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (ids.has(node.id)) {
      throw new Error(`Configuration field node id must be unique: ${node.id}`);
    }
    ids.add(node.id);
  }
}

/**
 * Resolve every persistent work node and every attractor for one projection.
 * Input order is deliberately irrelevant: stable IDs own intra-cluster order.
 */
export function layoutConfigurationField({
  nodes,
  projection,
  mode,
  focusedTier,
}: LayoutConfigurationFieldArgs): ConfigurationFieldLayout {
  assertUniqueIds(nodes);

  let partial: Omit<ConfigurationFieldLayout, "navRows">;
  if (projection === "configuration") {
    const keys = orderedKeys(
      nodes.map((node) => node.shape),
      CONFIGURATION_SHAPES,
      true
    );
    partial = rowProjection(nodes, "shape", keys, "shape", CONFIGURATION_METRICS[mode]);
  } else if (projection === "team") {
    const keys = orderedKeys(
      nodes.map((node) => node.publicFunction),
      PUBLIC_FUNCTION_ORDER
    );
    partial = rowProjection(nodes, "publicFunction", keys, "team", TEAM_METRICS[mode]);
  } else if (focusedTier) {
    partial = allocationFocused(nodes, mode, focusedTier);
  } else {
    partial = allocationDefault(nodes, mode);
  }

  return {
    ...partial,
    navRows: navRowsFor(partial.nodes),
  };
}
