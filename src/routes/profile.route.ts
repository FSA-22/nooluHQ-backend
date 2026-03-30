import { Router } from 'express';
import { requireAuth } from '../middleware/authenticate.middleware.ts';
import { requireOnboardingStep } from '../middleware/onboarding.middleware.ts';
import { createOrUpdateProfile } from '../controllers/profile.controller.ts';

const profileRouter = Router();

profileRouter.post(
  '/profile',
  requireAuth,
  requireOnboardingStep('profile'),
  createOrUpdateProfile,
);

export default profileRouter;
