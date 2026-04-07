import Profile from '../models/profile.model.js';
import User from '../models/users.model.js';
import { Request, Response } from 'express';
import { ONBOARDING_STEPS, ONBOARDING_CONFIG, OnboardingStep } from '../constants/onboarding.js';

export const createProfile = async (req: any, res: any) => {
  const { name, role } = req.body;

  const profile = await Profile.create({
    user: req.user.id,
    name,
    role,
  });

  await User.findByIdAndUpdate(req.user.id, {
    onboardingStep: 'workspace',
  });

  res.json({
    message: 'Profile created',
    profile,
  });
};

export const getOnboardingStatus = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const currentStep = user.onboardingStep as OnboardingStep;

  //  Validate step integrity (important)
  if (!currentStep || !ONBOARDING_STEPS.includes(currentStep)) {
    return res.status(400).json({
      message: 'Invalid onboarding state',
    });
  }

  //  Now safe
  let nextStep: OnboardingStep = currentStep;

  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);

  for (let i = currentIndex + 1; i < ONBOARDING_STEPS.length; i++) {
    const step = ONBOARDING_STEPS[i];

    if (!step) continue; // ✅ fixes TS2538

    const config = ONBOARDING_CONFIG[step];

    if (config?.required) {
      nextStep = step;
      break;
    }
  }

  return res.json({
    currentStep,
    nextStep,
  });
};
