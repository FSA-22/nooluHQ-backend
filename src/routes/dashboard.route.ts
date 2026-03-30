import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.ts';
import { requireAuth } from '../middleware/authenticate.middleware.ts';

const dashboardRouter = Router();

dashboardRouter.get('/dashboard/stats', requireAuth, getDashboard);

export default dashboardRouter;
