import { useRef, useEffect } from "react";
import { useSidebar } from "@/components/SidebarContext";

export interface ModalOption {
  id: string | number;
  name: string;
  img?: string;
}

export interface ModalSection {
  title: string;
  items: ModalOption[];
}

interface ModalSelectorProps {
  open: boolean;
  title: string;
  sections?: ModalSection[];
  options?: ModalOption[];
  onClose: () => void;
  onSelect: (id: string | number) => void;
  className?: string;
  theme?: string;
}

export default function ModalSelector({
  open,
  title,
  sections,
  options,
  onClose,
  onSelect,
  className = "",
  theme = "#36a9fc",
}: ModalSelectorProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const savedScroll = useRef<number>(0);

  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    if (isSidebarOpen && open) {
      onClose();
    }
  }, [isSidebarOpen, open, onClose]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = savedScroll.current;
    }
  }, [open]);

  return (
    <div
      className={`modal-overlay ${open ? "open" : "closed"} ${className}`}
      onClick={onClose}
    >
      <div
        className="modal-content-wrapper"
        style={{ border: `2px solid ${theme}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-header-title" style={{ color: theme }}>
            {title}
          </h3>
          <button onClick={onClose} className="modal-header-button">
            ✕
          </button>
        </div>

        <div className="modal-main_section" ref={scrollRef}>
          {sections
            ? sections.map((section, i) => (
                <div key={i} className="modal-main_section-divider">
                  <h4 className="modal-main_section-divider-title">
                    {section.title}
                  </h4>
                  <div className="modal-main_section-main_grid">
                    {section.items.map((opt) => (
                      <div
                        key={opt.id}
                        className="modal-main_section-card"
                        style={{ border: `2px solid ${theme}66` }}
                        onClick={() => onSelect(opt.id)}
                      >
                        {opt.img && (
                          <img
                            src={opt.img}
                            alt={opt.name}
                            className="modal-main_section-card-image"
                          />
                        )}
                        <p className="modal-main_section-card-name">
                          {opt.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : options && (
                <div className="modal-main_section-main_grid">
                  {options.map((opt) => (
                    <div
                      key={opt.id}
                      className="modal-main_section-card"
                      style={{ border: `2px solid ${theme}66` }}
                      onClick={() => onSelect(opt.id)}
                    >
                      {opt.img && (
                        <img
                          src={opt.img}
                          alt={opt.name}
                          className="modal-main_section-card-image"
                        />
                      )}
                      <p className="modal-main_section-card-name">{opt.name}</p>
                    </div>
                  ))}
                </div>
              )}
        </div>

        {/*<div className="modal-disc_importer-stat_row-footer">
          <button
            onClick={onClose}
            className="modal-disc_importer-stat_row-action-button"
            style={{ border: `1px solid ${theme}` }}
          >
            Close
          </button>
        </div>*/}
      </div>
    </div>
  );
}
