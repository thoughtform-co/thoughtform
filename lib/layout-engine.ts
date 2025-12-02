// ═══════════════════════════════════════════════════════════════════
// LAYOUT ENGINE
// Alignment, distribution, and positioning utilities for the editor
// ═══════════════════════════════════════════════════════════════════

import type { 
  Element, 
  AlignmentType, 
  DistributeDirection, 
  Bounds 
} from "./types";

// ─────────────────────────────────────────────────────────────────
// BOUNDS CALCULATION
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate the bounding box of a single element
 */
export function getElementBounds(element: Element): Bounds {
  return {
    x: element.x,
    y: element.y,
    width: element.width ?? 0,
    height: element.height ?? 0,
  };
}

/**
 * Calculate the combined bounding box of multiple elements
 */
export function getCombinedBounds(elements: Element[]): Bounds {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const bounds = elements.map(getElementBounds);
  
  const minX = Math.min(...bounds.map((b) => b.x));
  const minY = Math.min(...bounds.map((b) => b.y));
  const maxX = Math.max(...bounds.map((b) => b.x + b.width));
  const maxY = Math.max(...bounds.map((b) => b.y + b.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// ─────────────────────────────────────────────────────────────────
// ALIGNMENT
// ─────────────────────────────────────────────────────────────────

export type AlignTo = "selection" | "section" | Bounds;

/**
 * Align elements to a specific alignment type within bounds
 * Returns new positions for each element
 */
export function alignElements(
  elements: Element[],
  alignment: AlignmentType,
  alignTo: AlignTo = "selection"
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  
  if (elements.length === 0) return result;

  // Determine the reference bounds
  let referenceBounds: Bounds;
  
  if (alignTo === "selection") {
    referenceBounds = getCombinedBounds(elements);
  } else if (alignTo === "section") {
    // When aligning to section, we need the section bounds passed in
    // For now, use a reasonable default (this should be passed from the component)
    referenceBounds = { x: 0, y: 0, width: 1200, height: 800 };
  } else {
    referenceBounds = alignTo;
  }

  for (const element of elements) {
    const elementBounds = getElementBounds(element);
    let newX = element.x;
    let newY = element.y;

    switch (alignment) {
      case "left":
        newX = referenceBounds.x;
        break;
      case "center":
        newX = referenceBounds.x + (referenceBounds.width - elementBounds.width) / 2;
        break;
      case "right":
        newX = referenceBounds.x + referenceBounds.width - elementBounds.width;
        break;
      case "top":
        newY = referenceBounds.y;
        break;
      case "middle":
        newY = referenceBounds.y + (referenceBounds.height - elementBounds.height) / 2;
        break;
      case "bottom":
        newY = referenceBounds.y + referenceBounds.height - elementBounds.height;
        break;
    }

    result.set(element.id, { x: Math.round(newX), y: Math.round(newY) });
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────
// DISTRIBUTION
// ─────────────────────────────────────────────────────────────────

/**
 * Distribute elements evenly in a direction
 * Returns new positions for each element
 */
export function distributeElements(
  elements: Element[],
  direction: DistributeDirection
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  
  if (elements.length < 3) {
    // Need at least 3 elements to distribute meaningfully
    elements.forEach((el) => result.set(el.id, { x: el.x, y: el.y }));
    return result;
  }

  // Sort elements by position
  const sortedElements = [...elements].sort((a, b) => {
    if (direction === "horizontal") {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  // Get the combined bounds
  const bounds = getCombinedBounds(elements);
  
  if (direction === "horizontal") {
    // Calculate total width of all elements
    const totalElementWidth = elements.reduce((sum, el) => sum + (el.width ?? 0), 0);
    // Calculate available space for gaps
    const availableSpace = bounds.width - totalElementWidth;
    // Calculate gap size
    const gap = availableSpace / (elements.length - 1);
    
    let currentX = bounds.x;
    for (const element of sortedElements) {
      result.set(element.id, { x: Math.round(currentX), y: element.y });
      currentX += (element.width ?? 0) + gap;
    }
  } else {
    // Calculate total height of all elements
    const totalElementHeight = elements.reduce((sum, el) => sum + (el.height ?? 0), 0);
    // Calculate available space for gaps
    const availableSpace = bounds.height - totalElementHeight;
    // Calculate gap size
    const gap = availableSpace / (elements.length - 1);
    
    let currentY = bounds.y;
    for (const element of sortedElements) {
      result.set(element.id, { x: element.x, y: Math.round(currentY) });
      currentY += (element.height ?? 0) + gap;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────────────────────────

/**
 * Set equal spacing between elements
 */
export function setEqualSpacing(
  elements: Element[],
  direction: DistributeDirection,
  spacing: number
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  
  if (elements.length < 2) {
    elements.forEach((el) => result.set(el.id, { x: el.x, y: el.y }));
    return result;
  }

  // Sort elements by position
  const sortedElements = [...elements].sort((a, b) => {
    if (direction === "horizontal") {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  // First element stays in place
  result.set(sortedElements[0].id, { 
    x: sortedElements[0].x, 
    y: sortedElements[0].y 
  });

  if (direction === "horizontal") {
    let currentX = sortedElements[0].x + (sortedElements[0].width ?? 0) + spacing;
    for (let i = 1; i < sortedElements.length; i++) {
      result.set(sortedElements[i].id, { 
        x: Math.round(currentX), 
        y: sortedElements[i].y 
      });
      currentX += (sortedElements[i].width ?? 0) + spacing;
    }
  } else {
    let currentY = sortedElements[0].y + (sortedElements[0].height ?? 0) + spacing;
    for (let i = 1; i < sortedElements.length; i++) {
      result.set(sortedElements[i].id, { 
        x: sortedElements[i].x, 
        y: Math.round(currentY) 
      });
      currentY += (sortedElements[i].height ?? 0) + spacing;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────
// SNAPPING
// ─────────────────────────────────────────────────────────────────

export interface SnapGuide {
  type: "vertical" | "horizontal";
  position: number;
  sourceId: string;
  targetId: string;
}

/**
 * Find snap guides for an element being dragged
 * Returns guides where the element could snap to other elements
 */
export function findSnapGuides(
  draggingElement: Element,
  otherElements: Element[],
  threshold: number = 8
): SnapGuide[] {
  const guides: SnapGuide[] = [];
  const dragBounds = getElementBounds(draggingElement);

  // Key positions for the dragging element
  const dragLeft = dragBounds.x;
  const dragRight = dragBounds.x + dragBounds.width;
  const dragCenterX = dragBounds.x + dragBounds.width / 2;
  const dragTop = dragBounds.y;
  const dragBottom = dragBounds.y + dragBounds.height;
  const dragCenterY = dragBounds.y + dragBounds.height / 2;

  for (const other of otherElements) {
    if (other.id === draggingElement.id) continue;

    const otherBounds = getElementBounds(other);
    
    // Key positions for the other element
    const otherLeft = otherBounds.x;
    const otherRight = otherBounds.x + otherBounds.width;
    const otherCenterX = otherBounds.x + otherBounds.width / 2;
    const otherTop = otherBounds.y;
    const otherBottom = otherBounds.y + otherBounds.height;
    const otherCenterY = otherBounds.y + otherBounds.height / 2;

    // Check vertical alignments (left, center, right edges)
    const verticalChecks = [
      { drag: dragLeft, other: otherLeft },
      { drag: dragLeft, other: otherRight },
      { drag: dragRight, other: otherLeft },
      { drag: dragRight, other: otherRight },
      { drag: dragCenterX, other: otherCenterX },
    ];

    for (const check of verticalChecks) {
      if (Math.abs(check.drag - check.other) <= threshold) {
        guides.push({
          type: "vertical",
          position: check.other,
          sourceId: draggingElement.id,
          targetId: other.id,
        });
      }
    }

    // Check horizontal alignments (top, center, bottom edges)
    const horizontalChecks = [
      { drag: dragTop, other: otherTop },
      { drag: dragTop, other: otherBottom },
      { drag: dragBottom, other: otherTop },
      { drag: dragBottom, other: otherBottom },
      { drag: dragCenterY, other: otherCenterY },
    ];

    for (const check of horizontalChecks) {
      if (Math.abs(check.drag - check.other) <= threshold) {
        guides.push({
          type: "horizontal",
          position: check.other,
          sourceId: draggingElement.id,
          targetId: other.id,
        });
      }
    }
  }

  return guides;
}

/**
 * Calculate snapped position based on guides
 */
export function getSnappedPosition(
  element: Element,
  guides: SnapGuide[]
): { x: number; y: number } {
  let x = element.x;
  let y = element.y;
  const bounds = getElementBounds(element);

  // Find the closest vertical guide
  const verticalGuide = guides.find((g) => g.type === "vertical");
  if (verticalGuide) {
    // Determine which edge is snapping
    const left = bounds.x;
    const right = bounds.x + bounds.width;
    const center = bounds.x + bounds.width / 2;

    const distToLeft = Math.abs(left - verticalGuide.position);
    const distToRight = Math.abs(right - verticalGuide.position);
    const distToCenter = Math.abs(center - verticalGuide.position);

    if (distToLeft <= distToRight && distToLeft <= distToCenter) {
      x = verticalGuide.position;
    } else if (distToRight <= distToCenter) {
      x = verticalGuide.position - bounds.width;
    } else {
      x = verticalGuide.position - bounds.width / 2;
    }
  }

  // Find the closest horizontal guide
  const horizontalGuide = guides.find((g) => g.type === "horizontal");
  if (horizontalGuide) {
    const top = bounds.y;
    const bottom = bounds.y + bounds.height;
    const center = bounds.y + bounds.height / 2;

    const distToTop = Math.abs(top - horizontalGuide.position);
    const distToBottom = Math.abs(bottom - horizontalGuide.position);
    const distToCenter = Math.abs(center - horizontalGuide.position);

    if (distToTop <= distToBottom && distToTop <= distToCenter) {
      y = horizontalGuide.position;
    } else if (distToBottom <= distToCenter) {
      y = horizontalGuide.position - bounds.height;
    } else {
      y = horizontalGuide.position - bounds.height / 2;
    }
  }

  return { x: Math.round(x), y: Math.round(y) };
}

// ─────────────────────────────────────────────────────────────────
// FLOW LAYOUT
// ─────────────────────────────────────────────────────────────────

export type FlowDirection = "row" | "column";

export interface FlowLayoutOptions {
  direction: FlowDirection;
  gap: number;
  startX: number;
  startY: number;
  wrap?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Calculate flow layout positions for elements
 */
export function calculateFlowLayout(
  elements: Element[],
  options: FlowLayoutOptions
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  
  if (elements.length === 0) return result;

  const { direction, gap, startX, startY, wrap, maxWidth, maxHeight } = options;

  let currentX = startX;
  let currentY = startY;
  let rowHeight = 0;
  let colWidth = 0;

  for (const element of elements) {
    const width = element.width ?? 0;
    const height = element.height ?? 0;

    if (direction === "row") {
      // Check if we need to wrap
      if (wrap && maxWidth && currentX + width > startX + maxWidth && currentX !== startX) {
        currentX = startX;
        currentY += rowHeight + gap;
        rowHeight = 0;
      }

      result.set(element.id, { x: currentX, y: currentY });
      currentX += width + gap;
      rowHeight = Math.max(rowHeight, height);
    } else {
      // Check if we need to wrap
      if (wrap && maxHeight && currentY + height > startY + maxHeight && currentY !== startY) {
        currentY = startY;
        currentX += colWidth + gap;
        colWidth = 0;
      }

      result.set(element.id, { x: currentX, y: currentY });
      currentY += height + gap;
      colWidth = Math.max(colWidth, width);
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────
// CENTERING
// ─────────────────────────────────────────────────────────────────

/**
 * Center elements within bounds
 */
export function centerElements(
  elements: Element[],
  bounds: Bounds
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  
  if (elements.length === 0) return result;

  const combinedBounds = getCombinedBounds(elements);
  
  // Calculate offset to center the group
  const offsetX = bounds.x + (bounds.width - combinedBounds.width) / 2 - combinedBounds.x;
  const offsetY = bounds.y + (bounds.height - combinedBounds.height) / 2 - combinedBounds.y;

  for (const element of elements) {
    result.set(element.id, {
      x: Math.round(element.x + offsetX),
      y: Math.round(element.y + offsetY),
    });
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────
// UTILITY EXPORTS
// ─────────────────────────────────────────────────────────────────

export const layoutEngine = {
  getElementBounds,
  getCombinedBounds,
  alignElements,
  distributeElements,
  setEqualSpacing,
  findSnapGuides,
  getSnappedPosition,
  calculateFlowLayout,
  centerElements,
};

export default layoutEngine;

