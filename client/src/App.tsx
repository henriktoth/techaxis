import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ArticleDetails from "./pages/ArticleDetails";

function App() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-100 font-sans selection:bg-indigo-500/30">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:slug" element={<ArticleDetails />} />
      </Routes>
    </div>
  );
}

export default App;
