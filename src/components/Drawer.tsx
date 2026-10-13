"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop blur overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div
          className={`w-screen ${maxWidth} bg-[var(--panel)] border-l border-[var(--border)] shadow-2xl flex flex-col h-full transform transition-transform duration-200 ease-out`}
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--panel)] shrink-0">
            <div className="min-w-0 pr-4">
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text)] truncate">{title}</h2>
              {subtitle && <p className="text-[11px] text-[var(--muted)] mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>

          {/* Sticky Footer (if provided directly) */}
          {footer && (
            <div className="sticky bottom-0 z-20 px-5 py-3 border-t border-[var(--border)] bg-[var(--panel)] flex items-center justify-end gap-2 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

