import Profile from '../models/profile.model.js';
import User from '../models/users.model.js';
import { OnboardingStep } from '../enums/onboarding.enum.js';

export const createProfile = async (req: any, res: any) => {
  const { firstName, lastName, phone } = req.body;

  const profile = await Profile.create({
    user: req.user.id,
    firstName,
    lastName,
    phone,
  });

  await User.findByIdAndUpdate(req.user.id, {
    onboardingStep: OnboardingStep.WORKSPACE,
  });

  res.json({
    message: 'Profile created',
    profile,
  });
};
