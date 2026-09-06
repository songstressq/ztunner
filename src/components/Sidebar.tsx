import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "./SidebarContext";
import { useRef, useEffect } from "react";

const Sidebar = () => {
  const { isSidebarOpen, openSidebar, closeSidebar, toggleSidebar } =
    useSidebar();
  const sidebarRef = useRef<HTMLElement>(null);
  const location = useLocation();

  const isTouchDevice = window.matchMedia(
    "(hover: none) and (pointer: coarse)",
  ).matches;

  useEffect(() => {
    if (isTouchDevice) return;
    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;
    let hoverTimeout: NodeJS.Timeout;
    const handleMouseEnter = () => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => openSidebar(), 50);
    };
    const handleMouseLeave = () => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => closeSidebar(), 100);
    };
    sidebarElement.addEventListener("mouseenter", handleMouseEnter);
    sidebarElement.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      clearTimeout(hoverTimeout);
      sidebarElement.removeEventListener("mouseenter", handleMouseEnter);
      sidebarElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [openSidebar, closeSidebar, isTouchDevice]);

  const handleLinkClick = (path: string) => {
    if (location.pathname !== path) {
      closeSidebar();
    }
  };

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
    return () => document.body.classList.remove("sidebar-open");
  }, [isSidebarOpen]);

  return (
    <nav className={`sidebar ${isSidebarOpen ? "open" : ""}`} ref={sidebarRef}>
      <div className="arrow" onClick={toggleSidebar}>
        <img src="/resources/images/sidebar/logo.png" className="arrow-icon" />
        <span className="arrow-text">Z-TUNNER</span>
      </div>
      <ul className="sidebar-list">
        {/* NUEVO ÍTEM HOME */}
        <li className="sidebar-item">
          <Link
            to="/home"
            className="sidebar-link"
            onClick={() => handleLinkClick("/home")}
          >
            <img
              src="/resources/images/sidebar/home.png"
              className="item-icon"
            />
            <span className="item-text">Home</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link
            to="/build-creator"
            className="sidebar-link"
            onClick={() => handleLinkClick("/build-creator")}
          >
            <img
              src="/resources/images/sidebar/wengines.png"
              className="item-icon"
            />
            <span className="item-text">Build Creator</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link
            to="/damage-simulator"
            className="sidebar-link"
            onClick={() => handleLinkClick("/damage-simulator")}
          >
            <img
              src="/resources/images/sidebar/simu.png"
              className="item-icon"
            />
            <span className="item-text">Damage Calculator</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link
            to="/build-manager"
            className="sidebar-link"
            onClick={() => handleLinkClick("/build-manager")}
          >
            <img
              src="/resources/images/sidebar/agents.png"
              className="item-icon"
            />
            <span className="item-text">Build Manager</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link
            to="/disc-inventory"
            className="sidebar-link"
            onClick={() => handleLinkClick("/disc-inventory")}
          >
            <img
              src="/resources/images/sidebar/disks.png"
              className="item-icon"
            />
            <span className="item-text">Disc Inventory</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link
            to="/info-settings"
            className="sidebar-link"
            onClick={() => handleLinkClick("/info-settings")}
          >
            <img
              src="/resources/images/sidebar/calc.png"
              className="item-icon"
            />
            <span className="item-text">Info & Settings</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
