import type { Request, Response, NextFunction } from 'express';
import { ONBOARDING_STEPS, ONBOARDING_CONFIG } from '../constants/onboarding.js';
import type { OnboardingStep } from '../constants/onboarding.js';

type Mode = 'strict' | 'atLeast';

export const requireOnboardingStep = (requiredStep: OnboardingStep, mode: Mode = 'atLeast') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const currentStep = req.user.onboardingStep as OnboardingStep;

    //  Validate current step exists in config
    if (!currentStep || !ONBOARDING_STEPS.includes(currentStep)) {
      res.status(400).json({
        message: 'Invalid onboarding state',
      });
      return;
    }

    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    const requiredIndex = ONBOARDING_STEPS.indexOf(requiredStep);

    //  Prevent skipping REQUIRED steps (safe indexing)
    for (let i = 0; i < requiredIndex; i++) {
      const step = ONBOARDING_STEPS[i];

      if (!step) continue; // ✅ guards undefined

      const config = ONBOARDING_CONFIG[step];

      if (config?.required && i > currentIndex) {
        res.status(403).json({
          message: 'Complete previous required steps first',
          currentStep,
          blockedAt: step,
        });
        return;
      }
    }

    //  Strict mode enforcement
    if (mode === 'strict' && currentIndex !== requiredIndex) {
      res.status(403).json({
        message: 'Invalid onboarding step',
        currentStep,
        requiredStep,
      });
      return;
    }

    next();
  };
};
