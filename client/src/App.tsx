import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Home from "./pages/Home";
import ArticleDetails from "./pages/ArticleDetails";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import EditArticle from "./pages/EditArticle";
import CreateArticle from "./pages/CreateArticle";
import ReviewArticle from "./pages/ReviewArticle";
import Users from "./pages/Users";
import CreateUser from "./pages/CreateUser";
import EditUser from "./pages/EditUser";
import Tasks from "./pages/Tasks";

import CreateTask from "./pages/CreateTask";
import EditTask from "./pages/EditTask";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/article/:slug", element: <ArticleDetails /> },
  
  { path: "/admin/login", element: <AdminLogin /> },
  
  { path: "/admin/dashboard", element: <Dashboard /> },
  
  { path: "/admin/article/create", element: <CreateArticle /> },
  { path: "/admin/article/edit/:id", element: <EditArticle /> },
  { path: "/admin/article/review/:id", element: <ReviewArticle /> },
  
  { path: "/admin/users", element: <Users /> },
  { path: "/admin/users/create", element: <CreateUser /> },
  { path: "/admin/users/edit/:id", element: <EditUser /> },
  
  { path: "/admin/tasks", element: <Tasks /> },
  { path: "/admin/tasks/create", element: <CreateTask /> },
  { path: "/admin/tasks/edit/:id", element: <EditTask /> },
]);

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
