import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Profile from '../models/profile.model.ts';
import User from '../models/users.model.ts';

export const createOrUpdateProfile = async (req: Request, res: Response): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log('req.user', req.user);

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { name, role, teamSize } = req.body;

    if (!name || !role || !teamSize) {
      return res.status(400).json({ message: 'Name, role, and teamSize are required' });
    }

    // Ensure the user exists
    const userExists = await User.findById(userId).session(session);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Upsert profile
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { name, role },
      { new: true, upsert: true, setDefaultsOnInsert: true, session },
    );

    // Create or update workspace with teamSize
    // const workspace = await Workspace.findOneAndUpdate(
    //   { owner: userId },
    //   { name, teamSize, owner: userId },
    //   { new: true, upsert: true, setDefaultsOnInsert: true, session },
    // );

    // Optional: advance onboarding step to next (e.g., 'workspace')
    if (userExists.onboardingStep === 'profile') {
      userExists.onboardingStep = 'workspace';
      await userExists.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: 'Profile and workspace saved successfully',
      profile,
      // workspace,
      nextStep: 'workspace',
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Profile error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
