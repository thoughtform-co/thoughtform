"use client";

import { useState, useCallback } from "react";
import type { FigmaTreeNode, FigmaNode } from "@/lib/figma/types";
import type { TokenDiffReport } from "@/lib/figma/token-diff";

// ═══════════════════════════════════════════════════════════════
// BRIDGE STATE HOOK
// ═══════════════════════════════════════════════════════════════
// Shared state for the Bridge tab panels.
// Used via a singleton pattern (state lifted to a module-level store).

export interface BridgeState {
  // File tree
  tree: FigmaTreeNode | null;
  treeLoading: boolean;
  treeError: string | null;

  // Selected node
  selectedNodeId: string | null;
  selectedNode: FigmaNode | null;
  selectedNodeLoading: boolean;

  // Preview
  previewUrl: string | null;
  svgContent: string | null;
  exportLoading: boolean;

  // Token diff
  tokenDiff: TokenDiffReport | null;
  tokenDiffLoading: boolean;

  // Components
  components: Array<{
    nodeId: string;
    name: string;
    description: string | null;
    containingFrame: { nodeId: string; name: string; pageName: string } | null;
  }>;
  componentsLoading: boolean;

  // File info
  fileName: string | null;
  lastModified: string | null;
}

// Module-level state (shared across panels via event emitter pattern)
let _state: BridgeState = {
  tree: null,
  treeLoading: false,
  treeError: null,
  selectedNodeId: null,
  selectedNode: null,
  selectedNodeLoading: false,
  previewUrl: null,
  svgContent: null,
  exportLoading: false,
  tokenDiff: null,
  tokenDiffLoading: false,
  components: [],
  componentsLoading: false,
  fileName: null,
  lastModified: null,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function setState(update: Partial<BridgeState>) {
  _state = { ..._state, ...update };
  notify();
}

export function useBridgeState() {
  const [, forceUpdate] = useState(0);

  // Subscribe to state changes
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  // Register/unregister listener
  useState(() => {
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  });

  return _state;
}

// ═══════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════

export async function loadFileTree() {
  if (_state.treeLoading) return;
  setState({ treeLoading: true, treeError: null });

  try {
    const res = await fetch("/api/figma/file?depth=2");
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    setState({
      tree: data.tree,
      fileName: data.name,
      lastModified: data.lastModified,
      treeLoading: false,
    });
  } catch (error) {
    setState({
      treeError: error instanceof Error ? error.message : "Failed to load file",
      treeLoading: false,
    });
  }
}

export async function expandNode(nodeId: string) {
  try {
    const res = await fetch(`/api/figma/file?ids=${nodeId}&depth=3`);
    if (!res.ok) return;
    const data = await res.json();

    // Merge expanded children into the tree
    if (_state.tree && data.tree) {
      const updatedTree = mergeTreeNode(_state.tree, nodeId, data.tree);
      setState({ tree: updatedTree });
    }
  } catch {
    // Silent fail on expand
  }
}

function mergeTreeNode(
  tree: FigmaTreeNode,
  targetId: string,
  newData: FigmaTreeNode
): FigmaTreeNode {
  if (tree.id === targetId) {
    return { ...tree, children: newData.children };
  }
  if (tree.children) {
    return {
      ...tree,
      children: tree.children.map((child) => mergeTreeNode(child, targetId, newData)),
    };
  }
  return tree;
}

export async function selectNode(nodeId: string) {
  setState({
    selectedNodeId: nodeId,
    selectedNode: null,
    selectedNodeLoading: true,
    previewUrl: null,
    svgContent: null,
  });

  try {
    // Fetch node details and preview in parallel
    const [nodeRes, exportRes] = await Promise.all([
      fetch(`/api/figma/nodes?ids=${nodeId}`),
      fetch(`/api/figma/export?ids=${nodeId}&format=png&scale=2`),
    ]);

    if (nodeRes.ok) {
      const nodeData = await nodeRes.json();
      const nodeInfo = nodeData.nodes?.[nodeId];
      if (nodeInfo) {
        setState({ selectedNode: nodeInfo.document });
      }
    }

    if (exportRes.ok) {
      const exportData = await exportRes.json();
      const imageUrl = exportData.images?.[nodeId];
      if (imageUrl) {
        setState({ previewUrl: imageUrl });
      }
    }

    setState({ selectedNodeLoading: false });
  } catch {
    setState({ selectedNodeLoading: false });
  }
}

export async function exportNodeSvg(nodeId: string) {
  setState({ exportLoading: true, svgContent: null });

  try {
    const res = await fetch(`/api/figma/export?ids=${nodeId}&format=svg&raw=true`);
    if (!res.ok) throw new Error("Export failed");
    const data = await res.json();
    const svg = data.svgContents?.[nodeId] || null;
    setState({ svgContent: svg, exportLoading: false });
    return svg;
  } catch {
    setState({ exportLoading: false });
    return null;
  }
}

export async function loadTokenDiff() {
  if (_state.tokenDiffLoading) return;
  setState({ tokenDiffLoading: true });

  try {
    const res = await fetch("/api/figma/token-diff");
    if (!res.ok) throw new Error("Token diff failed");
    const data = await res.json();
    setState({ tokenDiff: data, tokenDiffLoading: false });
  } catch {
    setState({ tokenDiffLoading: false });
  }
}

export async function loadComponents() {
  if (_state.componentsLoading) return;
  setState({ componentsLoading: true });

  try {
    const res = await fetch("/api/figma/components");
    if (!res.ok) throw new Error("Components fetch failed");
    const data = await res.json();
    setState({ components: data.components || [], componentsLoading: false });
  } catch {
    setState({ componentsLoading: false });
  }
}

export function clearSelection() {
  setState({
    selectedNodeId: null,
    selectedNode: null,
    previewUrl: null,
    svgContent: null,
  });
}
