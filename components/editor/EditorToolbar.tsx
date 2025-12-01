"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, useIsEditMode } from "@/store/editor-store";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginModal } from "@/components/auth/LoginModal";
import { signOut } from "@/lib/auth";

export function EditorToolbar() {
  const isEditMode = useIsEditMode();
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toggleEditMode } = useEditorStore();

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
      {/* Top-right buttons only */}
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
