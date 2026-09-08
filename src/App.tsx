import { RouterProvider } from "react-router-dom";
import { router } from "./router/AppRouter";
import "../src/styles/App.css";

function App() {
  return <RouterProvider router={router} />;
}

export default App;
