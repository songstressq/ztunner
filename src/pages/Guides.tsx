import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import { getAllGuides } from "@/guides/_index";
import Footer from "@/components/Footer";
import "@/styles/guides.css";

const Guides = () => {
  const { homeSession } = useSession();
  const dominantTheme = homeSession.dominantTheme || "#7EFFDB";
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");

  const guides = useMemo(() => getAllGuides(), []);
  const allTags = useMemo(
    () => Array.from(new Set(guides.flatMap((g) => g.tags))),
    [guides],
  );

  const filtered = useMemo(() => {
    return guides
      .filter((g) => {
        if (filterTag !== "all" && !g.tags.includes(filterTag)) return false;
        if (searchTerm) {
          const t = searchTerm.toLowerCase();
          return (
            g.title.toLowerCase().includes(t) ||
            g.description.toLowerCase().includes(t) ||
            g.tags.some((tag) => tag.toLowerCase().includes(t))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "title") return a.title.localeCompare(b.title);
        const da = +new Date(a.date);
        const db = +new Date(b.date);
        return sortBy === "newest" ? db - da : da - db;
      });
  }, [guides, filterTag, searchTerm, sortBy]);

  const dominantEmptyStyle = {
    backgroundImage: `linear-gradient(to right bottom, ${dominantTheme}11, ${dominantTheme}22, ${dominantTheme}55, ${dominantTheme}22, ${dominantTheme}11)`,
  };

  return (
    <div
      className="agents-page-wrapper"
      style={
        {
          "--theme": dominantTheme,
          "--dominant-theme": dominantTheme,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        } as React.CSSProperties
      }
    >
      <div className="agents-block">
        <div className="agents-wrapper" style={dominantEmptyStyle}>
          <h1 className="home_content-title_h1">Z-Tunner: Guides</h1>
          <div
            className="home_divider"
            style={{ backgroundColor: dominantTheme }}
          />
          <p className="agents-stats-description">
            In-depth guides about ZZZ mechanics, damage formulas, and build
            strategies.
          </p>
        </div>
      </div>

      {/* Filtros (mismas clases que BuildManager) */}
      <div className="agents-block">
        <div className="agents-wrapper" style={dominantEmptyStyle}>
          <div className="agents-filters-grid">
            <div className="agents-filter-group">
              <label>Search Guides:</label>
              <input
                type="text"
                placeholder="Search by title, tag, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="agents-search-input"
              />
            </div>
            <div className="agents-filter-group">
              <label>Filter by Tag:</label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="agents-search-input"
              >
                <option value="all">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <div className="agents-filter-group">
              <label>Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="agents-search-input"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>
          <div className="agents-filter-count">
            Showing {filtered.length} of {guides.length} guides
          </div>
        </div>
      </div>

      {/* Grid de tarjetas */}
      {filtered.length === 0 ? (
        <div className="agents-block">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div className="agents-empty">
              <h3 className="agents-empty-title">
                No guides match your filters
              </h3>
              <p className="agents-empty-text">Try different search terms.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="guides-grid">
          {filtered.map((guide) => (
            <Link
              key={guide.slug}
              to={`/guides/${guide.slug}`}
              className="agents-block guide-card-link"
              style={{ marginBottom: 0 }}
            >
              <div
                className="agents-wrapper"
                style={
                  {
                    ...dominantEmptyStyle,
                    "--theme": dominantTheme,
                  } as React.CSSProperties
                }
              >
                <div className="guide-card-content">
                  <h3 className="guide-card-title">{guide.title}</h3>
                  <p className="guide-card-description">{guide.description}</p>
                  <div className="guide-card-tags">
                    {guide.tags.map((tag) => (
                      <span
                        key={tag}
                        className="guide-card-tag"
                        style={{
                          borderColor: `${dominantTheme}55`,
                          color: dominantTheme,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="guide-card-footer">
                    {new Date(guide.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="agents-block">
        <div className="main_footer-footer_block" style={dominantEmptyStyle}>
          <Footer theme={dominantTheme} />
        </div>
      </div>
    </div>
  );
};

export default Guides;
