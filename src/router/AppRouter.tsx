import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DamageSimulator from "../pages/DamageSimulator";
import BuildManager from "../pages/BuildManager";
import DiscInventory from "../pages/DiscInventory";
import BuildCreator from "../pages/BuildCreator";
import InfoAndSettings from "../pages/InfoAndSettings";
import Home from "../pages/Home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "zzz-damage-calculator", element: <DamageSimulator /> },
      { path: "zzz-build-manager", element: <BuildManager /> },
      { path: "zzz-disc-inventory", element: <DiscInventory /> },
      { path: "zzz-build-creator", element: <BuildCreator /> },
      { path: "info-settings", element: <InfoAndSettings /> },
    ],
  },
]);
