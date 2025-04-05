import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type InfoPopupSize = "default" | "small";

interface InfoPopupProps {
  content: string;
  size?: InfoPopupSize;
  className?: string;
}

export default function InfoPopup({ content, size = "default", className = "" }: InfoPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    // Stop event propagation to prevent parent click events from firing
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        onMouseDown={e => e.stopPropagation()}
        className={`inline-flex items-center justify-center stroke-foreground/50 hover:stroke-foreground transition-colors cursor-pointer translate-y-0.5 ${className}`}
        aria-label="More information"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size === "small" ? "18" : "22"}
          height={size === "small" ? "18" : "22"}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={size === "small" ? "1.75" : "2"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              top: triggerRef.current
                ? triggerRef.current.getBoundingClientRect().bottom + (size === "small" ? 6 : 8)
                : 0,
              left: triggerRef.current ? triggerRef.current.getBoundingClientRect().left : 0,
            }}
            className={`fixed z-50 bg-background border border-foreground/20 rounded-lg shadow-lg ${size === "small" ? "p-3 max-w-xs" : "p-4 max-w-sm"} text-foreground/80 ${size === "small" ? "text-xs" : "text-sm"}`}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
