import React from "react";
import { createRoot } from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import { DockerMuiV6ThemeProvider } from "@docker/docker-mui-theme";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <DockerMuiV6ThemeProvider>
    <CssBaseline />
    <App />
  </DockerMuiV6ThemeProvider>,
);
