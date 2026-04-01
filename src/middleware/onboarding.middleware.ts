import type { Request, Response, NextFunction } from 'express';
import { ONBOARDING_STEPS, ONBOARDING_CONFIG } from '../constants/onboarding.js';
import type { OnboardingStep } from '../constants/onboarding.js';

type Mode = 'strict' | 'atLeast';

// export const requireOnboardingStep = (requiredStep: OnboardingStep, mode: Mode = 'strict') => {
//   return (req: Request, res: Response, next: NextFunction): void => {
//     if (!req.user) {
//       res.status(401).json({ message: 'Unauthorized' });
//       return;
//     }

//     const currentStep = req.user.onboardingStep as OnboardingStep;

//     const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
//     const requiredIndex = ONBOARDING_STEPS.indexOf(requiredStep);

//     if (mode === 'strict' && currentIndex !== requiredIndex) {
//       res.status(403).json({
//         message: 'Invalid onboarding step',
//         currentStep,
//         requiredStep,
//       });
//       return;
//     }

//     if (mode === 'atLeast' && currentIndex < requiredIndex) {
//       res.status(403).json({
//         message: 'Complete previous onboarding steps first',
//         currentStep,
//         requiredStep,
//       });
//       return;
//     }

//     next();
//   };
// };

export const requireOnboardingStep = (requiredStep: OnboardingStep, mode: Mode = 'atLeast') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const currentStep = req.user.onboardingStep as OnboardingStep;

    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    const requiredIndex = ONBOARDING_STEPS.indexOf(requiredStep);

    // Prevent skipping REQUIRED steps
    for (let i = 0; i < requiredIndex; i++) {
      const step = ONBOARDING_STEPS[i];
      if (ONBOARDING_CONFIG[step].required && i > currentIndex) {
        res.status(403).json({
          message: 'Complete previous required steps first',
          currentStep,
          blockedAt: step,
        });
        return;
      }
    }

    // Strict mode
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
