import express, {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import routes from './routes/routes';
import { startScheduledPublisher } from './utils/scheduledPublisher';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;


app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api', routes)

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  void _next;
  console.error(err);
  const message = err instanceof Error ? err.message : String(err);
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    startScheduledPublisher();
});