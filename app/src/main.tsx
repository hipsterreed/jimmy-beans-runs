import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./april_26/styles.css";
import App from "./april_26/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
