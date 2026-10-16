import React from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { HomePage } from "./pages/Home";
import { MongoExpressPage } from "./pages/MongoExpress";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/mongo-express/:connectionId" element={<MongoExpressPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
