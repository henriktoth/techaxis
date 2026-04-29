import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from 'react-hot-toast';

import Home from "./pages/public/home/Home";
import ArticleDetails from "./pages/public/article/ArticleDetails";
import Login from "./pages/public/auth/Login";
import Register from "./pages/public/auth/Register";
import Profile from "./pages/public/profile/Profile";
import Favorites from "./pages/public/favorites/Favorites";
import Dashboard from "./pages/admin/dashboard/Dashboard";
import EditArticle from "./pages/admin/article/EditArticle";
import CreateArticle from "./pages/admin/article/CreateArticle";
import ReviewArticle from "./pages/admin/article/ReviewArticle";
import PreviewArticle from "./pages/admin/article/PreviewArticle";
import Users from "./pages/admin/users/Users";
import CreateUser from "./pages/admin/users/CreateUser";
import EditUser from "./pages/admin/users/EditUser";
import Readers from "./pages/admin/readers/Readers";
import Tasks from "./pages/admin/tasks/Tasks";
import CreateTask from "./pages/admin/tasks/CreateTask";
import EditTask from "./pages/admin/tasks/EditTask";
import Categories from "./pages/admin/categories/Categories";
import NotFound from "./pages/public/NotFound";
import { RequireAdmin, RequireAuth, RequireStaff } from "./utils/routeGuards";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/article/:slug", element: <ArticleDetails /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/profile", element: <RequireAuth><Profile /></RequireAuth> },
  { path: "/favorites", element: <RequireAuth><Favorites /></RequireAuth> },

  { path: "/admin/dashboard", element: <RequireStaff><Dashboard /></RequireStaff> },
  
  { path: "/admin/article/create", element: <RequireStaff><CreateArticle /></RequireStaff> },
  { path: "/admin/article/edit/:id", element: <RequireStaff><EditArticle /></RequireStaff> },
  { path: "/admin/article/review/:id", element: <RequireStaff><ReviewArticle /></RequireStaff> },
  { path: "/admin/article/preview/:id", element: <RequireStaff><PreviewArticle /></RequireStaff> },
  
  { path: "/admin/users", element: <RequireAdmin><Users /></RequireAdmin> },
  { path: "/admin/users/create", element: <RequireAdmin><CreateUser /></RequireAdmin> },
  { path: "/admin/users/edit/:id", element: <RequireAdmin><EditUser /></RequireAdmin> },

  { path: "/admin/readers", element: <RequireAdmin><Readers /></RequireAdmin> },

  { path: "/admin/categories", element: <RequireAdmin><Categories /></RequireAdmin> },
  
  { path: "/admin/tasks", element: <RequireStaff><Tasks /></RequireStaff> },
  { path: "/admin/tasks/create", element: <RequireAdmin><CreateTask /></RequireAdmin> },
  { path: "/admin/tasks/edit/:id", element: <RequireAdmin><EditTask /></RequireAdmin> },

  { path: "*", element: <NotFound /> },
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
