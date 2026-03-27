"use client";

import { ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
  fullScreenOnMobile?: boolean;
  contentClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

const SIZE_CLASSES = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-3xl",
} as const;

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  fullScreenOnMobile = false,
  contentClassName = "",
  bodyClassName = "",
  footerClassName = "",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className={[
        "fixed inset-0 z-[200] flex justify-center bg-black/50 backdrop-blur-sm animate-[toast-in_0.2s_ease] overflow-y-auto",
        fullScreenOnMobile ? "items-stretch sm:items-center" : "items-center p-4",
      ].join(" ")}
    >
      <div
        className={[
          "bg-surface border border-border shadow-raised w-full overflow-hidden flex flex-col",
          SIZE_CLASSES[size],
          fullScreenOnMobile
            ? "min-h-[100dvh] rounded-none sm:min-h-0 sm:rounded-panel sm:max-h-[calc(100dvh-3rem)]"
            : "rounded-panel max-h-[calc(100dvh-2rem)]",
          contentClassName,
        ].join(" ")}
      >
        {title && (
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-1">{title}</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-btn border border-border bg-surface-2 text-text-3 flex items-center justify-center hover:text-text-1 hover:border-border-hi transition-all cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className={["px-5 py-4 flex-1", bodyClassName].join(" ")}>{children}</div>
        {footer && (
          <div
            className={[
              "px-5 py-3 border-t border-border bg-surface-2 flex items-center justify-end gap-2",
              footerClassName,
            ].join(" ")}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
