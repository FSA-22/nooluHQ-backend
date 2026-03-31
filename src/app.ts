import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';
import cookieParser from 'cookie-parser';

import type { Request, Response } from 'express';

import { CLIENT_URL, NODE_ENV } from './config/env.js';
import authRouter from './routes/auth.route.js';
import profileRouter from './routes/profile.route.js';
import workspaceRouter from './routes/workspace.route.js';
import goalRouter from './routes/goal.route.js';
import dashboardRouter from './routes/dashboard.route.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/v1/auths', authRouter);
app.use('/api/v1/onboarding', profileRouter);
app.use('/api/v1/onboarding', workspaceRouter);
app.use('/api/v1/onboarding', goalRouter);
app.use('/api/v1/', dashboardRouter);

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.send('Backend is running!');
});

export default app;
