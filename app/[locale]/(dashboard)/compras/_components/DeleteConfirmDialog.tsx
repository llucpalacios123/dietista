"use client";

import { useEffect, useCallback } from "react";

/* ---------- props ---------- */

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/* ---------- component ---------- */

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
}: DeleteConfirmDialogProps): React.ReactElement {
  const handleEsc = useCallback(
    (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEsc]);

  if (!isOpen) return <></>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog card */}
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-6 shadow-xl">
        <h3 className="text-base font-semibold text-[var(--dietista-text)]">
          {title}
        </h3>
        <p className="mt-2 text-sm text-[var(--dietista-text-2)]">{message}</p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-4 py-2 text-sm font-medium text-[var(--dietista-text)] transition-colors hover:bg-[var(--dietista-surface-2)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-md bg-[var(--dietista-danger)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
