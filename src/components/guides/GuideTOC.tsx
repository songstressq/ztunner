import { useState } from "react";

export interface TocItem {
  id: string;
  text: string;
  level?: 2 | 3 | 4 | 5 | 6;
}

interface Props {
  items: TocItem[];
  theme: string;
}

const GuideTOC = ({ items, theme }: Props) => {
  const [open, setOpen] = useState(true);

  if (items.length === 0) return null;

  return (
    <nav className="guide-toc" style={{ borderLeft: `2px solid ${theme}` }}>
      <button
        type="button"
        className="guide-toc-title"
        onClick={() => setOpen((o) => !o)}
        style={{ color: theme }}
      >
        <span className="guide-toc-arrow">{open ? "▾" : "▸"}</span>
        On this page
        <span className="guide-toc-count">({items.length})</span>
      </button>

      {open && (
        <ul className="guide-toc-list">
          {items.map((item, i) => (
            <li
              key={`${item.id}-${i}`}
              className={`guide-toc-item guide-toc-item--h${item.level ?? 2}`}
            >
              <a
                href={`#${item.id}`}
                className="guide-toc-link"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById(item.id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
};

export default GuideTOC;
