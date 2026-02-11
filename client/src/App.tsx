import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ArticleDetails from "./pages/ArticleDetails";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import EditArticle from "./pages/EditArticle";
import CreateArticle from "./pages/CreateArticle";
import Users from "./pages/Users";
import CreateUser from "./pages/CreateUser";
import EditUser from "./pages/EditUser";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:slug" element={<ArticleDetails />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/article/create" element={<CreateArticle />} />
        <Route path="/admin/article/edit/:id" element={<EditArticle />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/users/create" element={<CreateUser />} />
        <Route path="/admin/users/edit/:id" element={<EditUser />} />
      </Routes>
    </>
  );
}

export default App;
