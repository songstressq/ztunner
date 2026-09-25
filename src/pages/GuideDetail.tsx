import { useEffect, useState, useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import { getGuideBySlug, getGuideComponent } from "@/guides/_index";
import Footer from "@/components/Footer";
import GuideTOC, { TocItem } from "@/components/guides/GuideTOC";
import "@/styles/guides.css";

const GuideDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { homeSession } = useSession();
  const dominantTheme = homeSession.dominantTheme || "#7EFFDB";
  const [toc, setToc] = useState<TocItem[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const guide = slug ? getGuideBySlug(slug) : null;
  const GuideComponent = slug ? getGuideComponent(slug) : null;

  useEffect(() => {
    // Reset al cambiar de guía
    setToc([]);

    // Busca headings en el content
    const collectHeadings = () => {
      if (!contentRef.current) return false;
      const headings = Array.from(
        contentRef.current.querySelectorAll("h2, h3, h4, h5, h6"),
      );
      if (headings.length === 0) return false;

      setToc(
        headings.map((h) => ({
          id: h.id,
          text: h.textContent || "",
          level: Number(h.tagName[1]) as 2 | 3 | 4 | 5 | 6,
        })),
      );
      return true;
    };

    // Intento inmediato + reintento tras el paint del MDX
    if (collectHeadings()) return;
    const timer = setTimeout(() => collectHeadings(), 50);
    const timer2 = setTimeout(() => collectHeadings(), 250);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [slug, GuideComponent]);

  if (!guide || !GuideComponent) {
    return <Navigate to="/guides" replace />;
  }

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
        <div
          className="agents-wrapper guide-detail-wrapper"
          style={dominantEmptyStyle}
        >
          <div className="guide-detail-header">
            <Link to="/guides" className="guide-back-link">
              ←
            </Link>
            <h1 className="guide-detail-title">{guide.title}</h1>
            <div
              className="home_divider"
              style={{ backgroundColor: dominantTheme }}
            />
          </div>

          {guide.cover && (
            <div className="guide-cover">
              <img src={guide.cover} alt={guide.title} />
            </div>
          )}

          {guide.toc !== false && toc.length > 0 && (
            <GuideTOC items={toc} theme={dominantTheme} />
          )}
        </div>
      </div>
      <div className="agents-block">
        <div
          className="agents-wrapper guide-detail-wrapper"
          style={dominantEmptyStyle}
        >
          <div className="guide-mdx-content" ref={contentRef}>
            <GuideComponent />
          </div>

          {guide.tags.length > 0 && (
            <div className="guide-detail-tags">
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
          )}
        </div>
      </div>

      <div className="agents-block">
        <div className="main_footer-footer_block" style={dominantEmptyStyle}>
          <Footer theme={dominantTheme} />
        </div>
      </div>
    </div>
  );
};

export default GuideDetail;
