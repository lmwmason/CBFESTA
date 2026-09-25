import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { AuthProvider } from "./features/auth/AuthProvider";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes home={<App />} />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
