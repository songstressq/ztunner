import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSidebar } from "./SidebarContext";
import "../styles/NeonSelect.css";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface NeonSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  theme?: string;
  variant?: "default" | "main" | "substat" | "skill" | "enemy";
  displayValue?: string;
}

export default function NeonSelect({
  value,
  options,
  onChange,
  theme = "#ffffff",
  variant = "default",
  displayValue,
}: NeonSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    if (isSidebarOpen && open) setOpen(false);
  }, [isSidebarOpen, open]);

  const toggleDropdown = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current!.getBoundingClientRect();
    setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  const triggerText =
    displayValue !== undefined
      ? displayValue
      : options.find((o) => o.value === value)?.label || value || "...";

  return (
    <div
      className="neon-select-wrapper"
      ref={wrapperRef}
      style={{ "--theme": theme } as React.CSSProperties}
    >
      <div className="neon-trigger" ref={triggerRef} onClick={toggleDropdown}>
        <span className="neon-trigger__text">{triggerText}</span>
      </div>
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`neon-dropdown neon-dropdown--${variant}`}
            style={
              {
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: coords.width,
                zIndex: 999999,
                "--theme": theme,
              } as React.CSSProperties
            }
            onWheel={(e) => e.stopPropagation()}
          >
            {options.length === 0 ? (
              <div className="neon-empty-message">No options available</div>
            ) : (
              options.map((opt, i) => (
                <div
                  key={`${opt.value}-${i}`}
                  className={`neon-option ${opt.disabled ? "neon-option--disabled" : `neon-option--${variant}`}`}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
