import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DockerMuiThemeProvider } from "@docker/docker-mui-theme";
import { LoginPage } from "./pages/Login";
import { MongoExpressPage } from "./pages/MongoExpress";

export function App() {
  return (
    <>
      <DockerMuiThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/mongo-express" element={<MongoExpressPage />} />
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      </DockerMuiThemeProvider>
    </>
  );
}
