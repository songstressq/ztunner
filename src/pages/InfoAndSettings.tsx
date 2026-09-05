import { useState, useEffect, useRef } from "react";
import { useSession } from "@/context/SessionContext";
import "../styles/other.css";

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
      </div>{" "}
    </div>
  );
};

export default InfoAndSettings;
