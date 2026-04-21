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

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/article/:slug", element: <ArticleDetails /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/profile", element: <Profile /> },
  { path: "/favorites", element: <Favorites /> },

  { path: "/admin/dashboard", element: <Dashboard /> },
  
  { path: "/admin/article/create", element: <CreateArticle /> },
  { path: "/admin/article/edit/:id", element: <EditArticle /> },
  { path: "/admin/article/review/:id", element: <ReviewArticle /> },
  { path: "/admin/article/preview/:id", element: <PreviewArticle /> },
  
  { path: "/admin/users", element: <Users /> },
  { path: "/admin/users/create", element: <CreateUser /> },
  { path: "/admin/users/edit/:id", element: <EditUser /> },

  { path: "/admin/readers", element: <Readers /> },

  { path: "/admin/categories", element: <Categories /> },
  
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
