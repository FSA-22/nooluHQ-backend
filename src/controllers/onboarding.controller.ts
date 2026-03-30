import Profile from '../models/profile.model.js';
import User from '../models/users.model.js';

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
