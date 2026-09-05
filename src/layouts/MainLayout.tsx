import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { SidebarProvider } from "../components/SidebarContext";
import { SessionProvider } from "../context/SessionContext";
import "../styles/sidebar.css";

const MainLayout = () => {
  return (
    <SessionProvider>
      {" "}
      <SidebarProvider>
        <Sidebar />
        <main className="main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </SessionProvider>
  );
};

export default MainLayout;
