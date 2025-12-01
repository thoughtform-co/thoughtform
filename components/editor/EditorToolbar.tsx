"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, useIsEditMode } from "@/store/editor-store";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginModal } from "@/components/auth/LoginModal";
import { signOut } from "@/lib/auth";
import { GRID_SIZES, type ElementType } from "@/lib/types";

export function EditorToolbar() {
  const isEditMode = useIsEditMode();
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const {
    toggleEditMode,
    selectedSectionId,
    addElement,
    gridSize,
    setGridSize,
    showGrid,
    toggleGrid,
  } = useEditorStore();

  const handleAddElement = (type: ElementType) => {
    if (!selectedSectionId) {
      alert("Please select a section first");
      return;
    }
    addElement(selectedSectionId, type);
  };

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData("elementType", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleEditClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    toggleEditMode();
  };

  const handleLogout = async () => {
    await signOut();
    if (isEditMode) {
      toggleEditMode();
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-4 right-4 z-[60]",
          "flex flex-col gap-2"
        )}
      >
        {/* User status & Edit Mode Toggle */}
        <div className="flex gap-2">
          {user && (
            <button
              onClick={handleLogout}
              className={cn(
                "px-3 py-2",
                "font-mono text-2xs uppercase tracking-wider",
                "bg-void/90 backdrop-blur-xl border border-dawn-15",
                "text-dawn-30 hover:text-dawn hover:border-dawn-30",
                "transition-colors"
              )}
              title={user.email || "Signed in"}
            >
              Sign Out
            </button>
          )}
          <button
            onClick={handleEditClick}
            className={cn(
              "px-4 py-2",
              "font-mono text-2xs uppercase tracking-wider",
              "border transition-colors",
              isEditMode
                ? "bg-gold text-void border-gold hover:bg-gold-70"
                : "bg-void/90 backdrop-blur-xl text-dawn-50 border-dawn-15 hover:text-dawn hover:border-dawn-30"
            )}
          >
            {isEditMode ? "Exit Edit" : user ? "Edit Page" : "Sign In"}
          </button>
        </div>

        {/* Edit Mode Tools */}
        {isEditMode && user && (
          <div className="flex flex-col gap-2">
            {/* Element tools */}
            <div className="bg-void/90 backdrop-blur-xl border border-dawn-08 p-3">
              <div className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-3">
                Add Elements
              </div>
              <div className="flex flex-col gap-2">
                <button
                  draggable
                  onDragStart={(e) => handleDragStart(e, "text")}
                  onClick={() => handleAddElement("text")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2",
                    "bg-surface-1 border border-dawn-08",
                    "font-mono text-xs text-dawn-70",
                    "hover:border-dawn-15 hover:text-dawn transition-colors",
                    "cursor-grab active:cursor-grabbing"
                  )}
                >
                  <span className="text-gold">T</span>
                  Text
                </button>
                <button
                  draggable
                  onDragStart={(e) => handleDragStart(e, "image")}
                  onClick={() => handleAddElement("image")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2",
                    "bg-surface-1 border border-dawn-08",
                    "font-mono text-xs text-dawn-70",
                    "hover:border-dawn-15 hover:text-dawn transition-colors",
                    "cursor-grab active:cursor-grabbing"
                  )}
                >
                  <span className="text-gold">▣</span>
                  Image
                </button>
                <button
                  draggable
                  onDragStart={(e) => handleDragStart(e, "video")}
                  onClick={() => handleAddElement("video")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2",
                    "bg-surface-1 border border-dawn-08",
                    "font-mono text-xs text-dawn-70",
                    "hover:border-dawn-15 hover:text-dawn transition-colors",
                    "cursor-grab active:cursor-grabbing"
                  )}
                >
                  <span className="text-gold">▶</span>
                  Video
                </button>
              </div>
            </div>

            {/* Grid settings */}
            <div className="bg-void/90 backdrop-blur-xl border border-dawn-08 p-3">
              <div className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-3">
                Grid
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={toggleGrid}
                  className={cn(
                    "flex items-center justify-between px-3 py-2",
                    "bg-surface-1 border border-dawn-08",
                    "font-mono text-xs text-dawn-70",
                    "hover:border-dawn-15 transition-colors"
                  )}
                >
                  <span>Show Grid</span>
                  <span className={showGrid ? "text-gold" : "text-dawn-30"}>
                    {showGrid ? "ON" : "OFF"}
                  </span>
                </button>
                <div className="flex gap-1">
                  {GRID_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setGridSize(size)}
                      className={cn(
                        "flex-1 px-2 py-1.5",
                        "font-mono text-2xs",
                        "border transition-colors",
                        gridSize === size
                          ? "bg-gold text-void border-gold"
                          : "bg-surface-1 text-dawn-50 border-dawn-08 hover:border-dawn-15"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* User info */}
            <div className="bg-void/90 backdrop-blur-xl border border-dawn-08 p-3 text-center">
              <div className="font-mono text-2xs text-dawn-30 truncate">
                {user.email}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          toggleEditMode();
        }}
      />
    </>
  );
}
