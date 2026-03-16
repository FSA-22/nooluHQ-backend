import express from 'express';
import { createProfile } from '../controllers/onboarding.controller.js';
import { requireStep } from '../middleware/onboarding.middleware.js';
import { OnboardingStep } from '../enums/onboarding.enum.js';
// import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/profile', requireStep(OnboardingStep.ACCOUNT), createProfile);

export default router;
