import { useState, useEffect, useRef } from "react";
import { useSession } from "@/context/SessionContext";
import "../styles/other.css";
import Footer from "@/components/Footer";

const InfoAndSettings = () => {
  const { homeSession } = useSession();
  const dominantTheme = homeSession.dominantTheme || "#7EFFDB";
  const [switchStates, setSwitchStates] = useState([
    false,
    false,
    false,
    false,
    false,
    false,
  ]);

  const toggleSwitch = (index: number) => {
    setSwitchStates((prev) => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    });
  };

  const dominantEmptyStyle = {
    backgroundImage: `linear-gradient(to right bottom, ${dominantTheme}11, ${dominantTheme}22, ${dominantTheme}55, ${dominantTheme}22, ${dominantTheme}11)`,
  };

  return (
    <div
      style={
        {
          "--dominant-theme": dominantTheme,
          minHeight: "100vh",
          backgroundColor: "#0a0a0a",
        } as React.CSSProperties
      }
    >
      <div className="info_and_settings-main_wrapper">
        {/* NUEVO: SECCIÓN SETTINGS */}
        <div className="agents-block">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <h1 className="home_content-title_h1">Settings</h1>
            <div
              className="home_divider"
              style={{ backgroundColor: dominantTheme }}
            />

            <div className="settings-main_wrapper">
              {/* Nota de que los switches están deshabilitados */}
              <div className="settings-main_wrapper-header">
                ⚙️ Settings are currently disabled
              </div>

              {/* Switch 1 */}
              <div className="settings-main_wrapper-switch_wrapper">
                <div>
                  <strong className="settings-main_wrapper-switch_header">
                    Enable Low Specs Mode
                  </strong>
                  <p>
                    Reduce visual effects and animations to improve performance
                    on lower-end devices.
                  </p>
                </div>

                <div className="ingame_toggle-toggle_section-switch">
                  <input
                    className="ingame_toggle-toggle_section-input"
                    id="switch-1"
                    type="checkbox"
                    checked={switchStates[0]}
                    disabled
                  />
                  <label
                    className="ingame_toggle-toggle_section-label"
                    htmlFor="switch-1"
                    style={
                      switchStates[0]
                        ? ({
                            backgroundColor: dominantTheme,
                            "--toggle-color": dominantTheme,
                          } as React.CSSProperties)
                        : {}
                    }
                  />
                </div>
              </div>

              {/* Switch 2 */}
              <div className="settings-main_wrapper-switch_wrapper">
                <div>
                  <strong>UI Color</strong>
                  <p>
                    Customize the main accent color used throughout the Z-Tunner
                    interface.
                  </p>
                </div>

                <div className="ingame_toggle-toggle_section-switch">
                  <input
                    className="ingame_toggle-toggle_section-input"
                    id="switch-2"
                    type="checkbox"
                    checked={switchStates[1]}
                    disabled
                  />
                  <label
                    className="ingame_toggle-toggle_section-label"
                    htmlFor="switch-2"
                    style={
                      switchStates[1]
                        ? ({
                            backgroundColor: dominantTheme,
                            "--toggle-color": dominantTheme,
                          } as React.CSSProperties)
                        : {}
                    }
                  />
                </div>
              </div>

              {/* Switch 3 */}
              <div className="settings-main_wrapper-switch_wrapper">
                <div>
                  <strong>Language</strong>
                  <p>
                    Choose the language used throughout the Z-Tunner interface
                    and content.
                  </p>
                </div>

                <div className="ingame_toggle-toggle_section-switch">
                  <input
                    className="ingame_toggle-toggle_section-input"
                    id="switch-3"
                    type="checkbox"
                    checked={switchStates[2]}
                    disabled
                  />
                  <label
                    className="ingame_toggle-toggle_section-label"
                    htmlFor="switch-3"
                    style={
                      switchStates[2]
                        ? ({
                            backgroundColor: dominantTheme,
                            "--toggle-color": dominantTheme,
                          } as React.CSSProperties)
                        : {}
                    }
                  />
                </div>
              </div>

              {/* Switch 4 */}
              <div className="settings-main_wrapper-switch_wrapper">
                <div>
                  <strong>Show Full Changelog</strong>
                  <p>
                    Display the complete history of Z-Tunner updates, including
                    older versions and previously added features.
                  </p>
                </div>

                <div className="ingame_toggle-toggle_section-switch">
                  <input
                    className="ingame_toggle-toggle_section-input"
                    id="switch-4"
                    type="checkbox"
                    checked={switchStates[3]}
                    disabled
                  />
                  <label
                    className="ingame_toggle-toggle_section-label"
                    htmlFor="switch-4"
                    style={
                      switchStates[3]
                        ? ({
                            backgroundColor: dominantTheme,
                            "--toggle-color": dominantTheme,
                          } as React.CSSProperties)
                        : {}
                    }
                  />
                </div>
              </div>

              {/* Switch 5 */}
              <div className="settings-main_wrapper-switch_wrapper">
                <div>
                  <strong>Disable Overviews</strong>
                  <p>
                    Hide help, explanation, and overview sections displayed
                    throughout the different Z-Tunner pages.
                  </p>
                </div>

                <div className="ingame_toggle-toggle_section-switch">
                  <input
                    className="ingame_toggle-toggle_section-input"
                    id="switch-5"
                    type="checkbox"
                    checked={switchStates[4]}
                    disabled
                  />
                  <label
                    className="ingame_toggle-toggle_section-label"
                    htmlFor="switch-5"
                    style={
                      switchStates[4]
                        ? ({
                            backgroundColor: dominantTheme,
                            "--toggle-color": dominantTheme,
                          } as React.CSSProperties)
                        : {}
                    }
                  />
                </div>
              </div>

              {/* Switch 6 */}
              <div className="settings-main_wrapper-switch_wrapper">
                <div>
                  <strong>Clear Local Storage</strong>
                  <p>
                    Delete all locally stored builds, settings, and other
                    Z-Tunner data saved in your browser.
                  </p>
                </div>

                <div className="ingame_toggle-toggle_section-switch">
                  <input
                    className="ingame_toggle-toggle_section-input"
                    id="switch-6"
                    type="checkbox"
                    checked={switchStates[5]}
                    disabled
                  />
                  <label
                    className="ingame_toggle-toggle_section-label"
                    htmlFor="switch-6"
                    style={
                      switchStates[5]
                        ? ({
                            backgroundColor: dominantTheme,
                            "--toggle-color": dominantTheme,
                          } as React.CSSProperties)
                        : {}
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NUEVO: SECCIÓN CHANGELOG */}
        <div className="agents-block changelog_div">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div>
              <h1 className="home_content-title_h1">Changelog</h1>
              <div
                className="home_divider"
                style={{ backgroundColor: dominantTheme }}
              />

              <div className="changelog_grid">
                {/* v1.1.0 */}
                <div className="home_content_changelog_item">
                  <span>v1.1.0 — Armorer Update</span>
                  <h3>● Added - ZZZ Maim DMG Calculator</h3>
                  <p>
                    Added calculations for Laceration DMG, Sharp DMG, and Maim
                    DMG, including their additional mechanics, to Z-Tunner's ZZZ
                    DMG/Maim DMG Calculator.
                  </p>
                  <h3>● Added - Claret Flint / Armorer Specialty</h3>
                  <p>
                    Claret Flint and the Armorer Specialty have been added to
                    Z-Tunner, with support for their unique abilities,
                    mechanics, and damage calculations.
                  </p>
                </div>

                {/* v1.0.1 */}
                <div className="home_content_changelog_item">
                  <span>v1.0.1 — Minor Fixes &amp; Updates</span>
                  <h3>● Minor UI fixes and agent-related updates.</h3>
                  <p>
                    Fixed Alice's Sage at the Sword's Tip (Mindscape Cinema N°2)
                    in-game effect.
                    <br />
                    Fixed Aria's Fantastical Beat (Mindscape Cinema N°2) in-game
                    effect.
                    <br />
                    Fixed Anton's Brothers in Arms! (Core Passive) in-game
                    effect.
                    <br />
                    Fixed Seed's Flower Chain Protocol (Core Passive) in-game
                    effect.
                    <br />
                    Fixed Jane's Crime Counsel (Mindscape Cinema N°1) in-game
                    effect.
                  </p>
                </div>

                {/* v1.0.0 */}
                <div className="home_content_changelog_item">
                  <span>v1.0.0 — Initial Release</span>

                  <h3>● Added ZZZ Damage Calculator </h3>
                  <p>
                    Added damage calculations for Normal and CRIT DMG, Sheer
                    DMG, Aftershock DMG, Anomaly DMG, Disorder DMG, and Vortex
                    DMG.
                  </p>
                  <h3>● Added ZZZ Build Creator &amp; Build Manager</h3>
                  <p>
                    Introduces sections for replicating your agents' in-game
                    builds for later use in damage calculations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NUEVO: SECCIÓN PRIVACY POLICY */}
        <div className="agents-block policy_div">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <h1 className="home_content-title_h1">Privacy Policy</h1>
            <div
              className="home_divider"
              style={{ backgroundColor: dominantTheme }}
            />
            <div className="privacy-policy">
              <p className="last-updated">
                <strong>Last updated: September 2, 2026</strong>
              </p>
              <p>
                Welcome to <strong>Z-Tunner</strong>. This Privacy Policy
                explains how information is handled when you use the Z-Tunner
                website and its tools.
              </p>
              <p>
                Z-Tunner is a free, independent fan-made project for{" "}
                <strong>Zenless Zone Zero</strong>, created to help players test
                builds, teams, and damage calculations.
              </p>
              <h2>1. Information We Collect</h2>
              <p>
                <strong>
                  Z-Tunner does not collect, store, or process personal
                  information.
                </strong>
              </p>
              <p>
                The website does not require you to create an account or provide
                personal information such as your name, email address, password,
                or other identifying information.
              </p>
              <p>
                Z-Tunner also does not use analytics services, advertising
                networks, or tracking services to monitor your activity.
              </p>
              <h2>2. Local Storage</h2>
              <p>
                Z-Tunner may use your browser's{" "}
                <strong>local storage (localStorage)</strong> to save
                information such as builds, configurations, or other settings
                that you create within the website.
              </p>
              <p>
                This information is stored{" "}
                <strong>
                  locally on your own device and in your own browser
                </strong>
                . It is not transmitted to or stored on a Z-Tunner server.
              </p>
              <p>
                Clearing your browser's site data, using a different browser or
                device, or otherwise removing local storage data may cause your
                saved builds and settings to be lost.
              </p>
              <h2>3. Cookies and Tracking</h2>
              <p>
                Z-Tunner does not intentionally use cookies, tracking pixels,
                fingerprinting, or similar technologies to track users.
              </p>
              <p>
                Third-party services used to host or deliver the website may
                technically process limited information as part of normal web
                infrastructure, such as IP addresses or connection information.
                Such processing is handled by the respective service providers
                according to their own privacy policies.
              </p>
              <h2>4. Advertising</h2>
              <p>
                <strong>
                  Z-Tunner does not currently display advertisements and does
                  not use advertising networks.
                </strong>
              </p>
              <p>
                Z-Tunner does not sell, rent, or share personal information with
                advertisers.
              </p>
              <h2>5. Third-Party Services</h2>
              <p>
                Z-Tunner may rely on third-party infrastructure to host and
                deliver the website. These services may process basic technical
                information necessary to provide the website, such as requests,
                IP addresses, or browser and connection information.
              </p>
              <p>
                Z-Tunner does not use these services to build user profiles or
                intentionally track individual users.
              </p>
              <p>
                Z-Tunner may also contain links to external websites or
                services, including the official Zenless Zone Zero website and
                the Z-Tunner Discord server. Once you leave Z-Tunner, your
                activity is subject to the privacy policies and terms of those
                external services.
              </p>
              <h2>6. Discord</h2>
              <p>
                Z-Tunner provides a <strong>Discord server</strong> as a place
                for users to contact the project creator, report issues, provide
                feedback, or discuss the project.
              </p>
              <p>
                If you choose to join or interact with the Z-Tunner Discord
                server, any information you provide there is handled by{" "}
                <strong>Discord</strong> and is subject to Discord's own
                policies and terms. Z-Tunner does not control the information
                collected by Discord.
              </p>
              <h2>7. Data Security</h2>
              <p>
                Because Z-Tunner does not maintain user accounts or a database
                containing user information, there is no Z-Tunner user database
                containing personal information to protect.
              </p>
              <p>
                Information saved through the calculator is stored locally in
                your browser.
              </p>
              <p>
                However, no method of electronic storage or transmission can be
                guaranteed to be completely secure.
              </p>
              <h2>8. Intellectual Property and Zenless Zone Zero</h2>
              <p>
                Z-Tunner is an{" "}
                <strong>unofficial, independent fan-made project</strong> and is
                not affiliated with, endorsed by, or sponsored by{" "}
                <strong>HoYoverse</strong>.
              </p>
              <p>
                <strong>Zenless Zone Zero</strong>, including its characters,
                artwork, names, logos, trademarks, and other related
                intellectual property, is the property of{" "}
                <strong>HoYoverse and/or its respective rights holders</strong>.
              </p>
              <p>
                Z-Tunner does not claim ownership of any HoYoverse intellectual
                property used or referenced by the project.
              </p>
              <p>
                The use of such material is intended solely for the purpose of
                creating a fan-made tool for the Zenless Zone Zero community.
              </p>
              <p>
                For official information regarding Zenless Zone Zero and its
                intellectual property, please refer to the official sources
                provided by HoYoverse.
              </p>
              <h2>9. Changes to This Privacy Policy</h2>
              <p>
                This Privacy Policy may be updated from time to time if the
                functionality of Z-Tunner changes or if additional services are
                introduced.
              </p>
              <p>
                Any changes will be reflected on this page by updating the{" "}
                <strong>"Last updated"</strong> date.
              </p>
              <h2>10. Contact</h2>
              <p>
                If you have questions, suggestions, or concerns regarding
                Z-Tunner or this Privacy Policy, you can contact the project
                creator through the{" "}
                <strong>official Z-Tunner Discord server</strong>.
              </p>
              <hr className="last-divider" />
              <p>
                <strong>Z-Tunner</strong> is an independent fan-made project and
                is not affiliated with or endorsed by HoYoverse.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER (igual que en Home) */}
        <div
          className="agents-block home_content-footer"
          style={{ marginBottom: 0 }}
        >
          <div className="main_footer-footer_block" style={dominantEmptyStyle}>
            <Footer theme={dominantTheme} linkVariant="manager" />
          </div>
        </div>
      </div>{" "}
    </div>
  );
};

export default InfoAndSettings;
