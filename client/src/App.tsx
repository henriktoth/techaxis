import axios from "axios";
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  thumbnail: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  authorId: number;
  categoryId: number;
  taskId: number | null;
}

function App() {

  const [data, setData] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get<Article[]>(
          "http://localhost:8000/api/articles"
        );
        setData(res.data);
      } catch (error) {
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
