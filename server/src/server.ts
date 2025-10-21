import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
})

app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});