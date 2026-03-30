import { Router } from 'express';
import { createGoal } from '../controllers/goal.controller.ts';
import { requireAuth } from '../middleware/authenticate.middleware.ts';
import { requireOnboardingStep } from '../middleware/onboarding.middleware.ts';

const goalRouter = Router();

goalRouter.post('/goal', requireAuth, requireOnboardingStep('goal'), createGoal);

export default goalRouter;
