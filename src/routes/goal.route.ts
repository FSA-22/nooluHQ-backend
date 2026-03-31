import { Router } from 'express';
import { createGoal } from '../controllers/goal.controller.js';
import { requireAuth } from '../middleware/authenticate.middleware.js';
import { requireOnboardingStep } from '../middleware/onboarding.middleware.js';

const goalRouter = Router();

goalRouter.post('/goal', requireAuth, requireOnboardingStep('goal'), createGoal);

export default goalRouter;
