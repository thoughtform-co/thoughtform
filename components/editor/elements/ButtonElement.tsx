"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { Element, ButtonContent } from "@/lib/types";

interface ButtonElementProps {
  element: Element;
  isEditing: boolean;
}

export function ButtonElement({ element, isEditing }: ButtonElementProps) {
  const content = element.content as ButtonContent;
  
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center",
        isEditing && "pointer-events-none"
      )}
      style={{
        opacity: element.opacity ?? 1,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      }}
    >
      <Button
        variant={content.variant === "outline" ? "ghost" : content.variant}
        className={cn(
          content.size === "sm" && "text-xs px-3 py-1.5",
          content.size === "lg" && "text-base px-6 py-3",
          element.borderRadius && `rounded-[${element.borderRadius}px]`
        )}
        style={{
          borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
        }}
      >
        {content.text || "BUTTON"}
      </Button>
    </div>
  );
}

export default ButtonElement;

