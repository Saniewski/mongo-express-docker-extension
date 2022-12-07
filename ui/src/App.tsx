import React from 'react';
import { LoginPage } from "./pages/Login";
import {DockerMuiThemeProvider} from "@docker/docker-mui-theme";

export function App() {
  return (
    <>
      <DockerMuiThemeProvider>
        <LoginPage />
      </DockerMuiThemeProvider>
    </>
  );
}
