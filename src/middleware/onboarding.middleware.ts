import type { Request, Response, NextFunction } from 'express';
import { ONBOARDING_STEPS } from '../constants/onboarding.ts';
import type { OnboardingStep } from '../constants/onboarding.ts';

type Mode = 'strict' | 'atLeast';

export const requireOnboardingStep = (requiredStep: OnboardingStep, mode: Mode = 'strict') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const currentStep = req.user.onboardingStep as OnboardingStep;

    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    const requiredIndex = ONBOARDING_STEPS.indexOf(requiredStep);

    if (mode === 'strict' && currentIndex !== requiredIndex) {
      res.status(403).json({
        message: 'Invalid onboarding step',
        currentStep,
        requiredStep,
      });
      return;
    }

    if (mode === 'atLeast' && currentIndex < requiredIndex) {
      res.status(403).json({
        message: 'Complete previous onboarding steps first',
        currentStep,
        requiredStep,
      });
      return;
    }

    next();
  };
};
