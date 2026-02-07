import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ArticleDetails from "./pages/ArticleDetails";
import AdminLogin from "./pages/AdminLogin";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:slug" element={<ArticleDetails />} />
        <Route path="/admin" element={<AdminLogin />} />
      </Routes>
    </>
  );
}

export default App;
