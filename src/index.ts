// src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'], // Add your frontend URLs
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.get('/', (_req: Request, res: Response) => {
    res.send('Prove Unify Server - Express with TypeScript');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
