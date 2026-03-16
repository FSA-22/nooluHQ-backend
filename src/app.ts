import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';

// Import types separately (compile-time only)
import type { Request, Response } from 'express';

import { CLIENT_URL, NODE_ENV } from './config/env.ts';
import authRouter from './routes/auth.route.ts';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  cors({
    origin: CLIENT_URL || '*',
    credentials: true,
  }),
);

if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/v1/auth', authRouter);

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.send('Backend is running!');
});

export default app;
