import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import { CLIENT_URL, NODE_ENV } from './config/env';

dotenv.config();

const app: Application = express();

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
app.use('/api/v1', authRoutes);

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.send('Backend is running!');
});

export default app;
