"use client";

import { useCallback, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// CONFIRM DIALOG - Styled replacement for native confirm()
// ═══════════════════════════════════════════════════════════════

export interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title = "Confirm",
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter") {
        onConfirm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="confirm-dialog">
      <div className="confirm-dialog__backdrop" onClick={onCancel} />
      <div className="confirm-dialog__content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__header">
          <h2
            className={`confirm-dialog__title ${variant === "danger" ? "confirm-dialog__title--danger" : ""}`}
          >
            {title}
          </h2>
          <button className="confirm-dialog__close" onClick={onCancel} title="Close">
            ×
          </button>
        </div>

        <p className="confirm-dialog__message">{message}</p>

        <div className="confirm-dialog__actions">
          <button className="confirm-dialog__btn confirm-dialog__btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`confirm-dialog__btn confirm-dialog__btn--confirm ${variant === "danger" ? "confirm-dialog__btn--danger" : ""}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [state, setState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "default" | "danger";
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    title: "Confirm",
    message: "",
    variant: "default",
    resolve: null,
  });

  const confirm = useCallback(
    (options: { title?: string; message: string; variant?: "default" | "danger" }) => {
      return new Promise<boolean>((resolve) => {
        setState({
          isOpen: true,
          title: options.title || "Confirm",
          message: options.message,
          variant: options.variant || "default",
          resolve,
        });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  const dialog = state.isOpen ? (
    <ConfirmDialog
      isOpen={state.isOpen}
      title={state.title}
      message={state.message}
      variant={state.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmLabel={state.variant === "danger" ? "Delete" : "OK"}
      cancelLabel="Cancel"
    />
  ) : null;

  return { confirm, dialog };
}

// Need to import useState for the hook
import { useState } from "react";
