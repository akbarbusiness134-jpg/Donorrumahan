import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  animation?: "zoom" | "slide-up";
  fullScreen?: boolean;
  closeOnOutsideClick?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

// Global tracking to make history pushState and back navigation safe from React 18 StrictMode double-mounting
let activeModalCount = 0;
let pushedStateCount = 0;
let pendingBackTimeout: number | null = null;

import { createPortal } from "react-dom";

export function Modal({ title, subtitle, onClose, children, maxWidth = "md", animation = "zoom", fullScreen = false, closeOnOutsideClick = false }: ModalProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    activeModalCount++;

    // Lock body and html scroll and save original styles
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Cancel any pending back navigation because a modal is mounting/still active
    if (pendingBackTimeout !== null) {
      window.clearTimeout(pendingBackTimeout);
      pendingBackTimeout = null;
    }

    // Push history state if we don't have one pushed yet for the current modal session
    if (pushedStateCount === 0) {
      window.history.pushState({ modalOpen: true }, "");
      pushedStateCount = 1;
    }

    const handlePopState = () => {
      pushedStateCount = 0;
      onCloseRef.current();
    };

    const handleHashChange = () => {
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      activeModalCount--;
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handleHashChange);

      // Restore scroll only if no other modals are active
      if (activeModalCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      }

      // Delay the back navigation to let StrictMode settle
      if (activeModalCount === 0 && pushedStateCount > 0) {
        pendingBackTimeout = window.setTimeout(() => {
          pendingBackTimeout = null;
          if (pushedStateCount > 0) {
            pushedStateCount = 0;
            window.history.back();
          }
        }, 50);
      }
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div 
      className={
        fullScreen 
          ? "fixed inset-0 z-40 bg-background overflow-y-auto animate-slide-up-fullscreen transform-gpu"
          : `fixed inset-0 transition-opacity duration-200 z-[100] grid place-items-center bg-ink/45 backdrop-blur-[2px] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200`
      }
      onClick={closeOnOutsideClick && !fullScreen ? onClose : undefined}
    >
      <div
        onClick={(e) => {
          if (closeOnOutsideClick && !fullScreen) e.stopPropagation();
        }}
        className={
          fullScreen
            ? `mx-auto ${maxWidthClasses[maxWidth]} w-full pt-[112px] md:pt-[140px] lg:pt-[160px] px-5 lg:px-8 pb-16`
            : `w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 md:p-8 shadow-2xl animate-in fade-in ${
                animation === "zoom" ? "zoom-in-95" : "slide-in-from-bottom-12"
              } duration-200 transform-gpu`
        }
      >
        <div className={fullScreen ? "flex items-start justify-between border-b border-border/60 pb-5 mb-8" : "flex items-start justify-between"}>
          <div className="min-w-0 flex-1">
            {subtitle && (
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{subtitle}</p>
            )}
            <h2 className={`font-display text-ink font-bold ${
              fullScreen ? "text-2xl sm:text-3xl lg:text-4xl mt-2 font-extrabold leading-tight" : `text-2xl ${subtitle ? "mt-1" : ""}`
            }`}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className={
              fullScreen
                ? "text-muted-foreground hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/15 p-2 rounded-full transition-colors duration-200 active:scale-95 shrink-0 ml-4"
                : "text-muted-foreground hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/15 p-1.5 rounded-full transition-colors duration-200 active:scale-95 shrink-0"
            }
            aria-label={fullScreen ? "Tutup" : "Close"}
          >
            <X className={fullScreen ? "h-5 w-5" : "h-4.5 w-4.5"} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
