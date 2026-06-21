import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { MultiplayerProvider } from "./multiplayer/MultiplayerContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MultiplayerProvider><App /></MultiplayerProvider>
  </StrictMode>
);
