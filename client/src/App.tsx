import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ArticleDetails from "./pages/ArticleDetails";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:slug" element={<ArticleDetails />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;
