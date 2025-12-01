"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, useIsEditMode } from "@/store/editor-store";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginModal } from "@/components/auth/LoginModal";
import { signOut } from "@/lib/auth";

export function EditorToolbar() {
  const isEditMode = useIsEditMode();
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toggleEditMode, undo, redo, canUndo, canRedo } = useEditorStore();
  
  // Force re-render when history changes
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe(() => {
      forceUpdate((n) => n + 1);
    });
    return unsubscribe;
  }, []);

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

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    if (!isEditMode) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, undo, redo]);

  return (
    <>
      {/* Undo/Redo - Below nav bar, center (only in edit mode) */}
      {isEditMode && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] flex gap-1">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={cn(
              "px-3 py-2",
              "font-mono text-sm",
              "bg-void/90 backdrop-blur-xl border",
              "transition-colors",
              canUndo()
                ? "text-dawn border-dawn/30 hover:border-dawn hover:bg-dawn/10"
                : "text-dawn-30 border-dawn-15 cursor-not-allowed opacity-50"
            )}
            title="Undo (Ctrl+Z)"
          >
            ↩
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className={cn(
              "px-3 py-2",
              "font-mono text-sm",
              "bg-void/90 backdrop-blur-xl border",
              "transition-colors",
              canRedo()
                ? "text-gold border-gold/30 hover:border-gold hover:bg-gold/10"
                : "text-dawn-30 border-dawn-15 cursor-not-allowed opacity-50"
            )}
            title="Redo (Ctrl+Shift+Z)"
          >
            ↪
          </button>
        </div>
      )}

      {/* Top-right buttons */}
      <div className="fixed top-4 right-4 z-[70] flex gap-2">
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
