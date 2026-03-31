import { Router } from 'express';
import { requireAuth } from '../middleware/authenticate.middleware.js';
import { requireOnboardingStep } from '../middleware/onboarding.middleware.js';
import { createOrUpdateProfile } from '../controllers/profile.controller.js';

const profileRouter = Router();

profileRouter.post(
  '/profile',
  requireAuth,
  requireOnboardingStep('profile'),
  createOrUpdateProfile,
);

export default profileRouter;
