import React, { useState, useEffect, useCallback, useMemo } from "react";
import "../styles/other.css";
import TypingAnimation from "../components/TypingAnimation";
import { useSession } from "@/context/SessionContext";
import { agents } from "@/data/agents";
import Footer from "@/components/Footer";

const Home = () => {
  const { homeSession } = useSession();
  const dominantTheme = homeSession.dominantTheme || "#7EFFDB";

  const [showSubtitle, setShowSubtitle] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const [imageError, setImageError] = useState(false);

  const dominantAgent = useMemo(() => {
    // ⭐ Si hay un Armorer con el theme actual, priorizarlo
    const armorerMatch = agents.find(
      (a) =>
        a.themeColor === dominantTheme &&
        a.specialty?.toLowerCase() === "armorer",
    );
    if (armorerMatch) return armorerMatch;

    // Comportamiento original
    return agents.find((a) => a.themeColor === dominantTheme) || null;
  }, [dominantTheme]);

  const imageUrl = useMemo(() => {
    if (dominantAgent && !imageError) {
      return `/resources/images/agents/mindscape/${dominantAgent.id}_mindscape.png`;
    }
    return "";
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
            alt={`${dominantAgent?.displayName || "Agent"} Mindscape art – ZZZ Damage Calculator`}
            className="home-background-img"
            onError={() => setImageError(true)}
            fetchPriority="high"
          />
        ) : (
          <div
            className="home-background"
            style={{ backgroundColor: "#0a0a0a" }}
          />
        )}
        <div className="home-overlay" />
        <div className="home-content">
          {/* ⭐ H1 real, crawlable, invisible (SEO) */}
          <h1 className="sr-only">
            ZZZ Damage Calculator – Zenless Zone Zero Damage & Build Manager
          </h1>

          <div className="home-title" aria-label="Z-TUNNER">
            <TypingAnimation
              key="title"
              text="Z-TUNNER"
              speed={175}
              onComplete={onTitleComplete}
            />
            {!showSubtitle && (
              <span className="home-cursor" aria-hidden="true" />
            )}
          </div>
          {showSubtitle && (
            <p
              className="home-subtitle"
              aria-label="ZZZ Damage Calculator & Build Manager"
            >
              <TypingAnimation
                key="subtitle"
                text="ZZZ Damage Calculator & Build Manager"
                speed={80}
                onComplete={onSubtitleComplete}
              />
              <span className="home-cursor" aria-hidden="true" />
            </p>
          )}
        </div>
      </div>

      <div className="home_content-main_wrapper">
        {/* BLOQUES DE CONTENIDO ADICIONAL */}
        <div className="agents-block home_content-header">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div>
              <h2 className="home_content-title_h1">
                Z-Tunner: ZZZ Damage Calculator for Zenless Zone Zero
              </h2>
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
                Zenless Zone Zero. Z-Tunner simulates combat directly in your
                browser, including DMG, Anomaly, Disorder, Sharp, Maim, and
                Luminize DMG, with support for W-Engines, Drive Discs, Mindscape
                Cinemas, and in-game effects. Compare builds, fine-tune your
                team compositions, and see how each stat, skill, and buff
                affects your overall damage output — all in one place on{" "}
                <strong className="home_content-text_strong">Z-Tunner.</strong>
              </p>
            </div>
          </div>
        </div>
        <div className="agents-block important_notice">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div
              className="important_notice-msg"
              style={{ marginBottom: "var(--padding-5px)" }}
            >
              🚨 I'm still setting up this page, so if u happen to be here
              early, don't mind any temporarily disabled sections for now. I'll
              work on them soon! 😫
            </div>
            {/*<div className="important_notice-msg">
              🚨 Claret's Sharp DMG should be working now, but I don't have her
              W-Engine, so its Electric Sharp DMG bonus may not work as
              intended. I'll check that later, or maybe not since I only have
              640 Polychromes. 😭 In other news, the Maim DMG Calculator is now
              available! 😝
            </div>*/}
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
                <span>v1.1.2 — Contamination State</span>
                <h3>● Added - Contamination State's Direct DMG</h3>
                <p>
                  Added calculations for the Direct DMG bonuses granted by the
                  Contamination state, including its interaction with the
                  triggering attribute. This was mainly added with Roxy in mind,
                  as her being a Wind Stunner will make Wind more common in
                  different team compositions.
                </p>
              </div>
              <div className="home_content_changelog_item">
                <span>v1.1.1 — Minor Fixes &amp; Updates</span>
                <h3>● Fixed - In-Game Toggle Calculations</h3>
                <p>
                  Fixed calculations and summary display issues for in-game
                  toggles that interact with Initial Stats or Current Stats in
                  the Damage Calculator.
                </p>

                <h3>● Minor UI fixes and agent-related updates.</h3>
                <p>
                  Fixed Rina's Mini Destruction Partner (Core Passive) in-game
                  effect.
                  <br />
                  Fixed Rina's Dance Duet (Mindscape Cinema N°1) in-game effect.
                  <br />
                  Fixed Jane Doe's Crime Counsel (Mindscape Cinema N°1) in-game
                  effect.
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
                title="Zenless Zone Zero Version 3.2 Teaser – Their Secret Histories"
                loading="lazy"
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
                  <h3>🅾 Laceration DMG & ZZZ Maim DMG Calculator</h3>
                  <p>
                    Implement Armorer's exclusive mechanics in the Damage
                    Calculator, including support for Laceration, Sharp DMG and
                    Maim DMG.
                  </p>
                  <div className="home_content-progress_bar">
                    {renderProgressBar(100)}
                    <span>100%</span>
                  </div>{" "}
                </div>{" "}
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
                {/*<div className="home_content-features_card">
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
                </div>{" "}*/}
              </div>
            </div>
          </div>
        </div>
        <div className="agents-block home_content-patch_overview">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div>
              <h2 className="home_content-title_h2">
                <span className="title_dot">⏺</span> Zenless Zone Zero: Version
                3.2 — Their Secret Histories
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
                          src="/resources/images/icons/attributes/Electric.png"
                          alt="Electric"
                          className="remielle_icons"
                        />
                        <img
                          src="/resources/images/icons/specialties/Armorer.png"
                          alt="Anomaly"
                          className="remielle_icons"
                        />
                      </div>
                      <img
                        src="/resources/images/agents/other/claret.png"
                        alt="Claret Flint"
                        className="remielle_img"
                      />
                    </div>
                    <p className="remielle_name">Claret Flint</p>
                  </div>
                  <div className="home_content-card_section order_3">
                    <div className="home_content-agent_image">
                      <div className="home_content-agent_icons">
                        <img
                          src="/resources/images/icons/attributes/Wind.png"
                          alt="Ice"
                          className="sigrid_icons"
                        />
                        <img
                          src="/resources/images/icons/specialties/Stun.png"
                          alt="Attack"
                          className="sigrid_icons"
                        />
                      </div>
                      <img
                        src="/resources/images/agents/other/roxy.png"
                        alt="Roxy Ifrita Pryce"
                        className="sigrid_img"
                      />
                    </div>
                    <p className="sigrid_name">Roxy Ifrita Pryce</p>
                  </div>
                </div>
                {/* New W-Engines */}
                <div className="home_content-single_card more_space">
                  <h4 className="space_more">New W-Engines</h4>
                  <div className="home_content-card_section order_2">
                    <div className="home_content-agent_image">
                      <img
                        src="/resources/images/wengines/crimson_thirst.png"
                        alt="Crimson Thirst"
                        className="remielle_img no_agent_icon"
                      />
                    </div>
                    <p className="remielle_name">Crimson Thirst</p>
                  </div>
                  <div className="home_content-card_section order_2">
                    <div className="home_content-agent_image">
                      <img
                        src="/resources/images/wengines/catty_luck.png"
                        alt="Ode of Resurrected Wings"
                        className="normal_img no_agent_icon"
                      />
                    </div>
                    <p className="normal_name">Catty Luck</p>
                  </div>
                  <div className="home_content-card_section order_3">
                    <div className="home_content-agent_image">
                      <img
                        src="/resources/images/wengines/bloodmarrow_coffer.png"
                        alt="Bloodmarrow Coffer"
                        className="normal_img no_agent_icon"
                      />
                    </div>
                    <p className="normal_name">Bloodmarrow Coffer</p>
                  </div>
                  <div className="home_content-card_section order_3">
                    <div className="home_content-agent_image">
                      <img
                        src="/resources/images/wengines/crimson_moon_casket.png"
                        alt="Crimson Moon Casket"
                        className="sigrid_img no_agent_icon"
                      />
                    </div>
                    <p className="sigrid_name">Crimson Moon Casket</p>
                  </div>
                </div>
                {/* New Disc Sets */}
                <div
                  className="home_content-single_card"
                  style={{ display: "none" }}
                >
                  <h4>New Disc Sets</h4>
                  <div className="home_content-card_section order_2">
                    <div className="home_content-agent_image">
                      <img
                        src="/resources/images/sets/feathered_fate.png"
                        alt="Feathered Fate"
                        className="remielle_img no_agent_icon"
                      />
                    </div>
                    <p className="remielle_name">Feathered Fate</p>
                  </div>

                  <div className="home_content-card_section order_3">
                    <div className="home_content-agent_image">
                      <img
                        src="/resources/images/sets/thorned_rose.png"
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
            <Footer theme={dominantTheme} linkVariant="manager" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
