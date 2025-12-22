"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import type { Element, TextContent } from "@/lib/types";

interface TextElementProps {
  element: Element;
  isEditing: boolean;
}

export function TextElement({ element, isEditing }: TextElementProps) {
  const { updateElement } = useEditorStore();
  const content = element.content as TextContent;
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing...",
      }),
    ],
    content: content.html || "<p>Click to edit text</p>",
    editable: isEditing,
    onUpdate: ({ editor }) => {
      const newContent: TextContent = {
        ...content,
        html: editor.getHTML(),
      };
      updateElement(element.id, { content: newContent });
    },
  });

  // Update editable state when isEditing changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
      if (isEditing) {
        editor.commands.focus("end");
      }
    }
  }, [editor, isEditing]);

  // Map font family
  const fontClass = content.fontFamily === "mono" ? "font-mono" : "font-sans";

  // Map color
  const colorClass = content.color?.startsWith("dawn")
    ? `text-${content.color}`
    : content.color?.startsWith("gold")
      ? `text-${content.color}`
      : "text-dawn-70";

  return (
    <div
      ref={editorRef}
      className={cn(
        "w-full h-full min-h-[1em]",
        fontClass,
        colorClass,
        isEditing && "outline-none ring-1 ring-gold/30"
      )}
      style={{
        fontSize: content.fontSize || 16,
        textAlign: content.textAlign || "left",
      }}
    >
      <EditorContent editor={editor} className="tiptap-editor w-full h-full" />
    </div>
  );
}
