import axios from "axios";
import { useEffect, useState } from "react"

interface ApiResponse {
  message: string;
}
  

function App() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get<ApiResponse>(
          "http://localhost:8000/api/test"
        )
        setData(res.data);
      } catch (error) {
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>
  if (data) return <p>{data.message}</p>
}

export default App
