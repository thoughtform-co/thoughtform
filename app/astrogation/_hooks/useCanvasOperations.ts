"use client";

import { useCallback } from "react";
import type { FoundryCanvasItem, FoundryCanvasDocument } from "../_components/types";
import type { DesignOperation } from "../_components/DesignCard";
import { getRegistryComponent } from "../_components/registry-map";

// ═══════════════════════════════════════════════════════════════════════════
// CANVAS OPERATIONS HOOK
// Phase 3: Args-first operations for the Foundry canvas
//
// This hook provides a unified interface for all canvas modifications,
// making it easy for the Assistant to propose and apply changes.
// ═══════════════════════════════════════════════════════════════════════════

export interface UseCanvasOperationsProps {
  /** Current canvas document */
  document: FoundryCanvasDocument;
  /** Dispatch function to update document state */
  onUpdateDocument: (updater: (doc: FoundryCanvasDocument) => FoundryCanvasDocument) => void;
  /** Show a toast notification */
  onToast?: (message: string) => void;
}

export interface CanvasOperations {
  /** Update args on a canvas item */
  updateItemArgs: (itemId: string, patch: Record<string, unknown>) => void;
  /** Update style vars on a canvas item */
  updateItemStyleVars: (itemId: string, patch: Record<string, string>) => void;
  /** Swap component (change registry key) */
  swapComponent: (itemId: string, newRegistryKey: string) => void;
  /** Create a new item on the canvas */
  createItem: (registryKey: string, args: Record<string, unknown>, name?: string) => string;
  /** Duplicate an existing item */
  duplicateItem: (itemId: string, offsetX?: number, offsetY?: number) => string | null;
  /** Delete an item */
  deleteItem: (itemId: string) => void;
  /** Apply a DesignOperation (unified handler) */
  applyOperation: (operation: DesignOperation) => void;
  /** Get item by ID */
  getItem: (itemId: string) => FoundryCanvasItem | undefined;
}

export function useCanvasOperations({
  document,
  onUpdateDocument,
  onToast,
}: UseCanvasOperationsProps): CanvasOperations {
  // Get item by ID
  const getItem = useCallback(
    (itemId: string): FoundryCanvasItem | undefined => {
      return document.items.find((item) => item.id === itemId);
    },
    [document.items]
  );

  // Update args on a canvas item
  const updateItemArgs = useCallback(
    (itemId: string, patch: Record<string, unknown>) => {
      onUpdateDocument((doc) => ({
        ...doc,
        items: doc.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            args: { ...item.args, ...patch },
            // Also update props for backwards compat
            props: { ...item.props, ...patch },
          };
        }),
      }));
      onToast?.("Args updated");
    },
    [onUpdateDocument, onToast]
  );

  // Update style vars on a canvas item
  const updateItemStyleVars = useCallback(
    (itemId: string, patch: Record<string, string>) => {
      onUpdateDocument((doc) => ({
        ...doc,
        items: doc.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            styleVars: { ...item.styleVars, ...patch },
          };
        }),
      }));
      onToast?.("Style updated");
    },
    [onUpdateDocument, onToast]
  );

  // Swap component (change registry key while preserving compatible args)
  const swapComponent = useCallback(
    (itemId: string, newRegistryKey: string) => {
      const newDef = getRegistryComponent(newRegistryKey);
      if (!newDef) {
        onToast?.(`Component "${newRegistryKey}" not found`);
        return;
      }

      onUpdateDocument((doc) => ({
        ...doc,
        items: doc.items.map((item) => {
          if (item.id !== itemId) return item;

          // Preserve args that exist in the new component's defaults
          const preservedArgs: Record<string, unknown> = {};
          const defaultArgKeys = Object.keys(newDef.defaultArgs);

          for (const key of defaultArgKeys) {
            if (item.args && key in item.args) {
              preservedArgs[key] = item.args[key];
            }
          }

          return {
            ...item,
            source: "registry",
            registryKey: newRegistryKey,
            componentId: newRegistryKey,
            name: newDef.name,
            args: { ...newDef.defaultArgs, ...preservedArgs },
            props: { ...newDef.defaultArgs, ...preservedArgs },
          };
        }),
      }));
      onToast?.(`Swapped to ${newDef.name}`);
    },
    [onUpdateDocument, onToast]
  );

  // Create a new item on the canvas
  const createItem = useCallback(
    (registryKey: string, args: Record<string, unknown>, name?: string): string => {
      const def = getRegistryComponent(registryKey);
      const itemName = name || def?.name || registryKey;
      const id = crypto.randomUUID();

      onUpdateDocument((doc) => {
        // Calculate position - center of visible area with slight offset for new items
        const { panX, panY, zoom } = doc.viewport;
        const x = (-panX + 400) / zoom + Math.random() * 50;
        const y = (-panY + 200) / zoom + Math.random() * 50;
        const maxZ = doc.items.length > 0 ? Math.max(...doc.items.map((i) => i.frame.z)) : 0;

        const newItem: FoundryCanvasItem = {
          id,
          name: itemName,
          source: "registry",
          registryKey,
          componentId: registryKey,
          args: { ...(def?.defaultArgs || {}), ...args },
          props: { ...(def?.defaultArgs || {}), ...args },
          frame: {
            x,
            y,
            w: 300,
            h: 200,
            z: maxZ + 1,
          },
        };

        return {
          ...doc,
          items: [...doc.items, newItem],
        };
      });

      onToast?.(`Created ${itemName}`);
      return id;
    },
    [onUpdateDocument, onToast]
  );

  // Duplicate an existing item
  const duplicateItem = useCallback(
    (itemId: string, offsetX = 40, offsetY = 40): string | null => {
      const original = getItem(itemId);
      if (!original) {
        onToast?.("Item not found");
        return null;
      }

      const id = crypto.randomUUID();

      onUpdateDocument((doc) => {
        const maxZ = doc.items.length > 0 ? Math.max(...doc.items.map((i) => i.frame.z)) : 0;

        const newItem: FoundryCanvasItem = {
          ...original,
          id,
          name: `${original.name} (copy)`,
          frame: {
            ...original.frame,
            x: original.frame.x + offsetX,
            y: original.frame.y + offsetY,
            z: maxZ + 1,
          },
        };

        return {
          ...doc,
          items: [...doc.items, newItem],
        };
      });

      onToast?.(`Duplicated ${original.name}`);
      return id;
    },
    [getItem, onUpdateDocument, onToast]
  );

  // Delete an item
  const deleteItem = useCallback(
    (itemId: string) => {
      const item = getItem(itemId);
      onUpdateDocument((doc) => ({
        ...doc,
        items: doc.items.filter((i) => i.id !== itemId),
      }));
      onToast?.(`Deleted ${item?.name || "item"}`);
    },
    [getItem, onUpdateDocument, onToast]
  );

  // Apply a unified DesignOperation
  const applyOperation = useCallback(
    (operation: DesignOperation) => {
      switch (operation.type) {
        case "updateArgs":
          updateItemArgs(operation.itemId, operation.patch);
          break;
        case "updateStyleVars":
          updateItemStyleVars(operation.itemId, operation.patch);
          break;
        case "swapComponent":
          swapComponent(operation.itemId, operation.newRegistryKey);
          break;
        case "createItem":
          createItem(operation.registryKey, operation.args, operation.name);
          break;
        case "duplicateItem":
          duplicateItem(operation.itemId, operation.offsetX, operation.offsetY);
          break;
        case "deleteItem":
          deleteItem(operation.itemId);
          break;
        case "saveAsTemplate":
          // Handled by useTemplates hook
          onToast?.("Use Save as Template from the right panel");
          break;
        case "promoteToVault":
          // Handled by useTemplates hook
          onToast?.("Use Promote to Vault from the right panel");
          break;
        default:
          console.warn("Unknown operation type:", operation);
      }
    },
    [
      updateItemArgs,
      updateItemStyleVars,
      swapComponent,
      createItem,
      duplicateItem,
      deleteItem,
      onToast,
    ]
  );

  return {
    updateItemArgs,
    updateItemStyleVars,
    swapComponent,
    createItem,
    duplicateItem,
    deleteItem,
    applyOperation,
    getItem,
  };
}
