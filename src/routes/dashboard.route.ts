import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/authenticate.middleware.js';

const dashboardRouter = Router();

dashboardRouter.get('/dashboard/stats', requireAuth, getDashboard);

export default dashboardRouter;
