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
    const armorerMatch = agents.find(
      (a) =>
        a.themeColor === dominantTheme &&
        a.specialty?.toLowerCase() === "armorer",
    );
    if (armorerMatch) return armorerMatch;
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
                Z-Tunner: Zenless Zone Zero Damage Calculator
              </h2>
              <div
                className="home_divider"
                style={{ backgroundColor: dominantTheme }}
              />
              <p className="home_content-text_h1">
                Z-Tunner is a{" "}
                <strong className="home_content-text_strong">
                  Zenless Zone Zero Damage Calculator
                </strong>{" "}
                designed for testing builds, comparing teams, and figuring out
                how different mechanics affect your damage. Set up your Agents,
                choose their W-Engines and Drive Discs, and configure the buffs
                provided by your team to recreate different combat scenarios.{" "}
                <strong className="home_content-text_strong">
                  Z-Tunner supports Skill DMG, Anomaly, Disorder and Vortex DMG,
                  Sharp and Maim DMG, and Luminize DMG
                </strong>
                , so you can test different setups without having to do all the
                math yourself. Everything you need to experiment with your
                builds is right here, on Z-Tunner.
              </p>
            </div>
          </div>
        </div>
        {/*<div className="agents-block important_notice">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div className="important_notice-msg">
              🚨 I'm still setting up this page, so if u happen to be here
              early, don't mind any temporarily disabled sections for now. I'll
              work on them soon! 😫
            </div>
            <div
              className="important_notice-msg"
              style={{ marginTop: "var(--padding-5px)" }}
            >
              🚨 The new Custom Base Stats functionality is an experimental
              feature and may still produce unexpected errors. I recommend using
              it with an empty build. ⚠️
            </div>
          </div>
        </div>*/}
        <div className="agents-block home_content-changelog">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div>
              <h2 className="home_content-title_h2">Z-TUNNER Latest Updates</h2>
              <div
                className="home_divider"
                style={{ backgroundColor: dominantTheme }}
              />
              <div className="home_content_changelog_item">
                <span>v1.2.1 — Stun DMG Multiplier Bonuses</span>
                <h3>● Added - Stun DMG Multiplier Bonuses</h3>
                <p>
                  Added in-game toggles to the Damage Calculator that grant Stun
                  DMG Multiplier% to the squad, making build creation for
                  Stunners a bit more meaningful. After all, the original name
                  of this app was ZTunner, without the -.
                </p>
              </div>
              <div className="home_content_changelog_item">
                <span>v1.2.0 — Custom Base Stats</span>

                <h3>● Added - Custom Base Stats</h3>
                <p>
                  Added the ability to manually enter custom stats for an agent
                  in the Build Creator, allowing you to test specific stat
                  values without having to fully configure the agent's build.
                  Empty fields automatically use the calculated values from the
                  build.
                </p>

                <h3>● Minor UI Fixes &amp; Improvements</h3>
                <p>
                  Added detailed damage descriptions to the main Skill DMG
                  results grid when hovering over damage type headers.
                  <br />
                  In-game toggles now display stat information more accurately,
                  with more detailed breakdowns of the stats being applied.
                </p>

                <h3>● Agent-Related Updates</h3>
                <p>
                  Fixed Dialyn's External Line (Additional Ability) In-game
                  effect and its special damage calculation section.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="agents-block home_content-trailer">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div>
              <h2 className="home_content-title_h2">ZZZ Latest Video</h2>
              <div
                className="home_divider"
                style={{ backgroundColor: dominantTheme }}
              />

              <iframe
                className="home_content-trailer_video"
                width="100%"
                src="https://www.youtube-nocookie.com/embed/AkWvzeXDUxY?hl=en"
                title="YouTube video player"
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
                  <h3>🅾 Drive Disc Inventory (Paused)</h3>
                  <p>
                    Create and name drive discs for easier organization and
                    reuse when creating and managing your agents' builds.
                    <br /> ✱ Currently on hold, as Custom Base Stats makes
                    creating builds easier.
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
                3.3 — Journey to the Sky
              </h2>

              <div
                className="home_divider"
                style={{ backgroundColor: dominantTheme }}
              />

              <div className="home_content-patch_main_grid">
                {/* New Agents */}
                <div className="home_content-single_card">
                  <h4>New Agents</h4>
                  <div className="home_content-card_section">
                    <div className="home_content-agent_image">
                      <div className="home_content-agent_icons">
                        <img
                          src="/resources/images/icons/attributes/Fire.png"
                          alt="Fire"
                          className="agent_a_icons"
                        />
                        <img
                          src="/resources/images/icons/specialties/Anomaly.png"
                          alt="Anomaly"
                          className="agent_a_icons"
                        />
                      </div>
                      <img
                        src="/resources/images/agents/other/phoenix.png"
                        alt="Phoenix Reffaela"
                        className="agent_a_img"
                      />
                    </div>
                    <p className="agent_a_name">Phoenix Reffaela</p>
                  </div>
                  <div className="home_content-card_section">
                    <div className="home_content-agent_image">
                      <div className="home_content-agent_icons">
                        <img
                          src="/resources/images/icons/attributes/Wind.png"
                          alt="Ice"
                          className="agent_b_icons"
                        />
                        <img
                          src="/resources/images/icons/specialties/Attack.png"
                          alt="Attack"
                          className="agent_b_icons"
                        />
                      </div>
                      <img
                        src="/resources/images/agents/other/severian.png"
                        alt="Severian Lowell"
                        className="agent_b_img"
                      />
                    </div>
                    <p className="agent_b_name">Severian Lowell</p>
                  </div>
                </div>
                {/* New W-Engines */}
                <div className="home_content-single_card more_space">
                  <h4 className="space_more">New W-Engines</h4>
                  <div className="home_content-card_section">
                    <div className="home_content-agent_image">
                      <div className="home_content-agent_icons">
                        <img
                          src="/resources/images/icons/specialties/Anomaly.png"
                          alt="Anomaly"
                          className="agent_a_icons"
                        />
                      </div>
                      <img
                        src="/resources/images/wengines/plume_of_rebirth.png"
                        alt="Plume of Rebirth"
                        className="agent_a_img no_agent_icon"
                      />
                    </div>
                    <p className="agent_a_name">Plume of Rebirth</p>
                  </div>
                  <div className="home_content-card_section">
                    <div className="home_content-agent_image">
                      <div className="home_content-agent_icons">
                        <img
                          src="/resources/images/icons/specialties/Attack.png"
                          alt="Attack"
                          className="agent_b_icons"
                        />
                      </div>
                      <img
                        src="/resources/images/wengines/incarcerating_grip.png"
                        alt="Incarcerating Grip"
                        className="agent_b_img no_agent_icon"
                      />
                    </div>
                    <p className="agent_b_name">Incarcerating Grip</p>
                  </div>
                  <div className="home_content-card_section">
                    <div className="home_content-agent_image">
                      <div className="home_content-agent_icons">
                        <img
                          src="/resources/images/icons/specialties/Armorer.png"
                          alt="Armorer"
                          className="no_agent_icons"
                        />
                      </div>
                      <img
                        src="/resources/images/wengines/candlelit_scheme.png"
                        alt="Candlelit Scheme"
                        className="no_agent_img no_agent_icon"
                      />
                    </div>
                    <p className="no_agent_name">Candlelit Scheme</p>
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
                        className="agent_a_img no_agent_icon"
                      />
                    </div>
                    <p className="agent_a_name">Feathered Fate</p>
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
