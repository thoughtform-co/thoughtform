"use client";

import { useEffect, useState } from "react";

interface StatusBarProps {
  toast: string | null;
  onToastHide?: () => void;
}

export function StatusBar({ toast, onToastHide }: StatusBarProps) {
  const [saveIconVisible, setSaveIconVisible] = useState(false);
  const [saveIconAnimating, setSaveIconAnimating] = useState(false);

  // Detect save actions from toast messages
  useEffect(() => {
    if (
      toast &&
      (toast === "Saved" ||
        toast === "Preset saved" ||
        (toast.includes("Saved") && !toast.includes("Failed")))
    ) {
      setSaveIconVisible(true);
      setSaveIconAnimating(true);

      // Hide animation after brief moment
      const timer = setTimeout(() => {
        setSaveIconAnimating(false);
      }, 300);

      // Fade out save icon after 2 seconds
      const hideTimer = setTimeout(() => {
        setSaveIconVisible(false);
      }, 2000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [toast]);

  // Auto-hide toast
  useEffect(() => {
    if (toast && onToastHide) {
      const timer = setTimeout(() => {
        onToastHide();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast, onToastHide]);

  return (
    <div className="status-bar">
      {/* Save Icon */}
      {saveIconVisible && (
        <div
          className={`status-bar__save-icon ${saveIconAnimating ? "animating" : ""} visible`}
          title="Saved"
        >
          <span className="status-bar__save-icon-symbol">✓</span>
        </div>
      )}

      {/* Separator */}
      {saveIconVisible && toast && <span className="status-bar__separator">·</span>}

      {/* Toast Message */}
      {toast && (
        <div className="status-bar__toast">
          <span className="status-bar__toast-text">{toast}</span>
        </div>
      )}
    </div>
  );
}
