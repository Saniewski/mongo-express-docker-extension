import { BrowserRouter, Route, Routes } from "react-router";
import { LoginPage } from "./pages/Login";
import { MongoExpressPage } from "./pages/MongoExpress";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/mongo-express" element={<MongoExpressPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
