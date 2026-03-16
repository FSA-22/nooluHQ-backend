import { Response, NextFunction } from 'express';
import { OnboardingStep } from '../enums/onboarding.enum.ts';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest.ts';

export const requireStep = (step: OnboardingStep) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request.' });
      return;
    }

    if (user.onboardingStep !== step) {
      res.status(403).json({
        message: `Access denied. Current step is '${user.onboardingStep}', required step is '${step}'.`,
      });
      return;
    }

    next();
  };
};
