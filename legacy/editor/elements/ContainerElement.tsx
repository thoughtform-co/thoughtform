"use client";

import { cn } from "@/lib/utils";
import type { Element, ContainerContent } from "@/lib/types";

interface ContainerElementProps {
  element: Element;
  isEditing: boolean;
}

export function ContainerElement({ element, isEditing }: ContainerElementProps) {
  const content = element.content as ContainerContent;
  const padding = element.padding ?? content.padding;

  return (
    <div
      className={cn(
        "w-full h-full",
        "border border-dashed",
        isEditing ? "border-cyan-400/50 bg-cyan-400/5" : "border-transparent"
      )}
      style={{
        opacity: element.opacity ?? 1,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
        borderWidth: element.borderWidth ?? 1,
        borderColor: isEditing ? undefined : (element.borderColor ?? "transparent"),
        paddingTop: padding?.top ?? 0,
        paddingRight: padding?.right ?? 0,
        paddingBottom: padding?.bottom ?? 0,
        paddingLeft: padding?.left ?? 0,
        display: "flex",
        flexDirection: content.direction ?? "column",
        alignItems: content.alignItems ?? "start",
        justifyContent:
          content.justifyContent === "between"
            ? "space-between"
            : content.justifyContent === "around"
              ? "space-around"
              : `flex-${content.justifyContent ?? "start"}`,
        gap: element.gap ?? content.gap ?? 0,
      }}
    >
      {/* Container children are rendered by DraggableElement based on content.children */}
      {isEditing && content.children?.length === 0 && (
        <div className="w-full h-full flex items-center justify-center pointer-events-none">
          <span className="font-mono text-2xs text-cyan-400/50 uppercase tracking-widest">
            Container
          </span>
        </div>
      )}
    </div>
  );
}

export default ContainerElement;
