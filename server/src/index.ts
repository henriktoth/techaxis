import express, {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes/routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes)

// Error handler 
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : String(err);
  res.status(500).json({ error: message });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});