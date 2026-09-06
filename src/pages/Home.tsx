import React, { useState, useEffect, useCallback, useMemo } from "react";
import "../styles/other.css";
import TypingAnimation from "../components/TypingAnimation";
import { useSession } from "@/context/SessionContext";
import { agents } from "@/data/agents"; // 👈 Importar agents

const Home = () => {
  const { homeSession } = useSession();
  const dominantTheme = homeSession.dominantTheme || "#7EFFDB";

  const [showSubtitle, setShowSubtitle] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Obtener el agente que coincide con dominantTheme
  const dominantAgent = useMemo(() => {
    return agents.find((a) => a.themeColor === dominantTheme) || null;
  }, [dominantTheme]);

  // Construir la ruta de la imagen
  const imageUrl = useMemo(() => {
    if (dominantAgent && !imageError) {
      return `/ztunner/resources/images/agents/mindscape/${dominantAgent.id}_mindscape.png`;
    }
    // Fallback: imagen por defecto (puedes usar una imagen genérica)
    return ""; // o "/ztunner/resources/images/agents/mindscape/default_mindscape.png"
  }, [dominantAgent, imageError]);

  const shouldShowImage = !!imageUrl && !imageError;

  const onTitleComplete = useCallback(() => {
    setShowSubtitle(true);
  }, []);

  const onSubtitleComplete = useCallback(() => {
    setTypingComplete(true);
  }, []);

  const dominantEmptyStyle = {
    backgroundImage: `linear-gradient(to right bottom, ${dominantTheme}11, ${dominantTheme}22, ${dominantTheme}55, ${dominantTheme}22, ${dominantTheme}11)`,
  };

  // Render de la barra de progreso
  const renderProgressBar = (
    percentage: number,
    color: string = dominantTheme,
  ) => {
    const clamped = Math.min(100, Math.max(0, percentage));
    return (
      <div className="progress_bar-main_wrapper">
        <div
          className="progress_bar-progress_color"
          style={{
            width: `${clamped}%`,
            background: `radial-gradient(circle at 30% 30%, ${color}, ${color}88)`,
            boxShadow: `0 0 10px ${color}44`,
          }}
        >
          <div className="progress_bar-progress_effect" />
        </div>
      </div>
    );
  };

  return (
    <div
      style={
        {
          "--dominant-theme": dominantTheme,
          minHeight: "100vh",
        } as React.CSSProperties
      }
    >
      {/* HERO */}
      <div className="home-container">
        {shouldShowImage ? (
          <img
            src={imageUrl}
            alt={`${dominantAgent?.displayName || "Agent"} Mindscape`}
            className="home-background-img"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="home-background"
            style={{ backgroundColor: "#0a0a0a" }}
          />
        )}
        <div className="home-overlay" />
        <div className="home-content">
          <div className="home-title">
            <TypingAnimation
              key="title"
              text="Z-TUNNER"
              speed={175}
              onComplete={onTitleComplete}
            />
            {!showSubtitle && <span className="home-cursor" />}
          </div>
          {showSubtitle && (
            <div className="home-subtitle">
              <TypingAnimation
                key="subtitle"
                text="ZZZ Damage Calculator & Build Manager"
                speed={80}
                onComplete={onSubtitleComplete}
              />
              <span className="home-cursor" />
            </div>
          )}
        </div>
      </div>

      <div className="home_content-main_wrapper">
        {/* BLOQUES DE CONTENIDO ADICIONAL */}
        <div className="agents-block home_content-header">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div>
              <h1 className="home_content-title_h1">
                Z-Tunner: ZZZ Damage Calculator
              </h1>
              <div
                className="home_divider"
                style={{ backgroundColor: dominantTheme }}
              />
              <p className="home_content-text_h1">
                A{" "}
                <strong className="home_content-text_strong">
                  ZZZ Damage Calculator
                </strong>{" "}
                for testing builds, team compositions, and combat scenarios in
                Zenless Zone Zero. Check your agents' overall damage potential,
                see how stats, skills, and different buffs impact your scores,
                and optimize your team for the highest possible damage output —{" "}
                <strong className="home_content-text_strong">
                  right here on Z-Tunner.
                </strong>
              </p>
            </div>
          </div>
        </div>
        <div className="agents-block important_notice">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div
              className="important_notice-msg"
              style={{ marginBottom: "10px" }}
            >
              🚨 I'm still setting up this page, so if u happen to be here
              early, don't mind any slow-loading or temporarily disabled
              sections for now! 😫
            </div>
            <div className="important_notice-msg">
              🚨 Both Claret and the new Armorer Specialty will be added once I
              figure out the Laceration DMG math after the patch update (if i
              win her 50/50 it'll be sooner 😝).
            </div>
          </div>
        </div>
        <div className="agents-block home_content-changelog">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div>
              <h2 className="home_content-title_h2">Z-TUNNER Latest Updates</h2>
              <div
                className="home_divider"
                style={{ backgroundColor: dominantTheme }}
              />
              <div className="home_content_changelog_item">
                <span>v1.0.0 — Initial Release</span>

                <h4>● Added ZZZ Damage Calculator </h4>
                <p>
                  Added damage calculations for Normal and CRIT DMG, Sheer DMG,
                  Aftershock DMG, Anomaly DMG, Disorder DMG, and Vortex DMG.
                </p>
                <h4>● Added ZZZ Build Creator &amp; Build Manager</h4>
                <p>
                  Introduces sections for replicating your agents' in-game
                  builds for later use in damage calculations.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="agents-block home_content-trailer">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div>
              <h2 className="home_content-title_h2">ZZZ Latest Trailer</h2>
              <div
                className="home_divider"
                style={{ backgroundColor: dominantTheme }}
              />
              <iframe
                className="home_content-trailer_video"
                width="100%"
                src="https://www.youtube.com/embed/4O-Iq8lj9_k"
                title="Zenless Zone Zero Version 3.2 Teaser - Their Secret Histories"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
        <div className="agents-block home_content-to_do_list">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div>
              <h2 className="home_content-title_h2">
                Z-TUNNER UPCOMING FEATURES
              </h2>
              <div
                className="home_divider"
                style={{ backgroundColor: dominantTheme }}
              />
              <div className="home_content-features_grid">
                <div className="home_content-features_card">
                  <h3>🅾 Drive Disc Inventory</h3>
                  <p>
                    Create and name drive discs for easier organization and
                    reuse when creating and managing your agents' builds.
                  </p>
                  <div className="home_content-progress_bar">
                    {renderProgressBar(80)}
                    <span>80%</span>
                  </div>
                </div>
                <div className="home_content-features_card">
                  <h3>🅾 ZZZ Daze Calculator</h3>
                  <p>
                    Implement Daze and Impact calculations in the Damage
                    Calculator, and maybe support for other Stun-related
                    mechanics.
                  </p>
                  <div className="home_content-progress_bar">
                    {renderProgressBar(5)}
                    <span>5%</span>
                  </div>{" "}
                </div>{" "}
                <div className="home_content-features_card">
                  <h3>🅾 Abloom DMG</h3>
                  <p>
                    Implement Abloom DMG calculations in the Damage Calculator,
                    including support for its unique mechanics and effects.
                  </p>
                  <div className="home_content-progress_bar">
                    {renderProgressBar(0)}
                    <span>0%</span>
                  </div>{" "}
                </div>{" "}
                <div className="home_content-features_card">
                  <h3>🅾 Low-Spec Mode</h3>
                  <p>
                    Optimize Z-Tunner for better performance on lower-spec and
                    mobile devices, improving responsiveness and reducing
                    resource usage.
                  </p>
                  <div className="home_content-progress_bar">
                    {renderProgressBar(25)}
                    <span>25%</span>
                  </div>{" "}
                </div>{" "}
              </div>
            </div>
          </div>
        </div>
        <div className="agents-block home_content-patch_overview">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div>
              <h2 className="home_content-title_h2">
                <span className="title_dot">⏺</span> Zenless Zone Zero: Version
                3.1 — The Long Goodbye
              </h2>

              <div
                className="home_divider"
                style={{ backgroundColor: dominantTheme }}
              />

              <div className="home_content-patch_main_grid">
                {/* New Agents */}
                <div className="home_content-single_card">
                  <h4>New Agents</h4>
                  <div className="home_content-card_section order_2">
                    <div className="home_content-agent_image">
                      <div className="home_content-agent_icons">
                        <img
                          src="/ztunner/resources/images/icons/attributes/Lumiflux.png"
                          alt="Lumiflux"
                          className="remielle_icons"
                        />
                        <img
                          src="/ztunner/resources/images/icons/specialties/Anomaly.png"
                          alt="Anomaly"
                          className="remielle_icons"
                        />
                      </div>
                      <img
                        src="/ztunner/resources/images/agents/other/remielle.png"
                        alt="Remielle Dan"
                        className="remielle_img"
                      />
                    </div>
                    <p className="remielle_name">Remielle Dan</p>
                  </div>
                  <div className="home_content-card_section order_3">
                    <div className="home_content-agent_image">
                      <div className="home_content-agent_icons">
                        <img
                          src="/ztunner/resources/images/icons/attributes/Ice.png"
                          alt="Ice"
                          className="sigrid_icons"
                        />
                        <img
                          src="/ztunner/resources/images/icons/specialties/Attack.png"
                          alt="Attack"
                          className="sigrid_icons"
                        />
                      </div>
                      <img
                        src="/ztunner/resources/images/agents/other/sigrid.png"
                        alt="Sigrid de L'Azur"
                        className="sigrid_img"
                      />
                    </div>
                    <p className="sigrid_name">Sigrid de L'Azur</p>
                  </div>
                </div>
                {/* New W-Engines */}
                <div className="home_content-single_card">
                  <h4>New W-Engines</h4>
                  <div className="home_content-card_section order_2">
                    <div className="home_content-agent_image">
                      <img
                        src="/ztunner/resources/images/wengines/knights_extolment.png"
                        alt="Knight's Extolment"
                        className="sigrid_img no_agent_icon"
                      />
                    </div>
                    <p className="sigrid_name">Knight's Extolment</p>
                  </div>
                  <div className="home_content-card_section order_3">
                    <div className="home_content-agent_image">
                      <img
                        src="/ztunner/resources/images/wengines/ode_of_resurrected_wings.png"
                        alt="Ode of Resurrected Wings"
                        className="remielle_img no_agent_icon"
                      />
                    </div>
                    <p className="remielle_name">Ode of Resurrected Wings</p>
                  </div>
                </div>
                {/* New Disc Sets */}
                <div className="home_content-single_card">
                  <h4>New Disc Sets</h4>
                  <div className="home_content-card_section order_2">
                    <div className="home_content-agent_image">
                      <img
                        src="/ztunner/resources/images/sets/feathered_fate.png"
                        alt="Feathered Fate"
                        className="remielle_img no_agent_icon"
                      />
                    </div>
                    <p className="remielle_name">Feathered Fate</p>
                  </div>

                  <div className="home_content-card_section order_3">
                    <div className="home_content-agent_image">
                      <img
                        src="/ztunner/resources/images/sets/thorned_rose.png"
                        alt="Thorned Rose"
                        className="thorned_rose_img no_agent_icon"
                      />
                    </div>
                    <p className="thorned_rose_name">Thorned Rose</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="agents-block home_content-footer">
          <div className="main_footer-footer_block" style={dominantEmptyStyle}>
            <div
              className="social-footer"
              style={{
                backgroundColor: `color-mix(in srgb, ${dominantTheme} 6%, transparent)`,
                border: `1px solid ${dominantTheme}22`,
                borderRadius: "10px",
                padding: "12px 20px",
              }}
            >
              <div className="social-footer-content">
                <div className="social-footer-left">
                  <span className="social-copyright">© 2026 Z-TUNNER</span>
                  <span className="social-version">v1.0.0</span>
                </div>

                <div className="social-links">
                  {/* Discord */}
                  <a
                    href="https://discord.gg/tu-invite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="manager-social-link"
                    title="Join our Discord"
                  >
                    <svg
                      className="social-icon"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span>Discord</span>
                  </a>

                  {/* Cafecito / Donaciones */}
                  <a
                    href="https://cafecito.app/tuusuario"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="manager-social-link donation"
                    title="Buy me a coffee"
                  >
                    <span className="donation-icon">☕</span>
                    <span>Cafecito</span>
                  </a>

                  {/* Ko-fi (alternativa) */}
                  <a
                    href="https://ko-fi.com/ztunner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="manager-social-link donation"
                    title="Support me on Ko-fi"
                  >
                    <span>🎁</span>
                    <span>Donate</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
