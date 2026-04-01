import Profile from '../models/profile.model.js';
import User from '../models/users.model.js';
import { Request, Response } from 'express';
import { ONBOARDING_STEPS, ONBOARDING_CONFIG } from '../constants/onboarding.js';

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
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const currentStep = user.onboardingStep;

  // Determine the next step
  let nextStep = currentStep;
  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
  for (let i = currentIndex + 1; i < ONBOARDING_STEPS.length; i++) {
    const step = ONBOARDING_STEPS[i];
    if (ONBOARDING_CONFIG[step].required) {
      nextStep = step;
      break;
    }
  }

  res.json({
    currentStep,
    nextStep,
  });
};

// export const skipStep = async (req: Request, res: Response) => {
//   const userId = req.user?.id;
//   const stepParam = req.params.step;

//   if (!userId) return res.status(401).json({ message: 'Unauthorized' });

//   const step = stepParam as OnboardingStep;

//   if (!ONBOARDING_STEPS.includes(step)) {
//     return res.status(400).json({ message: 'Invalid step' });
//   }

//   if (ONBOARDING_CONFIG[step].required) {
//     return res.status(400).json({ message: 'Cannot skip required step' });
//   }

//   // find next required step
//   const currentIndex = ONBOARDING_STEPS.indexOf(step);
//   let nextStep: OnboardingStep = step;
//   for (let i = currentIndex + 1; i < ONBOARDING_STEPS.length; i++) {
//     const s = ONBOARDING_STEPS[i];
//     if (ONBOARDING_CONFIG[s].required) {
//       nextStep = s;
//       break;
//     }
//   }

//   await User.findByIdAndUpdate(userId, { onboardingStep: nextStep });

//   return res.json({ message: `Step ${step} skipped`, nextStep });
// };
